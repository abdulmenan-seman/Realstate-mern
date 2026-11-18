import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoute from "./routes/User.route.js";
import authRoute from "./routes/auth.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory first, fallback to root
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security and utility middlewares
const clientUrls = [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, curl, Postman)
            if (!origin || clientUrls.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(null, true); // Permissive for local development
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());
app.use(cookieParser());

// Base health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Mount Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/user", userRoute); // Preserves backward compatibility

// Catch-all for unhandled routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: `API endpoint '${req.originalUrl}' not found.`,
    });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errors = err.errors || [];

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
        ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;

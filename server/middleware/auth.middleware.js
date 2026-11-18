import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { errorHandler } from "../utils/error.js";

export const verifyToken = async (req, res, next) => {
    try {
        let token = req.cookies?.access_token;

        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return next(errorHandler(401, "Authentication required. No token provided."));
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return next(errorHandler(401, "Invalid or expired token. Please sign in again."));
        }

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return next(errorHandler(401, "User belonging to this token no longer exists."));
        }

        if (user.accountStatus === "suspended") {
            return next(
                errorHandler(403, "Your account has been suspended. Please contact support.")
            );
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.access_token;

        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select("-password");
                if (user && user.accountStatus !== "suspended") {
                    req.user = user;
                }
            } catch (err) {
                // Ignore token decode errors for optional auth
            }
        }
        next();
    } catch (error) {
        next();
    }
};

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL || "admin@realestatehub.com";
        const adminUsername = process.env.ADMIN_USERNAME || "superadmin";
        const adminPassword = process.env.ADMIN_PASSWORD || "Admin123456!";
        const adminFullName = "System Administrator";

        let admin = await User.findOne({ email: adminEmail.toLowerCase() });

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        if (admin) {
            admin.role = "admin";
            admin.accountStatus = "active";
            admin.password = hashedPassword;
            admin.username = adminUsername;
            admin.fullName = adminFullName;
            await admin.save();
            console.log("\n==================================================");
            console.log("       EXISTING ADMIN CREDENTIALS UPDATED         ");
            console.log("==================================================");
        } else {
            // Also check if username exists
            const existingUsername = await User.findOne({ username: adminUsername });
            if (existingUsername) {
                existingUsername.role = "admin";
                existingUsername.accountStatus = "active";
                existingUsername.password = hashedPassword;
                existingUsername.email = adminEmail.toLowerCase();
                await existingUsername.save();
                console.log("\n==================================================");
                console.log("       EXISTING USER ELEVATED TO ADMIN            ");
                console.log("==================================================");
            } else {
                admin = new User({
                    username: adminUsername,
                    fullName: adminFullName,
                    email: adminEmail.toLowerCase(),
                    password: hashedPassword,
                    role: "admin",
                    accountStatus: "active",
                    phone: "+1234567890",
                });
                await admin.save();
                console.log("\n==================================================");
                console.log("        NEW ADMIN ACCOUNT CREATED SUCCESSFULLY     ");
                console.log("==================================================");
            }
        }

        console.log(`\nEmail:    ${adminEmail}`);
        console.log(`Username: ${adminUsername}`);
        console.log(`Password: ${adminPassword}`);
        console.log(`Role:     admin`);
        console.log(`Status:   active`);
        console.log("\n==================================================");
        console.log("You can now sign in at http://localhost:5173/signIn");
        console.log("==================================================\n");

        process.exit(0);
    } catch (err) {
        console.error("Failed to seed admin:", err.message);
        process.exit(1);
    }
};

seedAdmin();

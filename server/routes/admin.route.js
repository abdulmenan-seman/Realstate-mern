import express from "express";
import {
    getDashboardStats,
    getUsers,
    getUserById,
    updateUserStatus,
    updateUserRole,
    getAllProperties,
    getPendingProperties,
    reviewProperty,
} from "../controllers/admin.controller.js";
import {
    getAllReports,
    updateReportStatus,
} from "../controllers/report.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorize.middleware.js";

const router = express.Router();

// All admin routes strictly require authentication and admin role
router.use(verifyToken, authorizeRoles("admin"));

// 1. Dashboard statistics
router.get("/dashboard/stats", getDashboardStats);

// 2. User management
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);

// 3. Property review queue & moderation
router.get("/properties", getAllProperties);
router.get("/properties/pending", getPendingProperties);
router.patch("/properties/:id/review", reviewProperty);

// 4. Report moderation
router.get("/reports", getAllReports);
router.patch("/reports/:id", updateReportStatus);

export default router;

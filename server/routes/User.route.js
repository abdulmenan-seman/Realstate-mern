import express from "express";
import {
    test,
    getProfile,
    updateProfile,
    getPublicProfile,
} from "../controllers/User.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorize.middleware.js";
import { validateProfileUpdate } from "../middleware/validator.middleware.js";

const router = express.Router();

router.get("/test", test);
router.get("/me", verifyToken, getProfile);
router.patch("/me", verifyToken, validateProfileUpdate, updateProfile);
router.put("/me", verifyToken, validateProfileUpdate, updateProfile);

// Role authorization verification endpoints
router.get("/owner-only", verifyToken, authorizeRoles("owner", "admin"), (req, res) => {
    res.status(200).json({ success: true, message: "Welcome Owner/Admin" });
});

router.get("/admin-only", verifyToken, authorizeRoles("admin"), (req, res) => {
    res.status(200).json({ success: true, message: "Welcome Admin" });
});

router.get("/:id", getPublicProfile);

export default router;

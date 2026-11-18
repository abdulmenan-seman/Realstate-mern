import express from "express";
import {
    getAllProperties,
    getPendingProperties,
    reviewProperty,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorize.middleware.js";

const router = express.Router();

// All admin routes require admin role
router.use(verifyToken, authorizeRoles("admin"));

router.get("/properties", getAllProperties);
router.get("/properties/pending", getPendingProperties);
router.patch("/properties/:id/review", reviewProperty);

export default router;

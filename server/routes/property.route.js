import express from "express";
import {
    createProperty,
    getMyProperties,
    getPropertyById,
    updateProperty,
    updateAvailability,
    deleteProperty,
    getPublicProperties,
    uploadImages,
    getRelatedProperties,
} from "../controllers/property.controller.js";
import { verifyToken, optionalAuth } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorize.middleware.js";
import { uploadPropertyImages } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public property discovery
router.get("/", getPublicProperties);

// Owner / Admin listing management
router.get("/mine", verifyToken, authorizeRoles("owner", "admin"), getMyProperties);

router.post(
    "/upload-images",
    verifyToken,
    authorizeRoles("owner", "admin"),
    uploadPropertyImages,
    uploadImages
);

router.post("/", verifyToken, authorizeRoles("owner", "admin"), createProperty);

// Single property retrieval with optional auth
router.get("/:id/related", getRelatedProperties);
router.get("/:id", optionalAuth, getPropertyById);

// Owner modification endpoints
router.patch("/:id", verifyToken, authorizeRoles("owner", "admin"), updateProperty);
router.patch("/:id/availability", verifyToken, authorizeRoles("owner", "admin"), updateAvailability);
router.delete("/:id", verifyToken, authorizeRoles("owner", "admin"), deleteProperty);

export default router;

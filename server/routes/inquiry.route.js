import express from "express";
import {
    createInquiry,
    getMyInquiries,
    getReceivedInquiries,
    getInquiryById,
    updateInquiryStatus,
} from "../controllers/inquiry.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorize.middleware.js";

const router = express.Router();

router.use(verifyToken);

// Customer endpoints
router.post("/", createInquiry);
router.get("/mine", getMyInquiries);

// Owner endpoints
router.get("/received", authorizeRoles("owner", "admin"), getReceivedInquiries);
router.patch("/:id/status", authorizeRoles("owner", "admin"), updateInquiryStatus);

// Shared detail endpoint
router.get("/:id", getInquiryById);

export default router;

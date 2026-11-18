import express from "express";
import {
    createAppointment,
    getMyAppointments,
    getReceivedAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    cancelAppointment,
} from "../controllers/appointment.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorize.middleware.js";

const router = express.Router();

router.use(verifyToken);

// Customer endpoints
router.post("/", createAppointment);
router.get("/mine", getMyAppointments);
router.patch("/:id/cancel", cancelAppointment);

// Owner endpoints
router.get("/received", authorizeRoles("owner", "admin"), getReceivedAppointments);
router.patch("/:id/status", authorizeRoles("owner", "admin"), updateAppointmentStatus);

// Shared detail endpoint
router.get("/:id", getAppointmentById);

export default router;

import express from "express";
import {
    createReport,
    getMyReports,
} from "../controllers/report.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createReport);
router.get("/mine", getMyReports);

export default router;

import express from "express";
import {
    signup,
    signin,
    google,
    logout,
    getMe,
} from "../controllers/auth.controller.js";
import {
    validateSignup,
    validateSignin,
} from "../middleware/validator.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", validateSignup, signup);
router.post("/signin", validateSignin, signin);
router.post("/google", google);
router.post("/logout", logout);
router.get("/me", verifyToken, getMe);

export default router;

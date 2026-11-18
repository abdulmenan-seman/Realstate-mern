import User from "../models/User.model.js";
import Favorite from "../models/Favorite.model.js";
import Inquiry from "../models/Inquiry.model.js";
import Appointment from "../models/Appointment.model.js";
import PropertyReport from "../models/PropertyReport.model.js";
import { errorHandler } from "../utils/error.js";
import bcrypt from "bcryptjs";

export const test = (req, res) => {
    res.json({
        success: true,
        message: "User controller is operational",
    });
};

export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }
        const safeUser = user.toJSON();
        res.status(200).json({
            success: true,
            user: safeUser,
            ...safeUser,
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }

        // Check if username is being changed and is already taken
        if (req.body.username && req.body.username.trim() !== user.username) {
            const trimmedUsername = req.body.username.trim();
            const existing = await User.findOne({ username: trimmedUsername });
            if (existing) {
                return next(errorHandler(409, "Username already in use"));
            }
            user.username = trimmedUsername;
        }

        if (req.body.fullName !== undefined) {
            user.fullName = req.body.fullName.trim();
        }

        if (req.body.phone !== undefined) {
            user.phone = req.body.phone.trim();
        }

        if (req.body.avatar !== undefined) {
            user.avatar = req.body.avatar;
        }

        // If password is being updated, hash it
        if (req.body.password) {
            user.password = await bcrypt.hash(req.body.password, 10);
        }

        // CRITICAL SECURITY ENFORCEMENT:
        // Do NOT allow user to update their own role or accountStatus
        // (Even if req.body.role or req.body.accountStatus was passed, it is ignored here)

        await user.save();
        const safeUser = user.toJSON();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: safeUser,
            ...safeUser,
        });
    } catch (error) {
        next(error);
    }
};

export const getPublicProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select(
            "_id fullName username avatar role createdAt"
        );
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }
        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        next(error);
    }
};

// Customer dashboard aggregated stats
export const getCustomerStats = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;

        const [
            totalFavorites,
            totalInquiries,
            totalAppointments,
            pendingAppointments,
            totalReports,
        ] = await Promise.all([
            Favorite.countDocuments({ user: userId }),
            Inquiry.countDocuments({ customer: userId }),
            Appointment.countDocuments({ customer: userId }),
            Appointment.countDocuments({ customer: userId, status: "pending" }),
            PropertyReport.countDocuments({ reporter: userId }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                favorites: totalFavorites,
                inquiries: totalInquiries,
                appointments: {
                    total: totalAppointments,
                    pending: pendingAppointments,
                },
                reports: totalReports,
            },
        });
    } catch (error) {
        next(error);
    }
};

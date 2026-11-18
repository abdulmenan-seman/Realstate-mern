import Property from "../models/Property.model.js";
import User from "../models/User.model.js";
import PropertyReport from "../models/PropertyReport.model.js";
import Inquiry from "../models/Inquiry.model.js";
import Appointment from "../models/Appointment.model.js";
import { errorHandler } from "../utils/error.js";

// ==========================================
// 1. ADMIN DASHBOARD AGGREGATED STATISTICS
// ==========================================
export const getDashboardStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalCustomers,
            totalOwners,
            totalAdmins,
            suspendedUsers,
            totalProperties,
            pendingProperties,
            approvedProperties,
            rejectedProperties,
            availableProperties,
            rentedProperties,
            soldProperties,
            openReports,
            totalReports,
            recentProperties,
            recentUsers,
            recentReports,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "customer" }),
            User.countDocuments({ role: "owner" }),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ accountStatus: "suspended" }),
            Property.countDocuments({ isArchived: false }),
            Property.countDocuments({ approvalStatus: "pending", isArchived: false }),
            Property.countDocuments({ approvalStatus: "approved", isArchived: false }),
            Property.countDocuments({ approvalStatus: "rejected", isArchived: false }),
            Property.countDocuments({
                approvalStatus: "approved",
                availabilityStatus: "available",
                isArchived: false,
            }),
            Property.countDocuments({ availabilityStatus: "rented", isArchived: false }),
            Property.countDocuments({ availabilityStatus: "sold", isArchived: false }),
            PropertyReport.countDocuments({ status: "open" }),
            PropertyReport.countDocuments(),
            Property.find({ isArchived: false })
                .sort({ createdAt: -1 })
                .limit(5)
                .select("title price currency location propertyType listingType approvalStatus availabilityStatus images createdAt")
                .populate("owner", "fullName username email avatar"),
            User.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select("_id fullName username email role accountStatus avatar createdAt"),
            PropertyReport.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("property", "title location")
                .populate("reporter", "fullName username email"),
        ]);

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    customers: totalCustomers,
                    owners: totalOwners,
                    admins: totalAdmins,
                    suspended: suspendedUsers,
                },
                properties: {
                    total: totalProperties,
                    pending: pendingProperties,
                    approved: approvedProperties,
                    rejected: rejectedProperties,
                    available: availableProperties,
                    rented: rentedProperties,
                    sold: soldProperties,
                },
                reports: {
                    open: openReports,
                    total: totalReports,
                },
                recentProperties,
                recentUsers,
                recentReports,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. USER MANAGEMENT (Admin only)
// ==========================================

// List users with search, role filter, status filter, and pagination
export const getUsers = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.role && req.query.role !== "all") {
            filter.role = req.query.role;
        }

        if (req.query.accountStatus && req.query.accountStatus !== "all") {
            filter.accountStatus = req.query.accountStatus;
        }

        if (req.query.search) {
            const searchRegex = { $regex: req.query.search.trim(), $options: "i" };
            filter.$or = [
                { username: searchRegex },
                { email: searchRegex },
                { fullName: searchRegex },
                { phone: searchRegex },
            ];
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-password");

        res.status(200).json({
            success: true,
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Retrieve single user details with associated metrics
export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }

        const [listingCount, inquiryCount, appointmentCount] = await Promise.all([
            Property.countDocuments({ owner: user._id, isArchived: false }),
            Inquiry.countDocuments({
                $or: [{ customer: user._id }, { owner: user._id }],
            }),
            Appointment.countDocuments({
                $or: [{ customer: user._id }, { owner: user._id }],
            }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                user,
                metrics: {
                    listings: listingCount,
                    inquiries: inquiryCount,
                    appointments: appointmentCount,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// Suspend or reactivate user (with last-admin protection)
export const updateUserStatus = async (req, res, next) => {
    try {
        const { accountStatus } = req.body;

        if (!["active", "suspended"].includes(accountStatus)) {
            return next(
                errorHandler(400, "Invalid status. Must be 'active' or 'suspended'.")
            );
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return next(errorHandler(404, "User not found"));
        }

        // CRITICAL BUSINESS RULE: Prevent suspending the last active administrator
        if (targetUser.role === "admin" && accountStatus === "suspended") {
            const activeAdminCount = await User.countDocuments({
                role: "admin",
                accountStatus: "active",
            });

            if (activeAdminCount <= 1) {
                return next(
                    errorHandler(
                        400,
                        "Action denied: Cannot suspend the last active system administrator."
                    )
                );
            }
        }

        targetUser.accountStatus = accountStatus;
        await targetUser.save();

        res.status(200).json({
            success: true,
            message: `User account has been ${accountStatus === "active" ? "reactivated" : "suspended"}.`,
            user: targetUser.toJSON(),
        });
    } catch (error) {
        next(error);
    }
};

// Change user role (with last-admin demotion protection)
export const updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!["customer", "owner", "admin"].includes(role)) {
            return next(
                errorHandler(400, "Invalid role. Must be 'customer', 'owner', or 'admin'.")
            );
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return next(errorHandler(404, "User not found"));
        }

        // CRITICAL BUSINESS RULE: Prevent demoting the last active administrator
        if (targetUser.role === "admin" && role !== "admin") {
            const activeAdminCount = await User.countDocuments({
                role: "admin",
                accountStatus: "active",
            });

            if (activeAdminCount <= 1) {
                return next(
                    errorHandler(
                        400,
                        "Action denied: Cannot demote the last active system administrator."
                    )
                );
            }
        }

        targetUser.role = role;
        await targetUser.save();

        res.status(200).json({
            success: true,
            message: `User role has been updated to '${role}'.`,
            user: targetUser.toJSON(),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. PROPERTY APPROVAL QUEUE & MANAGEMENT
// ==========================================

// List all properties with admin controls
export const getAllProperties = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
        const skip = (page - 1) * limit;

        const filter = { isArchived: false };

        if (req.query.approvalStatus && req.query.approvalStatus !== "all") {
            filter.approvalStatus = req.query.approvalStatus;
        }

        if (req.query.availabilityStatus && req.query.availabilityStatus !== "all") {
            filter.availabilityStatus = req.query.availabilityStatus;
        }

        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: "i" } },
                { "location.city": { $regex: req.query.search, $options: "i" } },
            ];
        }

        const total = await Property.countDocuments(filter);
        const properties = await Property.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("owner", "fullName username email phone avatar")
            .populate("reviewedBy", "fullName username");

        res.status(200).json({
            success: true,
            data: properties,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Retrieve pending properties awaiting review
export const getPendingProperties = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
        const skip = (page - 1) * limit;

        const filter = {
            approvalStatus: "pending",
            isArchived: false,
        };

        const total = await Property.countDocuments(filter);
        const properties = await Property.find(filter)
            .sort({ createdAt: 1 }) // Oldest pending first for fair review queue
            .skip(skip)
            .limit(limit)
            .populate("owner", "fullName username email phone avatar");

        res.status(200).json({
            success: true,
            data: properties,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Review property: approve or reject with mandatory reason
export const reviewProperty = async (req, res, next) => {
    try {
        const { action, rejectionReason } = req.body;

        if (!["approve", "reject"].includes(action)) {
            return next(errorHandler(400, "Review action must be 'approve' or 'reject'."));
        }

        // CRITICAL BUSINESS RULE 5:
        // A rejection reason is MANDATORY when rejecting a property listing
        if (action === "reject") {
            if (!rejectionReason || rejectionReason.trim().length < 5) {
                return next(
                    errorHandler(
                        400,
                        "A clear rejection reason (minimum 5 characters) is required when rejecting a listing."
                    )
                );
            }
        }

        const property = await Property.findOne({
            _id: req.params.id,
            isArchived: false,
        });

        if (!property) {
            return next(errorHandler(404, "Property listing not found."));
        }

        if (action === "approve") {
            property.approvalStatus = "approved";
            property.rejectionReason = "";
        } else {
            property.approvalStatus = "rejected";
            property.rejectionReason = rejectionReason.trim();
        }

        property.reviewedBy = req.user._id;
        property.reviewedAt = new Date();

        await property.save();

        res.status(200).json({
            success: true,
            message: `Property listing successfully ${property.approvalStatus}.`,
            property,
        });
    } catch (error) {
        next(error);
    }
};

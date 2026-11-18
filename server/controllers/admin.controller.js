import Property from "../models/Property.model.js";
import { errorHandler } from "../utils/error.js";

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

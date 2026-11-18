import Inquiry from "../models/Inquiry.model.js";
import Property from "../models/Property.model.js";
import { errorHandler } from "../utils/error.js";

// Customer submits an inquiry for an approved property
export const createInquiry = async (req, res, next) => {
    try {
        const { propertyId, message, contactPhone } = req.body;

        if (!propertyId || !message || message.trim().length < 5) {
            return next(
                errorHandler(400, "Property ID and a message (minimum 5 characters) are required.")
            );
        }

        const property = await Property.findOne({
            _id: propertyId,
            isArchived: false,
        });

        if (!property) {
            return next(errorHandler(404, "Property listing not found."));
        }

        // Business rule: Only approved and available properties can receive inquiries
        if (
            property.approvalStatus !== "approved" ||
            property.availabilityStatus !== "available"
        ) {
            return next(
                errorHandler(
                    400,
                    "Inquiries can only be submitted for approved and available properties."
                )
            );
        }

        // Business rule: Customer cannot inquire on their own property
        if (property.owner.toString() === req.user._id.toString()) {
            return next(errorHandler(400, "You cannot submit an inquiry for your own property."));
        }

        const newInquiry = new Inquiry({
            property: property._id,
            customer: req.user._id,
            owner: property.owner, // Derive owner securely from property record
            message: message.trim(),
            contactPhone: contactPhone?.trim() || "",
            status: "new",
        });

        await newInquiry.save();

        res.status(201).json({
            success: true,
            message: "Your inquiry has been sent to the property owner.",
            inquiry: newInquiry,
        });
    } catch (error) {
        next(error);
    }
};

// Customer retrieves their own submitted inquiries
export const getMyInquiries = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = { customer: req.user._id };

        const total = await Inquiry.countDocuments(filter);
        const inquiries = await Inquiry.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("property", "title location price currency images listingType propertyType")
            .populate("owner", "fullName username email phone avatar");

        res.status(200).json({
            success: true,
            data: inquiries,
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

// Owner retrieves inquiries received for their properties
export const getReceivedInquiries = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = { owner: req.user._id };

        if (req.query.status && req.query.status !== "all") {
            filter.status = req.query.status;
        }

        const total = await Inquiry.countDocuments(filter);
        const inquiries = await Inquiry.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("property", "title location price currency images")
            .populate("customer", "fullName username email phone avatar");

        res.status(200).json({
            success: true,
            data: inquiries,
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

// Get single inquiry details (accessible by inquiry customer or owner)
export const getInquiryById = async (req, res, next) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate("property", "title location price currency images")
            .populate("customer", "fullName username email phone avatar")
            .populate("owner", "fullName username email phone avatar");

        if (!inquiry) {
            return next(errorHandler(404, "Inquiry not found."));
        }

        const isCustomer = inquiry.customer._id.toString() === req.user._id.toString();
        const isOwner = inquiry.owner._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isCustomer && !isOwner && !isAdmin) {
            return next(errorHandler(403, "You do not have permission to view this inquiry."));
        }

        // If the owner opens a new inquiry, mark it as read automatically
        if (isOwner && inquiry.status === "new") {
            inquiry.status = "read";
            await inquiry.save();
        }

        res.status(200).json({
            success: true,
            inquiry,
        });
    } catch (error) {
        next(error);
    }
};

// Owner responds to inquiry or updates status
export const updateInquiryStatus = async (req, res, next) => {
    try {
        const { status, ownerResponse } = req.body;

        const inquiry = await Inquiry.findById(req.params.id);
        if (!inquiry) {
            return next(errorHandler(404, "Inquiry not found."));
        }

        // Authorization check: Only property owner (or admin) can respond
        const isOwner = inquiry.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You do not have permission to respond to this inquiry."));
        }

        if (ownerResponse && ownerResponse.trim()) {
            inquiry.ownerResponse = ownerResponse.trim();
            inquiry.status = "responded";
            inquiry.respondedAt = new Date();
        } else if (status && ["read", "closed"].includes(status)) {
            inquiry.status = status;
        }

        await inquiry.save();

        res.status(200).json({
            success: true,
            message: "Inquiry status updated successfully.",
            inquiry,
        });
    } catch (error) {
        next(error);
    }
};

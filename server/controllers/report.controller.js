import PropertyReport from "../models/PropertyReport.model.js";
import Property from "../models/Property.model.js";
import { errorHandler } from "../utils/error.js";

// Customer submits a report on a property listing
export const createReport = async (req, res, next) => {
    try {
        const { propertyId, reason, description } = req.body;

        const allowedReasons = [
            "suspicious_listing",
            "incorrect_information",
            "duplicate_listing",
            "inappropriate_content",
            "other",
        ];

        if (!propertyId || !reason || !allowedReasons.includes(reason)) {
            return next(
                errorHandler(400, "Property ID and a valid report reason are required.")
            );
        }

        const property = await Property.findOne({
            _id: propertyId,
            isArchived: false,
        });

        if (!property) {
            return next(errorHandler(404, "Property listing not found."));
        }

        // Business rule: Prevent duplicate open reports by the same user for the same property
        const existingOpen = await PropertyReport.findOne({
            property: propertyId,
            reporter: req.user._id,
            status: "open",
        });

        if (existingOpen) {
            return next(
                errorHandler(
                    409,
                    "You have already submitted an active report for this listing. Our team is currently reviewing it."
                )
            );
        }

        const newReport = new PropertyReport({
            property: property._id,
            reporter: req.user._id,
            reason,
            description: description?.trim() || "",
            status: "open",
        });

        await newReport.save();

        res.status(201).json({
            success: true,
            message: "Report submitted successfully to the moderation team.",
            report: newReport,
        });
    } catch (error) {
        next(error);
    }
};

// Customer retrieves their own submitted reports
export const getMyReports = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = { reporter: req.user._id };

        const total = await PropertyReport.countDocuments(filter);
        const reports = await PropertyReport.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("property", "title location price currency images approvalStatus availabilityStatus");

        res.status(200).json({
            success: true,
            data: reports,
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

// Admin retrieves all property reports with search, reason, and status filters
export const getAllReports = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status && req.query.status !== "all") {
            filter.status = req.query.status;
        }

        if (req.query.reason && req.query.reason !== "all") {
            filter.reason = req.query.reason;
        }

        if (req.query.search) {
            const searchRegex = { $regex: req.query.search.trim(), $options: "i" };
            const matchingProperties = await Property.find({ title: searchRegex }).select("_id");
            const propertyIds = matchingProperties.map((p) => p._id);

            filter.$or = [
                { description: searchRegex },
                { property: { $in: propertyIds } },
            ];
        }

        const total = await PropertyReport.countDocuments(filter);
        const reports = await PropertyReport.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("property", "title location price currency images owner approvalStatus availabilityStatus isArchived")
            .populate("reporter", "fullName username email")
            .populate("reviewedBy", "fullName username");

        res.status(200).json({
            success: true,
            data: reports,
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

// Admin updates report status and optionally moderates the offending property
export const updateReportStatus = async (req, res, next) => {
    try {
        const { status, adminNote, actionOnProperty } = req.body;

        if (!["reviewed", "resolved", "dismissed"].includes(status)) {
            return next(
                errorHandler(400, "Invalid status. Must be 'reviewed', 'resolved', or 'dismissed'.")
            );
        }

        const report = await PropertyReport.findById(req.params.id);
        if (!report) {
            return next(errorHandler(404, "Report not found."));
        }

        report.status = status;
        if (adminNote !== undefined) {
            report.adminNote = adminNote.trim();
        }
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();

        await report.save();

        // Optional property moderation action if requested
        let propertyMessage = "";
        if (actionOnProperty && ["archive", "reject"].includes(actionOnProperty)) {
            const property = await Property.findById(report.property);
            if (property) {
                if (actionOnProperty === "archive") {
                    property.isArchived = true;
                    await property.save();
                    propertyMessage = " Property has been archived.";
                } else if (actionOnProperty === "reject") {
                    property.approvalStatus = "rejected";
                    property.rejectionReason = adminNote || "Listing rejected due to verified user report.";
                    property.reviewedBy = req.user._id;
                    property.reviewedAt = new Date();
                    await property.save();
                    propertyMessage = " Property has been marked as rejected.";
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Report marked as '${status}'.${propertyMessage}`,
            report,
        });
    } catch (error) {
        next(error);
    }
};

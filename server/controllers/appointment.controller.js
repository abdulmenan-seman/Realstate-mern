import Appointment from "../models/Appointment.model.js";
import Property from "../models/Property.model.js";
import { errorHandler } from "../utils/error.js";

// Customer requests a viewing appointment
export const createAppointment = async (req, res, next) => {
    try {
        const { propertyId, requestedDateTime, note } = req.body;

        if (!propertyId || !requestedDateTime) {
            return next(
                errorHandler(400, "Property ID and requested date/time are required.")
            );
        }

        const appointmentDate = new Date(requestedDateTime);

        if (isNaN(appointmentDate.getTime())) {
            return next(errorHandler(400, "Invalid date and time format provided."));
        }

        // CRITICAL BUSINESS RULE 1:
        // Requested date must be in the future
        if (appointmentDate.getTime() <= Date.now()) {
            return next(
                errorHandler(400, "Viewing appointment date and time must be in the future.")
            );
        }

        const property = await Property.findOne({
            _id: propertyId,
            isArchived: false,
        });

        if (!property) {
            return next(errorHandler(404, "Property listing not found."));
        }

        // Business rule: Only approved and available properties can receive viewing requests
        if (
            property.approvalStatus !== "approved" ||
            property.availabilityStatus !== "available"
        ) {
            return next(
                errorHandler(
                    400,
                    "Viewing appointments can only be requested for approved and available properties."
                )
            );
        }

        // Business rule: Customer cannot book appointment on their own property
        if (property.owner.toString() === req.user._id.toString()) {
            return next(
                errorHandler(400, "You cannot book a viewing appointment on your own property.")
            );
        }

        // Business rule 8: Avoid duplicate active requests for the exact same slot
        const existingActive = await Appointment.findOne({
            property: property._id,
            customer: req.user._id,
            requestedDateTime: appointmentDate,
            status: { $in: ["pending", "accepted"] },
        });

        if (existingActive) {
            return next(
                errorHandler(
                    409,
                    "You already have an active viewing appointment requested for this time slot."
                )
            );
        }

        const newAppointment = new Appointment({
            property: property._id,
            customer: req.user._id,
            owner: property.owner, // Securely derive from property
            requestedDateTime: appointmentDate,
            note: note?.trim() || "",
            status: "pending",
        });

        await newAppointment.save();

        res.status(201).json({
            success: true,
            message: "Viewing appointment requested successfully.",
            appointment: newAppointment,
        });
    } catch (error) {
        next(error);
    }
};

// Customer retrieves their own appointment requests
export const getMyAppointments = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = { customer: req.user._id };

        const total = await Appointment.countDocuments(filter);
        const appointments = await Appointment.find(filter)
            .sort({ requestedDateTime: 1 })
            .skip(skip)
            .limit(limit)
            .populate("property", "title location price currency images")
            .populate("owner", "fullName username email phone avatar");

        res.status(200).json({
            success: true,
            data: appointments,
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

// Owner retrieves appointment requests for their properties
export const getReceivedAppointments = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = { owner: req.user._id };

        if (req.query.status && req.query.status !== "all") {
            filter.status = req.query.status;
        }

        const total = await Appointment.countDocuments(filter);
        const appointments = await Appointment.find(filter)
            .sort({ requestedDateTime: 1 })
            .skip(skip)
            .limit(limit)
            .populate("property", "title location price currency images")
            .populate("customer", "fullName username email phone avatar");

        res.status(200).json({
            success: true,
            data: appointments,
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

// Get single appointment details
export const getAppointmentById = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate("property", "title location price currency images")
            .populate("customer", "fullName username email phone avatar")
            .populate("owner", "fullName username email phone avatar");

        if (!appointment) {
            return next(errorHandler(404, "Appointment not found."));
        }

        const isCustomer = appointment.customer._id.toString() === req.user._id.toString();
        const isOwner = appointment.owner._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isCustomer && !isOwner && !isAdmin) {
            return next(errorHandler(403, "You do not have permission to view this appointment."));
        }

        res.status(200).json({
            success: true,
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

// Owner accepts, rejects, or marks completed
export const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { status, ownerNote } = req.body;

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return next(errorHandler(404, "Appointment not found."));
        }

        // Authorization check: Only property owner (or admin) can manage appointments
        const isOwner = appointment.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return next(
                errorHandler(403, "You do not have permission to manage this appointment.")
            );
        }

        // State transition validation
        const currentStatus = appointment.status;
        const validTransitions = {
            pending: ["accepted", "rejected"],
            accepted: ["completed", "rejected"],
            rejected: [],
            cancelled: [],
            completed: [],
        };

        if (!validTransitions[currentStatus]?.includes(status)) {
            return next(
                errorHandler(
                    400,
                    `Cannot change appointment status from '${currentStatus}' to '${status}'.`
                )
            );
        }

        appointment.status = status;
        if (ownerNote !== undefined) {
            appointment.ownerNote = ownerNote.trim();
        }
        appointment.actionAt = new Date();

        await appointment.save();

        res.status(200).json({
            success: true,
            message: `Appointment successfully marked as '${status}'.`,
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

// Customer cancels their own pending or accepted appointment
export const cancelAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return next(errorHandler(404, "Appointment not found."));
        }

        // Only the customer who requested the appointment can cancel it
        if (appointment.customer.toString() !== req.user._id.toString()) {
            return next(
                errorHandler(403, "You can only cancel your own appointment requests.")
            );
        }

        if (!["pending", "accepted"].includes(appointment.status)) {
            return next(
                errorHandler(
                    400,
                    `Cannot cancel appointment with status '${appointment.status}'.`
                )
            );
        }

        appointment.status = "cancelled";
        appointment.actionAt = new Date();
        await appointment.save();

        res.status(200).json({
            success: true,
            message: "Viewing appointment cancelled successfully.",
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

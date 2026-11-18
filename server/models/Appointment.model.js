import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: [true, "Property reference is required"],
            index: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Customer reference is required"],
            index: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Owner reference is required"],
            index: true,
        },
        requestedDateTime: {
            type: Date,
            required: [true, "Viewing appointment date and time are required"],
            index: true,
        },
        note: {
            type: String,
            trim: true,
            maxlength: [500, "Note cannot exceed 500 characters"],
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
            default: "pending",
            index: true,
        },
        ownerNote: {
            type: String,
            trim: true,
            maxlength: [500, "Owner note cannot exceed 500 characters"],
            default: "",
        },
        actionAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

appointmentSchema.index({ owner: 1, status: 1, requestedDateTime: 1 });
appointmentSchema.index({ customer: 1, createdAt: -1 });
appointmentSchema.index({ property: 1, customer: 1, requestedDateTime: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;

import mongoose from "mongoose";

const propertyReportSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: [true, "Reported property reference is required"],
            index: true,
        },
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Reporter reference is required"],
            index: true,
        },
        reason: {
            type: String,
            required: [true, "Report reason is required"],
            enum: {
                values: [
                    "suspicious_listing",
                    "incorrect_information",
                    "duplicate_listing",
                    "inappropriate_content",
                    "other",
                ],
                message: "{VALUE} is not a valid report reason",
            },
            index: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, "Description cannot exceed 1000 characters"],
            default: "",
        },
        status: {
            type: String,
            enum: ["open", "reviewed", "resolved", "dismissed"],
            default: "open",
            index: true,
        },
        adminNote: {
            type: String,
            trim: true,
            maxlength: [500, "Admin note cannot exceed 500 characters"],
            default: "",
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

propertyReportSchema.index({ status: 1, createdAt: -1 });
propertyReportSchema.index({ property: 1, reporter: 1, status: 1 });

const PropertyReport = mongoose.model("PropertyReport", propertyReportSchema);

export default PropertyReport;

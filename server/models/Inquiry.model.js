import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
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
        message: {
            type: String,
            required: [true, "Inquiry message is required"],
            trim: true,
            maxlength: [1000, "Message cannot exceed 1000 characters"],
        },
        contactPhone: {
            type: String,
            trim: true,
            default: "",
        },
        status: {
            type: String,
            enum: ["new", "read", "responded", "closed"],
            default: "new",
            index: true,
        },
        ownerResponse: {
            type: String,
            trim: true,
            default: "",
        },
        respondedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

inquirySchema.index({ owner: 1, status: 1, createdAt: -1 });
inquirySchema.index({ customer: 1, createdAt: -1 });
inquirySchema.index({ property: 1, customer: 1 });

const Inquiry = mongoose.model("Inquiry", inquirySchema);

export default Inquiry;

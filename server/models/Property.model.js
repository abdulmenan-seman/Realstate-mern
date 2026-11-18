import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
    {
        publicId: {
            type: String,
            required: true,
        },
        secureUrl: {
            type: String,
            required: true,
        },
        width: {
            type: Number,
            default: null,
        },
        height: {
            type: Number,
            default: null,
        },
        isCover: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

const propertySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Property title is required"],
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
        },
        description: {
            type: String,
            required: [true, "Property description is required"],
            trim: true,
        },
        propertyType: {
            type: String,
            required: [true, "Property type is required"],
            enum: {
                values: ["house", "apartment", "villa", "land", "commercial"],
                message: "{VALUE} is not a valid property type",
            },
        },
        listingType: {
            type: String,
            required: [true, "Listing type is required"],
            enum: {
                values: ["sale", "rent"],
                message: "{VALUE} is not a valid listing type",
            },
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        currency: {
            type: String,
            default: "USD",
            uppercase: true,
            trim: true,
        },
        location: {
            city: {
                type: String,
                required: [true, "City is required"],
                trim: true,
            },
            area: {
                type: String,
                required: [true, "Area is required"],
                trim: true,
            },
            address: {
                type: String,
                trim: true,
                default: "",
            },
        },
        specifications: {
            bedrooms: {
                type: Number,
                min: 0,
                default: 0,
            },
            bathrooms: {
                type: Number,
                min: 0,
                default: 0,
            },
            areaSqm: {
                type: Number,
                required: [true, "Area in square meters is required"],
                min: [1, "Area must be at least 1 sqm"],
            },
            parking: {
                type: Boolean,
                default: false,
            },
            furnished: {
                type: String,
                enum: ["unfurnished", "semi_furnished", "furnished", "not_applicable"],
                default: "unfurnished",
            },
        },
        images: {
            type: [imageSchema],
            validate: {
                validator: function (v) {
                    return Array.isArray(v) && v.length > 0;
                },
                message: "A property must have at least one image",
            },
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        approvalStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
        },
        availabilityStatus: {
            type: String,
            enum: ["available", "rented", "sold"],
            default: "available",
            index: true,
        },
        rejectionReason: {
            type: String,
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
        isArchived: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for frequent discovery queries and admin queues
propertySchema.index({
    approvalStatus: 1,
    availabilityStatus: 1,
    listingType: 1,
    propertyType: 1,
    createdAt: -1,
});

propertySchema.index({ "location.city": 1, price: 1 });
propertySchema.index({ owner: 1, createdAt: -1 });

const Property = mongoose.model("Property", propertySchema);

export default Property;

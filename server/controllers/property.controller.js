import Property from "../models/Property.model.js";
import { errorHandler } from "../utils/error.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// Upload multiple property images
export const uploadImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return next(errorHandler(400, "Please provide at least one image file"));
        }

        if (req.files.length > 8) {
            return next(errorHandler(400, "Maximum 8 images allowed per upload"));
        }

        const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
        const uploadedImages = await Promise.all(uploadPromises);

        const imagesWithCover = uploadedImages.map((img, index) => ({
            ...img,
            isCover: index === 0,
        }));

        res.status(200).json({
            success: true,
            message: "Images uploaded successfully",
            images: imagesWithCover,
        });
    } catch (error) {
        next(error);
    }
};

// Create a new property listing (Owner / Admin)
export const createProperty = async (req, res, next) => {
    try {
        const {
            title,
            description,
            propertyType,
            listingType,
            price,
            currency = "USD",
            location,
            specifications,
            images,
        } = req.body;

        if (!title || !description || !propertyType || !listingType || price === undefined) {
            return next(errorHandler(400, "Please provide all required basic property details."));
        }

        if (!location?.city || !location?.area) {
            return next(errorHandler(400, "City and area location details are required."));
        }

        if (!specifications?.areaSqm) {
            return next(errorHandler(400, "Property specifications (area in sqm) are required."));
        }

        if (!images || !Array.isArray(images) || images.length === 0) {
            return next(errorHandler(400, "At least one property image is required."));
        }

        if (images.length > 8) {
            return next(errorHandler(400, "A property cannot have more than 8 images."));
        }

        // Ensure at least one image is marked as cover
        const hasCover = images.some((img) => img.isCover);
        const formattedImages = images.map((img, idx) => ({
            ...img,
            isCover: hasCover ? Boolean(img.isCover) : idx === 0,
        }));

        const newProperty = new Property({
            title: title.trim(),
            description: description.trim(),
            propertyType,
            listingType,
            price: Number(price),
            currency: currency.trim().toUpperCase(),
            location: {
                city: location.city.trim(),
                area: location.area.trim(),
                address: location.address?.trim() || "",
            },
            specifications: {
                bedrooms: Number(specifications.bedrooms) || 0,
                bathrooms: Number(specifications.bathrooms) || 0,
                areaSqm: Number(specifications.areaSqm),
                parking: Boolean(specifications.parking),
                furnished: specifications.furnished || "unfurnished",
            },
            images: formattedImages,
            // CRITICAL BUSINESS RULES:
            owner: req.user._id, // Enforce identity from authenticated token
            approvalStatus: "pending", // Always starts pending approval
            availabilityStatus: "available",
            rejectionReason: "",
            reviewedBy: null,
            reviewedAt: null,
            isArchived: false,
        });

        await newProperty.save();

        res.status(201).json({
            success: true,
            message: "Property created and submitted for administrative review.",
            property: newProperty,
        });
    } catch (error) {
        next(error);
    }
};

// Retrieve properties belonging to logged-in owner
export const getMyProperties = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = {
            owner: req.user._id,
            isArchived: false,
        };

        if (req.query.approvalStatus) {
            filter.approvalStatus = req.query.approvalStatus;
        }

        if (req.query.availabilityStatus) {
            filter.availabilityStatus = req.query.availabilityStatus;
        }

        if (req.query.search) {
            filter.title = { $regex: req.query.search, $options: "i" };
        }

        const total = await Property.countDocuments(filter);
        const properties = await Property.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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

// Retrieve single property by ID with strict access control
export const getPropertyById = async (req, res, next) => {
    try {
        const property = await Property.findOne({
            _id: req.params.id,
            isArchived: false,
        }).populate("owner", "fullName username email phone avatar role");

        if (!property) {
            return next(errorHandler(404, "Property listing not found."));
        }

        // Public access rule: If approved and available, anyone can view
        if (
            property.approvalStatus === "approved" &&
            property.availabilityStatus === "available"
        ) {
            return res.status(200).json({
                success: true,
                property,
            });
        }

        // For pending, rejected, rented, or sold listings:
        // Must be authenticated and either the owner or an admin
        const callerId = req.user?._id?.toString();
        const ownerId = property.owner?._id?.toString() || property.owner?.toString();
        const isAdmin = req.user?.role === "admin";

        if (callerId && (callerId === ownerId || isAdmin)) {
            return res.status(200).json({
                success: true,
                property,
            });
        }

        // Hide unapproved/unavailable listing from unauthorized users
        return next(
            errorHandler(
                404,
                "Property listing not found or not currently available for public viewing."
            )
        );
    } catch (error) {
        next(error);
    }
};

// Update own property (Owner / Admin)
export const updateProperty = async (req, res, next) => {
    try {
        const property = await Property.findOne({
            _id: req.params.id,
            isArchived: false,
        });

        if (!property) {
            return next(errorHandler(404, "Property listing not found."));
        }

        // Ownership enforcement: Only owner or admin can edit
        const isOwner = property.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You do not have permission to edit this property."));
        }

        const {
            title,
            description,
            propertyType,
            listingType,
            price,
            currency,
            location,
            specifications,
            images,
        } = req.body;

        let hasMaterialChanges = false;

        if (title && title.trim() !== property.title) {
            property.title = title.trim();
            hasMaterialChanges = true;
        }

        if (description && description.trim() !== property.description) {
            property.description = description.trim();
            hasMaterialChanges = true;
        }

        if (propertyType && propertyType !== property.propertyType) {
            property.propertyType = propertyType;
            hasMaterialChanges = true;
        }

        if (listingType && listingType !== property.listingType) {
            property.listingType = listingType;
            hasMaterialChanges = true;
        }

        if (price !== undefined && Number(price) !== property.price) {
            property.price = Number(price);
            hasMaterialChanges = true;
        }

        if (currency && currency.trim().toUpperCase() !== property.currency) {
            property.currency = currency.trim().toUpperCase();
            hasMaterialChanges = true;
        }

        if (location) {
            if (location.city) property.location.city = location.city.trim();
            if (location.area) property.location.area = location.area.trim();
            if (location.address !== undefined) property.location.address = location.address.trim();
            hasMaterialChanges = true;
        }

        if (specifications) {
            if (specifications.bedrooms !== undefined) property.specifications.bedrooms = Number(specifications.bedrooms);
            if (specifications.bathrooms !== undefined) property.specifications.bathrooms = Number(specifications.bathrooms);
            if (specifications.areaSqm !== undefined) property.specifications.areaSqm = Number(specifications.areaSqm);
            if (specifications.parking !== undefined) property.specifications.parking = Boolean(specifications.parking);
            if (specifications.furnished !== undefined) property.specifications.furnished = specifications.furnished;
            hasMaterialChanges = true;
        }

        if (images && Array.isArray(images) && images.length > 0) {
            if (images.length > 8) {
                return next(errorHandler(400, "Maximum 8 images allowed"));
            }
            const hasCover = images.some((img) => img.isCover);
            property.images = images.map((img, idx) => ({
                ...img,
                isCover: hasCover ? Boolean(img.isCover) : idx === 0,
            }));
            hasMaterialChanges = true;
        }

        // CRITICAL BUSINESS RULE 6:
        // If an approved property receives material edits, return it to pending review!
        if (hasMaterialChanges && property.approvalStatus === "approved" && !isAdmin) {
            property.approvalStatus = "pending";
            property.reviewedBy = null;
            property.reviewedAt = null;
            property.rejectionReason = "";
        }

        // If it was rejected and owner updates it, move it back to pending
        if (hasMaterialChanges && property.approvalStatus === "rejected" && !isAdmin) {
            property.approvalStatus = "pending";
            property.rejectionReason = "";
        }

        await property.save();

        res.status(200).json({
            success: true,
            message:
                property.approvalStatus === "pending"
                    ? "Property updated and resubmitted for admin review."
                    : "Property updated successfully.",
            property,
        });
    } catch (error) {
        next(error);
    }
};

// Update property availability (Owner / Admin)
export const updateAvailability = async (req, res, next) => {
    try {
        const { availabilityStatus } = req.body;

        if (!["available", "rented", "sold"].includes(availabilityStatus)) {
            return next(
                errorHandler(400, "Invalid availability status. Must be 'available', 'rented', or 'sold'.")
            );
        }

        const property = await Property.findOne({
            _id: req.params.id,
            isArchived: false,
        });

        if (!property) {
            return next(errorHandler(404, "Property listing not found."));
        }

        const isOwner = property.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You do not have permission to modify this property's availability."));
        }

        property.availabilityStatus = availabilityStatus;
        await property.save();

        res.status(200).json({
            success: true,
            message: `Property availability updated to ${availabilityStatus}.`,
            property,
        });
    } catch (error) {
        next(error);
    }
};

// Delete/Archive property (Owner / Admin)
export const deleteProperty = async (req, res, next) => {
    try {
        const property = await Property.findOne({
            _id: req.params.id,
            isArchived: false,
        });

        if (!property) {
            return next(errorHandler(404, "Property listing not found."));
        }

        const isOwner = property.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return next(errorHandler(403, "You do not have permission to delete this property."));
        }

        // Soft-delete/archive
        property.isArchived = true;
        await property.save();

        // Clean up Cloudinary assets if safe
        if (Array.isArray(property.images)) {
            for (const img of property.images) {
                if (img.publicId) {
                    deleteFromCloudinary(img.publicId).catch((err) =>
                        console.error("Cloudinary cleanup error:", err.message)
                    );
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Property listing archived successfully.",
        });
    } catch (error) {
        next(error);
    }
};

// Public listing discovery (approved and available only)
export const getPublicProperties = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(24, Math.max(1, parseInt(req.query.limit) || 12));
        const skip = (page - 1) * limit;

        // CRITICAL: Public search ONLY returns approved and available properties
        const filter = {
            approvalStatus: "approved",
            availabilityStatus: "available",
            isArchived: false,
        };

        if (req.query.listingType && req.query.listingType !== "all") {
            filter.listingType = req.query.listingType;
        }

        if (req.query.propertyType && req.query.propertyType !== "all") {
            filter.propertyType = req.query.propertyType;
        }

        if (req.query.city && req.query.city.trim()) {
            filter["location.city"] = { $regex: req.query.city.trim(), $options: "i" };
        }

        if (req.query.area && req.query.area.trim()) {
            filter["location.area"] = { $regex: req.query.area.trim(), $options: "i" };
        }

        const searchTerm = (req.query.search || req.query.keyword || "").trim();
        if (searchTerm) {
            filter.$or = [
                { title: { $regex: searchTerm, $options: "i" } },
                { description: { $regex: searchTerm, $options: "i" } },
                { "location.city": { $regex: searchTerm, $options: "i" } },
                { "location.area": { $regex: searchTerm, $options: "i" } },
            ];
        }

        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice && !isNaN(req.query.minPrice)) {
                filter.price.$gte = Number(req.query.minPrice);
            }
            if (req.query.maxPrice && !isNaN(req.query.maxPrice)) {
                filter.price.$lte = Number(req.query.maxPrice);
            }
        }

        if (req.query.bedrooms && !isNaN(req.query.bedrooms)) {
            filter["specifications.bedrooms"] = { $gte: Number(req.query.bedrooms) };
        }

        if (req.query.bathrooms && !isNaN(req.query.bathrooms)) {
            filter["specifications.bathrooms"] = { $gte: Number(req.query.bathrooms) };
        }

        if (req.query.furnished && req.query.furnished !== "all") {
            filter["specifications.furnished"] = req.query.furnished;
        }

        if (req.query.parking === "true") {
            filter["specifications.parking"] = true;
        }

        let sort = { createdAt: -1 };
        if (req.query.sort === "price_asc") sort = { price: 1 };
        if (req.query.sort === "price_desc") sort = { price: -1 };
        if (req.query.sort === "oldest") sort = { createdAt: 1 };

        const total = await Property.countDocuments(filter);
        const properties = await Property.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate("owner", "fullName username avatar");

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

// Retrieve related properties (by city or property type)
export const getRelatedProperties = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentProperty = await Property.findById(id);

        if (!currentProperty) {
            return res.status(200).json({ success: true, data: [] });
        }

        const related = await Property.find({
            _id: { $ne: currentProperty._id },
            approvalStatus: "approved",
            availabilityStatus: "available",
            isArchived: false,
            $or: [
                { "location.city": currentProperty.location?.city },
                { propertyType: currentProperty.propertyType },
            ],
        })
            .limit(4)
            .populate("owner", "fullName username avatar");

        res.status(200).json({
            success: true,
            data: related,
        });
    } catch (error) {
        next(error);
    }
};

import Favorite from "../models/Favorite.model.js";
import Property from "../models/Property.model.js";
import { errorHandler } from "../utils/error.js";

// Add a property to favorites
export const addFavorite = async (req, res, next) => {
    try {
        const { propertyId } = req.params;

        // Verify property exists and is eligible for favoriting
        const property = await Property.findOne({
            _id: propertyId,
            isArchived: false,
        });

        if (!property) {
            return next(errorHandler(404, "Property not found."));
        }

        // Business rule: Do not allow favoriting unapproved or unavailable listings
        if (
            property.approvalStatus !== "approved" ||
            property.availabilityStatus !== "available"
        ) {
            return next(
                errorHandler(
                    400,
                    "Cannot favorite unapproved, rented, or sold property listings."
                )
            );
        }

        // Check if already favorited
        const existing = await Favorite.findOne({
            user: req.user._id,
            property: propertyId,
        });

        if (existing) {
            return res.status(200).json({
                success: true,
                message: "Property is already in your favorites.",
                isFavorited: true,
            });
        }

        const favorite = new Favorite({
            user: req.user._id,
            property: propertyId,
        });

        await favorite.save();

        res.status(201).json({
            success: true,
            message: "Property added to favorites.",
            isFavorited: true,
        });
    } catch (error) {
        // Handle race conditions with compound unique index
        if (error.code === 11000) {
            return res.status(200).json({
                success: true,
                message: "Property is already in your favorites.",
                isFavorited: true,
            });
        }
        next(error);
    }
};

// Remove a property from favorites
export const removeFavorite = async (req, res, next) => {
    try {
        const { propertyId } = req.params;

        const result = await Favorite.findOneAndDelete({
            user: req.user._id,
            property: propertyId,
        });

        res.status(200).json({
            success: true,
            message: "Property removed from favorites.",
            isFavorited: false,
        });
    } catch (error) {
        next(error);
    }
};

// Retrieve current user's favorites
export const getMyFavorites = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(24, Math.max(1, parseInt(req.query.limit) || 12));
        const skip = (page - 1) * limit;

        const total = await Favorite.countDocuments({ user: req.user._id });

        const favorites = await Favorite.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: "property",
                match: { isArchived: false },
                populate: {
                    path: "owner",
                    select: "fullName username avatar",
                },
            });

        // Filter out any populated properties that are null due to archiving
        const validFavorites = favorites.filter((fav) => fav.property !== null);

        res.status(200).json({
            success: true,
            data: validFavorites,
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

// Check if a specific property is favorited by current user
export const checkFavorite = async (req, res, next) => {
    try {
        const { propertyId } = req.params;

        const favorite = await Favorite.findOne({
            user: req.user._id,
            property: propertyId,
        });

        res.status(200).json({
            success: true,
            isFavorited: Boolean(favorite),
        });
    } catch (error) {
        next(error);
    }
};

// Get all favorited property IDs for the authenticated user
export const getFavoriteIds = async (req, res, next) => {
    try {
        const favorites = await Favorite.find({ user: req.user._id }).select("property");
        const favoriteIds = favorites.map((f) => f.property.toString());

        res.status(200).json({
            success: true,
            favoriteIds,
        });
    } catch (error) {
        next(error);
    }
};

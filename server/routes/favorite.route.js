import express from "express";
import {
    addFavorite,
    removeFavorite,
    getMyFavorites,
    checkFavorite,
    getFavoriteIds,
} from "../controllers/favorite.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// All favorite routes require authentication
router.use(verifyToken);

router.get("/", getMyFavorites);
router.get("/ids", getFavoriteIds);
router.get("/check/:propertyId", checkFavorite);
router.post("/:propertyId", addFavorite);
router.delete("/:propertyId", removeFavorite);

export default router;

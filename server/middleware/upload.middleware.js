import multer from "multer";
import { errorHandler } from "../utils/error.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            errorHandler(
                400,
                `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per image limit
        files: 8, // Max 8 images per property
    },
    fileFilter,
});

export const uploadPropertyImages = upload.array("images", 8);

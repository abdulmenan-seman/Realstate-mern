import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const isConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name"
);

if (isConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer 
 * @param {string} folder 
 * @returns {Promise<{publicId: string, secureUrl: string, width: number, height: number}>}
 */
export const uploadToCloudinary = (fileBuffer, folder = "realestatehub/properties") => {
    return new Promise((resolve, reject) => {
        if (!isConfigured) {
            // Local development fallback when Cloudinary credentials are not set
            const mockId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const base64 = fileBuffer.toString("base64");
            const dataUri = `data:image/jpeg;base64,${base64}`;
            return resolve({
                publicId: mockId,
                secureUrl: dataUri,
                width: 800,
                height: 600,
            });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                allowed_formats: ["jpg", "jpeg", "png", "webp"],
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve({
                    publicId: result.public_id,
                    secureUrl: result.secure_url,
                    width: result.width,
                    height: result.height,
                });
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Remove an asset from Cloudinary
 * @param {string} publicId 
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId) => {
    if (!isConfigured || !publicId || publicId.startsWith("mock_")) {
        return { result: "ok" };
    }
    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error(`Failed to delete Cloudinary asset (${publicId}):`, err.message);
        return { result: "error", error: err.message };
    }
};

export default cloudinary;

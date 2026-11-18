import React, { useState } from "react";
import Button from "../common/Button";
import Alert from "../common/Alert";
import apiClient from "../../services/apiClient";

export default function ImageUploader({ images = [], onChange, maxImages = 8 }) {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (images.length + files.length > maxImages) {
            setUploadError(`You can only upload a maximum of ${maxImages} images.`);
            return;
        }

        // Validate types and sizes
        for (const file of files) {
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                setUploadError("Only JPG, PNG, and WebP images are allowed.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setUploadError("Each image must be smaller than 5 MB.");
                return;
            }
        }

        try {
            setUploading(true);
            setUploadError(null);

            const formData = new FormData();
            files.forEach((file) => formData.append("images", file));

            const res = await apiClient.post("/properties/upload-images", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.success && Array.isArray(res.images)) {
                const updated = [...images, ...res.images];
                // Ensure at least one cover exists
                if (!updated.some((img) => img.isCover) && updated.length > 0) {
                    updated[0].isCover = true;
                }
                onChange(updated);
            }
        } catch (err) {
            setUploadError(err.message || "Failed to upload images.");
        } finally {
            setUploading(false);
            e.target.value = ""; // reset file input
        }
    };

    const handleRemoveImage = (indexToRemove) => {
        const updated = images.filter((_, idx) => idx !== indexToRemove);
        // If the removed image was cover, assign cover to the first image
        if (images[indexToRemove]?.isCover && updated.length > 0) {
            updated[0].isCover = true;
        }
        onChange(updated);
    };

    const handleSetCover = (indexToCover) => {
        const updated = images.map((img, idx) => ({
            ...img,
            isCover: idx === indexToCover,
        }));
        onChange(updated);
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                    Property Images <span className="text-red-500">*</span>
                    <span className="text-xs text-slate-400 font-normal ml-2">
                        ({images.length} / {maxImages} uploaded)
                    </span>
                </label>
                <span className="text-xs text-slate-500">Max 5MB per image (JPG, PNG, WebP)</span>
            </div>

            {uploadError && (
                <Alert type="error" message={uploadError} onClose={() => setUploadError(null)} />
            )}

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors bg-slate-50">
                <input
                    type="file"
                    id="property-image-input"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading || images.length >= maxImages}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <label
                    htmlFor="property-image-input"
                    className={`cursor-pointer flex flex-col items-center justify-center gap-2 ${
                        uploading || images.length >= maxImages ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-slate-200">
                        📁
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-slate-800">
                            {uploading ? "Uploading images..." : "Click to upload property images"}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">Select one or up to 8 high-resolution photos</p>
                    </div>
                </label>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {images.map((img, idx) => (
                        <div
                            key={img.publicId || idx}
                            className={`relative rounded-lg overflow-hidden border bg-white shadow-sm group ${
                                img.isCover ? "ring-2 ring-blue-600 border-transparent" : "border-slate-200"
                            }`}
                        >
                            <img
                                src={img.secureUrl}
                                alt={`property-${idx}`}
                                className="w-full h-28 object-cover"
                            />
                            {img.isCover && (
                                <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow">
                                    Cover Photo
                                </span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {!img.isCover && (
                                    <button
                                        type="button"
                                        onClick={() => handleSetCover(idx)}
                                        className="bg-white/90 text-slate-800 text-xs px-2 py-1 rounded hover:bg-white font-medium"
                                    >
                                        Set Cover
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(idx)}
                                    className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

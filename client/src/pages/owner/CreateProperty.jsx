import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import ImageUploader from "../../components/properties/ImageUploader";

export default function CreateProperty() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        propertyType: "apartment",
        listingType: "sale",
        price: "",
        currency: "USD",
        location: {
            city: "",
            area: "",
            address: "",
        },
        specifications: {
            bedrooms: 2,
            bathrooms: 1,
            areaSqm: 85,
            parking: false,
            furnished: "unfurnished",
        },
        images: [],
    });

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;

        if (id.startsWith("loc_")) {
            const field = id.replace("loc_", "");
            setFormData((prev) => ({
                ...prev,
                location: { ...prev.location, [field]: value },
            }));
        } else if (id.startsWith("spec_")) {
            const field = id.replace("spec_", "");
            setFormData((prev) => ({
                ...prev,
                specifications: {
                    ...prev.specifications,
                    [field]: type === "checkbox" ? checked : value,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [id]: value }));
        }
    };

    const handleImagesChange = (newImages) => {
        setFormData((prev) => ({ ...prev, images: newImages }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.images || formData.images.length === 0) {
            setError("Please upload at least one property image before submitting.");
            return;
        }

        try {
            setLoading(true);
            const res = await apiClient.post("/properties", formData);
            if (res.success) {
                navigate("/owner/properties");
            }
        } catch (err) {
            setError(err.message || "Failed to create property listing.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Link to="/owner/properties" className="hover:underline">
                    My Properties
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-medium">Add New Property</span>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="border-b border-slate-200 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Add New Property Listing</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Fill in all property details. Your listing will be submitted to the administrator for approval.
                    </p>
                </div>

                {error && (
                    <div className="mb-6">
                        <Alert type="error" message={error} onClose={() => setError(null)} />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Basic Info */}
                    <div>
                        <h2 className="text-base font-bold text-slate-800 mb-3">1. Basic Information</h2>
                        <div className="flex flex-col gap-4">
                            <Input
                                id="title"
                                label="Property Title"
                                placeholder="e.g. Modern 3-Bedroom Apartment with Ocean View"
                                required
                                value={formData.title}
                                onChange={handleChange}
                            />

                            <div className="flex flex-col gap-1">
                                <label htmlFor="description" className="text-sm font-medium text-slate-700">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    rows={4}
                                    required
                                    placeholder="Describe the property's standout features, neighborhood amenities, renovations, etc."
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="border border-slate-300 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="propertyType" className="text-sm font-medium text-slate-700">
                                        Property Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="propertyType"
                                        value={formData.propertyType}
                                        onChange={handleChange}
                                        className="border border-slate-300 rounded-lg p-3 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    >
                                        <option value="apartment">Apartment</option>
                                        <option value="house">House</option>
                                        <option value="villa">Villa</option>
                                        <option value="commercial">Commercial</option>
                                        <option value="land">Land</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label htmlFor="listingType" className="text-sm font-medium text-slate-700">
                                        Listing Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="listingType"
                                        value={formData.listingType}
                                        onChange={handleChange}
                                        className="border border-slate-300 rounded-lg p-3 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    >
                                        <option value="sale">For Sale</option>
                                        <option value="rent">For Rent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    label={`Price (${formData.listingType === "rent" ? "Per Month" : "Total"})`}
                                    placeholder="e.g. 250000"
                                    required
                                    value={formData.price}
                                    onChange={handleChange}
                                />
                                <Input
                                    id="currency"
                                    label="Currency (ISO)"
                                    placeholder="USD"
                                    value={formData.currency}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location Info */}
                    <div className="border-t border-slate-200 pt-6">
                        <h2 className="text-base font-bold text-slate-800 mb-3">2. Location</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                id="loc_city"
                                label="City"
                                placeholder="e.g. New York"
                                required
                                value={formData.location.city}
                                onChange={handleChange}
                            />
                            <Input
                                id="loc_area"
                                label="Area / Neighborhood"
                                placeholder="e.g. Brooklyn Heights"
                                required
                                value={formData.location.area}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mt-4">
                            <Input
                                id="loc_address"
                                label="Street Address (Optional)"
                                placeholder="e.g. 742 Evergreen Terrace"
                                value={formData.location.address}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="border-t border-slate-200 pt-6">
                        <h2 className="text-base font-bold text-slate-800 mb-3">3. Specifications</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Input
                                id="spec_bedrooms"
                                type="number"
                                min="0"
                                label="Bedrooms"
                                value={formData.specifications.bedrooms}
                                onChange={handleChange}
                            />
                            <Input
                                id="spec_bathrooms"
                                type="number"
                                min="0"
                                label="Bathrooms"
                                value={formData.specifications.bathrooms}
                                onChange={handleChange}
                            />
                            <Input
                                id="spec_areaSqm"
                                type="number"
                                min="1"
                                label="Area (sqm)"
                                required
                                value={formData.specifications.areaSqm}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div className="flex flex-col gap-1">
                                <label htmlFor="spec_furnished" className="text-sm font-medium text-slate-700">
                                    Furnishing Status
                                </label>
                                <select
                                    id="spec_furnished"
                                    value={formData.specifications.furnished}
                                    onChange={handleChange}
                                    className="border border-slate-300 rounded-lg p-3 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    <option value="unfurnished">Unfurnished</option>
                                    <option value="semi_furnished">Semi-Furnished</option>
                                    <option value="furnished">Furnished</option>
                                    <option value="not_applicable">Not Applicable</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="spec_parking"
                                    checked={formData.specifications.parking}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-slate-800 rounded border-slate-300 focus:ring-slate-400"
                                />
                                <label htmlFor="spec_parking" className="text-sm font-medium text-slate-700">
                                    Dedicated Parking Space Available
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="border-t border-slate-200 pt-6">
                        <h2 className="text-base font-bold text-slate-800 mb-3">4. Property Photos</h2>
                        <ImageUploader images={formData.images} onChange={handleImagesChange} maxImages={8} />
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
                        <Link to="/owner/properties">
                            <Button variant="outline" disabled={loading}>
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" variant="primary" loading={loading} disabled={loading}>
                            {loading ? "Submitting..." : "Submit Property for Review"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

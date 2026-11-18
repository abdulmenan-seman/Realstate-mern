import React, { useEffect, useState } from "react";
import apiClient from "../../services/apiClient";
import PropertyCard from "../../components/properties/PropertyCard";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function AdminProperties() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const [activeTab, setActiveTab] = useState("pending"); // pending | approved | rejected | all

    // Rejection Modal State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectError, setRejectError] = useState(null);
    const [submittingReview, setSubmittingReview] = useState(false);

    // Detail Preview Modal State
    const [previewProperty, setPreviewProperty] = useState(null);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            setError(null);

            let endpoint = `/admin/properties?limit=50`;
            if (activeTab === "pending") {
                endpoint = `/admin/properties/pending?limit=50`;
            } else if (activeTab !== "all") {
                endpoint = `/admin/properties?approvalStatus=${activeTab}&limit=50`;
            }

            const res = await apiClient.get(endpoint);
            if (res.success && Array.isArray(res.data)) {
                setProperties(res.data);
            }
        } catch (err) {
            setError(err.message || "Failed to load properties for review.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, [activeTab]);

    const handleApprove = async (propertyId) => {
        try {
            setSubmittingReview(true);
            const res = await apiClient.patch(`/admin/properties/${propertyId}/review`, {
                action: "approve",
            });
            if (res.success) {
                setActionMessage("Listing approved successfully!");
                if (activeTab === "pending") {
                    setProperties((prev) => prev.filter((p) => p._id !== propertyId));
                } else {
                    setProperties((prev) =>
                        prev.map((p) => (p._id === propertyId ? res.property : p))
                    );
                }
            }
        } catch (err) {
            setError(err.message || "Failed to approve listing.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleOpenRejectModal = (propertyId) => {
        setSelectedPropertyId(propertyId);
        setRejectionReason("");
        setRejectError(null);
        setRejectModalOpen(true);
    };

    const handleConfirmReject = async (e) => {
        e.preventDefault();
        if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
            setRejectError("Please provide a valid reason (at least 5 characters).");
            return;
        }

        try {
            setSubmittingReview(true);
            const res = await apiClient.patch(`/admin/properties/${selectedPropertyId}/review`, {
                action: "reject",
                rejectionReason: rejectionReason.trim(),
            });

            if (res.success) {
                setActionMessage("Listing rejected and reason sent to owner.");
                setRejectModalOpen(false);
                if (activeTab === "pending") {
                    setProperties((prev) => prev.filter((p) => p._id !== selectedPropertyId));
                } else {
                    setProperties((prev) =>
                        prev.map((p) => (p._id === selectedPropertyId ? res.property : p))
                    );
                }
            }
        } catch (err) {
            setRejectError(err.message || "Failed to reject property.");
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                    Property Moderation & Reviews
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Review submitted listings, verify details and photos, and approve or reject submissions.
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === "pending"
                            ? "border-amber-600 text-amber-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    ⏳ Pending Review
                </button>
                <button
                    onClick={() => setActiveTab("approved")}
                    className={`py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === "approved"
                            ? "border-emerald-600 text-emerald-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    ✅ Approved Listings
                </button>
                <button
                    onClick={() => setActiveTab("rejected")}
                    className={`py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === "rejected"
                            ? "border-rose-600 text-rose-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    ❌ Rejected Listings
                </button>
                <button
                    onClick={() => setActiveTab("all")}
                    className={`py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === "all"
                            ? "border-slate-800 text-slate-800"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    📋 All Listings
                </button>
            </div>

            {actionMessage && (
                <div className="mb-6">
                    <Alert type="success" message={actionMessage} onClose={() => setActionMessage(null)} />
                </div>
            )}

            {error && (
                <div className="mb-6">
                    <Alert type="error" message={error} onClose={() => setError(null)} />
                </div>
            )}

            {/* Main Content */}
            {loading ? (
                <Loader text="Loading moderation queue..." />
            ) : properties.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="text-4xl mb-3">✨</div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Queue is clear</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        {activeTab === "pending"
                            ? "There are no pending property listings awaiting administrative review."
                            : `No properties found in the '${activeTab}' category.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                        <PropertyCard
                            key={property._id}
                            property={property}
                            actions={
                                <div className="flex flex-col gap-2">
                                    {property.owner && (
                                        <div className="text-xs text-slate-500 flex items-center justify-between">
                                            <span>
                                                Submitted by: <strong>{property.owner.fullName || property.owner.username}</strong>
                                            </span>
                                            <span>{new Date(property.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setPreviewProperty(property)}
                                            className="flex-1 text-xs"
                                        >
                                            Inspect
                                        </Button>

                                        {property.approvalStatus !== "approved" && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="primary"
                                                loading={submittingReview}
                                                onClick={() => handleApprove(property._id)}
                                                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                Approve
                                            </Button>
                                        )}

                                        {property.approvalStatus !== "rejected" && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="danger"
                                                loading={submittingReview}
                                                onClick={() => handleOpenRejectModal(property._id)}
                                                className="flex-1 text-xs"
                                            >
                                                Reject
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            }
                        />
                    ))}
                </div>
            )}

            {/* Rejection Modal Dialog */}
            {rejectModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Reject Property Listing</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            Provide a specific explanation for the rejection. The owner will see this reason so they can update and resubmit their listing.
                        </p>

                        {rejectError && (
                            <div className="mb-4">
                                <Alert type="error" message={rejectError} />
                            </div>
                        )}

                        <form onSubmit={handleConfirmReject} className="flex flex-col gap-4">
                            <textarea
                                rows={4}
                                required
                                placeholder="e.g. Inappropriate images; price does not match market specifications; address needs verification."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />

                            <div className="flex justify-end gap-2 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRejectModalOpen(false)}
                                    disabled={submittingReview}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="danger"
                                    loading={submittingReview}
                                    disabled={submittingReview}
                                >
                                    Confirm Rejection
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Inspection Modal */}
            {previewProperty && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                            <h2 className="text-xl font-bold text-slate-800">{previewProperty.title}</h2>
                            <button
                                onClick={() => setPreviewProperty(null)}
                                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Image Gallery */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                            {previewProperty.images?.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img.secureUrl}
                                    alt={`photo-${idx}`}
                                    className="h-28 w-full object-cover rounded-lg border border-slate-200"
                                />
                            ))}
                        </div>

                        {/* Details */}
                        <div className="flex flex-col gap-3 text-sm text-slate-700">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                <span className="font-bold text-xl text-slate-900">
                                    {previewProperty.currency} ${previewProperty.price?.toLocaleString()}
                                </span>
                                <span className="text-xs uppercase font-bold px-2 py-1 rounded bg-slate-200">
                                    {previewProperty.propertyType} • For {previewProperty.listingType}
                                </span>
                            </div>

                            <p className="whitespace-pre-line text-slate-600 bg-slate-50 p-3 rounded-lg">
                                {previewProperty.description}
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><strong>Location:</strong> {previewProperty.location?.area}, {previewProperty.location?.city}</div>
                                <div><strong>Street:</strong> {previewProperty.location?.address || "N/A"}</div>
                                <div><strong>Bedrooms:</strong> {previewProperty.specifications?.bedrooms}</div>
                                <div><strong>Bathrooms:</strong> {previewProperty.specifications?.bathrooms}</div>
                                <div><strong>Area:</strong> {previewProperty.specifications?.areaSqm} m²</div>
                                <div><strong>Parking:</strong> {previewProperty.specifications?.parking ? "Yes" : "No"}</div>
                                <div><strong>Furnished:</strong> {previewProperty.specifications?.furnished}</div>
                                <div><strong>Owner Email:</strong> {previewProperty.owner?.email || "N/A"}</div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
                            <Button variant="outline" onClick={() => setPreviewProperty(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

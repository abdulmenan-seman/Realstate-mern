import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import PropertyCard from "../../components/properties/PropertyCard";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function MyProperties() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [actionMessage, setActionMessage] = useState(null);

    const fetchMyProperties = async () => {
        try {
            setLoading(true);
            setError(null);
            let url = "/properties/mine?limit=50";
            if (statusFilter !== "all") {
                url += `&approvalStatus=${statusFilter}`;
            }
            if (searchQuery.trim()) {
                url += `&search=${encodeURIComponent(searchQuery.trim())}`;
            }

            const res = await apiClient.get(url);
            if (res.success && Array.isArray(res.data)) {
                setProperties(res.data);
            }
        } catch (err) {
            setError(err.message || "Failed to load properties.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyProperties();
    }, [statusFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchMyProperties();
    };

    const handleAvailabilityChange = async (propertyId, newStatus) => {
        try {
            const res = await apiClient.patch(`/properties/${propertyId}/availability`, {
                availabilityStatus: newStatus,
            });
            if (res.success) {
                setActionMessage(`Property availability updated to '${newStatus}'.`);
                setProperties((prev) =>
                    prev.map((p) => (p._id === propertyId ? { ...p, availabilityStatus: newStatus } : p))
                );
            }
        } catch (err) {
            setError(err.message || "Failed to update availability.");
        }
    };

    const handleDeleteProperty = async (propertyId) => {
        if (!window.confirm("Are you sure you want to delete/archive this property listing?")) {
            return;
        }

        try {
            const res = await apiClient.delete(`/properties/${propertyId}`);
            if (res.success) {
                setActionMessage("Property listing archived successfully.");
                setProperties((prev) => prev.filter((p) => p._id !== propertyId));
            }
        } catch (err) {
            setError(err.message || "Failed to archive property.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Properties</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage your published listings, track review statuses, and update availability.
                    </p>
                </div>
                <Link to="/owner/create-property">
                    <Button variant="primary" className="w-full sm:w-auto">
                        + Add New Property
                    </Button>
                </Link>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <button
                        onClick={() => setStatusFilter("all")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                            statusFilter === "all"
                                ? "bg-slate-800 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        All Listings
                    </button>
                    <button
                        onClick={() => setStatusFilter("pending")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                            statusFilter === "pending"
                                ? "bg-amber-600 text-white"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                    >
                        Pending Review
                    </button>
                    <button
                        onClick={() => setStatusFilter("approved")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                            statusFilter === "approved"
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                    >
                        Approved
                    </button>
                    <button
                        onClick={() => setStatusFilter("rejected")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                            statusFilter === "rejected"
                                ? "bg-rose-600 text-white"
                                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        }`}
                    >
                        Rejected
                    </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 w-full sm:w-48"
                    />
                    <Button type="submit" size="sm" variant="secondary">
                        Search
                    </Button>
                </form>
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

            {/* Content State */}
            {loading ? (
                <Loader text="Loading your listings..." />
            ) : properties.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="text-4xl mb-3">🏡</div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No listings found</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                        {statusFilter !== "all"
                            ? `You do not have any properties currently marked as '${statusFilter}'.`
                            : "You haven't created any property listings yet."}
                    </p>
                    <Link to="/owner/create-property">
                        <Button variant="primary">Create Your First Listing</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                        <PropertyCard
                            key={property._id}
                            property={property}
                            actions={
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-600">Availability:</span>
                                        <select
                                            value={property.availabilityStatus}
                                            onChange={(e) =>
                                                handleAvailabilityChange(property._id, e.target.value)
                                            }
                                            className="border rounded px-2 py-1 text-xs bg-slate-50 focus:outline-none"
                                        >
                                            <option value="available">Available</option>
                                            <option value="rented">Rented</option>
                                            <option value="sold">Sold</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                        <Link
                                            to={`/owner/edit-property/${property._id}`}
                                            className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-1.5 rounded transition-colors"
                                        >
                                            Edit Details
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteProperty(property._id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-medium py-1.5 px-3 rounded transition-colors"
                                        >
                                            Archive
                                        </button>
                                    </div>
                                </div>
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import apiClient from "../../services/apiClient";

export default function PropertyCard({
    property,
    actions,
    isFavorited = false,
    onFavoriteToggle,
}) {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();

    const [favorited, setFavorited] = useState(isFavorited);
    const [toggling, setToggling] = useState(false);

    if (!property) return null;

    const coverImage =
        property.images?.find((img) => img.isCover)?.secureUrl ||
        property.images?.[0]?.secureUrl ||
        "https://via.placeholder.com/600x400?text=No+Image+Available";

    const handleHeartClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentUser) {
            navigate("/signIn", { state: { from: location } });
            return;
        }

        if (toggling) return;

        try {
            setToggling(true);
            if (favorited) {
                await apiClient.delete(`/favorites/${property._id}`);
                setFavorited(false);
                if (onFavoriteToggle) onFavoriteToggle(property._id, false);
            } else {
                await apiClient.post(`/favorites/${property._id}`);
                setFavorited(true);
                if (onFavoriteToggle) onFavoriteToggle(property._id, true);
            }
        } catch (err) {
            console.error("Favorite toggle failed:", err);
        } finally {
            setToggling(false);
        }
    };

    const getApprovalBadge = (status) => {
        switch (status) {
            case "approved":
                return (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                        Approved
                    </span>
                );
            case "rejected":
                return (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-200">
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                        Pending
                    </span>
                );
        }
    };

    const getAvailabilityBadge = (status) => {
        switch (status) {
            case "rented":
                return (
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Rented
                    </span>
                );
            case "sold":
                return (
                    <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Sold
                    </span>
                );
            default:
                return (
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Available
                    </span>
                );
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
            {/* Image & Status Badges */}
            <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                <Link to={`/properties/${property._id}`}>
                    <img
                        src={coverImage}
                        alt={property.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </Link>

                {/* Top Badges */}
                <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap pointer-events-none">
                    <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        For {property.listingType}
                    </span>
                    <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        {property.propertyType}
                    </span>
                </div>

                {/* Favorite Heart Button */}
                <button
                    onClick={handleHeartClick}
                    disabled={toggling}
                    title={favorited ? "Remove from favorites" : "Save to favorites"}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-700 shadow-md hover:scale-110 active:scale-95 transition-all"
                >
                    {favorited ? (
                        <FaHeart className="text-red-500 text-sm" />
                    ) : (
                        <FaRegHeart className="text-slate-600 text-sm hover:text-red-500" />
                    )}
                </button>

                {/* Availability status tag for owner views */}
                {actions && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                        {getAvailabilityBadge(property.availabilityStatus)}
                        {getApprovalBadge(property.approvalStatus)}
                    </div>
                )}
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xl font-bold text-slate-900">
                            {property.currency || "$"}{property.price?.toLocaleString()}
                            {property.listingType === "rent" && (
                                <span className="text-xs text-slate-500 font-normal"> / mo</span>
                            )}
                        </span>
                    </div>

                    <Link to={`/properties/${property._id}`}>
                        <h3
                            className="font-semibold text-slate-800 text-base line-clamp-1 mb-1 hover:text-blue-600 transition-colors"
                            title={property.title}
                        >
                            {property.title}
                        </h3>
                    </Link>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                        📍 {property.location?.area}, {property.location?.city}
                    </p>

                    {/* Specifications */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        {property.specifications?.bedrooms > 0 && (
                            <span>🛏️ {property.specifications.bedrooms} Beds</span>
                        )}
                        {property.specifications?.bathrooms > 0 && (
                            <span>🚿 {property.specifications.bathrooms} Baths</span>
                        )}
                        <span>📐 {property.specifications?.areaSqm} m²</span>
                    </div>

                    {/* Rejection notice if owner view */}
                    {property.approvalStatus === "rejected" && property.rejectionReason && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <strong>Reason:</strong> {property.rejectionReason}
                        </div>
                    )}
                </div>

                {/* Extra custom actions (for owner/admin dashboards) */}
                {actions && <div className="mt-4 pt-3 border-t border-slate-100">{actions}</div>}
            </div>
        </div>
    );
}

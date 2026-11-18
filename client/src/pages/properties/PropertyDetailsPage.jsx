import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import apiClient from "../../services/apiClient";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import PropertyCard from "../../components/properties/PropertyCard";

export default function PropertyDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useSelector((state) => state.user);

    const [property, setProperty] = useState(null);
    const [relatedProperties, setRelatedProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Favorite state
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [actionNotice, setActionNotice] = useState(null);

    useEffect(() => {
        const fetchDetailsAndRelated = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await apiClient.get(`/properties/${id}`);
                if (res.success && res.property) {
                    setProperty(res.property);

                    // Fetch favorite status if user is authenticated
                    if (currentUser) {
                        try {
                            const favRes = await apiClient.get(`/favorites/check/${id}`);
                            if (favRes.success) {
                                setIsFavorited(favRes.isFavorited);
                            }
                        } catch (e) {
                            // ignore error
                        }
                    }

                    // Fetch related listings
                    try {
                        const relRes = await apiClient.get(`/properties/${id}/related`);
                        if (relRes.success && Array.isArray(relRes.data)) {
                            setRelatedProperties(relRes.data);
                        }
                    } catch (e) {
                        // ignore error
                    }
                }
            } catch (err) {
                setError(err.message || "Failed to load property details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetailsAndRelated();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id, currentUser]);

    const handleToggleFavorite = async () => {
        if (!currentUser) {
            navigate("/signIn", { state: { from: location } });
            return;
        }

        try {
            setFavoriteLoading(true);
            if (isFavorited) {
                await apiClient.delete(`/favorites/${id}`);
                setIsFavorited(false);
                setActionNotice("Property removed from favorites.");
            } else {
                await apiClient.post(`/favorites/${id}`);
                setIsFavorited(true);
                setActionNotice("Property saved to your favorites!");
            }
        } catch (err) {
            setError(err.message || "Failed to update favorite status.");
        } finally {
            setFavoriteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-16">
                <Loader text="Loading property details..." />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <div className="text-4xl mb-4">🏚️</div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Listing Unavailable</h1>
                <p className="text-slate-500 mb-6">
                    {error || "This property listing could not be found or has not been approved for public viewing."}
                </p>
                <Link to="/properties">
                    <Button variant="primary">Browse Available Properties</Button>
                </Link>
            </div>
        );
    }

    const images = property.images && property.images.length > 0
        ? property.images
        : [{ secureUrl: "https://via.placeholder.com/800x600?text=No+Photo" }];

    const activeImage = images[selectedImageIndex]?.secureUrl || images[0].secureUrl;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <Link to="/" className="hover:underline">Home</Link>
                <span>/</span>
                <Link to="/properties" className="hover:underline">Properties</Link>
                <span>/</span>
                <span className="text-slate-800 font-medium truncate max-w-xs">{property.title}</span>
            </div>

            {actionNotice && (
                <div className="mb-4">
                    <Alert type="success" message={actionNotice} onClose={() => setActionNotice(null)} />
                </div>
            )}

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Columns: Gallery & Information */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Hero Gallery */}
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <div className="relative h-72 sm:h-96 w-full bg-slate-900">
                            <img
                                src={activeImage}
                                alt={property.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3 flex gap-2">
                                <span className="bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold uppercase px-3 py-1 rounded">
                                    For {property.listingType}
                                </span>
                                <span className="bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold uppercase px-3 py-1 rounded">
                                    {property.propertyType}
                                </span>
                            </div>
                        </div>

                        {/* Thumbnail Row */}
                        {images.length > 1 && (
                            <div className="p-3 bg-slate-50 flex gap-2 overflow-x-auto border-t border-slate-200">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`h-16 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                            selectedImageIndex === idx
                                                ? "border-blue-600 ring-2 ring-blue-600/30"
                                                : "border-slate-200 opacity-70 hover:opacity-100"
                                        }`}
                                    >
                                        <img src={img.secureUrl} alt={`thumbnail-${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Property Specs & Highlights */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Property Specifications</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-2xl mb-1">🛏️</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Bedrooms</span>
                                <span className="block text-base font-bold text-slate-800">{property.specifications?.bedrooms || "N/A"}</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-2xl mb-1">🚿</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Bathrooms</span>
                                <span className="block text-base font-bold text-slate-800">{property.specifications?.bathrooms || "N/A"}</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-2xl mb-1">📐</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Area</span>
                                <span className="block text-base font-bold text-slate-800">{property.specifications?.areaSqm} m²</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-2xl mb-1">🚗</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Parking</span>
                                <span className="block text-base font-bold text-slate-800">{property.specifications?.parking ? "Included" : "None"}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                            <span>Furnishing: <strong className="capitalize">{property.specifications?.furnished?.replace("_", " ")}</strong></span>
                            <span>Availability: <strong className="capitalize">{property.availabilityStatus}</strong></span>
                        </div>
                    </div>

                    {/* Detailed Description */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">About this Property</h2>
                        <p className="whitespace-pre-line text-sm text-slate-600 leading-relaxed">
                            {property.description}
                        </p>
                    </div>
                </div>

                {/* Right Column: Pricing & Owner Contact Actions */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {/* Price and Action Box */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-20">
                        <div className="flex items-baseline justify-between mb-2">
                            <span className="text-xs font-bold uppercase text-slate-400">Price</span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                                {property.currency || "$"}{property.price?.toLocaleString()}
                                {property.listingType === "rent" && (
                                    <span className="text-xs font-normal text-slate-500"> / month</span>
                                )}
                            </span>
                        </div>

                        <h1 className="text-lg font-bold text-slate-800 mb-2 leading-snug">
                            {property.title}
                        </h1>

                        <p className="text-xs text-slate-500 mb-6 flex items-center gap-1">
                            📍 {property.location?.address ? `${property.location.address}, ` : ""}{property.location?.area}, {property.location?.city}
                        </p>

                        {/* Favorite Button */}
                        <button
                            type="button"
                            onClick={handleToggleFavorite}
                            disabled={favoriteLoading}
                            className={`w-full py-2.5 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 mb-3 transition-colors ${
                                isFavorited
                                    ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            {isFavorited ? (
                                <>
                                    <FaHeart className="text-red-500" />
                                    <span>Saved to Favorites</span>
                                </>
                            ) : (
                                <>
                                    <FaRegHeart />
                                    <span>Save to Favorites</span>
                                </>
                            )}
                        </button>

                        <div className="border-t border-slate-100 my-4"></div>

                        {/* Owner / Agent Card */}
                        <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <img
                                src={property.owner?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                                alt="Agent"
                                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                                <span className="block text-sm font-bold text-slate-800">
                                    {property.owner?.fullName || property.owner?.username || "Verified Owner"}
                                </span>
                                <span className="text-xs text-slate-500 uppercase font-semibold">
                                    {property.owner?.role || "Property Owner"}
                                </span>
                            </div>
                        </div>

                        {/* Inquire Actions */}
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="primary"
                                className="w-full"
                                onClick={() => {
                                    alert(`Direct inquiry feature is launching in Phase 4! You will be able to message ${property.owner?.fullName || "the owner"} directly.`);
                                }}
                            >
                                ✉️ Send Inquiry to Owner
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    alert("Viewing appointment scheduling is launching in Phase 4! You will be able to book in-person viewings.");
                                }}
                            >
                                📅 Schedule Viewing Appointment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Properties */}
            {relatedProperties.length > 0 && (
                <div className="mt-16 pt-10 border-t border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Similar Properties You May Like</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProperties.map((rel) => (
                            <PropertyCard key={rel._id} property={rel} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

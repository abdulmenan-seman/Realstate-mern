import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import PropertyCard from "../../components/properties/PropertyCard";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get("/favorites?limit=50");
            if (res.success && Array.isArray(res.data)) {
                setFavorites(res.data);
            }
        } catch (err) {
            setError(err.message || "Failed to load saved favorites.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    const handleRemoveFavorite = (propertyId) => {
        setFavorites((prev) => prev.filter((item) => item.property?._id !== propertyId));
        setActionMessage("Property removed from your favorites.");
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Saved Favorites</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Quickly access, review, and track the properties you have bookmarked.
                </p>
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

            {loading ? (
                <Loader text="Loading your saved properties..." />
            ) : favorites.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                    <div className="text-5xl mb-4">❤️</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No Saved Properties Yet</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        Click the heart icon on any property listing to save it here for quick access later.
                    </p>
                    <Link to="/properties">
                        <Button variant="primary">Browse Available Properties</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((fav) => {
                        const property = fav.property;
                        if (!property) return null;
                        return (
                            <PropertyCard
                                key={fav._id}
                                property={property}
                                isFavorited={true}
                                onFavoriteToggle={(id, isFav) => {
                                    if (!isFav) handleRemoveFavorite(id);
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

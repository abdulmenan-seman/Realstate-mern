import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../../services/apiClient";
import PropertyCard from "../../components/properties/PropertyCard";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function PropertyListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentUser } = useSelector((state) => state.user);

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
    const [favoriteIds, setFavoriteIds] = useState([]);

    // Filter Form State derived from URL searchParams
    const search = searchParams.get("search") || "";
    const city = searchParams.get("city") || "";
    const listingType = searchParams.get("listingType") || "all";
    const propertyType = searchParams.get("propertyType") || "all";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const bedrooms = searchParams.get("bedrooms") || "";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page")) || 1;

    // Local form state for filter sidebar
    const [filterState, setFilterState] = useState({
        search,
        city,
        listingType,
        propertyType,
        minPrice,
        maxPrice,
        bedrooms,
    });

    // Synchronize local filter state when URL changes
    useEffect(() => {
        setFilterState({
            search,
            city,
            listingType,
            propertyType,
            minPrice,
            maxPrice,
            bedrooms,
        });
    }, [search, city, listingType, propertyType, minPrice, maxPrice, bedrooms]);

    // Fetch properties from backend whenever searchParams change
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setLoading(true);
                setError(null);

                const queryString = searchParams.toString();
                const res = await apiClient.get(`/properties?limit=12&${queryString}`);

                if (res.success && Array.isArray(res.data)) {
                    setProperties(res.data);
                    if (res.meta) setMeta(res.meta);
                }

                if (currentUser) {
                    try {
                        const favRes = await apiClient.get("/favorites/ids");
                        if (favRes.success && Array.isArray(favRes.favoriteIds)) {
                            setFavoriteIds(favRes.favoriteIds);
                        }
                    } catch (e) {
                        // ignore error
                    }
                }
            } catch (err) {
                setError(err.message || "Failed to load properties.");
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [searchParams, currentUser]);

    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        setFilterState((prev) => ({ ...prev, [id]: value }));
    };

    const handleApplyFilters = (e) => {
        e.preventDefault();
        const newParams = new URLSearchParams();

        if (filterState.search.trim()) newParams.set("search", filterState.search.trim());
        if (filterState.city.trim()) newParams.set("city", filterState.city.trim());
        if (filterState.listingType !== "all") newParams.set("listingType", filterState.listingType);
        if (filterState.propertyType !== "all") newParams.set("propertyType", filterState.propertyType);
        if (filterState.minPrice) newParams.set("minPrice", filterState.minPrice);
        if (filterState.maxPrice) newParams.set("maxPrice", filterState.maxPrice);
        if (filterState.bedrooms) newParams.set("bedrooms", filterState.bedrooms);
        if (sort !== "newest") newParams.set("sort", sort);
        newParams.set("page", "1"); // Reset to page 1 on filter change

        setSearchParams(newParams);
    };

    const handleResetFilters = () => {
        setFilterState({
            search: "",
            city: "",
            listingType: "all",
            propertyType: "all",
            minPrice: "",
            maxPrice: "",
            bedrooms: "",
        });
        setSearchParams(new URLSearchParams());
    };

    const handleSortChange = (newSort) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("sort", newSort);
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > meta.totalPages) return;
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", newPage.toString());
        setSearchParams(newParams);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header info */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Explore Properties</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Discover verified houses, apartments, and villas available for purchase or lease.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column: Filters Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-20">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <span className="font-bold text-slate-800 text-sm">Filter Listings</span>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Reset All
                            </button>
                        </div>

                        <form onSubmit={handleApplyFilters} className="flex flex-col gap-4">
                            {/* Search Keyword */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="search" className="text-xs font-semibold text-slate-600">
                                    Keyword / Title
                                </label>
                                <input
                                    id="search"
                                    type="text"
                                    placeholder="e.g. Modern, Penthouse..."
                                    value={filterState.search}
                                    onChange={handleFilterChange}
                                    className="text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                                />
                            </div>

                            {/* City */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="city" className="text-xs font-semibold text-slate-600">
                                    City
                                </label>
                                <input
                                    id="city"
                                    type="text"
                                    placeholder="e.g. Miami, New York..."
                                    value={filterState.city}
                                    onChange={handleFilterChange}
                                    className="text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                                />
                            </div>

                            {/* Listing Type */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="listingType" className="text-xs font-semibold text-slate-600">
                                    Listing Type
                                </label>
                                <select
                                    id="listingType"
                                    value={filterState.listingType}
                                    onChange={handleFilterChange}
                                    className="text-xs p-2.5 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                                >
                                    <option value="all">All (Sale & Rent)</option>
                                    <option value="sale">For Sale</option>
                                    <option value="rent">For Rent</option>
                                </select>
                            </div>

                            {/* Property Type */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="propertyType" className="text-xs font-semibold text-slate-600">
                                    Property Type
                                </label>
                                <select
                                    id="propertyType"
                                    value={filterState.propertyType}
                                    onChange={handleFilterChange}
                                    className="text-xs p-2.5 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                                >
                                    <option value="all">All Property Types</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="house">House</option>
                                    <option value="villa">Villa</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="land">Land</option>
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-600">Price Range ($)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        id="minPrice"
                                        type="number"
                                        min="0"
                                        placeholder="Min"
                                        value={filterState.minPrice}
                                        onChange={handleFilterChange}
                                        className="text-xs p-2 border rounded-lg focus:outline-none"
                                    />
                                    <input
                                        id="maxPrice"
                                        type="number"
                                        min="0"
                                        placeholder="Max"
                                        value={filterState.maxPrice}
                                        onChange={handleFilterChange}
                                        className="text-xs p-2 border rounded-lg focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Minimum Bedrooms */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="bedrooms" className="text-xs font-semibold text-slate-600">
                                    Minimum Bedrooms
                                </label>
                                <select
                                    id="bedrooms"
                                    value={filterState.bedrooms}
                                    onChange={handleFilterChange}
                                    className="text-xs p-2.5 border rounded-lg bg-white focus:outline-none"
                                >
                                    <option value="">Any</option>
                                    <option value="1">1+ Bedroom</option>
                                    <option value="2">2+ Bedrooms</option>
                                    <option value="3">3+ Bedrooms</option>
                                    <option value="4">4+ Bedrooms</option>
                                </select>
                            </div>

                            <Button type="submit" variant="primary" size="sm" className="w-full mt-2">
                                Apply Filters
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Listings & Controls */}
                <div className="lg:col-span-3">
                    {/* Top Results Bar */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-sm font-medium text-slate-700">
                            Showing <strong>{properties.length}</strong> of <strong>{meta.total}</strong> verified listings
                        </span>

                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 font-medium">Sort By:</span>
                            <select
                                value={sort}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="border rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 font-medium focus:outline-none"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6">
                            <Alert type="error" message={error} onClose={() => setError(null)} />
                        </div>
                    )}

                    {loading ? (
                        <Loader text="Searching marketplace listings..." />
                    ) : properties.length === 0 ? (
                        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                            <div className="text-4xl mb-3">🔍</div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">No properties matched your criteria</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-4">
                                Try adjusting your keywords, expanding your price range, or clearing location filters.
                            </p>
                            <Button variant="outline" size="sm" onClick={handleResetFilters}>
                                Clear All Filters
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Properties Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {properties.map((prop) => (
                                    <PropertyCard
                                        key={prop._id}
                                        property={prop}
                                        isFavorited={favoriteIds.includes(prop._id.toString())}
                                        onFavoriteToggle={(id, isFav) => {
                                            setFavoriteIds((prev) =>
                                                isFav ? [...prev, id] : prev.filter((favId) => favId !== id)
                                            );
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {meta.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-10">
                                    <button
                                        type="button"
                                        disabled={meta.page <= 1}
                                        onClick={() => handlePageChange(meta.page - 1)}
                                        className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        &larr; Previous
                                    </button>

                                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                                meta.page === pageNum
                                                    ? "bg-slate-800 text-white shadow"
                                                    : "bg-white text-slate-700 border hover:bg-slate-50"
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        disabled={meta.page >= meta.totalPages}
                                        onClick={() => handlePageChange(meta.page + 1)}
                                        className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Next &rarr;
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

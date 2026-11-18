import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../services/apiClient";
import PropertyCard from "../components/properties/PropertyCard";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

export default function Home() {
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);

    // Hero Search State
    const [heroListingType, setHeroListingType] = useState("all");
    const [heroKeyword, setHeroKeyword] = useState("");
    const [heroPropertyType, setHeroPropertyType] = useState("all");

    // Featured Properties State
    const [featuredProperties, setFeaturedProperties] = useState([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);
    const [favoriteIds, setFavoriteIds] = useState([]);

    useEffect(() => {
        const fetchFeaturedAndFavorites = async () => {
            try {
                setLoadingFeatured(true);
                const res = await apiClient.get("/properties?limit=6&sort=newest");
                if (res.success && Array.isArray(res.data)) {
                    setFeaturedProperties(res.data);
                }

                if (currentUser) {
                    try {
                        const favRes = await apiClient.get("/favorites/ids");
                        if (favRes.success && Array.isArray(favRes.favoriteIds)) {
                            setFavoriteIds(favRes.favoriteIds);
                        }
                    } catch (e) {
                        // ignore favorite fetch error
                    }
                }
            } catch (err) {
                console.error("Failed to load featured properties:", err);
            } finally {
                setLoadingFeatured(false);
            }
        };

        fetchFeaturedAndFavorites();
    }, [currentUser]);

    const handleHeroSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (heroKeyword.trim()) params.append("search", heroKeyword.trim());
        if (heroListingType !== "all") params.append("listingType", heroListingType);
        if (heroPropertyType !== "all") params.append("propertyType", heroPropertyType);

        navigate(`/properties?${params.toString()}`);
    };

    const categories = [
        { label: "Apartments", value: "apartment", icon: "🏢", desc: "Modern urban flats & condos" },
        { label: "Houses", value: "house", icon: "🏡", desc: "Spacious suburban homes" },
        { label: "Villas", value: "villa", icon: "🏰", desc: "Luxury retreats & estates" },
        { label: "Commercial", value: "commercial", icon: "🏪", desc: "Offices & retail spaces" },
        { label: "Land", value: "land", icon: "🌱", desc: "Residential & farm plots" },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* 1. Hero Section */}
            <section className="relative bg-slate-900 text-white py-16 sm:py-24 px-4 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="relative max-w-5xl mx-auto text-center">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 bg-blue-900/50 px-3 py-1 rounded-full border border-blue-700/50">
                        The Trusted Real Estate Marketplace
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-4 mb-4">
                        Find a Place You'll Love to Call Home
                    </h1>
                    <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base mb-8">
                        Discover verified residential and commercial properties for sale or rent.
                        Direct contact with verified owners and transparent moderation.
                    </p>

                    {/* Search Widget */}
                    <div className="bg-white text-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl max-w-4xl mx-auto border border-slate-100">
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4 border-b border-slate-100 pb-3">
                            <button
                                type="button"
                                onClick={() => setHeroListingType("all")}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    heroListingType === "all"
                                        ? "bg-slate-900 text-white shadow"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                All Properties
                            </button>
                            <button
                                type="button"
                                onClick={() => setHeroListingType("sale")}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    heroListingType === "sale"
                                        ? "bg-slate-900 text-white shadow"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                Buy
                            </button>
                            <button
                                type="button"
                                onClick={() => setHeroListingType("rent")}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    heroListingType === "rent"
                                        ? "bg-slate-900 text-white shadow"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                Rent
                            </button>
                        </div>

                        {/* Search Input Controls */}
                        <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-6 text-left">
                                <label className="text-xs font-bold text-slate-500 uppercase">Search by City or Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Miami, Downtown, Villa..."
                                    value={heroKeyword}
                                    onChange={(e) => setHeroKeyword(e.target.value)}
                                    className="w-full text-sm font-medium border border-slate-200 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                />
                            </div>

                            <div className="sm:col-span-4 text-left">
                                <label className="text-xs font-bold text-slate-500 uppercase">Property Type</label>
                                <select
                                    value={heroPropertyType}
                                    onChange={(e) => setHeroPropertyType(e.target.value)}
                                    className="w-full text-sm font-medium border border-slate-200 rounded-lg p-2.5 mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    <option value="all">All Types</option>
                                    <option value="apartment">Apartments</option>
                                    <option value="house">Houses</option>
                                    <option value="villa">Villas</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="land">Land</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2 sm:self-end">
                                <Button type="submit" variant="primary" className="w-full py-2.5">
                                    Search
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* 2. Property Categories */}
            <section className="py-12 px-4 max-w-6xl mx-auto w-full">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">Explore by Property Type</h2>
                    <p className="text-slate-500 text-sm mt-1">Browse our verified marketplace by category</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {categories.map((cat) => (
                        <Link
                            key={cat.value}
                            to={`/properties?propertyType=${cat.value}`}
                            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-center group flex flex-col items-center"
                        >
                            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
                            <span className="font-bold text-slate-800 text-sm">{cat.label}</span>
                            <span className="text-xs text-slate-400 mt-1">{cat.desc}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 3. Featured / Recently Added Properties */}
            <section className="py-12 px-4 bg-slate-100/60 w-full border-y border-slate-200/60">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Recently Added Listings</h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Verified listings freshly approved by our moderation team
                            </p>
                        </div>
                        <Link to="/properties" className="text-sm font-semibold text-blue-600 hover:underline">
                            View All &rarr;
                        </Link>
                    </div>

                    {loadingFeatured ? (
                        <Loader text="Loading fresh listings..." />
                    ) : featuredProperties.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl text-center border border-dashed border-slate-300">
                            <p className="text-slate-500 text-sm">No approved properties published yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredProperties.map((prop) => (
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
                    )}
                </div>
            </section>

            {/* 4. Owner Call to Action Banner */}
            <section className="py-16 px-4 max-w-6xl mx-auto w-full">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
                    <div className="max-w-xl text-center sm:text-left">
                        <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                            Partner with RealEstateHub
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 mb-2">
                            Are you a Property Owner or Real Estate Agent?
                        </h2>
                        <p className="text-slate-300 text-sm">
                            Publish your listings directly to verified buyers and renters. Manage your inquiries,
                            track viewing requests, and close deals effortlessly.
                        </p>
                    </div>
                    <Link to="/owner/create-property">
                        <button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-lg shadow-md transition-colors whitespace-nowrap text-sm">
                            List Your Property Today
                        </button>
                    </Link>
                </div>
            </section>
        </div>
    );
}

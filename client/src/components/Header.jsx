import React, { useState } from "react";
import { FaSearch, FaHeart } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Header() {
    const { currentUser } = useSelector((state) => state.user);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/properties?search=${encodeURIComponent(searchTerm.trim())}`);
        } else {
            navigate("/properties");
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case "admin":
                return (
                    <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1">
                        Admin
                    </span>
                );
            case "owner":
                return (
                    <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1">
                        Owner
                    </span>
                );
            case "customer":
                return (
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1">
                        Customer
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
            <div className="flex justify-between items-center max-w-7xl mx-auto p-3 sm:px-6">
                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-1">
                    <h1 className="font-bold text-base sm:text-2xl flex flex-wrap tracking-tight">
                        <span className="text-slate-500">Real</span>
                        <span className="text-slate-800">EstateHub</span>
                    </h1>
                </Link>

                {/* Search Bar */}
                <form
                    onSubmit={handleSearchSubmit}
                    className="bg-slate-100 px-3 py-1.5 sm:py-2 rounded-full flex items-center border border-slate-200 focus-within:ring-2 focus-within:ring-slate-400"
                >
                    <input
                        type="text"
                        placeholder="Search city, area, title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent focus:outline-none w-28 sm:w-64 text-xs sm:text-sm"
                    />
                    <button type="submit" className="text-slate-500 hover:text-slate-800 ml-1">
                        <FaSearch className="text-xs sm:text-sm" />
                    </button>
                </form>

                {/* Navigation Links */}
                <ul className="flex items-center gap-3 sm:gap-5 font-medium text-xs sm:text-sm">
                    <Link to="/properties" className="text-slate-700 hover:text-slate-900 transition-colors">
                        Browse
                    </Link>

                    {/* Customer Favorites link */}
                    {currentUser && (
                        <Link
                            to="/favorites"
                            className="text-slate-700 hover:text-red-500 flex items-center gap-1 transition-colors"
                            title="My Saved Favorites"
                        >
                            <FaHeart className="text-red-500" />
                            <span className="hidden md:inline">Favorites</span>
                        </Link>
                    )}

                    {/* Owner Links */}
                    {currentUser && (currentUser.role === "owner" || currentUser.role === "admin") && (
                        <>
                            <Link
                                to="/owner/properties"
                                className="text-slate-700 hover:text-slate-900 transition-colors hidden md:inline"
                            >
                                My Listings
                            </Link>
                            <Link
                                to="/owner/create-property"
                                className="text-emerald-700 hover:text-emerald-800 font-semibold hidden sm:inline"
                            >
                                + Add Property
                            </Link>
                        </>
                    )}

                    {/* Admin Moderation Link */}
                    {currentUser && currentUser.role === "admin" && (
                        <Link
                            to="/admin/properties"
                            className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                            🛡️ Moderation
                        </Link>
                    )}

                    {/* User Profile or Sign In */}
                    {currentUser ? (
                        <Link to="/profile" className="flex items-center gap-2 hover:opacity-90">
                            <img
                                src={currentUser.avatar}
                                alt="avatar"
                                className="rounded-full h-8 w-8 object-cover border border-slate-300"
                            />
                            <div className="hidden sm:flex items-center">
                                <span className="text-slate-800 max-w-[90px] truncate">{currentUser.username}</span>
                                {getRoleBadge(currentUser.role)}
                            </div>
                        </Link>
                    ) : (
                        <Link
                            to="/signIn"
                            className="bg-slate-800 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-slate-700 transition-colors text-xs sm:text-sm"
                        >
                            Sign In
                        </Link>
                    )}
                </ul>
            </div>
        </header>
    );
}

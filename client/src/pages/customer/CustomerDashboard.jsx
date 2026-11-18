import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../../services/apiClient";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function CustomerDashboard() {
    const { currentUser } = useSelector((state) => state.user);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCustomerStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get("/users/customer/stats");
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (err) {
            setError(err.message || "Failed to load customer statistics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomerStats();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <Alert type="error" message={error} />
            </div>
        );
    }

    const { favorites, inquiries, appointments, reports } = stats || {};

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <img
                        src={currentUser?.avatar}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-300 shadow-sm"
                    />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                            Welcome back, {currentUser?.fullName || currentUser?.username}!
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Manage your saved properties, inquiries, and viewing requests from your personal dashboard.
                        </p>
                    </div>
                </div>
                <Link
                    to="/properties"
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-sm self-start sm:self-auto"
                >
                    🔍 Discover Listings
                </Link>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Favorites Card */}
                <Link
                    to="/favorites"
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-red-500 transition-colors">
                            Saved Favorites
                        </span>
                        <span className="text-xl">❤️</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-800">
                        {favorites || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-blue-600 font-semibold flex items-center justify-between">
                        <span>Browse saved properties</span>
                        <span>→</span>
                    </div>
                </Link>

                {/* Inquiries Card */}
                <Link
                    to="/inquiries"
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-500 transition-colors">
                            Sent Inquiries
                        </span>
                        <span className="text-xl">💬</span>
                    </div>
                    <div className="text-3xl font-extrabold text-blue-600">
                        {inquiries || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-blue-600 font-semibold flex items-center justify-between">
                        <span>View owner responses</span>
                        <span>→</span>
                    </div>
                </Link>

                {/* Appointments Card */}
                <Link
                    to="/appointments"
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-500 transition-colors">
                            Viewing Requests
                        </span>
                        <span className="text-xl">📅</span>
                    </div>
                    <div className="text-3xl font-extrabold text-indigo-600">
                        {appointments?.total || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span>
                            Pending: <strong className="text-amber-600">{appointments?.pending || 0}</strong>
                        </span>
                        <span className="text-blue-600 font-semibold">View →</span>
                    </div>
                </Link>

                {/* Reports Card */}
                <Link
                    to="/my-reports"
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-orange-500 transition-colors">
                            My Reports
                        </span>
                        <span className="text-xl">🚩</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-700">
                        {reports || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-blue-600 font-semibold flex items-center justify-between">
                        <span>Track report statuses</span>
                        <span>→</span>
                    </div>
                </Link>
            </div>

            {/* Quick Actions & Navigation */}
            <h2 className="text-lg font-bold text-slate-800 mb-4">My Account Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Profile Card */}
                <Link
                    to="/profile"
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all flex items-start gap-4"
                >
                    <span className="text-3xl">👤</span>
                    <div>
                        <h3 className="font-bold text-slate-800">Account Profile</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Update your name, contact phone, avatar, or security password.
                        </p>
                    </div>
                </Link>

                {/* Favorites Card */}
                <Link
                    to="/favorites"
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all flex items-start gap-4"
                >
                    <span className="text-3xl">❤️</span>
                    <div>
                        <h3 className="font-bold text-slate-800">Saved Wishlist</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Review your saved homes, apartments, and villas.
                        </p>
                    </div>
                </Link>

                {/* Inquiries & Appointments Card */}
                <Link
                    to="/appointments"
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all flex items-start gap-4"
                >
                    <span className="text-3xl">🗓️</span>
                    <div>
                        <h3 className="font-bold text-slate-800">Viewing Schedule</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Check confirmation times and status for scheduled in-person property tours.
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}

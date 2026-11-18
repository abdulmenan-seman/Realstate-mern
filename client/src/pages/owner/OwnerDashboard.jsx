import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function OwnerDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOwnerStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get("/properties/owner/stats");
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (err) {
            setError(err.message || "Failed to load owner dashboard statistics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwnerStats();
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

    const { listings, inquiries, appointments } = stats || {};

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        🏡 Owner Management Console
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Track your property listings, approval status, customer inquiries, and viewing requests.
                    </p>
                </div>
                <Link
                    to="/owner/create-property"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-sm self-start sm:self-auto"
                >
                    + Add New Property
                </Link>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Total Listings Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Listings
                        </span>
                        <span className="text-xl">📋</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-800">
                        {listings?.total || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Available: <strong className="text-emerald-700">{listings?.available || 0}</strong></span>
                        <span>• Rented/Sold: <strong className="text-slate-700">{listings?.rentedOrSold || 0}</strong></span>
                    </div>
                </div>

                {/* Approval Review Status Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Review Status
                        </span>
                        <span className="text-xl">⏳</span>
                    </div>
                    <div className="text-3xl font-extrabold text-amber-600">
                        {listings?.pending || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Approved: <strong className="text-emerald-700">{listings?.approved || 0}</strong></span>
                        {listings?.rejected > 0 && (
                            <span>• Rejected: <strong className="text-rose-600">{listings.rejected}</strong></span>
                        )}
                    </div>
                </div>

                {/* Customer Inquiries Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Received Inquiries
                        </span>
                        <span className="text-xl">📧</span>
                    </div>
                    <div className="text-3xl font-extrabold text-blue-600">
                        {inquiries?.total || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                        <span>New & Unread: <strong className="text-blue-700 font-bold">{inquiries?.new || 0}</strong></span>
                        <Link to="/owner/inquiries" className="text-blue-600 hover:underline font-semibold">
                            Respond →
                        </Link>
                    </div>
                </div>

                {/* Viewing Appointments Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Viewing Requests
                        </span>
                        <span className="text-xl">📅</span>
                    </div>
                    <div className="text-3xl font-extrabold text-indigo-600">
                        {appointments?.total || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                        <span>Pending Action: <strong className="text-indigo-700 font-bold">{appointments?.pending || 0}</strong></span>
                        <Link to="/owner/appointments" className="text-indigo-600 hover:underline font-semibold">
                            Review →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Navigation Panels */}
            <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Management Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* My Properties */}
                <Link
                    to="/owner/properties"
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all group"
                >
                    <div className="text-3xl mb-2">🏡</div>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition">
                        My Properties
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        View, edit, change availability, or manage images for your {listings?.total || 0} listings.
                    </p>
                </Link>

                {/* Add Property */}
                <Link
                    to="/owner/create-property"
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all group"
                >
                    <div className="text-3xl mb-2">✨</div>
                    <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition">
                        Create New Listing
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Publish a new property listing with Cloudinary image upload and specs.
                    </p>
                </Link>

                {/* Inquiries */}
                <Link
                    to="/owner/inquiries"
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all group"
                >
                    <div className="text-3xl mb-2">💬</div>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition">
                        Customer Inquiries
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Read customer messages, respond with pricing or details, and close inquiries.
                    </p>
                </Link>

                {/* Appointments */}
                <Link
                    to="/owner/appointments"
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all group"
                >
                    <div className="text-3xl mb-2">🗓️</div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition">
                        Viewing Appointments
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Accept, reject, or mark viewings as completed with custom owner notes.
                    </p>
                </Link>
            </div>
        </div>
    );
}

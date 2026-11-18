import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import StatusBadge from "../../components/common/StatusBadge";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get("/admin/dashboard/stats");
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (err) {
            setError(err.message || "Failed to load admin dashboard statistics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
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

    const { users, properties, reports, recentProperties, recentUsers, recentReports } =
        stats || {};

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        🛡️ System Administration Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Real-time overview of users, listings, market activity, and moderation queues.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        to="/admin/properties"
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition shadow-sm"
                    >
                        Pending Queue ({properties?.pending || 0})
                    </Link>
                    <Link
                        to="/admin/users"
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition shadow-sm"
                    >
                        Manage Users
                    </Link>
                </div>
            </div>

            {/* Quick Overview Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Users Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Users
                        </span>
                        <span className="text-xl">👥</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-800">
                        {users?.total || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Customers: <strong className="text-slate-700">{users?.customers || 0}</strong></span>
                        <span>• Owners: <strong className="text-slate-700">{users?.owners || 0}</strong></span>
                        <span>• Admins: <strong className="text-slate-700">{users?.admins || 0}</strong></span>
                        {users?.suspended > 0 && (
                            <span className="text-rose-600 font-semibold">• Suspended: {users.suspended}</span>
                        )}
                    </div>
                </div>

                {/* Properties Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Properties
                        </span>
                        <span className="text-xl">🏡</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-800">
                        {properties?.total || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="text-amber-600 font-semibold">Pending: {properties?.pending || 0}</span>
                        <span>• Approved: <strong className="text-emerald-700">{properties?.approved || 0}</strong></span>
                        <span>• Rejected: <strong className="text-rose-700">{properties?.rejected || 0}</strong></span>
                    </div>
                </div>

                {/* Marketplace Availability Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Marketplace Status
                        </span>
                        <span className="text-xl">📊</span>
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-700">
                        {properties?.available || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Active Available: <strong className="text-emerald-700">{properties?.available || 0}</strong></span>
                        <span>• Rented: <strong className="text-slate-700">{properties?.rented || 0}</strong></span>
                        <span>• Sold: <strong className="text-slate-700">{properties?.sold || 0}</strong></span>
                    </div>
                </div>

                {/* Reports Moderation Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            User Reports
                        </span>
                        <span className="text-xl">🚩</span>
                    </div>
                    <div className="text-3xl font-extrabold text-amber-600">
                        {reports?.open || 0}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                        <span>Open & Pending Review</span>
                        <Link to="/admin/reports" className="text-blue-600 hover:underline font-semibold">
                            View All ({reports?.total || 0}) →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Links Navigation Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold">Admin Management Center</h3>
                    <p className="text-slate-400 text-sm mt-1">
                        Access moderation tools, review pending listings, manage registered users, and inspect reports.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link
                        to="/admin/properties"
                        className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
                    >
                        📋 Property Moderation
                    </Link>
                    <Link
                        to="/admin/users"
                        className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
                    >
                        👥 User Accounts
                    </Link>
                    <Link
                        to="/admin/reports"
                        className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
                    >
                        🚩 Moderation Reports
                    </Link>
                </div>
            </div>

            {/* Split Content: Recent Properties & Recent Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Recent Property Submissions */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">
                            Recent Property Submissions
                        </h2>
                        <Link
                            to="/admin/properties"
                            className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                            View all →
                        </Link>
                    </div>

                    {!recentProperties || recentProperties.length === 0 ? (
                        <p className="text-slate-400 text-sm py-4 italic">No properties registered yet.</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recentProperties.map((prop) => (
                                <div key={prop._id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <Link
                                            to={`/properties/${prop._id}`}
                                            className="text-sm font-semibold text-slate-800 hover:text-blue-600 truncate block"
                                        >
                                            {prop.title}
                                        </Link>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {prop.location?.city} • {Number(prop.price).toLocaleString()} {prop.currency} • Owner:{" "}
                                            <span className="text-slate-700 font-medium">
                                                {prop.owner?.username || "Unknown"}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <StatusBadge status={prop.approvalStatus} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent User Registrations */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">
                            Recent User Registrations
                        </h2>
                        <Link
                            to="/admin/users"
                            className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                            View all →
                        </Link>
                    </div>

                    {!recentUsers || recentUsers.length === 0 ? (
                        <p className="text-slate-400 text-sm py-4 italic">No users registered yet.</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recentUsers.map((user) => (
                                <div key={user._id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={user.avatar}
                                            alt={user.username}
                                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                {user.fullName || user.username}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                            user.role === "admin"
                                                ? "bg-red-100 text-red-800"
                                                : user.role === "owner"
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-blue-100 text-blue-800"
                                        }`}>
                                            {user.role}
                                        </span>
                                        {user.accountStatus === "suspended" && (
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                                                Suspended
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Reports Preview */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">
                        Recent Property Reports
                    </h2>
                    <Link
                        to="/admin/reports"
                        className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                        Open Moderation Console →
                    </Link>
                </div>

                {!recentReports || recentReports.length === 0 ? (
                    <p className="text-slate-400 text-sm py-4 italic">No reports submitted.</p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {recentReports.map((report) => (
                            <div key={report._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {report.property?.title || "Property Listing"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Reported by: <span className="font-medium text-slate-700">{report.reporter?.username}</span> • Reason:{" "}
                                        <span className="text-orange-700 font-semibold">{report.reason}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={report.status} />
                                    <Link
                                        to="/admin/reports"
                                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded transition"
                                    >
                                        Moderate
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

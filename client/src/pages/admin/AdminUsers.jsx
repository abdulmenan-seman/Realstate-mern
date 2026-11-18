import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [actionNotice, setActionNotice] = useState(null);

    // Modal States
    const [activeUser, setActiveUser] = useState(null);
    const [modalType, setModalType] = useState(null); // 'status' | 'role'
    const [selectedRole, setSelectedRole] = useState("customer");
    const [modalSubmitting, setModalSubmitting] = useState(false);
    const [modalError, setModalError] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            let url = `/admin/users?page=${page}&limit=15`;
            if (roleFilter !== "all") url += `&role=${roleFilter}`;
            if (statusFilter !== "all") url += `&accountStatus=${statusFilter}`;
            if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;

            const res = await apiClient.get(url);
            if (res.success) {
                setUsers(Array.isArray(res.data) ? res.data : []);
                if (res.meta) setMeta(res.meta);
            }
        } catch (err) {
            setError(err.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [roleFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [roleFilter, statusFilter, page, searchTerm]);

    const openStatusModal = (user) => {
        setActiveUser(user);
        setModalType("status");
        setModalError(null);
    };

    const openRoleModal = (user) => {
        setActiveUser(user);
        setSelectedRole(user.role);
        setModalType("role");
        setModalError(null);
    };

    const closeModal = () => {
        setActiveUser(null);
        setModalType(null);
        setModalError(null);
    };

    const handleStatusToggle = async () => {
        if (!activeUser) return;
        try {
            setModalSubmitting(true);
            setModalError(null);
            const newStatus = activeUser.accountStatus === "active" ? "suspended" : "active";
            const res = await apiClient.patch(`/admin/users/${activeUser._id}/status`, {
                accountStatus: newStatus,
            });

            if (res.success) {
                setActionNotice(res.message);
                setTimeout(() => setActionNotice(null), 5000);
                closeModal();
                fetchUsers();
            }
        } catch (err) {
            setModalError(err.message || "Failed to update user account status.");
        } finally {
            setModalSubmitting(false);
        }
    };

    const handleRoleUpdate = async () => {
        if (!activeUser) return;
        try {
            setModalSubmitting(true);
            setModalError(null);
            const res = await apiClient.patch(`/admin/users/${activeUser._id}/role`, {
                role: selectedRole,
            });

            if (res.success) {
                setActionNotice(res.message);
                setTimeout(() => setActionNotice(null), 5000);
                closeModal();
                fetchUsers();
            }
        } catch (err) {
            setModalError(err.message || "Failed to update user role.");
        } finally {
            setModalSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        👥 User Management
                    </h1>
                    <p className="text-slate-500 mt-1">
                        View registered users, manage authorization roles, and toggle account statuses.
                    </p>
                </div>
            </div>

            {/* Notification Alert */}
            {actionNotice && (
                <div className="mb-4">
                    <Alert type="success" message={actionNotice} />
                </div>
            )}

            {/* Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* Search Input */}
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by name, username, email, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
                    />
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Role:</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none bg-white"
                    >
                        <option value="all">All Roles</option>
                        <option value="customer">Customer</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none bg-white"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Loading */}
            {loading && <Loader />}

            {/* Error */}
            {error && !loading && (
                <Alert type="error" message={error} />
            )}

            {/* Empty State */}
            {!loading && !error && users.length === 0 && (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-5xl mb-3">👤</p>
                    <h3 className="text-lg font-semibold text-slate-700">No users found</h3>
                    <p className="text-slate-500 mt-1 text-sm">
                        No user accounts match the current filter criteria.
                    </p>
                </div>
            )}

            {/* Users Table */}
            {!loading && !error && users.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4">User</th>
                                    <th className="py-3 px-4">Contact</th>
                                    <th className="py-3 px-4">Role</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Joined</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/60 transition-colors">
                                        {/* Avatar & Names */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.avatar}
                                                    alt={user.username}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 truncate">
                                                        {user.fullName || user.username}
                                                    </p>
                                                    <p className="text-xs text-slate-400">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email & Phone */}
                                        <td className="py-3 px-4">
                                            <p className="text-slate-700">{user.email}</p>
                                            <p className="text-xs text-slate-400">{user.phone || "No phone"}</p>
                                        </td>

                                        {/* Role Badge */}
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                user.role === "admin"
                                                    ? "bg-red-100 text-red-800 border border-red-200"
                                                    : user.role === "owner"
                                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                user.accountStatus === "active"
                                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                    : "bg-rose-100 text-rose-800 border border-rose-200"
                                            }`}>
                                                {user.accountStatus}
                                            </span>
                                        </td>

                                        {/* Registered Date */}
                                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openRoleModal(user)}
                                                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1.5 rounded transition"
                                                >
                                                    Change Role
                                                </button>
                                                <button
                                                    onClick={() => openStatusModal(user)}
                                                    className={`text-xs font-medium px-2.5 py-1.5 rounded transition ${
                                                        user.accountStatus === "active"
                                                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                                    }`}
                                                >
                                                    {user.accountStatus === "active" ? "Suspend" : "Reactivate"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!loading && meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        ← Previous
                    </button>
                    <span className="text-sm text-slate-500">
                        Page {meta.page} of {meta.totalPages} ({meta.total} total users)
                    </span>
                    <button
                        disabled={page >= meta.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Suspend / Reactivate Confirmation Modal */}
            {modalType === "status" && activeUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">
                            {activeUser.accountStatus === "active" ? "Suspend User Account" : "Reactivate User Account"}
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Are you sure you want to{" "}
                            <strong>{activeUser.accountStatus === "active" ? "suspend" : "reactivate"}</strong> the account of{" "}
                            <span className="font-semibold text-slate-800">
                                {activeUser.fullName || activeUser.username}
                            </span>{" "}
                            ({activeUser.email})?
                            {activeUser.accountStatus === "active" && (
                                <span className="block mt-2 text-rose-600 text-xs font-semibold">
                                    Suspended users will be blocked from signing in to the platform.
                                </span>
                            )}
                        </p>

                        {modalError && (
                            <div className="mb-4">
                                <Alert type="error" message={modalError} />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleStatusToggle}
                                disabled={modalSubmitting}
                                className={`flex-1 text-white text-sm ${
                                    activeUser.accountStatus === "active"
                                        ? "bg-rose-600 hover:bg-rose-700"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                            >
                                {modalSubmitting
                                    ? "Updating..."
                                    : activeUser.accountStatus === "active"
                                    ? "Confirm Suspension"
                                    : "Confirm Reactivation"}
                            </Button>
                            <Button
                                onClick={closeModal}
                                disabled={modalSubmitting}
                                className="flex-1 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 text-sm"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Role Modal */}
            {modalType === "role" && activeUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">
                            Change User Role
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Select a new access role for{" "}
                            <span className="font-semibold text-slate-800">
                                {activeUser.fullName || activeUser.username}
                            </span>:
                        </p>

                        <div className="space-y-2 mb-4">
                            {["customer", "owner", "admin"].map((role) => (
                                <label
                                    key={role}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                                        selectedRole === role
                                            ? "border-slate-800 bg-slate-50 font-semibold text-slate-900"
                                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="userRole"
                                        value={role}
                                        checked={selectedRole === role}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="text-slate-800 focus:ring-slate-500"
                                    />
                                    <span className="capitalize">{role}</span>
                                </label>
                            ))}
                        </div>

                        {modalError && (
                            <div className="mb-4">
                                <Alert type="error" message={modalError} />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleRoleUpdate}
                                disabled={modalSubmitting || selectedRole === activeUser.role}
                                className="flex-1 bg-slate-800 text-white hover:bg-slate-700 text-sm"
                            >
                                {modalSubmitting ? "Updating..." : "Update Role"}
                            </Button>
                            <Button
                                onClick={closeModal}
                                disabled={modalSubmitting}
                                className="flex-1 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 text-sm"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

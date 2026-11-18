import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "reviewed", label: "Reviewed" },
    { key: "resolved", label: "Resolved" },
    { key: "dismissed", label: "Dismissed" },
];

const REASON_LABELS = {
    suspicious_listing: "Suspicious Listing",
    incorrect_information: "Incorrect Information",
    duplicate_listing: "Duplicate Listing",
    inappropriate_content: "Inappropriate Content",
    other: "Other",
};

export default function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [actionNotice, setActionNotice] = useState(null);

    // Moderation Modal State
    const [activeReport, setActiveReport] = useState(null);
    const [modalAction, setModalAction] = useState("reviewed"); // reviewed | resolved | dismissed
    const [adminNote, setAdminNote] = useState("");
    const [actionOnProperty, setActionOnProperty] = useState("none"); // none | reject | archive
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState(null);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);
            let url = `/admin/reports?page=${page}&limit=15`;
            if (statusFilter !== "all") {
                url += `&status=${statusFilter}`;
            }
            if (searchTerm.trim()) {
                url += `&search=${encodeURIComponent(searchTerm.trim())}`;
            }
            const res = await apiClient.get(url);
            if (res.success) {
                setReports(Array.isArray(res.data) ? res.data : []);
                if (res.meta) setMeta(res.meta);
            }
        } catch (err) {
            setError(err.message || "Failed to load reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReports();
        }, 300);
        return () => clearTimeout(timer);
    }, [statusFilter, page, searchTerm]);

    const openModal = (report, action = "reviewed") => {
        setActiveReport(report);
        setModalAction(action);
        setAdminNote(report.adminNote || "");
        setActionOnProperty("none");
        setModalError(null);
    };

    const closeModal = () => {
        setActiveReport(null);
        setAdminNote("");
        setActionOnProperty("none");
        setModalError(null);
    };

    const handleModerate = async () => {
        if (!activeReport) return;
        try {
            setSubmitting(true);
            setModalError(null);
            const payload = { status: modalAction };
            if (adminNote.trim()) {
                payload.adminNote = adminNote.trim();
            }
            if (modalAction === "resolved" && actionOnProperty !== "none") {
                payload.actionOnProperty = actionOnProperty;
            }
            const res = await apiClient.patch(
                `/admin/reports/${activeReport._id}`,
                payload
            );
            if (res.success) {
                setActionNotice(res.message || `Report marked as '${modalAction}'.`);
                setTimeout(() => setActionNotice(null), 5000);
                closeModal();
                fetchReports();
            }
        } catch (err) {
            setModalError(err.message || "Failed to update report.");
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to get property image
    const getPropertyImage = (property) => {
        if (!property) return null;
        if (property.images && property.images.length > 0) {
            const cover = property.images.find((img) => img.isCover);
            return (cover || property.images[0]).secureUrl || (cover || property.images[0]).url;
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        🛡️ Report Moderation
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Review, investigate, and moderate property reports submitted by users.
                    </p>
                </div>
                {/* Search Bar */}
                <div className="w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Search reports or property..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
                    />
                </div>
            </div>

            {/* Action Notice */}
            {actionNotice && (
                <div className="mb-4">
                    <Alert type="success" message={actionNotice} />
                </div>
            )}

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-3">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            statusFilter === tab.key
                                ? "bg-slate-800 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {loading && <Loader />}

            {/* Error State */}
            {error && !loading && (
                <Alert type="error" message={error} />
            )}

            {/* Empty State */}
            {!loading && !error && reports.length === 0 && (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-5xl mb-3">📋</p>
                    <h3 className="text-lg font-semibold text-slate-700">
                        No reports found
                    </h3>
                    <p className="text-slate-500 mt-1 text-sm">
                        {statusFilter !== "all"
                            ? `No ${statusFilter} reports at this time.`
                            : "No property reports matching your criteria."}
                    </p>
                </div>
            )}

            {/* Reports List */}
            {!loading && !error && reports.length > 0 && (
                <div className="space-y-4">
                    {reports.map((report) => {
                        const propImg = getPropertyImage(report.property);
                        return (
                            <div
                                key={report._id}
                                className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    {/* Property Thumbnail */}
                                    {propImg && (
                                        <div className="flex-shrink-0">
                                            <img
                                                src={propImg}
                                                alt="Property"
                                                className="w-full md:w-28 h-20 object-cover rounded-lg border border-slate-200"
                                            />
                                        </div>
                                    )}

                                    {/* Report Details */}
                                    <div className="flex-1 min-w-0">
                                        {/* Top Row */}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                            <StatusBadge status={report.status} />
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                {REASON_LABELS[report.reason] || report.reason}
                                            </span>
                                            {report.property?.isArchived && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                                    Archived
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-400 ml-auto">
                                                {new Date(report.createdAt).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>

                                        {/* Property Title */}
                                        {report.property ? (
                                            <Link
                                                to={`/properties/${report.property._id}`}
                                                className="text-base font-semibold text-slate-800 hover:text-blue-700 transition-colors"
                                            >
                                                {report.property.title}
                                            </Link>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">
                                                Property not available
                                            </p>
                                        )}

                                        {/* Property Location & Price */}
                                        {report.property && (
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {report.property.location?.city && (
                                                    <span>📍 {report.property.location.city}</span>
                                                )}
                                                {report.property.price && (
                                                    <span className="ml-3">
                                                        💰 {Number(report.property.price).toLocaleString()}{" "}
                                                        {report.property.currency || "USD"}
                                                    </span>
                                                )}
                                            </p>
                                        )}

                                        {/* Reporter */}
                                        {report.reporter && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                👤 Reported by:{" "}
                                                <span className="font-medium text-slate-700">
                                                    {report.reporter.fullName || report.reporter.username}
                                                </span>
                                                <span className="ml-2 text-slate-400">
                                                    ({report.reporter.email})
                                                </span>
                                            </p>
                                        )}

                                        {/* Description */}
                                        {report.description && (
                                            <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                "{report.description}"
                                            </p>
                                        )}

                                        {/* Admin Note (if already moderated) */}
                                        {report.adminNote && (
                                            <div className="mt-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                <p className="text-xs font-semibold text-blue-700 mb-1">
                                                    Admin Note:
                                                </p>
                                                <p className="text-sm text-blue-800">{report.adminNote}</p>
                                            </div>
                                        )}

                                        {/* Reviewed Info */}
                                        {report.reviewedBy && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                Moderated by {report.reviewedBy.fullName || report.reviewedBy.username}{" "}
                                                on{" "}
                                                {new Date(report.reviewedAt).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                                        {report.status === "open" && (
                                            <>
                                                <Button
                                                    onClick={() => openModal(report, "reviewed")}
                                                    className="text-xs bg-blue-600 text-white hover:bg-blue-700"
                                                >
                                                    Mark Reviewed
                                                </Button>
                                                <Button
                                                    onClick={() => openModal(report, "resolved")}
                                                    className="text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                                                >
                                                    Resolve
                                                </Button>
                                                <Button
                                                    onClick={() => openModal(report, "dismissed")}
                                                    className="text-xs bg-slate-500 text-white hover:bg-slate-600"
                                                >
                                                    Dismiss
                                                </Button>
                                            </>
                                        )}
                                        {report.status === "reviewed" && (
                                            <>
                                                <Button
                                                    onClick={() => openModal(report, "resolved")}
                                                    className="text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                                                >
                                                    Resolve
                                                </Button>
                                                <Button
                                                    onClick={() => openModal(report, "dismissed")}
                                                    className="text-xs bg-slate-500 text-white hover:bg-slate-600"
                                                >
                                                    Dismiss
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                        Page {meta.page} of {meta.totalPages} ({meta.total} total)
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

            {/* Moderation Modal */}
            {activeReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                            {modalAction === "reviewed" && "Mark as Reviewed"}
                            {modalAction === "resolved" && "Resolve Report"}
                            {modalAction === "dismissed" && "Dismiss Report"}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Report on:{" "}
                            <span className="font-medium text-slate-700">
                                {activeReport.property?.title || "Unknown Property"}
                            </span>
                        </p>

                        {/* Reason Display */}
                        <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 mb-1">Reason</p>
                            <p className="text-sm text-slate-700">
                                {REASON_LABELS[activeReport.reason] || activeReport.reason}
                            </p>
                            {activeReport.description && (
                                <p className="text-sm text-slate-600 mt-1 italic">
                                    "{activeReport.description}"
                                </p>
                            )}
                        </div>

                        {/* Optional Property Moderation Action for Resolution */}
                        {modalAction === "resolved" && activeReport.property && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Action on Property Listing:
                                </label>
                                <select
                                    value={actionOnProperty}
                                    onChange={(e) => setActionOnProperty(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
                                >
                                    <option value="none">Keep property as is (Report resolved without listing action)</option>
                                    <option value="reject">Reject listing (Set approvalStatus to rejected)</option>
                                    <option value="archive">Archive listing (Remove completely from public visibility)</option>
                                </select>
                            </div>
                        )}

                        {/* Admin Note Textarea */}
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Admin Note (optional)
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Add an internal note about this report..."
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none"
                        />

                        {modalError && (
                            <div className="mt-2">
                                <Alert type="error" message={modalError} />
                            </div>
                        )}

                        <div className="flex gap-3 mt-5">
                            <Button
                                onClick={handleModerate}
                                disabled={submitting}
                                className={`flex-1 text-white text-sm ${
                                    modalAction === "reviewed"
                                        ? "bg-blue-600 hover:bg-blue-700"
                                        : modalAction === "resolved"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-slate-600 hover:bg-slate-700"
                                }`}
                            >
                                {submitting ? "Processing..." : `Confirm ${modalAction.charAt(0).toUpperCase() + modalAction.slice(1)}`}
                            </Button>
                            <Button
                                onClick={closeModal}
                                disabled={submitting}
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

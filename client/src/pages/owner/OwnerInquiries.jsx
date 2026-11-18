import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function OwnerInquiries() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [actionNotice, setActionNotice] = useState(null);

    // Response Modal State
    const [activeInquiry, setActiveInquiry] = useState(null);
    const [responseText, setResponseText] = useState("");
    const [submittingResponse, setSubmittingResponse] = useState(false);
    const [modalError, setModalError] = useState(null);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            setError(null);
            let url = "/inquiries/received?limit=50";
            if (statusFilter !== "all") {
                url += `&status=${statusFilter}`;
            }
            const res = await apiClient.get(url);
            if (res.success && Array.isArray(res.data)) {
                setInquiries(res.data);
            }
        } catch (err) {
            setError(err.message || "Failed to load received inquiries.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, [statusFilter]);

    const handleOpenResponse = (inquiry) => {
        setActiveInquiry(inquiry);
        setResponseText(inquiry.ownerResponse || "");
        setModalError(null);
    };

    const handleSendResponse = async (e) => {
        e.preventDefault();
        if (!responseText.trim()) {
            setModalError("Please write a response before sending.");
            return;
        }

        try {
            setSubmittingResponse(true);
            const res = await apiClient.patch(`/inquiries/${activeInquiry._id}/status`, {
                ownerResponse: responseText.trim(),
            });

            if (res.success) {
                setActionNotice("Response sent successfully to customer.");
                setActiveInquiry(null);
                setInquiries((prev) =>
                    prev.map((i) => (i._id === activeInquiry._id ? res.inquiry : i))
                );
            }
        } catch (err) {
            setModalError(err.message || "Failed to send response.");
        } finally {
            setSubmittingResponse(false);
        }
    };

    const handleCloseInquiry = async (inquiryId) => {
        try {
            const res = await apiClient.patch(`/inquiries/${inquiryId}/status`, {
                status: "closed",
            });
            if (res.success) {
                setActionNotice("Inquiry marked as closed.");
                setInquiries((prev) =>
                    prev.map((i) => (i._id === inquiryId ? { ...i, status: "closed" } : i))
                );
            }
        } catch (err) {
            setError(err.message || "Failed to close inquiry.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Received Customer Inquiries</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage direct questions, buyer interest, and communication for your property listings.
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-6 overflow-x-auto">
                {["all", "new", "read", "responded", "closed"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`py-3 text-sm font-semibold border-b-2 whitespace-nowrap capitalize transition-colors ${
                            statusFilter === tab
                                ? "border-slate-800 text-slate-800"
                                : "border-transparent text-slate-400 hover:text-slate-700"
                        }`}
                    >
                        {tab === "all" ? "All Inquiries" : tab}
                    </button>
                ))}
            </div>

            {actionNotice && (
                <div className="mb-6">
                    <Alert type="success" message={actionNotice} onClose={() => setActionNotice(null)} />
                </div>
            )}

            {error && (
                <div className="mb-6">
                    <Alert type="error" message={error} onClose={() => setError(null)} />
                </div>
            )}

            {loading ? (
                <Loader text="Loading your received inquiries..." />
            ) : inquiries.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                    <div className="text-5xl mb-4">📥</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No Inquiries Found</h2>
                    <p className="text-slate-500 text-sm">
                        {statusFilter !== "all"
                            ? `You do not have any inquiries with status '${statusFilter}'.`
                            : "You have not received any customer inquiries yet."}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {inquiries.map((inq) => {
                        const property = inq.property;
                        const customer = inq.customer;
                        const coverImg =
                            property?.images?.[0]?.secureUrl ||
                            "https://via.placeholder.com/150?text=No+Photo";

                        return (
                            <div
                                key={inq._id}
                                className={`bg-white rounded-xl border p-5 shadow-sm transition-all flex flex-col md:flex-row gap-5 items-start justify-between ${
                                    inq.status === "new" ? "border-blue-300 bg-blue-50/10" : "border-slate-200"
                                }`}
                            >
                                {/* Property & Customer Meta */}
                                <div className="flex gap-4 items-start w-full md:w-5/12">
                                    <img
                                        src={coverImg}
                                        alt="Property"
                                        className="w-16 h-16 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                    />
                                    <div>
                                        <Link
                                            to={`/properties/${property?._id}`}
                                            className="font-bold text-slate-800 hover:text-blue-600 line-clamp-1 text-sm"
                                        >
                                            {property?.title || "Property Listing"}
                                        </Link>
                                        <div className="mt-1.5 text-xs text-slate-600">
                                            <strong>From: </strong>{customer?.fullName || customer?.username || "Interested Customer"}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            ✉️ {customer?.email || "No email"} {inq.contactPhone && `• 📞 ${inq.contactPhone}`}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <StatusBadge status={inq.status} />
                                            <span className="text-[11px] text-slate-400">
                                                {new Date(inq.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Message & Response */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 w-full text-xs">
                                    <div className="mb-2">
                                        <strong className="text-slate-700 block mb-0.5">Customer Message:</strong>
                                        <p className="text-slate-800 whitespace-pre-line bg-white p-2.5 rounded border border-slate-200">
                                            {inq.message}
                                        </p>
                                    </div>

                                    {inq.ownerResponse && (
                                        <div className="mt-2.5 p-2.5 bg-emerald-50 rounded border border-emerald-100">
                                            <strong className="text-emerald-800 block mb-0.5">Your Response:</strong>
                                            <p className="text-slate-800">{inq.ownerResponse}</p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200 justify-end">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="primary"
                                            onClick={() => handleOpenResponse(inq)}
                                        >
                                            {inq.ownerResponse ? "Edit Response" : "Reply to Customer"}
                                        </Button>

                                        {inq.status !== "closed" && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCloseInquiry(inq._id)}
                                            >
                                                Mark as Closed
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Response Modal */}
            {activeInquiry && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h2 className="text-lg font-bold text-slate-800">
                                Reply to {activeInquiry.customer?.fullName || activeInquiry.customer?.username || "Customer"}
                            </h2>
                            <button
                                onClick={() => setActiveInquiry(null)}
                                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        {modalError && (
                            <div className="mb-4">
                                <Alert type="error" message={modalError} />
                            </div>
                        )}

                        <div className="mb-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-700">
                            <strong>Inquiry on:</strong> {activeInquiry.property?.title}
                            <p className="italic mt-1">"{activeInquiry.message}"</p>
                        </div>

                        <form onSubmit={handleSendResponse} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase">Your Response *</label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="Thank you for your interest! Yes, the property is available and you can..."
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setActiveInquiry(null)}
                                    disabled={submittingResponse}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={submittingResponse}
                                    disabled={submittingResponse}
                                >
                                    {submittingResponse ? "Sending..." : "Send Response"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

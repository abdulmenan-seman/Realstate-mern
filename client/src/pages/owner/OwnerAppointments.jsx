import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function OwnerAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [actionNotice, setActionNotice] = useState(null);

    // Decision Modal State
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [decisionAction, setDecisionAction] = useState("accepted"); // accepted | rejected | completed
    const [ownerNote, setOwnerNote] = useState("");
    const [submittingDecision, setSubmittingDecision] = useState(false);
    const [modalError, setModalError] = useState(null);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            let url = "/appointments/received?limit=50";
            if (statusFilter !== "all") {
                url += `&status=${statusFilter}`;
            }
            const res = await apiClient.get(url);
            if (res.success && Array.isArray(res.data)) {
                setAppointments(res.data);
            }
        } catch (err) {
            setError(err.message || "Failed to load received appointments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [statusFilter]);

    const handleOpenDecision = (appt, action) => {
        setSelectedAppt(appt);
        setDecisionAction(action);
        setOwnerNote(appt.ownerNote || "");
        setModalError(null);
    };

    const handleConfirmDecision = async (e) => {
        e.preventDefault();
        try {
            setSubmittingDecision(true);
            setModalError(null);

            const res = await apiClient.patch(`/appointments/${selectedAppt._id}/status`, {
                status: decisionAction,
                ownerNote,
            });

            if (res.success) {
                setActionNotice(`Appointment status updated to '${decisionAction}'.`);
                setSelectedAppt(null);
                setAppointments((prev) =>
                    prev.map((a) => (a._id === selectedAppt._id ? res.appointment : a))
                );
            }
        } catch (err) {
            setModalError(err.message || "Failed to update appointment status.");
        } finally {
            setSubmittingDecision(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Viewing Appointment Requests</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage prospective buyer and tenant walkthrough requests for your properties.
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-6 overflow-x-auto">
                {["all", "pending", "accepted", "completed", "rejected", "cancelled"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`py-3 text-sm font-semibold border-b-2 whitespace-nowrap capitalize transition-colors ${
                            statusFilter === tab
                                ? "border-slate-800 text-slate-800"
                                : "border-transparent text-slate-400 hover:text-slate-700"
                        }`}
                    >
                        {tab === "all" ? "All Requests" : tab}
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
                <Loader text="Loading appointment requests..." />
            ) : appointments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                    <div className="text-5xl mb-4">📅</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No Appointment Requests</h2>
                    <p className="text-slate-500 text-sm">
                        {statusFilter !== "all"
                            ? `You do not have any requests with status '${statusFilter}'.`
                            : "You have not received any property viewing appointments yet."}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {appointments.map((appt) => {
                        const property = appt.property;
                        const customer = appt.customer;
                        const apptDate = new Date(appt.requestedDateTime);
                        const coverImg =
                            property?.images?.[0]?.secureUrl ||
                            "https://via.placeholder.com/150?text=No+Photo";

                        return (
                            <div
                                key={appt._id}
                                className={`bg-white rounded-xl border p-5 shadow-sm transition-all flex flex-col md:flex-row gap-5 items-start justify-between ${
                                    appt.status === "pending" ? "border-amber-300 bg-amber-50/10" : "border-slate-200"
                                }`}
                            >
                                {/* Property and Customer Info */}
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
                                        <div className="mt-1 text-xs text-slate-700">
                                            <strong>Requested By: </strong>{customer?.fullName || customer?.username || "Customer"}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            ✉️ {customer?.email || "No email"} {customer?.phone && `• 📞 ${customer.phone}`}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <StatusBadge status={appt.status} />
                                        </div>
                                    </div>
                                </div>

                                {/* Appointment Schedule & Actions */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 w-full text-xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                                        <span className="font-bold text-slate-900 text-sm">
                                            🕒 {apptDate.toLocaleDateString()} at {apptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>

                                    {appt.note && (
                                        <div className="mb-2">
                                            <strong className="text-slate-600 block">Customer Note:</strong>
                                            <p className="text-slate-800 italic">"{appt.note}"</p>
                                        </div>
                                    )}

                                    {appt.ownerNote && (
                                        <div className="mt-2 p-2 bg-blue-50/80 rounded border border-blue-100">
                                            <strong className="text-blue-900 block mb-0.5">Your Note to Customer:</strong>
                                            <p className="text-slate-800">{appt.ownerNote}</p>
                                        </div>
                                    )}

                                    {/* Action Buttons based on status */}
                                    <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200 justify-end">
                                        {appt.status === "pending" && (
                                            <>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="primary"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                                                    onClick={() => handleOpenDecision(appt, "accepted")}
                                                >
                                                    Accept Request
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="danger"
                                                    className="text-xs"
                                                    onClick={() => handleOpenDecision(appt, "rejected")}
                                                >
                                                    Decline
                                                </Button>
                                            </>
                                        )}

                                        {appt.status === "accepted" && (
                                            <>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="primary"
                                                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                                                    onClick={() => handleOpenDecision(appt, "completed")}
                                                >
                                                    Mark Completed
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => handleOpenDecision(appt, "rejected")}
                                                >
                                                    Cancel / Decline
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

            {/* Decision Modal */}
            {selectedAppt && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-2 capitalize">
                            {decisionAction === "accepted" ? "Accept Viewing Appointment" : decisionAction === "completed" ? "Complete Viewing Appointment" : "Decline Appointment"}
                        </h2>
                        <p className="text-xs text-slate-500 mb-4">
                            {decisionAction === "accepted"
                                ? "Confirm that you can meet the prospective buyer at the scheduled date and time."
                                : decisionAction === "completed"
                                ? "Confirm that the viewing took place."
                                : "Decline this appointment request."}
                        </p>

                        {modalError && (
                            <div className="mb-4">
                                <Alert type="error" message={modalError} />
                            </div>
                        )}

                        <form onSubmit={handleConfirmDecision} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase">Optional Note for Customer</label>
                                <textarea
                                    rows={3}
                                    placeholder={decisionAction === "accepted" ? "Looking forward to meeting you! Ring bell #4B upon arrival." : "Reason or alternative time suggestion..."}
                                    value={ownerNote}
                                    onChange={(e) => setOwnerNote(e.target.value)}
                                    className="w-full text-sm border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedAppt(null)}
                                    disabled={submittingDecision}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant={decisionAction === "rejected" ? "danger" : "primary"}
                                    loading={submittingDecision}
                                    disabled={submittingDecision}
                                >
                                    Confirm {decisionAction}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

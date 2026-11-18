import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function MyAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionNotice, setActionNotice] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get("/appointments/mine?limit=50");
            if (res.success && Array.isArray(res.data)) {
                setAppointments(res.data);
            }
        } catch (err) {
            setError(err.message || "Failed to load appointments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this viewing appointment?")) {
            return;
        }

        try {
            setCancellingId(id);
            const res = await apiClient.patch(`/appointments/${id}/cancel`);
            if (res.success) {
                setActionNotice("Appointment has been cancelled.");
                setAppointments((prev) =>
                    prev.map((a) => (a._id === id ? { ...a, status: "cancelled" } : a))
                );
            }
        } catch (err) {
            setError(err.message || "Failed to cancel appointment.");
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Viewing Appointments</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage your scheduled in-person and walkthrough property viewing requests.
                </p>
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
                <Loader text="Loading your viewing requests..." />
            ) : appointments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                    <div className="text-5xl mb-4">📅</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No Appointments Scheduled</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        Explore properties and request in-person viewing appointments directly from any listing.
                    </p>
                    <Link to="/properties">
                        <Button variant="primary">Explore Properties</Button>
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {appointments.map((appt) => {
                        const property = appt.property;
                        const coverImg =
                            property?.images?.[0]?.secureUrl ||
                            "https://via.placeholder.com/150?text=No+Photo";

                        const isEligibleToCancel = ["pending", "accepted"].includes(appt.status);
                        const apptDate = new Date(appt.requestedDateTime);

                        return (
                            <div
                                key={appt._id}
                                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col md:flex-row gap-5 items-start justify-between"
                            >
                                <div className="flex gap-4 items-start w-full md:w-auto">
                                    <img
                                        src={coverImg}
                                        alt={property?.title || "Property"}
                                        className="w-20 h-20 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                    />
                                    <div>
                                        <Link
                                            to={`/properties/${property?._id}`}
                                            className="font-bold text-slate-800 hover:text-blue-600 line-clamp-1"
                                        >
                                            {property?.title || "Property Listing"}
                                        </Link>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            📍 {property?.location?.city}, {property?.location?.area}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <StatusBadge status={appt.status} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 w-full text-xs">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                                        <span className="font-bold text-slate-800 text-sm">
                                            🕒 {apptDate.toLocaleDateString()} at {apptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        {isEligibleToCancel && (
                                            <button
                                                type="button"
                                                onClick={() => handleCancel(appt._id)}
                                                disabled={cancellingId === appt._id}
                                                className="text-xs text-red-600 hover:text-red-800 font-semibold disabled:opacity-50"
                                            >
                                                {cancellingId === appt._id ? "Cancelling..." : "Cancel Appointment"}
                                            </button>
                                        )}
                                    </div>

                                    {appt.note && (
                                        <div className="mb-2">
                                            <strong className="text-slate-600 block">Your Note:</strong>
                                            <p className="text-slate-700 italic">"{appt.note}"</p>
                                        </div>
                                    )}

                                    {appt.ownerNote && (
                                        <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-slate-800">
                                            <strong className="text-blue-800 block mb-0.5">Note from Owner:</strong>
                                            {appt.ownerNote}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

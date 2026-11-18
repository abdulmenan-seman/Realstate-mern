import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function MyInquiries() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyInquiries = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await apiClient.get("/inquiries/mine?limit=50");
                if (res.success && Array.isArray(res.data)) {
                    setInquiries(res.data);
                }
            } catch (err) {
                setError(err.message || "Failed to load inquiries.");
            } finally {
                setLoading(false);
            }
        };

        fetchMyInquiries();
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Inquiries</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Track questions and messages you have sent to property owners.
                </p>
            </div>

            {error && (
                <div className="mb-6">
                    <Alert type="error" message={error} onClose={() => setError(null)} />
                </div>
            )}

            {loading ? (
                <Loader text="Loading your inquiries..." />
            ) : inquiries.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                    <div className="text-5xl mb-4">💬</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No Inquiries Sent Yet</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        When you contact owners from property listings, your inquiry threads will appear here.
                    </p>
                    <Link to="/properties">
                        <Button variant="primary">Explore Properties</Button>
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {inquiries.map((inq) => {
                        const property = inq.property;
                        const coverImg =
                            property?.images?.[0]?.secureUrl ||
                            "https://via.placeholder.com/150?text=No+Photo";

                        return (
                            <div
                                key={inq._id}
                                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col md:flex-row gap-5 items-start justify-between"
                            >
                                {/* Property thumbnail & title */}
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
                                        <p className="text-xs font-semibold text-slate-700 mt-1">
                                            {property?.currency || "$"}{property?.price?.toLocaleString()}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <StatusBadge status={inq.status} />
                                            <span className="text-[11px] text-slate-400">
                                                Sent on {new Date(inq.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Message conversation summary */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 w-full text-xs">
                                    <div className="mb-2">
                                        <strong className="text-slate-700 block mb-0.5">Your Message:</strong>
                                        <p className="text-slate-600 italic">"{inq.message}"</p>
                                    </div>

                                    {inq.ownerResponse ? (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <div className="flex items-center justify-between mb-1">
                                                <strong className="text-emerald-700 font-bold">
                                                    Response from Owner ({inq.owner?.fullName || inq.owner?.username || "Owner"}):
                                                </strong>
                                                <span className="text-[10px] text-slate-400">
                                                    {inq.respondedAt && new Date(inq.respondedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-800 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                                                {inq.ownerResponse}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic text-[11px] mt-2">
                                            Awaiting owner response...
                                        </p>
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

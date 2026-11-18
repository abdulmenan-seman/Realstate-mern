import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";

export default function MyReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await apiClient.get("/reports/mine?limit=50");
                if (res.success && Array.isArray(res.data)) {
                    setReports(res.data);
                }
            } catch (err) {
                setError(err.message || "Failed to load reports.");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const getReasonLabel = (reason) => {
        switch (reason) {
            case "suspicious_listing":
                return "Suspicious or Fraudulent Listing";
            case "incorrect_information":
                return "Incorrect Information or Photos";
            case "duplicate_listing":
                return "Duplicate Listing";
            case "inappropriate_content":
                return "Inappropriate Content";
            default:
                return "Other Issue";
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Property Reports</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Track the moderation review status of listings you reported.
                </p>
            </div>

            {error && (
                <div className="mb-6">
                    <Alert type="error" message={error} onClose={() => setError(null)} />
                </div>
            )}

            {loading ? (
                <Loader text="Loading your reported listings..." />
            ) : reports.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                    <div className="text-5xl mb-4">🛡️</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No Reports Filed</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        You have not reported any property listings.
                    </p>
                    <Link to="/properties">
                        <Button variant="primary">Browse Marketplace</Button>
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {reports.map((report) => (
                        <div
                            key={report._id}
                            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="font-bold text-base text-slate-800">
                                        {report.property?.title || "Property Listing"}
                                    </h3>
                                    <span className="text-xs text-slate-500">
                                        Reported on {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <StatusBadge status={report.status} />
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg text-xs flex flex-col gap-1.5">
                                <div>
                                    <strong className="text-slate-700">Reason: </strong>
                                    <span className="text-slate-900 font-medium">
                                        {getReasonLabel(report.reason)}
                                    </span>
                                </div>
                                {report.description && (
                                    <div>
                                        <strong className="text-slate-700">Your Explanation: </strong>
                                        <span className="text-slate-600 italic">"{report.description}"</span>
                                    </div>
                                )}
                            </div>

                            {report.adminNote && (
                                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-900">
                                    <strong className="block font-bold mb-0.5">Moderator Resolution Note:</strong>
                                    {report.adminNote}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

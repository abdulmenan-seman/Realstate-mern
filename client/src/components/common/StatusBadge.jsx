import React from "react";

export default function StatusBadge({ status, type = "default" }) {
    if (!status) return null;

    const normalized = status.toLowerCase();

    const styles = {
        // Inquiries
        new: "bg-blue-100 text-blue-800 border-blue-200",
        read: "bg-slate-100 text-slate-700 border-slate-200",
        responded: "bg-emerald-100 text-emerald-800 border-emerald-200",
        closed: "bg-zinc-100 text-zinc-600 border-zinc-200",

        // Appointments
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
        rejected: "bg-rose-100 text-rose-800 border-rose-200",
        cancelled: "bg-slate-100 text-slate-600 border-slate-200",
        completed: "bg-indigo-100 text-indigo-800 border-indigo-200",

        // Reports
        open: "bg-amber-100 text-amber-800 border-amber-200",
        reviewed: "bg-blue-100 text-blue-800 border-blue-200",
        resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
        dismissed: "bg-slate-100 text-slate-600 border-slate-200",

        // Properties
        approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
        available: "bg-blue-100 text-blue-800 border-blue-200",
        rented: "bg-purple-100 text-purple-800 border-purple-200",
        sold: "bg-slate-100 text-slate-800 border-slate-200",
    };

    const currentStyle = styles[normalized] || "bg-slate-100 text-slate-700 border-slate-200";

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${currentStyle}`}
        >
            {normalized.replace("_", " ")}
        </span>
    );
}

import React from "react";

export default function Alert({ type = "error", message, onClose }) {
    if (!message) return null;

    const styles = {
        error: "bg-red-50 border-red-200 text-red-700",
        success: "bg-green-50 border-green-200 text-green-700",
        warning: "bg-amber-50 border-amber-200 text-amber-700",
        info: "bg-blue-50 border-blue-200 text-blue-700",
    };

    return (
        <div
            className={`border rounded-lg p-3 text-sm flex items-start justify-between gap-2 transition-all ${
                styles[type] || styles.error
            }`}
        >
            <div className="flex-1 font-medium">{message}</div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="text-current opacity-70 hover:opacity-100 font-bold ml-2"
                >
                    &times;
                </button>
            )}
        </div>
    );
}

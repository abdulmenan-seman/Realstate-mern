import React from "react";

export default function Loader({ size = "md", text = "Loading..." }) {
    const sizeClasses = {
        sm: "h-5 w-5",
        md: "h-8 w-8",
        lg: "h-12 w-12",
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 gap-3">
            <svg
                className={`animate-spin text-slate-700 ${sizeClasses[size] || sizeClasses.md}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                ></path>
            </svg>
            {text && <p className="text-sm font-medium text-slate-600">{text}</p>}
        </div>
    );
}

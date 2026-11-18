import React from "react";

export default function Button({
    children,
    type = "button",
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    className = "",
    onClick,
    ...props
}) {
    const baseStyles =
        "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-500",
        secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-400",
        google: "bg-red-700 text-white hover:bg-red-800 focus:ring-red-500",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant] || variants.primary} ${
                sizes[size] || sizes.md
            } ${className}`}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
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
            )}
            {children}
        </button>
    );
}

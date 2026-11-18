import React from "react";

export default function Input({
    label,
    id,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    error,
    helperText,
    className = "",
    ...props
}) {
    return (
        <div className="w-full flex flex-col gap-1">
            {label && (
                <label
                    htmlFor={id}
                    className="text-sm font-medium text-slate-700"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`border rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    error ? "border-red-500 focus:ring-red-400" : "border-slate-300"
                } ${className}`}
                {...props}
            />
            {error ? (
                <span className="text-xs text-red-600 font-medium">{error}</span>
            ) : helperText ? (
                <span className="text-xs text-slate-500">{helperText}</span>
            ) : null}
        </div>
    );
}

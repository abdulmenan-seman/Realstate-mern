import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-6xl font-extrabold text-slate-800 mb-2">404</h1>
            <h2 className="text-2xl font-bold text-slate-700 mb-3">Page Not Found</h2>
            <p className="text-slate-500 max-w-md mb-6">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link to="/">
                <Button variant="primary">Back to Homepage</Button>
            </Link>
        </div>
    );
}

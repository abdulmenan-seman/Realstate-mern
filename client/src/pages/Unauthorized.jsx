import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";

export default function Unauthorized() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
            <div className="bg-red-100 text-red-600 rounded-full w-16 h-16 flex items-center justify-center mb-4 text-2xl font-bold">
                403
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Access Denied</h1>
            <p className="text-slate-600 max-w-md mb-6">
                You do not have permission to access this resource. If you believe this is an error, please check your account role or contact support.
            </p>
            <Link to="/">
                <Button variant="primary">Return to Homepage</Button>
            </Link>
        </div>
    );
}

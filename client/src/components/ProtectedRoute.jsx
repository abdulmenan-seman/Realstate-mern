import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
    const { currentUser } = useSelector((state) => state.user);
    const location = useLocation();

    return currentUser ? (
        <Outlet />
    ) : (
        <Navigate to="/signIn" state={{ from: location }} replace />
    );
}

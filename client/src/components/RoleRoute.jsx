import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function RoleRoute({ allowedRoles = [] }) {
    const { currentUser } = useSelector((state) => state.user);

    if (!currentUser) {
        return <Navigate to="/signIn" replace />;
    }

    if (!allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}

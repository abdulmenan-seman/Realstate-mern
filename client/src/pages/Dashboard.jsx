import React from "react";
import { useSelector } from "react-redux";
import AdminDashboard from "./admin/AdminDashboard";
import OwnerDashboard from "./owner/OwnerDashboard";
import CustomerDashboard from "./customer/CustomerDashboard";

export default function Dashboard() {
    const { currentUser } = useSelector((state) => state.user);

    if (!currentUser) return null;

    if (currentUser.role === "admin") {
        return <AdminDashboard />;
    }

    if (currentUser.role === "owner") {
        return <OwnerDashboard />;
    }

    return <CustomerDashboard />;
}

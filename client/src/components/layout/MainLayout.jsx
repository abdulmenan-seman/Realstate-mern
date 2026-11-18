import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../Header";
import Footer from "./Footer";

export default function MainLayout() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

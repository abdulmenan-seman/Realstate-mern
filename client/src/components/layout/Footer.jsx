import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-slate-800 text-slate-300 py-8 mt-auto">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                <div>
                    <span className="font-bold text-white text-base">RealEstateHub</span>
                    <p className="text-slate-400 text-xs mt-1">
                        &copy; {new Date().getFullYear()} RealEstateHub Marketplace. All rights reserved.
                    </p>
                </div>
                <div className="flex gap-6">
                    <Link to="/" className="hover:text-white transition-colors">
                        Home
                    </Link>
                    <Link to="/about" className="hover:text-white transition-colors">
                        About
                    </Link>
                </div>
            </div>
        </footer>
    );
}

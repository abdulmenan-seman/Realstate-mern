import React from "react";
import { FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Header() {
    const { currentUser } = useSelector((state) => state.user);

    const getRoleBadge = (role) => {
        switch (role) {
            case "admin":
                return <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1">Admin</span>;
            case "owner":
                return <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1">Owner</span>;
            case "customer":
                return <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1">Customer</span>;
            default:
                return null;
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
            <div className="flex justify-between items-center max-w-6xl mx-auto p-3 sm:px-6">
                <Link to="/" className="flex items-center gap-1">
                    <h1 className="font-bold text-base sm:text-2xl flex flex-wrap tracking-tight">
                        <span className="text-slate-500">Real</span>
                        <span className="text-slate-800">EstateHub</span>
                    </h1>
                </Link>

                <form className="bg-slate-100 px-3 py-2 rounded-full flex items-center border border-slate-200 focus-within:ring-2 focus-within:ring-slate-400">
                    <input
                        type="text"
                        placeholder="Search properties..."
                        className="bg-transparent focus:outline-none w-28 sm:w-64 text-sm"
                    />
                    <FaSearch className="text-slate-500 ml-2" />
                </form>

                <ul className="flex items-center gap-4 sm:gap-6 font-medium text-sm">
                    <Link to="/" className="text-slate-700 hover:text-slate-900 transition-colors hidden sm:inline">
                        Home
                    </Link>
                    <Link to="/about" className="text-slate-700 hover:text-slate-900 transition-colors hidden sm:inline">
                        About
                    </Link>

                    {currentUser ? (
                        <Link to="/profile" className="flex items-center gap-2 hover:opacity-90">
                            <img
                                src={currentUser.avatar}
                                alt="avatar"
                                className="rounded-full h-8 w-8 object-cover border border-slate-300"
                            />
                            <div className="hidden sm:flex items-center">
                                <span className="text-slate-800 max-w-[100px] truncate">{currentUser.username}</span>
                                {getRoleBadge(currentUser.role)}
                            </div>
                        </Link>
                    ) : (
                        <Link
                            to="/signIn"
                            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                        >
                            Sign In
                        </Link>
                    )}
                </ul>
            </div>
        </header>
    );
}

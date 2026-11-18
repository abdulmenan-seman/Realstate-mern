import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "../components/OAuth.jsx";
import apiClient from "../services/apiClient.js";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";
import Alert from "../components/common/Alert.jsx";

export default function SignUp() {
    const [formData, setFormData] = useState({
        username: "",
        fullName: "",
        email: "",
        password: "",
        phone: "",
        role: "customer",
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        if (error) setError(null);
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    const handleRoleChange = (selectedRole) => {
        setFormData({
            ...formData,
            role: selectedRole,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            await apiClient.post("/auth/signup", formData);

            setSuccess("Account created successfully! Redirecting to sign in...");
            setTimeout(() => {
                navigate("/signIn");
            }, 1500);
        } catch (err) {
            setError(err.message || "Failed to create account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto my-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
                <h1 className="text-2xl sm:text-3xl text-center font-bold text-slate-800 mb-2">
                    Create an Account
                </h1>
                <p className="text-sm text-center text-slate-500 mb-6">
                    Join RealEstateHub as a customer or property owner
                </p>

                {error && (
                    <div className="mb-4">
                        <Alert type="error" message={error} onClose={() => setError(null)} />
                    </div>
                )}

                {success && (
                    <div className="mb-4">
                        <Alert type="success" message={success} />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Account Type Selection */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">I am joining as a:</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleRoleChange("customer")}
                                className={`p-3 text-sm font-medium rounded-lg border text-center transition-all ${
                                    formData.role === "customer"
                                        ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                🏠 Buyer / Renter
                                <span className="block text-[11px] opacity-80 mt-0.5">Looking for property</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRoleChange("owner")}
                                className={`p-3 text-sm font-medium rounded-lg border text-center transition-all ${
                                    formData.role === "owner"
                                        ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                🔑 Owner / Agent
                                <span className="block text-[11px] opacity-80 mt-0.5">Publishing listings</span>
                            </button>
                        </div>
                    </div>

                    <Input
                        id="fullName"
                        type="text"
                        label="Full Name"
                        placeholder="e.g. Alex Johnson"
                        value={formData.fullName}
                        onChange={handleChange}
                    />

                    <Input
                        id="username"
                        type="text"
                        label="Username"
                        placeholder="alexjohnson"
                        required
                        value={formData.username}
                        onChange={handleChange}
                    />

                    <Input
                        id="email"
                        type="email"
                        label="Email Address"
                        placeholder="alex@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <Input
                        id="phone"
                        type="tel"
                        label="Phone Number (Optional)"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    <Input
                        id="password"
                        type="password"
                        label="Password"
                        placeholder="At least 6 characters"
                        required
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                        className="w-full mt-2"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </Button>

                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400">or</span>
                        </div>
                    </div>

                    <OAuth />
                </form>

                <div className="flex justify-center gap-2 mt-6 text-sm">
                    <p className="text-slate-600">Already have an account?</p>
                    <Link to="/signIn" className="text-slate-800 font-semibold hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}

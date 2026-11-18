import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    signInStart,
    signInSuccess,
    signInFailure,
    clearUserError,
} from "../redux/user/userSlice.js";
import OAuth from "../components/OAuth.jsx";
import apiClient from "../services/apiClient.js";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";
import Alert from "../components/common/Alert.jsx";

export default function SignIn() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const dispatch = useDispatch();
    const { error, loading } = useSelector((state) => state.user);
    const [successMessage, setSuccessMessage] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleChange = (e) => {
        if (error) dispatch(clearUserError());
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            dispatch(signInStart());
            const data = await apiClient.post("/auth/signin", formData);

            const user = data.user || data;
            dispatch(signInSuccess(user));
            setSuccessMessage("Signed in successfully!");

            setTimeout(() => {
                navigate(from, { replace: true });
            }, 800);
        } catch (err) {
            dispatch(signInFailure(err.message || "Failed to sign in."));
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto my-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
                <h1 className="text-2xl sm:text-3xl text-center font-bold text-slate-800 mb-2">
                    Welcome Back
                </h1>
                <p className="text-sm text-center text-slate-500 mb-6">
                    Sign in to your RealEstateHub account
                </p>

                {error && (
                    <div className="mb-4">
                        <Alert
                            type="error"
                            message={error}
                            onClose={() => dispatch(clearUserError())}
                        />
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4">
                        <Alert type="success" message={successMessage} />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        id="email"
                        type="email"
                        label="Email Address"
                        placeholder="name@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <Input
                        id="password"
                        type="password"
                        label="Password"
                        placeholder="••••••••"
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
                        {loading ? "Signing In..." : "Sign In"}
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
                    <p className="text-slate-600">Don't have an account?</p>
                    <Link to="/signUp" className="text-slate-800 font-semibold hover:underline">
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
}

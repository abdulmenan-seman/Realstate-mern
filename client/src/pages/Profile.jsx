import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    updateUserStart,
    updateUserSuccess,
    updateUserFailure,
    signOutStart,
    signOutSuccess,
    signOutFailure,
} from "../redux/user/userSlice.js";
import apiClient from "../services/apiClient.js";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";
import Alert from "../components/common/Alert.jsx";

export default function Profile() {
    const { currentUser, loading, error } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: currentUser?.fullName || "",
        username: currentUser?.username || "",
        phone: currentUser?.phone || "",
        avatar: currentUser?.avatar || "",
        password: "",
    });

    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [actionError, setActionError] = useState(null);

    const handleChange = (e) => {
        setActionError(null);
        setUpdateSuccess(false);
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            dispatch(updateUserStart());
            setUpdateSuccess(false);
            setActionError(null);

            // Filter out empty password
            const payload = { ...formData };
            if (!payload.password) {
                delete payload.password;
            }

            const data = await apiClient.patch("/users/me", payload);
            const updatedUser = data.user || data;

            dispatch(updateUserSuccess(updatedUser));
            setUpdateSuccess(true);
            setFormData((prev) => ({ ...prev, password: "" }));
        } catch (err) {
            const msg = err.message || "Failed to update profile";
            dispatch(updateUserFailure(msg));
            setActionError(msg);
        }
    };

    const handleSignOut = async () => {
        try {
            dispatch(signOutStart());
            await apiClient.post("/auth/logout");
            dispatch(signOutSuccess());
            navigate("/signIn");
        } catch (err) {
            dispatch(signOutFailure(err.message || "Failed to sign out"));
        }
    };

    if (!currentUser) return null;

    return (
        <div className="p-4 max-w-xl mx-auto my-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col items-center mb-6">
                    <img
                        src={formData.avatar || currentUser.avatar}
                        alt="Profile"
                        className="rounded-full h-24 w-24 object-cover border-4 border-slate-100 shadow-sm mb-3"
                    />
                    <h1 className="text-2xl font-bold text-slate-800">
                        {currentUser.fullName || currentUser.username}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs uppercase px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-white">
                            {currentUser.role}
                        </span>
                        <span className="text-xs uppercase px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">
                            {currentUser.accountStatus || "active"}
                        </span>
                    </div>
                </div>

                {updateSuccess && (
                    <div className="mb-4">
                        <Alert type="success" message="Profile updated successfully!" />
                    </div>
                )}

                {(error || actionError) && (
                    <div className="mb-4">
                        <Alert
                            type="error"
                            message={actionError || error}
                            onClose={() => setActionError(null)}
                        />
                    </div>
                )}

                <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                    <Input
                        id="fullName"
                        type="text"
                        label="Full Name"
                        value={formData.fullName}
                        onChange={handleChange}
                    />

                    <Input
                        id="username"
                        type="text"
                        label="Username"
                        required
                        value={formData.username}
                        onChange={handleChange}
                    />

                    <Input
                        id="email"
                        type="email"
                        label="Email Address"
                        disabled
                        value={currentUser.email}
                        helperText="Email cannot be changed directly."
                    />

                    <Input
                        id="phone"
                        type="tel"
                        label="Phone Number"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    <Input
                        id="avatar"
                        type="url"
                        label="Avatar Image URL"
                        placeholder="https://example.com/avatar.jpg"
                        value={formData.avatar}
                        onChange={handleChange}
                    />

                    <Input
                        id="password"
                        type="password"
                        label="New Password (optional)"
                        placeholder="Leave blank to keep current password"
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
                        {loading ? "Updating..." : "Update Profile"}
                    </Button>
                </form>

                <div className="flex justify-between items-center border-t border-slate-200 mt-8 pt-4">
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                    >
                        Sign Out
                    </button>
                    <span className="text-xs text-slate-400">
                        Member since {new Date(currentUser.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );
}

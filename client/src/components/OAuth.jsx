import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { app } from "../firebase.js";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { signInSuccess, signInFailure } from "../redux/user/userSlice.js";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient.js";

export default function OAuth() {
    const dispatch = useDispatch();
    const [isPending, setIsPending] = useState(false);
    const navigate = useNavigate();

    const handleGoogleClick = async () => {
        if (isPending) return;
        setIsPending(true);

        try {
            const provider = new GoogleAuthProvider();
            const auth = getAuth(app);
            const result = await signInWithPopup(auth, provider);

            const data = await apiClient.post("/auth/google", {
                uid: result.user.uid,
                email: result.user.email,
                name: result.user.displayName,
                photo: result.user.photoURL,
            });

            const user = data.user || data;
            dispatch(signInSuccess(user));
            navigate("/");
        } catch (error) {
            if (error?.code === "auth/cancelled-popup-request" || error?.code === "auth/popup-closed-by-user") {
                return;
            }
            console.error("Google Sign In failed:", error);
            dispatch(signInFailure(error.message || "Google Sign In failed"));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleGoogleClick}
            type="button"
            disabled={isPending}
            className={`w-full bg-red-600 text-white p-3 rounded-lg font-medium hover:bg-red-700 transition-colors uppercase text-sm flex items-center justify-center gap-2 ${
                isPending ? "opacity-60 cursor-not-allowed" : ""
            }`}
        >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 16.033 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.47 0 2.81.53 3.85 1.41l2.36-2.36C16.89 3.535 14.69 2.5 12.24 2.5 7.02 2.5 2.76 6.76 2.76 12s4.26 9.5 9.48 9.5c5.46 0 9.1-3.84 9.1-9.26 0-.62-.06-1.22-.18-1.74h-8.92z" />
            </svg>
            {isPending ? "Connecting to Google..." : "Continue with Google"}
        </button>
    );
}

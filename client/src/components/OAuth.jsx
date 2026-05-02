import { asyncThunkCreator } from '@reduxjs/toolkit'
import {GoogleAuthProvider, getAuth, signInWithPopup} from "firebase/auth"
import { app } from '../firebase.js'
import { useDispatch } from 'react-redux'
import { useState } from 'react'
import { signInSuccess } from '../redux/user/userSlice.js'
import { useNavigate } from 'react-router-dom'

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

            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    uid: result.user.uid,
                    email: result.user.email,
                    name: result.user.displayName
                })
            });

            let data = null;
            if (res.headers.get("content-type")?.includes("application/json")) {
                const text = await res.text();
                if (text) {
                    data = JSON.parse(text);
                }
            }

            if (!res.ok) {
                throw new Error(`Google auth failed (${res.status}): ${data?.message || "empty response"}`);
            }

            if (data) {
                dispatch(signInSuccess(data));
            }
            navigate('/');
        } catch (error) {
            if (error?.code === 'auth/cancelled-popup-request') {
                return;
            }
            console.log("Google Sign In failed", error);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <button
            onClick={handleGoogleClick}
            type='button'
            disabled={isPending}
            className={`bg-red-700 text-white p-3 rounded-lg uppercase hover:opacity-95 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {isPending ? 'Opening Google...' : 'Continue with Google'}
        </button>
    )
}

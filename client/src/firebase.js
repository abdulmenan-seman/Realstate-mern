// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "realstate-mern-39c00.firebaseapp.com",
  projectId: "realstate-mern-39c00",
  storageBucket: "realstate-mern-39c00.firebasestorage.app",
  messagingSenderId: "932214298590",
  appId: "1:932214298590:web:2a2cba8d616a3faee56f4f"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
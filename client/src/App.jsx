import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/signIn" element={<SignIn />} />
                    <Route path="/signUp" element={<SignUp />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Protected Authenticated Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<Profile />} />
                    </Route>

                    {/* 404 Catch-All */}
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

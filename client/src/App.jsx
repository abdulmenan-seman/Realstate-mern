import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import MainLayout from "./components/layout/MainLayout";

// Marketplace Discovery & Details
import PropertyListPage from "./pages/properties/PropertyListPage";
import PropertyDetailsPage from "./pages/properties/PropertyDetailsPage";

// Customer Pages
import FavoritesPage from "./pages/customer/FavoritesPage";

// Owner & Admin Property Pages
import MyProperties from "./pages/owner/MyProperties";
import CreateProperty from "./pages/owner/CreateProperty";
import EditProperty from "./pages/owner/EditProperty";
import AdminProperties from "./pages/admin/AdminProperties";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    {/* Public Marketplace Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/properties" element={<PropertyListPage />} />
                    <Route path="/properties/:id" element={<PropertyDetailsPage />} />
                    <Route path="/signIn" element={<SignIn />} />
                    <Route path="/signUp" element={<SignUp />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Authenticated Customer Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/favorites" element={<FavoritesPage />} />
                    </Route>

                    {/* Owner & Admin Property Management Routes */}
                    <Route element={<RoleRoute allowedRoles={["owner", "admin"]} />}>
                        <Route path="/owner/properties" element={<MyProperties />} />
                        <Route path="/owner/create-property" element={<CreateProperty />} />
                        <Route path="/owner/edit-property/:id" element={<EditProperty />} />
                    </Route>

                    {/* Admin Moderation Routes */}
                    <Route element={<RoleRoute allowedRoles={["admin"]} />}>
                        <Route path="/admin/properties" element={<AdminProperties />} />
                    </Route>

                    {/* 404 Catch-All */}
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

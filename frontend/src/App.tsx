// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Apply from "@/pages/Apply";
import PublicLayout from "@/Layouts/PublicLayout";
import { FingerprintPage } from "@/pages/FingerprintAuth";

// Admin imports
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import ApplicationsPage from "@/pages/admin/Applications";
import FingerprintsPage from "@/pages/admin/Fingerprints";
import UsersPage from "@/pages/admin/Users";
import AnalyticsPage from "@/pages/admin/Analytics";
import SettingsPage from "@/pages/admin/Settings";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import AdminLayout from "@/Layouts/AdminLayout";

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Apply />} />
                    <Route path="/fingerprint-authentication" element={<FingerprintPage />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/" element={<AdminDashboard />} />
                    <Route path="/admin/applications" element={<ApplicationsPage />} />
                    <Route path="/admin/fingerprints" element={<FingerprintsPage />} />
                    <Route path="/admin/users" element={<UsersPage />} />
                    <Route path="/admin/analytics" element={<AnalyticsPage />} />
                    <Route path="/admin/settings" element={<SettingsPage />} />
                    <Route path="/admin/*" element={<AdminDashboard />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;

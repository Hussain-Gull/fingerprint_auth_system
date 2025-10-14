import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import Enrollment from "./pages/Enrollment";

const App: React.FC = () => {
    return (
        <Router>
            <nav className="navbar">
                <h1>Fingerprint Enrollment System</h1>
                <ul>
                    <li><Link to="/enroll">Enroll Student</Link></li>
                    <li><Link to="/admin">Admin Dashboard</Link></li>
                </ul>
            </nav>

            <main>
                <Routes>
                    <Route path="/" element={<Enrollment />} />
                    <Route path="/enroll" element={<Enrollment />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </main>
        </Router>
    );
};

export default App;

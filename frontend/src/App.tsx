// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Apply from "@/pages/Apply";
import PublicLayout from "@/components/Layouts/PublicLayout.tsx";
import {FingerprintPage} from "@/pages/FingerprintAuth.tsx";

function App() {
    return (
        <Router>
            <Routes>
                {/* Wrap routes with PublicLayout */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Apply />} />
                    <Route path="/fingerprint-authentication" element={<FingerprintPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;

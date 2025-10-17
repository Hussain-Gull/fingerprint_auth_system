import Header from "../components/Header/Header.tsx";
import AppFooter from "../components/Footer/AppFooter.tsx";
import {Outlet} from "react-router-dom";

export default function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col font-[var(--font-base)] bg-[var(--secondary)] text-[var(--dark)]">
            {/* Header */}
            <Header />

            {/* Main Content Area */}
            <main className="flex-1 w-full">
                {/* Nested routes will render here */}
                <Outlet />
            </main>

            {/* Footer */}
            <AppFooter />
        </div>
    );
}

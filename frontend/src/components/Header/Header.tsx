// src/components/Header.tsx


import NavBar from "./Navbar.tsx";
import TopBar from "./Topbar.tsx";

export default function Header() {
    return (
        <header className="w-full bg-white relative shadow-md">

            <TopBar/>

            {/* Main Navigation Area with Abstract Background */}
            <div className="relative overflow-hidden">
                {/* This div simulates the Pakist   an flag background visual effect */}
                <div
                    className="absolute inset-0 z-0 opacity-20"
                    style={{
                        // Using arbitrary value for background color
                        background: 'linear-gradient(to left, white 30%, transparent), var(--primary)',
                        clipPath: 'polygon(70% 0%, 100% 0%, 100% 100%, 50% 100%)'
                    }}
                />
                <NavBar/>
            </div>

            <div className="h-10 flex items-center bg-[var(--teal-alt)] text-white relative overflow-hidden">
                {/* Fixed Label */}
                <div className="bg-[var(--primary)] px-14 h-full flex items-center font-semibold text-sm font-normal z-10 relative">
                    Latest News:
                </div>

                {/* Moving Ticker */}
                <div className="flex-1 h-full relative overflow-hidden">
                    <div
                        className="absolute inset-0 flex items-center whitespace-nowrap text-sm ml-4 space-x-8 animate-marquee">
                        {/* Original Content */}
                        <span className="cursor-pointer hover:underline">
                            Detail Mark Sheets of Failed Candidates! Restored Failed Candidates
                      </span>
                        <span className="cursor-pointer hover:underline">
                            CE-2024 -- Number of Vacancies Allocated to Various Occupational Groups/Sel...
                        </span>
                        {/* Duplicate Content for Seamless Scroll */}
                        <span className="cursor-pointer hover:underline">
                            Detail Mark Sheets of Failed Candidates! Restored Failed Candidates
                        </span>
                        <span className="cursor-pointer hover:underline">
                            CE-2024 -- Number of Vacancies Allocated to Various Occupational Groups/Sel...
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
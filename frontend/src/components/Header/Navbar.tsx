// src/components/NavBar.tsx

import { ChevronDown } from 'lucide-react';
import React from 'react';


const NavBar: React.FC = () => {
    const navItems = [
        { label: 'Home', href: '/', dropdown: false },
        { label: 'Recruitment', href: '/recruitment', dropdown: true },
        { label: 'About FPSC', href: '/about', dropdown: true },
        { label: 'Publications', href: '/publications', dropdown: true },
        { label: 'Downloads', href: '/downloads', dropdown: false },
        { label: 'Contact', href: '/contact', dropdown: true },
    ];

    const FpscLogo = () => (
        <div className="flex items-center h-full">
            {/* Placeholder for the Logo Image */}
            <div className="w-full h-full">
                <img src="/fpsc_logo.png" alt="FPSC Logo" className="w-[165px] h-[60px] object-contain"/>
            </div>
        </div>
    );

    return (
        <nav className="h-24 flex items-center bg-white/90 relative z-10 shadow-sm">
            <div className="mx-auto w-full max-w-screen-xl px-4 flex justify-between items-center">
                <FpscLogo />
                {/* Navigation Links */}
                <ul className="hidden lg:flex space-x-8 text-[var(--dark)] text-base font-bold font-spartan">
                    {navItems.map((item) => (
                        <li key={item.label}>
                            <a
                                href={item.href}
                                className="flex items-center h-full py-2 hover:text-[var(--primary)] transition-colors cursor-pointer"
                            >
                                {item.label}
                                {item.dropdown && <ChevronDown className="w-4 h-4 ml-1 opacity-60" />}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
};

export default NavBar;
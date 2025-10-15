// src/components/TopBar.tsx

import {Mail, Phone, ChevronDown, Globe, Search} from 'lucide-react';
import React from 'react';

const TopBar: React.FC = () => {
    return (
        <div className="h-10 md:h-12 font-arial bg-[var(--primary)] flex items-center text-white text-sm px-50">
            <div className="mx-auto w-full max-w-screen-xl px-4 flex justify-end md:justify-start items-center space-x-6">

                {/* Select Language */}
                <div className="hidden md:flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                    <Globe className="w-4 h-4 mr-1" />
                    <span className='font-normal'>Select Language</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                </div>

                {/* Email Address */}
                <a
                    href="mailto:fpsc@fpsc.gov.pk"
                    className="flex items-center cursor-pointer hover:underline"
                >
                    <Mail className="w-4 h-4 mr-1" />
                    <span>fpsc@fpsc.gov.pk</span>
                </a>

                {/* Phone Number */}
                <a
                    href="tel:+92051111000248"
                    className="flex items-center cursor-pointer hover:underline"
                >
                    <Phone className="w-4 h-4 mr-1" />
                    <span>+92-051-111000248</span>
                </a>
            </div>

            {/* Apply Online & Search Buttons */}
            <div className="flex h-full items-center space-x-4">
                <button
                    className="h-9 px-6 border rounded-full transition-colors text-base font-medium whitespace-nowrap flex items-center justify-center"
                >
                    Apply Online
                </button>
                <button
                    className="h-full w-14 flex items-center justify-center bg-transparent border-l border-[var(--primary)]/50 hover:bg-white/10 transition-colors"
                >
                    <Search/>
                </button>
            </div>
        </div>
    );
};

export default TopBar;
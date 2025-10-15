import { MapPin, Phone, Mail, Twitter } from 'lucide-react';

/**
 * AppFooter Component
 * Renders a detailed, multi-column footer layout based on the provided image,
 * using the custom CSS color variables.
 */
const AppFooter = () => {
    // Tailwind classes using arbitrary values for theme colors
    const linkClasses = "text-[var(--muted)] text-sm hover:text-[var(--primary)] transition-colors duration-200 block mt-2 cursor-pointer";
    const headerClasses = "text-white font-semibold text-lg mb-4 uppercase tracking-wider";

    // Data structure mirroring the link columns in the image
    const links = {
        'Public Service Commissions': [
            'Punjab Public Service Commission',
            'Khyber Pakhtunkhwa Public Service Commission',
            'Sindh Public Service Commission',
            'Balochistan Public Service Commission',
            'Azad Jammu & Kashmir Public Service Commission'
        ],
        'FAQ': [
            'General Recruitment',
            'Competitive Examination (CSS)',
            'Psychological Assessment',
            'Curriculum and Research'
        ],
        'Quick Links': [
            'Official Email Login',
            'Tenders',
            'External Links',
            'Commission Policies'
        ]
    };

    return (
        <footer className="w-full font-spartan bg-[var(--dark-alt)] text-white mt-auto">
            <div className="max-w-7xl mx-auto p-8 md:p-12">

                {/* Main Content Grid (Links and Contact) */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-10 border-b border-[var(--dark)]/50 pb-10">

                    {/* Link Columns Wrapper */}
                    <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {/* Rendering link columns */}
                        {Object.entries(links).map(([header, items]) => (
                            <div key={header}>
                                <h4 className={headerClasses}>{header}</h4>
                                <ul>
                                    {items.map((item, index) => (
                                        <li key={index}><a href="#" className={linkClasses}>{item}</a></li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Get In Touch / Contact Column */}
                    <div className="col-span-1 md:col-span-2">
                        <h4 className={headerClasses}>Get In Touch</h4>

                        {/* Location Section */}
                        <div className="mb-6">
                            <h5 className="text-white font-medium mb-2">Location</h5>
                            <div className="flex items-start text-[var(--muted)] text-sm">
                                <MapPin size={16} className="text-[var(--primary)] mr-2 mt-1 flex-shrink-0" />
                                <span>FPSC HQs, Aga Khan Road, Sector F-5/1, Islamabad.</span>
                            </div>

                            {/* Map Placeholder */}
                            <div className="mt-4 bg-gray-700 h-32 w-full rounded-lg overflow-hidden flex items-center justify-center border border-[var(--muted)]/20">
                                <span className="text-sm text-[var(--muted)]">Map Placeholder: View larger map</span>
                            </div>
                        </div>

                        {/* Contact Section */}
                        <div className="mt-6">
                            <h5 className="text-white font-medium mb-2">Contact</h5>
                            <div className="text-[var(--muted)] text-sm space-y-2">
                                <p className="flex items-center">
                                    <Phone size={16} className="text-[var(--primary)] mr-2 flex-shrink-0" />
                                    Phone: +92-051-9205075
                                </p>
                                <p className="flex items-center">
                                    <Mail size={16} className="text-[var(--primary)] mr-2 flex-shrink-0" />
                                    Mail Us: fpsc@fpsc.gov.pk
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Copyright and Disclaimer Strip */}
            <div className="bg-slate-900 text-[var(--muted)] text-xs py-4 px-8 border-t border-[var(--dark)]/50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start space-y-3 md:space-y-0">
                        {/* Copyright */}
                        <p className="order-2 md:order-1 text-center md:text-left">
                            © 2025 <strong className="text-[var(--secondary)]">FEDERAL PUBLIC SERVICE COMMISSION</strong> All Rights Reserved.
                        </p>

                        {/* Social Icon (Twitter) */}
                        <div className="order-1 md:order-2">
                            <a href="#" aria-label="Twitter" className="text-white hover:text-[var(--primary)] transition-colors">
                                <Twitter size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="mt-4 leading-relaxed text-center md:text-left">
                        Disclaimer: Official website of FPSC is primary source of information for candidates, therefore, no claim of any candidate shall be accepted if the information intimated on FPSC website is overlooked/ignored by the candidate. Therefore, candidates are required to frequently visit FPSC's website in order to be aware of latest developments.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default AppFooter;

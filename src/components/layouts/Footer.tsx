const Footer = () => {
    return (
        <footer className="w-full border-t border-gray-200 bg-[#FAFAFA] py-1.5 text-xs text-gray-500">
            <div className="w-full px-[40px] py-1.5 flex items-center justify-between text-xs text-gray-500">

                <p>
                    © 2026 CloseExp AI System — a platform that applies AI to support the sale of near-expiry products
                </p>

                <div className="flex items-center gap-6">
                    <a href="#" className="hover:text-gray-700 transition-colors">
                        Term of Service
                    </a>
                    <span className="h-4 w-px bg-gray-300" />
                    <a href="#" className="hover:text-gray-700 transition-colors">
                        Policy
                    </a>
                    <span className="h-4 w-px bg-gray-300" />
                    <a href="#" className="hover:text-gray-700 transition-colors">
                        Help Center
                    </a>
                </div>

            </div>
        </footer>
    );
};

export default Footer;

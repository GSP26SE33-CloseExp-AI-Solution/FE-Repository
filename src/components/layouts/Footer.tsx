const Footer = () => {
    return (
        <footer className="w-full mt-auto border-t border-white/40 bg-white/60 backdrop-blur-xl text-xs text-gray-500">
            <div className="max-w-screen-xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-2">

                <p>
                    © {new Date().getFullYear()} CloseExp AI Việt Nam — Nền tảng AI hỗ trợ bán hàng cận date
                </p>

                <div className="flex items-center gap-5">
                    <a href="#" className="hover:text-green-600 transition">Điều khoản</a>
                    <a href="#" className="hover:text-green-600 transition">Chính sách</a>
                    <a href="#" className="hover:text-green-600 transition">Trung tâm trợ giúp</a>
                </div>

            </div>
        </footer>
    );
};

export default Footer;

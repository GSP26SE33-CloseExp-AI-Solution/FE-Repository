import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { breadcrumbMap } from "@/constants/breadcrumbs";
import { Bell, User } from "lucide-react";
import Logo from "@/assets/logo.png";

const Header = () => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const getBreadcrumbs = (pathname: string): string[] => {
        const match = Object.keys(breadcrumbMap)
            .sort((a, b) => b.length - a.length)
            .find((key) => pathname.startsWith(key));

        return match ? breadcrumbMap[match] : [];
    };

    const breadcrumbs = getBreadcrumbs(location.pathname);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="fixed top-0 left-0 w-full h-20 bg-white border-b border-gray-200 z-50">
            <div className="w-full h-full px-6 flex items-center">

                {/* LEFT */}
                <div className="flex items-center gap-3 w-[260px]">
                    <img src={Logo} alt="CloseExp Logo" className="w-9 h-9 object-contain" />
                    <span className="text-xl font-bold">Supermarket Staff</span>
                </div>

                {/* CENTER: Breadcrumb */}
                <div className="flex items-center gap-3 flex-1 text-gray-500 text-base">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={index} className="flex items-center gap-3">
                            {index > 0 && <span>›</span>}
                            <span className={index === breadcrumbs.length - 1 ? "text-black font-medium" : ""}>
                                {crumb}
                            </span>
                        </span>
                    ))}
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-6">
                    <span className="text-gray-500 text-lg">Coop Xtra Linh Trung</span>

                    <button className="text-gray-600 hover:text-black transition-colors">
                        <Bell size={22} />
                    </button>

                    <div className="relative" ref={ref}>
                        <button onClick={() => setOpen(!open)} className="flex items-center gap-2">
                            <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center">
                                <User size={18} />
                            </div>
                            <span className="text-lg font-medium">Nguyễn Văn A</span>
                        </button>

                        {open && (
                            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-md">
                                <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
                                    Hồ sơ
                                </button>
                                <button className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50">
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

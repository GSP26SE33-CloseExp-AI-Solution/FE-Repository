import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Box,
    BarChart3,
    User,
    Bell,
    Settings
} from "lucide-react";

const menuItems = [
    { label: "Tổng quan", path: "/supplier/dashboard", icon: LayoutDashboard },
    { label: "Sản phẩm", path: "/supplier/products", icon: Box },
    { label: "Thống kê", path: "/supplier/statistic", icon: BarChart3 },
    { label: "Hồ sơ", path: "/supplier/profile", icon: User },
    { label: "Thông báo", path: "/supplier/notification", icon: Bell },
    { label: "Cài đặt", path: "/supplier/setting", icon: Settings },
];

const Sidebar = () => {
    return (
        <aside className="w-fit min-w-[190px] bg-white/70 backdrop-blur-xl border-r border-white/40 pt-24 px-2">

            <p className="px-3 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Danh mục
            </p>

            <nav className="flex flex-col gap-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                                ${isActive
                                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow"
                                    : "text-gray-600 hover:bg-white hover:shadow-sm"}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={18} className={isActive ? "text-white" : "text-gray-500"} />
                                    {item.label}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;

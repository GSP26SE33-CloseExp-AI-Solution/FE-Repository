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
    { label: "Dashboard", path: "/supermarket/dashboard", icon: LayoutDashboard },
    { label: "Products", path: "/supermarket/products", icon: Box },
    { label: "Statistic", path: "/supermarket/statistic", icon: BarChart3 },
    { label: "Profile", path: "/supermarket/profile", icon: User },
    { label: "Notification", path: "/supermarket/notification", icon: Bell },
    { label: "Setting", path: "/supermarket/setting", icon: Settings },
];

const Sidebar = () => {
    return (
        <aside className="w-fit min-w-[160px] bg-[#FAFAFA] border-r border-gray-200 flex flex-col">

            {/* MENU TITLE */}
            <div className="flex items-center gap-3 px-5 py-6 border-b">
                <div className="w-6 h-6 flex flex-col justify-between">
                    <span className="block h-[2px] bg-black" />
                    <span className="block h-[2px] bg-black" />
                    <span className="block h-[2px] bg-black" />
                    <span className="block h-[2px] bg-black" />
                </div>
                <span className="text-[20px] font-bold whitespace-nowrap">Menu</span>
            </div>

            {/* MENU ITEMS */}
            <nav className="flex flex-col">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-5 h-[64px] text-[18px] font-semibold whitespace-nowrap transition-colors
                                ${isActive ? "bg-gray-200" : "hover:bg-gray-100"}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        size={20}
                                        className={isActive ? "text-black" : "text-gray-500"}
                                    />
                                    <span className={isActive ? "text-black" : "text-gray-700"}>
                                        {item.label}
                                    </span>
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

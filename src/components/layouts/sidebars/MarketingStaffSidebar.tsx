import { NavLink } from "react-router-dom"
import {
    LayoutDashboard,
    Megaphone,
    TicketPercent,
    BarChart3,
    MessageSquare,
    Bell,
    User,
    Settings,
} from "lucide-react"

type MenuItem = {
    label: string
    path: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    end?: boolean
}

const marketingMenuItems: MenuItem[] = [
    { label: "Tổng quan", path: "/marketing/dashboard", icon: LayoutDashboard, end: true },
    { label: "Chiến dịch", path: "/marketing/campaigns", icon: Megaphone },
    { label: "Khuyến mãi", path: "/marketing/promotions", icon: TicketPercent },
    { label: "Hiệu quả", path: "/marketing/statistic", icon: BarChart3, end: true },
    { label: "Phản hồi khách hàng", path: "/marketing/feedbacks", icon: MessageSquare },
    { label: "Thông báo", path: "/marketing/notification", icon: Bell, end: true },
    { label: "Hồ sơ", path: "/marketing/profile", icon: User, end: true },
    { label: "Cài đặt", path: "/marketing/setting", icon: Settings, end: true },
]

const MarketingSidebar = () => {
    return (
        <aside className="w-fit min-w-[230px] bg-white/70 backdrop-blur-xl border-r border-white/40 pt-24 px-2">
            <p className="px-3 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Danh mục marketing
            </p>

            <nav className="flex flex-col gap-1">
                {marketingMenuItems.map((item) => {
                    const Icon = item.icon

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isActive
                                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow"
                                    : "text-gray-600 hover:bg-white hover:shadow-sm"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        size={18}
                                        className={isActive ? "text-white" : "text-gray-500"}
                                    />
                                    {item.label}
                                </>
                            )}
                        </NavLink>
                    )
                })}
            </nav>
        </aside>
    )
}

export default MarketingSidebar

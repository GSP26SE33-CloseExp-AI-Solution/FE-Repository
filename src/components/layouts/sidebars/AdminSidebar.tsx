import { NavLink } from "react-router-dom"
import {
    LayoutDashboard,
    Users,
    BadgeCheck,
    Briefcase,
    ShieldCheck,
    CreditCard,
    Truck,
    PackageCheck,
    ClipboardCheck,
    MessageSquare,
    BarChart3,
    Settings,
} from "lucide-react"

type MenuItem = {
    label: string
    path: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    end?: boolean
}

const adminMenuItems: MenuItem[] = [
    { label: "Tổng quan", path: "/admin", icon: LayoutDashboard, end: true },
    { label: "Tài khoản", path: "/admin/users", icon: Users },
    { label: "Phê duyệt", path: "/admin/approvals", icon: BadgeCheck },
    { label: "Nhân sự nội bộ", path: "/admin/internal-staff", icon: Briefcase },
    { label: "Phân quyền", path: "/admin/roles", icon: ShieldCheck },
    { label: "Giao dịch", path: "/admin/transactions", icon: CreditCard },
    { label: "Điều phối giao hàng", path: "/admin/delivery", icon: Truck },
    { label: "Đóng gói và giao hàng", path: "/admin/operations", icon: PackageCheck },
    { label: "Kiểm duyệt sản phẩm", path: "/admin/moderation", icon: ClipboardCheck },
    { label: "Phản hồi", path: "/admin/feedbacks", icon: MessageSquare },
    { label: "Báo cáo", path: "/admin/reports", icon: BarChart3 },
    { label: "Cấu hình hệ thống", path: "/admin/settings", icon: Settings },
]

const AdminSidebar = () => {
    return (
        <aside className="w-fit min-w-[230px] bg-white/70 backdrop-blur-xl border-r border-white/40 pt-24 px-2">
            <p className="px-3 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Danh mục quản trị
            </p>

            <nav className="flex flex-col gap-1">
                {adminMenuItems.map((item) => {
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

export default AdminSidebar

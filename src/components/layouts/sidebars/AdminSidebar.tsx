import {
    LayoutDashboard,
    Users,
    Briefcase,
    Truck,
    PackageCheck,
    MessageSquare,
    BarChart3,
    Settings,
    Store,
    UserCircle,
    Banknote,
    Bell,
    TicketPercent,
} from "lucide-react"

import BaseSidebar, { type SidebarMenuItem } from "@/components/layouts/shared/BaseSidebar"

const adminMenuItems: SidebarMenuItem[] = [
    { label: "Tổng quan", path: "/admin", icon: LayoutDashboard, end: true },
    { label: "Báo cáo", path: "/admin/reports", icon: BarChart3 },
    { label: "Phân tích khuyến mãi", path: "/admin/promotion-analytics", icon: TicketPercent },
    { label: "Điều phối giao hàng", path: "/admin/delivery", icon: Truck },
    { label: "Điều phối đóng gói", path: "/admin/operations", icon: PackageCheck },
    { label: "Phản hồi", path: "/admin/feedbacks", icon: MessageSquare },
    { label: "Hoàn tiền", path: "/admin/refunds", icon: Banknote },
    { label: "Siêu thị", path: "/admin/supermarkets", icon: Store },
    { label: "Tài khoản", path: "/admin/users", icon: Users },
    { label: "Nhân sự nội bộ", path: "/admin/internal-staff", icon: Briefcase },
    { label: "Thông báo", path: "/admin/notification", icon: Bell },
    { label: "Hồ sơ", path: "/admin/profile", icon: UserCircle },
    { label: "Cấu hình hệ thống", path: "/admin/settings", icon: Settings, end: true },
]

const AdminSidebar = () => {
    return (
        <BaseSidebar
            title="Danh mục quản trị"
            items={adminMenuItems}
        />
    )
}

export default AdminSidebar

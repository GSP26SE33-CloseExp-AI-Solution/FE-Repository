import {
    LayoutDashboard,
    Users,
    BadgeCheck,
    Briefcase,
    CreditCard,
    Truck,
    PackageCheck,
    MessageSquare,
    BarChart3,
    Settings,
    Store,
    UserCircle,
} from "lucide-react"

import BaseSidebar, { type SidebarMenuItem } from "@/components/layouts/shared/BaseSidebar"

const adminMenuItems: SidebarMenuItem[] = [
    { label: "Tổng quan", path: "/admin", icon: LayoutDashboard, end: true },
    { label: "Báo cáo", path: "/admin/reports", icon: BarChart3 },
    { label: "Giao dịch", path: "/admin/transactions", icon: CreditCard },
    { label: "Điều phối giao hàng", path: "/admin/delivery", icon: Truck },
    { label: "Điều phối đóng gói", path: "/admin/operations", icon: PackageCheck },
    { label: "Phản hồi", path: "/admin/feedbacks", icon: MessageSquare },
    { label: "Siêu thị", path: "/admin/supermarkets", icon: Store },
    { label: "Tài khoản", path: "/admin/users", icon: Users },
    { label: "Phê duyệt", path: "/admin/approvals", icon: BadgeCheck },
    { label: "Nhân sự nội bộ", path: "/admin/internal-staff", icon: Briefcase },
    { label: "Hồ sơ", path: "/admin/profile", icon: UserCircle },
    { label: "Cấu hình hệ thống", path: "/admin/settings", icon: Settings },
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

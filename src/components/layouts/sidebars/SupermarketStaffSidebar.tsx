import {
    LayoutDashboard,
    Box,
    BarChart3,
    User,
    Bell,
    Settings,
} from "lucide-react"

import BaseSidebar, { type SidebarMenuItem } from "@/components/layouts/shared/BaseSidebar"

const supermarketStaffMenuItems: SidebarMenuItem[] = [
    { label: "Tổng quan", path: "/supermarketStaff/dashboard", icon: LayoutDashboard, end: true },
    { label: "Sản phẩm", path: "/supermarketStaff/products", icon: Box },
    { label: "Thống kê", path: "/supermarketStaff/statistic", icon: BarChart3, end: true },
    { label: "Hồ sơ", path: "/supermarketStaff/profile", icon: User, end: true },
    { label: "Thông báo", path: "/supermarketStaff/notification", icon: Bell, end: true },
    { label: "Cài đặt", path: "/supermarketStaff/setting", icon: Settings, end: true },
]

const SupermarketStaffSidebar = () => {
    return (
        <BaseSidebar
            title="Danh mục siêu thị"
            items={supermarketStaffMenuItems}
        />
    )
}

export default SupermarketStaffSidebar

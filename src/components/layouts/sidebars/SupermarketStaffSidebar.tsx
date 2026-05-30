import {
    LayoutDashboard,
    Box,
    Scale,
    User,
    Bell,
    Bot,
} from "lucide-react"

import BaseSidebar, { type SidebarMenuItem } from "@/components/layouts/shared/BaseSidebar"

const supermarketStaffMenuItems: SidebarMenuItem[] = [
    { label: "Tổng quan", path: "/supermarketStaff/dashboard", icon: LayoutDashboard, end: true },
    { label: "Sản phẩm", path: "/supermarketStaff/products", icon: Box },
    {
        label: "Đơn vị bán",
        path: "/supermarketStaff/purchase-units",
        icon: Scale,
    },
    { label: "AI Token", path: "/supermarketStaff/ai-tokens", icon: Bot },
    { label: "Hồ sơ", path: "/supermarketStaff/profile", icon: User },
    { label: "Thông báo", path: "/supermarketStaff/notification", icon: Bell, end: true },
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

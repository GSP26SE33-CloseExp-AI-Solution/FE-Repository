import {
    TicketPercent,
    FolderTree,
    BarChart3,
    Bell,
    User,
} from "lucide-react"

import BaseSidebar, { type SidebarMenuItem } from "@/components/layouts/shared/BaseSidebar"

const marketingMenuItems: SidebarMenuItem[] = [
    { label: "Khuyến mãi", path: "/marketing/promotions", icon: TicketPercent, end: true },
    {
        label: "Sản phẩm theo danh mục",
        path: "/marketing/category-products",
        icon: FolderTree,
    },
    { label: "Hiệu quả", path: "/marketing/reports", icon: BarChart3 },
    { label: "Thông báo", path: "/marketing/notification", icon: Bell },
    { label: "Hồ sơ", path: "/marketing/profile", icon: User, end: true },
]

const MarketingSidebar = () => {
    return (
        <BaseSidebar
            title="Danh mục marketing"
            items={marketingMenuItems}
        />
    )
}

export default MarketingSidebar

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

import BaseSidebar, { type SidebarMenuItem } from "@/components/layouts/shared/BaseSidebar"

const marketingMenuItems: SidebarMenuItem[] = [
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
        <BaseSidebar
            title="Danh mục marketing"
            items={marketingMenuItems}
        />
    )
}

export default MarketingSidebar

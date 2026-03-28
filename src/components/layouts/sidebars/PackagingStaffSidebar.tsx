import {
    LayoutDashboard,
    ClipboardList,
    ScanSearch,
    PackageCheck,
    Bell,
    User,
    Settings,
} from "lucide-react"

import BaseSidebar, { type SidebarMenuItem } from "@/components/layouts/shared/BaseSidebar"

const packageMenuItems: SidebarMenuItem[] = [
    { label: "Tổng quan", path: "/package/dashboard", icon: LayoutDashboard, end: true },
    { label: "Đơn chờ đóng gói", path: "/package/orders", icon: ClipboardList },
    { label: "Thu gom sản phẩm", path: "/package/collect", icon: ScanSearch, end: true },
    { label: "Hoàn tất đóng gói", path: "/package/packing", icon: PackageCheck, end: true },
    { label: "Thông báo", path: "/package/notification", icon: Bell, end: true },
    { label: "Hồ sơ", path: "/package/profile", icon: User, end: true },
    { label: "Cài đặt", path: "/package/setting", icon: Settings, end: true },
]

const PackageSidebar = () => {
    return (
        <BaseSidebar
            title="Danh mục đóng gói"
            items={packageMenuItems}
        />
    )
}

export default PackageSidebar

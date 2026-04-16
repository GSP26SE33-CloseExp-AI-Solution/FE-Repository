import { Activity, Megaphone, PackageCheck, Store } from "lucide-react"

export const STAFF_HEADER_CONFIG = {
    Admin: {
        portalSubtitle: "Trung tâm quản trị hệ thống",
        roleLabel: "Quản trị viên hệ thống",
        profileRoute: "/admin/profile",
        accentClass: "from-emerald-500 to-green-400",
        centerHint: "Theo dõi cấu hình, người dùng và vận hành toàn hệ thống",
        meta: (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <Activity size={12} />
                Toàn hệ thống
            </span>
        ),
    },

    MarketingStaff: {
        portalSubtitle: "Trung tâm marketing và tăng trưởng",
        roleLabel: "Nhân viên marketing",
        profileRoute: "/marketing/profile",
        accentClass: "from-pink-500 to-rose-400",
        centerHint: "Tăng trưởng, chiến dịch, khuyến mãi và tương tác khách hàng",
        meta: (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                <Megaphone size={12} />
                Campaign workspace
            </span>
        ),
    },

    PackagingStaff: {
        portalSubtitle: "Trung tâm đóng gói",
        roleLabel: "Nhân viên đóng gói",
        profileRoute: "/package/profile",
        accentClass: "from-amber-500 to-orange-400",
        centerHint: "Thu gom, đóng gói và bàn giao đúng tiến độ",
        meta: (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <PackageCheck size={12} />
                Operation desk
            </span>
        ),
    },

    SupermarketStaff: {
        portalSubtitle: "Trung tâm vận hành siêu thị",
        roleLabel: "Nhân viên siêu thị",
        profileRoute: "/supermarketStaff/profile",
        accentClass: "from-sky-500 to-cyan-400",
        centerHint: "Quản lý sản phẩm, số lượng hàng và hỗ trợ định giá",
        meta: (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                <Store size={12} />
                Store hub
            </span>
        ),
    },
} as const

import { Archive, Megaphone, Store, UserCircle } from "lucide-react"
import type { ProfileRoleConfig } from "@/types/profile.type"

export const PROFILE_ROLE_CONFIG = {
    admin: {
        pageTitle: "Hồ sơ quản trị viên",
        pageDescription: "Quản lý thông tin cá nhân, cập nhật hồ sơ và bảo mật phiên đăng nhập.",
        editCardTitle: "Chỉnh sửa thông tin",
        editCardDescription: "Bạn có thể cập nhật các thông tin cơ bản của tài khoản quản trị tại đây.",
        saveButtonClassName:
            "inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
        securityCardClassName: "rounded-3xl border border-rose-200 bg-white p-6 shadow-sm",
        securityIconWrapClassName: "flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600",
        securityIconClassName: "h-5 w-5",
        securityButtonClassName:
            "inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60",
        securityNoticeClassName:
            "mt-4 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-700",
        identityIcon: UserCircle,
        identityIconWrapClassName: "flex h-20 w-20 items-center justify-center rounded-full bg-slate-100",
        identityIconClassName: "h-10 w-10 text-slate-600",
    },
    marketing: {
        pageTitle: "Hồ sơ nhân sự marketing",
        pageDescription: "Quản lý thông tin cá nhân, cập nhật hồ sơ và bảo mật phiên đăng nhập.",
        editCardTitle: "Chỉnh sửa thông tin",
        editCardDescription: "Bạn có thể cập nhật các thông tin cơ bản của tài khoản marketing tại đây.",
        saveButtonClassName:
            "inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60",
        securityCardClassName: "rounded-3xl border border-rose-200 bg-white p-6 shadow-sm",
        securityIconWrapClassName: "flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600",
        securityIconClassName: "h-5 w-5",
        securityButtonClassName:
            "inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60",
        securityNoticeClassName:
            "mt-4 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-700",
        identityIcon: Megaphone,
        identityIconWrapClassName: "flex h-20 w-20 items-center justify-center rounded-full bg-rose-50",
        identityIconClassName: "h-10 w-10 text-rose-600",
    },
    packaging: {
        pageTitle: "Hồ sơ nhân sự đóng gói",
        pageDescription: "Quản lý thông tin cá nhân, cập nhật hồ sơ và bảo mật phiên đăng nhập.",
        editCardTitle: "Chỉnh sửa thông tin",
        editCardDescription: "Bạn có thể cập nhật các thông tin cơ bản của tài khoản đóng gói tại đây.",
        saveButtonClassName:
            "inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60",
        securityCardClassName: "rounded-3xl border border-amber-200 bg-white p-6 shadow-sm",
        securityIconWrapClassName: "flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600",
        securityIconClassName: "h-5 w-5",
        securityButtonClassName:
            "inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60",
        securityNoticeClassName:
            "mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-700",
        identityIcon: Archive,
        identityIconWrapClassName: "flex h-20 w-20 items-center justify-center rounded-full bg-amber-50",
        identityIconClassName: "h-10 w-10 text-amber-600",
    },
    supermarket: {
        pageTitle: "Hồ sơ nhân sự siêu thị",
        pageDescription: "Quản lý thông tin cá nhân, cập nhật hồ sơ và bảo mật phiên đăng nhập.",
        editCardTitle: "Chỉnh sửa thông tin",
        editCardDescription: "Bạn có thể cập nhật các thông tin cơ bản của tài khoản siêu thị tại đây.",
        saveButtonClassName:
            "inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60",
        securityCardClassName: "rounded-3xl border border-sky-200 bg-white p-6 shadow-sm",
        securityIconWrapClassName: "flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600",
        securityIconClassName: "h-5 w-5",
        securityButtonClassName:
            "inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60",
        securityNoticeClassName:
            "mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-700",
        identityIcon: Store,
        identityIconWrapClassName: "flex h-20 w-20 items-center justify-center rounded-full bg-sky-50",
        identityIconClassName: "h-10 w-10 text-sky-600",
    },
} satisfies Record<string, ProfileRoleConfig>

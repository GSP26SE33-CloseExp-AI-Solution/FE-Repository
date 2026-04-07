import React, { Fragment, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    ChevronRight,
    Heart,
    LogOut,
    Mail,
    Phone,
    Save,
    ShieldAlert,
    ShoppingBag,
    UserCircle,
} from "lucide-react"

import { useAuthContext } from "@/contexts/AuthContext"
import { useLogoutAll } from "@/hooks/useLogoutAll"
import CustomerAddressesPanel from "./CustomerAddressesPanel"
import { showError, showSuccess } from "@/utils/toast"
import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"

const getSafeString = (value?: string | null) => value?.trim() ?? ""

const formatDateTime = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

const getUserStatusLabel = (status?: number) => {
    switch (status) {
        case 0:
            return "Chưa xác thực"
        case 1:
            return "Chờ phê duyệt"
        case 2:
            return "Đang hoạt động"
        case 3:
            return "Bị từ chối"
        case 4:
            return "Đã khóa"
        case 5:
            return "Bị cấm"
        case 6:
            return "Đã xóa"
        case 7:
            return "Đã ẩn"
        default:
            return "Chưa rõ"
    }
}

const getUserStatusClass = (status?: number) => {
    switch (status) {
        case 2:
            return "border border-emerald-200 bg-emerald-50 text-emerald-700"
        case 1:
            return "border border-amber-200 bg-amber-50 text-amber-700"
        case 3:
        case 4:
        case 5:
            return "border border-rose-200 bg-rose-50 text-rose-700"
        case 0:
        case 6:
        case 7:
        default:
            return "border border-slate-200 bg-slate-50 text-slate-700"
    }
}

const VendorProfile: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuthContext()
    const { logoutAll, loggingOutAll } = useLogoutAll()

    const [fullName, setFullName] = useState(getSafeString(user?.fullName))
    const [phone, setPhone] = useState(getSafeString(user?.phone))
    const [savingProfile, setSavingProfile] = useState(false)

    const pageTitle = useMemo(() => "Tài khoản của tôi", [])
    const pageDescription = useMemo(
        () =>
            "Quản lý thông tin cá nhân, thông tin liên hệ và bảo mật phiên đăng nhập cho tài khoản mua sắm.",
        []
    )

    const breadcrumbs = useMemo(
        () => getBreadcrumbsByPath(location.pathname),
        [location.pathname]
    )

    const handleSaveProfile = async () => {
        if (!fullName.trim()) {
            showError("Vui lòng nhập họ và tên.")
            return
        }

        try {
            setSavingProfile(true)

            console.log("VendorProfile.handleSaveProfile payload:", {
                fullName: fullName.trim(),
                phone: phone.trim() || undefined,
            })

            showSuccess(
                "Đã lưu giao diện tài khoản. Khi có API cập nhật hồ sơ khách hàng, mình sẽ nối tiếp phần này."
            )
        } catch (error: any) {
            console.error("VendorProfile.handleSaveProfile error:", error)
            showError(error?.response?.data?.message || "Không thể cập nhật hồ sơ.")
        } finally {
            setSavingProfile(false)
        }
    }

    const handleLogoutAll = async () => {
        const confirmed = window.confirm(
            "Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị không? Bạn sẽ cần đăng nhập lại sau khi tiếp tục."
        )

        if (!confirmed) return

        await logoutAll()
    }

    if (!user) {
        return (
            <div className="mx-auto max-w-[1160px] px-4 py-10">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-[22px] font-bold text-slate-900">Tài khoản của tôi</h1>
                        <p className="mt-1 text-[13px] text-slate-500">
                            Không tìm thấy thông tin người dùng trong phiên hiện tại.
                        </p>
                    </div>

                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                        Vui lòng đăng nhập lại để tiếp tục sử dụng trang tài khoản.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-50/70 py-8">
            <div className="mx-auto max-w-[1160px] px-4 space-y-5">
                <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="transition hover:text-slate-800"
                    >
                        Trang chủ
                    </button>

                    {breadcrumbs.map((crumb, index) => (
                        <Fragment key={`${crumb}-${index}`}>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span
                                className={
                                    index === breadcrumbs.length - 1
                                        ? "font-medium text-slate-800"
                                        : "text-slate-500"
                                }
                            >
                                {crumb}
                            </span>
                        </Fragment>
                    ))}
                </div>

                <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 px-5 py-5 md:px-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                    <ShoppingBag className="h-7 w-7" />
                                </div>

                                <div>
                                    <h1 className="text-[22px] font-bold text-slate-900">
                                        {pageTitle}
                                    </h1>
                                    <p className="mt-1 text-[13px] text-slate-500">
                                        {pageDescription}
                                    </p>
                                </div>
                            </div>

                            <div
                                className={`inline-flex rounded-full px-3 py-1 text-[13px] font-medium ${getUserStatusClass(
                                    user.status
                                )}`}
                            >
                                {getUserStatusLabel(user.status)}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                className="rounded-full bg-slate-900 px-3.5 py-1.5 text-[13px] font-semibold text-white"
                            >
                                Hồ sơ cá nhân
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/cart")}
                                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Giỏ hàng
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/checkout")}
                                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Thanh toán
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/impact")}
                                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Tác động
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <div className="space-y-5">
                        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                                    <ShoppingBag className="h-8 w-8 text-emerald-600" />
                                </div>

                                <h2 className="mt-3 text-base font-bold text-slate-900">
                                    {user.fullName || "--"}
                                </h2>

                                <p className="mt-1 text-[13px] text-slate-500">{user.email || "--"}</p>

                                <div className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[13px] font-medium text-emerald-700">
                                    Khách hàng mua sắm
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-500">Vai trò tài khoản</p>
                                    <p className="mt-1 text-[13px] font-semibold text-slate-900">
                                        {user.roleName || "Vendor"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-500">Mã người dùng</p>
                                    <p className="mt-1 text-[13px] font-semibold text-slate-900">
                                        {user.userId || "--"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-500">Ngày tham gia</p>
                                    <p className="mt-1 text-[13px] font-semibold text-slate-900">
                                        {formatDateTime(user.createdAt)}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-500">Lần cập nhật gần nhất</p>
                                    <p className="mt-1 text-[13px] font-semibold text-slate-900">
                                        {formatDateTime(user.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Heart className="h-4.5 w-4.5 text-emerald-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Trạng thái tài khoản
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="text-[13px] text-slate-500">Tình trạng hiện tại</p>
                                    <p className="mt-1 text-[13px] font-semibold text-slate-900">
                                        {getUserStatusLabel(user.status)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 xl:col-span-2">
                        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-base font-bold text-slate-900">
                                    Thông tin cá nhân
                                </h2>
                                <p className="mt-1 text-[13px] text-slate-500">
                                    Cập nhật thông tin liên hệ cơ bản dùng cho quá trình mua sắm và
                                    nhận hàng.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-[13px] font-medium text-slate-700">
                                        Họ và tên
                                    </label>
                                    <div className="relative">
                                        <UserCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Nhập họ và tên"
                                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3.5 text-[13px] text-slate-700 outline-none transition focus:border-slate-300"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-[13px] font-medium text-slate-700">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={user.email || ""}
                                            readOnly
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3.5 text-[13px] text-slate-500 outline-none"
                                        />
                                    </div>
                                    <p className="mt-2 text-[11px] text-slate-500">
                                        Không được chỉnh sửa email.
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-[13px] font-medium text-slate-700">
                                        Số điện thoại
                                    </label>
                                    <div className="relative">
                                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Nhập số điện thoại"
                                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3.5 text-[13px] text-slate-700 outline-none transition focus:border-slate-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveProfile}
                                    disabled={savingProfile}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </div>

                        <CustomerAddressesPanel
                            defaultRecipientName={fullName}
                            defaultPhone={phone}
                        />

                        <div className="rounded-[24px] border border-emerald-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                            <ShieldAlert className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">
                                                Bảo mật phiên đăng nhập
                                            </h2>
                                            <p className="mt-1 text-[13px] text-slate-500">
                                                Thu hồi toàn bộ phiên đang hoạt động trên các thiết bị
                                                khác.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleLogoutAll()}
                                    disabled={loggingOutAll}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {loggingOutAll ? "Đang xử lý..." : "Đăng xuất tất cả"}
                                </button>
                            </div>

                            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-[13px] text-emerald-700">
                                Đây là thao tác bảo mật quan trọng. Bạn chỉ nên thực hiện khi thật sự
                                cần thiết.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VendorProfile

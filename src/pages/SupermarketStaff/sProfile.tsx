import { useMemo, useState } from "react"
import {
    Building2,
    Lock,
    LogOut,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldAlert,
    ShieldCheck,
    Store,
    UserCircle,
    Users,
} from "lucide-react"

import { useAuthContext } from "@/contexts/AuthContext"
import { useLogoutAll } from "@/hooks/useLogoutAll"
import { showError, showSuccess } from "@/utils/toast"

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

const SupermarketProfile = () => {
    const {
        user,
        supermarketName,
        isSupermarketManager,
        isSubSupermarketStaff,
        employeeCodeHint,
    } = useAuthContext()

    const { logoutAll, loggingOutAll } = useLogoutAll()

    const marketStaff = user?.marketStaffInfo ?? null
    const supermarket = marketStaff?.supermarket ?? null

    const [fullName, setFullName] = useState(getSafeString(user?.fullName))
    const [phone, setPhone] = useState(getSafeString(user?.phone))
    const [supermarketDisplayName, setSupermarketDisplayName] = useState(
        getSafeString(supermarket?.name)
    )
    const [supermarketAddress, setSupermarketAddress] = useState(
        getSafeString(supermarket?.address)
    )
    const [supermarketPhone, setSupermarketPhone] = useState(
        getSafeString(supermarket?.contactPhone)
    )

    const [savingProfile, setSavingProfile] = useState(false)
    const [savingSupermarket, setSavingSupermarket] = useState(false)

    const profileTitle = useMemo(() => {
        if (isSupermarketManager) return "Hồ sơ quản lý siêu thị"
        return "Hồ sơ nhân sự siêu thị"
    }, [isSupermarketManager])

    const profileDescription = useMemo(() => {
        if (isSupermarketManager) {
            return "Quản lý thông tin cá nhân, thông tin siêu thị và bảo mật phiên đăng nhập."
        }

        return "Quản lý thông tin cá nhân và bảo mật phiên đăng nhập trong hệ thống siêu thị."
    }, [isSupermarketManager])

    const handleSaveProfile = async () => {
        if (!fullName.trim()) {
            showError("Vui lòng nhập họ và tên.")
            return
        }

        try {
            setSavingProfile(true)

            console.log("sProfile.handleSaveProfile payload:", {
                fullName: fullName.trim(),
                phone: phone.trim() || undefined,
            })

            showSuccess("Đã lưu giao diện hồ sơ cá nhân. Khi có API cập nhật hồ sơ, mình sẽ nối tiếp phần này.")
        } catch (error: any) {
            console.error("sProfile.handleSaveProfile error:", error)
            showError(error?.response?.data?.message || "Không thể cập nhật hồ sơ cá nhân.")
        } finally {
            setSavingProfile(false)
        }
    }

    const handleSaveSupermarket = async () => {
        if (!isSupermarketManager) {
            showError("Bạn không có quyền cập nhật thông tin siêu thị.")
            return
        }

        if (!supermarketDisplayName.trim()) {
            showError("Vui lòng nhập tên siêu thị.")
            return
        }

        try {
            setSavingSupermarket(true)

            console.log("sProfile.handleSaveSupermarket payload:", {
                supermarketId: supermarket?.supermarketId,
                name: supermarketDisplayName.trim(),
                address: supermarketAddress.trim(),
                contactPhone: supermarketPhone.trim(),
            })

            showSuccess("Đã lưu giao diện thông tin siêu thị. Giả định UI.")
        } catch (error: any) {
            console.error("sProfile.handleSaveSupermarket error:", error)
            showError(error?.response?.data?.message || "Không thể cập nhật thông tin siêu thị.")
        } finally {
            setSavingSupermarket(false)
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hồ sơ siêu thị</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Không tìm thấy thông tin người dùng trong phiên hiện tại.
                    </p>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    Vui lòng đăng nhập lại để tiếp tục sử dụng trang hồ sơ.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{profileTitle}</h1>
                    <p className="mt-1 text-sm text-slate-500">{profileDescription}</p>
                </div>

                <div
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getUserStatusClass(
                        user.status
                    )}`}
                >
                    {getUserStatusLabel(user.status)}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-50">
                                <Store className="h-10 w-10 text-sky-600" />
                            </div>

                            <h2 className="mt-4 text-lg font-bold text-slate-900">
                                {user.fullName || "--"}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {user.email || "--"}
                            </p>

                            <div className="mt-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                                {isSupermarketManager
                                    ? "Quản lý siêu thị"
                                    : isSubSupermarketStaff
                                      ? "Nhân sự cấp dưới"
                                      : "Nhân sự siêu thị"}
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-sm text-slate-500">Vai trò hệ thống</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                                    <p className="font-semibold text-slate-900">
                                        {user.roleName || "--"}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-sm text-slate-500">Mã người dùng</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {user.userId || "--"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-sm text-slate-500">Mã nhân sự siêu thị</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {marketStaff?.marketStaffId || "--"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-sm text-slate-500">Chức vụ nội bộ</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {marketStaff?.position || "--"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-sm text-slate-500">Ngày tham gia</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {formatDateTime(marketStaff?.joinedAt)}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-sm text-slate-500">Mã cấp cố định</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {employeeCodeHint || marketStaff?.employeeCodeHint || "--"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-sky-600" />
                            <h2 className="text-lg font-bold text-slate-900">
                                Đơn vị công tác
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-sm text-slate-500">Tên siêu thị</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {supermarketName || supermarket?.name || "--"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-sm text-slate-500">Địa chỉ</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {supermarket?.address || "--"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-sm text-slate-500">Liên hệ</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {supermarket?.contactPhone || "--"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:col-span-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-900">Thông tin cá nhân</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Cập nhật hồ sơ cá nhân dùng để làm việc trong hệ thống siêu thị.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Họ và tên
                                </label>
                                <div className="relative">
                                    <UserCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Nhập họ và tên"
                                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={user.email || ""}
                                        readOnly
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-500 outline-none"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    Không được chỉnh sửa email.
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Số điện thoại
                                </label>
                                <div className="relative">
                                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Nhập số điện thoại"
                                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {savingProfile ? "Đang lưu..." : "Lưu hồ sơ cá nhân"}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Thông tin siêu thị
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {isSupermarketManager
                                        ? "Quản lý siêu thị có thể chỉnh sửa khi hệ thống hỗ trợ API cập nhật."
                                        : "Nhân sự cấp dưới chỉ có quyền xem thông tin siêu thị đang công tác."}
                                </p>
                            </div>

                            {!isSupermarketManager ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                    <Lock className="h-3.5 w-3.5" />
                                    Chỉ xem
                                </div>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Tên siêu thị
                                </label>
                                <div className="relative">
                                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={supermarketDisplayName}
                                        onChange={(e) => setSupermarketDisplayName(e.target.value)}
                                        readOnly={!isSupermarketManager}
                                        placeholder="Nhập tên siêu thị"
                                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition read-only:bg-slate-50 read-only:text-slate-500 focus:border-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Địa chỉ
                                </label>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-slate-400" />
                                    <textarea
                                        value={supermarketAddress}
                                        onChange={(e) => setSupermarketAddress(e.target.value)}
                                        readOnly={!isSupermarketManager}
                                        placeholder="Nhập địa chỉ siêu thị"
                                        rows={3}
                                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition read-only:bg-slate-50 read-only:text-slate-500 focus:border-slate-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Số điện thoại siêu thị
                                </label>
                                <div className="relative">
                                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={supermarketPhone}
                                        onChange={(e) => setSupermarketPhone(e.target.value)}
                                        readOnly={!isSupermarketManager}
                                        placeholder="Nhập số điện thoại siêu thị"
                                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition read-only:bg-slate-50 read-only:text-slate-500 focus:border-slate-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Mã siêu thị
                                </label>
                                <input
                                    value={supermarket?.supermarketId || ""}
                                    readOnly
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                                />
                            </div>
                        </div>

                        {isSupermarketManager ? (
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveSupermarket}
                                    disabled={savingSupermarket}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    {savingSupermarket ? "Đang lưu..." : "Lưu thông tin siêu thị"}
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <Users className="h-5 w-5 text-slate-700" />
                            <h2 className="text-lg font-bold text-slate-900">
                                Nhân sự nội bộ siêu thị
                            </h2>
                        </div>

                        {isSupermarketManager ? (
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                    Khu vực này dành cho quản lý siêu thị để mở rộng quản lý nhân sự nội bộ trong cùng tài khoản dùng chung.
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                Bạn không có quyền quản lý hồ sơ nhân sự nội bộ của siêu thị.
                            </div>
                        )}
                    </div>

                    <div className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                                        <ShieldAlert className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Bảo mật phiên đăng nhập
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Thu hồi toàn bộ phiên đang hoạt động trên các thiết bị khác.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleLogoutAll()}
                                disabled={loggingOutAll}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <LogOut className="h-4 w-4" />
                                {loggingOutAll ? "Đang xử lý..." : "Đăng xuất tất cả"}
                            </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-700">
                            Đây là thao tác bảo mật quan trọng. Bạn chỉ nên thực hiện khi thật sự cần thiết.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SupermarketProfile

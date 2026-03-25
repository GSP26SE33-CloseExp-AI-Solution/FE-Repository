import { useEffect, useState } from "react"
import { Mail, Phone, RefreshCcw, Save, ShieldCheck, UserCircle } from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { AdminUser, UpdateCurrentUserProfilePayload } from "@/types/admin.type"
import { showError, showSuccess } from "@/utils/toast"

const getSafeString = (value?: string | null) => value?.trim() ?? ""

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

const AdminProfile = () => {
    const [profile, setProfile] = useState<AdminUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("")

    const loadProfile = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const data = await adminService.getCurrentUserProfile()

            setProfile(data)
            setFullName(getSafeString(data.fullName))
            setPhone(getSafeString(data.phone))
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải hồ sơ quản trị viên.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadProfile()
    }, [])

    const handleSave = async () => {
        if (!fullName.trim()) {
            showError("Vui lòng nhập họ và tên.")
            return
        }

        const payload: UpdateCurrentUserProfilePayload = {
            fullName: fullName.trim(),
            phone: phone.trim() || undefined,
        }

        try {
            setSaving(true)

            const updated = await adminService.updateCurrentUserProfile(payload)

            setProfile(updated)
            setFullName(getSafeString(updated.fullName))
            setPhone(getSafeString(updated.phone))

            showSuccess("Cập nhật hồ sơ thành công.")
        } catch (err: any) {
            showError(err?.response?.data?.message || "Không thể cập nhật hồ sơ.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hồ sơ quản trị viên</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Đang tải thông tin hồ sơ...
                    </p>
                </div>

                <div className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
                <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hồ sơ quản trị viên</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Quản lý thông tin cá nhân và cập nhật hồ sơ tài khoản quản trị.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadProfile(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </button>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                            <UserCircle className="h-10 w-10 text-slate-600" />
                        </div>

                        <h2 className="mt-4 text-lg font-bold text-slate-900">
                            {profile?.fullName || "--"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {profile?.email || "--"}
                        </p>

                        <div
                            className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-medium ${getUserStatusClass(profile?.status)}`}
                        >
                            {getUserStatusLabel(profile?.status)}
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-sm text-slate-500">Vai trò</p>
                            <div className="mt-1 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-slate-500" />
                                <p className="font-semibold text-slate-900">
                                    {profile?.roleName || "--"}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-sm text-slate-500">Mã người dùng</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {profile?.userId || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-sm text-slate-500">Số điện thoại</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {profile?.phone || "--"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa thông tin</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Bạn có thể cập nhật các thông tin cơ bản của tài khoản quản trị tại đây.
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
                                    value={profile?.email || ""}
                                    readOnly
                                    placeholder="Email"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-500 outline-none"
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Email đang lấy theo tài khoản hiện tại và chưa hỗ trợ chỉnh sửa ở trang hồ sơ.
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
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminProfile

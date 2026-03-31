import { useEffect, useState } from "react"
import { LogOut, Mail, Phone, RefreshCcw, Save, ShieldAlert, ShieldCheck, UserCircle } from "lucide-react"

import { useLogoutAll } from "@/hooks/useLogoutAll"
import { adminService } from "@/services/admin.service"
import type { AdminUser, UpdateCurrentUserProfilePayload } from "@/types/admin.type"
import type { ProfileRoleConfig } from "@/types/profile.type"
import { getProfileStatusClass, getProfileStatusLabel } from "@/constants/profileStatus"
import { getSafeProfileString } from "@/utils/profile"
import { showError, showSuccess } from "@/utils/toast"

type BaseProfilePageProps = {
    config: ProfileRoleConfig
}

const BaseProfilePage = ({ config }: BaseProfilePageProps) => {
    const [profile, setProfile] = useState<AdminUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("")

    const { logoutAll, loggingOutAll } = useLogoutAll()

    const IdentityIcon = config.identityIcon

    const loadProfile = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)

            setError("")

            const data = await adminService.getCurrentUserProfile()

            setProfile(data)
            setFullName(getSafeProfileString(data.fullName))
            setPhone(getSafeProfileString(data.phone))
        } catch (err: any) {
            console.error("BaseProfilePage.loadProfile error:", err)
            setError(err?.response?.data?.message || "Không thể tải hồ sơ.")
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
            setFullName(getSafeProfileString(updated.fullName))
            setPhone(getSafeProfileString(updated.phone))

            showSuccess("Cập nhật hồ sơ thành công.")
        } catch (err: any) {
            console.error("BaseProfilePage.handleSave error:", err)
            showError(err?.response?.data?.message || "Không thể cập nhật hồ sơ.")
        } finally {
            setSaving(false)
        }
    }

    const handleLogoutAll = async () => {
        const confirmed = window.confirm(
            "Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị không? Bạn sẽ cần đăng nhập lại sau khi tiếp tục."
        )

        if (!confirmed) return
        await logoutAll()
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{config.pageTitle}</h1>
                    <p className="mt-1 text-sm text-slate-500">Đang tải thông tin hồ sơ...</p>
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
                    <h1 className="text-2xl font-bold text-slate-900">{config.pageTitle}</h1>
                    <p className="mt-1 text-sm text-slate-500">{config.pageDescription}</p>
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
                        <div className={config.identityIconWrapClassName}>
                            <IdentityIcon className={config.identityIconClassName} />
                        </div>

                        <h2 className="mt-4 text-lg font-bold text-slate-900">
                            {profile?.fullName || "--"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">{profile?.email || "--"}</p>

                        <div
                            className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-medium ${getProfileStatusClass(profile?.status)}`}
                        >
                            {getProfileStatusLabel(profile?.status)}
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
                            <p className="mt-1 font-semibold text-slate-900">{profile?.userId || "--"}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-sm text-slate-500">Số điện thoại</p>
                            <p className="mt-1 font-semibold text-slate-900">{profile?.phone || "--"}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:col-span-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-900">{config.editCardTitle}</h2>
                            <p className="mt-1 text-sm text-slate-500">{config.editCardDescription}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-slate-700">Họ và tên</label>
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
                                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={profile?.email || ""}
                                        readOnly
                                        placeholder="Email"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-500 outline-none"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Không được chỉnh sửa email.</p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Số điện thoại</label>
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
                            <button type="button" onClick={handleSave} disabled={saving} className={config.saveButtonClassName}>
                                <Save className="h-4 w-4" />
                                {saving ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>

                    <div className={config.securityCardClassName}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className={config.securityIconWrapClassName}>
                                        <ShieldAlert className={config.securityIconClassName} />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Bảo mật phiên đăng nhập</h2>
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
                                className={config.securityButtonClassName}
                            >
                                <LogOut className="h-4 w-4" />
                                {loggingOutAll ? "Đang xử lý..." : "Đăng xuất tất cả"}
                            </button>
                        </div>

                        <div className={config.securityNoticeClassName}>
                            Đây là thao tác bảo mật quan trọng. Bạn chỉ nên thực hiện khi thật sự cần thiết.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BaseProfilePage

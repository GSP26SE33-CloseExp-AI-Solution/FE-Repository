import type { ReactNode } from "react"
import {
    Briefcase,
    Mail,
    Phone,
    PencilLine,
    ShieldCheck,
    Trash2,
    UserCog,
    Loader2,
} from "lucide-react"

import type { AdminUser } from "@/types/admin.type"
import { BaseModal } from "./FormModals"

const CardMeta = ({
    icon,
    label,
    value,
}: {
    icon: ReactNode
    label: string
    value?: string | number | null
}) => (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-slate-500">
            {icon}
            <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
        </div>
        <p className="mt-2 break-all text-sm font-medium text-slate-900">
            {value || "--"}
        </p>
    </div>
)

type StaffDetailModalProps = {
    open: boolean
    loading: boolean
    user: AdminUser | null
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
    getRoleClassById: (roleId?: number | null) => string
    getRoleLabelById: (roleId?: number | null, roleName?: string | null) => string
    getRoleHintById: (roleId?: number | null) => string
    getStatusClass: (status?: number) => string
    getStatusLabel: (status?: number) => string
    formatDateTime: (value?: string) => string
}

const StaffDetailModal = ({
    open,
    loading,
    user,
    onClose,
    onEdit,
    onDelete,
    getRoleClassById,
    getRoleLabelById,
    getRoleHintById,
    getStatusClass,
    getStatusLabel,
    formatDateTime,
}: StaffDetailModalProps) => {
    if (!open) return null

    return (
        <BaseModal
            open={open}
            title="Chi tiết nhân sự"
            description="Xem nhanh thông tin tài khoản, vai trò, trạng thái và các thao tác quản trị."
            onClose={onClose}
            maxWidth="max-w-4xl"
        >
            <div className="p-6">
                {loading ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải chi tiết nhân sự...
                        </div>
                    </div>
                ) : !user ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
                        Không có dữ liệu chi tiết nhân sự.
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-sky-50/70 via-white to-white p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-xl font-bold text-slate-900">
                                            {user.fullName || "--"}
                                        </h3>

                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleClassById(
                                                user.roleId
                                            )}`}
                                        >
                                            {getRoleLabelById(user.roleId, user.roleName)}
                                        </span>

                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                user.status
                                            )}`}
                                        >
                                            {getStatusLabel(user.status)}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-sm text-slate-500">
                                        {getRoleHintById(user.roleId)}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        User ID
                                    </p>
                                    <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                                        {user.userId || "--"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <CardMeta
                                icon={<Mail className="h-4 w-4" />}
                                label="Email"
                                value={user.email}
                            />
                            <CardMeta
                                icon={<Phone className="h-4 w-4" />}
                                label="Số điện thoại"
                                value={user.phone}
                            />
                            <CardMeta
                                icon={<Briefcase className="h-4 w-4" />}
                                label="Vai trò"
                                value={getRoleLabelById(user.roleId, user.roleName)}
                            />
                            <CardMeta
                                icon={<ShieldCheck className="h-4 w-4" />}
                                label="Trạng thái"
                                value={getStatusLabel(user.status)}
                            />
                            <CardMeta
                                icon={<UserCog className="h-4 w-4" />}
                                label="Tạo lúc"
                                value={formatDateTime(user.createdAt)}
                            />
                            <CardMeta
                                icon={<UserCog className="h-4 w-4" />}
                                label="Cập nhật lúc"
                                value={formatDateTime(user.updatedAt)}
                            />
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">
                                        Hành động nhanh
                                    </h4>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Thực hiện các tác vụ quản trị phổ biến ngay trên hồ sơ.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={onEdit}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <PencilLine className="h-4 w-4" />
                                    Sửa hồ sơ
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Xóa mềm tài khoản
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </BaseModal>
    )
}

export default StaffDetailModal

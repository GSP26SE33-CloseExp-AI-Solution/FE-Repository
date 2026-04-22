import type { FormEvent, ReactNode } from "react"
import { Loader2, Plus, X } from "lucide-react"

type InternalRoleOption = {
    roleId: number
    roleName: string
    label: string
    hint: string
}

type CreateInternalUserForm = {
    fullName: string
    email: string
    phone: string
    roleId: number
}

type EditInternalUserForm = {
    fullName: string
    email: string
    phone: string
    roleId: number
    status: number
}

type BaseModalProps = {
    open: boolean
    title: string
    description?: string
    onClose: () => void
    children: ReactNode
    maxWidth?: string
}

export const BaseModal = ({
    open,
    title,
    description,
    onClose,
    children,
    maxWidth = "max-w-3xl",
}: BaseModalProps) => {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
            <div
                className={`max-h-[90vh] w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl ${maxWidth}`}
            >
                <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-white px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                            {description ? (
                                <p className="mt-1 text-sm text-slate-500">{description}</p>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="max-h-[calc(90vh-96px)] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}

type CreateInternalStaffModalProps = {
    open: boolean
    form: CreateInternalUserForm
    roleOptions: InternalRoleOption[]
    submitting: boolean
    onClose: () => void
    onChange: <K extends keyof CreateInternalUserForm>(
        field: K,
        value: CreateInternalUserForm[K]
    ) => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}

export const CreateInternalStaffModal = ({
    open,
    form,
    roleOptions,
    submitting,
    onClose,
    onChange,
    onSubmit,
}: CreateInternalStaffModalProps) => {
    if (!open) return null

    const selectedRole = roleOptions.find((item) => item.roleId === form.roleId)

    return (
        <BaseModal
            open={open}
            title="Tạo tài khoản nội bộ"
            description="Tạo nhanh tài khoản cho đội ngũ vận hành nội bộ và đưa vào hệ thống."
            onClose={onClose}
            maxWidth="max-w-3xl"
        >
            <form onSubmit={(e) => void onSubmit(e)} className="p-6">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-900">
                                    Họ và tên
                                </label>
                                <input
                                    value={form.fullName}
                                    onChange={(e) => onChange("fullName", e.target.value)}
                                    placeholder="Nhập họ và tên nhân sự"
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-900">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => onChange("email", e.target.value)}
                                    placeholder="example@company.com"
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-900">
                                    Số điện thoại
                                </label>
                                <input
                                    value={form.phone}
                                    onChange={(e) => onChange("phone", e.target.value)}
                                    placeholder="Nhập số điện thoại"
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-900">
                                    Vai trò nội bộ
                                </label>
                                <select
                                    value={form.roleId}
                                    onChange={(e) => onChange("roleId", Number(e.target.value))}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                >
                                    {roleOptions.map((role) => (
                                        <option key={role.roleId} value={role.roleId}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                            <p className="text-sm font-semibold text-slate-900">
                                Vai trò đang chọn
                            </p>
                            <p className="mt-3 text-base font-bold text-slate-900">
                                {selectedRole?.label || "--"}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                {selectedRole?.hint || "Chọn vai trò phù hợp cho nhân sự."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        {submitting ? "Đang tạo..." : "Tạo tài khoản"}
                    </button>
                </div>
            </form>
        </BaseModal>
    )
}

type EditInternalStaffModalProps = {
    open: boolean
    form: EditInternalUserForm
    roleOptions: InternalRoleOption[]
    submitting: boolean
    onClose: () => void
    onChange: <K extends keyof EditInternalUserForm>(
        field: K,
        value: EditInternalUserForm[K]
    ) => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
    getStatusClass: (status?: number) => string
    getStatusLabel: (status?: number) => string
}

export const EditInternalStaffModal = ({
    open,
    form,
    roleOptions,
    submitting,
    onClose,
    onChange,
    onSubmit,
    getStatusClass,
    getStatusLabel,
}: EditInternalStaffModalProps) => {
    if (!open) return null

    const selectedRole = roleOptions.find((item) => item.roleId === form.roleId)

    return (
        <BaseModal
            open={open}
            title="Cập nhật hồ sơ nhân sự"
            description="Chỉnh sửa thông tin tài khoản, vai trò và trạng thái của nhân sự."
            onClose={onClose}
            maxWidth="max-w-3xl"
        >
            <form onSubmit={(e) => void onSubmit(e)} className="p-6">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-900">
                                    Họ và tên
                                </label>
                                <input
                                    value={form.fullName}
                                    onChange={(e) => onChange("fullName", e.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-900">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => onChange("email", e.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-900">
                                    Số điện thoại
                                </label>
                                <input
                                    value={form.phone}
                                    onChange={(e) => onChange("phone", e.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-900">
                                    Vai trò
                                </label>
                                <select
                                    value={form.roleId}
                                    onChange={(e) => onChange("roleId", Number(e.target.value))}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                >
                                    {roleOptions.map((role) => (
                                        <option key={role.roleId} value={role.roleId}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-900">
                                    Trạng thái
                                </label>
                                <select
                                    value={form.status}
                                    onChange={(e) => onChange("status", Number(e.target.value))}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                >
                                    {[
                                        { value: 0, label: "Chưa xác minh" },
                                        { value: 1, label: "Chờ phê duyệt" },
                                        { value: 2, label: "Đang hoạt động" },
                                        { value: 3, label: "Bị từ chối" },
                                        { value: 4, label: "Đã khóa" },
                                        { value: 5, label: "Bị cấm" },
                                        { value: 7, label: "Đã ẩn" },
                                        { value: 6, label: "Đã xóa" },
                                    ].map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                            <p className="text-sm font-semibold text-slate-900">
                                Vai trò đang chọn
                            </p>
                            <p className="mt-3 text-base font-bold text-slate-900">
                                {selectedRole?.label || "--"}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                {selectedRole?.hint || "Chọn vai trò phù hợp cho nhân sự."}
                            </p>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                            <p className="text-sm font-semibold text-slate-900">
                                Trạng thái sau cập nhật
                            </p>
                            <div
                                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                    form.status
                                )}`}
                            >
                                {getStatusLabel(form.status)}
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Bạn có thể đổi cả vai trò và trạng thái trong cùng một lần lưu.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </form>
        </BaseModal>
    )
}

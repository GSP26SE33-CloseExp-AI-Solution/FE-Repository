import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
    ArrowRight,
    Briefcase,
    Mail,
    Phone,
    Plus,
    RefreshCcw,
    Search,
    ShieldCheck,
    UserCog,
    Users,
    X,
    ClipboardList,
    Layers3,
    Route,
    Sparkles,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { InternalStaffRow } from "@/types/admin.type"
import { showError, showSuccess } from "@/utils/toast"

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
    password: string
    confirmPassword: string
    roleId: number
}

const DEFAULT_INTERNAL_ROLE_OPTIONS: InternalRoleOption[] = [
    {
        roleId: 1,
        roleName: "Admin",
        label: "Quản trị viên",
        hint: "Quản lý vận hành và cấu hình toàn hệ thống",
    },
    {
        roleId: 2,
        roleName: "PackagingStaff",
        label: "Nhân sự đóng gói",
        hint: "Phụ trách xác nhận và đóng gói đơn hàng",
    },
    {
        roleId: 3,
        roleName: "MarketingStaff",
        label: "Nhân sự marketing",
        hint: "Phụ trách nội dung, ưu đãi và truyền thông",
    },
    {
        roleId: 5,
        roleName: "DeliveryStaff",
        label: "Nhân sự giao hàng",
        hint: "Phụ trách vận chuyển và giao đơn",
    },
]

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

const normalizeText = (value?: string | null) => (value || "").trim().toLowerCase()

const isInternalRole = (roleName?: string | null) => {
    const normalized = normalizeText(roleName)
    if (!normalized) return false

    return (
        normalized.includes("admin") ||
        normalized.includes("marketing") ||
        normalized.includes("packaging") ||
        normalized.includes("delivery")
    )
}

const getRoleLabel = (roleName?: string | null) => {
    const normalized = normalizeText(roleName)

    if (normalized.includes("admin")) return "Quản trị viên"
    if (normalized.includes("marketing")) return "Nhân sự marketing"
    if (normalized.includes("packaging")) return "Nhân sự đóng gói"
    if (normalized.includes("delivery")) return "Nhân sự giao hàng"

    return roleName || "--"
}

const getRoleHint = (roleName?: string | null) => {
    const normalized = normalizeText(roleName)

    if (normalized.includes("admin")) return "Điều phối và quản trị hệ thống"
    if (normalized.includes("marketing")) return "Quản lý truyền thông và ưu đãi"
    if (normalized.includes("packaging")) return "Xử lý đơn và đóng gói"
    if (normalized.includes("delivery")) return "Điều phối và giao hàng"

    return "Nhân sự vận hành nội bộ"
}

const getRoleClass = (roleName?: string | null) => {
    const normalized = normalizeText(roleName)

    if (normalized.includes("admin")) {
        return "border border-violet-200 bg-violet-100 text-violet-700"
    }

    if (normalized.includes("marketing")) {
        return "border border-sky-200 bg-sky-100 text-sky-700"
    }

    if (normalized.includes("packaging")) {
        return "border border-orange-200 bg-orange-100 text-orange-700"
    }

    if (normalized.includes("delivery")) {
        return "border border-cyan-200 bg-cyan-100 text-cyan-700"
    }

    return "border border-slate-200 bg-slate-100 text-slate-700"
}

const isOperationalRoutingRole = (roleName?: string | null) => {
    const normalized = normalizeText(roleName)

    return (
        normalized.includes("packaging") ||
        normalized.includes("delivery")
    )
}

const getOperationsRoute = (roleName?: string | null) => {
    const normalized = normalizeText(roleName)

    if (normalized.includes("packaging")) return "/admin/operations"
    if (normalized.includes("delivery")) return "/admin/delivery"

    return "/admin"
}

const statusMap: Record<number, string> = {
    0: "Chưa xác minh",
    1: "Chờ phê duyệt",
    2: "Đang hoạt động",
    3: "Bị từ chối",
    4: "Đã khóa",
    5: "Bị cấm",
    6: "Đã xóa",
    7: "Đã ẩn",
}

const getStatusClass = (status?: number) => {
    switch (status) {
        case 0:
            return "border border-slate-200 bg-slate-100 text-slate-700"
        case 1:
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case 2:
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case 3:
            return "border border-rose-200 bg-rose-100 text-rose-700"
        case 4:
            return "border border-orange-200 bg-orange-100 text-orange-700"
        case 5:
            return "border border-red-200 bg-red-100 text-red-700"
        case 6:
            return "border border-slate-300 bg-slate-200 text-slate-700"
        case 7:
            return "border border-zinc-200 bg-zinc-100 text-zinc-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

const matchesKeyword = (item: InternalStaffRow, keyword: string) => {
    const normalizedKeyword = normalizeText(keyword)
    if (!normalizedKeyword) return true

    return [
        item.fullName,
        item.email,
        item.phone,
        item.roleName,
        item.position,
        item.department,
    ]
        .map((value) => normalizeText(value))
        .some((value) => value.includes(normalizedKeyword))
}

const StaffCard = ({ item }: { item: InternalStaffRow }) => {
    const navigate = useNavigate()
    const canNavigateToOperations = isOperationalRoutingRole(item.roleName)

    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/70 via-white to-white px-5 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">
                                {item.fullName || "--"}
                            </h3>

                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleClass(
                                    item.roleName
                                )}`}
                            >
                                {getRoleLabel(item.roleName)}
                            </span>

                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                    item.status
                                )}`}
                            >
                                {statusMap[item.status] ?? "Không xác định"}
                            </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                            {getRoleHint(item.roleName)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Mã nhân sự
                        </p>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                            {item.id || "--"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Mail className="h-4 w-4" />
                            <p className="text-xs font-medium uppercase tracking-wide">
                                Email
                            </p>
                        </div>
                        <p className="mt-2 break-all text-sm font-medium text-slate-900">
                            {item.email || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Phone className="h-4 w-4" />
                            <p className="text-xs font-medium uppercase tracking-wide">
                                Số điện thoại
                            </p>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                            {item.phone || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Briefcase className="h-4 w-4" />
                            <p className="text-xs font-medium uppercase tracking-wide">
                                Chức vụ
                            </p>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                            {item.position || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                            <ShieldCheck className="h-4 w-4" />
                            <p className="text-xs font-medium uppercase tracking-wide">
                                Bộ phận
                            </p>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                            {item.department || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                            <UserCog className="h-4 w-4" />
                            <p className="text-xs font-medium uppercase tracking-wide">
                                Cập nhật lúc
                            </p>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                            {formatDateTime(item.updatedAt || item.createdAt)}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Users className="h-4 w-4" />
                            <p className="text-xs font-medium uppercase tracking-wide">
                                Trạng thái hiện tại
                            </p>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                            {statusMap[item.status] ?? "Không xác định"}
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                    <button
                        type="button"
                        onClick={() => showSuccess("UI placeholder: sau này sẽ mở hồ sơ nhân sự chi tiết.")}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Xem hồ sơ
                    </button>

                    <button
                        type="button"
                        onClick={() => showSuccess("UI placeholder: sau này sẽ mở checklist onboarding và sẵn sàng làm việc.")}
                        className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                    >
                        Onboarding
                    </button>

                    {canNavigateToOperations ? (
                        <button
                            type="button"
                            onClick={() => navigate(getOperationsRoute(item.roleName))}
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Sang điều phối
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

type PlaceholderFeatureCardProps = {
    title: string
    description: string
    bullets: string[]
    icon: React.ComponentType<{ className?: string }>
    tone?: "sky" | "violet" | "emerald"
}

const PlaceholderFeatureCard = ({
    title,
    description,
    bullets,
    icon: Icon,
    tone = "sky",
}: PlaceholderFeatureCardProps) => {
    const toneClass =
        tone === "violet"
            ? "border-violet-200 bg-violet-50/70 text-violet-700"
            : tone === "emerald"
                ? "border-emerald-200 bg-emerald-50/70 text-emerald-700"
                : "border-sky-200 bg-sky-50/70 text-sky-700"

    return (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
                <div className={`rounded-2xl border p-3 ${toneClass}`}>
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{title}</h3>

                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                            Sắp triển khai
                        </span>

                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                            Chờ API
                        </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {description}
                    </p>

                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                        {bullets.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                        Sắp ra mắt
                    </div>
                </div>
            </div>
        </div>
    )
}

const CreateInternalStaffModal = ({
    open,
    form,
    roleOptions,
    submitting,
    onClose,
    onChange,
    onSubmit,
}: {
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
}) => {
    if (!open) return null

    const selectedRole = roleOptions.find((item) => item.roleId === form.roleId)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-white px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-100/80 px-3 py-1 text-xs font-semibold text-sky-800">
                                <Plus className="h-3.5 w-3.5" />
                                Tạo mới
                            </div>
                            <h2 className="mt-3 text-xl font-bold text-slate-900">
                                Tạo tài khoản nội bộ
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Tạo nhanh tài khoản cho đội ngũ vận hành nội bộ và đưa vào hệ thống.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

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

                                <div>
                                    <label className="block text-sm font-semibold text-slate-900">
                                        Mật khẩu tạm thời
                                    </label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => onChange("password", e.target.value)}
                                        placeholder="Nhập mật khẩu"
                                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-900">
                                        Xác nhận mật khẩu
                                    </label>
                                    <input
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={(e) => onChange("confirmPassword", e.target.value)}
                                        placeholder="Nhập lại mật khẩu"
                                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                    />
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

                            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-5">
                                <p className="text-sm font-semibold text-slate-900">
                                    Lưu ý
                                </p>
                                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
                                    <li>Tài khoản tạo tại đây chỉ dành cho đội ngũ nội bộ.</li>
                                    <li>Thông tin chi tiết như bộ phận hoặc chức vụ có thể được cập nhật sau.</li>
                                    <li>Nếu backend chưa map đúng role ID, hãy chỉnh lại danh sách role mặc định trong FE.</li>
                                </ul>
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
                            <Plus className="h-4 w-4" />
                            {submitting ? "Đang tạo..." : "Tạo tài khoản"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const AdminInternalStaff = () => {
    const [items, setItems] = useState<InternalStaffRow[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [openCreateModal, setOpenCreateModal] = useState(false)

    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    const [page, setPage] = useState(1)
    const [pageSize] = useState(12)
    const [totalResult, setTotalResult] = useState(0)

    const [createForm, setCreateForm] = useState<CreateInternalUserForm>({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        roleId: DEFAULT_INTERNAL_ROLE_OPTIONS[0]?.roleId ?? 1,
    })

    const internalItems = useMemo(() => {
        return items.filter((item) => isInternalRole(item.roleName))
    }, [items])

    const detectedRoleOptions = useMemo<InternalRoleOption[]>(() => {
        const fromApi = internalItems
            .filter((item) => isInternalRole(item.roleName))
            .map((item) => ({
                roleId: Number((item as any).roleId ?? 0),
                roleName: item.roleName || "",
                label: getRoleLabel(item.roleName),
                hint: getRoleHint(item.roleName),
            }))
            .filter((item) => item.roleId > 0)

        const merged = [...DEFAULT_INTERNAL_ROLE_OPTIONS, ...fromApi]
        const map = new Map<number, InternalRoleOption>()

        merged.forEach((item) => {
            if (!map.has(item.roleId)) {
                map.set(item.roleId, item)
            }
        })

        return Array.from(map.values()).sort((a, b) => a.roleId - b.roleId)
    }, [internalItems])

    const filteredItems = useMemo(() => {
        return internalItems.filter((item) => {
            const matchesRole =
                !roleFilter || normalizeText(item.roleName) === normalizeText(roleFilter)

            const matchesStatus =
                !statusFilter || String(item.status ?? "") === statusFilter

            return matchesKeyword(item, keyword) && matchesRole && matchesStatus
        })
    }, [internalItems, keyword, roleFilter, statusFilter])

    const totalPages = useMemo(() => {
        const total = Math.ceil(totalResult / pageSize)
        return total > 0 ? total : 1
    }, [pageSize, totalResult])

    const activeCount = useMemo(() => {
        return internalItems.filter((item) => item.status === 2).length
    }, [internalItems])

    const pendingCount = useMemo(() => {
        return internalItems.filter((item) => item.status === 1).length
    }, [internalItems])

    const lockedCount = useMemo(() => {
        return internalItems.filter((item) => item.status === 4 || item.status === 5).length
    }, [internalItems])

    const roleOptions = useMemo(() => {
        const uniqueRoles = Array.from(
            new Set(
                internalItems
                    .map((item) => item.roleName)
                    .filter(Boolean)
                    .filter((role) => isInternalRole(role))
            )
        ) as string[]

        return uniqueRoles.sort((a, b) => a.localeCompare(b))
    }, [internalItems])

    const loadInternalStaff = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const response = await adminService.getInternalStaffRows({
                pageNumber: page,
                pageSize,
                keyword: keyword || undefined,
            })

            const apiItems = response.items ?? []
            const onlyInternal = apiItems.filter((item) => isInternalRole(item.roleName))

            setItems(apiItems)
            setTotalResult(response.totalResult ?? onlyInternal.length)
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Không thể tải danh sách nhân sự nội bộ."
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadInternalStaff()
    }, [page, keyword]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setPage(1)
        setKeyword(search.trim())
    }

    const handleCreateFormChange = <K extends keyof CreateInternalUserForm>(
        field: K,
        value: CreateInternalUserForm[K]
    ) => {
        setCreateForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const resetCreateForm = () => {
        setCreateForm({
            fullName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
            roleId: detectedRoleOptions[0]?.roleId ?? DEFAULT_INTERNAL_ROLE_OPTIONS[0]?.roleId ?? 1,
        })
    }

    const handleOpenCreateModal = () => {
        resetCreateForm()
        setOpenCreateModal(true)
    }

    const handleCloseCreateModal = () => {
        if (submitting) return
        setOpenCreateModal(false)
    }

    const handleCreateInternalUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!createForm.fullName.trim()) {
            showError("Vui lòng nhập họ và tên.")
            return
        }

        if (!createForm.email.trim()) {
            showError("Vui lòng nhập email.")
            return
        }

        if (!createForm.password.trim()) {
            showError("Vui lòng nhập mật khẩu.")
            return
        }

        if (createForm.password.length < 6) {
            showError("Mật khẩu cần có ít nhất 6 ký tự.")
            return
        }

        if (createForm.password !== createForm.confirmPassword) {
            showError("Mật khẩu xác nhận không khớp.")
            return
        }

        try {
            setSubmitting(true)

            await adminService.createUser({
                fullName: createForm.fullName.trim(),
                email: createForm.email.trim(),
                phone: createForm.phone.trim(),
                password: createForm.password,
                roleId: createForm.roleId,
            } as any)

            showSuccess("Đã tạo tài khoản nội bộ.")
            setOpenCreateModal(false)
            resetCreateForm()
            await loadInternalStaff(true)
        } catch (err: any) {
            showError(
                err?.response?.data?.message || "Tạo tài khoản nội bộ không thành công."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <div className="space-y-6">
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-sky-50 via-white to-white px-6 py-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-100/80 px-3 py-1 text-xs font-semibold text-sky-800">
                                    <Users className="h-3.5 w-3.5" />
                                    Nhân sự vận hành
                                </div>

                                <h1 className="mt-3 text-2xl font-bold text-slate-900">
                                    Nhân sự nội bộ
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                    Theo dõi danh sách nhân sự nội bộ theo vai trò, bộ phận và tình trạng hiện tại trong hệ thống.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleOpenCreateModal}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tạo tài khoản nội bộ
                                </button>

                                <button
                                    type="button"
                                    onClick={() => void loadInternalStaff(true)}
                                    disabled={refreshing}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                                    Làm mới
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Link
                        to="/admin/approvals"
                        className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-md"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-amber-700">Cần xử lý</p>
                                <h3 className="mt-2 text-lg font-bold text-slate-900">
                                    Hồ sơ chờ phê duyệt
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Kiểm tra và xử lý các tài khoản đang chờ xác nhận.
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-amber-700" />
                        </div>
                    </Link>

                    <Link
                        to="/admin/users"
                        className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Quản lý tiếp theo</p>
                                <h3 className="mt-2 text-lg font-bold text-slate-900">
                                    Quản lý tài khoản
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Theo dõi trạng thái và thực hiện các thay đổi cần thiết trên từng tài khoản.
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
                        </div>
                    </Link>

                    <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-300">Trung tâm theo dõi</p>
                        <h3 className="mt-2 text-lg font-bold text-white">
                            Đội ngũ nội bộ
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            Tập trung theo dõi nhân sự vận hành nội bộ, không bao gồm phía đối tác hay khách hàng.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Nhân sự hiển thị</p>
                                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                                    {filteredItems.length}
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Sau khi áp dụng bộ lọc hiện tại
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-100 p-3">
                                <Users className="h-5 w-5 text-slate-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Đang hoạt động</p>
                                <h3 className="mt-2 text-2xl font-bold text-emerald-700">
                                    {activeCount}
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Tài khoản đang vận hành bình thường
                                </p>
                            </div>

                            <div className="rounded-2xl bg-emerald-50 p-3">
                                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Chờ phê duyệt</p>
                                <h3 className="mt-2 text-2xl font-bold text-amber-700">
                                    {pendingCount}
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Cần hoàn tất bước xác nhận trước khi sử dụng
                                </p>
                            </div>

                            <div className="rounded-2xl bg-amber-50 p-3">
                                <UserCog className="h-5 w-5 text-amber-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Khóa / cấm</p>
                                <h3 className="mt-2 text-2xl font-bold text-rose-700">
                                    {lockedCount}
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Cần theo dõi quyền truy cập
                                </p>
                            </div>

                            <div className="rounded-2xl bg-rose-50 p-3">
                                <Briefcase className="h-5 w-5 text-rose-700" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-slate-700" />
                        <h2 className="text-lg font-bold text-slate-900">
                            Sắp ra mắt
                        </h2>
                    </div>

                    <p className="text-sm leading-6 text-slate-500">
                        Hồ sơ nhân sự chi tiết và onboarding.
                    </p>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <PlaceholderFeatureCard
                            title="Hồ sơ nhân sự"
                            description="Hiển thị hồ sơ làm việc chi tiết của từng nhân sự khi bấm xem từ danh sách bên dưới."
                            bullets={[
                                "Bộ phận và chức vụ chính thức",
                                "Quản lý trực tiếp / người phụ trách",
                                "Ngày tham gia và ghi chú nội bộ",
                                "Mức độ hoàn thiện hồ sơ",
                            ]}
                            icon={ClipboardList}
                            tone="sky"
                        />

                        <PlaceholderFeatureCard
                            title="Điều phối theo nghiệp vụ"
                            description="Phân chia khu vực làm việc và phạm vi phụ trách sẽ được xử lý ở màn điều phối tương ứng, không gom tại đây."
                            bullets={[
                                "Nhân sự giao hàng sẽ điều phối tại trang giao hàng",
                                "Nhân sự đóng gói sẽ điều phối tại trang đóng gói",
                                "Trang này chỉ đóng vai trò theo dõi hồ sơ nhân sự",
                                "Giúp tách rõ quản lý con người và quản lý vận hành",
                            ]}
                            icon={Route}
                            tone="emerald"
                        />

                        <PlaceholderFeatureCard
                            title="Onboarding và sẵn sàng làm việc"
                            description="Theo dõi nhân sự đã đủ điều kiện vào vận hành hay chưa ngay tại trang Nhân sự nội bộ."
                            bullets={[
                                "Đã tạo tài khoản và kích hoạt",
                                "Đã cập nhật đủ hồ sơ cần thiết",
                                "Đã được phân công nghiệp vụ",
                                "Trạng thái sẵn sàng làm việc",
                            ]}
                            icon={Layers3}
                            tone="violet"
                        />
                    </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <form
                        onSubmit={handleSearch}
                        className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_minmax(260px,1fr)_auto]"
                    >
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo họ tên, email, số điện thoại hoặc chức vụ"
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        >
                            <option value="">Tất cả vai trò nội bộ</option>
                            {roleOptions.map((role) => (
                                <option key={role} value={role}>
                                    {getRoleLabel(role)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="0">Chưa xác minh</option>
                            <option value="1">Chờ phê duyệt</option>
                            <option value="2">Đang hoạt động</option>
                            <option value="3">Bị từ chối</option>
                            <option value="4">Đã khóa</option>
                            <option value="5">Bị cấm</option>
                            <option value="6">Đã xóa</option>
                            <option value="7">Đã ẩn</option>
                        </select>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Áp dụng
                        </button>
                    </form>
                </div>

                {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                ) : null}

                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-56 animate-pulse rounded-[28px] border border-slate-200 bg-slate-100"
                            />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                            <Users className="h-7 w-7 text-slate-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                            Không có nhân sự nội bộ phù hợp
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Không tìm thấy nhân sự nào khớp với điều kiện đang chọn.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4">
                            {filteredItems.map((item) => (
                                <StaffCard key={item.id} item={item} />
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Đang hiển thị{" "}
                                <span className="font-semibold text-slate-900">
                                    {filteredItems.length}
                                </span>{" "}
                                nhân sự trong trang hiện tại
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                    disabled={page === 1}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Trước
                                </button>

                                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                                    {page} / {totalPages}
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((prev) => Math.min(totalPages, prev + 1))
                                    }
                                    disabled={page >= totalPages}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <CreateInternalStaffModal
                open={openCreateModal}
                form={createForm}
                roleOptions={detectedRoleOptions}
                submitting={submitting}
                onClose={handleCloseCreateModal}
                onChange={handleCreateFormChange}
                onSubmit={handleCreateInternalUser}
            />
        </>
    )
}

export default AdminInternalStaff

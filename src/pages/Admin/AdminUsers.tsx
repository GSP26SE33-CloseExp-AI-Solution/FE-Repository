import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    MoreHorizontal,
    RefreshCw,
    Search,
    Shield,
    UserCog,
    Users,
    X,
} from "lucide-react"

import { getUsersApi, updateUserStatusApi } from "@/services/user.service"
import { User } from "@/types/user.type"
import { showError, showSuccess } from "@/utils/toast"

const USER_STATUS = {
    UNVERIFIED: 0,
    PENDING_APPROVAL: 1,
    ACTIVE: 2,
    REJECTED: 3,
    LOCKED: 4,
    BANNED: 5,
    DELETED: 6,
    HIDDEN: 7,
} as const

type SensitiveStatus =
    | typeof USER_STATUS.REJECTED
    | typeof USER_STATUS.LOCKED
    | typeof USER_STATUS.BANNED
    | typeof USER_STATUS.DELETED

type ConfirmState = {
    open: boolean
    user: User | null
    nextStatus: number | null
    reason: string
}

type ScopeFilter = "all" | "internal" | "partner" | "customer"

type UserAction = {
    label: string
    status: number
    tone: "primary" | "neutral" | "warning" | "danger"
    confirm?: boolean
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

const isPartnerRole = (roleName?: string | null) => {
    const normalized = normalizeText(roleName)
    if (!normalized) return false

    return normalized.includes("supermarket")
}

const isCustomerRole = (roleName?: string | null) => {
    const normalized = normalizeText(roleName)
    if (!normalized) return false

    return normalized.includes("vendor")
}

const getRoleLabel = (roleName?: string | null) => {
    const normalized = normalizeText(roleName)

    if (normalized.includes("admin")) return "Quản trị viên"
    if (normalized.includes("marketing")) return "Nhân sự marketing"
    if (normalized.includes("packaging")) return "Nhân sự đóng gói"
    if (normalized.includes("delivery")) return "Nhân sự giao hàng"
    if (normalized.includes("supermarket")) return "Nhân sự đối tác"
    if (normalized.includes("vendor")) return "Khách hàng"

    return roleName || "--"
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
    if (normalized.includes("supermarket")) {
        return "border border-emerald-200 bg-emerald-100 text-emerald-700"
    }
    if (normalized.includes("vendor")) {
        return "border border-pink-200 bg-pink-100 text-pink-700"
    }

    return "border border-slate-200 bg-slate-100 text-slate-700"
}

const getStatusLabel = (status: number) => {
    switch (status) {
        case USER_STATUS.UNVERIFIED:
            return "Chưa xác minh"
        case USER_STATUS.PENDING_APPROVAL:
            return "Chờ duyệt"
        case USER_STATUS.ACTIVE:
            return "Đang hoạt động"
        case USER_STATUS.REJECTED:
            return "Đã từ chối"
        case USER_STATUS.LOCKED:
            return "Tạm khóa"
        case USER_STATUS.BANNED:
            return "Bị cấm"
        case USER_STATUS.DELETED:
            return "Đã xóa"
        case USER_STATUS.HIDDEN:
            return "Đã ẩn"
        default:
            return `Không rõ (${status})`
    }
}

const getStatusClass = (status: number) => {
    switch (status) {
        case USER_STATUS.UNVERIFIED:
            return "border border-sky-200 bg-sky-100 text-sky-700"
        case USER_STATUS.PENDING_APPROVAL:
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case USER_STATUS.ACTIVE:
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case USER_STATUS.REJECTED:
            return "border border-rose-200 bg-rose-100 text-rose-700"
        case USER_STATUS.LOCKED:
            return "border border-orange-200 bg-orange-100 text-orange-700"
        case USER_STATUS.BANNED:
            return "border border-red-200 bg-red-100 text-red-700"
        case USER_STATUS.DELETED:
            return "border border-slate-300 bg-slate-200 text-slate-700"
        case USER_STATUS.HIDDEN:
            return "border border-violet-200 bg-violet-100 text-violet-700"
        default:
            return "border border-gray-200 bg-gray-100 text-gray-700"
    }
}

const statusOptions = [
    { label: "Tất cả trạng thái", value: -1 },
    { label: "Chưa xác minh", value: USER_STATUS.UNVERIFIED },
    { label: "Chờ duyệt", value: USER_STATUS.PENDING_APPROVAL },
    { label: "Đang hoạt động", value: USER_STATUS.ACTIVE },
    { label: "Đã từ chối", value: USER_STATUS.REJECTED },
    { label: "Tạm khóa", value: USER_STATUS.LOCKED },
    { label: "Bị cấm", value: USER_STATUS.BANNED },
    { label: "Đã xóa", value: USER_STATUS.DELETED },
    { label: "Đã ẩn", value: USER_STATUS.HIDDEN },
]

const SENSITIVE_STATUS_SET = new Set<number>([
    USER_STATUS.REJECTED,
    USER_STATUS.LOCKED,
    USER_STATUS.BANNED,
    USER_STATUS.DELETED,
])

const isSensitiveStatus = (status: number): status is SensitiveStatus => {
    return SENSITIVE_STATUS_SET.has(status)
}

const getConfirmTitle = (status: number) => {
    switch (status) {
        case USER_STATUS.REJECTED:
            return "Xác nhận từ chối tài khoản"
        case USER_STATUS.LOCKED:
            return "Xác nhận tạm khóa tài khoản"
        case USER_STATUS.BANNED:
            return "Xác nhận cấm tài khoản"
        case USER_STATUS.DELETED:
            return "Xác nhận xóa tài khoản"
        default:
            return "Xác nhận cập nhật trạng thái"
    }
}

const getConfirmDescription = (status: number) => {
    switch (status) {
        case USER_STATUS.REJECTED:
            return "Tài khoản sẽ bị chuyển sang trạng thái đã từ chối. Người dùng có thể bị ảnh hưởng đến khả năng tiếp tục sử dụng hệ thống."
        case USER_STATUS.LOCKED:
            return "Tài khoản sẽ bị tạm khóa và người dùng có thể không đăng nhập hoặc tiếp tục thao tác bình thường."
        case USER_STATUS.BANNED:
            return "Tài khoản sẽ bị cấm sử dụng hệ thống. Đây là thay đổi nghiêm trọng và cần được xác nhận kỹ."
        case USER_STATUS.DELETED:
            return "Tài khoản sẽ bị chuyển sang trạng thái đã xóa. Hãy chắc chắn rằng bạn thực sự muốn thực hiện thao tác này."
        default:
            return "Bạn có chắc chắn muốn cập nhật trạng thái tài khoản này không?"
    }
}

const getReasonPlaceholder = (status: number) => {
    switch (status) {
        case USER_STATUS.REJECTED:
            return "Ví dụ: Hồ sơ chưa đạt yêu cầu phê duyệt..."
        case USER_STATUS.LOCKED:
            return "Ví dụ: Tài khoản có dấu hiệu bất thường, cần khóa tạm thời..."
        case USER_STATUS.BANNED:
            return "Ví dụ: Vi phạm chính sách sử dụng hệ thống..."
        case USER_STATUS.DELETED:
            return "Ví dụ: Tài khoản không còn hiệu lực sử dụng..."
        default:
            return "Nhập lý do xác nhận..."
    }
}

const getButtonToneClass = (tone: UserAction["tone"]) => {
    switch (tone) {
        case "primary":
            return "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        case "warning":
            return "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
        case "danger":
            return "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
        default:
            return "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    }
}

const getAvailableActions = (status: number): UserAction[] => {
    switch (status) {
        case USER_STATUS.PENDING_APPROVAL:
            return [
                {
                    label: "Duyệt",
                    status: USER_STATUS.ACTIVE,
                    tone: "primary",
                },
                {
                    label: "Từ chối",
                    status: USER_STATUS.REJECTED,
                    tone: "danger",
                    confirm: true,
                },
            ]

        case USER_STATUS.ACTIVE:
            return [
                {
                    label: "Tạm khóa",
                    status: USER_STATUS.LOCKED,
                    tone: "warning",
                    confirm: true,
                },
                {
                    label: "Cấm",
                    status: USER_STATUS.BANNED,
                    tone: "danger",
                    confirm: true,
                },
                {
                    label: "Xóa",
                    status: USER_STATUS.DELETED,
                    tone: "danger",
                    confirm: true,
                },
            ]

        case USER_STATUS.REJECTED:
            return [
                {
                    label: "Kích hoạt",
                    status: USER_STATUS.ACTIVE,
                    tone: "primary",
                },
                {
                    label: "Xóa",
                    status: USER_STATUS.DELETED,
                    tone: "danger",
                    confirm: true,
                },
            ]

        case USER_STATUS.LOCKED:
            return [
                {
                    label: "Mở khóa",
                    status: USER_STATUS.ACTIVE,
                    tone: "primary",
                },
                {
                    label: "Cấm",
                    status: USER_STATUS.BANNED,
                    tone: "danger",
                    confirm: true,
                },
                {
                    label: "Xóa",
                    status: USER_STATUS.DELETED,
                    tone: "danger",
                    confirm: true,
                },
            ]

        case USER_STATUS.BANNED:
            return [
                {
                    label: "Khôi phục",
                    status: USER_STATUS.ACTIVE,
                    tone: "primary",
                },
                {
                    label: "Xóa",
                    status: USER_STATUS.DELETED,
                    tone: "danger",
                    confirm: true,
                },
            ]

        case USER_STATUS.HIDDEN:
            return [
                {
                    label: "Hiển thị lại",
                    status: USER_STATUS.ACTIVE,
                    tone: "primary",
                },
                {
                    label: "Xóa",
                    status: USER_STATUS.DELETED,
                    tone: "danger",
                    confirm: true,
                },
            ]

        case USER_STATUS.UNVERIFIED:
        case USER_STATUS.DELETED:
        default:
            return []
    }
}

const ConfirmStatusModal = ({
    open,
    user,
    nextStatus,
    reason,
    onReasonChange,
    submitting,
    onClose,
    onConfirm,
}: {
    open: boolean
    user: User | null
    nextStatus: number | null
    reason: string
    onReasonChange: (value: string) => void
    submitting: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
}) => {
    if (!open || !user || nextStatus === null) return null

    const reasonRequired = isSensitiveStatus(nextStatus)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-rose-100 p-3">
                            <AlertTriangle className="h-5 w-5 text-rose-700" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                {getConfirmTitle(nextStatus)}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                {getConfirmDescription(nextStatus)}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        Đây là thay đổi trạng thái nhạy cảm.
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Người dùng
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {user.fullName || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Email
                            </p>
                            <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                                {user.email || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Trạng thái hiện tại
                            </p>
                            <div className="mt-2">
                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                        user.status
                                    )}`}
                                >
                                    {getStatusLabel(user.status)}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Trạng thái mới
                            </p>
                            <div className="mt-2">
                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                        nextStatus
                                    )}`}
                                >
                                    {getStatusLabel(nextStatus)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                        <label className="block text-sm font-semibold text-slate-900">
                            Lý do xác nhận {reasonRequired ? <span className="text-rose-600">*</span> : null}
                        </label>
                        <p className="mt-1 text-xs text-slate-500">
                            Vui lòng ghi chú lý do để dễ dàng đối soát.
                        </p>
                        <textarea
                            value={reason}
                            onChange={(e) => onReasonChange(e.target.value)}
                            rows={4}
                            placeholder={getReasonPlaceholder(nextStatus)}
                            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    <button
                        type="button"
                        onClick={() => void onConfirm()}
                        disabled={submitting || (reasonRequired && !reason.trim())}
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? "Đang cập nhật..." : "Xác nhận thay đổi"}
                    </button>
                </div>
            </div>
        </div>
    )
}

const UserActionMenu = ({
    user,
    disabled,
    onAction,
}: {
    user: User
    disabled: boolean
    onAction: (user: User, action: UserAction) => Promise<void>
}) => {
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    const actions = useMemo(() => getAvailableActions(user.status), [user.status])
    const primaryAction = actions[0]
    const secondaryActions = actions.slice(1)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!wrapperRef.current) return
            if (!wrapperRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    if (actions.length === 0) {
        return (
            <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                Không có thao tác
            </span>
        )
    }

    return (
        <div ref={wrapperRef} className="flex items-center justify-end gap-2">
            <button
                type="button"
                disabled={disabled}
                onClick={() => void onAction(user, primaryAction)}
                className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${getButtonToneClass(
                    primaryAction.tone
                )}`}
            >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {primaryAction.label}
            </button>

            {secondaryActions.length > 0 ? (
                <div className="relative">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setOpen((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                        Thao tác
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {open ? (
                        <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                            {secondaryActions.map((action) => (
                                <button
                                    key={`${user.userId}-${action.status}`}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                        setOpen(false)
                                        void onAction(user, action)
                                    }}
                                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${action.tone === "danger"
                                        ? "text-rose-700 hover:bg-rose-50"
                                        : action.tone === "warning"
                                            ? "text-orange-700 hover:bg-orange-50"
                                            : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <span>{action.label}</span>
                                    <span className="text-xs opacity-70">
                                        {getStatusLabel(action.status)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}

const AdminUsers = () => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [actionUserId, setActionUserId] = useState<string | null>(null)
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        open: false,
        user: null,
        nextStatus: null,
        reason: "",
    })

    const [keyword, setKeyword] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState<number>(-1)
    const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all")

    const loadUsers = async () => {
        try {
            setLoading(true)
            const data = await getUsersApi()
            setUsers(data)
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Không tải được danh sách tài khoản"
            showError(message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadUsers()
    }, [])

    const roleOptions = useMemo(() => {
        const roles = Array.from(
            new Set(users.map((user) => user.roleName).filter(Boolean))
        ) as string[]
        return roles.sort((a, b) => a.localeCompare(b))
    }, [users])

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const q = keyword.trim().toLowerCase()
            const matchKeyword =
                !q ||
                user.fullName?.toLowerCase().includes(q) ||
                user.email?.toLowerCase().includes(q) ||
                user.phone?.toLowerCase().includes(q)

            const matchRole = roleFilter === "all" || user.roleName === roleFilter
            const matchStatus = statusFilter === -1 || user.status === statusFilter

            const matchScope =
                scopeFilter === "all"
                    ? true
                    : scopeFilter === "internal"
                        ? isInternalRole(user.roleName)
                        : scopeFilter === "partner"
                            ? isPartnerRole(user.roleName)
                            : isCustomerRole(user.roleName)

            return matchKeyword && matchRole && matchStatus && matchScope
        })
    }, [users, keyword, roleFilter, statusFilter, scopeFilter])

    const stats = useMemo(() => {
        return {
            total: users.length,
            active: users.filter((u) => u.status === USER_STATUS.ACTIVE).length,
            pending: users.filter((u) => u.status === USER_STATUS.PENDING_APPROVAL).length,
            locked: users.filter(
                (u) => u.status === USER_STATUS.LOCKED || u.status === USER_STATUS.BANNED
            ).length,
            internal: users.filter((u) => isInternalRole(u.roleName)).length,
            partner: users.filter((u) => isPartnerRole(u.roleName)).length,
            customer: users.filter((u) => isCustomerRole(u.roleName)).length,
        }
    }, [users])

    const applyStatusChange = async (
        userId: string,
        status: number,
        reason?: string
    ) => {
        try {
            setActionUserId(userId)
            await updateUserStatusApi(userId, { status })

            setUsers((prev) =>
                prev.map((user) =>
                    user.userId === userId ? { ...user, status } : user
                )
            )

            const trimmedReason = reason?.trim()
            if (trimmedReason) {
                showSuccess("Đã cập nhật trạng thái tài khoản. Lý do đã được ghi nhận ở giao diện quản trị.")
            } else {
                showSuccess("Đã cập nhật trạng thái tài khoản")
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Cập nhật trạng thái không thành công"
            showError(message)
        } finally {
            setActionUserId(null)
        }
    }

    const handleAction = async (user: User, action: UserAction) => {
        if (action.confirm || isSensitiveStatus(action.status)) {
            setConfirmState({
                open: true,
                user,
                nextStatus: action.status,
                reason: "",
            })
            return
        }

        await applyStatusChange(user.userId, action.status)
    }

    const handleConfirmSensitiveStatus = async () => {
        if (!confirmState.user || confirmState.nextStatus === null) return

        if (isSensitiveStatus(confirmState.nextStatus) && !confirmState.reason.trim()) {
            showError("Vui lòng nhập lý do trước khi xác nhận thay đổi trạng thái nhạy cảm.")
            return
        }

        await applyStatusChange(
            confirmState.user.userId,
            confirmState.nextStatus,
            confirmState.reason
        )

        setConfirmState({
            open: false,
            user: null,
            nextStatus: null,
            reason: "",
        })
    }

    const closeConfirmModal = () => {
        if (actionUserId) return

        setConfirmState({
            open: false,
            user: null,
            nextStatus: null,
            reason: "",
        })
    }

    return (
        <>
            <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-slate-800">
                                <Users className="h-6 w-6" />
                                <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                Theo dõi trạng thái hiện tại và xử lý các thay đổi cần thiết cho từng tài khoản trong hệ thống.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void loadUsers()}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Tải lại
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Link
                        to="/admin/approvals"
                        className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-md"
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
                        to="/admin/internal-staff"
                        className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/40 hover:shadow-md"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-sky-700">Nhân sự vận hành</p>
                                <h3 className="mt-2 text-lg font-bold text-slate-900">
                                    Đội ngũ nội bộ
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Theo dõi nhân sự trong hệ thống theo vai trò và bộ phận làm việc.
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-700" />
                        </div>
                    </Link>

                    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-300">Trung tâm quản lý</p>
                        <h3 className="mt-2 text-lg font-bold text-white">
                            Toàn bộ tài khoản
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            Tra cứu trạng thái hiện tại và thực hiện các thay đổi cần thiết trên từng tài khoản.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Tổng tài khoản</p>
                        <p className="mt-2 text-3xl font-bold text-slate-800">{stats.total}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Đang hoạt động</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.active}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Chờ duyệt</p>
                        <p className="mt-2 text-3xl font-bold text-amber-600">{stats.pending}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Khóa / cấm</p>
                        <p className="mt-2 text-3xl font-bold text-orange-600">{stats.locked}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Đối tác</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.partner}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Khách hàng</p>
                        <p className="mt-2 text-3xl font-bold text-pink-700">{stats.customer}</p>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Tìm theo họ tên, email, số điện thoại..."
                                className="w-full rounded-2xl border border-slate-300 py-2 pl-10 pr-4 outline-none focus:border-slate-900"
                            />
                        </div>

                        <select
                            value={scopeFilter}
                            onChange={(e) =>
                                setScopeFilter(
                                    e.target.value as "all" | "internal" | "partner" | "customer"
                                )
                            }
                            className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                        >
                            <option value="all">Tất cả nhóm</option>
                            <option value="internal">Chỉ nội bộ</option>
                            <option value="partner">Chỉ đối tác</option>
                            <option value="customer">Chỉ khách hàng</option>
                        </select>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                        >
                            <option value="all">Tất cả vai trò</option>
                            {roleOptions.map((role) => (
                                <option key={role} value={role}>
                                    {getRoleLabel(role)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(Number(e.target.value))}
                            className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                        >
                            {statusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Danh sách tài khoản hệ thống
                        </h2>
                    </div>

                    {loading ? (
                        <div className="px-6 py-10 text-center text-slate-500">
                            Đang tải dữ liệu...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="px-6 py-10 text-center text-slate-500">
                            Không có tài khoản nào phù hợp bộ lọc.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-white">
                                    <tr className="text-left text-sm text-slate-500">
                                        <th className="px-6 py-4 font-medium">Họ tên</th>
                                        <th className="px-6 py-4 font-medium">Email</th>
                                        <th className="px-6 py-4 font-medium">Số điện thoại</th>
                                        <th className="px-6 py-4 font-medium">Vai trò</th>
                                        <th className="px-6 py-4 font-medium">Trạng thái</th>
                                        <th className="px-6 py-4 font-medium">Ngày tạo</th>
                                        <th className="px-6 py-4 font-medium text-right">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => {
                                        const isActing = actionUserId === user.userId

                                        return (
                                            <tr
                                                key={user.userId}
                                                className="border-t border-slate-100 text-sm text-slate-700"
                                            >
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    {user.fullName || "--"}
                                                </td>
                                                <td className="px-6 py-4">{user.email || "--"}</td>
                                                <td className="px-6 py-4">{user.phone || "--"}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getRoleClass(
                                                            user.roleName
                                                        )}`}
                                                    >
                                                        <Shield className="h-3.5 w-3.5" />
                                                        {getRoleLabel(user.roleName)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                                                            user.status
                                                        )}`}
                                                    >
                                                        {getStatusLabel(user.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {new Date(user.createdAt).toLocaleString("vi-VN")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <UserActionMenu
                                                        user={user}
                                                        disabled={isActing}
                                                        onAction={handleAction}
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <div className="flex items-start gap-2">
                        <UserCog className="mt-0.5 h-4 w-4 text-slate-500" />
                        <div>
                            Mỗi tài khoản sẽ hiển thị những thao tác phù hợp với trạng thái hiện tại.
                            Với các thay đổi quan trọng như từ chối, tạm khóa, cấm hoặc xóa, hệ thống sẽ yêu cầu xác nhận trước khi cập nhật.
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmStatusModal
                open={confirmState.open}
                user={confirmState.user}
                nextStatus={confirmState.nextStatus}
                reason={confirmState.reason}
                onReasonChange={(value) =>
                    setConfirmState((prev) => ({
                        ...prev,
                        reason: value,
                    }))
                }
                submitting={Boolean(actionUserId)}
                onClose={closeConfirmModal}
                onConfirm={handleConfirmSensitiveStatus}
            />
        </>
    )
}

export default AdminUsers

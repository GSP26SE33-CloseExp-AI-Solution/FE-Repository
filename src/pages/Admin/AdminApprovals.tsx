import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    RefreshCcw,
    Search,
    Store,
    UserRound,
    Users,
    XCircle,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { AdminApprovalRow } from "@/types/admin.type"

type ScopeFilter = "all" | "internal" | "partner" | "customer"

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

const statusMap: Record<number, string> = {
    0: "Chờ duyệt",
    1: "Đã duyệt",
    2: "Từ chối",
}

const getStatusClass = (status?: number) => {
    switch (status) {
        case 0:
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case 1:
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case 2:
            return "border border-rose-200 bg-rose-100 text-rose-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

const ApprovalCard = ({
    item,
    onApprove,
    onReject,
    actingId,
}: {
    item: AdminApprovalRow
    onApprove: (userId: string) => Promise<void>
    onReject: (userId: string) => Promise<void>
    actingId: string
}) => {
    const isActing = actingId === item.userId
    const internal = isInternalRole(item.roleName)
    const partner = isPartnerRole(item.roleName)
    const customer = isCustomerRole(item.roleName)

    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-white px-5 py-4">
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

                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${internal
                                        ? "border border-sky-200 bg-sky-50 text-sky-700"
                                        : partner
                                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : customer
                                                ? "border border-pink-200 bg-pink-50 text-pink-700"
                                                : "border border-slate-200 bg-slate-50 text-slate-700"
                                    }`}
                            >
                                {internal
                                    ? "Nội bộ"
                                    : partner
                                        ? "Đối tác"
                                        : customer
                                            ? "Khách hàng"
                                            : "Khác"}
                            </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                            Hồ sơ đang chờ xác nhận trước khi đưa vào sử dụng.
                        </p>
                    </div>

                    <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
                        <button
                            type="button"
                            onClick={() => void onApprove(item.userId)}
                            disabled={isActing}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {isActing ? "Đang xử lý..." : "Duyệt tài khoản"}
                        </button>

                        <button
                            type="button"
                            onClick={() => void onReject(item.userId)}
                            disabled={isActing}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <XCircle className="h-4 w-4" />
                            {isActing ? "Đang xử lý..." : "Từ chối"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Email
                        </p>
                        <p className="mt-1 break-all text-sm font-medium text-slate-900">
                            {item.email || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Số điện thoại
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {item.phone || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Vai trò
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {getRoleLabel(item.roleName)}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Đơn vị liên quan
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {item.supermarketName || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Vị trí
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {item.position || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Thời điểm tạo
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {formatDateTime(item.createdAt)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

const AdminApprovals = () => {
    const [items, setItems] = useState<AdminApprovalRow[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [actingId, setActingId] = useState("")
    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")
    const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all")
    const [error, setError] = useState("")

    const [page, setPage] = useState(1)
    const [pageSize] = useState(12)
    const [totalResult, setTotalResult] = useState(0)

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            if (scopeFilter === "internal") return isInternalRole(item.roleName)
            if (scopeFilter === "partner") return isPartnerRole(item.roleName)
            if (scopeFilter === "customer") return isCustomerRole(item.roleName)
            return true
        })
    }, [items, scopeFilter])

    const pendingInternal = useMemo(() => {
        return items.filter((item) => isInternalRole(item.roleName)).length
    }, [items])

    const pendingPartner = useMemo(() => {
        return items.filter((item) => isPartnerRole(item.roleName)).length
    }, [items])

    const pendingCustomer = useMemo(() => {
        return items.filter((item) => isCustomerRole(item.roleName)).length
    }, [items])

    const totalPages = useMemo(() => {
        const total = Math.ceil(totalResult / pageSize)
        return total > 0 ? total : 1
    }, [pageSize, totalResult])

    const loadApprovals = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const response = await adminService.getApprovalRows({
                pageNumber: page,
                pageSize,
                keyword,
            })

            setItems(response.items ?? [])
            setTotalResult(response.totalResult ?? 0)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải danh sách chờ duyệt.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadApprovals()
    }, [page, keyword]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setPage(1)
        setKeyword(search.trim())
    }

    const handleApprove = async (userId: string) => {
        try {
            setActingId(userId)
            await adminService.approveUser(userId)
            await loadApprovals(true)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Duyệt tài khoản không thành công.")
        } finally {
            setActingId("")
        }
    }

    const handleReject = async (userId: string) => {
        try {
            setActingId(userId)
            await adminService.rejectUser(userId)
            await loadApprovals(true)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Từ chối tài khoản không thành công.")
        } finally {
            setActingId("")
        }
    }

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-amber-50 via-white to-white px-6 py-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/80 px-3 py-1 text-xs font-semibold text-amber-800">
                                <Clock3 className="h-3.5 w-3.5" />
                                Cần xử lý
                            </div>

                            <h1 className="mt-3 text-2xl font-bold text-slate-900">
                                Phê duyệt tài khoản
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Xem và xử lý các tài khoản đang chờ xác nhận trước khi đưa vào sử dụng trong hệ thống.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                to="/admin/users"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <ArrowRight className="h-4 w-4" />
                                Mở quản lý tài khoản
                            </Link>

                            <button
                                type="button"
                                onClick={() => void loadApprovals(true)}
                                disabled={refreshing}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-amber-100 p-3">
                            <Clock3 className="h-5 w-5 text-amber-700" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Đang chờ xử lý</p>
                            <p className="text-2xl font-bold text-slate-900">{totalResult}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-sky-100 p-3">
                            <Users className="h-5 w-5 text-sky-700" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Nội bộ</p>
                            <p className="text-2xl font-bold text-slate-900">{pendingInternal}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-100 p-3">
                            <Store className="h-5 w-5 text-emerald-700" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Đối tác</p>
                            <p className="text-2xl font-bold text-slate-900">{pendingPartner}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-pink-100 p-3">
                            <Users className="h-5 w-5 text-pink-700" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Khách hàng</p>
                            <p className="text-2xl font-bold text-slate-900">{pendingCustomer}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-violet-100 p-3">
                            <UserRound className="h-5 w-5 text-violet-700" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Trang đang xem</p>
                            <p className="text-2xl font-bold text-slate-900">{page}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <form
                    onSubmit={handleSearch}
                    className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_auto]"
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo họ tên, email hoặc số điện thoại"
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                    </div>

                    <select
                        value={scopeFilter}
                        onChange={(e) =>
                            setScopeFilter(
                                e.target.value as "all" | "internal" | "partner" | "customer"
                            )
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    >
                        <option value="all">Tất cả nhóm</option>
                        <option value="internal">Chỉ nội bộ</option>
                        <option value="partner">Chỉ đối tác</option>
                        <option value="customer">Chỉ khách hàng</option>
                    </select>

                    <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Áp dụng
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

                <Link
                    to="/admin/internal-staff"
                    className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Theo dõi nhân sự</p>
                            <h3 className="mt-2 text-lg font-bold text-slate-900">
                                Nhân sự nội bộ
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Xem danh sách nhân sự vận hành theo bộ phận, vai trò và tình trạng hiện tại.
                            </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
                    </div>
                </Link>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-56 animate-pulse rounded-[28px] border border-slate-200 bg-slate-100"
                        />
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <Clock3 className="h-7 w-7 text-slate-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                        Chưa có tài khoản cần xử lý
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Không tìm thấy hồ sơ phù hợp với điều kiện đang chọn.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4">
                        {filteredItems.map((item) => (
                            <ApprovalCard
                                key={item.id}
                                item={item}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                actingId={actingId}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Đang hiển thị{" "}
                            <span className="font-semibold text-slate-900">
                                {filteredItems.length}
                            </span>{" "}
                            trong tổng số{" "}
                            <span className="font-semibold text-slate-900">{totalResult}</span>{" "}
                            hồ sơ
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
    )
}

export default AdminApprovals

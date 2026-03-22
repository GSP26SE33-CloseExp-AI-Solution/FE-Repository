import { useEffect, useMemo, useState } from "react"
import {
    CheckCircle2,
    Clock3,
    RefreshCcw,
    Search,
    Store,
    UserRound,
    XCircle,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { AdminApprovalRow } from "@/types/admin.type"

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

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{item.fullName}</h3>
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(item.status)}`}
                        >
                            {statusMap[item.status] ?? "Không xác định"}
                        </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                                {item.roleName || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Siêu thị
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                                {item.supermarketName || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Chức vụ
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                                {item.position || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Ngày tạo
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                                {formatDateTime(item.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex w-full shrink-0 flex-col gap-3 lg:w-auto">
                    <button
                        type="button"
                        onClick={() => void onApprove(item.userId)}
                        disabled={isActing}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {isActing ? "Đang xử lý..." : "Duyệt"}
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
    )
}

const AdminApprovals = () => {
    const [items, setItems] = useState<AdminApprovalRow[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [actingId, setActingId] = useState("")
    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")
    const [error, setError] = useState("")

    const [page, setPage] = useState(1)
    const [pageSize] = useState(12)
    const [totalResult, setTotalResult] = useState(0)

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
    }, [page, keyword])

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
            setError(err?.response?.data?.message || "Duyệt tài khoản thất bại.")
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
            setError(err?.response?.data?.message || "Từ chối tài khoản thất bại.")
        } finally {
            setActingId("")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Approvals</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Quản lý các tài khoản đang chờ phê duyệt trong hệ thống.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadApprovals(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                    <div className="rounded-2xl bg-amber-50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-amber-100 p-3">
                                <Clock3 className="h-5 w-5 text-amber-700" />
                            </div>
                            <div>
                                <p className="text-sm text-amber-700">Đang chờ duyệt</p>
                                <p className="text-2xl font-bold text-amber-900">{totalResult}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-sky-50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-sky-100 p-3">
                                <UserRound className="h-5 w-5 text-sky-700" />
                            </div>
                            <div>
                                <p className="text-sm text-sky-700">Trang hiện tại</p>
                                <p className="text-2xl font-bold text-sky-900">{page}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-emerald-100 p-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-700">Số bản ghi/trang</p>
                                <p className="text-2xl font-bold text-emerald-900">{pageSize}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-violet-50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-violet-100 p-3">
                                <Store className="h-5 w-5 text-violet-700" />
                            </div>
                            <div>
                                <p className="text-sm text-violet-700">Tổng số trang</p>
                                <p className="text-2xl font-bold text-violet-900">{totalPages}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center"
                >
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, email, số điện thoại..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                    </div>

                    <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Tìm kiếm
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
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
                        />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <Clock3 className="h-7 w-7 text-slate-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                        Không có tài khoản chờ duyệt
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Hiện tại chưa có hồ sơ nào phù hợp với bộ lọc đang chọn.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4">
                        {items.map((item) => (
                            <ApprovalCard
                                key={item.id}
                                item={item}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                actingId={actingId}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Hiển thị{" "}
                            <span className="font-semibold text-slate-900">{items.length}</span> /
                            <span className="font-semibold text-slate-900">
                                {" "}
                                {totalResult}
                            </span>{" "}
                            hồ sơ chờ duyệt
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

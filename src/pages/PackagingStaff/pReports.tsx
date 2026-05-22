import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Loader2,
    PackageCheck,
    RefreshCcw,
    Search,
    XCircle,
} from "lucide-react"

import { packagingService } from "@/services/packaging.service"
import type {
    PackagingHistoryQuery,
    PackagingHistoryRecord,
} from "@/types/packaging.type"
import { showError } from "@/utils/toast"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
    { label: "Tất cả trạng thái", value: "" },
    { label: "Đang đóng gói", value: "Packaging" },
    { label: "Hoàn tất", value: "Completed" },
    { label: "Thất bại", value: "Failed" },
]

const formatDateTime = (value?: string | null) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

const mapStatusLabel = (status?: string) => {
    switch (status) {
        case "Completed":
            return "Hoàn tất"
        case "Failed":
            return "Thất bại"
        case "Packaging":
            return "Đang đóng gói"
        case "Pending":
            return "Chờ xử lý"
        default:
            return status || "--"
    }
}

const getStatusClass = (status?: string) => {
    switch (status) {
        case "Completed":
            return "border-emerald-200 bg-emerald-50 text-emerald-700"
        case "Failed":
            return "border-rose-200 bg-rose-50 text-rose-700"
        case "Packaging":
            return "border-sky-200 bg-sky-50 text-sky-700"
        case "Pending":
            return "border-amber-200 bg-amber-50 text-amber-700"
        default:
            return "border-slate-200 bg-slate-50 text-slate-600"
    }
}

const getStatusIcon = (status?: string) => {
    switch (status) {
        case "Completed":
            return <CheckCircle2 className="h-3.5 w-3.5" />
        case "Failed":
            return <XCircle className="h-3.5 w-3.5" />
        default:
            return <Clock3 className="h-3.5 w-3.5" />
    }
}

const normalizeDateInputToIso = (value: string, endOfDay = false) => {
    if (!value) return undefined

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return undefined

    if (endOfDay) {
        date.setHours(23, 59, 59, 999)
    } else {
        date.setHours(0, 0, 0, 0)
    }

    return date.toISOString()
}

const PReports = () => {
    const [items, setItems] = useState<PackagingHistoryRecord[]>([])
    const [loading, setLoading] = useState(false)

    const [orderCode, setOrderCode] = useState("")
    const [status, setStatus] = useState("")
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")

    const [page, setPage] = useState(1)
    const [totalResult, setTotalResult] = useState(0)

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(totalResult / PAGE_SIZE)),
        [totalResult]
    )

    const summary = useMemo(() => {
        const completed = items.filter((item) => item.status === "Completed").length
        const failed = items.filter((item) => item.status === "Failed").length
        const totalQuantity = items.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
        )

        return { completed, failed, totalQuantity }
    }, [items])

    const loadHistory = useCallback(
        async (nextPage = page) => {
            setLoading(true)

            try {
                const params: PackagingHistoryQuery = {
                    pageNumber: nextPage,
                    pageSize: PAGE_SIZE,
                    orderCode: orderCode.trim() || undefined,
                    status: status || undefined,
                    fromDate: normalizeDateInputToIso(fromDate),
                    toDate: normalizeDateInputToIso(toDate, true),
                }

                const response = await packagingService.getHistory(params)
                const data = response.data

                setItems(data?.items ?? [])
                setTotalResult(data?.totalResult ?? 0)
                setPage(data?.page || nextPage)
            } catch (error) {
                console.error("[PReports] loadHistory failed:", error)
                showError("Không thể tải lịch sử đóng gói.")
            } finally {
                setLoading(false)
            }
        },
        [fromDate, orderCode, page, status, toDate]
    )

    useEffect(() => {
        void loadHistory(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void loadHistory(1)
    }

    const handleReset = () => {
        setOrderCode("")
        setStatus("")
        setFromDate("")
        setToDate("")
        setPage(1)

        setTimeout(() => {
            void loadHistory(1)
        }, 0)
    }

    const handlePrevPage = () => {
        const nextPage = Math.max(1, page - 1)
        void loadHistory(nextPage)
    }

    const handleNextPage = () => {
        const nextPage = Math.min(totalPages, page + 1)
        void loadHistory(nextPage)
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-5">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                <PackageCheck className="h-3.5 w-3.5" />
                                Lịch sử đóng gói
                            </div>

                            <h1 className="mt-3 text-2xl font-bold text-slate-950">
                                Theo dõi các sản phẩm đã xử lý
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Tra cứu theo mã đơn, trạng thái và khoảng thời gian đóng gói.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void loadHistory(page)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={loading}
                        >
                            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                            Làm mới
                        </button>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Dòng lịch sử
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-950">
                                {totalResult}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                Hoàn tất trên trang
                            </p>
                            <p className="mt-2 text-2xl font-bold text-emerald-700">
                                {summary.completed}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                                Tổng số lượng trên trang
                            </p>
                            <p className="mt-2 text-2xl font-bold text-sky-700">
                                {summary.totalQuantity}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <form
                        onSubmit={handleSubmit}
                        className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto_auto]"
                    >
                        <label className="space-y-1.5">
                            <span className="text-xs font-semibold text-slate-600">
                                Mã đơn
                            </span>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={orderCode}
                                    onChange={(event) => setOrderCode(event.target.value)}
                                    placeholder="Nhập mã đơn..."
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                                />
                            </div>
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-xs font-semibold text-slate-600">
                                Trạng thái
                            </span>
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value || "all"} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-xs font-semibold text-slate-600">
                                Từ ngày
                            </span>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(event) => setFromDate(event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                            />
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-xs font-semibold text-slate-600">
                                Đến ngày
                            </span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(event) => setToDate(event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                            Lọc
                        </button>

                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={loading}
                            className="mt-auto inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Xóa lọc
                        </button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-950">
                                Danh sách lịch sử
                            </h2>
                            <p className="text-sm text-slate-500">
                                Hiển thị {items.length} / {totalResult} dòng
                            </p>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Trang {page}/{totalPages}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-[320px] items-center justify-center">
                            <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                                <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                                Đang tải lịch sử đóng gói...
                            </div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-base font-bold text-slate-950">
                                Chưa có lịch sử phù hợp
                            </h3>
                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                Thử đổi mã đơn, trạng thái hoặc khoảng thời gian để xem thêm kết quả.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Mã đơn
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Sản phẩm
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                            SL
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Nhân viên
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Trạng thái
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Thời gian
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Lý do lỗi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {items.map((item) => (
                                        <tr
                                            key={item.packagingId}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <div className="font-semibold text-slate-950">
                                                    {item.orderCode || "--"}
                                                </div>
                                                <div className="mt-0.5 text-xs text-slate-400">
                                                    {item.orderId}
                                                </div>
                                            </td>

                                            <td className="min-w-[220px] px-5 py-4">
                                                <div className="font-medium text-slate-900">
                                                    {item.productName || "--"}
                                                </div>
                                                <div className="mt-0.5 text-xs text-slate-400">
                                                    Item: {item.orderItemId}
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                                                {item.quantity}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                {item.packagingStaffName || "--"}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
                                                        getStatusClass(item.status)
                                                    )}
                                                >
                                                    {getStatusIcon(item.status)}
                                                    {mapStatusLabel(item.status)}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                {formatDateTime(item.packagedAt)}
                                            </td>

                                            <td className="min-w-[180px] px-5 py-4 text-sm text-slate-500">
                                                {item.failureReason || "--"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Tổng cộng <span className="font-semibold text-slate-700">{totalResult}</span> dòng lịch sử
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePrevPage}
                                disabled={loading || page <= 1}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Trước
                            </button>

                            <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={loading || page >= totalPages}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default PReports

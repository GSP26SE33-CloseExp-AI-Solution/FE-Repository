import { useEffect, useMemo, useState } from "react"
import type { ComponentType, FormEvent, ReactNode } from "react"
import {
    Archive,
    ChevronRight,
    ClipboardList,
    PackageCheck,
    RefreshCcw,
    Search,
    ShoppingBag,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type {
    PackagingOrderDetail,
    PackagingPendingOrderItem,
} from "@/types/admin.type"

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
})

const formatNumber = (value?: number) => {
    return new Intl.NumberFormat("vi-VN").format(value ?? 0)
}

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

const getStatusClass = (status?: string) => {
    const normalized = status?.trim().toLowerCase()

    switch (normalized) {
        case "pending":
        case "waiting":
        case "new":
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case "processing":
        case "packing":
        case "packaging":
            return "border border-sky-200 bg-sky-100 text-sky-700"
        case "completed":
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case "failed":
        case "cancelled":
            return "border border-rose-200 bg-rose-100 text-rose-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

const getErrorMessage = (err: unknown, fallback: string) => {
    const error = err as
        | {
            response?: {
                data?: {
                    message?: string
                    errors?: string[]
                    error?: string[]
                }
            }
            message?: string
        }
        | undefined

    return (
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.response?.data?.error?.[0] ||
        error?.message ||
        fallback
    )
}

const StatCard = ({
    title,
    value,
    hint,
    icon: Icon,
}: {
    title: string
    value: string | number
    hint: string
    icon: ComponentType<{ className?: string }>
}) => {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
                    <p className="mt-2 text-sm text-slate-500">{hint}</p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-3">
                    <Icon className="h-5 w-5 text-slate-700" />
                </div>
            </div>
        </div>
    )
}

const SectionCard = ({
    title,
    description,
    children,
    right,
}: {
    title: string
    description?: string
    children: ReactNode
    right?: ReactNode
}) => {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                    ) : null}
                </div>
                {right}
            </div>

            {children}
        </div>
    )
}

const DetailPanel = ({
    detail,
    actingAction,
    onReady,
}: {
    detail: PackagingOrderDetail
    actingAction: string
    onReady: () => Promise<void>
}) => {
    const isReadyLoading = actingAction === "ready"
    const packagingStatus = detail.packagingStatus?.trim().toLowerCase()
    const isCompleted = packagingStatus === "completed"
    const isFailed = packagingStatus === "failed"

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Mã đơn
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {detail.orderCode || detail.orderId}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Trạng thái đơn
                    </p>
                    <div className="mt-1">
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                detail.orderStatus
                            )}`}
                        >
                            {detail.orderStatus || "--"}
                        </span>
                    </div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Trạng thái đóng gói
                    </p>
                    <div className="mt-1">
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                detail.packagingStatus
                            )}`}
                        >
                            {detail.packagingStatus || "--"}
                        </span>
                    </div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Hình thức giao
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {detail.deliveryType || "--"}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Khách hàng
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {detail.customerName || "--"}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Khung giờ
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {detail.timeSlotDisplay || "--"}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Tổng sản phẩm
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatNumber(detail.totalItems)}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Giá trị đơn
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {currency.format(detail.finalAmount ?? 0)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4 xl:col-span-2">
                    <h3 className="text-base font-bold text-slate-900">Danh sách sản phẩm</h3>

                    {detail.items?.length ? (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-left text-sm text-slate-500">
                                        <th className="px-4 py-2 font-medium">Sản phẩm</th>
                                        <th className="px-4 py-2 font-medium">Số lượng</th>
                                        <th className="px-4 py-2 font-medium">Đơn giá</th>
                                        <th className="px-4 py-2 font-medium">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detail.items.map((item) => (
                                        <tr key={item.orderItemId} className="bg-slate-50">
                                            <td className="rounded-l-2xl px-4 py-3 text-sm font-medium text-slate-900">
                                                {item.productName || "--"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {formatNumber(item.quantity)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {currency.format(item.unitPrice ?? 0)}
                                            </td>
                                            <td className="rounded-r-2xl px-4 py-3 text-sm text-slate-700">
                                                {currency.format(item.subTotal ?? 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            Đơn này chưa có sản phẩm để hiển thị.
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-base font-bold text-slate-900">Thông tin đóng gói</h3>

                    <div className="mt-4 space-y-4">
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            <p>
                                <span className="font-medium text-slate-900">
                                    Mã bản ghi đóng gói:
                                </span>{" "}
                                {detail.packagingRecordId || "--"}
                            </p>
                            <p className="mt-1">
                                <span className="font-medium text-slate-900">
                                    Nhân sự đóng gói:
                                </span>{" "}
                                {detail.packagingStaffName || detail.packagingStaffId || "--"}
                            </p>
                            <p className="mt-1">
                                <span className="font-medium text-slate-900">
                                    Đóng gói lúc:
                                </span>{" "}
                                {formatDateTime(detail.packagedAt)}
                            </p>
                            <p className="mt-1">
                                <span className="font-medium text-slate-900">
                                    Ngày đặt:
                                </span>{" "}
                                {formatDateTime(detail.orderDate)}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => void onReady()}
                                disabled={isReadyLoading || isCompleted || isFailed}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <PackageCheck className="h-4 w-4" />
                                {isReadyLoading ? "Đang xử lý..." : "Xác nhận hoàn tất đóng gói"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const AdminOperations = () => {
    const [activeTab, setActiveTab] = useState<"pending" | "detail">("pending")

    const [items, setItems] = useState<PackagingPendingOrderItem[]>([])
    const [selectedDetail, setSelectedDetail] = useState<PackagingOrderDetail | null>(null)

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)
    const [actingAction, setActingAction] = useState("")
    const [error, setError] = useState("")

    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")

    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalResult, setTotalResult] = useState(0)

    const filteredItems = useMemo(() => {
        const normalized = keyword.trim().toLowerCase()

        return items.filter((item) => {
            if (!normalized) return true

            return Boolean(
                item.orderCode?.toLowerCase().includes(normalized) ||
                item.customerName?.toLowerCase().includes(normalized) ||
                item.orderStatus?.toLowerCase().includes(normalized) ||
                item.packagingStatus?.toLowerCase().includes(normalized) ||
                item.deliveryType?.toLowerCase().includes(normalized) ||
                item.timeSlotDisplay?.toLowerCase().includes(normalized)
            )
        })
    }, [items, keyword])

    const totalPages = useMemo(() => {
        const total = Math.ceil(totalResult / pageSize)
        return total > 0 ? total : 1
    }, [pageSize, totalResult])

    const totalItemsCount = useMemo(() => {
        return filteredItems.reduce((sum, item) => sum + (item.totalItems ?? 0), 0)
    }, [filteredItems])

    const totalAmount = useMemo(() => {
        return filteredItems.reduce((sum, item) => sum + (item.finalAmount ?? 0), 0)
    }, [filteredItems])

    const completedCount = useMemo(() => {
        return filteredItems.filter((item) => {
            const normalized = item.packagingStatus?.trim().toLowerCase()
            return normalized === "completed"
        }).length
    }, [filteredItems])

    const loadPendingOrders = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const response = await adminService.getPackagingPendingOrders({
                pageNumber: page,
                pageSize,
            })

            setItems(response.items ?? [])
            setTotalResult(response.totalResult ?? 0)
        } catch (err) {
            setError(
                getErrorMessage(err, "Không thể tải danh sách đơn chờ đóng gói.")
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const loadOrderDetail = async (orderId: string) => {
        try {
            setDetailLoading(true)
            setError("")

            const response = await adminService.getPackagingOrderDetail(orderId)
            setSelectedDetail(response)
            setActiveTab("detail")
        } catch (err) {
            setError(getErrorMessage(err, "Không thể tải chi tiết đơn hàng."))
        } finally {
            setDetailLoading(false)
        }
    }

    useEffect(() => {
        void loadPendingOrders()
    }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setKeyword(search.trim())
    }

    const handleReady = async () => {
        if (!selectedDetail) return

        try {
            setActingAction("ready")
            setError("")

            await adminService.markPackagingReady(selectedDetail.orderId)
            await loadOrderDetail(selectedDetail.orderId)
            await loadPendingOrders(true)
        } catch (err) {
            setError(
                getErrorMessage(err, "Cập nhật trạng thái đóng gói không thành công.")
            )
        } finally {
            setActingAction("")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Điều phối đóng gói</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Theo dõi và xử lý các đơn hàng trong luồng đóng gói vận hành.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadPendingOrders(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Đơn hiển thị"
                    value={filteredItems.length}
                    hint="Số đơn đang hiển thị trong danh sách"
                    icon={ClipboardList}
                />
                <StatCard
                    title="Tổng sản phẩm"
                    value={formatNumber(totalItemsCount)}
                    hint="Tổng quantity của các đơn hiện tại"
                    icon={ShoppingBag}
                />
                <StatCard
                    title="Giá trị đơn"
                    value={currency.format(totalAmount)}
                    hint="Tổng giá trị các đơn đang hiển thị"
                    icon={Archive}
                />
                <StatCard
                    title="Đã hoàn tất"
                    value={completedCount}
                    hint="Số đơn đã hoàn tất đóng gói"
                    icon={PackageCheck}
                />
            </div>

            <SectionCard
                title="Bộ lọc và điều hướng"
                description="Chọn một đơn để xem chi tiết và cập nhật trạng thái đóng gói."
                right={
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("pending")}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "pending"
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            Đơn chờ xử lý
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("detail")}
                            disabled={!selectedDetail}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "detail"
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            Chi tiết đơn
                        </button>
                    </div>
                }
            >
                <form
                    onSubmit={handleSearch}
                    className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(280px,1fr)_auto]"
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo mã đơn, khách hàng, trạng thái, loại giao..."
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
            </SectionCard>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            {activeTab === "pending" ? (
                <SectionCard
                    title="Danh sách đơn chờ đóng gói"
                    description="Chọn một đơn để xem chi tiết và cập nhật trạng thái."
                >
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-28 animate-pulse rounded-2xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                            Không có đơn hàng phù hợp.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredItems.map((item) => (
                                <button
                                    key={item.orderId}
                                    type="button"
                                    onClick={() => void loadOrderDetail(item.orderId)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-base font-semibold text-slate-900">
                                                    {item.orderCode || item.orderId}
                                                </p>

                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                        item.orderStatus
                                                    )}`}
                                                >
                                                    {item.orderStatus || "--"}
                                                </span>

                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                        item.packagingStatus
                                                    )}`}
                                                >
                                                    {item.packagingStatus || "--"}
                                                </span>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Khách hàng:
                                                    </span>{" "}
                                                    {item.customerName || "--"}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Khung giờ:
                                                    </span>{" "}
                                                    {item.timeSlotDisplay || "--"}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Hình thức:
                                                    </span>{" "}
                                                    {item.deliveryType || "--"}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Tổng sản phẩm:
                                                    </span>{" "}
                                                    {formatNumber(item.totalItems)}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Giá trị:
                                                    </span>{" "}
                                                    {currency.format(item.finalAmount ?? 0)}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Ngày tạo:
                                                    </span>{" "}
                                                    {formatDateTime(item.orderDate)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Xem chi tiết
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Hiển thị{" "}
                            <span className="font-semibold text-slate-900">
                                {filteredItems.length}
                            </span>{" "}
                            /{" "}
                            <span className="font-semibold text-slate-900">
                                {totalResult}
                            </span>{" "}
                            đơn hàng
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
                </SectionCard>
            ) : null}

            {activeTab === "detail" ? (
                <SectionCard
                    title="Chi tiết đơn đóng gói"
                    description="Theo dõi nội dung đơn hàng và thao tác cập nhật trạng thái."
                >
                    {detailLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-24 animate-pulse rounded-2xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : selectedDetail ? (
                        <DetailPanel
                            detail={selectedDetail}
                            actingAction={actingAction}
                            onReady={handleReady}
                        />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-16 text-center text-sm text-slate-500">
                            Chưa có đơn nào được chọn. Hãy quay lại tab Đơn chờ xử lý và chọn
                            một đơn để xem chi tiết.
                        </div>
                    )}
                </SectionCard>
            ) : null}
        </div>
    )
}

export default AdminOperations

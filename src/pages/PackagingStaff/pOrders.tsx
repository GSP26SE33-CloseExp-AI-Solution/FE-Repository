import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    ArrowUpDown,
    Box,
    ChevronRight,
    Clock3,
    Loader2,
    PackageCheck,
    RefreshCcw,
    Search,
    ShoppingBag,
    Truck,
    UserRound,
} from "lucide-react"

import { packagingService } from "@/services/packaging.service"
import type { PackagingOrderSummary } from "@/types/packaging.type"
import { showError } from "@/utils/toast"

import {
    cn,
    currency,
    formatDateTime,
    getDeliveryTypeLabel,
    getFriendlyPackagingErrorMessage,
    getOrderStatusLabel,
    getPackagingStatusClass,
    getPackagingStepText,
    sortOrdersByDeliverySlot,
} from "./packagingShared"

const PackageOrders = () => {
    const navigate = useNavigate()

    const [orders, setOrders] = useState<PackagingOrderSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalResult, setTotalResult] = useState(0)
    const [keyword, setKeyword] = useState("")

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalResult / pageSize))
    }, [pageSize, totalResult])

    const sortedOrders = useMemo(() => sortOrdersByDeliverySlot(orders), [orders])

    const filteredOrders = useMemo(() => {
        const q = keyword.trim().toLowerCase()

        if (!q) return sortedOrders

        return sortedOrders.filter((item) => {
            return (
                item.orderCode?.toLowerCase().includes(q) ||
                item.customerName?.toLowerCase().includes(q) ||
                item.deliveryType?.toLowerCase().includes(q) ||
                item.timeSlotDisplay?.toLowerCase().includes(q) ||
                item.packagingStatus?.toLowerCase().includes(q) ||
                item.orderStatus?.toLowerCase().includes(q)
            )
        })
    }, [sortedOrders, keyword])

    const firstPriorityOrder = filteredOrders[0]

    const fetchOrders = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) setRefreshing(true)
                else setLoading(true)

                const response = await packagingService.getPendingOrders(page, pageSize)

                setOrders(response.data?.items || [])
                setTotalResult(response.data?.totalResult || 0)
            } catch (error: any) {
                console.error("PackageOrders.fetchOrders error:", {
                    error,
                    status: error?.response?.status,
                    responseData: error?.response?.data,
                })

                showError(
                    getFriendlyPackagingErrorMessage(
                        error,
                        "Không tải được danh sách đơn đóng gói."
                    )
                )
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        },
        [page, pageSize]
    )

    useEffect(() => {
        void fetchOrders()
    }, [fetchOrders])

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 shadow-sm">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">
                            Đóng gói / Danh sách đơn
                        </p>
                        <h1 className="mt-2 text-2xl font-bold text-slate-900 lg:text-3xl">
                            Danh sách đơn chờ đóng gói
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Đơn được sắp theo khung giờ giao sớm nhất trước, giúp xử lý đúng thứ tự ưu tiên.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">Đơn trang này</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {orders.length}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">Tổng kết quả</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {totalResult}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">Ưu tiên gần nhất</p>
                            <p className="mt-1 text-sm font-bold text-sky-700">
                                {firstPriorityOrder?.timeSlotDisplay || "--"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Tìm theo mã đơn, khách hàng, loại giao nhận, khung giờ..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400"
                        />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 ring-1 ring-sky-200">
                            <ArrowUpDown className="h-4 w-4" />
                            Giờ giao sớm → muộn
                        </div>

                        <button
                            type="button"
                            onClick={() => void fetchOrders(true)}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCcw
                                className={cn("h-4 w-4", refreshing && "animate-spin")}
                            />
                            Làm mới
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="flex min-h-[240px] items-center justify-center rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Đang tải danh sách đơn...</span>
                        </div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="rounded-[28px] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <PackageCheck className="h-7 w-7 text-slate-500" />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">
                            Chưa có đơn phù hợp
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Hiện chưa có đơn chờ đóng gói khớp với từ khóa đang tìm.
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order, index) => {
                        const isFirst = index === 0

                        return (
                            <div
                                key={order.orderId}
                                className={cn(
                                    "rounded-[28px] bg-white p-5 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md",
                                    isFirst ? "ring-sky-200" : "ring-slate-200"
                                )}
                            >
                                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="min-w-0 flex-1 space-y-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={cn(
                                                    "rounded-full px-3 py-1 text-xs font-bold",
                                                    isFirst
                                                        ? "bg-sky-600 text-white"
                                                        : "bg-slate-900 text-white"
                                                )}
                                            >
                                                #{index + 1} · {order.orderCode}
                                            </span>

                                            {isFirst ? (
                                                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
                                                    Ưu tiên xử lý trước
                                                </span>
                                            ) : null}

                                            <span
                                                className={cn(
                                                    "rounded-full px-3 py-1 text-xs font-semibold",
                                                    getPackagingStatusClass(order.packagingStatus)
                                                )}
                                            >
                                                {getPackagingStepText(order.packagingStatus)}
                                            </span>

                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                                {getOrderStatusLabel(order.orderStatus)}
                                            </span>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                                <UserRound className="h-4 w-4 shrink-0 text-slate-500" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-slate-500">
                                                        Khách hàng
                                                    </p>
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {order.customerName || "--"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 rounded-2xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
                                                <Clock3 className="h-4 w-4 shrink-0 text-sky-600" />
                                                <div>
                                                    <p className="text-xs text-sky-600">
                                                        Khung giờ giao
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {order.timeSlotDisplay || "--"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                                <Truck className="h-4 w-4 shrink-0 text-slate-500" />
                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Giao nhận
                                                    </p>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {getDeliveryTypeLabel(order.deliveryType)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                                <ShoppingBag className="h-4 w-4 shrink-0 text-slate-500" />
                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Số món
                                                    </p>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {order.totalItems ?? 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                                            <div>
                                                <span className="text-slate-400">Ngày đặt: </span>
                                                <span className="font-medium text-slate-800">
                                                    {formatDateTime(order.orderDate)}
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-slate-400">
                                                    Thành tiền:{" "}
                                                </span>
                                                <span className="font-bold text-slate-900">
                                                    {currency.format(order.finalAmount || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex w-full flex-col gap-3 xl:w-[230px]">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/package/collect?orderId=${order.orderId}`
                                                )
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                                        >
                                            Vào bước thu gom
                                            <ChevronRight className="h-4 w-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/package/packing?orderId=${order.orderId}`
                                                )
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Vào bước đóng gói
                                            <Box className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="flex flex-col items-center justify-between gap-3 rounded-[28px] bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 sm:flex-row">
                <p className="text-sm text-slate-500">
                    Trang <span className="font-semibold text-slate-800">{page}</span> /{" "}
                    <span className="font-semibold text-slate-800">{totalPages}</span>
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                        Trước
                    </button>

                    <button
                        type="button"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={page >= totalPages}
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                        Sau
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PackageOrders

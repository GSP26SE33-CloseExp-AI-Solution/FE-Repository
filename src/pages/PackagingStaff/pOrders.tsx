import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    ArrowUpDown,
    Box,
    ChevronRight,
    Clock3,
    Loader2,
    PackageCheck,
    Search,
    ShoppingBag,
    Truck,
    UserRound,
} from "lucide-react"

import { packagingService } from "@/services/packaging.service"
import type { PackagingOrderSummary } from "@/types/packaging.type"
import { showError } from "@/utils/toast"

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
})

const formatDateTime = (value?: string) => {
    if (!value) return "--"
    const date = new Date(value)
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

const getPackagingStatusClass = (status?: string) => {
    const value = (status || "").toLowerCase()

    if (value.includes("pending")) {
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
    }

    if (value.includes("collect")) {
        return "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
    }

    if (value.includes("pack")) {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    }

    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
}

const getTimeSlotStartMinutes = (timeSlotDisplay?: string) => {
    if (!timeSlotDisplay) return Number.MAX_SAFE_INTEGER

    const normalized = timeSlotDisplay.trim()

    const rangeMatch = normalized.match(/(\d{1,2})[:h](\d{2})/i)
    if (rangeMatch) {
        const hour = Number(rangeMatch[1])
        const minute = Number(rangeMatch[2])
        return hour * 60 + minute
    }

    const shortHourMatch = normalized.match(/\b(\d{1,2})\b/)
    if (shortHourMatch) {
        const hour = Number(shortHourMatch[1])
        return hour * 60
    }

    return Number.MAX_SAFE_INTEGER
}

const sortOrdersByDeliverySlot = (list: PackagingOrderSummary[]) => {
    return [...list].sort((a, b) => {
        const aMinutes = getTimeSlotStartMinutes(a.timeSlotDisplay)
        const bMinutes = getTimeSlotStartMinutes(b.timeSlotDisplay)

        if (aMinutes !== bMinutes) {
            return aMinutes - bMinutes
        }

        const aDate = new Date(a.orderDate).getTime()
        const bDate = new Date(b.orderDate).getTime()

        if (aDate !== bDate) {
            return aDate - bDate
        }

        return a.orderCode.localeCompare(b.orderCode)
    })
}

const PackageOrders = () => {
    const navigate = useNavigate()

    const [orders, setOrders] = useState<PackagingOrderSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalResult, setTotalResult] = useState(0)
    const [keyword, setKeyword] = useState("")

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalResult / pageSize))
    }, [pageSize, totalResult])

    const filteredOrders = useMemo(() => {
        const q = keyword.trim().toLowerCase()

        const baseList = !q
            ? orders
            : orders.filter((item) => {
                return (
                    item.orderCode.toLowerCase().includes(q) ||
                    item.customerName.toLowerCase().includes(q) ||
                    item.deliveryType.toLowerCase().includes(q) ||
                    item.timeSlotDisplay.toLowerCase().includes(q)
                )
            })

        return sortOrdersByDeliverySlot(baseList)
    }, [orders, keyword])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const response = await packagingService.getPendingOrders(page, pageSize)
            setOrders(response.data.items || [])
            setTotalResult(response.data.totalResult || 0)
        } catch (error: any) {
            console.log("getPendingOrders error:", error)
            console.log("status:", error?.response?.status)
            console.log("response data:", error?.response?.data)
            console.log("headers:", error?.response?.headers)

            showError(
                error?.response?.data?.message ||
                error?.response?.data?.errors?.[0] ||
                "Không tải được danh sách đơn đóng gói."
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [page])

    return (
        <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-sky-600">Nhân viên đóng gói</p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Danh sách đơn chờ đóng gói
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Hệ thống đang ưu tiên hiển thị đơn theo khung giờ giao sớm đến muộn để bạn xử lý thuận thứ tự.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Tổng đơn trang hiện tại</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {orders.length}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Tổng kết quả</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {totalResult}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Trang hiện tại</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {page}/{totalPages}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Tìm theo mã đơn, khách hàng, loại giao nhận..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400"
                        />
                    </div>

                    <div className="inline-flex items-center gap-2 self-start rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 ring-1 ring-sky-200">
                        <ArrowUpDown className="h-4 w-4" />
                        Đang sắp xếp theo khung giờ giao: sớm → muộn
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="flex min-h-[240px] items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Đang tải danh sách đơn...</span>
                        </div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <PackageCheck className="h-7 w-7 text-slate-500" />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">
                            Chưa có đơn phù hợp
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Hiện chưa có đơn chờ đóng gói khớp với từ khóa bạn đang tìm.
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order, index) => (
                        <div
                            key={order.orderId}
                            className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                                            #{index + 1} · {order.orderCode}
                                        </div>
                                        <div
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getPackagingStatusClass(
                                                order.packagingStatus
                                            )}`}
                                        >
                                            {order.packagingStatus}
                                        </div>
                                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                            {order.orderStatus}
                                        </div>
                                        <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                                            Ưu tiên theo giờ giao
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                            <UserRound className="h-4 w-4 text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Khách hàng</p>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {order.customerName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-2xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
                                            <Clock3 className="h-4 w-4 text-sky-600" />
                                            <div>
                                                <p className="text-xs text-sky-600">Khung giờ ưu tiên</p>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {order.timeSlotDisplay}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                            <Truck className="h-4 w-4 text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Giao nhận</p>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {order.deliveryType}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                            <ShoppingBag className="h-4 w-4 text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Số món</p>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {order.totalItems}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                                        <div>
                                            <span className="text-slate-400">Ngày đặt: </span>
                                            <span className="font-medium text-slate-800">
                                                {formatDateTime(order.orderDate)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Thành tiền: </span>
                                            <span className="font-semibold text-slate-900">
                                                {currency.format(order.finalAmount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex w-full flex-col gap-3 lg:w-[220px]">
                                    <button
                                        onClick={() =>
                                            navigate(`/package/collect?orderId=${order.orderId}`)
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                                    >
                                        Vào bước thu gom
                                        <ChevronRight className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={() =>
                                            navigate(`/package/packing?orderId=${order.orderId}`)
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Vào bước đóng gói
                                        <Box className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex flex-col items-center justify-between gap-3 rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 sm:flex-row">
                <p className="text-sm text-slate-500">
                    Hiển thị trang <span className="font-semibold text-slate-800">{page}</span> trên{" "}
                    <span className="font-semibold text-slate-800">{totalPages}</span>
                </p>

                <div className="flex items-center gap-2">
                    <button
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => prev - 1)}
                    >
                        Trước
                    </button>
                    <button
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={page >= totalPages}
                        onClick={() => setPage((prev) => prev + 1)}
                    >
                        Sau
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PackageOrders

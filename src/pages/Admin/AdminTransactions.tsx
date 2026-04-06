import { useEffect, useMemo, useState } from "react"
import {
    ClipboardList,
    Eye,
    RefreshCcw,
    ShoppingCart,
    Truck,
    Wallet,
    XCircle,
} from "lucide-react"

import { orderService } from "@/services/order.service"
import type { OrderDetails } from "@/types/order.type"
import { showError, showSuccess } from "@/utils/toast"

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
})

const statusOptions = [
    { label: "Tất cả", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Paid", value: "paid" },
    { label: "Ready-To-Ship", value: "ready-to-ship" },
    { label: "Delivered-Wait-Confirm", value: "delivered-wait-confirm" },
    { label: "Completed", value: "completed" },
    { label: "Canceled", value: "canceled" },
    { label: "Refunded", value: "refunded" },
    { label: "Failed", value: "failed" },
]

const formatDateTime = (value?: string) => {
    if (!value) return "--"
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value))
}

const getStatusLabel = (status?: string) => {
    const normalized = status?.toLowerCase()

    switch (normalized) {
        case "pending":
            return "Chờ xử lý"
        case "paid":
        case "paid-processing":
            return "Đã thanh toán / đang xử lý"
        case "ready-to-ship":
            return "Sẵn sàng giao"
        case "delivered-wait-confirm":
            return "Đã giao / chờ xác nhận"
        case "completed":
            return "Hoàn tất"
        case "canceled":
            return "Đã hủy"
        case "refunded":
            return "Đã hoàn tiền"
        case "failed":
            return "Đơn giao không thành công"
        default:
            return status || "--"
    }
}

const getStatusClass = (status?: string) => {
    const normalized = status?.toLowerCase()

    switch (normalized) {
        case "pending":
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case "paid":
        case "paid-processing":
            return "border border-sky-200 bg-sky-100 text-sky-700"
        case "ready-to-ship":
            return "border border-indigo-200 bg-indigo-100 text-indigo-700"
        case "delivered-wait-confirm":
            return "border border-cyan-200 bg-cyan-100 text-cyan-700"
        case "completed":
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case "canceled":
            return "border border-rose-200 bg-rose-100 text-rose-700"
        case "refunded":
            return "border border-orange-200 bg-orange-100 text-orange-700"
        case "failed":
            return "border border-red-200 bg-red-100 text-red-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

const getDeliveryTypeLabel = (deliveryType?: string) => {
    const normalized = deliveryType?.toLowerCase()

    if (normalized === "delivery") return "Giao tận nơi"
    if (normalized === "pickup") return "Tự đến nhận"

    return deliveryType || "--"
}

const getDeliveryTypeClass = (deliveryType?: string) => {
    const normalized = deliveryType?.toLowerCase()

    if (normalized === "delivery") {
        return "border border-blue-200 bg-blue-50 text-blue-700"
    }

    if (normalized === "pickup") {
        return "border border-purple-200 bg-purple-50 text-purple-700"
    }

    return "border border-slate-200 bg-slate-50 text-slate-700"
}

const getErrorMessage = (
    error: unknown,
    fallback = "Đã xảy ra lỗi, vui lòng thử lại"
) => {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data
            ?.message === "string"
    ) {
        return (
            (error as { response?: { data?: { message?: string } } }).response?.data
                ?.message ?? fallback
        )
    }

    if (error instanceof Error) {
        return error.message
    }

    return fallback
}

const AdminTransactions = () => {
    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const [orders, setOrders] = useState<OrderDetails[]>([])
    const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null)

    const [keyword, setKeyword] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const data = await orderService.getOrders({
                pageNumber: 1,
                pageSize: 50,
            })

            const nextOrders = data.items ?? []
            setOrders(nextOrders)

            setSelectedOrder((prev) => {
                if (!prev) return prev
                const stillExists = nextOrders.some(
                    (item) => item.orderId === prev.orderId
                )
                return stillExists ? prev : null
            })
        } catch (error: unknown) {
            showError(getErrorMessage(error, "Không tải được danh sách đơn hàng"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const q = keyword.trim().toLowerCase()

            const matchKeyword =
                !q ||
                order.orderCode?.toLowerCase().includes(q) ||
                order.userName?.toLowerCase().includes(q) ||
                order.collectionPointName?.toLowerCase().includes(q) ||
                order.deliveryType?.toLowerCase().includes(q)

            const matchStatus =
                !statusFilter || order.status?.toLowerCase() === statusFilter

            return matchKeyword && matchStatus
        })
    }, [orders, keyword, statusFilter])

    const stats = useMemo(() => {
        const revenueStatuses = [
            "paid",
            "ready-to-ship",
            "delivered-wait-confirm",
            "completed",
        ]

        return {
            total: orders.length,
            completed: orders.filter(
                (order) => order.status?.toLowerCase() === "completed"
            ).length,
            canceled: orders.filter(
                (order) => order.status?.toLowerCase() === "canceled"
            ).length,
            revenue: orders
                .filter((order) =>
                    revenueStatuses.includes(order.status?.toLowerCase() ?? "")
                )
                .reduce((sum, order) => sum + (order.finalAmount ?? 0), 0),
        }
    }, [orders])

    const openOrderDetails = async (orderId: string) => {
        try {
            setDetailLoading(true)
            const details = await orderService.getOrderDetails(orderId)
            setSelectedOrder(details)
        } catch (error: unknown) {
            showError(getErrorMessage(error, "Không tải được chi tiết đơn hàng"))
        } finally {
            setDetailLoading(false)
        }
    }

    const reloadSelectedOrder = async (orderId: string) => {
        try {
            const details = await orderService.getOrderDetails(orderId)
            setSelectedOrder(details)
        } catch {
            // giữ im để không chặn flow chính
        }
    }

    const handleStatusAction = async (
        orderId: string,
        action:
            | "pending"
            | "paid"
            | "ready-to-ship"
            | "delivered-wait-confirm"
            | "completed"
            | "canceled"
            | "refunded"
            | "failed"
    ) => {
        try {
            setActionLoading(orderId)

            switch (action) {
                case "pending":
                    await orderService.markPending(orderId)
                    break
                case "paid":
                    await orderService.markPaid(orderId)
                    break
                case "ready-to-ship":
                    await orderService.markReadyToShip(orderId)
                    break
                case "delivered-wait-confirm":
                    await orderService.markDeliveredWaitConfirm(orderId)
                    break
                case "completed":
                    await orderService.markCompleted(orderId)
                    break
                case "canceled":
                    await orderService.markCanceled(orderId)
                    break
                case "refunded":
                    await orderService.markRefunded(orderId)
                    break
                case "failed":
                    await orderService.markFailed(orderId)
                    break
            }

            showSuccess("Đã cập nhật trạng thái đơn hàng")
            await fetchOrders()

            if (selectedOrder?.orderId === orderId) {
                await reloadSelectedOrder(orderId)
            }
        } catch (error: unknown) {
            showError(
                getErrorMessage(error, "Cập nhật trạng thái đơn hàng không thành công")
            )
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            Admin Transactions
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Giao dịch & đơn hàng
                        </h1>
                        <p className="mt-3 text-sm text-slate-500">
                            Theo dõi danh sách đơn hàng, trạng thái xử lý và chi tiết
                            giao dịch trong hệ thống.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchOrders}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                        <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Tổng đơn hàng</p>
                        <ClipboardList size={18} className="text-slate-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Hoàn tất</p>
                        <ShoppingCart size={18} className="text-emerald-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold text-emerald-600">
                        {stats.completed}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Đã hủy</p>
                        <XCircle size={18} className="text-rose-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold text-rose-600">
                        {stats.canceled}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Tổng giá trị đơn hợp lệ
                        </p>
                        <Wallet size={18} className="text-slate-600" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-900">
                        {currency.format(stats.revenue)}
                    </p>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm theo mã đơn, người dùng, điểm nhận, loại giao hàng..."
                        className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                    >
                        {statusOptions.map((status) => (
                            <option key={status.value || "all"} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Danh sách đơn hàng
                        </h2>
                    </div>

                    {loading ? (
                        <div className="px-6 py-10 text-center text-slate-500">
                            Đang tải dữ liệu...
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="px-6 py-10 text-center text-slate-500">
                            Không có đơn hàng nào phù hợp.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white text-sm">
                                <thead className="bg-white text-slate-500">
                                    <tr className="text-left">
                                        <th className="px-4 py-4 font-medium">Mã đơn</th>
                                        <th className="px-4 py-4 font-medium">Khách hàng</th>
                                        <th className="px-4 py-4 font-medium">Giao nhận</th>
                                        <th className="px-4 py-4 font-medium">Trạng thái</th>
                                        <th className="px-4 py-4 font-medium">Giá trị</th>
                                        <th className="px-4 py-4 font-medium">Thời gian</th>
                                        <th className="px-4 py-4 font-medium text-right">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => (
                                        <tr
                                            key={order.orderId}
                                            className={`border-t text-slate-700 ${selectedOrder?.orderId === order.orderId
                                                    ? "border-slate-200 bg-slate-50"
                                                    : "border-slate-100"
                                                }`}
                                        >
                                            <td className="px-4 py-4 font-medium text-slate-900">
                                                {order.orderCode || order.orderId.slice(0, 8)}
                                            </td>
                                            <td className="px-4 py-4">
                                                {order.userName || "--"}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span
                                                        className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getDeliveryTypeClass(
                                                            order.deliveryType
                                                        )}`}
                                                    >
                                                        <Truck className="h-3.5 w-3.5" />
                                                        {getDeliveryTypeLabel(order.deliveryType)}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {order.collectionPointName || "--"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                                                        order.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 font-medium">
                                                {currency.format(order.finalAmount ?? 0)}
                                            </td>
                                            <td className="px-4 py-4">
                                                {formatDateTime(
                                                    order.orderDate || order.createdAt
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        disabled={detailLoading}
                                                        onClick={() =>
                                                            openOrderDetails(order.orderId)
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Xem
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">
                            Chi tiết đơn hàng
                        </h2>
                        {selectedOrder && (
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                className="text-sm font-medium text-slate-500 hover:text-slate-800"
                            >
                                Đóng
                            </button>
                        )}
                    </div>

                    {detailLoading ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                            Đang tải chi tiết đơn hàng...
                        </div>
                    ) : !selectedOrder ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                            Chọn một đơn hàng để xem chi tiết.
                        </div>
                    ) : (
                        <div className="mt-5 space-y-5">
                            <div className="rounded-2xl border border-slate-200 p-4">
                                <div className="space-y-2 text-sm">
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Mã đơn:
                                        </span>{" "}
                                        {selectedOrder.orderCode || selectedOrder.orderId}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Khách hàng:
                                        </span>{" "}
                                        {selectedOrder.userName || "--"}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Trạng thái:
                                        </span>{" "}
                                        {getStatusLabel(selectedOrder.status)}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Loại giao:
                                        </span>{" "}
                                        {getDeliveryTypeLabel(selectedOrder.deliveryType)}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Khung giờ:
                                        </span>{" "}
                                        {selectedOrder.timeSlotDisplay || "--"}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Điểm nhận:
                                        </span>{" "}
                                        {selectedOrder.collectionPointName || "--"}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Ngày đặt:
                                        </span>{" "}
                                        {formatDateTime(
                                            selectedOrder.orderDate ||
                                            selectedOrder.createdAt
                                        )}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Tổng tiền:
                                        </span>{" "}
                                        {currency.format(selectedOrder.totalAmount ?? 0)}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Giảm giá:
                                        </span>{" "}
                                        {currency.format(
                                            selectedOrder.discountAmount ?? 0
                                        )}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Phí giao:
                                        </span>{" "}
                                        {currency.format(selectedOrder.deliveryFee ?? 0)}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">
                                            Thành tiền:
                                        </span>{" "}
                                        {currency.format(selectedOrder.finalAmount ?? 0)}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-4">
                                <h3 className="text-sm font-bold text-slate-900">
                                    Sản phẩm trong đơn
                                </h3>

                                <div className="mt-3 space-y-3">
                                    {selectedOrder.orderItems?.length ? (
                                        selectedOrder.orderItems.map((item) => (
                                            <div
                                                key={item.orderItemId}
                                                className="rounded-xl border border-slate-200 p-3"
                                            >
                                                <p className="font-medium text-slate-900">
                                                    {item.productName || item.lotId}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Số lượng: {item.quantity} · Đơn giá:{" "}
                                                    {currency.format(item.unitPrice ?? 0)}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Thành tiền:{" "}
                                                    {currency.format(
                                                        item.lineTotal ?? item.totalPrice ?? 0
                                                    )}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            Không có sản phẩm.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-4">
                                <h3 className="text-sm font-bold text-slate-900">
                                    Cập nhật trạng thái nhanh
                                </h3>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        disabled={actionLoading === selectedOrder.orderId}
                                        onClick={() =>
                                            handleStatusAction(
                                                selectedOrder.orderId,
                                                "pending"
                                            )
                                        }
                                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                    >
                                        Pending
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionLoading === selectedOrder.orderId}
                                        onClick={() =>
                                            handleStatusAction(
                                                selectedOrder.orderId,
                                                "paid"
                                            )
                                        }
                                        className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                                    >
                                        Paid
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionLoading === selectedOrder.orderId}
                                        onClick={() =>
                                            handleStatusAction(
                                                selectedOrder.orderId,
                                                "ready-to-ship"
                                            )
                                        }
                                        className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                                    >
                                        Ready-To-Ship
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionLoading === selectedOrder.orderId}
                                        onClick={() =>
                                            handleStatusAction(
                                                selectedOrder.orderId,
                                                "delivered-wait-confirm"
                                            )
                                        }
                                        className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 disabled:opacity-50"
                                    >
                                        Delivered-Wait-Confirm
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionLoading === selectedOrder.orderId}
                                        onClick={() =>
                                            handleStatusAction(
                                                selectedOrder.orderId,
                                                "completed"
                                            )
                                        }
                                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                    >
                                        Completed
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionLoading === selectedOrder.orderId}
                                        onClick={() =>
                                            handleStatusAction(
                                                selectedOrder.orderId,
                                                "canceled"
                                            )
                                        }
                                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                    >
                                        Canceled
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionLoading === selectedOrder.orderId}
                                        onClick={() =>
                                            handleStatusAction(
                                                selectedOrder.orderId,
                                                "refunded"
                                            )
                                        }
                                        className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                                    >
                                        Refunded
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionLoading === selectedOrder.orderId}
                                        onClick={() =>
                                            handleStatusAction(
                                                selectedOrder.orderId,
                                                "failed"
                                            )
                                        }
                                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                    >
                                        Failed
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

export default AdminTransactions

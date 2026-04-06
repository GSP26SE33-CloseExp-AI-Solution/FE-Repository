import React, { Fragment, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    AlertCircle,
    ChevronRight,
    Clock3,
    Loader2,
    MapPin,
    PackageCheck,
    ReceiptText,
    Search,
    ShoppingBag,
    Truck,
} from "lucide-react"

import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"
import { orderService } from "@/services/order.service"
import type { OrderDetails, PaginationResult } from "@/types/order.type"
import { lastOrderStorage, money } from "@/utils/orderStorage"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const panel =
    "rounded-[24px] border border-slate-200/70 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]"

const primaryBtn =
    "inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"

const secondaryBtn =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"

const filterBtn =
    "inline-flex items-center justify-center rounded-full border px-3.5 py-2 text-[12px] font-semibold transition"

type OrderFilterKey =
    | "ALL"
    | "PENDING"
    | "PROCESSING"
    | "SHIPPING"
    | "COMPLETED"
    | "CANCELED"

const ORDER_STATUS_META: Record<
    string,
    { label: string; className: string; group: OrderFilterKey }
> = {
    Pending: {
        label: "Chờ xác nhận",
        className: "border-amber-200 bg-amber-50 text-amber-700",
        group: "PENDING",
    },
    Paid: {
        label: "Đang chuẩn bị hàng",
        className: "border-sky-200 bg-sky-50 text-sky-700",
        group: "PROCESSING",
    },
    ReadyToShip: {
        label: "Sẵn sàng giao",
        className: "border-violet-200 bg-violet-50 text-violet-700",
        group: "SHIPPING",
    },
    DeliveredWaitConfirm: {
        label: "Đã giao, chờ xác nhận",
        className: "border-indigo-200 bg-indigo-50 text-indigo-700",
        group: "SHIPPING",
    },
    Completed: {
        label: "Hoàn tất",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        group: "COMPLETED",
    },
    Canceled: {
        label: "Đã hủy",
        className: "border-rose-200 bg-rose-50 text-rose-700",
        group: "CANCELED",
    },
    Refunded: {
        label: "Đã hoàn tiền",
        className: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
        group: "CANCELED",
    },
    Failed: {
        label: "Không thành công",
        className: "border-rose-200 bg-rose-50 text-rose-700",
        group: "CANCELED",
    },
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

const getOrderMeta = (status?: string) => {
    return (
        ORDER_STATUS_META[status || ""] || {
            label: status || "Chưa rõ",
            className: "border-slate-200 bg-slate-50 text-slate-700",
            group: "ALL" as OrderFilterKey,
        }
    )
}

const MyOrdersPage: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const [orders, setOrders] = useState<OrderDetails[]>([])
    const [allOrders, setAllOrders] = useState<OrderDetails[]>([])
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalResult, setTotalResult] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [keyword, setKeyword] = useState("")
    const [filter, setFilter] = useState<OrderFilterKey>("ALL")

    const breadcrumbs = useMemo(
        () => getBreadcrumbsByPath(location.pathname),
        [location.pathname]
    )

    useEffect(() => {
        let mounted = true

        const run = async () => {
            try {
                setLoading(true)
                setError("")

                console.log("OrdersPage.fetchMyOrders -> params:", { page, pageSize })

                const [pagedRes, allRes]: [
                    PaginationResult<OrderDetails>,
                    PaginationResult<OrderDetails>
                ] = await Promise.all([
                    orderService.getMyOrders({
                        pageNumber: page,
                        pageSize,
                    }),
                    orderService.getMyOrders({
                        pageNumber: 1,
                        pageSize: 1000,
                    }),
                ])

                console.log("OrdersPage.fetchMyOrders -> paged response:", pagedRes)
                console.log("OrdersPage.fetchMyOrders -> full response for stats:", allRes)

                if (!mounted) return

                setOrders(pagedRes.items || [])
                setTotalResult(pagedRes.totalResult || 0)
                setAllOrders(allRes.items || [])
            } catch (e: any) {
                console.error("OrdersPage.fetchMyOrders -> error:", e)
                if (!mounted) return

                setOrders([])
                setAllOrders([])
                setTotalResult(0)
                setError(
                    e?.response?.data?.message || "Không thể tải danh sách đơn hàng."
                )
            } finally {
                if (mounted) setLoading(false)
            }
        }

        void run()

        return () => {
            mounted = false
        }
    }, [page, pageSize])

    const filteredOrders = useMemo(() => {
        const kw = keyword.trim().toLowerCase()

        return orders.filter((order) => {
            const meta = getOrderMeta(order.status)

            const matchFilter =
                filter === "ALL" ? true : meta.group === filter

            const matchKeyword =
                !kw ||
                order.orderCode?.toLowerCase().includes(kw) ||
                order.collectionPointName?.toLowerCase().includes(kw) ||
                order.deliveryNote?.toLowerCase().includes(kw) ||
                order.orderItems?.some((item) =>
                    item.productName?.toLowerCase().includes(kw)
                )

            return matchFilter && matchKeyword
        })
    }, [orders, keyword, filter])

    const stats = useMemo(() => {
        return {
            total: totalResult,
            processing: allOrders.filter((o) =>
                ["Pending", "Paid", "ReadyToShip", "DeliveredWaitConfirm"].includes(
                    o.status || ""
                )
            ).length,
            completed: allOrders.filter((o) => o.status === "Completed").length,
        }
    }, [allOrders, totalResult])

    const totalPages = Math.max(1, Math.ceil(totalResult / pageSize))

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_35%,#eef2ff_100%)]">
            <main className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-5 lg:px-6">
                <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="transition hover:text-slate-800"
                    >
                        Trang chủ
                    </button>

                    {breadcrumbs.map((crumb, index) => (
                        <Fragment key={`${crumb}-${index}`}>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span
                                className={cn(
                                    "transition",
                                    index === breadcrumbs.length - 1
                                        ? "font-medium text-slate-800"
                                        : "text-slate-500"
                                )}
                            >
                                {crumb}
                            </span>
                        </Fragment>
                    ))}
                </div>

                <section className={cn(panel, "overflow-hidden")}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.10),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_30%)]" />
                        <div className="relative flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
                            <div className="flex items-start gap-4">
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-slate-900 text-white shadow-sm">
                                    <ReceiptText size={20} />
                                </div>

                                <div>
                                    <h1 className="text-[22px] font-black tracking-tight text-slate-900">
                                        Đơn hàng của tôi
                                    </h1>
                                    <p className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
                                        Theo dõi tất cả đơn đã đặt, trạng thái xử lý và thông tin nhận hàng.
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
                                            <ShoppingBag size={13} />
                                            Tổng đơn: {stats.total}
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
                                            <Clock3 size={13} />
                                            Đang xử lý: {stats.processing}
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
                                            <PackageCheck size={13} />
                                            Hoàn tất: {stats.completed}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className={secondaryBtn}
                            >
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    </div>
                </section>

                <section className={cn(panel, "mt-5 p-4 sm:p-5")}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: "ALL", label: "Tất cả" },
                                { key: "PENDING", label: "Chờ xác nhận" },
                                { key: "PROCESSING", label: "Đang chuẩn bị" },
                                { key: "SHIPPING", label: "Đang giao / chờ xác nhận" },
                                { key: "COMPLETED", label: "Hoàn tất" },
                                { key: "CANCELED", label: "Đã hủy / lỗi" },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setFilter(item.key as OrderFilterKey)}
                                    className={cn(
                                        filterBtn,
                                        filter === item.key
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full lg:max-w-[320px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Tìm theo mã đơn hoặc sản phẩm"
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-900 outline-none transition focus:border-slate-300"
                            />
                        </div>
                    </div>
                </section>

                <div className="mt-5">
                    {loading ? (
                        <div className={cn(panel, "p-6")}>
                            <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang tải danh sách đơn hàng...
                            </div>
                        </div>
                    ) : error ? (
                        <div className={cn(panel, "p-6")}>
                            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                                <div>
                                    <div className="text-[13px] font-semibold text-rose-800">
                                        Không tải được đơn hàng
                                    </div>
                                    <p className="mt-1 text-[11px] leading-5 text-rose-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    ) : !filteredOrders.length ? (
                        <div className={cn(panel, "p-8")}>
                            <div className="mx-auto max-w-md text-center">
                                <div className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-slate-100 text-slate-700">
                                    <ShoppingBag size={22} />
                                </div>

                                <h2 className="mt-4 text-lg font-bold text-slate-900">
                                    Chưa có đơn hàng phù hợp
                                </h2>
                                <p className="mt-2 text-[13px] leading-5 text-slate-500">
                                    Bạn chưa có đơn nào hoặc bộ lọc hiện tại chưa tìm thấy kết quả phù hợp.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate("/")}
                                    className={cn(primaryBtn, "mt-5")}
                                >
                                    Mua sắm ngay
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map((order) => {
                                const meta = getOrderMeta(order.status)
                                const isDelivery = order.deliveryType === "DELIVERY"

                                return (
                                    <article key={order.orderId} className={cn(panel, "p-4 sm:p-5")}>
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="text-[16px] font-black text-slate-900">
                                                        {order.orderCode || order.orderId}
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                                            meta.className
                                                        )}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
                                                    <div>Đặt lúc: {formatDateTime(order.orderDate || order.createdAt)}</div>
                                                    <div>Khung giờ: {order.timeSlotDisplay || "--"}</div>
                                                </div>

                                                <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50/70 p-3.5">
                                                    <div className="flex items-start gap-3">
                                                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-900 shadow-sm">
                                                            {isDelivery ? <Truck size={16} /> : <MapPin size={16} />}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="text-[13px] font-bold text-slate-900">
                                                                {isDelivery ? "Giao tận nơi" : "Nhận tại điểm tập kết"}
                                                            </div>
                                                            <div className="mt-1 text-[12px] leading-5 text-slate-600">
                                                                {isDelivery
                                                                    ? order.deliveryNote || "Chưa có địa chỉ giao hàng"
                                                                    : order.collectionPointName || "Chưa có điểm nhận"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {!!order.orderItems?.length && (
                                                    <div className="mt-4 space-y-2">
                                                        {order.orderItems.slice(0, 2).map((item) => (
                                                            <div
                                                                key={item.orderItemId}
                                                                className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-white px-3.5 py-3"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="truncate text-[13px] font-semibold text-slate-900">
                                                                        {item.productName || item.lotId}
                                                                    </div>
                                                                    <div className="mt-1 text-[11px] text-slate-500">
                                                                        {money(item.unitPrice)} × {item.quantity}
                                                                    </div>
                                                                </div>

                                                                <div className="shrink-0 text-[13px] font-bold text-slate-900">
                                                                    {money(
                                                                        item.lineTotal ??
                                                                        item.totalPrice ??
                                                                        item.unitPrice * item.quantity
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {order.orderItems.length > 2 ? (
                                                            <div className="text-[12px] font-medium text-slate-500">
                                                                +{order.orderItems.length - 2} sản phẩm khác
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[240px] lg:items-end">
                                                <div className="w-full rounded-[18px] border border-slate-200 bg-white p-4 text-right">
                                                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Tổng thanh toán
                                                    </div>
                                                    <div className="mt-1 text-xl font-black tracking-tight text-rose-600">
                                                        {money(order.finalAmount)}
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-slate-500">
                                                        {order.orderItems?.length
                                                            ? `${order.orderItems.length} sản phẩm`
                                                            : "Mở chi tiết để xem sản phẩm"}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        lastOrderStorage.set(order)
                                                        navigate(`/orders/${order.orderId}`)
                                                    }}
                                                    className={cn(primaryBtn, "w-full")}
                                                >
                                                    Xem chi tiết đơn
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </div>

                {totalPages > 1 ? (
                    <div className="mt-5 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            className={cn(
                                secondaryBtn,
                                page <= 1 && "cursor-not-allowed opacity-50"
                            )}
                        >
                            Trang trước
                        </button>

                        <div className="text-[13px] font-semibold text-slate-700">
                            Trang {page} / {totalPages}
                        </div>

                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            className={cn(
                                secondaryBtn,
                                page >= totalPages && "cursor-not-allowed opacity-50"
                            )}
                        >
                            Trang sau
                        </button>
                    </div>
                ) : null}
            </main>
        </div>
    )
}

export default MyOrdersPage

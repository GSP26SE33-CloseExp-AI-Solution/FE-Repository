import React, { Fragment, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    AlertCircle,
    ChevronRight,
    Loader2,
    MapPin,
    ReceiptText,
    Search,
    ShoppingBag,
    Truck,
} from "lucide-react"

import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"
import { orderService } from "@/services/order.service"
import { supermarketService } from "@/services/supermarket.service"
import type {
    OrderDetails,
    PaginationResult,
    RefundDetails,
} from "@/types/order.type"
import type { PickupPoint } from "@/types/supermarket.type"
import { lastOrderStorage, money } from "@/utils/orderStorage"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const primaryBtn =
    "inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99]"

const secondaryBtn =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"

const filterBtn =
    "inline-flex items-center justify-center rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition active:scale-[0.99]"

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

const FILTER_OPTIONS: Array<{ key: OrderFilterKey; label: string }> = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "PROCESSING", label: "Đang chuẩn bị" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "COMPLETED", label: "Hoàn tất" },
    { key: "CANCELED", label: "Đã hủy / lỗi" },
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
    const [pickupCatalog, setPickupCatalog] = useState<PickupPoint[]>([])
    const [refundByOrderId, setRefundByOrderId] = useState<
        Record<string, RefundDetails>
    >({})

    const breadcrumbs = useMemo(
        () => getBreadcrumbsByPath(location.pathname),
        [location.pathname],
    )

    useEffect(() => {
        let mounted = true

        const run = async () => {
            try {
                setLoading(true)
                setError("")

                console.log("OrdersPage.fetchMyOrders -> params:", {
                    page,
                    pageSize,
                })

                const [pagedRes, allRes]: [
                    PaginationResult<OrderDetails>,
                    PaginationResult<OrderDetails>,
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
                console.log(
                    "OrdersPage.fetchMyOrders -> full response for stats:",
                    allRes,
                )

                if (!mounted) return

                setOrders(pagedRes.items || [])
                setTotalResult(pagedRes.totalResult || 0)
                setAllOrders(allRes.items || [])

                const refundsRes = await orderService.getMyRefunds({
                    pageNumber: 1,
                    pageSize: 1000,
                })

                const next: Record<string, RefundDetails> = {}

                for (const r of refundsRes.items || []) {
                    const cur = next[r.orderId]
                    if (
                        !cur ||
                        new Date(r.createdAt).getTime() >
                        new Date(cur.createdAt).getTime()
                    ) {
                        next[r.orderId] = r
                    }
                }

                setRefundByOrderId(next)
            } catch (e: any) {
                console.error("OrdersPage.fetchMyOrders -> error:", e)
                if (!mounted) return

                setOrders([])
                setAllOrders([])
                setTotalResult(0)
                setRefundByOrderId({})
                setError(
                    e?.response?.data?.message ||
                    "Không thể tải danh sách đơn hàng.",
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

    useEffect(() => {
        let cancelled = false

        void (async () => {
            try {
                const pts = await supermarketService.getPickupPoints()
                if (!cancelled) setPickupCatalog(pts)
            } catch {
                if (!cancelled) setPickupCatalog([])
            }
        })()

        return () => {
            cancelled = true
        }
    }, [])

    const pickupById = useMemo(() => {
        const map = new Map<string, PickupPoint>()

        for (const p of pickupCatalog) {
            map.set(p.pickupPointId.toLowerCase(), p)
        }

        return map
    }, [pickupCatalog])

    const filteredOrders = useMemo(() => {
        const kw = keyword.trim().toLowerCase()

        return orders.filter((order) => {
            const meta = getOrderMeta(order.status)

            const matchFilter =
                filter === "ALL" ? true : meta.group === filter

            const catalogPickup =
                order.deliveryType === "PICKUP" && order.collectionId
                    ? pickupById.get(String(order.collectionId).toLowerCase())
                    : undefined

            const matchKeyword =
                !kw ||
                order.orderCode?.toLowerCase().includes(kw) ||
                order.collectionPointName?.toLowerCase().includes(kw) ||
                order.deliveryNote?.toLowerCase().includes(kw) ||
                catalogPickup?.name?.toLowerCase().includes(kw) ||
                catalogPickup?.address?.toLowerCase().includes(kw) ||
                order.orderItems?.some((item) =>
                    item.productName?.toLowerCase().includes(kw),
                )

            return matchFilter && matchKeyword
        })
    }, [orders, keyword, filter, pickupById])

    const stats = useMemo(() => {
        return {
            total: totalResult,
            processing: allOrders.filter((o) =>
                [
                    "Pending",
                    "Paid",
                    "ReadyToShip",
                    "DeliveredWaitConfirm",
                ].includes(o.status || ""),
            ).length,
            completed: allOrders.filter((o) => o.status === "Completed").length,
        }
    }, [allOrders, totalResult])

    const totalPages = Math.max(1, Math.ceil(totalResult / pageSize))

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-5 lg:px-6">
                <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
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
                                    index === breadcrumbs.length - 1
                                        ? "font-medium text-slate-800"
                                        : "text-slate-500",
                                )}
                            >
                                {crumb}
                            </span>
                        </Fragment>
                    ))}
                </div>

                <section className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                                <ReceiptText size={20} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                                    Đơn hàng của tôi
                                </h1>
                                <p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-500">
                                    Theo dõi đơn đã đặt, trạng thái xử lý và
                                    thông tin giao nhận.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Tổng đơn
                                </div>
                                <div className="mt-0.5 text-[14px] font-bold text-slate-900">
                                    {stats.total}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Xử lý
                                </div>
                                <div className="mt-0.5 text-[14px] font-bold text-slate-900">
                                    {stats.processing}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Hoàn tất
                                </div>
                                <div className="mt-0.5 text-[14px] font-bold text-slate-900">
                                    {stats.completed}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {FILTER_OPTIONS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setFilter(item.key)}
                                    className={cn(
                                        filterBtn,
                                        filter === item.key
                                            ? "border-sky-200 bg-sky-50 text-sky-700 ring-1 ring-sky-100"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
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
                                placeholder="Tìm mã đơn, sản phẩm, điểm nhận..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-900 outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-50"
                            />
                        </div>
                    </div>
                </section>

                {loading ? (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3 text-[13px] text-slate-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải danh sách đơn hàng...
                        </div>
                    </section>
                ) : error ? (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <AlertCircle
                                size={16}
                                className="mt-0.5 shrink-0 text-rose-600"
                            />
                            <div>
                                <div className="text-[13px] font-semibold text-rose-800">
                                    Không tải được đơn hàng
                                </div>
                                <p className="mt-1 text-[12px] leading-5 text-rose-700">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </section>
                ) : !filteredOrders.length ? (
                    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-slate-100 text-slate-500">
                            <ShoppingBag size={22} />
                        </div>

                        <h2 className="mt-4 text-lg font-bold text-slate-950">
                            Chưa có đơn hàng phù hợp
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-slate-500">
                            Bạn chưa có đơn nào hoặc bộ lọc hiện tại chưa tìm
                            thấy kết quả phù hợp.
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className={cn(primaryBtn, "mt-5")}
                        >
                            Mua sắm ngay
                        </button>
                    </section>
                ) : (
                    <div className="space-y-3">
                        {filteredOrders.map((order) => {
                            const meta = getOrderMeta(order.status)
                            const isDelivery = order.deliveryType === "DELIVERY"
                            const catalogPickup =
                                !isDelivery && order.collectionId
                                    ? pickupById.get(
                                        String(
                                            order.collectionId,
                                        ).toLowerCase(),
                                    )
                                    : undefined

                            return (
                                <article
                                    key={order.orderId}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_240px] lg:items-start">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="text-[15px] font-bold text-slate-950">
                                                    {order.orderCode ||
                                                        order.orderId}
                                                </div>

                                                <span
                                                    className={cn(
                                                        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                                        meta.className,
                                                    )}
                                                >
                                                    {meta.label}
                                                </span>

                                                {refundByOrderId[
                                                    order.orderId
                                                ] ? (
                                                    <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                                                        Refund:{" "}
                                                        {
                                                            refundByOrderId[
                                                                order.orderId
                                                            ].status
                                                        }
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
                                                <div>
                                                    Đặt lúc:{" "}
                                                    {formatDateTime(
                                                        order.orderDate ||
                                                        order.createdAt,
                                                    )}
                                                </div>
                                                <div>
                                                    Khung giờ:{" "}
                                                    {order.timeSlotDisplay ||
                                                        "--"}
                                                </div>
                                            </div>

                                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sky-700 ring-1 ring-slate-200">
                                                        {isDelivery ? (
                                                            <Truck size={16} />
                                                        ) : (
                                                            <MapPin size={16} />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="text-[13px] font-bold text-slate-950">
                                                            {isDelivery
                                                                ? "Giao tận nơi"
                                                                : "Nhận tại điểm tập kết"}
                                                        </div>

                                                        <div className="mt-1 text-[12px] leading-5 text-slate-500">
                                                            {isDelivery ? (
                                                                order.deliveryNote ||
                                                                "Chưa có địa chỉ giao hàng"
                                                            ) : (
                                                                <>
                                                                    <div className="font-semibold text-slate-800">
                                                                        {catalogPickup?.name ||
                                                                            order.collectionPointName ||
                                                                            "Chưa có điểm nhận"}
                                                                    </div>
                                                                    {catalogPickup?.address ||
                                                                        order.deliveryNote ? (
                                                                        <div className="mt-0.5">
                                                                            {catalogPickup?.address ||
                                                                                order.deliveryNote}
                                                                        </div>
                                                                    ) : null}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {!!order.orderItems?.length && (
                                                <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                    {order.orderItems
                                                        .slice(0, 2)
                                                        .map((item) => (
                                                            <div
                                                                key={
                                                                    item.orderItemId
                                                                }
                                                                className="grid gap-2 px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="truncate text-[13px] font-semibold text-slate-950">
                                                                        {item.productName ||
                                                                            item.lotId}
                                                                    </div>
                                                                    <div className="mt-1 text-[12px] text-slate-500">
                                                                        {money(
                                                                            item.unitPrice,
                                                                        )}{" "}
                                                                        ×{" "}
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                    </div>
                                                                </div>

                                                                <div className="text-right text-[13px] font-bold text-slate-950">
                                                                    {money(
                                                                        item.lineTotal ??
                                                                        item.totalPrice ??
                                                                        item.unitPrice *
                                                                        item.quantity,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                    {order.orderItems.length >
                                                        2 ? (
                                                        <div className="px-3 py-2 text-[12px] font-medium text-slate-500">
                                                            +
                                                            {order.orderItems
                                                                .length -
                                                                2}{" "}
                                                            sản phẩm khác
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:text-right">
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Tổng thanh toán
                                            </div>

                                            <div className="mt-1 text-xl font-black tracking-tight text-rose-600">
                                                {money(order.finalAmount)}
                                            </div>

                                            <div className="mt-1 text-[12px] text-slate-500">
                                                {order.orderItems?.length
                                                    ? `${order.orderItems.length} sản phẩm`
                                                    : "Mở chi tiết để xem sản phẩm"}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    lastOrderStorage.set(order)
                                                    navigate(
                                                        `/orders/${order.orderId}`,
                                                    )
                                                }}
                                                className={cn(
                                                    primaryBtn,
                                                    "mt-4 w-full",
                                                )}
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

                {totalPages > 1 ? (
                    <div className="mt-5 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() =>
                                setPage((prev) => Math.max(1, prev - 1))
                            }
                            className={cn(
                                secondaryBtn,
                                page <= 1 && "cursor-not-allowed opacity-50",
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
                            onClick={() =>
                                setPage((prev) =>
                                    Math.min(totalPages, prev + 1),
                                )
                            }
                            className={cn(
                                secondaryBtn,
                                page >= totalPages &&
                                "cursor-not-allowed opacity-50",
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

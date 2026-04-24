import React, { Fragment, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
    AlertCircle,
    ArrowLeft,
    ChevronRight,
    Clock3,
    CreditCard,
    Loader2,
    MapPin,
    ReceiptText,
    ShieldCheck,
    ShoppingBag,
    Truck,
} from "lucide-react"

import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"
import { orderService } from "@/services/order.service"
import { supermarketService } from "@/services/supermarket.service"
import type { OrderDetails, RefundDetails } from "@/types/order.type"
import type { PickupPoint } from "@/types/supermarket.type"
import { googleMapsUrl, lastOrderStorage, money } from "@/utils/orderStorage"
import toast from "react-hot-toast"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const panel =
    "rounded-[24px] border border-slate-200/70 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]"

const softPanel =
    "rounded-[20px] border border-slate-200/70 bg-slate-50/70"

const primaryBtn =
    "inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"

const secondaryBtn =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"

const muted = "text-slate-500"

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

const getOrderStatusMeta = (status?: string) => {
    switch ((status || "").toLowerCase()) {
        case "pending":
            return {
                label: "Chờ xác nhận",
                className: "border-amber-200 bg-amber-50 text-amber-700",
                note: "Đơn hàng đã được ghi nhận và đang chờ hệ thống xử lý.",
            }

        case "paid":
            return {
                label: "Đang chuẩn bị hàng",
                className: "border-sky-200 bg-sky-50 text-sky-700",
                note: "Đơn hàng đã thanh toán và đang được chuẩn bị.",
            }

        case "readytoship":
            return {
                label: "Sẵn sàng giao",
                className: "border-violet-200 bg-violet-50 text-violet-700",
                note: "Đơn hàng đã sẵn sàng để giao hoặc bàn giao tại điểm nhận.",
            }

        case "deliveredwaitconfirm":
            return {
                label: "Đã giao, chờ xác nhận",
                className: "border-indigo-200 bg-indigo-50 text-indigo-700",
                note: "Đơn hàng đã được giao và đang chờ xác nhận hoàn tất.",
            }

        case "completed":
            return {
                label: "Hoàn tất",
                className: "border-emerald-200 bg-emerald-50 text-emerald-700",
                note: "Đơn hàng đã hoàn tất.",
            }

        case "canceled":
            return {
                label: "Đã hủy",
                className: "border-rose-200 bg-rose-50 text-rose-700",
                note: "Đơn hàng đã bị hủy.",
            }

        case "refunded":
            return {
                label: "Đã hoàn tiền",
                className: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
                note: "Đơn hàng đã được hoàn tiền.",
            }

        case "failed":
            return {
                label: "Không thành công",
                className: "border-rose-200 bg-rose-50 text-rose-700",
                note: "Đã có lỗi xảy ra khi xử lý đơn hàng.",
            }

        default:
            return {
                label: status || "Chưa rõ",
                className: "border-slate-200 bg-slate-50 text-slate-700",
                note: "Trạng thái đơn hàng hiện chưa được xác định rõ.",
            }
    }
}

const MyOrderDetailPage: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { orderId = "" } = useParams()

    const [order, setOrder] = useState<OrderDetails | null>(null)
    const [refunds, setRefunds] = useState<RefundDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [canceling, setCanceling] = useState(false)
    const [error, setError] = useState("")
    /** Địa chỉ điểm nhận từ GET /api/Orders/collection-points (public), khớp collectionId trên đơn */
    const [pickupCatalogPoint, setPickupCatalogPoint] = useState<PickupPoint | null>(
        null
    )

    useEffect(() => {
        let mounted = true

        const run = async () => {
            try {
                setLoading(true)
                setError("")

                console.log("OrderDetailPage.fetchOrderDetails -> orderId:", orderId)

                const res = await orderService.getOrderDetails(orderId)
                const refundsRes = await orderService.getMyRefunds({
                    orderId,
                    pageNumber: 1,
                    pageSize: 20,
                })

                const fallbackLastOrder = lastOrderStorage.get?.() as OrderDetails | null | undefined
                console.log("OrderDetailPage.fetchOrderDetails -> fallbackLastOrder:", fallbackLastOrder)
                console.log("OrderDetailPage.fetchOrderDetails -> fallback orderId match:", fallbackLastOrder?.orderId === res.orderId)
                console.log("OrderDetailPage.fetchOrderDetails -> api orderItems:", res?.orderItems)
                console.log("OrderDetailPage.fetchOrderDetails -> fallback orderItems:", fallbackLastOrder?.orderItems)

                const fallbackItems =
                    fallbackLastOrder?.orderId === res.orderId
                        ? fallbackLastOrder?.orderItems || []
                        : []

                const resolvedOrder: OrderDetails = {
                    ...res,
                    orderItems:
                        res?.orderItems && res.orderItems.length > 0
                            ? res.orderItems
                            : fallbackItems,
                }

                console.log("OrderDetailPage.fetchOrderDetails -> response:", res)
                console.log("OrderDetailPage.fetchOrderDetails -> resolvedOrder:", resolvedOrder)

                if (!mounted) return
                setOrder(resolvedOrder)
                setRefunds(refundsRes.items || [])
            } catch (e: any) {
                console.error("OrderDetailPage.fetchOrderDetails -> error:", e)
                if (!mounted) return

                setOrder(null)
                setRefunds([])
                setError(
                    e?.response?.data?.message || "Không thể tải chi tiết đơn hàng."
                )
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (!orderId) {
            setLoading(false)
            setError("Thiếu mã đơn hàng để hiển thị chi tiết.")
            return
        }

        void run()

        return () => {
            mounted = false
        }
    }, [orderId])

    // Lấy tên + địa chỉ chuẩn từ catalog public (không dùng API admin)
    useEffect(() => {
        if (!order || order.deliveryType !== "PICKUP" || !order.collectionId) {
            setPickupCatalogPoint(null)
            return
        }

        let cancelled = false

        void (async () => {
            try {
                const points = await supermarketService.getPickupPoints()
                if (cancelled) return
                const target = String(order.collectionId).toLowerCase()
                const hit = points.find(
                    (p) => p.pickupPointId.toLowerCase() === target
                )
                setPickupCatalogPoint(hit ?? null)
            } catch {
                if (!cancelled) setPickupCatalogPoint(null)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [order])

    const breadcrumbs = useMemo(
        () =>
            getBreadcrumbsByPath(location.pathname, {
                dynamicLabel: order?.orderCode || "Chi tiết đơn hàng",
            }),
        [location.pathname, order?.orderCode]
    )

    const statusMeta = useMemo(
        () => getOrderStatusMeta(order?.status),
        [order?.status]
    )

    const latestRefund = useMemo(() => {
        if (!refunds.length) return null
        return [...refunds].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
    }, [refunds])

    const canCancelOrder = useMemo(() => {
        if (!order) return false
        if (order.status !== "Paid") return false
        if (!order.cancelDeadline) return false
        return new Date(order.cancelDeadline).getTime() >= Date.now()
    }, [order])

    const subtotal = useMemo(() => {
        if (!order?.orderItems?.length) return order?.totalAmount || 0

        return order.orderItems.reduce((sum, item) => {
            const line =
                item.lineTotal ??
                item.totalPrice ??
                item.unitPrice * item.quantity
            return sum + line
        }, 0)
    }, [order])

    const deliveryTypeLabel = useMemo(() => {
        return order?.deliveryType === "DELIVERY"
            ? "Giao tận nơi"
            : order?.deliveryType === "PICKUP"
                ? "Nhận tại điểm tập kết"
                : "Chưa rõ"
    }, [order?.deliveryType])

    const mapUrl = useMemo(() => {
        if (order?.deliveryType === "PICKUP" && pickupCatalogPoint) {
            const lat = pickupCatalogPoint.lat
            const lng = pickupCatalogPoint.lng
            if (
                Number.isFinite(lat) &&
                Number.isFinite(lng) &&
                lat >= -90 &&
                lat <= 90 &&
                lng >= -180 &&
                lng <= 180
            ) {
                return googleMapsUrl(lat, lng)
            }
        }

        if (!order?.deliveryNote) return ""

        const latLngMatch = order.deliveryNote.match(
            /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i
        )

        if (!latLngMatch) return ""

        const lat = Number(latLngMatch[1])
        const lng = Number(latLngMatch[2])

        if (Number.isNaN(lat) || Number.isNaN(lng)) return ""
        return googleMapsUrl(lat, lng)
    }, [order?.deliveryNote, order?.deliveryType, pickupCatalogPoint])

    if (loading) {
        return (
            <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_35%,#eef2ff_100%)]">
                <main className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-5 lg:px-6">
                    <section className={cn(panel, "p-6")}>
                        <div className="flex items-center gap-3 text-[13px] text-slate-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải chi tiết đơn hàng...
                        </div>
                    </section>
                </main>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_35%,#eef2ff_100%)]">
                <main className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-5 lg:px-6">
                    <section className={cn(panel, "p-6")}>
                        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                            <div>
                                <div className="text-[13px] font-semibold text-rose-800">
                                    Không tải được chi tiết đơn hàng
                                </div>
                                <p className="mt-1 text-[11px] leading-5 text-rose-700">
                                    {error || "Không có dữ liệu đơn hàng."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/orders")}
                                className={secondaryBtn}
                            >
                                Quay lại danh sách đơn
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className={primaryBtn}
                            >
                                Về trang chủ
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        )
    }

    const handleCancelOrder = async () => {
        if (!order || !canCancelOrder || canceling) return
        const ok = window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?")
        if (!ok) return

        const reasonRaw = window.prompt("Nhập lý do hủy đơn hàng (bắt buộc):")
        if (reasonRaw === null) return
        const reason = reasonRaw.trim()
        if (!reason) {
            toast.error("Chưa hủy đơn — cần nhập lý do.")
            return
        }

        try {
            setCanceling(true)
            await orderService.markCanceled(order.orderId, reason)

            const [nextOrder, nextRefunds] = await Promise.all([
                orderService.getOrderDetails(order.orderId),
                orderService.getMyRefunds({ orderId: order.orderId, pageNumber: 1, pageSize: 20 }),
            ])

            setOrder(nextOrder)
            setRefunds(nextRefunds.items || [])
            toast.success("Đã hủy đơn hàng.")
        } catch (e: any) {
            toast.error(e?.message || "Không thể hủy đơn hàng.")
        } finally {
            setCanceling(false)
        }
    }

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
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-[22px] font-black tracking-tight text-slate-900">
                                            Chi tiết đơn hàng
                                        </h1>
                                        <span
                                            className={cn(
                                                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                                statusMeta.className
                                            )}
                                        >
                                            {statusMeta.label}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-[13px] leading-5 text-slate-600">
                                        Mã đơn:{" "}
                                        <span className="font-semibold text-slate-900">
                                            {order.orderCode || order.orderId}
                                        </span>
                                    </p>

                                    <div className="mt-2 text-[12px] text-slate-500">
                                        Đặt lúc: {formatDateTime(order.orderDate || order.createdAt)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {canCancelOrder ? (
                                    <button
                                        type="button"
                                        onClick={handleCancelOrder}
                                        disabled={canceling}
                                        className={secondaryBtn}
                                    >
                                        {canceling ? <Loader2 size={14} className="animate-spin" /> : null}
                                        Hủy đơn
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => navigate("/orders")}
                                    className={secondaryBtn}
                                >
                                    <ArrowLeft size={14} />
                                    Quay lại đơn hàng
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/")}
                                    className={primaryBtn}
                                >
                                    Tiếp tục mua sắm
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-5 grid gap-5 xl:grid-cols-12">
                    <section className="xl:col-span-8">
                        <div className="space-y-5">
                            <section className={cn(panel, "p-4 sm:p-5")}>
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                                        <ShoppingBag size={18} />
                                    </div>

                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Sản phẩm
                                        </div>
                                        <h2 className="mt-1 text-lg font-black text-slate-900">
                                            Các món trong đơn hàng
                                        </h2>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {order.orderItems?.length ? (
                                        order.orderItems.map((item) => {
                                            const lineTotal =
                                                item.lineTotal ??
                                                item.totalPrice ??
                                                item.unitPrice * item.quantity

                                            return (
                                                <article
                                                    key={item.orderItemId}
                                                    className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 p-3.5"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate text-[13px] font-semibold text-slate-900">
                                                            {item.productName || item.lotId}
                                                        </div>

                                                        <div className="mt-1 text-[11px] text-slate-500">
                                                            Mã lô: {item.lotId}
                                                        </div>

                                                        <div className="mt-1 text-[11px] text-slate-500">
                                                            {money(item.unitPrice)} × {item.quantity}
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 text-right">
                                                        <div className="text-[13px] font-bold text-slate-900">
                                                            {money(lineTotal)}
                                                        </div>
                                                    </div>
                                                </article>
                                            )
                                        })
                                    ) : (
                                        <div className={cn(softPanel, "p-4 text-[13px] text-slate-500")}>
                                            Đơn hàng hiện chưa có dữ liệu sản phẩm để hiển thị.
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className={cn(panel, "p-4 sm:p-5")}>
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                                        {order.deliveryType === "DELIVERY" ? (
                                            <Truck size={18} />
                                        ) : (
                                            <MapPin size={18} />
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Giao nhận
                                        </div>
                                        <h2 className="mt-1 text-lg font-black text-slate-900">
                                            Thông tin nhận hàng
                                        </h2>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <div className={cn(softPanel, "p-4")}>
                                        <div className="text-[11px] text-slate-500">Phương thức</div>
                                        <div className="mt-1 text-[13px] font-semibold text-slate-900">
                                            {deliveryTypeLabel}
                                        </div>
                                    </div>

                                    <div className={cn(softPanel, "p-4")}>
                                        <div className="text-[11px] text-slate-500">Khung giờ</div>
                                        <div className="mt-1 text-[13px] font-semibold text-slate-900">
                                            {order.timeSlotDisplay || "--"}
                                        </div>
                                    </div>

                                    <div className={cn(softPanel, "p-4 sm:col-span-2")}>
                                        <div className="text-[11px] text-slate-500">
                                            {order.deliveryType === "DELIVERY"
                                                ? "Địa chỉ nhận hàng"
                                                : "Điểm nhận hàng"}
                                        </div>

                                        <div className="mt-1 text-[13px] font-semibold text-slate-900">
                                            {order.deliveryType === "DELIVERY"
                                                ? order.deliveryNote ||
                                                "Chưa có địa chỉ giao hàng"
                                                : pickupCatalogPoint?.name ||
                                                order.collectionPointName ||
                                                "Chưa có điểm nhận"}
                                        </div>

                                        {order.deliveryType === "PICKUP" &&
                                            (pickupCatalogPoint?.address ||
                                                order.deliveryNote) ? (
                                            <div className="mt-2 text-[12px] text-slate-500">
                                                {pickupCatalogPoint?.address ||
                                                    order.deliveryNote}
                                            </div>
                                        ) : null}

                                        {mapUrl ? (
                                            <a
                                                href={mapUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                <MapPin size={13} />
                                                Xem trên bản đồ
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </section>

                    <aside className="xl:col-span-4">
                        <div className="sticky top-[88px] space-y-4">
                            <section className={cn(panel, "p-4 sm:p-5")}>
                                <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                                    <ShieldCheck className="text-sky-600" size={17} />
                                    Trạng thái đơn hàng
                                </div>

                                <div className="mt-4 rounded-xl bg-white/70 p-4 ring-1 ring-slate-100">
                                    <div className={cn("text-[11px]", muted)}>Trạng thái hiện tại</div>
                                    <div
                                        className={cn(
                                            "mt-2 inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold",
                                            statusMeta.className
                                        )}
                                    >
                                        {statusMeta.label}
                                    </div>
                                    <div className="mt-2 text-[12px] leading-5 text-slate-500">
                                        {statusMeta.note}
                                    </div>
                                </div>

                                <div className="mt-3 rounded-xl bg-white/70 p-4 ring-1 ring-slate-100">
                                    <div className={cn("text-[11px]", muted)}>Thanh toán</div>
                                    <div className="mt-1 flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
                                        <CreditCard size={14} />
                                        Đã thanh toán
                                    </div>
                                </div>
                            </section>

                            <section className={cn(panel, "p-4 sm:p-5")}>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Tóm tắt thanh toán
                                        </div>
                                        <h2 className="mt-1 text-lg font-black text-slate-900">
                                            Thanh toán
                                        </h2>
                                    </div>

                                    <div className="rounded-xl bg-slate-100 px-3 py-2 text-right">
                                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Tổng món
                                        </div>
                                        <div className="text-[13px] font-bold text-slate-900">
                                            {order.orderItems?.length || 0}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className={muted}>Tiền hàng</span>
                                        <span className="font-semibold text-slate-900">
                                            {money(subtotal)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className={muted}>Phí giao hàng</span>
                                        <span className="font-semibold text-slate-900">
                                            {money(order.deliveryFee || 0)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className={muted}>Phí dịch vụ</span>
                                        <span className="font-semibold text-slate-900">
                                            {money(order.systemUsageFeeAmount || 0)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className={muted}>Giảm giá</span>
                                        <span className="font-semibold text-slate-900">
                                            -{money(order.discountAmount || 0)}
                                        </span>
                                    </div>

                                    <div className="h-px bg-slate-200" />

                                    <div className="flex items-end justify-between gap-3">
                                        <div>
                                            <div className="text-[13px] font-semibold text-slate-900">
                                                Tổng thanh toán
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xl font-black tracking-tight text-rose-600">
                                                {money(order.finalAmount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className={cn(panel, "p-4 sm:p-5")}>
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                                        <Clock3 size={18} />
                                    </div>

                                    <div>
                                        <h2 className="mt-1 text-lg font-black text-slate-900">
                                            Thời gian đặt hàng
                                        </h2>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3">
                                    <div className={cn(softPanel, "p-4")}>
                                        <div className="text-[11px] text-slate-500">Ngày đặt</div>
                                        <div className="mt-1 text-[13px] font-semibold text-slate-900">
                                            {formatDateTime(order.orderDate || order.createdAt)}
                                        </div>
                                    </div>

                                    <div className={cn(softPanel, "p-4")}>
                                        <div className="text-[11px] text-slate-500">Cập nhật gần nhất</div>
                                        <div className="mt-1 text-[13px] font-semibold text-slate-900">
                                            {formatDateTime(order.updatedAt)}
                                        </div>
                                    </div>

                                    {order.cancelDeadline ? (
                                        <div className={cn(softPanel, "p-4")}>
                                            <div className="text-[11px] text-slate-500">Hạn hủy đơn</div>
                                            <div className="mt-1 text-[13px] font-semibold text-slate-900">
                                                {formatDateTime(order.cancelDeadline)}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </section>

                            <section className={cn(panel, "p-4 sm:p-5")}>
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <h2 className="mt-1 text-lg font-black text-slate-900">
                                            Tiến trình hoàn tiền
                                        </h2>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    {latestRefund ? (
                                        <div className={cn(softPanel, "p-4")}>
                                            <div className="text-[11px] text-slate-500">Trạng thái mới nhất</div>
                                            <div className="mt-1 text-[13px] font-semibold text-slate-900">
                                                {latestRefund.status}
                                            </div>
                                            <div className="mt-2 text-[12px] text-slate-600">
                                                Số tiền: {money(latestRefund.amount)} - {latestRefund.reason}
                                            </div>
                                            <div className="mt-2 text-[11px] text-slate-500">
                                                Tạo lúc: {formatDateTime(latestRefund.createdAt)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={cn(softPanel, "p-4 text-[13px] text-slate-500")}>
                                            Chưa có yêu cầu hoàn tiền cho đơn hàng này.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    )
}

export default MyOrderDetailPage

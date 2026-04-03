import React, { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import {
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Loader2,
    ShieldCheck,
    ShoppingBag,
    Truck,
    XCircle,
} from "lucide-react"

import { orderService } from "@/services/order.service"
import type {
    CartItem,
    CreateMyOrderPayload,
    CustomerOrderContext,
    OrderDetails,
} from "@/types/order.type"
import {
    cartStorage,
    lastOrderStorage,
    money,
    orderContextStorage,
} from "@/utils/orderStorage"
import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"

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

const getOrderStatusLabel = (status?: string) => {
    switch ((status || "").toLowerCase()) {
        case "pending":
            return "Chờ xử lý"
        case "paid":
            return "Đã thanh toán, đang xử lý"
        case "readytoship":
            return "Sẵn sàng giao"
        case "deliveredwaitconfirm":
            return "Đã giao, chờ xác nhận"
        case "completed":
            return "Hoàn tất"
        case "canceled":
            return "Đã hủy"
        case "refunded":
            return "Đã hoàn tiền"
        case "failed":
            return "Thất bại"
        default:
            return status || "Chưa rõ"
    }
}

const getOrderStatusClass = (status?: string) => {
    switch ((status || "").toLowerCase()) {
        case "pending":
            return "border-amber-200 bg-amber-50 text-amber-700"
        case "paid":
            return "border-sky-200 bg-sky-50 text-sky-700"
        case "readytoship":
            return "border-violet-200 bg-violet-50 text-violet-700"
        case "deliveredwaitconfirm":
            return "border-indigo-200 bg-indigo-50 text-indigo-700"
        case "completed":
            return "border-emerald-200 bg-emerald-50 text-emerald-700"
        case "canceled":
        case "failed":
            return "border-rose-200 bg-rose-50 text-rose-700"
        case "refunded":
            return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
        default:
            return "border-slate-200 bg-slate-50 text-slate-700"
    }
}

const buildCreateMyOrderPayload = (
    cart: CartItem[],
    ctx: CustomerOrderContext
): CreateMyOrderPayload => {
    if (!ctx.timeSlotId) {
        throw new Error("Thiếu khung giờ giao / nhận.")
    }

    if (!ctx.deliveryMethodId) {
        throw new Error("Thiếu phương thức giao / nhận.")
    }

    const deliveryFee = ctx.deliveryMethodId === "DELIVERY" ? 15000 : 0
    const resolvedCollectionId =
        ctx.collectionId || ctx.collectionPointId || ctx.pickupPointId || null

    if (ctx.deliveryMethodId === "PICKUP" && !resolvedCollectionId) {
        throw new Error("Thiếu điểm nhận hàng.")
    }

    if (ctx.deliveryMethodId === "DELIVERY" && !ctx.addressText) {
        throw new Error("Thiếu địa chỉ giao hàng.")
    }

    return {
        timeSlotId: ctx.timeSlotId,
        collectionId: ctx.deliveryMethodId === "PICKUP" ? resolvedCollectionId : null,
        deliveryType: ctx.deliveryMethodId,
        addressId: null,
        promotionId: ctx.promotionId || null,
        deliveryNote:
            ctx.deliveryMethodId === "DELIVERY"
                ? ctx.addressText || ""
                : ctx.collectionPointAddress || ctx.pickupPointAddress || "",
        deliveryFee,
        cancelDeadline: undefined,
        orderItems: cart.map((item) => ({
            lotId: item.lotId,
            quantity: item.qty,
            unitPrice: item.price,
        })),
    }
}

const PaymentReturnPage: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [params] = useSearchParams()
    const createOrderOnceRef = useRef(false)

    const status = params.get("status") || "failed"

    const [loading, setLoading] = useState(status === "success")
    const [error, setError] = useState("")
    const [order, setOrder] = useState<OrderDetails | null>(null)

    const cart = useMemo(() => cartStorage.get(), [])
    const ctx = useMemo(() => orderContextStorage.get(), [])
    const breadcrumbs = useMemo(
        () => getBreadcrumbsByPath(location.pathname),
        [location.pathname]
    )

    const deliverySummary = useMemo(() => {
        if (ctx.deliveryMethodId === "DELIVERY") {
            return {
                icon: <Truck size={16} className="text-slate-900" />,
                title: "Giao tận nơi",
                lines: [ctx.addressText || "Chưa có địa chỉ giao hàng"].filter(Boolean),
            }
        }

        if (ctx.deliveryMethodId === "PICKUP") {
            return {
                icon: <ShoppingBag size={16} className="text-slate-900" />,
                title: "Nhận tại điểm hẹn",
                lines: [
                    ctx.collectionPointName || ctx.pickupPointName || "Chưa có điểm nhận",
                    ctx.collectionPointAddress || ctx.pickupPointAddress || "",
                ].filter(Boolean),
            }
        }

        return {
            icon: <ShoppingBag size={16} className="text-slate-900" />,
            title: "Chưa chọn phương thức",
            lines: ["Không có thông tin giao / nhận."],
        }
    }, [ctx])

    useEffect(() => {
        const run = async () => {
            if (status !== "success") {
                setLoading(false)
                return
            }

            if (createOrderOnceRef.current) {
                console.warn("PaymentReturnPage.run -> skipped because create order already ran once")
                return
            }

            createOrderOnceRef.current = true

            try {
                console.log("PaymentReturnPage.run -> cart:", cart)
                console.log("PaymentReturnPage.run -> ctx:", ctx)

                if (ctx.orderId) {
                    console.warn(
                        "PaymentReturnPage.run -> found stale/current orderId in context, skipping createMyOrder and reusing:",
                        ctx.orderId
                    )

                    const existingDetails = await orderService.getOrderDetails(ctx.orderId)

                    const fallbackLastOrder = lastOrderStorage.get?.() as OrderDetails | null | undefined
                    const fallbackItems =
                        fallbackLastOrder?.orderId === existingDetails.orderId
                            ? fallbackLastOrder?.orderItems || []
                            : []

                    const resolvedExistingDetails: OrderDetails = {
                        ...existingDetails,
                        orderItems:
                            existingDetails?.orderItems && existingDetails.orderItems.length > 0
                                ? existingDetails.orderItems
                                : fallbackItems,
                    }

                    console.log(
                        "PaymentReturnPage.run -> reused existing order details:",
                        resolvedExistingDetails
                    )

                    lastOrderStorage.setId(ctx.orderId)
                    lastOrderStorage.set(resolvedExistingDetails)
                    setOrder(resolvedExistingDetails)
                    cartStorage.clear()
                    return
                }

                if (!cart.length) {
                    throw new Error("Giỏ hàng đang trống nên không thể tạo đơn.")
                }

                if (!orderContextStorage.isReady(ctx)) {
                    throw new Error("Thiếu thông tin giao / nhận để tạo đơn.")
                }

                if (!ctx.timeSlotId) {
                    throw new Error("Thiếu khung giờ giao / nhận để tạo đơn.")
                }

                const payload = buildCreateMyOrderPayload(cart, ctx)

                console.log("PaymentReturnPage.run -> createMyOrder payload:", payload)
                console.log(
                    "PaymentReturnPage.run -> createMyOrder locked at:",
                    new Date().toISOString()
                )

                const created = await orderService.createMyOrder(payload)

                console.log("PaymentReturnPage.run -> created order:", created)

                if (!created?.orderId) {
                    throw new Error("API tạo đơn không trả về orderId hợp lệ.")
                }

                lastOrderStorage.setId(created.orderId)
                orderContextStorage.patch({ orderId: created.orderId })

                const details = await orderService.getOrderDetails(created.orderId)

                console.log("PaymentReturnPage.run -> order details:", details)

                const resolvedDetails: OrderDetails = {
                    ...details,
                    orderItems:
                        details?.orderItems && details.orderItems.length > 0
                            ? details.orderItems
                            : created?.orderItems || [],
                }

                console.log("PaymentReturnPage.run -> resolved order details:", resolvedDetails)

                lastOrderStorage.set(resolvedDetails)
                setOrder(resolvedDetails)

                cartStorage.clear()
            } catch (e: any) {
                console.error("PaymentReturnPage.run -> error:", e)
                setError(
                    e?.response?.data?.message ||
                    e?.message ||
                    "Không thể hoàn tất đơn hàng sau khi thanh toán."
                )
            } finally {
                setLoading(false)
            }
        }

        void run()
    }, [status, cart, ctx])

    if (status !== "success") {
        return (
            <div className="min-h-screen bg-slate-50/70 py-8">
                <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
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
                                        className={
                                            index === breadcrumbs.length - 1
                                                ? "font-medium text-slate-800"
                                                : "text-slate-500"
                                        }
                                    >
                                        {crumb}
                                    </span>
                                </Fragment>
                            ))}
                        </div>

                        <section className={cn(panel, "p-5 sm:p-6")}>
                            <div className="flex items-center gap-3">
                                <XCircle className="text-rose-600" />
                                <div className="text-base font-semibold text-slate-900">
                                    Thanh toán không thành công
                                </div>
                            </div>

                            <p className={cn("mt-2 text-[13px]", muted)}>
                                Giao dịch bị hủy hoặc thất bại. Đơn hàng chưa được tạo trên hệ thống.
                            </p>

                            <div className="mt-5 flex flex-wrap gap-3">
                                <button className={secondaryBtn} onClick={() => navigate("/checkout")}>
                                    Quay lại thanh toán
                                </button>
                                <button className={primaryBtn} onClick={() => navigate("/cart")}>
                                    Về giỏ hàng
                                </button>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/70 py-8">
                <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6">
                    <section className={cn(panel, "mx-auto max-w-4xl p-5 sm:p-6")}>
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                            <div className="text-base font-semibold text-slate-900">
                                Đang hoàn tất đơn hàng...
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-slate-50/70 py-8">
                <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6">
                    <section className={cn(panel, "mx-auto max-w-4xl p-5 sm:p-6")}>
                        <div className="flex items-center gap-3">
                            <XCircle className="text-rose-600" />
                            <div className="text-base font-semibold text-slate-900">
                                Không thể tạo đơn
                            </div>
                        </div>

                        <p className={cn("mt-2 text-[13px]", muted)}>
                            {error || "Thiếu dữ liệu để tạo đơn hàng."}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <button className={secondaryBtn} onClick={() => navigate("/checkout")}>
                                Quay lại thanh toán
                            </button>
                            <button className={primaryBtn} onClick={() => navigate("/cart")}>
                                Về giỏ hàng
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/70 py-8">
            <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6">
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
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
                                    className={
                                        index === breadcrumbs.length - 1
                                            ? "font-medium text-slate-800"
                                            : "text-slate-500"
                                    }
                                >
                                    {crumb}
                                </span>
                            </Fragment>
                        ))}
                    </div>

                    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 px-5 py-5 md:px-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                        <CheckCircle2 className="h-7 w-7" />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="text-[22px] font-bold text-slate-900">
                                                Thanh toán thành công
                                            </h1>

                                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-700">
                                                Đơn đã được ghi nhận
                                            </span>
                                        </div>

                                        <p className="mt-1 text-[13px] text-slate-500">
                                            Đơn hàng của bạn đã được tạo thành công trên hệ thống và đang chờ xử lý.
                                        </p>
                                    </div>
                                </div>

                                <div className="text-left lg:text-right">
                                    <div className={cn("text-[11px]", muted)}>Mã đơn</div>
                                    <div className="mt-1 text-base font-bold text-slate-900">
                                        {order.orderCode || order.orderId}
                                    </div>
                                    <div className={cn("mt-1 text-[11px]", muted)}>
                                        {formatDateTime(order.createdAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-12">
                        <aside className="xl:col-span-4">
                            <div className="space-y-4">
                                <section className={cn(panel, "p-4 sm:p-5")}>
                                    <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                                        <ShieldCheck className="text-sky-600" size={17} />
                                        Trạng thái xử lý
                                    </div>

                                    <div className="mt-4 rounded-xl bg-white/70 p-4 ring-1 ring-sky-100">
                                        <div className={cn("text-[11px]", muted)}>Thanh toán</div>
                                        <div className="mt-1 text-[13px] font-semibold text-emerald-700">
                                            Thành công
                                        </div>
                                    </div>

                                    <div className="mt-3 rounded-xl bg-white/70 p-4 ring-1 ring-sky-100">
                                        <div className={cn("text-[11px]", muted)}>Đơn hàng</div>
                                        <div
                                            className={cn(
                                                "mt-2 inline-flex rounded-full border px-3 py-1 text-[13px] font-medium",
                                                getOrderStatusClass(order.status)
                                            )}
                                        >
                                            {getOrderStatusLabel(order.status)}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </aside>

                        <section className="xl:col-span-8">
                            <div className="space-y-4">
                                <section className={cn(panel, "p-4 sm:p-5")}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="mt-1 text-lg font-black text-slate-900">
                                                Thông tin đơn hàng của bạn
                                            </h2>
                                        </div>

                                        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] text-sky-700 ring-1 ring-sky-100">
                                            <CreditCard size={14} />
                                            Online • Đã thanh toán
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-3">
                                        <div className={cn(softPanel, "p-4")}>
                                            <div className="text-[11px] text-slate-500">Giao / nhận</div>
                                            <div className="mt-2 flex items-start gap-3">
                                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm">
                                                    {deliverySummary.icon}
                                                </div>
                                                <div>
                                                    <div className="text-[13px] font-semibold text-slate-900">
                                                        Phương thức nhận hàng: {deliverySummary.title}
                                                    </div>
                                                    <div className="mt-1 space-y-1 text-[13px] text-slate-600">
                                                        Địa chỉ nhận hàng: {deliverySummary.lines.map((line, index) => (
                                                            <div key={index}>{line}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn(softPanel, "p-4")}>
                                            <div className="text-[11px] text-slate-500">Khung giờ giao / nhận</div>
                                            <div className="mt-1 text-[13px] font-semibold text-slate-900">
                                                {order.timeSlotDisplay || "--"}
                                            </div>
                                        </div>

                                        <div className={cn(softPanel, "p-4")}>
                                            <div className="text-[11px] text-slate-500">Tổng tiền</div>
                                            <div className="mt-1 text-lg font-extrabold text-rose-600">
                                                {money(order.finalAmount)}
                                            </div>
                                        </div>

                                        <div className={cn(softPanel, "p-4")}>
                                            <div className="text-[11px] text-slate-500">Thông báo hệ thống</div>
                                            <div className="mt-1 text-[13px] font-semibold text-slate-900">
                                                Đơn hàng đã được ghi nhận thành công và đang chờ xử lý.
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className={cn(panel, "p-4 sm:p-5")}>
                                    <div className="text-base font-bold text-slate-900">
                                        Sản phẩm trong đơn
                                    </div>

                                    {!!order.orderItems?.length ? (
                                        <div className="mt-4 space-y-3">
                                            {order.orderItems.map((item) => (
                                                <article
                                                    key={item.orderItemId}
                                                    className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 px-3.5 py-3.5"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate text-[13px] font-semibold text-slate-900">
                                                            {item.productName || item.lotId}
                                                        </div>
                                                        <div className={cn("mt-1 text-[11px]", muted)}>
                                                            {item.quantity} × {money(item.unitPrice)}
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 text-[13px] font-bold text-slate-900">
                                                        {money(
                                                            item.lineTotal ??
                                                            item.totalPrice ??
                                                            item.unitPrice * item.quantity
                                                        )}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4 text-[13px] text-slate-500">
                                            Đơn hàng hiện chưa có dữ liệu sản phẩm để hiển thị.
                                        </div>
                                    )}
                                </section>

                                <div className="flex justify-end gap-3">
                                    <button className={secondaryBtn} onClick={() => navigate("/orders")}>
                                        Xem đơn hàng của tôi
                                    </button>
                                    <button className={primaryBtn} onClick={() => navigate("/")}>
                                        Tiếp tục mua sắm
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default PaymentReturnPage

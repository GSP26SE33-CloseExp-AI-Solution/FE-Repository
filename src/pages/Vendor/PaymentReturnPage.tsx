import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle2, CreditCard, ShieldCheck, XCircle } from "lucide-react"

import { orderService } from "@/services/order.service"
import type {
    CartItem,
    CreateOrderPayload,
    CustomerOrderContext,
    OrderDetails,
} from "@/types/order.type"
import {
    cartStorage,
    getAuthenticatedUserId,
    getPickupSlotLabel,
    lastOrderStorage,
    money,
    orderContextStorage,
} from "@/utils/orderStorage"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const surfaceCard =
    "backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-6 border border-white/40"
const card = "rounded-3xl bg-white/75 ring-1 ring-sky-100 shadow-sm"
const primaryBtn =
    "bg-gradient-to-r from-sky-400 to-cyan-400 text-white font-semibold rounded-xl shadow-md transition-all duration-300 active:scale-95 hover:brightness-105"
const secondaryBtn =
    "border border-sky-200 text-sky-700 bg-white/70 font-medium rounded-xl hover:bg-sky-50 transition disabled:opacity-50"
const muted = "text-slate-500"

const buildCreateOrderPayload = (
    cart: CartItem[],
    ctx: CustomerOrderContext
): CreateOrderPayload => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
    const deliveryFee = ctx.deliveryMethodId === "DELIVERY" ? 15000 : 0
    const finalAmount = subtotal + deliveryFee

    const userId = getAuthenticatedUserId()
    if (!userId) {
        throw new Error("Không tìm thấy user ID. Bạn cần đăng nhập lại để tạo đơn hàng.")
    }

    if (!ctx.timeSlotId) {
        throw new Error("Thiếu timeSlotId thật của BE cho khung giờ đã chọn.")
    }

    if (!ctx.deliveryMethodId) {
        throw new Error("Thiếu phương thức giao/nhận.")
    }

    return {
        userId,
        timeSlotId: ctx.timeSlotId,
        collectionId: ctx.deliveryMethodId === "PICKUP" ? ctx.pickupPointId || null : null,
        deliveryType: ctx.deliveryMethodId,
        totalAmount: subtotal,
        status: "PENDING",
        addressId: null,
        promotionId: null,
        deliveryGroupId: null,
        deliveryNote:
            ctx.deliveryMethodId === "DELIVERY"
                ? ctx.addressText || ""
                : ctx.pickupPointAddress || "",
        discountAmount: 0,
        finalAmount,
        deliveryFee,
        cancelDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        orderItems: cart.map((item) => ({
            lotId: item.lotId,
            quantity: item.qty,
            unitPrice: item.price,
        })),
    }
}

const PaymentReturnPage: React.FC = () => {
    const navigate = useNavigate()
    const [params] = useSearchParams()

    const status = params.get("status") || "failed"

    const [loading, setLoading] = useState(status === "success")
    const [error, setError] = useState("")
    const [order, setOrder] = useState<OrderDetails | null>(null)

    const cart = useMemo(() => cartStorage.get(), [])
    const ctx = useMemo(() => orderContextStorage.get(), [])

    const deliverySummary = useMemo(() => {
        if (ctx.deliveryMethodId === "DELIVERY") {
            return ctx.addressText ? `Giao tận nơi: ${ctx.addressText}` : "Giao tận nơi"
        }
        if (ctx.deliveryMethodId === "PICKUP") {
            return ctx.pickupPointName
                ? `Nhận tại điểm hẹn: ${ctx.pickupPointName}`
                : "Nhận tại điểm hẹn"
        }
        return "Chưa chọn giao hàng"
    }, [ctx])

    useEffect(() => {
        const run = async () => {
            if (status !== "success") {
                const orderId = lastOrderStorage.getId()
                if (orderId) {
                    try {
                        await orderService.markFailed(orderId)
                    } catch {
                        //
                    }
                }
                return
            }

            try {
                if (!cart.length) {
                    throw new Error("Giỏ hàng đang trống nên không thể tạo đơn.")
                }

                if (!orderContextStorage.isReady(ctx)) {
                    throw new Error("Thiếu thông tin giao/nhận để tạo đơn.")
                }

                const payload = buildCreateOrderPayload(cart, ctx)
                const created = await orderService.createOrder(payload)

                lastOrderStorage.setId(created.orderId)
                orderContextStorage.patch({ orderId: created.orderId })

                await orderService.markPaidProcessing(created.orderId)

                const details = await orderService.getOrderDetails(created.orderId)

                lastOrderStorage.set(details)
                setOrder(details)

                cartStorage.clear()
            } catch (e: any) {
                setError(
                    e?.response?.data?.message ||
                    e?.message ||
                    "Không thể hoàn tất đơn hàng sau khi thanh toán."
                )
            } finally {
                setLoading(false)
            }
        }

        run()
    }, [cart, ctx, status])

    if (status !== "success") {
        return (
            <div className="min-h-screen bg-[#FAFAFA] px-8 pb-10 pt-28">
                <div className={cn(surfaceCard, "mx-auto max-w-4xl")}>
                    <div className="flex items-center gap-3">
                        <XCircle className="text-rose-600" />
                        <div className="text-lg font-semibold text-slate-900">
                            Thanh toán không thành công
                        </div>
                    </div>
                    <p className={cn("mt-2 text-sm", muted)}>
                        Giao dịch bị huỷ hoặc thất bại. Bạn có thể quay lại để thanh toán lại.
                    </p>

                    <div className="mt-5 flex gap-2">
                        <button
                            className={cn(secondaryBtn, "px-4 py-2")}
                            onClick={() => navigate("/checkout")}
                        >
                            Quay lại thanh toán
                        </button>
                        <button
                            className={cn(primaryBtn, "px-4 py-2")}
                            onClick={() => navigate("/cart")}
                        >
                            Về giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] px-8 pb-10 pt-28">
                <div className={cn(surfaceCard, "mx-auto max-w-4xl")}>
                    <div className="text-lg font-semibold text-slate-900">
                        Đang hoàn tất đơn hàng...
                    </div>
                    <p className={cn("mt-2 text-sm", muted)}>
                        Hệ thống đang tạo đơn, cập nhật trạng thái thanh toán và lấy lại chi tiết
                        đơn hàng.
                    </p>
                </div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] px-8 pb-10 pt-28">
                <div className={cn(surfaceCard, "mx-auto max-w-4xl")}>
                    <div className="flex items-center gap-3">
                        <XCircle className="text-rose-600" />
                        <div className="text-lg font-semibold text-slate-900">
                            Không thể tạo đơn
                        </div>
                    </div>
                    <p className={cn("mt-2 text-sm", muted)}>
                        {error || "Thiếu dữ liệu để tạo đơn hàng."}
                    </p>

                    <div className="mt-5 flex gap-2">
                        <button
                            className={cn(secondaryBtn, "px-4 py-2")}
                            onClick={() => navigate("/checkout")}
                        >
                            Quay lại thanh toán
                        </button>
                        <button
                            className={cn(primaryBtn, "px-4 py-2")}
                            onClick={() => navigate("/cart")}
                        >
                            Về giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] px-8 pb-10 pt-5">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className={cn(surfaceCard, "flex items-start justify-between gap-4")}>
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 size={14} />
                            Đơn đã được ghi nhận
                        </div>
                        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
                            Thanh toán thành công 🎉
                        </h1>
                        <p className={cn("mt-2 text-sm", muted)}>
                            Đơn hàng của bạn đã được ghi nhận trên hệ thống và đang chờ xử lý.
                        </p>
                    </div>

                    <div className="text-right">
                        <div className={cn("text-xs", muted)}>Mã đơn</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">
                            {order.orderCode || order.orderId}
                        </div>
                        <div className={cn("mt-1 text-xs", muted)}>
                            {order.createdAt
                                ? new Date(order.createdAt).toLocaleString("vi-VN")
                                : ""}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className={cn(card, "p-6 lg:col-span-1")}>
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <ShieldCheck className="text-sky-600" size={18} />
                            Trạng thái xử lý
                        </div>

                        <div className="mt-4 rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100">
                            <div className={cn("text-xs", muted)}>Thanh toán</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                Thành công
                            </div>
                        </div>

                        <div className="mt-3 rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100">
                            <div className={cn("text-xs", muted)}>Đơn hàng</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {order.status || "PAID_PROCESSING"}
                            </div>
                        </div>

                        <div className={cn("mt-3 text-xs leading-6", muted)}>
                            Khi đơn chuyển sang giai đoạn giao hàng, hệ thống sẽ gửi email thông báo và mã QR nhận hàng cho bạn. Vui lòng chú ý thông báo email đã đăng ký với hệ thống.
                        </div>
                    </div>

                    <div className={cn(card, "p-6 lg:col-span-2")}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-slate-900">Thông tin đơn hàng</div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700 ring-1 ring-sky-100">
                                <CreditCard size={14} />
                                Online • Đã thanh toán
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100">
                                <div className={cn("text-xs", muted)}>Giao/nhận</div>
                                <div className="mt-1 text-sm text-slate-900">{deliverySummary}</div>
                            </div>

                            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100">
                                <div className={cn("text-xs", muted)}>Khung giờ nhận hàng</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">
                                    {order.timeSlotDisplay || getPickupSlotLabel(ctx.pickupSlotId)}
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100">
                                <div className={cn("text-xs", muted)}>Tổng tiền</div>
                                <div className="mt-1 text-xl font-extrabold text-slate-900">
                                    {money(order.finalAmount)}
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100">
                                <div className={cn("text-xs", muted)}>Thông báo hệ thống</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">
                                    Đơn hàng đã được ghi nhận thành công và đang chờ xử lý.
                                </div>
                            </div>

                            {!!order.orderItems?.length && (
                                <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100">
                                    <div className="font-semibold text-slate-900">Sản phẩm</div>
                                    <div className="mt-3 space-y-2">
                                        {order.orderItems.map((item) => (
                                            <div
                                                key={item.orderItemId}
                                                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3"
                                            >
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-slate-900">
                                                        {item.productName || item.lotId}
                                                    </div>
                                                    <div className={cn("mt-1 text-xs", muted)}>
                                                        {item.quantity} × {money(item.unitPrice)}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-sm font-bold text-slate-900">
                                                    {money(
                                                        item.lineTotal ??
                                                        item.totalPrice ??
                                                        item.unitPrice * item.quantity
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                className={cn(secondaryBtn, "px-4 py-2")}
                                onClick={() => navigate("/cart")}
                            >
                                Xem giỏ hàng
                            </button>
                            <button
                                className={cn(primaryBtn, "px-4 py-2")}
                                onClick={() => navigate("/")}
                            >
                                Về trang chủ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentReturnPage

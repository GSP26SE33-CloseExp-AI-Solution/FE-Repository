import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle2, CreditCard, Mail, ShieldCheck, XCircle } from "lucide-react"

/* ========= Helpers ========= */
const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const money = (n: number) => n.toLocaleString("vi-VN") + " đ"

const CART_KEY = "customer_cart_v1"
const ORDER_KEY = "last_order_v1"
const CHECKOUT_CTX_KEY = "customer_checkout_context_v2"

type PickupSlotId = "SLOT_1" | "SLOT_2"

type CartItem = {
    productId: string
    name: string
    price: number
    qty: number
    supermarketId: string
}

type CheckoutContext = {
    deliveryMethodId?: "DELIVERY" | "PICKUP"
    addressText?: string
    pickupPointName?: string
    pickupPointAddress?: string
    pickupLat?: number
    pickupLng?: number
    lat?: number
    lng?: number
    pickupSlotId?: PickupSlotId
}

type Order = {
    orderId: string
    createdAt: string
    paymentMethod: "ONLINE"
    paymentStatus: "PAID"
    total: number
    items: CartItem[]
    deliveryMethodId: "DELIVERY" | "PICKUP"
    deliveryAddress?: string
    pickupPointName?: string
    pickupPointAddress?: string
    pickupSlotId: PickupSlotId
    qrPayload: string
}

const PICKUP_SLOTS: Array<{ id: PickupSlotId; title: string; desc: string }> = [
    { id: "SLOT_1", title: "Khung 1", desc: "19:00 – 20:30" },
    { id: "SLOT_2", title: "Khung 2", desc: "21:00 – 22:30" },
]

const qrImageUrl = (payload: string) =>
    `https://chart.googleapis.com/chart?cht=qr&chs=320x320&chld=M|0&chl=${encodeURIComponent(payload)}`

/* ========= UI tokens ========= */
const surfaceCard =
    "backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-6 border border-white/40"
const card = "rounded-3xl bg-white/75 ring-1 ring-sky-100 shadow-sm"
const primaryBtn =
    "bg-gradient-to-r from-sky-400 to-cyan-400 text-white font-semibold rounded-xl shadow-md transition-all duration-300 active:scale-95 hover:brightness-105"
const secondaryBtn =
    "border border-sky-200 text-sky-700 bg-white/70 font-medium rounded-xl hover:bg-sky-50 transition disabled:opacity-50"
const muted = "text-slate-500"

const safeRead = <T,>(key: string, fallback: T): T => {
    try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
        return fallback
    }
}

const PaymentReturnPage: React.FC = () => {
    const navigate = useNavigate()
    const [params] = useSearchParams()

    const status = params.get("status") || "failed" // success | failed | cancel

    const [order, setOrder] = useState<Order | null>(null)

    const cart = useMemo(() => safeRead<CartItem[]>(CART_KEY, []), [])
    const ctx = useMemo(() => safeRead<CheckoutContext>(CHECKOUT_CTX_KEY, {}), [])

    const subtotal = useMemo(
        () => cart.reduce((sum, it) => sum + it.price * it.qty, 0),
        [cart]
    )
    const serviceFee = useMemo(
        () => (subtotal > 0 ? Math.round(subtotal * 0.02) : 0),
        [subtotal]
    )
    const total = subtotal + serviceFee

    const deliverySummary = useMemo(() => {
        if (ctx.deliveryMethodId === "DELIVERY") return ctx.addressText ? `Giao tận nơi: ${ctx.addressText}` : "Giao tận nơi"
        if (ctx.deliveryMethodId === "PICKUP") return ctx.pickupPointName ? `Tự lấy: ${ctx.pickupPointName}` : "Tự lấy tại điểm tập kết"
        return "Chưa chọn giao hàng"
    }, [ctx])

    const slotText = useMemo(() => {
        const s = PICKUP_SLOTS.find((x) => x.id === ctx.pickupSlotId)
        return s ? `${s.title} — ${s.desc}` : "Chưa chọn"
    }, [ctx.pickupSlotId])

    useEffect(() => {
        if (status !== "success") return

        // ✅ validate trước khi tạo đơn
        if (!cart.length || !ctx.deliveryMethodId || !ctx.pickupSlotId) {
            return
        }

        const orderId = "ORD-" + Math.random().toString(16).slice(2, 10).toUpperCase()
        const createdAt = new Date().toISOString()

        const qrPayload = JSON.stringify({
            orderId,
            createdAt,
            delivery: ctx.deliveryMethodId,
            pickupSlotId: ctx.pickupSlotId,
        })

        const next: Order = {
            orderId,
            createdAt,
            paymentMethod: "ONLINE",
            paymentStatus: "PAID",
            total,
            items: cart,
            deliveryMethodId: ctx.deliveryMethodId,
            deliveryAddress: ctx.deliveryMethodId === "DELIVERY" ? ctx.addressText : undefined,
            pickupPointName: ctx.deliveryMethodId === "PICKUP" ? ctx.pickupPointName : undefined,
            pickupPointAddress: ctx.deliveryMethodId === "PICKUP" ? ctx.pickupPointAddress : undefined,
            pickupSlotId: ctx.pickupSlotId,
            qrPayload,
        }

        localStorage.setItem(ORDER_KEY, JSON.stringify(next))

        // clear cart + sync header badge
        localStorage.setItem(CART_KEY, JSON.stringify([]))
        window.dispatchEvent(new Event("cart:updated"))

        setOrder(next)
    }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

    // FAILED/CANCEL UI
    if (status !== "success") {
        return (
            <div className="min-h-screen bg-[#FAFAFA] px-8 pt-28 pb-10">
                <div className={cn(surfaceCard, "max-w-4xl mx-auto")}>
                    <div className="flex items-center gap-3">
                        <XCircle className="text-rose-600" />
                        <div className="text-lg font-semibold text-slate-900">Thanh toán không thành công</div>
                    </div>
                    <p className={cn("mt-2 text-sm", muted)}>
                        Giao dịch bị huỷ hoặc thất bại. Bạn có thể quay lại để thanh toán lại.
                    </p>

                    <div className="mt-5 flex gap-2">
                        <button className={cn(secondaryBtn, "px-4 py-2")} onClick={() => navigate("/checkout")}>
                            Quay lại thanh toán
                        </button>
                        <button className={cn(primaryBtn, "px-4 py-2")} onClick={() => navigate("/cart")}>
                            Về giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // SUCCESS but cannot build order (missing ctx/cart)
    if (!order) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] px-8 pt-28 pb-10">
                <div className={cn(surfaceCard, "max-w-4xl mx-auto")}>
                    <div className="flex items-center gap-3">
                        <XCircle className="text-rose-600" />
                        <div className="text-lg font-semibold text-slate-900">Thiếu dữ liệu để tạo đơn</div>
                    </div>
                    <p className={cn("mt-2 text-sm", muted)}>
                        Bạn cần có sản phẩm trong giỏ + chọn phương thức giao/nhận + chọn khung giờ trước khi thanh toán.
                    </p>

                    <div className="mt-5 flex gap-2">
                        <button className={cn(secondaryBtn, "px-4 py-2")} onClick={() => navigate("/checkout")}>
                            Quay lại thanh toán
                        </button>
                        <button className={cn(primaryBtn, "px-4 py-2")} onClick={() => navigate("/")}>
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ✅ CONFIRM UI
    return (
        <div className="min-h-screen bg-[#FAFAFA] px-8 pt-5 pb-10">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className={cn(surfaceCard, "flex items-start justify-between gap-4")}>
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 size={14} />
                            Đơn đã được xác nhận
                        </div>
                        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Thanh toán thành công 🎉</h1>
                        <p className={cn("mt-2 text-sm", muted)}>
                            Đơn hàng của bạn đã được ghi nhận. Hệ thống sẽ gửi email kèm QR cho bạn trong ít phút nữa.
                        </p>
                    </div>

                    <div className="text-right">
                        <div className={cn("text-xs", muted)}>Mã đơn</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">{order.orderId}</div>
                        <div className={cn("mt-1 text-xs", muted)}>{new Date(order.createdAt).toLocaleString("vi-VN")}</div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* QR */}
                    <div className={cn(card, "p-6 lg:col-span-1")}>
                        <div className="flex items-center gap-2 text-slate-900 font-semibold">
                            <ShieldCheck className="text-sky-600" size={18} />
                            Mã QR nhận hàng
                        </div>

                        <div className="mt-4 rounded-2xl bg-white ring-1 ring-sky-100 p-4 flex items-center justify-center">
                            <img src={qrImageUrl(order.qrPayload)} alt="QR Code" className="h-[260px] w-[260px]" />
                        </div>

                        <div className={cn("mt-3 text-xs", muted)}>
                            *Demo
                        </div>
                    </div>

                    {/* Info */}
                    <div className={cn(card, "p-6 lg:col-span-2")}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-slate-900 font-semibold">Thông tin đơn hàng</div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700 ring-1 ring-sky-100">
                                <CreditCard size={14} />
                                Online • Đã thanh toán
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                            <div className="rounded-2xl bg-white/70 ring-1 ring-sky-100 p-4">
                                <div className={cn("text-xs", muted)}>Giao/nhận</div>
                                <div className="mt-1 text-sm text-slate-900">{deliverySummary}</div>
                            </div>

                            <div className="rounded-2xl bg-white/70 ring-1 ring-sky-100 p-4">
                                <div className={cn("text-xs", muted)}>Khung giờ nhận hàng</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">{slotText}</div>
                            </div>

                            <div className="rounded-2xl bg-white/70 ring-1 ring-sky-100 p-4">
                                <div className={cn("text-xs", muted)}>Tổng tiền</div>
                                <div className="mt-1 text-xl font-extrabold text-slate-900">{money(order.total)}</div>
                            </div>

                            <div className="rounded-2xl bg-white/70 ring-1 ring-sky-100 p-4">
                                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                                    <Mail size={16} className="text-sky-600" />
                                    Email xác nhận
                                </div>
                                <p className={cn("mt-1 text-xs", muted)}>
                                    “Đã gửi email kèm QR cho bạn”.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-2 justify-end">
                            <button className={cn(secondaryBtn, "px-4 py-2")} onClick={() => navigate("/cart")}>
                                Xem giỏ hàng
                            </button>
                            <button className={cn(primaryBtn, "px-4 py-2")} onClick={() => navigate("/")}>
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
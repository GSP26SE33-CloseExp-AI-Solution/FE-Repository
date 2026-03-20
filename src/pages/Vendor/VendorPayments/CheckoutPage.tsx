import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, CreditCard, MapPin, ShoppingCart } from "lucide-react"
import toast from "react-hot-toast"
import { useAuthContext } from "@/contexts/AuthContext"
import { createOrder, createPaymentLink } from "@/services/payment.service"

/* ========= Helpers ========= */
const cn = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(" ")

const money = (n: number) => n.toLocaleString("vi-VN") + " đ"

/** ✅ MUST match CartPage */
const CART_KEY = "customer_cart_v1"
const CHECKOUT_CTX_KEY = "customer_checkout_context_v2"

type CartItem = {
  productId: string
  name: string
  price: number
  qty: number
  supermarketId: string
}

/* ========= Pickup time slots ========= */
type PickupSlotId = "SLOT_1" | "SLOT_2"

const PICKUP_SLOTS: Array<{
  id: PickupSlotId
  timeSlotGuid: string
  title: string
  desc: string
}> = [
  { id: "SLOT_1", timeSlotGuid: "cccc0001-0001-0001-0001-000000000001", title: "Khung 1", desc: "19:00 – 20:30" },
  { id: "SLOT_2", timeSlotGuid: "cccc0002-0002-0002-0002-000000000002", title: "Khung 2", desc: "21:00 – 22:30" },
]

type CheckoutContext = {
  deliveryMethodId?: "DELIVERY" | "PICKUP"
  addressText?: string
  pickupPointName?: string
  pickupPointAddress?: string
  pickupLat?: number
  pickupLng?: number
  lat?: number
  lng?: number

  /** ✅ time slot */
  pickupSlotId?: PickupSlotId
}

/* ========= UI tokens (sync Home style – pastel sky) ========= */
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

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [cart, setCart] = useState<CartItem[]>([])
  const [ctx, setCtx] = useState<CheckoutContext>({})
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    setCart(safeRead<CartItem[]>(CART_KEY, []))
    setCtx(safeRead<CheckoutContext>(CHECKOUT_CTX_KEY, {}))
  }, [])

  const subtotal = useMemo(
    () => cart.reduce((sum, it) => sum + it.price * it.qty, 0),
    [cart]
  )

  const serviceFee = useMemo(
    () => (subtotal > 0 ? Math.round(subtotal * 0.02) : 0),
    [subtotal]
  )
  const total = subtotal + serviceFee

  const canCheckout = cart.length > 0 && !!ctx.deliveryMethodId
  const hasSlot = !!ctx.pickupSlotId

  const deliverySummary = useMemo(() => {
    if (ctx.deliveryMethodId === "DELIVERY") {
      return ctx.addressText ? `Giao tận nơi: ${ctx.addressText}` : "Giao tận nơi"
    }
    if (ctx.deliveryMethodId === "PICKUP") {
      return ctx.pickupPointName ? `Tự lấy: ${ctx.pickupPointName}` : "Tự lấy tại điểm tập kết"
    }
    return "Chưa chọn giao hàng"
  }, [ctx])

  const slotLabel = useMemo(() => {
    const found = PICKUP_SLOTS.find((s) => s.id === ctx.pickupSlotId)
    return found ? `${found.title} (${found.desc})` : "Chưa chọn"
  }, [ctx.pickupSlotId])

  const saveCtx = (next: CheckoutContext) => {
    setCtx(next)
    localStorage.setItem(CHECKOUT_CTX_KEY, JSON.stringify(next))
  }

  const handleSelectSlot = (slotId: PickupSlotId) => {
    saveCtx({ ...ctx, pickupSlotId: slotId })
  }

  const handlePayAndRedirect = async () => {
    if (!canCheckout || !hasSlot || !user) return
    setPaying(true)

    const slot = PICKUP_SLOTS.find((s) => s.id === ctx.pickupSlotId)
    if (!slot) return

    try {
      const order = await createOrder({
        userId: user.userId,
        timeSlotId: slot.timeSlotGuid,
        deliveryType: ctx.deliveryMethodId!,
        totalAmount: subtotal,
        discountAmount: 0,
        finalAmount: total,
        deliveryFee: serviceFee,
        orderItems: cart.map((item) => ({
          lotId: item.productId,
          quantity: item.qty,
          unitPrice: item.price,
        })),
      })

      const { checkoutUrl } = await createPaymentLink({
        orderId: order.orderId,
        returnUrl: `${window.location.origin}/payment-return`,
        cancelUrl: `${window.location.origin}/payment-return`,
      })

      window.location.href = checkoutUrl
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Không thể tạo thanh toán"
      toast.error(message)
      setPaying(false)
    }
  }

  if (!canCheckout) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-8 pt-28 pb-10">
        <div className={cn(surfaceCard, "max-w-4xl mx-auto")}>
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-sky-600" />
            <div className="text-lg font-semibold text-slate-900">Không thể thanh toán</div>
          </div>
          <p className={cn("mt-2 text-sm", muted)}>
            Bạn cần có sản phẩm trong giỏ hàng và hoàn tất bước chọn phương thức giao hàng / vị trí trước.
          </p>
          <div className="mt-5 flex gap-2">
            <button className={cn(secondaryBtn, "px-4 py-2")} onClick={() => navigate("/cart")}>
              Quay lại giỏ hàng
            </button>
            <button className={cn(primaryBtn, "px-4 py-2")} onClick={() => navigate("/")}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-8 pt-5 pb-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className={cn(surfaceCard, "flex items-start justify-between gap-4")}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700 ring-1 ring-sky-100">
              <CreditCard size={14} />
              Thanh toán online bắt buộc
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Thanh toán</h1>
            <p className={cn("mt-2 text-sm", muted)}>
              Không hỗ trợ tiền mặt. Bạn cần thanh toán thành công để hệ thống tạo đơn.
            </p>
          </div>

          <div className="text-right">
            <div className={cn("text-xs", muted)}>Giao/nhận</div>
            <div className="mt-1 inline-flex items-center gap-2 rounded-2xl bg-white/70 ring-1 ring-sky-100 px-3 py-2 text-sm text-slate-900">
              <MapPin size={16} className="text-sky-600" />
              {deliverySummary}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT */}
          <div className={cn(card, "p-6 lg:col-span-2 space-y-6")}>
            {/* Pickup slot selection */}
            <div>
              <div className="flex items-center justify-between">
                <div className="text-slate-900 font-semibold">Chọn khung giờ nhận hàng</div>
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700 ring-1 ring-sky-100">
                  <Clock size={14} />
                  Bắt buộc
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PICKUP_SLOTS.map((s) => {
                  const active = ctx.pickupSlotId === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSlot(s.id)}
                      className={cn(
                        "rounded-2xl p-4 text-left ring-1 transition",
                        active
                          ? "bg-sky-100/70 ring-sky-200"
                          : "bg-white/70 ring-slate-200 hover:bg-sky-50 hover:ring-sky-200"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 h-9 w-9 rounded-xl grid place-items-center ring-1",
                            active ? "bg-white ring-sky-200" : "bg-white ring-slate-200"
                          )}
                        >
                          <Clock size={16} className={active ? "text-sky-700" : "text-slate-700"} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">{s.title}</div>
                          <div className={cn("mt-1 text-xs", muted)}>{s.desc}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {!hasSlot ? (
                <div className="mt-2 text-xs text-rose-600">Vui lòng chọn 1 khung giờ để tiếp tục.</div>
              ) : (
                <div className={cn("mt-2 text-xs", muted)}>
                  Đã chọn: <span className="font-semibold text-slate-900">{slotLabel}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <div className="text-slate-900 font-semibold">Sản phẩm trong đơn</div>

              <div className="mt-4 space-y-3">
                {cart.map((it) => (
                  <div
                    key={it.productId}
                    className="rounded-2xl bg-white/70 ring-1 ring-sky-100 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{it.name}</div>
                      <div className={cn("mt-1 text-xs", muted)}>
                        {money(it.price)} × {it.qty}
                      </div>
                    </div>
                    <div className="shrink-0 font-bold text-slate-900">{money(it.price * it.qty)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-sky-50/60 ring-1 ring-sky-100 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className={muted}>Tạm tính</span>
                  <span className="font-semibold text-slate-900">{money(subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className={muted}>Phí dịch vụ (demo)</span>
                  <span className="font-semibold text-slate-900">{money(serviceFee)}</span>
                </div>
                <div className="mt-3 border-t border-sky-100 pt-3 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Tổng</span>
                  <span className="text-xl font-extrabold text-slate-900">{money(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Payment */}
          <div className={cn(card, "p-6 lg:col-span-1")}>
            <div className="text-slate-900 font-semibold">Thanh toán</div>

            <div className="mt-4 rounded-2xl bg-white/70 ring-1 ring-sky-100 p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="text-sky-600" size={18} />
                <div className="font-semibold text-slate-900">Thẻ / Ví điện tử</div>
              </div>
              <div className={cn("mt-1 text-xs", muted)}>
                Thanh toán qua PayOS (chuyển khoản / ví điện tử).
              </div>

              <button
                type="button"
                onClick={handlePayAndRedirect}
                disabled={paying || !hasSlot}
                className={cn(
                  "mt-4 w-full px-4 py-2.5 rounded-xl font-semibold",
                  primaryBtn,
                  (paying || !hasSlot) && "opacity-60 cursor-not-allowed"
                )}
              >
                {!hasSlot ? "Chọn khung giờ trước" : paying ? "Đang tạo đơn & chuyển sang PayOS..." : "Thanh toán qua PayOS"}
              </button>

              {!hasSlot ? (
                <div className="mt-2 text-xs text-rose-600">Bạn cần chọn khung giờ nhận hàng trước khi thanh toán.</div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => navigate("/cart")}
              className={cn(secondaryBtn, "mt-3 w-full px-4 py-2.5")}
            >
              Quay lại giỏ hàng
            </button>

            <div className={cn("mt-4 text-xs", muted)}>*Sau khi thanh toán thành công, hệ thống sẽ tạo đơn + gửi email kèm QR.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
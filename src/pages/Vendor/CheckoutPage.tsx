import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, CreditCard, MapPin, ShoppingCart } from "lucide-react"

import type { CartItem, CustomerOrderContext, PickupSlotId } from "@/types/order.type"
import {
  cartStorage,
  getPickupSlotLabel,
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

const TIME_SLOT_ID_MAP: Record<PickupSlotId, string> = {
  SLOT_1: "cccc0001-0001-0001-0001-000000000001",
  SLOT_2: "cccc0002-0002-0002-0002-000000000002",
}

const PICKUP_SLOTS: Array<{ id: PickupSlotId; title: string; desc: string }> = [
  { id: "SLOT_1", title: "Khung 1", desc: "08:00 – 10:00" },
  { id: "SLOT_2", title: "Khung 2", desc: "14:00 – 16:00" },
]

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()

  const [cart, setCart] = useState<CartItem[]>([])
  const [ctx, setCtx] = useState<CustomerOrderContext>({})
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setCart(cartStorage.get())
    setCtx(orderContextStorage.get())
  }, [])

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  )

  const deliveryFee = useMemo(() => {
    if (!ctx.deliveryMethodId) return 0
    return ctx.deliveryMethodId === "DELIVERY" ? 15000 : 0
  }, [ctx.deliveryMethodId])

  const total = subtotal + deliveryFee

  const canCheckout = cart.length > 0 && orderContextStorage.isReady(ctx)
  const hasSlot = !!ctx.pickupSlotId

  const deliverySummary = useMemo(() => {
    if (ctx.deliveryMethodId === "DELIVERY") {
      return ctx.addressText ? `Giao tận nơi: ${ctx.addressText}` : "Giao tận nơi"
    }

    if (ctx.deliveryMethodId === "PICKUP") {
      return ctx.pickupPointName ? `Nhận tại điểm hẹn: ${ctx.pickupPointName}` : "Nhận tại điểm hẹn"
    }

    return "Chưa chọn giao hàng"
  }, [ctx])

  const saveCtx = (next: CustomerOrderContext) => {
    setCtx(next)
    orderContextStorage.set(next)
  }

  const handleSelectSlot = (slotId: PickupSlotId) => {
    setError("")
    const mappedTimeSlotId = TIME_SLOT_ID_MAP[slotId] || ""

    saveCtx({
      ...ctx,
      pickupSlotId: slotId,
      timeSlotId: mappedTimeSlotId,
    })
  }

  const handlePayAndRedirect = async () => {
    if (!canCheckout || !hasSlot) return

    if (!ctx.timeSlotId) {
      setError("Không có timeSlotId.")
      return
    }

    setError("")
    setPaying(true)

    await new Promise((resolve) => setTimeout(resolve, 700))

    setPaying(false)
    navigate("/payment-return?status=success")
  }

  if (!canCheckout) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-8 pb-10 pt-28">
        <div className={cn(surfaceCard, "mx-auto max-w-4xl")}>
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-sky-600" />
            <div className="text-lg font-semibold text-slate-900">Không thể thanh toán</div>
          </div>
          <p className={cn("mt-2 text-sm", muted)}>
            Bạn cần có sản phẩm trong giỏ và hoàn tất bước chọn phương thức giao hàng / vị trí trước.
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
    <div className="min-h-screen bg-[#FAFAFA] px-8 pb-10 pt-5">
      <div className="mx-auto max-w-5xl space-y-6">
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
            <div className="mt-1 inline-flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-sm text-slate-900 ring-1 ring-sky-100">
              <MapPin size={16} className="text-sky-600" />
              {deliverySummary}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className={cn(card, "space-y-6 p-6 lg:col-span-2")}>
            <div>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">Chọn khung giờ nhận hàng</div>
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-700 ring-1 ring-sky-100">
                  <Clock size={14} />
                  Bắt buộc
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PICKUP_SLOTS.map((slot) => {
                  const active = ctx.pickupSlotId === slot.id

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleSelectSlot(slot.id)}
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
                            "mt-0.5 grid h-9 w-9 place-items-center rounded-xl ring-1",
                            active ? "bg-white ring-sky-200" : "bg-white ring-slate-200"
                          )}
                        >
                          <Clock size={16} className={active ? "text-sky-700" : "text-slate-700"} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">{slot.title}</div>
                          <div className={cn("mt-1 text-xs", muted)}>{slot.desc}</div>
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
                  Đã chọn:{" "}
                  <span className="font-semibold text-slate-900">
                    {getPickupSlotLabel(ctx.pickupSlotId)}
                  </span>
                </div>
              )}

              {error ? <div className="mt-2 text-xs text-rose-600">{error}</div> : null}
            </div>

            <div>
              <div className="font-semibold text-slate-900">Sản phẩm trong đơn</div>

              <div className="mt-4 space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.lotId}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">{item.name}</div>
                      <div className={cn("mt-1 text-xs", muted)}>
                        {money(item.price)} × {item.qty}
                      </div>
                    </div>
                    <div className="shrink-0 font-bold text-slate-900">
                      {money(item.price * item.qty)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-sky-50/60 p-4 ring-1 ring-sky-100">
                <div className="flex items-center justify-between text-sm">
                  <span className={muted}>Tạm tính</span>
                  <span className="font-semibold text-slate-900">{money(subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className={muted}>Phí giao/nhận</span>
                  <span className="font-semibold text-slate-900">{money(deliveryFee)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-sky-100 pt-3">
                  <span className="font-semibold text-slate-900">Tổng</span>
                  <span className="text-xl font-extrabold text-slate-900">{money(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(card, "p-6 lg:col-span-1")}>
            <div className="font-semibold text-slate-900">Thanh toán</div>

            <div className="mt-4 rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100">
              <div className="flex items-center gap-2">
                <CreditCard className="text-sky-600" size={18} />
                <div className="font-semibold text-slate-900">Thẻ / Ví điện tử</div>
              </div>
              <div className={cn("mt-1 text-xs", muted)}>
                Demo: bấm để mô phỏng gateway xử lý, sau đó redirect về trang return.
              </div>

              <button
                type="button"
                onClick={handlePayAndRedirect}
                disabled={paying || !hasSlot}
                className={cn(
                  "mt-4 w-full rounded-xl px-4 py-2.5 font-semibold",
                  primaryBtn,
                  (paying || !hasSlot) && "cursor-not-allowed opacity-60"
                )}
              >
                {!hasSlot
                  ? "Chọn khung giờ trước"
                  : paying
                    ? "Đang chuyển sang cổng thanh toán..."
                    : "Thanh toán & đặt đơn"}
              </button>

              {!hasSlot ? (
                <div className="mt-2 text-xs text-rose-600">
                  Bạn cần chọn khung giờ nhận hàng trước khi thanh toán.
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => navigate("/cart")}
              className={cn(secondaryBtn, "mt-3 w-full px-4 py-2.5")}
            >
              Quay lại giỏ hàng
            </button>

            <div className={cn("mt-4 text-xs", muted)}>
              *Sau khi thanh toán thành công, hệ thống sẽ tạo đơn qua API Orders.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage

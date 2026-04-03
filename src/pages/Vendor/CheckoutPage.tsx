import React, { Fragment, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  ReceiptText,
  ShoppingCart,
  Truck,
} from "lucide-react"

import type {
  CartItem,
  CustomerOrderContext,
  OrderTimeSlot,
} from "@/types/order.type"
import {
  cartStorage,
  money,
  orderContextStorage,
} from "@/utils/orderStorage"
import { orderService } from "@/services/order.service"
import { createOrder, createPaymentLink } from "@/services/payment.service"
import { useAuthContext } from "@/contexts/AuthContext"
import toast from "react-hot-toast"

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

const formatTimeSlotLabel = (slot: OrderTimeSlot) => {
  if (slot.displayTimeRange?.trim()) return slot.displayTimeRange
  return "Khung giờ chưa có nhãn hiển thị"
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthContext()

  const [cart, setCart] = useState<CartItem[]>([])
  const [ctx, setCtx] = useState<CustomerOrderContext>({})

  const [timeSlots, setTimeSlots] = useState<OrderTimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState("")

  const [paying, setPaying] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    const syncCart = () => setCart(cartStorage.get())
    const syncCtx = () => setCtx(orderContextStorage.get())
    // const syncCtx = () => {
    //   const stored = orderContextStorage.get()

    //   const nextCtx: CustomerOrderContext = {
    //     ...stored,
    //     orderId: undefined,
    //   }

    //   setCtx(nextCtx)
    //   orderContextStorage.set(nextCtx)
    // }

    syncCart()
    syncCtx()

    window.addEventListener("cart:updated", syncCart as EventListener)
    window.addEventListener("order-context:updated", syncCtx as EventListener)
    window.addEventListener("focus", syncCart)
    window.addEventListener("focus", syncCtx)

    return () => {
      window.removeEventListener("cart:updated", syncCart as EventListener)
      window.removeEventListener("order-context:updated", syncCtx as EventListener)
      window.removeEventListener("focus", syncCart)
      window.removeEventListener("focus", syncCtx)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchTimeSlots = async () => {
      try {
        setLoadingSlots(true)
        setSlotsError("")

        console.log("CheckoutPage.fetchTimeSlots -> start")

        const nextSlots = await orderService.getTimeSlots()

        if (!mounted) return

        setTimeSlots(nextSlots)

        if (!nextSlots.length) {
          setSlotsError("Hệ thống hiện chưa có khung giờ giao / nhận khả dụng.")
        }
      } catch (error: any) {
        console.error("CheckoutPage.fetchTimeSlots -> error:", error)
        if (!mounted) return

        setTimeSlots([])
        setSlotsError(
          error?.response?.data?.message || "Không thể tải danh sách khung giờ."
        )
      } finally {
        if (mounted) setLoadingSlots(false)
      }
    }

    void fetchTimeSlots()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!ctx.timeSlotId || !timeSlots.length) return

    const exists = timeSlots.some((slot) => slot.timeSlotId === ctx.timeSlotId)
    if (exists) return

    const nextCtx = {
      ...ctx,
      timeSlotId: undefined,
    }

    console.warn(
      "CheckoutPage -> current timeSlotId is no longer valid, clearing from context:",
      ctx.timeSlotId
    )

    setCtx(nextCtx)
    orderContextStorage.set(nextCtx)
    setSubmitError("Khung giờ đã chọn không còn hợp lệ. Vui lòng chọn lại.")
  }, [ctx, timeSlots])

  const breadcrumbs = useMemo(
    () => getBreadcrumbsByPath(location.pathname),
    [location.pathname]
  )

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  )

  const totalQty = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  )

  const deliveryFee = useMemo(() => {
    if (!ctx.deliveryMethodId) return 0
    return ctx.deliveryMethodId === "DELIVERY" ? 15000 : 0
  }, [ctx.deliveryMethodId])

  const total = subtotal + deliveryFee

  const canCheckoutBase = cart.length > 0 && orderContextStorage.isReady(ctx)
  const hasTimeSlot = !!ctx.timeSlotId
  const canSubmit = canCheckoutBase && hasTimeSlot && !loadingSlots && timeSlots.length > 0

  const selectedTimeSlot = useMemo(
    () => timeSlots.find((slot) => slot.timeSlotId === ctx.timeSlotId),
    [ctx.timeSlotId, timeSlots]
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
        icon: <MapPin size={16} className="text-slate-900" />,
        title: "Nhận tại điểm hẹn",
        lines: [
          ctx.collectionPointName || ctx.pickupPointName || "Chưa có điểm nhận",
          ctx.collectionPointAddress || ctx.pickupPointAddress || "",
        ].filter(Boolean),
      }
    }

    return {
      icon: <MapPin size={16} className="text-slate-900" />,
      title: "Chưa chọn phương thức",
      lines: ["Bạn cần chọn giao nhận trước khi thanh toán."],
    }
  }, [ctx])

  const handleSelectSlot = (timeSlotId: string) => {
    setSubmitError("")

    const nextCtx: CustomerOrderContext = {
      ...ctx,
      timeSlotId,
    }

    setCtx(nextCtx)
    orderContextStorage.set(nextCtx)
  }

  const handlePayAndRedirect = async () => {
    if (!canSubmit) return

    if (!ctx.timeSlotId) {
      setSubmitError("Bạn chưa chọn khung giờ giao / nhận.")
      return
    }

    if (!user?.userId) {
      toast.error("Vui lòng đăng nhập lại để thanh toán.")
      return
    }

    const resolvedCollectionId = orderContextStorage.getResolvedCollectionId(ctx)
    if (ctx.deliveryMethodId === "PICKUP" && !resolvedCollectionId) {
      setSubmitError("Thiếu điểm nhận hàng. Vui lòng quay lại giỏ hoặc trang chủ để chọn lại.")
      return
    }

    setSubmitError("")
    setPaying(true)

    const nextCtx: CustomerOrderContext = {
      ...ctx,
      orderId: undefined,
    }

    setCtx(nextCtx)
    orderContextStorage.set(nextCtx)

    try {
      const order = await createOrder({
        userId: user.userId,
        timeSlotId: ctx.timeSlotId,
        deliveryType: ctx.deliveryMethodId!,
        totalAmount: subtotal,
        discountAmount: 0,
        finalAmount: total,
        deliveryFee,
        ...(ctx.deliveryMethodId === "PICKUP"
          ? { collectionId: resolvedCollectionId }
          : {}),
        ...(ctx.promotionId ? { promotionId: ctx.promotionId } : {}),
        ...(ctx.addressId ? { addressId: ctx.addressId } : {}),
        deliveryNote:
          ctx.deliveryMethodId === "DELIVERY"
            ? ctx.addressText || undefined
            : orderContextStorage.getResolvedCollectionAddress(ctx) ||
              orderContextStorage.getResolvedCollectionName(ctx) ||
              undefined,
        orderItems: cart.map((item) => ({
          lotId: item.lotId,
          quantity: item.qty,
          unitPrice: item.price,
        })),
      })

      const origin = window.location.origin
      const { checkoutUrl } = await createPaymentLink({
        orderId: order.orderId,
        returnUrl: `${origin}/payment-return`,
        cancelUrl: `${origin}/payment-return`,
      })

      window.location.href = checkoutUrl
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Không thể tạo thanh toán"
      toast.error(message)
      setPaying(false)
    }
  }

  if (!canCheckoutBase) {
    return (
      <div className="min-h-screen bg-slate-50/70 py-8">
        <div className="mx-auto max-w-[1180px] px-4">
          <div className={cn(panel, "p-5 sm:p-6")}>
            <div className="flex items-center gap-3">
              <ShoppingCart className="text-sky-600" />
              <div className="text-base font-semibold text-slate-900">
                Không thể thanh toán
              </div>
            </div>

            <p className={cn("mt-2 text-[13px]", muted)}>
              Bạn cần có sản phẩm trong giỏ và hoàn tất bước chọn phương thức
              giao hàng / vị trí trước.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={cn(secondaryBtn, "px-4 py-2.5")}
                onClick={() => navigate("/cart")}
              >
                Quay lại giỏ hàng
              </button>

              <button
                className={cn(primaryBtn, "px-4 py-2.5")}
                onClick={() => navigate("/")}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
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

          <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-5 py-5 md:px-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm">
                    <CreditCard className="h-7 w-7" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-[22px] font-bold text-slate-900">
                        Thanh toán đơn hàng
                      </h1>

                      <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[12px] font-medium text-sky-700">
                        Vui lòng thanh toán trả trước
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className={secondaryBtn}
                  >
                    Quay lại giỏ hàng
                  </button>

                  <button
                    type="button"
                    onClick={handlePayAndRedirect}
                    disabled={!canSubmit || paying}
                    className={cn(
                      primaryBtn,
                      (!canSubmit || paying) && "cursor-not-allowed opacity-60"
                    )}
                  >
                    {paying ? "Đang chuyển sang cổng thanh toán..." : "Thanh toán & đặt đơn"}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700">
                  <ShoppingCart size={14} />
                  Bạn đang có {totalQty} sản phẩm
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-12">
            <section className="xl:col-span-8">
              <div className="space-y-6">
                <section className={cn(panel, "p-4 sm:p-5")}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Khung giờ
                      </div>
                      <h2 className="mt-1 text-lg font-black text-slate-900">
                        Chọn khung giờ giao / nhận
                      </h2>
                      <p className="mt-1 text-[13px] text-slate-500">
                        Khung giờ giao / nhận hàng là cố định.
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] text-sky-700 ring-1 ring-sky-100">
                      <Clock3 size={14} />
                      Bắt buộc
                    </div>
                  </div>

                  {loadingSlots ? (
                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-[13px] text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải khung giờ từ hệ thống...
                    </div>
                  ) : slotsError ? (
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                      <div>
                        <div className="text-[13px] font-semibold text-rose-800">
                          Không tải được khung giờ
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-rose-700">
                          {slotsError}
                        </p>
                      </div>
                    </div>
                  ) : !timeSlots.length ? (
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <div className="text-[13px] font-semibold text-amber-800">
                          Chưa có khung giờ khả dụng
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-amber-700">
                          Hệ thống hiện chưa có khung giờ giao / nhận phù hợp để bạn tiếp tục.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {timeSlots.map((slot, index) => {
                          const active = ctx.timeSlotId === slot.timeSlotId

                          return (
                            <button
                              key={slot.timeSlotId}
                              type="button"
                              onClick={() => handleSelectSlot(slot.timeSlotId)}
                              className={cn(
                                "rounded-[20px] p-3.5 text-left ring-1 transition",
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
                                  <Clock3
                                    size={15}
                                    className={active ? "text-sky-700" : "text-slate-700"}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900">
                                    Khung giờ {index + 1}
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-500">
                                    {formatTimeSlotLabel(slot)}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {!hasTimeSlot ? (
                        <div className="mt-3 text-[11px] text-rose-600">
                          Vui lòng chọn 1 khung giờ để tiếp tục.
                        </div>
                      ) : (
                        <div className="mt-3 text-[11px] text-slate-500">
                          Đã chọn:{" "}
                          <span className="font-semibold text-slate-900">
                            {selectedTimeSlot
                              ? formatTimeSlotLabel(selectedTimeSlot)
                              : "Khung giờ không hợp lệ"}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {submitError ? (
                    <div className="mt-3 text-[11px] text-rose-600">{submitError}</div>
                  ) : null}
                </section>

                <section className={cn(panel, "p-4 sm:p-5")}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                      <ReceiptText size={18} />
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Đơn hàng
                      </div>
                      <h2 className="mt-1 text-lg font-black text-slate-900">
                        Sản phẩm trong đơn
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {cart.map((item) => (
                      <article
                        key={item.lotId}
                        className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 p-3.5"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-slate-900">
                            {item.name}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {money(item.price)} × {item.qty}
                          </div>
                        </div>

                        <div className="shrink-0 text-[13px] font-bold text-slate-900">
                          {money(item.price * item.qty)}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </section>

            <aside className="xl:col-span-4">
              <div className="sticky top-[88px] space-y-3">
                <section className={cn(panel, "p-4 sm:p-5")}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Tóm tắt thông tin thanh toán
                      </div>
                      <h2 className="mt-1 text-lg font-black text-slate-900">
                        Thanh toán
                      </h2>
                    </div>

                    <div className="rounded-xl bg-slate-100 px-3 py-2 text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Tổng món
                      </div>
                      <div className="text-[13px] font-bold text-slate-900">{totalQty}</div>
                    </div>
                  </div>

                  <div className={cn(softPanel, "mt-4 p-4")}>
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-900 shadow-sm">
                        {deliverySummary.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[13px] font-bold text-slate-900">
                          {deliverySummary.title}
                        </h3>

                        <div className="mt-2 space-y-1.5 text-[11px] leading-5 text-slate-600">
                          {deliverySummary.lines.map((line, index) => (
                            <div key={index}>{line}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className={muted}>Tạm tính</span>
                      <span className="font-semibold text-slate-900">{money(subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[13px]">
                      <span className={muted}>
                        {ctx.deliveryMethodId === "DELIVERY"
                          ? "Phí giao hàng"
                          : "Phí nhận tại điểm tập kết"}
                      </span>
                      {/* không tính phí khi tự nhận tại điểm tập kết */}
                      <span className="font-semibold text-slate-900">{money(deliveryFee)}</span>
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
                          {money(total)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePayAndRedirect}
                    disabled={!canSubmit || paying}
                    className={cn(
                      "mt-4 w-full",
                      primaryBtn,
                      (!canSubmit || paying) && "cursor-not-allowed opacity-60"
                    )}
                  >
                    {paying
                      ? "Đang chuyển sang cổng thanh toán..."
                      : !hasTimeSlot
                        ? "Chọn khung giờ trước"
                        : "Thanh toán & đặt đơn"}
                  </button>

                  {!hasTimeSlot && !loadingSlots && timeSlots.length > 0 ? (
                    <div className="mt-2 text-[11px] text-rose-600">
                      Bạn cần chọn khung giờ giao / nhận trước khi thanh toán.
                    </div>
                  ) : null}
                </section>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CheckoutPage

import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from "lucide-react"
import toast from "react-hot-toast"

import type {
  CartItem,
  CustomerOrderContext,
  OrderTimeSlot,
} from "@/types/order.type"
import {
  cartStorage,
  money,
  orderContextStorage,
  pendingPaymentOrderStorage,
} from "@/utils/orderStorage"
import { orderService } from "@/services/order.service"
import { customerAddressService } from "@/services/customer-address.service"
import { useAuthContext } from "@/contexts/AuthContext"
import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"

const cn = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(" ")

const primaryBtn =
  "inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99]"
const secondaryBtn =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
const muted = "text-slate-500"

const SERVICE_FEE = 5000
const SLOT_CUTOFF_MINUTES = 15

type SlotClockTime = {
  hours: number
  minutes: number
  seconds: number
}

const formatTimeSlotLabel = (slot: OrderTimeSlot) => {
  if (slot.displayTimeRange?.trim()) return slot.displayTimeRange
  return "Khung giờ chưa có nhãn hiển thị"
}

const parseClockFromDisplayRange = (
  displayTimeRange?: string,
): SlotClockTime | null => {
  if (!displayTimeRange?.trim()) return null

  const match = displayTimeRange.match(/(\d{1,2})\s*:\s*(\d{2})/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return {
    hours,
    minutes,
    seconds: 0,
  }
}

const parseClockFromTimeSpan = (
  timeSpan?: OrderTimeSlot["startTime"],
): SlotClockTime | null => {
  if (!timeSpan) return null

  if (
    typeof timeSpan.totalHours === "number" &&
    Number.isFinite(timeSpan.totalHours)
  ) {
    const totalSeconds = Math.floor(timeSpan.totalHours * 60 * 60)
    const normalizedSeconds = ((totalSeconds % 86400) + 86400) % 86400

    return {
      hours: Math.floor(normalizedSeconds / 3600),
      minutes: Math.floor((normalizedSeconds % 3600) / 60),
      seconds: normalizedSeconds % 60,
    }
  }

  if (typeof timeSpan.ticks === "number" && Number.isFinite(timeSpan.ticks)) {
    const totalSeconds = Math.floor(timeSpan.ticks / 10_000_000)
    const normalizedSeconds = ((totalSeconds % 86400) + 86400) % 86400

    return {
      hours: Math.floor(normalizedSeconds / 3600),
      minutes: Math.floor((normalizedSeconds % 3600) / 60),
      seconds: normalizedSeconds % 60,
    }
  }

  if (
    typeof timeSpan.hours === "number" &&
    typeof timeSpan.minutes === "number" &&
    Number.isFinite(timeSpan.hours) &&
    Number.isFinite(timeSpan.minutes)
  ) {
    return {
      hours: timeSpan.hours,
      minutes: timeSpan.minutes,
      seconds:
        typeof timeSpan.seconds === "number" &&
          Number.isFinite(timeSpan.seconds)
          ? timeSpan.seconds
          : 0,
    }
  }

  return null
}

const getSlotStartClock = (slot: OrderTimeSlot): SlotClockTime | null => {
  return (
    parseClockFromDisplayRange(slot.displayTimeRange) ||
    parseClockFromTimeSpan(slot.startTime)
  )
}

const getTimeSlotStartDate = (slot: OrderTimeSlot, now = new Date()) => {
  const clock = getSlotStartClock(slot)
  if (!clock) return null

  const date = new Date(now)
  date.setHours(clock.hours, clock.minutes, clock.seconds, 0)

  return date
}

const getSlotAvailability = (slot: OrderTimeSlot, now = new Date()) => {
  const startDate = getTimeSlotStartDate(slot, now)

  if (!startDate) {
    return {
      disabled: true,
      reason: "Không đọc được giờ bắt đầu",
    }
  }

  const diffMs = startDate.getTime() - now.getTime()
  const diffMinutes = diffMs / 1000 / 60

  if (diffMinutes <= 0) {
    return {
      disabled: true,
      reason: "Khung giờ đã qua",
    }
  }

  if (diffMinutes <= SLOT_CUTOFF_MINUTES) {
    return {
      disabled: true,
      reason: `Cần đặt trước ít nhất ${SLOT_CUTOFF_MINUTES} phút`,
    }
  }

  return {
    disabled: false,
    reason: "",
  }
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
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const syncCart = () => setCart(cartStorage.get())
    const syncCtx = () => setCtx(orderContextStorage.get())

    syncCart()
    syncCtx()

    window.addEventListener("cart:updated", syncCart as EventListener)
    window.addEventListener("order-context:updated", syncCtx as EventListener)
    window.addEventListener("focus", syncCart)
    window.addEventListener("focus", syncCtx)

    return () => {
      window.removeEventListener("cart:updated", syncCart as EventListener)
      window.removeEventListener(
        "order-context:updated",
        syncCtx as EventListener,
      )
      window.removeEventListener("focus", syncCart)
      window.removeEventListener("focus", syncCtx)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 30_000)

    return () => window.clearInterval(timer)
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
          setSlotsError(
            "Hệ thống hiện chưa có khung giờ giao / nhận khả dụng.",
          )
        }
      } catch (error: any) {
        console.error("CheckoutPage.fetchTimeSlots -> error:", error)
        if (!mounted) return

        setTimeSlots([])
        setSlotsError(
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải danh sách khung giờ.",
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

    const nextCtx: CustomerOrderContext = {
      ...ctx,
      timeSlotId: undefined,
    }

    console.warn(
      "CheckoutPage -> current timeSlotId is no longer valid, clearing from context:",
      ctx.timeSlotId,
    )

    setCtx(nextCtx)
    orderContextStorage.set(nextCtx)
    setSubmitError("Khung giờ đã chọn không còn hợp lệ. Vui lòng chọn lại.")
  }, [ctx, timeSlots])

  const breadcrumbs = useMemo(
    () => getBreadcrumbsByPath(location.pathname),
    [location.pathname],
  )

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart],
  )

  const totalQty = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart],
  )

  const deliveryFee = useMemo(() => {
    if (!ctx.deliveryMethodId) return 0
    return ctx.deliveryMethodId === "DELIVERY" ? 15000 : 0
  }, [ctx.deliveryMethodId])

  const serviceFee = SERVICE_FEE
  const total = subtotal + deliveryFee + serviceFee

  const selectedTimeSlot = useMemo(
    () => timeSlots.find((slot) => slot.timeSlotId === ctx.timeSlotId),
    [ctx.timeSlotId, timeSlots],
  )

  const selectedSlotAvailability = useMemo(
    () =>
      selectedTimeSlot
        ? getSlotAvailability(selectedTimeSlot, now)
        : { disabled: true, reason: "" },
    [selectedTimeSlot, now],
  )

  const canCheckoutBase = cart.length > 0 && orderContextStorage.isReady(ctx)
  const hasTimeSlot = !!ctx.timeSlotId && !selectedSlotAvailability.disabled

  const canSubmit =
    canCheckoutBase &&
    hasTimeSlot &&
    !loadingSlots &&
    timeSlots.length > 0 &&
    !paying

  const deliverySummary = useMemo(() => {
    if (ctx.deliveryMethodId === "DELIVERY") {
      return {
        icon: <Truck size={16} className="text-sky-700" />,
        title: "Giao tận nơi",
        lines: [ctx.addressText || "Chưa có địa chỉ giao hàng"].filter(
          Boolean,
        ),
      }
    }

    if (ctx.deliveryMethodId === "PICKUP") {
      return {
        icon: <MapPin size={16} className="text-sky-700" />,
        title: "Nhận tại điểm hẹn",
        lines: [
          ctx.collectionPointName ||
          ctx.pickupPointName ||
          "Chưa có điểm nhận",
          ctx.collectionPointAddress || ctx.pickupPointAddress || "",
        ].filter(Boolean),
      }
    }

    return {
      icon: <MapPin size={16} className="text-sky-700" />,
      title: "Chưa chọn phương thức",
      lines: ["Bạn cần chọn giao nhận trước khi thanh toán."],
    }
  }, [ctx])

  const handleSelectSlot = (slot: OrderTimeSlot) => {
    const availability = getSlotAvailability(slot, now)

    if (availability.disabled) {
      setSubmitError(availability.reason || "Khung giờ này không còn khả dụng.")
      return
    }

    setSubmitError("")

    const nextCtx: CustomerOrderContext = {
      ...ctx,
      timeSlotId: slot.timeSlotId,
    }

    setCtx(nextCtx)
    orderContextStorage.set(nextCtx)
  }

  const resolveDeliveryAddressContext = useCallback(
    async (currentCtx: CustomerOrderContext): Promise<CustomerOrderContext> => {
      if (currentCtx.deliveryMethodId !== "DELIVERY") return currentCtx
      if (currentCtx.addressId) return currentCtx

      if (
        !currentCtx.addressText?.trim() ||
        typeof currentCtx.lat !== "number" ||
        typeof currentCtx.lng !== "number"
      ) {
        throw new Error(
          "Thiếu địa chỉ giao hàng. Vui lòng quay lại chọn vị trí giao.",
        )
      }

      const defaultAddress = await customerAddressService.getDefaultAddress()
      if (defaultAddress?.customerAddressId) {
        return {
          ...currentCtx,
          addressId: defaultAddress.customerAddressId,
        }
      }

      if (!user?.fullName?.trim() || !user?.phone?.trim()) {
        throw new Error(
          "Thiếu thông tin người nhận (họ tên/số điện thoại). Vui lòng cập nhật hồ sơ.",
        )
      }

      const createdAddress = await customerAddressService.createAddress({
        recipientName: user.fullName.trim(),
        phone: user.phone.trim(),
        addressLine: currentCtx.addressText.trim(),
        latitude: currentCtx.lat,
        longitude: currentCtx.lng,
        isDefault: true,
      })

      return {
        ...currentCtx,
        addressId: createdAddress.customerAddressId,
      }
    },
    [user],
  )

  useEffect(() => {
    if (ctx.deliveryMethodId !== "DELIVERY") return
    if (ctx.addressId) return
    if (
      !ctx.addressText?.trim() ||
      typeof ctx.lat !== "number" ||
      typeof ctx.lng !== "number"
    )
      return
    if (!user?.userId) return

    let cancelled = false

    void (async () => {
      try {
        const next = await resolveDeliveryAddressContext(ctx)
        if (!cancelled && next.addressId) {
          setCtx(next)
          orderContextStorage.set(next)
        }
      } catch {
        // handlePayAndRedirect sẽ thử lại; thiếu profile vẫn có thể báo lỗi lúc bấm thanh toán
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    ctx.deliveryMethodId,
    ctx.addressId,
    ctx.addressText,
    ctx.lat,
    ctx.lng,
    resolveDeliveryAddressContext,
    user?.userId,
  ])

  const handlePayAndRedirect = async () => {
    if (!canSubmit) return

    if (!ctx.timeSlotId) {
      setSubmitError("Bạn chưa chọn khung giờ giao / nhận.")
      return
    }

    if (!ctx.deliveryMethodId) {
      setSubmitError("Bạn chưa chọn phương thức giao / nhận.")
      return
    }

    if (!user?.userId) {
      toast.error("Vui lòng đăng nhập lại để thanh toán.")
      return
    }

    if (selectedTimeSlot) {
      const availability = getSlotAvailability(selectedTimeSlot, new Date())
      if (availability.disabled) {
        setSubmitError(
          availability.reason ||
          "Khung giờ đã chọn không còn khả dụng. Vui lòng chọn lại.",
        )
        return
      }
    }

    const resolvedCollectionId = orderContextStorage.getResolvedCollectionId(ctx)
    if (ctx.deliveryMethodId === "PICKUP" && !resolvedCollectionId) {
      setSubmitError(
        "Thiếu điểm nhận hàng. Vui lòng quay lại giỏ hoặc trang chủ để chọn lại.",
      )
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
      let submitCtx = nextCtx
      if (nextCtx.deliveryMethodId === "DELIVERY") {
        submitCtx = await resolveDeliveryAddressContext(nextCtx)
        setCtx(submitCtx)
        orderContextStorage.set(submitCtx)
      }

      const submitCollectionId =
        orderContextStorage.getResolvedCollectionId(submitCtx)

      const order = await orderService.createMyOrder({
        timeSlotId: submitCtx.timeSlotId ?? ctx.timeSlotId,
        deliveryType: submitCtx.deliveryMethodId ?? ctx.deliveryMethodId,
        deliveryFee,
        ...(submitCtx.deliveryMethodId === "PICKUP"
          ? { collectionId: submitCollectionId }
          : {}),
        ...(submitCtx.promotionId
          ? { promotionId: submitCtx.promotionId }
          : {}),
        ...(submitCtx.addressId ? { addressId: submitCtx.addressId } : {}),
        deliveryNote:
          submitCtx.deliveryMethodId === "DELIVERY"
            ? submitCtx.addressText || undefined
            : orderContextStorage.getResolvedCollectionAddress(
              submitCtx,
            ) ||
            orderContextStorage.getResolvedCollectionName(
              submitCtx,
            ) ||
            undefined,
        orderItems: cart.map((item) => ({
          lotId: item.lotId,
          quantity: item.qty,
          unitPrice: item.price,
        })),
      })

      pendingPaymentOrderStorage.set(order)

      const origin = window.location.origin
      const { checkoutUrl } = await orderService.createPaymentLink({
        orderId: order.orderId,
        returnUrl: `${origin}/payment-return`,
        cancelUrl: `${origin}/payment-return`,
      })

      window.location.href = checkoutUrl
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Không thể tạo thanh toán"
      console.error("CheckoutPage.handlePayAndRedirect -> error:", err)
      toast.error(message)
      setSubmitError(message)
      setPaying(false)
    }
  }

  if (!canCheckoutBase) {
    return (
      <div className="min-h-screen bg-slate-50 py-6">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-5 lg:px-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                <ShoppingCart size={20} />
              </div>
              <div>
                <div className="text-base font-semibold text-slate-950">
                  Không thể thanh toán
                </div>
                <p className="mt-1 text-[13px] text-slate-500">
                  Bạn cần có sản phẩm trong giỏ và hoàn tất
                  bước chọn phương thức giao hàng / vị trí
                  trước.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={secondaryBtn}
                onClick={() => navigate("/cart")}
              >
                Quay lại giỏ hàng
              </button>

              <button
                className={primaryBtn}
                onClick={() => navigate("/")}
              >
                Về trang chủ
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

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
                <CreditCard size={20} />
              </div>

              <div>
                <div className="inline-flex rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                  Thanh toán trả trước
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  Thanh toán đơn hàng
                </h1>
                <p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-500">
                  Chọn khung giờ nhận hàng và kiểm tra lại
                  toàn bộ phí trước khi chuyển sang cổng thanh
                  toán.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Sản phẩm
                </div>
                <div className="mt-0.5 text-[14px] font-bold text-slate-900">
                  {totalQty}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Tổng thanh toán
                </div>
                <div className="mt-0.5 text-[14px] font-bold text-rose-600">
                  {money(total)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Khung giờ
                  </div>
                  <h2 className="mt-1 text-[15px] font-bold text-slate-950">
                    Chọn khung giờ giao / nhận
                  </h2>
                  <p className="mt-1 text-[12px] text-slate-500">
                    Chỉ hỗ trợ đặt trong ngày. Vui lòng chọn
                    khung giờ còn cách hiện tại ít nhất{" "}
                    {SLOT_CUTOFF_MINUTES} phút.
                  </p>
                </div>

                <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100">
                  <Clock3 size={13} />
                  Bắt buộc
                </div>
              </div>

              {loadingSlots ? (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải khung giờ từ hệ thống...
                </div>
              ) : slotsError ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-rose-600"
                  />
                  <div>
                    <div className="text-[13px] font-semibold text-rose-800">
                      Không tải được khung giờ
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-rose-700">
                      {slotsError}
                    </p>
                  </div>
                </div>
              ) : !timeSlots.length ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  <div>
                    <div className="text-[13px] font-semibold text-amber-800">
                      Chưa có khung giờ khả dụng
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-amber-700">
                      Hệ thống hiện chưa có khung giờ giao
                      / nhận phù hợp để bạn tiếp tục.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {timeSlots.map((slot, index) => {
                      const active =
                        ctx.timeSlotId === slot.timeSlotId
                      const availability = getSlotAvailability(
                        slot,
                        now,
                      )
                      const disabled = availability.disabled

                      return (
                        <button
                          key={slot.timeSlotId}
                          type="button"
                          onClick={() =>
                            handleSelectSlot(slot)
                          }
                          disabled={disabled}
                          className={cn(
                            "rounded-xl border px-3 py-3 text-left transition active:scale-[0.99]",
                            active && !disabled
                              ? "border-sky-200 bg-sky-50 ring-1 ring-sky-100"
                              : disabled
                                ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                                : "border-slate-200 bg-white hover:bg-slate-50",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "grid h-9 w-9 place-items-center rounded-xl",
                                active &&
                                  !disabled
                                  ? "bg-white text-sky-700 ring-1 ring-sky-100"
                                  : "bg-slate-50 text-slate-600",
                              )}
                            >
                              <Clock3 size={15} />
                            </div>

                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-slate-950">
                                Khung giờ{" "}
                                {index + 1}
                              </div>
                              <div className="mt-0.5 text-[12px] text-slate-500">
                                {formatTimeSlotLabel(
                                  slot,
                                )}
                              </div>

                              {disabled ? (
                                <div className="mt-1 text-[11px] font-medium text-rose-500">
                                  {
                                    availability.reason
                                  }
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {!hasTimeSlot ? (
                    <div className="mt-3 text-[12px] text-rose-600">
                      {selectedTimeSlot &&
                        selectedSlotAvailability.reason
                        ? selectedSlotAvailability.reason
                        : "Vui lòng chọn 1 khung giờ còn khả dụng để tiếp tục."}
                    </div>
                  ) : (
                    <div className="mt-3 text-[12px] text-slate-500">
                      Đã chọn:{" "}
                      <span className="font-semibold text-slate-900">
                        {selectedTimeSlot
                          ? formatTimeSlotLabel(
                            selectedTimeSlot,
                          )
                          : "Khung giờ không hợp lệ"}
                      </span>
                    </div>
                  )}
                </>
              )}

              {submitError ? (
                <div className="mt-3 text-[12px] text-rose-600">
                  {submitError}
                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Đơn hàng
                  </div>
                  <h2 className="mt-1 text-[15px] font-bold text-slate-950">
                    Sản phẩm trong đơn
                  </h2>
                </div>

                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                  <ReceiptText size={17} />
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <article
                    key={item.lotId}
                    className="grid gap-3 px-4 py-3.5 transition hover:bg-slate-50/70 md:grid-cols-[1fr_auto] md:items-center"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-slate-400">
                            <ShoppingBag size={17} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="line-clamp-2 text-[14px] font-semibold leading-5 text-slate-950">
                          {item.name}
                        </div>
                        <div className="mt-1 text-[12px] text-slate-500">
                          {money(item.price)} ×{" "}
                          {item.qty}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[14px] font-bold text-slate-950">
                      {money(item.price * item.qty)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <aside className="lg:sticky lg:top-[88px] lg:self-start">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Tóm tắt
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-slate-950">
                    Thanh toán
                  </h2>
                </div>

                <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <CreditCard size={17} />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sky-700 ring-1 ring-slate-200">
                    {deliverySummary.icon}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-slate-950">
                      {deliverySummary.title}
                    </h3>

                    <div className="mt-1 space-y-1 text-[12px] leading-5 text-slate-500">
                      {deliverySummary.lines.map(
                        (line, index) => (
                          <div key={index}>{line}</div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className={muted}>
                    Tạm tính hàng hóa
                  </span>
                  <span className="font-semibold text-slate-900">
                    {money(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[13px]">
                  <span className={muted}>Phí giao hàng</span>
                  <span className="font-semibold text-slate-900">
                    {money(deliveryFee)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[13px]">
                  <span className={muted}>Phí dịch vụ</span>
                  <span className="font-semibold text-slate-900">
                    {money(serviceFee)}
                  </span>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-950">
                      Tổng thanh toán
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      Đã bao gồm phí dịch vụ
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
                disabled={!canSubmit}
                className={cn(
                  "mt-4 w-full gap-2",
                  canSubmit
                    ? primaryBtn
                    : "inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-500",
                )}
              >
                {paying ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                    Đang chuyển thanh toán...
                  </>
                ) : !hasTimeSlot ? (
                  "Chọn khung giờ trước"
                ) : (
                  "Thanh toán & đặt đơn"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/cart")}
                className={cn(secondaryBtn, "mt-3 w-full")}
              >
                Quay lại giỏ hàng
              </button>

              {!hasTimeSlot && !loadingSlots && timeSlots.length > 0 ? (
                <div className="mt-2 text-[12px] text-rose-600">
                  Bạn cần chọn khung giờ giao / nhận còn khả
                  dụng trước khi thanh toán.
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default CheckoutPage

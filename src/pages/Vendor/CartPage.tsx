import React, { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    AlertCircle,
    ArrowRight,
    ChevronRight,
    Clock3,
    MapPin,
    Minus,
    PackageCheck,
    Plus,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Trash2,
    Truck,
} from "lucide-react"

import type { CartItem, CustomerOrderContext, DeliveryMethodId } from "@/types/order.type"
import {
    cartStorage,
    googleMapsUrl,
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
const ghostBtn =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
const dangerBtn =
    "inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-[0.99]"
const primaryBtn =
    "inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
const qtyBtn =
    "grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"

const DELIVERY_COPY: Record<DeliveryMethodId, { title: string; sub: string }> = {
    DELIVERY: {
        title: "Giao tận nơi",
        sub: "Đơn sẽ được giao đến địa chỉ bạn đã chọn ở trang chủ",
    },
    PICKUP: {
        title: "Nhận tại điểm tập kết",
        sub: "Bạn sẽ đến điểm nhận hàng cố định bạn đã chọn ở trang chủ",
    },
}

const ORDER_STATUS_META = {
    Pending: {
        label: "Chờ xử lý",
        className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    Paid: {
        label: "Đã thanh toán, đang xử lý",
        className: "border-sky-200 bg-sky-50 text-sky-700",
    },
    ReadyToShip: {
        label: "Sẵn sàng giao",
        className: "border-violet-200 bg-violet-50 text-violet-700",
    },
    DeliveredWaitConfirm: {
        label: "Đã giao, chờ xác nhận",
        className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    Completed: {
        label: "Hoàn tất",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    Canceled: {
        label: "Đã hủy",
        className: "border-rose-200 bg-rose-50 text-rose-700",
    },
    Refunded: {
        label: "Đã hoàn tiền",
        className: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    },
    Failed: {
        label: "Thất bại",
        className: "border-rose-200 bg-rose-50 text-rose-700",
    },
} as const

const CartPage: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const [items, setItems] = useState<CartItem[]>(() => cartStorage.get())
    const [ctx, setCtx] = useState<CustomerOrderContext>(() => orderContextStorage.get())

    useEffect(() => {
        const syncCart = () => setItems(cartStorage.get())
        const syncCtx = () => setCtx(orderContextStorage.get())

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

    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
        [items]
    )

    const totalQty = useMemo(
        () => items.reduce((sum, item) => sum + item.qty, 0),
        [items]
    )

    const deliveryFee = useMemo(() => {
        if (!ctx.deliveryMethodId) return 0
        return ctx.deliveryMethodId === "DELIVERY" ? 15000 : 0
    }, [ctx.deliveryMethodId])

    const total = subtotal + deliveryFee

    const isContextReady = useMemo(() => orderContextStorage.isReady(ctx), [ctx])

    const resolvedCollectionId = orderContextStorage.getResolvedCollectionId(ctx)
    const resolvedCollectionName = orderContextStorage.getResolvedCollectionName(ctx)
    const resolvedCollectionAddress = orderContextStorage.getResolvedCollectionAddress(ctx)

    const updateQty = (lotId: string, nextQty: number) => {
        const target = items.find((item) => item.lotId === lotId)
        if (!target) return

        if (nextQty <= 0) {
            const next = items.filter((item) => item.lotId !== lotId)
            setItems(next)
            cartStorage.set(next)
            return
        }

        const qty = Math.max(1, Math.min(99, nextQty))
        const next = items.map((item) => (item.lotId === lotId ? { ...item, qty } : item))
        setItems(next)
        cartStorage.set(next)
    }

    const removeItem = (lotId: string) => {
        const next = items.filter((item) => item.lotId !== lotId)
        setItems(next)
        cartStorage.set(next)
    }

    const clearCart = () => {
        setItems([])
        cartStorage.clear()
    }

    const handleCheckout = () => {
        if (items.length === 0) return

        if (!isContextReady) {
            navigate("/")
            return
        }

        navigate("/checkout")
    }

    const deliverySummary = useMemo(() => {
        if (ctx.deliveryMethodId === "DELIVERY") {
            return {
                icon: <Truck size={16} className="text-slate-900" />,
                title: DELIVERY_COPY.DELIVERY.title,
                subtitle: DELIVERY_COPY.DELIVERY.sub,
                lines: [
                    ctx.addressText || "Chưa có địa chỉ giao hàng",
                    typeof ctx.lat === "number" && typeof ctx.lng === "number"
                        ? `${ctx.lat.toFixed(6)}, ${ctx.lng.toFixed(6)}`
                        : "",
                ].filter(Boolean),
                map:
                    typeof ctx.lat === "number" && typeof ctx.lng === "number"
                        ? googleMapsUrl(ctx.lat, ctx.lng)
                        : "",
                isReady:
                    !!ctx.addressText &&
                    typeof ctx.lat === "number" &&
                    typeof ctx.lng === "number",
            }
        }

        if (ctx.deliveryMethodId === "PICKUP") {
            return {
                icon: <PackageCheck size={16} className="text-slate-900" />,
                title: DELIVERY_COPY.PICKUP.title,
                subtitle: DELIVERY_COPY.PICKUP.sub,
                lines: [
                    resolvedCollectionName || "Chưa chọn điểm nhận",
                    resolvedCollectionAddress || "",
                    resolvedCollectionId ? `Mã điểm nhận: ${resolvedCollectionId}` : "",
                ].filter(Boolean),
                map:
                    typeof ctx.pickupLat === "number" && typeof ctx.pickupLng === "number"
                        ? googleMapsUrl(ctx.pickupLat, ctx.pickupLng)
                        : "",
                isReady: !!resolvedCollectionId,
            }
        }

        return {
            icon: <MapPin size={16} className="text-slate-900" />,
            title: "Chưa thiết lập giao nhận",
            subtitle: "Bạn cần chọn phương thức nhận hàng trước khi checkout",
            lines: ["Quay về trang chủ để chọn giao tận nơi hoặc nhận tại điểm hẹn."],
            map: "",
            isReady: false,
        }
    }, [ctx, resolvedCollectionAddress, resolvedCollectionId, resolvedCollectionName])

    const previewOrderStatus = ORDER_STATUS_META.Pending

    const breadcrumbs = useMemo(
        () => getBreadcrumbsByPath(location.pathname),
        [location.pathname]
    )

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
                        <React.Fragment key={`${crumb}-${index}`}>
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
                        </React.Fragment>
                    ))}
                </div>

                <section className={cn(panel, "overflow-hidden")}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.10),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_30%)]" />
                        <div className="relative flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
                            <div className="flex items-start gap-4">
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-slate-900 text-white shadow-sm">
                                    <ShoppingCart size={20} />
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-[22px] font-black tracking-tight text-slate-900">
                                            Giỏ hàng của bạn
                                        </h1>
                                        <span
                                            className={cn(
                                                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                                previewOrderStatus.className
                                            )}
                                        >
                                            {previewOrderStatus.label}
                                        </span>
                                    </div>

                                    <p className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
                                        Kiểm tra lại sản phẩm, phương thức nhận hàng và tổng tiền trước khi
                                        chuyển sang checkout.
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
                                            <ShoppingBag size={13} />
                                            Bạn đang có {totalQty} sản phẩm
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button type="button" onClick={() => navigate("/")} className={ghostBtn}>
                                    Tiếp tục mua sắm
                                </button>

                                <button
                                    type="button"
                                    onClick={clearCart}
                                    disabled={items.length === 0}
                                    className={cn(
                                        dangerBtn,
                                        items.length === 0 && "cursor-not-allowed opacity-50"
                                    )}
                                >
                                    Xóa toàn bộ
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-5 grid gap-5 xl:grid-cols-12">
                    <section className="xl:col-span-8">
                        {items.length === 0 ? (
                            <div className={cn(panel, "p-7 sm:p-8")}>
                                <div className="mx-auto max-w-md text-center">
                                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-slate-100 text-slate-700">
                                        <ShoppingCart size={22} />
                                    </div>

                                    <h2 className="mt-4 text-lg font-bold text-slate-900">
                                        Giỏ hàng đang trống
                                    </h2>
                                    <p className="mt-2 text-[13px] leading-5 text-slate-500">
                                        Bạn chưa có sản phẩm nào trong giỏ. Quay về trang chủ để chọn các
                                        mặt hàng phù hợp nhé.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/")}
                                        className={cn(primaryBtn, "mt-5 gap-2")}
                                    >
                                        Mua sắm ngay
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item) => {
                                    const lineTotal = item.price * item.qty

                                    return (
                                        <article
                                            key={item.lotId}
                                            className={cn(panel, "overflow-hidden p-3.5 sm:p-4")}
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex min-w-0 gap-4">
                                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-100">
                                                        {item.imageUrl ? (
                                                            <img
                                                                src={item.imageUrl}
                                                                alt={item.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="grid h-full w-full place-items-center text-slate-400">
                                                                <ShoppingBag size={20} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="line-clamp-2 text-[15px] font-bold text-slate-900">
                                                                {item.name}
                                                            </h3>

                                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                                                Lot
                                                            </span>
                                                        </div>

                                                        <div className="mt-2 text-[11px] text-slate-500">
                                                            <span className="font-medium text-slate-700">
                                                                Mã lô:
                                                            </span>{" "}
                                                            {item.lotId}
                                                        </div>

                                                        <div className="mt-1 text-[11px] text-slate-500">
                                                            <span className="font-medium text-slate-700">
                                                                Mã sản phẩm:
                                                            </span>{" "}
                                                            {item.productId}
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                                                            <div className="text-lg font-black tracking-tight text-rose-600">
                                                                {money(item.price)}
                                                            </div>
                                                            <div className="text-[11px] font-medium text-slate-500">
                                                                / đơn vị đặt hàng
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-stretch gap-3 sm:items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.lotId)}
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-100"
                                                    >
                                                        <Trash2 size={14} />
                                                        Xóa
                                                    </button>

                                                    <div className="inline-flex items-center gap-2 rounded-[18px] border border-slate-200 bg-slate-50 p-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQty(item.lotId, item.qty - 1)}
                                                            className={qtyBtn}
                                                            aria-label="Giảm số lượng"
                                                        >
                                                            <Minus size={15} />
                                                        </button>

                                                        <div className="grid min-w-[52px] place-items-center text-[13px] font-bold text-slate-900">
                                                            {item.qty}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => updateQty(item.lotId, item.qty + 1)}
                                                            className={qtyBtn}
                                                            aria-label="Tăng số lượng"
                                                        >
                                                            <Plus size={15} />
                                                        </button>
                                                    </div>

                                                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right">
                                                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                            Thành tiền
                                                        </div>
                                                        <div className="mt-1 text-base font-black text-slate-900">
                                                            {money(lineTotal)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        )}
                    </section>

                    <aside className="xl:col-span-4">
                        <div className="sticky top-[88px] space-y-3">
                            <section className={cn(panel, "p-4 sm:p-5")}>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Tóm tắt đơn hàng
                                        </div>
                                        <h2 className="mt-1 text-lg font-black text-slate-900">
                                            Thanh toán
                                        </h2>
                                    </div>

                                    <div className="rounded-xl bg-slate-100 px-3 py-2 text-right">
                                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Tổng món hàng
                                        </div>
                                        <div className="text-[13px] font-bold text-slate-900">
                                            {totalQty}
                                        </div>
                                    </div>
                                </div>

                                <div className={cn(softPanel, "mt-4 p-4")}>
                                    <div className="flex items-start gap-3">
                                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-900 shadow-sm">
                                            {deliverySummary.icon}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-[13px] font-bold text-slate-900">
                                                        {deliverySummary.title}
                                                    </h3>
                                                </div>

                                                {deliverySummary.map ? (
                                                    <a
                                                        href={deliverySummary.map}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        <MapPin size={13} />
                                                        Bản đồ
                                                    </a>
                                                ) : null}
                                            </div>

                                            <div className="mt-3 space-y-1.5 text-[11px] leading-5 text-slate-600">
                                                {deliverySummary.lines.map((line, index) => (
                                                    <div key={index}>{line}</div>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => navigate("/")}
                                                className={cn(ghostBtn, "mt-4 w-full")}
                                            >
                                                Đổi phương thức / vị trí
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {!isContextReady ? (
                                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                                        <div>
                                            <div className="text-[13px] font-semibold text-amber-800">
                                                Thiếu thông tin giao nhận
                                            </div>
                                            <p className="mt-1 text-[11px] leading-5 text-amber-700">
                                                Cart hiện chỉ kiểm tra context giao/nhận cơ bản. Time slot,
                                                addressId hoặc thông tin checkout chi tiết sẽ hoàn tất ở bước
                                                checkout.
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-slate-500">Tạm tính</span>
                                        <span className="font-semibold text-slate-900">{money(subtotal)}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-slate-500">
                                            {ctx.deliveryMethodId === "DELIVERY"
                                                ? "Phí giao hàng"
                                                : "Phí nhận tại điểm hẹn"}
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {money(deliveryFee)}
                                        </span>
                                    </div>

                                    <div className="h-px bg-slate-200" />

                                    <div className="flex items-end justify-between gap-3">
                                        <div>
                                            <div className="text-[13px] font-semibold text-slate-900">
                                                Tổng thanh toán
                                            </div>
                                            <div className="mt-1 text-[11px] text-slate-500">
                                                Chưa áp dụng mã giảm giá nào
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
                                    onClick={handleCheckout}
                                    disabled={items.length === 0 || !isContextReady}
                                    className={cn(
                                        "mt-4 w-full gap-2",
                                        items.length > 0 && isContextReady
                                            ? primaryBtn
                                            : "inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-500"
                                    )}
                                >
                                    Tiếp tục đến checkout
                                    <ChevronRight size={14} />
                                </button>
                            </section>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    )
}

export default CartPage

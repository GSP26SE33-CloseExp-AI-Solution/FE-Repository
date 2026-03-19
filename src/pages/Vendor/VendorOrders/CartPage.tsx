import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    ArrowRight,
    MapPin,
    Minus,
    PackageCheck,
    Plus,
    ShoppingCart,
    Trash2,
    Truck,
} from "lucide-react"

import type { CartItem, CustomerOrderContext } from "@/types/order.type"
import {
    cartStorage,
    googleMapsUrl,
    money,
    orderContextStorage,
} from "@/utils/orderStorage"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const surfaceCard =
    "backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl border border-white/40"
const card = "rounded-3xl bg-white/70 ring-1 ring-sky-100 shadow-sm"
const mutedText = "text-slate-500"

const primaryBtn =
    "bg-gradient-to-r from-sky-400 to-cyan-400 text-white font-semibold rounded-xl shadow-md transition-all duration-300 active:scale-95 hover:brightness-105"

const secondaryBtn =
    "border border-sky-200 text-sky-700 bg-white/70 font-medium rounded-xl hover:bg-sky-50 transition disabled:opacity-50"

const dangerBtn =
    "border border-rose-200 text-rose-700 bg-white/70 font-medium rounded-xl hover:bg-rose-50 transition"

const CartPage: React.FC = () => {
    const navigate = useNavigate()

    const [items, setItems] = useState<CartItem[]>(() => cartStorage.get())
    const [ctx, setCtx] = useState<CustomerOrderContext>(() => orderContextStorage.get())

    useEffect(() => {
        const syncCart = () => setItems(cartStorage.get())
        const syncCtx = () => setCtx(orderContextStorage.get())

        window.addEventListener("cart:updated", syncCart as EventListener)
        window.addEventListener("focus", syncCart)
        window.addEventListener("focus", syncCtx)

        return () => {
            window.removeEventListener("cart:updated", syncCart as EventListener)
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

    const shippingFee = useMemo(() => {
        if (!ctx.deliveryMethodId) return 0
        return ctx.deliveryMethodId === "DELIVERY" ? 15000 : 0
    }, [ctx.deliveryMethodId])

    const total = subtotal + shippingFee

    const updateQty = (lotId: string, nextQty: number) => {
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
        if (!orderContextStorage.isReady(ctx)) {
            navigate("/")
            return
        }

        navigate("/checkout")
    }

    const deliverySummary = useMemo(() => {
        if (ctx.deliveryMethodId === "DELIVERY") {
            return {
                icon: <Truck size={16} className="text-sky-700" />,
                title: "Giao tận nơi",
                lines: [
                    ctx.addressText || "Chưa có địa chỉ",
                    typeof ctx.lat === "number" && typeof ctx.lng === "number"
                        ? `${ctx.lat.toFixed(6)}, ${ctx.lng.toFixed(6)}`
                        : "",
                ].filter(Boolean),
                map:
                    typeof ctx.lat === "number" && typeof ctx.lng === "number"
                        ? googleMapsUrl(ctx.lat, ctx.lng)
                        : "",
            }
        }

        if (ctx.deliveryMethodId === "PICKUP") {
            return {
                icon: <PackageCheck size={16} className="text-sky-700" />,
                title: "Nhận tại điểm hẹn",
                lines: [
                    ctx.pickupPointName || "Chưa chọn điểm nhận",
                    ctx.pickupPointAddress || "",
                    typeof ctx.pickupLat === "number" && typeof ctx.pickupLng === "number"
                        ? `${ctx.pickupLat.toFixed(6)}, ${ctx.pickupLng.toFixed(6)}`
                        : "",
                ].filter(Boolean),
                map:
                    typeof ctx.pickupLat === "number" && typeof ctx.pickupLng === "number"
                        ? googleMapsUrl(ctx.pickupLat, ctx.pickupLng)
                        : "",
            }
        }

        return {
            icon: <MapPin size={16} className="text-sky-700" />,
            title: "Chưa thiết lập giao nhận",
            lines: ["Vui lòng quay về Trang chủ để chọn phương thức và vị trí."],
            map: "",
        }
    }, [ctx])

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] font-sans">
            <main className="mx-auto w-full max-w-[1264px] px-6 py-6">
                <section className={cn(surfaceCard, "p-5")}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/70 shadow-sm ring-1 ring-sky-100">
                                <ShoppingCart size={20} className="text-sky-700" />
                            </div>
                            <div>
                                <div className="text-xl font-extrabold text-slate-900">Giỏ hàng</div>
                                <div className={cn("text-sm", mutedText)}>
                                    {totalQty > 0 ? `Bạn đang có ${totalQty} món trong giỏ.` : "Giỏ hàng đang trống."}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className={cn(secondaryBtn, "px-4 py-2")}
                            >
                                Tiếp tục mua sắm
                            </button>

                            <button
                                type="button"
                                onClick={clearCart}
                                disabled={items.length === 0}
                                className={cn(dangerBtn, "px-4 py-2", items.length === 0 && "opacity-50")}
                            >
                                Xoá giỏ
                            </button>
                        </div>
                    </div>
                </section>

                <div className="mt-5 grid gap-5 lg:grid-cols-12">
                    <section className="lg:col-span-8">
                        {items.length === 0 ? (
                            <div className={cn(card, "p-8 text-center")}>
                                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 ring-1 ring-sky-100">
                                    <ShoppingCart size={22} className="text-sky-700" />
                                </div>
                                <div className="text-lg font-semibold text-slate-900">Chưa có sản phẩm nào</div>
                                <p className={cn("mt-2 text-sm", mutedText)}>
                                    Quay về Trang chủ để chọn sản phẩm nhé.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate("/")}
                                    className={cn(primaryBtn, "mt-4 inline-flex items-center gap-2 px-6 py-2.5")}
                                >
                                    Đi mua sắm
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {items.map((item) => (
                                    <div key={item.lotId} className={cn(card, "p-4")}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="truncate font-semibold text-slate-900">{item.name}</div>
                                                <div className={cn("mt-1 text-xs", mutedText)}>
                                                    Lot: <span className="font-medium">{item.lotId}</span>
                                                </div>
                                                <div className="mt-2 flex items-end gap-2">
                                                    <div className="text-lg font-extrabold text-slate-900">
                                                        {money(item.price)}
                                                    </div>
                                                    <div className={cn("text-xs", mutedText)}>/ sản phẩm</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.lotId)}
                                                    className={cn(
                                                        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
                                                        "bg-white/70 text-rose-700 ring-1 ring-rose-100 hover:bg-rose-50"
                                                    )}
                                                >
                                                    <Trash2 size={14} />
                                                    Xoá
                                                </button>

                                                <div className="inline-flex items-center overflow-hidden rounded-2xl bg-white/70 ring-1 ring-sky-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(item.lotId, item.qty - 1)}
                                                        className="grid h-10 w-10 place-items-center hover:bg-sky-50"
                                                        aria-label="Giảm"
                                                    >
                                                        <Minus size={16} className="text-slate-700" />
                                                    </button>

                                                    <div className="grid h-10 min-w-[56px] place-items-center text-sm font-bold text-slate-900">
                                                        {item.qty}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(item.lotId, item.qty + 1)}
                                                        className="grid h-10 w-10 place-items-center hover:bg-sky-50"
                                                        aria-label="Tăng"
                                                    >
                                                        <Plus size={16} className="text-slate-700" />
                                                    </button>
                                                </div>

                                                <div className={cn("text-xs", mutedText)}>
                                                    Tạm tính:{" "}
                                                    <span className="font-semibold text-slate-900">
                                                        {money(item.price * item.qty)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className="lg:col-span-4">
                        <div className={cn(card, "sticky top-[96px] p-5")}>
                            <div className="text-sm font-semibold text-slate-900">Thông tin thanh toán</div>

                            <div className={cn("mt-4 rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100")}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-50 ring-1 ring-sky-100">
                                            {deliverySummary.icon}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                {deliverySummary.title}
                                            </div>
                                            <div className={cn("text-xs", mutedText)}>Thông tin giao/nhận</div>
                                        </div>
                                    </div>

                                    {deliverySummary.map ? (
                                        <a
                                            href={deliverySummary.map}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold",
                                                "bg-white text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50"
                                            )}
                                        >
                                            <MapPin size={14} />
                                            Bản đồ
                                        </a>
                                    ) : null}
                                </div>

                                <div className={cn("mt-3 space-y-1 text-xs", mutedText)}>
                                    {deliverySummary.lines.map((text, index) => (
                                        <div key={index}>{text}</div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigate("/")}
                                    className={cn(secondaryBtn, "mt-4 w-full px-4 py-2 text-sm")}
                                >
                                    Đổi phương thức / vị trí
                                </button>
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className={mutedText}>Tạm tính</span>
                                    <span className="font-semibold text-slate-900">{money(subtotal)}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className={mutedText}>
                                        Phí {ctx.deliveryMethodId === "DELIVERY" ? "giao hàng" : "nhận hàng"}
                                    </span>
                                    <span className="font-semibold text-slate-900">{money(shippingFee)}</span>
                                </div>

                                <div className="h-px bg-sky-100" />

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-900">Tổng cộng</span>
                                    <span className="text-xl font-extrabold text-slate-900">{money(total)}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleCheckout}
                                disabled={items.length === 0 || !orderContextStorage.isReady(ctx)}
                                className={cn(
                                    "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition",
                                    items.length > 0 && orderContextStorage.isReady(ctx)
                                        ? primaryBtn
                                        : "cursor-not-allowed bg-slate-100 text-slate-400"
                                )}
                            >
                                Tiếp tục thanh toán
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    )
}

export default CartPage

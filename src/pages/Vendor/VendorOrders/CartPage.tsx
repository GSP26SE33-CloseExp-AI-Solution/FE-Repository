import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    ShoppingCart,
    Trash2,
    Minus,
    Plus,
    ArrowRight,
    MapPin,
    Truck,
    PackageCheck,
} from "lucide-react"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

/* ================= Storage keys (match Home) ================= */

const CART_KEY = "customer_cart_v1"
const CTX_KEY = "customer_checkout_context_v2"

/* ================= Types ================= */

type CartItem = {
    productId: string
    supermarketId: string
    name: string
    price: number
    qty: number
}

type CustomerContext = {
    deliveryMethodId?: "DELIVERY" | "PICKUP"
    addressText?: string
    lat?: number
    lng?: number

    pickupPointName?: string
    pickupPointAddress?: string
    pickupLat?: number
    pickupLng?: number

    supermarketsWithin5Km?: Array<{
        supermarketId: string
        name: string
        address: string
        latitude: number
        longitude: number
        distanceKm?: number
    }>
}

/* ================= Helpers ================= */

const money = (v: number) => v.toLocaleString("vi-VN") + " đ"

const readCart = (): CartItem[] => {
    try {
        const raw = localStorage.getItem(CART_KEY)
        return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
        return []
    }
}

const writeCart = (items: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event("cart:updated"))
}

const readCtx = (): CustomerContext => {
    try {
        const raw = localStorage.getItem(CTX_KEY)
        return raw ? (JSON.parse(raw) as CustomerContext) : {}
    } catch {
        return {}
    }
}

const googleMapsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`

/* ================= Styles (sync Home pastel) ================= */

const surfaceCard =
    "backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl border border-white/40"
const card =
    "rounded-3xl bg-white/70 ring-1 ring-sky-100 shadow-sm"
const mutedText = "text-slate-500"

const primaryBtn =
    "bg-gradient-to-r from-sky-400 to-cyan-400 text-white font-semibold rounded-xl shadow-md transition-all duration-300 active:scale-95 hover:brightness-105"

const secondaryBtn =
    "border border-sky-200 text-sky-700 bg-white/70 font-medium rounded-xl hover:bg-sky-50 transition disabled:opacity-50"

const dangerBtn =
    "border border-rose-200 text-rose-700 bg-white/70 font-medium rounded-xl hover:bg-rose-50 transition"

/* ================= Page ================= */

const CartPage: React.FC = () => {
    const navigate = useNavigate()

    const [items, setItems] = useState<CartItem[]>(() => readCart())
    const ctx = useMemo(() => readCtx(), [])

    // sync if updated elsewhere
    useEffect(() => {
        const sync = () => setItems(readCart())
        window.addEventListener("cart:updated", sync as EventListener)
        window.addEventListener("focus", sync)
        return () => {
            window.removeEventListener("cart:updated", sync as EventListener)
            window.removeEventListener("focus", sync)
        }
    }, [])

    const subtotal = useMemo(
        () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
        [items]
    )
    const totalQty = useMemo(
        () => items.reduce((sum, it) => sum + it.qty, 0),
        [items]
    )

    // demo: phí giao hàng cố định (sau này tính theo distance)
    const shippingFee = useMemo(() => {
        if (!ctx?.deliveryMethodId) return 0
        return ctx.deliveryMethodId === "DELIVERY" ? 15000 : 0
    }, [ctx?.deliveryMethodId])

    const total = subtotal + shippingFee

    const updateQty = (productId: string, nextQty: number) => {
        const qty = Math.max(1, Math.min(99, nextQty))
        const next = items.map((it) => (it.productId === productId ? { ...it, qty } : it))
        setItems(next)
        writeCart(next)
    }

    const removeItem = (productId: string) => {
        const next = items.filter((it) => it.productId !== productId)
        setItems(next)
        writeCart(next)
    }

    const clearCart = () => {
        setItems([])
        writeCart([])
    }

    const handleCheckout = () => {
        // nếu chưa có delivery context, ép quay về home để chọn
        if (!ctx?.deliveryMethodId) {
            navigate("/")
            return
        }
        // demo: chuyển sang trang checkout
        navigate("/checkout")
    }

    const deliverySummary = useMemo(() => {
        if (ctx.deliveryMethodId === "DELIVERY") {
            return {
                icon: <Truck size={16} className="text-sky-700" />,
                title: "Giao tận nhà",
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
                title: "Tự lấy tại điểm tập kết",
                lines: [
                    ctx.pickupPointName || "Chưa chọn điểm tập kết",
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
            lines: ["Vui lòng quay về Trang Chủ để chọn phương thức và vị trí."],
            map: "",
        }
    }, [ctx])

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] font-sans">
            <main className="mx-auto w-full max-w-[1264px] px-6 py-6">
                {/* Title bar */}
                <section className={cn(surfaceCard, "p-5")}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-white/70 ring-1 ring-sky-100 grid place-items-center shadow-sm">
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
                    {/* LEFT: items */}
                    <section className="lg:col-span-8">
                        {items.length === 0 ? (
                            <div className={cn(card, "p-8 text-center")}>
                                <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-sky-50 ring-1 ring-sky-100 grid place-items-center">
                                    <ShoppingCart size={22} className="text-sky-700" />
                                </div>
                                <div className="text-lg font-semibold text-slate-900">Chưa có sản phẩm nào</div>
                                <p className={cn("mt-2 text-sm", mutedText)}>
                                    Quay về Trang Chủ để chọn sản phẩm nhé.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate("/")}
                                    className={cn(primaryBtn, "mt-4 px-6 py-2.5 inline-flex items-center gap-2")}
                                >
                                    Đi mua sắm
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {items.map((it) => (
                                    <div key={it.productId} className={cn(card, "p-4")}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="font-semibold text-slate-900 truncate">{it.name}</div>
                                                <div className={cn("mt-1 text-xs", mutedText)}>
                                                    Siêu thị: <span className="font-medium">{it.supermarketId}</span>
                                                </div>
                                                <div className="mt-2 flex items-end gap-2">
                                                    <div className="text-lg font-extrabold text-slate-900">
                                                        {money(it.price)}
                                                    </div>
                                                    <div className={cn("text-xs", mutedText)}>/ sản phẩm</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(it.productId)}
                                                    className={cn(
                                                        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
                                                        "bg-white/70 ring-1 ring-rose-100 text-rose-700 hover:bg-rose-50"
                                                    )}
                                                    title="Xoá"
                                                >
                                                    <Trash2 size={14} />
                                                    Xoá
                                                </button>

                                                {/* qty control */}
                                                <div className="inline-flex items-center rounded-2xl bg-white/70 ring-1 ring-sky-100 overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(it.productId, it.qty - 1)}
                                                        className="h-10 w-10 grid place-items-center hover:bg-sky-50"
                                                        aria-label="Giảm"
                                                    >
                                                        <Minus size={16} className="text-slate-700" />
                                                    </button>

                                                    <div className="h-10 min-w-[56px] grid place-items-center text-sm font-bold text-slate-900">
                                                        {it.qty}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(it.productId, it.qty + 1)}
                                                        className="h-10 w-10 grid place-items-center hover:bg-sky-50"
                                                        aria-label="Tăng"
                                                    >
                                                        <Plus size={16} className="text-slate-700" />
                                                    </button>
                                                </div>

                                                <div className={cn("text-xs", mutedText)}>
                                                    Tạm tính:{" "}
                                                    <span className="font-semibold text-slate-900">
                                                        {money(it.price * it.qty)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* RIGHT: summary */}
                    <aside className="lg:col-span-4">
                        <div className={cn(card, "p-5 sticky top-[96px]")}>
                            <div className="text-sm font-semibold text-slate-900">Thông tin thanh toán</div>

                            {/* delivery */}
                            <div className={cn("mt-4 rounded-2xl bg-white/70 ring-1 ring-sky-100 p-4")}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-xl bg-sky-50 ring-1 ring-sky-100 grid place-items-center">
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
                                                "bg-white ring-1 ring-sky-200 text-sky-700 hover:bg-sky-50"
                                            )}
                                        >
                                            <MapPin size={14} />
                                            Bản đồ
                                        </a>
                                    ) : null}
                                </div>

                                <div className={cn("mt-3 space-y-1 text-xs", mutedText)}>
                                    {deliverySummary.lines.map((t, idx) => (
                                        <div key={idx}>{t}</div>
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

                            {/* price */}
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
                                disabled={items.length === 0 || !ctx?.deliveryMethodId}
                                className={cn(
                                    "mt-5 w-full px-5 py-3 inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition",
                                    items.length > 0 && ctx?.deliveryMethodId
                                        ? primaryBtn
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
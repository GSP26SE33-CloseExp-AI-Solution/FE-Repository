import React, { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    ArrowRight,
    ChevronRight,
    Minus,
    Plus,
    ShoppingBag,
    ShoppingCart,
    Trash2,
} from "lucide-react"

import type { CartItem, CustomerOrderContext } from "@/types/order.type"
import {
    cartStorage,
    money,
    orderContextStorage,
} from "@/utils/orderStorage"
import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const primaryBtn =
    "inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99]"
const secondaryBtn =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
const textBtn =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
const qtyBtn =
    "grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]"

const CartPage: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const [items, setItems] = useState<CartItem[]>(() => cartStorage.get())
    const [ctx, setCtx] = useState<CustomerOrderContext>(() =>
        orderContextStorage.get(),
    )

    useEffect(() => {
        const syncCart = () => setItems(cartStorage.get())
        const syncCtx = () => setCtx(orderContextStorage.get())

        window.addEventListener("cart:updated", syncCart as EventListener)
        window.addEventListener(
            "order-context:updated",
            syncCtx as EventListener,
        )
        window.addEventListener("focus", syncCart)
        window.addEventListener("focus", syncCtx)

        return () => {
            window.removeEventListener(
                "cart:updated",
                syncCart as EventListener,
            )
            window.removeEventListener(
                "order-context:updated",
                syncCtx as EventListener,
            )
            window.removeEventListener("focus", syncCart)
            window.removeEventListener("focus", syncCtx)
        }
    }, [])

    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
        [items],
    )

    const totalQty = useMemo(
        () => items.reduce((sum, item) => sum + item.qty, 0),
        [items],
    )

    const isContextReady = useMemo(
        () => orderContextStorage.isContextSufficientForShopping(ctx),
        [ctx],
    )

    const breadcrumbs = useMemo(
        () => getBreadcrumbsByPath(location.pathname),
        [location.pathname],
    )

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
        const next = items.map((item) =>
            item.lotId === lotId ? { ...item, qty } : item,
        )

        setItems(next)
        cartStorage.set(next)
    }

    const removeItem = (lotId: string) => {
        const next = items.filter((item) => item.lotId !== lotId)
        setItems(next)
        cartStorage.set(next)
    }

    const clearCart = () => {
        if (!items.length) return
        const ok = window.confirm("Bạn muốn xóa toàn bộ giỏ hàng?")
        if (!ok) return

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
                        <React.Fragment key={`${crumb}-${index}`}>
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
                        </React.Fragment>
                    ))}
                </div>

                <section className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                                <ShoppingCart size={20} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                                    Giỏ hàng
                                </h1>
                                <p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-500">
                                    Kiểm tra sản phẩm trước khi checkout. Phí
                                    giao hàng, phí dịch vụ và mã giảm giá sẽ
                                    được tính ở bước tiếp theo.
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
                                    Tạm tính
                                </div>
                                <div className="mt-0.5 text-[14px] font-bold text-slate-900">
                                    {money(subtotal)}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {items.length === 0 ? (
                    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-slate-100 text-slate-500">
                            <ShoppingBag size={22} />
                        </div>

                        <h2 className="mt-4 text-lg font-bold text-slate-950">
                            Giỏ hàng đang trống
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-slate-500">
                            Bạn chưa có sản phẩm nào trong giỏ. Quay về trang
                            chủ để chọn các mặt hàng phù hợp nhé.
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className={cn(primaryBtn, "mt-5 gap-2")}
                        >
                            Mua sắm ngay
                            <ArrowRight size={14} />
                        </button>
                    </section>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                <div>
                                    <h2 className="text-[15px] font-bold text-slate-950">
                                        Sản phẩm trong giỏ
                                    </h2>
                                    <p className="mt-0.5 text-[12px] text-slate-500">
                                        {items.length} mặt hàng, {totalQty} sản
                                        phẩm.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={clearCart}
                                    className="rounded-lg px-3 py-2 text-[12px] font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                >
                                    Xóa tất cả
                                </button>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {items.map((item) => {
                                    const lineTotal = item.price * item.qty

                                    return (
                                        <article
                                            key={item.lotId}
                                            className="grid gap-3 px-4 py-3.5 transition hover:bg-slate-50/70 md:grid-cols-[1fr_auto_auto_36px] md:items-center"
                                        >
                                            <div className="flex min-w-0 gap-3">
                                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="grid h-full w-full place-items-center text-slate-400">
                                                            <ShoppingBag
                                                                size={18}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-slate-950">
                                                        {item.name}
                                                    </h3>

                                                    <div className="mt-1 text-[12px] font-semibold text-rose-600">
                                                        {money(item.price)}
                                                        <span className="ml-1 font-normal text-slate-400">
                                                            / đơn vị
                                                        </span>
                                                    </div>

                                                    <div className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                                                        Lô: {item.lotId}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-3 md:justify-center">
                                                <span className="text-[12px] font-medium text-slate-500 md:hidden">
                                                    Số lượng
                                                </span>

                                                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQty(
                                                                item.lotId,
                                                                item.qty - 1,
                                                            )
                                                        }
                                                        className={qtyBtn}
                                                        aria-label="Giảm số lượng"
                                                    >
                                                        <Minus size={14} />
                                                    </button>

                                                    <div className="grid min-w-[38px] place-items-center text-[13px] font-bold text-slate-950">
                                                        {item.qty}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQty(
                                                                item.lotId,
                                                                item.qty + 1,
                                                            )
                                                        }
                                                        className={qtyBtn}
                                                        aria-label="Tăng số lượng"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:min-w-[98px] md:block md:text-right">
                                                <span className="text-[12px] font-medium text-slate-500 md:hidden">
                                                    Thành tiền
                                                </span>
                                                <div className="text-[14px] font-bold text-slate-950">
                                                    {money(lineTotal)}
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeItem(item.lotId)
                                                    }
                                                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                    aria-label="Xóa sản phẩm"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        </section>

                        <aside className="lg:sticky lg:top-[88px] lg:self-start">
                            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                            Tóm tắt
                                        </div>
                                        <h2 className="mt-1 text-lg font-bold text-slate-950">
                                            Giỏ hàng
                                        </h2>
                                    </div>

                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                                        <ShoppingBag size={17} />
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-slate-500">
                                            Tổng sản phẩm
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {totalQty}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-slate-500">
                                            Tạm tính hàng hóa
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {money(subtotal)}
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-500">
                                        Phí giao hàng, phí dịch vụ và mã giảm
                                        giá sẽ được tính ở bước checkout.
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCheckout}
                                    disabled={
                                        items.length === 0 || !isContextReady
                                    }
                                    className={cn(
                                        "mt-4 w-full gap-2",
                                        items.length > 0 && isContextReady
                                            ? primaryBtn
                                            : "inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-500",
                                    )}
                                >
                                    Tiếp tục đến checkout
                                    <ChevronRight size={14} />
                                </button>

                                {!isContextReady ? (
                                    <button
                                        type="button"
                                        onClick={() => navigate("/")}
                                        className={cn(
                                            secondaryBtn,
                                            "mt-3 w-full",
                                        )}
                                    >
                                        Chọn phương thức nhận hàng
                                    </button>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={() => navigate("/")}
                                    className={cn(textBtn, "mt-2 w-full")}
                                >
                                    Tiếp tục mua sắm
                                </button>
                            </section>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    )
}

export default CartPage

import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

import type { HomeProductView } from "@/types/home.type"
import { cn, formatCurrency, imageBg } from "@/utils/home"

type ProductCardProps = {
    product: HomeProductView
    cartQty?: number
    onAdd: (item: HomeProductView) => void
    onIncrease: (item: HomeProductView) => void
    onDecrease: (item: HomeProductView) => void
}

const primaryBtn =
    "rounded-lg bg-slate-900 text-white font-semibold transition hover:bg-slate-800 active:scale-[0.99]"

const qtyBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"

const getExpiryBadgeText = (daysToExpiry: number | null, hoursRemaining: number | null) => {
    if (typeof daysToExpiry !== "number" || daysToExpiry < 0) return ""

    if (daysToExpiry === 0) {
        if (typeof hoursRemaining === "number" && hoursRemaining > 0) {
            return "Trong ngày"
        }

        return "Trong ngày"
    }

    if (daysToExpiry === 1) return "sử dụng trong ngày"
    return `hạn dùng ${daysToExpiry} ngày`
}

const ProductCard = ({
    product,
    cartQty = 0,
    onAdd,
    onIncrease,
    onDecrease,
}: ProductCardProps) => {
    const isSoftUrgent =
        product.daysToExpiry === 0 ||
        (typeof product.daysToExpiry === "number" && product.daysToExpiry <= 3)

    const showOldPrice = product.originalPrice > 0 && product.originalPrice > product.price
    const hasPrice = product.price > 0

    const expiryBadgeText = getExpiryBadgeText(product.daysToExpiry, product.hoursRemaining)

    const stockQty = Math.max(0, Number(product.quantity ?? 0))
    const reachedStockLimit = stockQty > 0 && cartQty >= stockQty
    const isOutOfStock = stockQty <= 0

    return (
        <div className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(15,23,42,0.08)]">
            <div className={cn("relative h-[118px] w-full overflow-hidden", imageBg(product.imageVariant))}>
                {!!product.discountLabel && (
                    <div className="absolute left-2.5 top-2.5 z-20 rounded-full bg-rose-500 px-2 py-0.5 shadow-sm">
                        <span className="text-[9px] font-semibold text-white">{product.discountLabel}</span>
                    </div>
                )}

                {!!expiryBadgeText && (
                    <div
                        className={cn(
                            "absolute right-2.5 top-2.5 z-20 rounded-full px-2 py-0.5 text-[9px] font-semibold shadow-sm",
                            isSoftUrgent
                                ? "bg-amber-100 text-amber-800"
                                : "bg-white/90 text-slate-700 backdrop-blur"
                        )}
                    >
                        {expiryBadgeText}
                    </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center p-3">
                    <img
                        src={
                            product.imageUrl ||
                            `https://picsum.photos/seed/${encodeURIComponent(product.lotId)}/420/420`
                        }
                        alt={product.name}
                        className="h-[84px] w-[84px] rounded-[16px] object-cover shadow-sm ring-1 ring-black/5 transition duration-200 group-hover:scale-[1.03]"
                    />
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-3.5">
                <div className="min-h-[110px]">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 tracking-[-0.01em] text-slate-900">
                                {product.name}
                            </h3>

                            {!!product.brand && (
                                <p className="mt-1 line-clamp-1 text-[10px] font-medium text-slate-600">
                                    {product.brand}
                                </p>
                            )}

                            <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-slate-500">
                                {product.supermarketName}
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <div className="min-h-[13px] text-[9px] font-medium text-slate-400">
                                {showOldPrice ? (
                                    <span className="line-through">{formatCurrency(product.originalPrice)}</span>
                                ) : (
                                    <span>&nbsp;</span>
                                )}
                            </div>

                            {hasPrice ? (
                                <div className="mt-0.5 text-[15px] font-bold leading-4 tracking-[-0.02em] text-rose-600">
                                    {formatCurrency(product.price)}
                                </div>
                            ) : (
                                <div className="mt-0.5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                                    Giá cập nhật
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                            {product.category}
                        </span>

                        {product.isFreshFood && (
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-semibold text-orange-700">
                                Tươi sống
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] font-semibold text-rose-600"></div>

                        <div
                            className={cn(
                                "text-[10px] font-medium",
                                isOutOfStock ? "text-rose-500" : "text-slate-500"
                            )}
                        >
                            {isOutOfStock ? "Hết hàng" : `Còn ${stockQty} sản phẩm`}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-2.5">
                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                        <div className="min-w-0 flex-1">
                            {cartQty > 0 ? (
                                <div className="flex flex-col gap-1">
                                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                                        <ShoppingCart size={12} />
                                        Đã chọn {cartQty}
                                    </div>

                                    {reachedStockLimit && (
                                        <div className="text-[10px] font-medium text-amber-600">
                                            Đã đạt số lượng tối đa
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[10px] font-medium text-slate-400">
                                    {isOutOfStock ? "Tạm hết hàng" : "Chưa có trong giỏ"}
                                </div>
                            )}
                        </div>

                        {cartQty > 0 ? (
                            <div className="inline-flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => onDecrease(product)}
                                    className={qtyBtn}
                                    aria-label={cartQty === 1 ? "Xóa khỏi giỏ" : "Giảm số lượng"}
                                >
                                    {cartQty === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                                </button>

                                <div className="min-w-[24px] text-center text-[11px] font-bold text-slate-900">
                                    {cartQty}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onIncrease(product)}
                                    disabled={isOutOfStock || reachedStockLimit}
                                    className={cn(
                                        qtyBtn,
                                        (isOutOfStock || reachedStockLimit) &&
                                        "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300 hover:bg-slate-100 active:scale-100"
                                    )}
                                    aria-label="Tăng số lượng"
                                >
                                    <Plus size={13} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => onAdd(product)}
                                disabled={isOutOfStock}
                                className={cn(
                                    primaryBtn,
                                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[10px]",
                                    isOutOfStock &&
                                    "cursor-not-allowed bg-slate-300 text-white hover:bg-slate-300 active:scale-100"
                                )}
                                aria-label="Thêm vào giỏ"
                            >
                                <ShoppingCart size={12} />
                                {isOutOfStock ? "Hết hàng" : "Thêm"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductCard

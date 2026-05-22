import { Eye, MapPin, Package2, Store } from "lucide-react"

import type { HomeProductGroupView } from "@/types/home.type"
import { cn, formatCurrency, imageBg } from "@/utils/home"
import { resolveProductDisplayImageUrl } from "@/utils/productImage"

type ProductCardProps = {
    product: HomeProductGroupView
    onViewProduct: (item: HomeProductGroupView) => void
}

const primaryBtn =
    "rounded-lg bg-slate-900 text-white font-semibold transition hover:bg-slate-800 active:scale-[0.99]"

const getExpiryBadgeText = (
    daysToExpiry: number | null,
    hoursRemaining: number | null
) => {
    if (typeof daysToExpiry !== "number" || daysToExpiry < 0) return ""

    if (daysToExpiry === 0) {
        if (typeof hoursRemaining === "number" && hoursRemaining > 0) {
            return "Trong ngày"
        }

        return "Trong ngày"
    }

    if (daysToExpiry === 1) return "sử dụng trong ngày"
    return `hạn gần nhất ${daysToExpiry} ngày`
}

const ProductCard = ({ product, onViewProduct }: ProductCardProps) => {
    const isSoftUrgent =
        product.nearestDaysToExpiry === 0 ||
        (typeof product.nearestDaysToExpiry === "number" &&
            product.nearestDaysToExpiry <= 3)

    const showOldPrice =
        product.originalMinPrice > 0 && product.originalMinPrice > product.minPrice

    const hasPrice = product.minPrice > 0

    const expiryBadgeText = getExpiryBadgeText(
        product.nearestDaysToExpiry,
        product.nearestHoursRemaining
    )

    const priceText =
        product.minPrice === product.maxPrice
            ? formatCurrency(product.minPrice)
            : `Từ ${formatCurrency(product.minPrice)}`

    const unitText = product.unitNames.length
        ? product.unitNames.slice(0, 3).join(", ")
        : "Nhiều lựa chọn"

    const extraUnitCount = Math.max(product.unitNames.length - 3, 0)
    const supermarketText =
        product.supermarketCount > 1
            ? `${product.supermarketCount} siêu thị`
            : product.supermarketNames[0] || "Siêu thị gần bạn"

    const isOutOfStock = product.totalQuantity <= 0
    const displayImageUrl = resolveProductDisplayImageUrl(
        product.preSignedImageUrl,
        product.imageUrl,
    )

    return (
        <div className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(15,23,42,0.08)]">
            <button
                type="button"
                onClick={() => onViewProduct(product)}
                className={cn(
                    "relative h-[118px] w-full overflow-hidden",
                    imageBg(product.imageVariant)
                )}
                aria-label={`Xem lựa chọn cho ${product.name}`}
            >
                {!!product.discountLabel && (
                    <div className="absolute left-2.5 top-2.5 z-20 rounded-full bg-rose-500 px-2 py-0.5 shadow-sm">
                        <span className="text-[9px] font-semibold text-white">
                            {product.discountLabel}
                        </span>
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
                    {displayImageUrl ? (
                        <img
                            src={displayImageUrl}
                            alt={product.name}
                            className="h-[84px] w-[84px] rounded-[16px] object-cover shadow-sm ring-1 ring-black/5 transition duration-200 group-hover:scale-[1.03]"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-[84px] w-[84px] items-center justify-center rounded-[16px] bg-white/80 text-slate-400 shadow-sm ring-1 ring-black/5">
                            <Package2 size={28} />
                        </div>
                    )}
                </div>
            </button>

            <div className="flex min-h-0 flex-1 flex-col p-3.5">
                <div className="min-h-[128px]">
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
                                {product.category}
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <div className="min-h-[13px] text-[9px] font-medium text-slate-400">
                                {showOldPrice ? (
                                    <span className="line-through">
                                        {formatCurrency(product.originalMinPrice)}
                                    </span>
                                ) : (
                                    <span>&nbsp;</span>
                                )}
                            </div>

                            {hasPrice ? (
                                <div className="mt-0.5 text-[15px] font-bold leading-4 tracking-[-0.02em] text-rose-600">
                                    {priceText}
                                </div>
                            ) : (
                                <div className="mt-0.5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                                    Giá cập nhật
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-semibold text-sky-700">
                            <Store size={10} />
                            {supermarketText}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                            <Package2 size={10} />
                            {isOutOfStock ? "Hết hàng" : `Còn ${product.totalQuantity}`}
                        </span>

                        {product.isFreshFood && (
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-semibold text-orange-700">
                                Tươi sống
                            </span>
                        )}
                    </div>

                    <div className="mt-2 space-y-1">
                        <div className="line-clamp-1 text-[10px] font-medium text-slate-500">
                            Mua được: {unitText}
                            {extraUnitCount > 0 ? ` +${extraUnitCount}` : ""}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                            <MapPin size={11} />
                            <span>{product.timeLeft || "Hạn dùng đang cập nhật"}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-2.5">
                    <div className="border-t border-slate-100 pt-2.5">
                        <button
                            type="button"
                            onClick={() => onViewProduct(product)}
                            disabled={isOutOfStock}
                            className={cn(
                                primaryBtn,
                                "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-[11px]",
                                isOutOfStock &&
                                "cursor-not-allowed bg-slate-300 text-white hover:bg-slate-300 active:scale-100"
                            )}
                            aria-label={`Xem lựa chọn cho ${product.name}`}
                        >
                            <Eye size={13} />
                            {isOutOfStock ? "Tạm hết hàng" : "Xem lựa chọn"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductCard

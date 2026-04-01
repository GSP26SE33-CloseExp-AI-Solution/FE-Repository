import { Clock3 } from "lucide-react"

import { cn } from "@/utils/home"
import type { HomeProductView } from "@/types/home.type"
import ProductCard from "./ProductCard"

type HomeProductSectionProps = {
    loading: boolean
    error: string
    noMatchedSupermarket: boolean
    filteredProducts: HomeProductView[]
    allCategoryKey: string
    getCartQty: (lotId: string) => number
    onAddToCart: (item: HomeProductView) => void
    onIncreaseCart: (item: HomeProductView) => void
    onDecreaseCart: (item: HomeProductView) => void
    onOpenGate: () => void
    onResetCategory: (categoryValue: string) => void
}

const HomeProductSection = ({
    loading,
    error,
    noMatchedSupermarket,
    filteredProducts,
    allCategoryKey,
    getCartQty,
    onAddToCart,
    onIncreaseCart,
    onDecreaseCart,
    onOpenGate,
    onResetCategory,
}: HomeProductSectionProps) => {
    const shouldShowProductGrid = !noMatchedSupermarket && !loading && filteredProducts.length > 0
    const displayCount = noMatchedSupermarket ? 0 : filteredProducts.length

    return (
        <div className="min-w-0 flex-1">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mt-2 text-[21px] font-bold tracking-[-0.03em] text-slate-900">
                            Món ngon giá tốt gần bạn
                        </div>

                        <div className="mt-1 text-[13px] font-medium text-slate-500">
                            Chọn nhanh những sản phẩm phù hợp với khu vực và danh mục bạn quan tâm.
                        </div>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50/80 px-3 py-1.5">
                        <Clock3 size={14} className="text-sky-700" />
                        <span className="text-[11px] font-semibold text-sky-800">
                            {loading ? "Đang tải..." : `${displayCount} món đang hiển thị`}
                        </span>
                    </div>
                </div>

                {noMatchedSupermarket && (
                    <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800">
                        Khu vực bạn chọn hiện chưa có siêu thị phù hợp. Bạn có thể đổi khu vực để xem thêm ưu đãi.
                    </div>
                )}

                {error && !noMatchedSupermarket && (
                    <div className="mt-4 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-[252px] animate-pulse rounded-[22px] border border-slate-200 bg-slate-100"
                            />
                        ))}
                    </div>
                ) : shouldShowProductGrid ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        {filteredProducts.map((item) => (
                            <ProductCard
                                key={item.lotId}
                                product={item}
                                cartQty={getCartQty(item.lotId)}
                                onAdd={onAddToCart}
                                onIncrease={onIncreaseCart}
                                onDecrease={onDecreaseCart}
                            />
                        ))}
                    </div>
                ) : null}

                {!loading && (!filteredProducts.length || noMatchedSupermarket) && (
                    <div className="mt-5 rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
                        <div className="text-[17px] font-semibold tracking-[-0.01em] text-slate-900">
                            Chưa có món phù hợp để hiển thị
                        </div>
                        <p className="mt-2 text-[14px] font-medium leading-6 text-slate-500">
                            {noMatchedSupermarket
                                ? "Khu vực hiện tại chưa có siêu thị phù hợp. Bạn thử đổi khu vực để xem thêm lựa chọn nhé."
                                : "Hiện chưa có dữ liệu phù hợp với danh mục bạn đang chọn."}
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                noMatchedSupermarket ? onOpenGate() : onResetCategory(allCategoryKey)
                            }
                            className={cn(
                                "mt-4 inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 active:scale-[0.98]",
                                noMatchedSupermarket
                                    ? "bg-[linear-gradient(135deg,#0f766e_0%,#059669_100%)] text-white shadow-[0_10px_24px_rgba(5,150,105,0.22)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(5,150,105,0.28)]"
                                    : "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            {noMatchedSupermarket ? "Đổi khu vực" : "Xem tất cả"}
                        </button>
                    </div>
                )}

                {!noMatchedSupermarket && !!filteredProducts.length && (
                    <div className="mt-5 rounded-[20px] border border-sky-100 bg-sky-50/60 px-6 py-5 text-center">
                        <p className="text-[13px] font-medium leading-5 text-sky-800/80">
                            Bạn đã xem hết những ưu đãi hiện phù hợp với lựa chọn này.
                        </p>
                        <button
                            type="button"
                            onClick={onOpenGate}
                            className={cn(
                                "mt-4 inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-white px-4 py-2 text-[12px] font-semibold text-sky-700 transition hover:bg-sky-50",
                            )}
                        >
                            Chọn lại khu vực
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HomeProductSection

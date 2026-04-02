import { Clock3 } from "lucide-react"

import { cn } from "@/utils/home"
import type { HomeCategoryItem } from "@/types/home.type"

type SupermarketOption = {
    supermarketId: string
    name: string
    distanceKm?: number
    count: number
}

type VisibleCategories = {
    allCategory?: HomeCategoryItem
    nonEmptyCategories: HomeCategoryItem[]
    emptyCategories: HomeCategoryItem[]
    displayedCategories: HomeCategoryItem[]
}

type HomeSidebarProps = {
    filteredCount: number
    activeSupermarketId: string
    activeCategory: string
    supermarketSortBy: "distance" | "count"
    supermarketOptions: SupermarketOption[]
    visibleCategories: VisibleCategories
    allMarketKey: string
    allCategoryKey: string
    showEmptyCategories: boolean
    onChangeSupermarket: (supermarketId: string) => void
    onChangeCategory: (categoryValue: string) => void
    onChangeSupermarketSort: (value: "distance" | "count") => void
    onToggleEmptyCategories: () => void
}

const HomeSidebar = ({
    filteredCount,
    activeSupermarketId,
    activeCategory,
    supermarketSortBy,
    supermarketOptions,
    visibleCategories,
    allMarketKey,
    allCategoryKey,
    showEmptyCategories,
    onChangeSupermarket,
    onChangeCategory,
    onChangeSupermarketSort,
    onToggleEmptyCategories,
}: HomeSidebarProps) => {
    const activeMarketName =
        supermarketOptions.find((item) => item.supermarketId === activeSupermarketId)?.name ||
        "siêu thị đã chọn"

    const isSearchFiltered =
        activeCategory !== allCategoryKey || activeSupermarketId !== allMarketKey

    const sidebarTitle = isSearchFiltered ? "Kết quả đang lọc" : "Danh mục"

    const sidebarSubtext = isSearchFiltered
        ? "Bạn đang xem danh sách đã được tinh chỉnh theo tiêu chí hiện tại."
        : "Khám phá các nhóm sản phẩm và siêu thị đang khả dụng."

    const supermarketDescription =
        activeSupermarketId === allMarketKey
            ? isSearchFiltered
                ? "Đang giữ phạm vi tất cả siêu thị phù hợp với bộ lọc hiện tại"
                : "Đang xem tất cả nơi bán phù hợp"
            : `Đang lọc theo ${activeMarketName}`

    const categoryDescription =
        activeCategory === allCategoryKey
            ? isSearchFiltered
                ? "Danh sách đang giữ toàn bộ nhóm phù hợp sau khi lọc"
                : "Sắp theo số lượng lô giảm dần"
            : "Danh sách đang ưu tiên nhóm sản phẩm bạn đã chọn"

    return (
        <aside className="w-full xl:w-[292px] xl:shrink-0">
            <div className="sticky top-4 overflow-hidden rounded-[26px] border border-emerald-200 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)]">
                <div className="border-b border-emerald-800/10 bg-[linear-gradient(135deg,#065f46_0%,#047857_55%,#059669_100%)] px-4 py-4">
                    <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1 pr-1">
                            <div className="truncate text-[16px] font-bold tracking-[-0.02em] text-white">
                                {sidebarTitle}
                            </div>
                            <div className="mt-1 max-w-[170px] text-[11px] leading-4 text-emerald-50/90">
                                {sidebarSubtext}
                            </div>
                        </div>

                        <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 backdrop-blur-sm">
                            <Clock3 size={13} className="text-emerald-50" />
                            <span className="whitespace-nowrap text-[11px] font-semibold text-white">
                                {filteredCount} món hàng
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-3.5">
                    <div className="rounded-[20px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3.5">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                                    Siêu thị
                                </div>
                                <div className="mt-1 text-[12px] leading-5 text-slate-600">
                                    {supermarketDescription}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 rounded-full bg-sky-50 p-1">
                                <button
                                    type="button"
                                    onClick={() => onChangeSupermarketSort("distance")}
                                    className={cn(
                                        "rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                                        supermarketSortBy === "distance"
                                            ? "bg-white text-sky-700 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    Gần
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onChangeSupermarketSort("count")}
                                    className={cn(
                                        "rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                                        supermarketSortBy === "count"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    Nhiều
                                </button>
                            </div>
                        </div>

                        <div className="mt-3 space-y-1.5">
                            {supermarketOptions.map((item) => {
                                const active = activeSupermarketId === item.supermarketId
                                const isAll = item.supermarketId === allMarketKey

                                return (
                                    <button
                                        key={item.supermarketId}
                                        type="button"
                                        onClick={() => onChangeSupermarket(item.supermarketId)}
                                        className={cn(
                                            "w-full rounded-[18px] border px-3 py-2.5 text-left transition",
                                            active
                                                ? "border-sky-500 bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]"
                                                : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/40"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="line-clamp-1 text-[12px] font-semibold">
                                                    {item.name}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "mt-0.5 text-[10px]",
                                                        active ? "text-white/80" : "text-slate-400"
                                                    )}
                                                >
                                                    {isAll
                                                        ? "Hiển thị tất cả siêu thị phù hợp"
                                                        : typeof item.distanceKm === "number"
                                                            ? `${item.distanceKm.toFixed(1)} km`
                                                            : "Khoảng cách đang cập nhật"}
                                                </div>
                                            </div>

                                            <div
                                                className={cn(
                                                    "shrink-0 rounded-[15px] px-2.5 py-1.5 text-center",
                                                    active
                                                        ? "bg-white/12 text-white"
                                                        : item.count === 0
                                                            ? "bg-slate-100 text-slate-400"
                                                            : "bg-sky-50 text-sky-700"
                                                )}
                                            >
                                                <div className="text-[13px] font-bold leading-none">
                                                    {item.count}
                                                </div>
                                                <div className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.08em]">
                                                    lô
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="mt-3.5 rounded-[20px] border border-slate-200 bg-white p-3.5">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                                    Nhóm sản phẩm
                                </div>
                                <div className="mt-1 text-[12px] leading-5 text-slate-600">
                                    {categoryDescription}
                                </div>
                            </div>

                            <div className="rounded-full bg-sky-50 px-2 py-1 text-[8px] font-semibold text-sky-700">
                                {visibleCategories.nonEmptyCategories.length} nhóm có hàng
                            </div>
                        </div>

                        <div className="mt-3 space-y-1.5">
                            {visibleCategories.allCategory ? (
                                (() => {
                                    const allCategory = visibleCategories.allCategory
                                    const active = activeCategory === allCategory.value

                                    return (
                                        <button
                                            type="button"
                                            onClick={() => onChangeCategory(allCategory.value)}
                                            className={cn(
                                                "w-full rounded-[18px] border px-3 py-2.5 text-left transition",
                                                active
                                                    ? "border-sky-500 bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]"
                                                    : "border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_100%)] text-slate-700 hover:border-sky-200"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="line-clamp-1 text-[12px] font-semibold">
                                                        {allCategory.label}
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            "mt-0.5 text-[10px]",
                                                            active ? "text-sky-50/90" : "text-slate-400"
                                                        )}
                                                    >
                                                        {isSearchFiltered
                                                            ? "Xóa ưu tiên nhóm để xem toàn bộ kết quả phù hợp"
                                                            : "Hiển thị toàn bộ lô hiện phù hợp"}
                                                    </div>
                                                </div>

                                                <div
                                                    className={cn(
                                                        "shrink-0 rounded-[15px] px-2.5 py-1.5 text-center",
                                                        active
                                                            ? "bg-white/12 text-white"
                                                            : "bg-white text-sky-700 ring-1 ring-sky-100"
                                                    )}
                                                >
                                                    <div className="text-[13px] font-bold leading-none">
                                                        {allCategory.count}
                                                    </div>
                                                    <div className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.08em]">
                                                        lô
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })()
                            ) : null}

                            {visibleCategories.displayedCategories.map((item) => {
                                const active = activeCategory === item.value

                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => onChangeCategory(item.value)}
                                        className={cn(
                                            "w-full rounded-[18px] border px-3 py-2.5 text-left transition",
                                            active
                                                ? "border-sky-500 bg-[linear-gradient(135deg,#0284c7_0%,#2563eb_100%)] text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]"
                                                : item.count > 0
                                                    ? "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/40"
                                                    : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="line-clamp-1 text-[12px] font-semibold">
                                                    {item.label}
                                                </div>
                                                {active ? (
                                                    <div className="mt-0.5 text-[10px] text-white/85">
                                                        Đang là nhóm sản phẩm được ưu tiên hiển thị
                                                    </div>
                                                ) : item.count > 0 ? (
                                                    <div className="mt-0.5 text-[10px] text-slate-400">
                                                        Hiển thị các món hiện phù hợp trong nhóm này
                                                    </div>
                                                ) : (
                                                    <div className="mt-0.5 text-[10px] text-slate-400">
                                                        Hiện chưa có món phù hợp trong nhóm này
                                                    </div>
                                                )}
                                            </div>

                                            <div
                                                className={cn(
                                                    "shrink-0 rounded-[15px] px-2.5 py-1.5 text-center",
                                                    active
                                                        ? "bg-white/12 text-white"
                                                        : item.count === 0
                                                            ? "bg-white text-slate-400 ring-1 ring-slate-200"
                                                            : "bg-sky-50 text-sky-700"
                                                )}
                                            >
                                                <div className="text-[13px] font-bold leading-none">
                                                    {item.count}
                                                </div>
                                                <div className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.08em]">
                                                    lô
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {!!visibleCategories.emptyCategories.length && (
                            <div className="mt-3 border-t border-slate-100 pt-3">
                                <button
                                    type="button"
                                    onClick={onToggleEmptyCategories}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
                                >
                                    {showEmptyCategories
                                        ? "Ẩn bớt danh mục trống"
                                        : `Hiện thêm ${visibleCategories.emptyCategories.length} danh mục trống`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default HomeSidebar

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCcw, Search } from "lucide-react"
import toast from "react-hot-toast"

import { categoryService } from "@/services/category.service"
import type {
    CategoryItem,
    CategoryProductImpact,
    CategoryProductListItem,
} from "@/types/category.type"
import { mapProductStateLabel } from "@/mappers/product-ai.mapper"
import { formatMoney, formatNumber } from "@/pages/Admin/adminSettings/Shared"

const buildCategoryLabel = (category: CategoryItem) => {
    const parentName = category.parentName?.trim()
    return parentName ? `${parentName} → ${category.name}` : category.name
}

const compareText = (left?: string | null, right?: string | null) =>
    (left ?? "").localeCompare(right ?? "", "vi", {
        sensitivity: "base",
        numeric: true,
    })

const getStatusBadgeClass = (status: string) => {
    const key = status.trim().toLowerCase()
    if (key === "published") return "bg-emerald-100 text-emerald-800"
    if (key === "draft") return "bg-slate-100 text-slate-700"
    if (key === "expired" || key === "soldout") return "bg-amber-100 text-amber-800"
    return "bg-sky-100 text-sky-800"
}

const MarketingCategoryProductsPage = () => {
    const [categories, setCategories] = useState<CategoryItem[]>([])
    const [categorySearch, setCategorySearch] = useState("")
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
        null,
    )

    const [impact, setImpact] = useState<CategoryProductImpact | null>(null)
    const [products, setProducts] = useState<CategoryProductListItem[]>([])
    const [totalProducts, setTotalProducts] = useState(0)
    const [page, setPage] = useState(1)
    const pageSize = 20

    const [productSearch, setProductSearch] = useState("")
    const [publishedOnly, setPublishedOnly] = useState(false)

    const [loadingCategories, setLoadingCategories] = useState(true)
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const loadCategories = useCallback(async () => {
        try {
            const rows = await categoryService.getCategories(true)
            setCategories(rows.filter((item) => item.isActive))
        } catch {
            toast.error("Không tải được danh mục")
        } finally {
            setLoadingCategories(false)
        }
    }, [])

    const loadCategoryData = useCallback(
        async (categoryId: string, pageNumber: number, search: string) => {
            setLoadingProducts(true)
            try {
                const [impactData, productData] = await Promise.all([
                    categoryService.getProductImpact(categoryId),
                    categoryService.getProductsByCategory(categoryId, {
                        pageNumber,
                        pageSize,
                        search: search || undefined,
                        publishedOnly,
                    }),
                ])
                setImpact(impactData)
                setProducts(productData.items ?? [])
                setTotalProducts(productData.totalResult ?? 0)
            } catch {
                toast.error("Không tải được sản phẩm theo danh mục")
                setImpact(null)
                setProducts([])
                setTotalProducts(0)
            } finally {
                setLoadingProducts(false)
                setRefreshing(false)
            }
        },
        [publishedOnly],
    )

    useEffect(() => {
        void loadCategories()
    }, [loadCategories])

    useEffect(() => {
        if (!selectedCategoryId) {
            setImpact(null)
            setProducts([])
            setTotalProducts(0)
            return
        }
        void loadCategoryData(selectedCategoryId, page, productSearch)
    }, [selectedCategoryId, page, productSearch, publishedOnly, loadCategoryData])

    const filteredCategories = useMemo(() => {
        const keyword = categorySearch.trim().toLowerCase()
        const sorted = [...categories].sort((a, b) => {
            const parentCompare = compareText(a.parentName || "", b.parentName || "")
            if (parentCompare !== 0) return parentCompare
            return compareText(a.name, b.name)
        })
        if (!keyword) return sorted
        return sorted.filter((item) =>
            buildCategoryLabel(item).toLowerCase().includes(keyword),
        )
    }, [categories, categorySearch])

    const selectedCategory = categories.find(
        (item) => item.categoryId === selectedCategoryId,
    )

    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize))

    const handleRefresh = () => {
        if (!selectedCategoryId) {
            setRefreshing(true)
            void loadCategories().finally(() => setRefreshing(false))
            return
        }
        setRefreshing(true)
        void loadCategoryData(selectedCategoryId, page, productSearch)
    }

    const handleSelectCategory = (categoryId: string) => {
        setSelectedCategoryId(categoryId)
        setPage(1)
        setProductSearch("")
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Sản phẩm theo danh mục
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Xem sản phẩm trong phạm vi danh mục (gồm danh mục con) trước
                        khi tạo khuyến mãi.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing || loadingCategories}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                    {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCcw className="h-4 w-4" />
                    )}
                    Làm mới
                </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">Danh mục</p>
                    <div className="relative mt-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            placeholder="Tìm danh mục..."
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm"
                        />
                    </div>

                    <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto">
                        {loadingCategories ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-500">
                                Không có danh mục
                            </p>
                        ) : (
                            filteredCategories.map((category) => (
                                <button
                                    key={category.categoryId}
                                    type="button"
                                    onClick={() =>
                                        handleSelectCategory(category.categoryId)
                                    }
                                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                                        selectedCategoryId === category.categoryId
                                            ? "border-rose-300 bg-rose-50"
                                            : "border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="text-sm font-semibold text-slate-900">
                                        {buildCategoryLabel(category)}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    {!selectedCategory ? (
                        <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-slate-500">
                            <p className="text-sm">
                                Chọn danh mục bên trái để xem sản phẩm
                            </p>
                        </div>
                    ) : loadingProducts && !refreshing ? (
                        <div className="flex min-h-[320px] items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin text-rose-600" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {selectedCategory
                                        ? buildCategoryLabel(selectedCategory)
                                        : "—"}
                                </h2>
                                {impact ? (
                                    <p className="mt-1 text-sm text-slate-600">
                                        {formatNumber(impact.totalProducts)} sản phẩm
                                        trong phạm vi
                                        {impact.subcategoryCount > 0
                                            ? ` (${impact.subcategoryCount} danh mục con)`
                                            : ""}
                                        , {formatNumber(impact.publishedProducts)}{" "}
                                        đang đăng bán
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative min-w-0 flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={productSearch}
                                        onChange={(e) => {
                                            setProductSearch(e.target.value)
                                            setPage(1)
                                        }}
                                        placeholder="Tìm trong danh mục..."
                                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm"
                                    />
                                </div>
                                <label className="inline-flex shrink-0 items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={publishedOnly}
                                        onChange={(e) => {
                                            setPublishedOnly(e.target.checked)
                                            setPage(1)
                                        }}
                                        className="rounded border-slate-300"
                                    />
                                    Chỉ đang đăng bán
                                </label>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-left text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">
                                                Sản phẩm
                                            </th>
                                            <th className="px-4 py-3 font-semibold">
                                                Danh mục SP
                                            </th>
                                            <th className="px-4 py-3 font-semibold">
                                                Giá
                                            </th>
                                            <th className="px-4 py-3 font-semibold">
                                                Trạng thái
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr
                                                key={product.productId}
                                                className="border-t border-slate-100"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-slate-900">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {product.brand || "—"}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {product.categoryName || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-slate-800">
                                                    {product.finalPrice > 0
                                                        ? formatMoney(
                                                              product.finalPrice,
                                                          )
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                                                            product.status,
                                                        )}`}
                                                    >
                                                        {mapProductStateLabel(
                                                            product.status,
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {products.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-4 py-12 text-center text-slate-500"
                                                >
                                                    Không có sản phẩm phù hợp bộ lọc.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalProducts > pageSize ? (
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs text-slate-500">
                                        Trang {page}/{totalPages} —{" "}
                                        {formatNumber(totalProducts)} sản phẩm
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={page <= 1}
                                            onClick={() => setPage((p) => p - 1)}
                                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
                                        >
                                            Trước
                                        </button>
                                        <button
                                            type="button"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage((p) => p + 1)}
                                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MarketingCategoryProductsPage

import React, { useEffect, useState } from "react"
import { Search, Loader2, Box, Eye } from "lucide-react"
import toast from "react-hot-toast"
import { productService } from "@/services/product.service"
import type { ProductResponseDto } from "@/types/product.type"
import { PRODUCT_STATUS_OPTIONS, PRODUCT_TYPE_OPTIONS } from "@/types/product.type"
import { formatUnitDisplay } from "@/utils/unitMeasure"
import { resolveProductImageFromDto } from "@/utils/productImage"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

const getProductStatusLabel = (status?: number | null) => {
    if (typeof status !== "number") return "—"
    return (
        PRODUCT_STATUS_OPTIONS.find((item) => item.value === status)?.label ??
        String(status)
    )
}

const getProductStatusColor = (status?: number | null) => {
    if (status === 0) return "bg-slate-100 text-slate-700 border-slate-200" // Nháp
    if (status === 1) return "bg-blue-100 text-blue-700 border-blue-200" // Đã xác minh
    if (status === 2) return "bg-violet-100 text-violet-700 border-violet-200" // Đã định giá
    if (status === 3) return "bg-emerald-100 text-emerald-700 border-emerald-200" // Đang bán
    if (status === 4) return "bg-rose-100 text-rose-700 border-rose-200" // Hết hạn
    if (status === 5) return "bg-amber-100 text-amber-700 border-amber-200" // Hết hàng
    if (status === 6) return "bg-slate-200 text-slate-600 border-slate-300" // Đã ẩn
    if (status === 7) return "bg-red-100 text-red-700 border-red-200" // Đã xóa
    return "bg-slate-100 text-slate-700 border-slate-200"
}

const isProductDetailDisabled = (status?: number | null) =>
    status === 6 || status === 7

const getMerchandiseTypeLabel = (type?: number | null) => {
    if (typeof type !== "number") return "—"
    return (
        PRODUCT_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? "—"
    )
}

const formatPrice = (price?: number | null) => {
    if (typeof price !== "number" || Number.isNaN(price)) return "—"
    return `${price.toLocaleString("vi-VN")} đ`
}

type ProductsTabProps = {
    supermarketId: string
    onViewDetail: (productId: string) => void
}

const ProductsTab: React.FC<ProductsTabProps> = ({ supermarketId, onViewDetail }) => {
    const [products, setProducts] = useState<ProductResponseDto[]>([])
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState("")

    // Pagination
    const [page, setPage] = useState(1)
    const pageSize = 10
    const [serverTotal, setServerTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    const loadProducts = async () => {
        if (!supermarketId) return

        setLoading(true)
        try {
            const data = await productService.getMySupermarketProducts({
                pageNumber: page,
                pageSize,
                searchTerm: keyword.trim() || undefined,
            })
            setProducts(data.items || [])
            setServerTotal(data.totalResult ?? data.items?.length ?? 0)
            setTotalPages(
                Math.max(
                    1,
                    Math.ceil((data.totalResult ?? data.items?.length ?? 0) / pageSize),
                ),
            )
        } catch (error) {
            toast.error("Không tải được danh sách sản phẩm")
            setProducts([])
            setServerTotal(0)
            setTotalPages(1)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadProducts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, keyword, supermarketId])

    useEffect(() => {
        setPage(1)
    }, [keyword])

    return (
        <div className="space-y-4">
            <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex max-w-md items-center overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50">
                    <div className="flex items-center gap-2 border-r border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600">
                        <Search className="h-4 w-4 text-emerald-600" />
                        Tìm kiếm
                    </div>
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Nhập tên sản phẩm hoặc mã vạch..."
                        className="h-full w-full px-3.5 py-3 text-sm text-slate-700 outline-none"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                            Danh sách sản phẩm
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {loading
                                ? "Đang tải dữ liệu..."
                                : `Hiển thị ${products.length} trên tổng ${serverTotal} sản phẩm`}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                        <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                        Đang tải danh sách sản phẩm...
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex h-[300px] flex-col items-center justify-center px-6 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                            <Box className="h-7 w-7 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800">
                            Chưa có sản phẩm phù hợp
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                            Bạn thử đổi từ khóa tìm kiếm để xem thêm sản phẩm.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[1020px]">
                            <div className="grid grid-cols-[72px_minmax(180px,1fr)_100px_100px_120px_100px_120px_100px_48px] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-600">
                                <div>Ảnh</div>
                                <div>Sản phẩm / Mã vạch</div>
                                <div>Thương hiệu</div>
                                <div>Danh mục</div>
                                <div>Đơn vị chuẩn</div>
                                <div>Loại hàng</div>
                                <div>Trạng thái</div>
                                <div className="text-right">Giá cơ sở</div>
                                <div className="text-center">Xem</div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {products.map((product) => (
                                    <div
                                        key={product.productId}
                                        className="grid grid-cols-[72px_minmax(180px,1fr)_100px_100px_120px_100px_120px_100px_48px] items-center gap-2 px-4 py-3 text-[12px] text-slate-700 transition hover:bg-emerald-50/30"
                                    >
                                        <div>
                                            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                                <img
                                                    src={
                                                        resolveProductImageFromDto(
                                                            product.productImages?.[0],
                                                            product.mainImageUrl,
                                                        ) || "/placeholder.png"
                                                    }
                                                    alt={product.name || "sản phẩm"}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        <div className="min-w-0 pr-2">
                                            <div className="truncate font-semibold text-slate-900">
                                                {product.name || "—"}
                                            </div>
                                            <div className="mt-0.5 truncate text-[10px] text-slate-400">
                                                {product.barcode || product.sku || "—"}
                                            </div>
                                        </div>

                                        <div className="truncate text-slate-600">
                                            {product.brand || "—"}
                                        </div>

                                        <div className="truncate text-slate-600">
                                            {product.category || "—"}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="truncate font-medium text-slate-800">
                                                {formatUnitDisplay(
                                                    product.unitName,
                                                    product.unitSymbol,
                                                )}
                                            </div>
                                            <div className="mt-0.5 truncate text-[10px] text-slate-400">
                                                {product.unitType || "—"}
                                            </div>
                                        </div>

                                        <div className="truncate text-slate-600">
                                            {getMerchandiseTypeLabel(product.type)}
                                        </div>

                                        <div>
                                            <span
                                                className={cn(
                                                    "inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                                    getProductStatusColor(product.status),
                                                )}
                                            >
                                                {getProductStatusLabel(product.status)}
                                            </span>
                                        </div>

                                        <div className="text-right font-semibold text-emerald-700">
                                            {formatPrice(product.finalPrice || product.suggestedPrice || product.originalPrice)}
                                        </div>

                                        <div className="flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => onViewDetail(product.productId)}
                                                disabled={isProductDetailDisabled(product.status)}
                                                className={cn(
                                                    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition",
                                                    isProductDetailDisabled(product.status)
                                                        ? "cursor-not-allowed opacity-40"
                                                        : "hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700",
                                                )}
                                                title={
                                                    isProductDetailDisabled(product.status)
                                                        ? product.status === 7
                                                            ? "Sản phẩm đã xóa — không thể xem chi tiết"
                                                            : "Sản phẩm đã ẩn — không thể xem chi tiết"
                                                        : "Xem chi tiết"
                                                }
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                        <div className="text-sm text-slate-500">
                            Trang {page} / {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProductsTab

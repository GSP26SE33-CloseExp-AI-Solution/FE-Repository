import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    AlertCircle,
    Box,
    CheckCircle2,
    Info,
    Loader2,
    PackagePlus,
    RefreshCcw,
    Scale,
    Search,
    Tag,
} from "lucide-react"
import toast from "react-hot-toast"

import { productService } from "@/services/product.service"
import { productLotService } from "@/services/product-lot.service"
import { unitService } from "@/services/unit.service"
import type { ProductResponseDto } from "@/types/product.type"
import type { ProductLotItem } from "@/types/product-lot.type"
import type { ProductPurchaseUnit } from "@/types/purchase-unit.type"
import type { UnitItem } from "@/types/unit.type"
import {
    formatConversionRateHintWithBase,
    formatUnitDisplay,
} from "@/utils/unitMeasure"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

const normalizeLotStatus = (status?: string | null) => {
    const value = String(status ?? "").trim().toLowerCase()
    if (value === "3" || value === "published") return "PUBLISHED"
    if (value === "2" || value === "priced") return "PRICED"
    if (value === "1" || value === "verified") return "VERIFIED"
    if (value === "0" || value === "draft") return "DRAFT"
    return value.toUpperCase() || "UNKNOWN"
}

const lotStatusLabel: Record<string, string> = {
    PUBLISHED: "Đang bán",
    PRICED: "Đã định giá",
    VERIFIED: "Đã xác minh",
    DRAFT: "Nháp",
}

const formatUnitLabel = (name?: string | null, symbol?: string | null) =>
    formatUnitDisplay(name, symbol, "—")

type PurchaseUnitsLocationState = {
    productId?: string
}

const SupermarketPurchaseUnitsPage = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const [products, setProducts] = useState<ProductResponseDto[]>([])
    const [productsLoading, setProductsLoading] = useState(true)
    const [productSearch, setProductSearch] = useState("")
    const [productPage, setProductPage] = useState(1)
    const [productTotal, setProductTotal] = useState(0)
    const pageSize = 20

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [purchaseUnits, setPurchaseUnits] = useState<ProductPurchaseUnit[]>([])
    const [productLots, setProductLots] = useState<ProductLotItem[]>([])
    const [detailLoading, setDetailLoading] = useState(false)

    const [catalogUnits, setCatalogUnits] = useState<UnitItem[]>([])
    const [catalogLoading, setCatalogLoading] = useState(true)

    const selectedProduct = useMemo(
        () => products.find((item) => item.productId === selectedProductId) ?? null,
        [products, selectedProductId],
    )

    const filteredProducts = useMemo(() => {
        const keyword = productSearch.trim().toLowerCase()
        if (!keyword) return products

        return products.filter((item) => {
            const haystack = [item.name, item.brand, item.category, item.barcode]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            return haystack.includes(keyword)
        })
    }, [productSearch, products])

    const lotsByUnitId = useMemo(() => {
        const map = new Map<string, ProductLotItem[]>()
        for (const lot of productLots) {
            if (!lot.unitId) continue
            const list = map.get(lot.unitId) ?? []
            list.push(lot)
            map.set(lot.unitId, list)
        }
        return map
    }, [productLots])

    const summary = useMemo(() => {
        const publishedLotUnits = purchaseUnits.filter((u) => u.hasPublishedLot).length
        const onlyDefault =
            purchaseUnits.length === 1 && purchaseUnits[0]?.isProductDefault
        return {
            totalUnits: purchaseUnits.length,
            publishedLotUnits,
            onlyDefault,
            totalLots: productLots.length,
            publishedLots: productLots.filter(
                (lot) => normalizeLotStatus(lot.status) === "PUBLISHED",
            ).length,
        }
    }, [purchaseUnits, productLots])

    const loadProducts = useCallback(async () => {
        setProductsLoading(true)
        try {
            const result = await productService.getMySupermarketProducts({
                searchTerm: productSearch.trim() || undefined,
                pageNumber: productPage,
                pageSize,
            })
            setProducts(result.items ?? [])
            setProductTotal(result.totalResult ?? 0)

            if (
                selectedProductId &&
                !(result.items ?? []).some((item) => item.productId === selectedProductId)
            ) {
                setSelectedProductId(null)
            }
        } catch (error) {
            toast.error("Không tải được danh sách sản phẩm")
        } finally {
            setProductsLoading(false)
        }
    }, [productPage, productSearch, selectedProductId])

    const loadCatalogUnits = useCallback(async () => {
        setCatalogLoading(true)
        try {
            const units = await unitService.getUnits()
            setCatalogUnits(Array.isArray(units) ? units : [])
        } catch {
        } finally {
            setCatalogLoading(false)
        }
    }, [])

    const loadProductDetail = useCallback(async (productId: string) => {
        setDetailLoading(true)
        setPurchaseUnits([])
        setProductLots([])

        try {
            const [units, lotsResult] = await Promise.all([
                productService.getPurchaseUnits(productId),
                productLotService.getMySupermarketLots({
                    pageNumber: 1,
                    pageSize: 200,
                }),
            ])

            setPurchaseUnits(units)
            setProductLots(
                (lotsResult.items ?? []).filter((lot) => lot.productId === productId),
            )
        } catch (error) {
            toast.error("Không tải được đơn vị mua của sản phẩm")
        } finally {
            setDetailLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadProducts()
    }, [loadProducts])

    useEffect(() => {
        const state = location.state as PurchaseUnitsLocationState | null
        const productId = state?.productId?.trim()
        if (!productId) return

        setSelectedProductId(productId)
        navigate(location.pathname, { replace: true, state: null })
    }, [location.pathname, location.state, navigate])

    useEffect(() => {
        void loadCatalogUnits()
    }, [loadCatalogUnits])

    useEffect(() => {
        if (!selectedProductId) return
        void loadProductDetail(selectedProductId)
    }, [selectedProductId, loadProductDetail])

    const productTotalPages = Math.max(1, Math.ceil(productTotal / pageSize))

    const handleSelectProduct = (productId: string) => {
        setSelectedProductId(productId)
    }

    const handleRefreshDetail = () => {
        if (!selectedProductId) return
        void loadProductDetail(selectedProductId)
    }

    return (
        <div className="space-y-6 p-1 sm:p-0">
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                            <Scale size={14} />
                            Đơn vị mua cho khách
                        </div>
                        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                            Quản lý đơn vị bán
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            Khách chỉ chọn được các đơn vị xuất hiện từ{" "}
                            <strong>đơn vị chuẩn sản phẩm</strong> và{" "}
                            <strong>đơn vị của lô đang bán</strong>. Để thêm đơn vị
                            mới cho khách, hãy tạo hoặc xuất bản lô với đơn vị tương
                            ứng — không cần cấu hình riêng từng sản phẩm.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            void loadProducts()
                            if (selectedProductId) handleRefreshDetail()
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <RefreshCcw size={16} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(300px,360px)_1fr]">
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-4">
                        <h2 className="text-base font-semibold text-slate-900">
                            Sản phẩm siêu thị
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Chọn sản phẩm để xem đơn vị khách được mua
                        </p>

                        <div className="relative mt-3">
                            <Search
                                size={16}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={productSearch}
                                onChange={(event) => {
                                    setProductSearch(event.target.value)
                                    setProductPage(1)
                                }}
                                placeholder="Tìm theo tên, thương hiệu, mã vạch..."
                                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-500"
                            />
                        </div>
                    </div>

                    <div className="max-h-[520px] overflow-y-auto p-2">
                        {productsLoading ? (
                            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                                <Loader2 size={18} className="animate-spin" />
                                Đang tải...
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="px-3 py-10 text-center text-sm text-slate-500">
                                Không có sản phẩm phù hợp.
                            </div>
                        ) : (
                            filteredProducts.map((product) => {
                                const active = product.productId === selectedProductId
                                return (
                                    <button
                                        key={product.productId}
                                        type="button"
                                        onClick={() =>
                                            handleSelectProduct(product.productId)
                                        }
                                        className={cn(
                                            "mb-1 w-full rounded-xl border px-3 py-3 text-left transition",
                                            active
                                                ? "border-sky-300 bg-sky-50"
                                                : "border-transparent hover:border-slate-200 hover:bg-slate-50",
                                        )}
                                    >
                                        <div className="truncate text-sm font-semibold text-slate-900">
                                            {product.name}
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                                            <span>{product.brand || "—"}</span>
                                            <span>·</span>
                                            <span>
                                                {formatUnitLabel(
                                                    product.unitName,
                                                    product.unitSymbol,
                                                )}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {productTotalPages > 1 ? (
                        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                            <span>
                                Trang {productPage}/{productTotalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={productPage <= 1}
                                    onClick={() =>
                                        setProductPage((page) => Math.max(1, page - 1))
                                    }
                                    className="rounded-lg border px-2 py-1 disabled:opacity-40"
                                >
                                    Trước
                                </button>
                                <button
                                    type="button"
                                    disabled={productPage >= productTotalPages}
                                    onClick={() =>
                                        setProductPage((page) =>
                                            Math.min(productTotalPages, page + 1),
                                        )
                                    }
                                    className="rounded-lg border px-2 py-1 disabled:opacity-40"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    ) : null}
                </section>

                <section className="space-y-4">
                    {!selectedProduct ? (
                        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                            <Box className="text-slate-300" size={40} />
                            <p className="mt-4 text-sm font-medium text-slate-700">
                                Chọn một sản phẩm để xem đơn vị mua
                            </p>
                            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                                Bạn sẽ thấy danh sách đơn vị khách có thể chọn khi đặt
                                hàng và các lô đang dùng từng đơn vị.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-950">
                                            {selectedProduct.name}
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Đơn vị chuẩn:{" "}
                                            <span className="font-medium text-slate-800">
                                                {formatUnitLabel(
                                                    selectedProduct.unitName,
                                                    selectedProduct.unitSymbol,
                                                )}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate("/supermarketStaff/products")
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            <Box size={14} />
                                            Quản lý lô
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    "/supermarketStaff/products/workflow",
                                                    {
                                                        state: {
                                                            productId:
                                                                selectedProduct.productId,
                                                        },
                                                    },
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                                        >
                                            <PackagePlus size={14} />
                                            Tạo lô mới
                                        </button>
                                    </div>
                                </div>

                                {detailLoading ? (
                                    <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Đang tải đơn vị mua...
                                    </div>
                                ) : (
                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-xl bg-slate-50 px-4 py-3">
                                            <p className="text-xs text-slate-500">
                                                Đơn vị khách chọn được
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-slate-900">
                                                {summary.totalUnits}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 px-4 py-3">
                                            <p className="text-xs text-slate-500">
                                                Có lô đang bán
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-slate-900">
                                                {summary.publishedLotUnits}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 px-4 py-3">
                                            <p className="text-xs text-slate-500">
                                                Lô của sản phẩm
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-slate-900">
                                                {summary.publishedLots}/
                                                {summary.totalLots} đang bán
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {summary.onlyDefault && !detailLoading ? (
                                    <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                        <AlertCircle
                                            size={18}
                                            className="mt-0.5 shrink-0"
                                        />
                                        <p>
                                            Khách hiện chỉ mua được{" "}
                                            <strong>một đơn vị</strong>. Tạo thêm
                                            lô với đơn vị khác (ví dụ Hộp, Gói) để
                                            mở thêm lựa chọn.
                                        </p>
                                    </div>
                                ) : null}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h3 className="text-base font-semibold text-slate-900">
                                        Đơn vị mua khả dụng
                                    </h3>
                                </div>

                                {detailLoading ? (
                                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                        Đang tải...
                                    </div>
                                ) : purchaseUnits.length === 0 ? (
                                    <div className="px-5 py-12 text-center text-sm text-slate-500">
                                        Chưa có đơn vị mua — cần lô đang bán hoặc đơn
                                        vị chuẩn hợp lệ.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {purchaseUnits.map((unit) => {
                                            const lots =
                                                lotsByUnitId.get(unit.unitId) ?? []
                                            const publishedLots = lots.filter(
                                                (lot) =>
                                                    normalizeLotStatus(lot.status) ===
                                                    "PUBLISHED",
                                            )
                                            const catalogUnit = catalogUnits.find(
                                                (item) => item.unitId === unit.unitId,
                                            )
                                            const conversionHint = catalogUnit
                                                ? formatConversionRateHintWithBase(
                                                      catalogUnit,
                                                      catalogUnits,
                                                  )
                                                : null

                                            return (
                                                <article
                                                    key={unit.unitId}
                                                    className="px-5 py-4"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h4 className="text-sm font-bold text-slate-900">
                                                                    {formatUnitLabel(
                                                                        unit.name,
                                                                        unit.symbol,
                                                                    )}
                                                                </h4>
                                                                {unit.isProductDefault ? (
                                                                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                                                                        Chuẩn SP
                                                                    </span>
                                                                ) : null}
                                                                {unit.hasPublishedLot ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                                                                        <CheckCircle2
                                                                            size={11}
                                                                        />
                                                                        Có lô bán
                                                                    </span>
                                                                ) : (
                                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                                        Chưa có lô bán
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Loại: {unit.type}
                                                                {conversionHint
                                                                    ? ` · ${conversionHint}`
                                                                    : ""}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-slate-500">
                                                            {publishedLots.length} lô đang
                                                            bán / {lots.length} lô tổng
                                                        </p>
                                                    </div>

                                                    {lots.length > 0 ? (
                                                        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
                                                            <table className="min-w-full text-left text-xs">
                                                                <thead className="bg-slate-50 text-slate-500">
                                                                    <tr>
                                                                        <th className="px-3 py-2 font-semibold">
                                                                            Mã lô
                                                                        </th>
                                                                        <th className="px-3 py-2 font-semibold">
                                                                            Trạng thái
                                                                        </th>
                                                                        <th className="px-3 py-2 font-semibold">
                                                                            SL
                                                                        </th>
                                                                        <th className="px-3 py-2 font-semibold">
                                                                            HSD
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {lots.map((lot) => (
                                                                        <tr
                                                                            key={lot.lotId}
                                                                            className="border-t border-slate-100"
                                                                        >
                                                                            <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                                                                                {lot.lotId.slice(
                                                                                    0,
                                                                                    8,
                                                                                )}
                                                                                …
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {lotStatusLabel[
                                                                                    normalizeLotStatus(
                                                                                        lot.status,
                                                                                    )
                                                                                ] ??
                                                                                    lot.status ??
                                                                                    "—"}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {lot.quantity ??
                                                                                    "—"}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {lot.expiryDate
                                                                                    ? new Date(
                                                                                          lot.expiryDate,
                                                                                      ).toLocaleDateString(
                                                                                          "vi-VN",
                                                                                      )
                                                                                    : "—"}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <p className="mt-3 text-xs text-slate-500">
                                                            Chưa có lô nào dùng đơn vị này.
                                                            Tạo lô mới và chọn đơn vị tương
                                                            ứng để khách mua được.
                                                        </p>
                                                    )}
                                                </article>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
                            <Info size={18} className="mt-0.5 text-slate-500" />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Danh mục đơn vị hệ thống
                                </h3>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Chỉ xem — thêm hoặc sửa đơn vị mới cần liên hệ quản
                                    trị viên (Cài đặt → Đơn vị).
                                </p>
                            </div>
                        </div>

                        {catalogLoading ? (
                            <div className="flex items-center gap-2 px-5 py-8 text-sm text-slate-500">
                                <Loader2 size={16} className="animate-spin" />
                                Đang tải danh mục...
                            </div>
                        ) : (
                            <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                {catalogUnits.map((unit) => (
                                    <div
                                        key={unit.unitId}
                                        className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                                    >
                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                            <Tag size={14} className="text-slate-400" />
                                            {formatUnitLabel(unit.name, unit.symbol)}
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {unit.type}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </section>
            </div>
        </div>
    )
}

export default SupermarketPurchaseUnitsPage

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Package2, Search } from "lucide-react"
import toast from "react-hot-toast"

import { productService } from "@/services/product.service"
import type { ProductResponseDto } from "@/types/product.type"
import type { ProductPurchaseUnit } from "@/types/purchase-unit.type"
import { formatUnitDisplay } from "@/utils/unitMeasure"

const MarketingPurchaseUnitsPage = () => {
    const [products, setProducts] = useState<ProductResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [purchaseUnits, setPurchaseUnits] = useState<ProductPurchaseUnit[]>([])
    const [detailLoading, setDetailLoading] = useState(false)

    const loadProducts = useCallback(async () => {
        setLoading(true)
        try {
            const result = await productService.getProducts({
                pageNumber: 1,
                pageSize: 100,
            })
            setProducts(result.items ?? [])
        } catch (error) {
            toast.error("Không tải được danh sách sản phẩm")
        } finally {
            setLoading(false)
        }
    }, [])

    const loadUnits = useCallback(async (productId: string) => {
        setDetailLoading(true)
        try {
            const units = await productService.getPurchaseUnits(productId)
            setPurchaseUnits(units)
        } catch (error) {
            toast.error("Không tải được đơn vị bán")
            setPurchaseUnits([])
        } finally {
            setDetailLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadProducts()
    }, [loadProducts])

    useEffect(() => {
        if (!selectedProductId) {
            setPurchaseUnits([])
            return
        }
        void loadUnits(selectedProductId)
    }, [selectedProductId, loadUnits])

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase()
        if (!keyword) return products
        return products.filter((item) =>
            [item.name, item.brand, item.category, item.barcode]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(keyword),
        )
    }, [products, search])

    const selectedProduct = products.find(
        (item) => item.productId === selectedProductId,
    )

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Đơn vị bán (xem)
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Marketing chỉ xem đơn vị khách có thể mua theo từng sản phẩm.
                    Cấu hình lô hàng do nhân viên siêu thị thực hiện.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tìm sản phẩm..."
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm"
                        />
                    </div>

                    <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-10 text-slate-500">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-500">
                                Không có sản phẩm
                            </p>
                        ) : (
                            filtered.map((product) => (
                                <button
                                    key={product.productId}
                                    type="button"
                                    onClick={() =>
                                        setSelectedProductId(product.productId)
                                    }
                                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                                        selectedProductId === product.productId
                                            ? "border-sky-300 bg-sky-50"
                                            : "border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="font-semibold text-slate-900">
                                        {product.name}
                                    </div>
                                    <div className="mt-0.5 text-xs text-slate-500">
                                        {product.brand || "—"} · {product.category || "—"}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    {!selectedProduct ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center text-center text-slate-500">
                            <Package2 className="mb-3 h-10 w-10 text-slate-300" />
                            <p className="text-sm">Chọn sản phẩm để xem đơn vị bán</p>
                        </div>
                    ) : detailLoading ? (
                        <div className="flex min-h-[280px] items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin text-sky-600" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {selectedProduct.name}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Mua được:{" "}
                                    {purchaseUnits.length
                                        ? purchaseUnits
                                              .map((unit) =>
                                                  formatUnitDisplay(
                                                      unit.name,
                                                      unit.symbol,
                                                  ),
                                              )
                                              .join(", ")
                                        : "Chưa có đơn vị"}
                                </p>
                            </div>

                            <ul className="space-y-2">
                                {purchaseUnits.map((unit) => (
                                    <li
                                        key={unit.unitId}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm"
                                    >
                                        <span className="font-medium text-slate-900">
                                            {formatUnitDisplay(unit.name, unit.symbol)}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {unit.isProductDefault
                                                ? "Chuẩn SP"
                                                : unit.hasPublishedLot
                                                  ? "Có lô đang bán"
                                                  : "—"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MarketingPurchaseUnitsPage

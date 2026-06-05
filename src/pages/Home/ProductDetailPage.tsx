import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
    ArrowLeft,
    BadgeCheck,
    CalendarClock,
    Check,
    Clock3,
    Minus,
    Package2,
    Plus,
    ShieldCheck,
    ShoppingCart,
    Trash2,
    Truck,
} from "lucide-react"
import { useLocation, useNavigate, useParams } from "react-router-dom"

import axiosClient from "@/utils/axiosClient"
import {
    cn,
    formatBestBefore,
    formatCurrency,
    groupHomeProductsByProduct,
    imageBg,
    isProductVisibleByExpiry,
    mapProductLotFromApi,
    normalizeHomeLotApiItem,
} from "@/utils/home"
import { useHomeCart, type HomeCartLineInput } from "@/hooks/useHomeCart"
import { resolveProductDisplayImageUrl } from "@/utils/productImage"
import type { ProductPurchaseUnit } from "@/types/purchase-unit.type"
import {
    filterPurchaseUnitsByProductType,
    mergePurchaseUnits,
    parsePurchaseUnitsResponse,
} from "@/utils/purchaseUnits"
import {
    convertQuantityBetweenRates,
    convertUnitPriceBetweenRates,
    formatConversionRateHint,
    formatCustomerPurchaseUnitHint,
    formatCustomerQuantityEquivalence,
    formatCustomerUnitPriceHint,
    formatUnitDisplay,
    type LotUnitContext,
} from "@/utils/unitMeasure"
import { getAuthSession } from "@/utils/authStorage"
import { CART_ROUTE, LOGIN_ROUTE } from "@/constants/home.constants"

import type {
    HomeProductGroupView,
    HomeProductLotApiItem,
    HomeProductLotsResponse,
    HomeProductView,
} from "@/types/home.type"

type ProductDetailLocationState = {
    product?: HomeProductGroupView
}

type LotOption = {
    lot: HomeProductView
    raw?: HomeProductLotApiItem
}

const isUserLoggedIn = () => !!getAuthSession()?.accessToken

const qtyBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 active:scale-[0.98]"

const primaryBtn =
    "inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(225,29,72,0.16)] transition hover:bg-rose-700 active:scale-[0.99]"

const softBtn =
    "inline-flex items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-[13px] font-semibold text-sky-700 transition hover:bg-sky-100 active:scale-[0.99]"

const getLotRaw = (lot: HomeProductView, rawLots: HomeProductLotApiItem[]) =>
    rawLots.find((item) => item.lotId === lot.lotId)

const getLotUnitName = (lot: HomeProductView, rawLots: HomeProductLotApiItem[]) =>
    getLotRaw(lot, rawLots)?.unitName || "Sản phẩm"

const getLotExpiryDate = (lot: HomeProductView, rawLots: HomeProductLotApiItem[]) =>
    getLotRaw(lot, rawLots)?.expiryDate

const getExpiryKey = (value?: string) => {
    if (!value) return "unknown"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "unknown"

    return date.toISOString().slice(0, 10)
}

const getExpiryLabel = (value?: string) => {
    if (!value) return "Chưa cập nhật HSD"
    return formatBestBefore(value)
}

const getUnitKey = (value?: string) => value?.trim() || "unknown"

const getUrgencyTone = (daysToExpiry: number | null) => {
    if (typeof daysToExpiry !== "number") return "bg-slate-100 text-slate-600"
    if (daysToExpiry <= 1) return "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
    if (daysToExpiry <= 3) return "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
}

const getExpiryShortText = (daysToExpiry: number | null) => {
    if (typeof daysToExpiry !== "number") return "Đang cập nhật"
    if (daysToExpiry < 0) return "Đã hết hạn"
    if (daysToExpiry === 0) return "Trong ngày"
    if (daysToExpiry === 1) return "Còn 1 ngày"
    return `Còn ${daysToExpiry} ngày`
}

const buildLotOptionLabel = (
    option: LotOption | undefined,
    rawLots: HomeProductLotApiItem[]
) => {
    if (!option) return "Chưa chọn lựa chọn"

    const unitName = getLotUnitName(option.lot, rawLots)
    const expiryDate = getLotExpiryDate(option.lot, rawLots)

    return `${unitName} · HSD ${formatBestBefore(expiryDate)}`
}

const toLotUnitContext = (
    raw?: HomeProductLotApiItem | null,
): LotUnitContext => ({
    unitId: raw?.unitId,
    unitName: raw?.unitName,
    unitSymbol: raw?.unitSymbol,
    unitType: raw?.unitType,
    conversionRate: raw?.conversionRate,
    productUnitId: raw?.productUnitId,
    productUnitName: raw?.productUnitName,
    productUnitSymbol: raw?.productUnitSymbol,
    productConversionRate: raw?.productConversionRate,
})

const ProductDetailPage = () => {
    const { productId = "" } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const stateProduct = (location.state as ProductDetailLocationState | null)?.product

    const [product, setProduct] = useState<HomeProductGroupView | null>(
        stateProduct?.productId === productId ? stateProduct : null
    )
    const [selectedSupermarketName, setSelectedSupermarketName] = useState("")
    const [selectedExpiryKey, setSelectedExpiryKey] = useState("")
    const [selectedUnitKey, setSelectedUnitKey] = useState("")
    const [purchaseUnits, setPurchaseUnits] = useState<ProductPurchaseUnit[]>([])
    const [selectedPurchaseUnitId, setSelectedPurchaseUnitId] = useState("")
    const [loading, setLoading] = useState(!!productId)
    const [error, setError] = useState("")

    const { getCartQty, addToCart, increaseCart, decreaseCart } = useHomeCart()

    const displayImageUrl = useMemo(
        () =>
            product
                ? resolveProductDisplayImageUrl(
                      product.preSignedImageUrl,
                      product.imageUrl,
                  )
                : "",
        [product],
    )

    useEffect(() => {
        if (!productId) return

        const fetchProductLots = async () => {
            setLoading(true)
            setError("")

            try {
                const response = await axiosClient.get<{
                    success: boolean
                    message?: string
                    data?: HomeProductLotApiItem[]
                }>(`/customers/products/${productId}/available-stocklots`)

                const scopedRawLots = (response.data?.data ?? []).map((item) =>
                    normalizeHomeLotApiItem(item),
                )
                const supermarketNameMap = new Map<string, string>()

                const mappedLots = scopedRawLots
                    .map((item) => mapProductLotFromApi(item, supermarketNameMap))
                    .filter((item) =>
                        isProductVisibleByExpiry(
                            item.daysToExpiry ?? undefined,
                            item.hoursRemaining ?? undefined,
                        ),
                    )

                const grouped = groupHomeProductsByProduct(mappedLots, scopedRawLots)

                setProduct(grouped[0] ?? null)

                if (!grouped.length) {
                    setError(
                        "Không tìm thấy sản phẩm hoặc sản phẩm hiện chưa còn lựa chọn phù hợp.",
                    )
                }
            } catch (err) {
                console.error("[ProductDetail] load failed:", err)
                setError("Không tải được chi tiết sản phẩm.")
                setProduct(null)
            } finally {
                setLoading(false)
            }
        }

        void fetchProductLots()
    }, [productId])

    useEffect(() => {
        if (!productId) return

        const fetchPurchaseUnits = async () => {
            try {
                const response = await axiosClient.get(
                    `/customers/products/${productId}/purchase-units`,
                )
                setPurchaseUnits(parsePurchaseUnitsResponse(response.data))
            } catch (err) {
                console.error("[ProductDetail] purchase units failed:", err)
                setPurchaseUnits([])
            }
        }

        void fetchPurchaseUnits()
    }, [productId])

    const productDefaultUnitType = useMemo(() => {
        const fromRawLots = product?.rawLots?.[0]?.unitType?.trim()
        if (fromRawLots) return fromRawLots

        const fromLots = product?.lots?.[0]?.unitType?.trim()
        if (fromLots) return fromLots

        const defaultUnit = purchaseUnits.find((unit) => unit.isProductDefault)
        return defaultUnit?.type?.trim() ?? ""
    }, [product?.rawLots, product?.lots, purchaseUnits])

    const effectivePurchaseUnits = useMemo(() => {
        const merged = mergePurchaseUnits(purchaseUnits, product?.rawLots ?? [])
        return filterPurchaseUnitsByProductType(merged, productDefaultUnitType)
    }, [purchaseUnits, product?.rawLots, productDefaultUnitType])

    const lotOptions: LotOption[] = useMemo(() => {
        if (!product) return []

        return product.lots
            .map((lot) => ({
                lot,
                raw: getLotRaw(lot, product.rawLots),
            }))
            .filter((option) => Math.max(0, Number(option.lot.quantity ?? 0)) > 0)
            .sort((a, b) => {
                const aDays = a.lot.daysToExpiry ?? Number.MAX_SAFE_INTEGER
                const bDays = b.lot.daysToExpiry ?? Number.MAX_SAFE_INTEGER

                if (aDays !== bDays) return aDays - bDays
                if (a.lot.price !== b.lot.price) return a.lot.price - b.lot.price
                return a.lot.supermarketName.localeCompare(b.lot.supermarketName, "vi")
            })
    }, [product])

    const supermarketOptions = useMemo(() => {
        const map = new Map<string, LotOption[]>()

        lotOptions.forEach((option) => {
            const key = option.lot.supermarketName || "Siêu thị gần bạn"
            const current = map.get(key) ?? []

            current.push(option)
            map.set(key, current)
        })

        return Array.from(map.entries())
            .map(([name, options]) => {
                const minPrice = Math.min(
                    ...options.map((item) => item.lot.price || Number.MAX_SAFE_INTEGER)
                )
                const totalQuantity = options.reduce(
                    (sum, item) => sum + Math.max(0, item.lot.quantity ?? 0),
                    0
                )

                return {
                    name,
                    options,
                    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
                    totalQuantity,
                }
            })
            .sort((a, b) => {
                if (a.minPrice !== b.minPrice) return a.minPrice - b.minPrice
                return a.name.localeCompare(b.name, "vi")
            })
    }, [lotOptions])

    const selectedSupermarketOptions = useMemo(() => {
        return (
            supermarketOptions.find((item) => item.name === selectedSupermarketName)?.options ??
            []
        )
    }, [supermarketOptions, selectedSupermarketName])

    const expiryOptions = useMemo(() => {
        const map = new Map<
            string,
            {
                key: string
                label: string
                nearestDays: number | null
                totalQuantity: number
                minPrice: number
                options: LotOption[]
            }
        >()

        selectedSupermarketOptions.forEach((option) => {
            const expiryDate = getLotExpiryDate(option.lot, product?.rawLots ?? [])
            const key = getExpiryKey(expiryDate)
            const current = map.get(key)

            if (!current) {
                map.set(key, {
                    key,
                    label: getExpiryLabel(expiryDate),
                    nearestDays: option.lot.daysToExpiry,
                    totalQuantity: Math.max(0, option.lot.quantity ?? 0),
                    minPrice: option.lot.price,
                    options: [option],
                })
                return
            }

            current.totalQuantity += Math.max(0, option.lot.quantity ?? 0)
            current.minPrice = Math.min(current.minPrice, option.lot.price)
            current.options.push(option)

            const currentDays = current.nearestDays ?? Number.MAX_SAFE_INTEGER
            const nextDays = option.lot.daysToExpiry ?? Number.MAX_SAFE_INTEGER

            if (nextDays < currentDays) {
                current.nearestDays = option.lot.daysToExpiry
            }
        })

        return Array.from(map.values()).sort((a, b) => {
            const aDays = a.nearestDays ?? Number.MAX_SAFE_INTEGER
            const bDays = b.nearestDays ?? Number.MAX_SAFE_INTEGER

            if (aDays !== bDays) return aDays - bDays
            return a.minPrice - b.minPrice
        })
    }, [selectedSupermarketOptions, product?.rawLots])

    const selectedExpiryOptions = useMemo(() => {
        return expiryOptions.find((item) => item.key === selectedExpiryKey)?.options ?? []
    }, [expiryOptions, selectedExpiryKey])

    const unitOptions = useMemo(() => {
        return selectedExpiryOptions
            .map((option) => {
                const unitName = getLotUnitName(option.lot, product?.rawLots ?? [])
                const price = option.lot.price || 0
                const duplicateUnitCount = selectedExpiryOptions.filter((item) => {
                    return (
                        getUnitKey(getLotUnitName(item.lot, product?.rawLots ?? [])) ===
                        getUnitKey(unitName)
                    )
                }).length

                return {
                    key: option.lot.lotId,
                    label:
                        duplicateUnitCount > 1
                            ? `${unitName} · ${formatCurrency(price)}`
                            : unitName,
                    totalQuantity: Math.max(0, option.lot.quantity ?? 0),
                    minPrice: price,
                    option,
                }
            })
            .sort((a, b) => {
                if (a.minPrice !== b.minPrice) return a.minPrice - b.minPrice
                return a.label.localeCompare(b.label, "vi")
            })
    }, [selectedExpiryOptions, product?.rawLots])

    const selectedOption = useMemo(() => {
        if (!selectedUnitKey) return unitOptions[0]?.option
        return (
            unitOptions.find((item) => item.key === selectedUnitKey)?.option ??
            unitOptions[0]?.option
        )
    }, [unitOptions, selectedUnitKey])

    const selectedLot = selectedOption?.lot ?? null
    const selectedRawLot = selectedOption?.raw

    const selectedPurchaseUnit = useMemo(() => {
        if (!effectivePurchaseUnits.length) return null
        return (
            effectivePurchaseUnits.find((u) => u.unitId === selectedPurchaseUnitId) ??
            effectivePurchaseUnits[0]
        )
    }, [effectivePurchaseUnits, selectedPurchaseUnitId])

    const selectedCartQty = selectedLot
        ? getCartQty(
            selectedLot.lotId,
            selectedPurchaseUnit?.unitId ?? selectedRawLot?.unitId,
        )
        : 0

    const selectedDisplayPrice = useMemo(() => {
        if (!selectedLot?.price || !selectedRawLot || !selectedPurchaseUnit) {
            return selectedLot?.price ?? 0
        }

        if (selectedPurchaseUnit.unitId === selectedRawLot.unitId) {
            return selectedLot.price
        }

        return convertUnitPriceBetweenRates(
            selectedLot.price,
            selectedRawLot.conversionRate,
            selectedPurchaseUnit.conversionRate,
        )
    }, [selectedLot, selectedRawLot, selectedPurchaseUnit])

    const selectedMaxPurchaseQty = useMemo(() => {
        const lotQty = Math.max(0, Number(selectedLot?.quantity ?? 0))
        if (!selectedRawLot || !selectedPurchaseUnit) return lotQty

        if (selectedPurchaseUnit.unitId === selectedRawLot.unitId) return lotQty

        const converted = convertQuantityBetweenRates(
            lotQty,
            selectedRawLot.conversionRate,
            selectedPurchaseUnit.conversionRate,
        )
        return Math.max(0, Math.floor(converted))
    }, [selectedLot, selectedRawLot, selectedPurchaseUnit])

    const selectedUnitContext = useMemo((): LotUnitContext => {
        const base = toLotUnitContext(selectedRawLot)
        if (!selectedPurchaseUnit) return base

        return {
            ...base,
            unitId: selectedPurchaseUnit.unitId,
            unitName: selectedPurchaseUnit.name,
            unitSymbol: selectedPurchaseUnit.symbol,
            unitType: selectedPurchaseUnit.type,
            conversionRate: selectedPurchaseUnit.conversionRate,
        }
    }, [selectedRawLot, selectedPurchaseUnit])

    const buildSelectedCartLine = (): HomeCartLineInput | null => {
        if (!selectedLot || !selectedRawLot) return null

        return {
            ...selectedLot,
            expiryDate: selectedRawLot.expiryDate,
            purchaseUnitId:
                selectedPurchaseUnit?.unitId ?? selectedRawLot.unitId,
            purchaseUnitName:
                selectedPurchaseUnit?.name ?? selectedRawLot.unitName,
            purchaseUnitSymbol:
                selectedPurchaseUnit?.symbol ?? selectedRawLot.unitSymbol,
            purchaseConversionRate:
                selectedPurchaseUnit?.conversionRate ??
                selectedRawLot.conversionRate,
            displayPrice: selectedDisplayPrice,
            maxPurchaseQty: selectedMaxPurchaseQty,
        }
    }
    const selectedPurchaseUnitHint = useMemo(
        () => formatCustomerPurchaseUnitHint(selectedUnitContext),
        [selectedUnitContext],
    )
    const selectedQuantityEquivalence = useMemo(() => {
        if (!selectedCartQty) return null
        return formatCustomerQuantityEquivalence(selectedCartQty, selectedUnitContext)
    }, [selectedCartQty, selectedUnitContext])
    const selectedUnitPriceHint = useMemo(() => {
        if (!selectedDisplayPrice) return null
        return formatCustomerUnitPriceHint(
            selectedDisplayPrice,
            selectedUnitContext,
        )
    }, [selectedDisplayPrice, selectedUnitContext])
    const selectedReachedStockLimit =
        selectedMaxPurchaseQty > 0 && selectedCartQty >= selectedMaxPurchaseQty
    const selectedOutOfStock = selectedMaxPurchaseQty <= 0

    useEffect(() => {
        if (!supermarketOptions.length) return

        const stillValid = supermarketOptions.some((item) => item.name === selectedSupermarketName)

        if (!selectedSupermarketName || !stillValid) {
            setSelectedSupermarketName(supermarketOptions[0].name)
        }
    }, [supermarketOptions, selectedSupermarketName])

    useEffect(() => {
        if (!expiryOptions.length) {
            setSelectedExpiryKey("")
            return
        }

        const stillValid = expiryOptions.some((item) => item.key === selectedExpiryKey)

        if (!selectedExpiryKey || !stillValid) {
            setSelectedExpiryKey(expiryOptions[0].key)
        }
    }, [expiryOptions, selectedExpiryKey])

    useEffect(() => {
        if (!unitOptions.length) {
            setSelectedUnitKey("")
            return
        }

        const stillValid = unitOptions.some((item) => item.key === selectedUnitKey)

        if (!selectedUnitKey || !stillValid) {
            setSelectedUnitKey(unitOptions[0].key)
        }
    }, [unitOptions, selectedUnitKey])

    useEffect(() => {
        if (!effectivePurchaseUnits.length) {
            setSelectedPurchaseUnitId("")
            return
        }

        const lotUnitId = selectedRawLot?.unitId
        const preferred =
            (lotUnitId &&
                effectivePurchaseUnits.find((u) => u.unitId === lotUnitId)?.unitId) ||
            effectivePurchaseUnits.find((u) => u.isProductDefault)?.unitId ||
            effectivePurchaseUnits[0].unitId

        const stillValid = effectivePurchaseUnits.some(
            (u) => u.unitId === selectedPurchaseUnitId,
        )

        if (!selectedPurchaseUnitId || !stillValid) {
            setSelectedPurchaseUnitId(preferred)
        }
    }, [effectivePurchaseUnits, selectedRawLot?.unitId, selectedPurchaseUnitId])

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
            return
        }

        navigate("/")
    }

    const handleViewCart = () => {
        if (!isUserLoggedIn()) {
            navigate(LOGIN_ROUTE, {
                state: { redirectTo: CART_ROUTE },
            })
            return
        }

        navigate(CART_ROUTE)
    }

    const handleAddSelected = () => {
        if (!isUserLoggedIn()) {
            navigate(LOGIN_ROUTE, {
                state: { redirectTo: location.pathname },
            })
            return
        }

        const line = buildSelectedCartLine()
        if (!line || selectedOutOfStock) return
        addToCart(line)
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-6">
                <div className="mx-auto max-w-7xl">
                    <div className="h-[620px] animate-pulse rounded-[32px] border border-slate-200 bg-white" />
                </div>
            </main>
        )
    }

    if (!product) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-6">
                <div className="mx-auto max-w-3xl rounded-[28px] border border-rose-100 bg-white p-6 text-center shadow-sm">
                    <div className="text-lg font-bold text-slate-900">Không có dữ liệu sản phẩm</div>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                        {error || "Sản phẩm này hiện chưa có lô hàng phù hợp để hiển thị."}
                    </p>

                    <button
                        type="button"
                        onClick={handleBack}
                        className="mt-5 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                        Quay lại mua hàng
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#f7f8fa_0%,#eef6ff_42%,#ffffff_100%)] px-4 py-4">
            <div className="mx-auto max-w-7xl">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[12px] font-semibold text-slate-500">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-1.5 transition hover:text-sky-700"
                    >
                        <ArrowLeft size={14} />
                        Trang chủ
                    </button>
                </div>

                <section className="grid gap-4 lg:grid-cols-[370px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)_340px]">
                    <aside className="space-y-3">
                        <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-sm">
                            <div
                                className={cn(
                                    "relative flex h-[360px] items-center justify-center overflow-hidden",
                                    imageBg(product.imageVariant)
                                )}
                            >
                                {!!product.discountLabel && (
                                    <div className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                                        {product.discountLabel}
                                    </div>
                                )}

                                <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm backdrop-blur">
                                    {product.lots.length} lựa chọn
                                </div>

                                {displayImageUrl ? (
                                    <img
                                        src={displayImageUrl}
                                        alt={product.name}
                                        className="h-full w-full object-contain p-7 transition duration-300 hover:scale-[1.02]"
                                    />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/80 text-slate-400 shadow-sm">
                                        <Package2 size={40} />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-4 gap-2 border-t border-slate-100 p-3">
                                {[displayImageUrl, displayImageUrl, displayImageUrl, displayImageUrl].map(
                                    (image, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={cn(
                                                "flex h-16 items-center justify-center rounded-lg border bg-slate-50 transition hover:border-rose-300",
                                                index === 0 ? "border-rose-500" : "border-slate-200"
                                            )}
                                        >
                                            {image ? (
                                                <img
                                                    src={image}
                                                    alt={`${product.name} ${index + 1}`}
                                                    className="h-full w-full object-contain p-1.5"
                                                />
                                            ) : (
                                                <Package2 size={20} className="text-slate-300" />
                                            )}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="rounded-[12px] border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="mb-3 text-[14px] font-semibold text-slate-900">
                                Cam kết sản phẩm
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                <CommitmentCard
                                    icon={<ShieldCheck size={16} />}
                                    title="Minh bạch lô hàng"
                                    description="Hiển thị rõ siêu thị, đơn vị, hạn sử dụng, giá và số lượng."
                                />
                                <CommitmentCard
                                    icon={<Truck size={16} />}
                                    title="Lọc theo khu vực"
                                    description="Chỉ hiển thị lựa chọn từ siêu thị khả dụng gần bạn."
                                />
                                <CommitmentCard
                                    icon={<CalendarClock size={16} />}
                                    title="Hạn dùng rõ ràng"
                                    description="Mỗi lựa chọn đều có HSD và thời gian còn lại."
                                />
                                <CommitmentCard
                                    icon={<Clock3 size={16} />}
                                    title="Ưu tiên giá tốt"
                                    description="Dễ so sánh theo hạn dùng, đơn vị và giá bán."
                                />
                            </div>
                        </div>
                    </aside>

                    <section className="min-w-0 rounded-[12px] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="border-b border-slate-100 pb-4">
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                    <BadgeCheck size={13} />
                                    Đang bán
                                </span>

                                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                    {product.category}
                                </span>

                                {product.isFreshFood && (
                                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                                        Tươi sống
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-3 text-[21px] font-bold leading-snug tracking-[-0.02em] text-slate-900 md:text-[26px]">
                                {product.name}
                            </h1>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-500">
                                {!!product.brand && <span>Thương hiệu: {product.brand}</span>}
                                <span>{product.supermarketCount} siêu thị đang bán</span>
                                <span>Còn tổng {product.totalQuantity} sản phẩm</span>
                            </div>

                            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[12px] font-bold text-slate-500">
                                            Giá tham khảo
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-end gap-2">
                                            <div className="text-[22px] font-bold tracking-[-0.02em] text-slate-900">
                                                {product.minPrice === product.maxPrice
                                                    ? formatCurrency(product.minPrice)
                                                    : `Từ ${formatCurrency(product.minPrice)}`}
                                            </div>

                                            {product.minPrice !== product.maxPrice && (
                                                <div className="pb-1 text-sm font-bold text-slate-500">
                                                    đến {formatCurrency(product.maxPrice)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-white px-3 py-2 text-right text-[11px] font-bold text-slate-500 shadow-sm">
                                        Giá thay đổi theo
                                        <div className="text-blue-700">siêu thị · HSD · đơn vị</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 space-y-6">
                            <OptionSection title="Siêu thị">
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {supermarketOptions.map((option) => {
                                        const selected = selectedSupermarketName === option.name

                                        return (
                                            <button
                                                key={option.name}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedSupermarketName(option.name)
                                                    setSelectedExpiryKey("")
                                                    setSelectedUnitKey("")
                                                }}
                                                className={cn(
                                                    "relative min-h-[68px] rounded-xl border bg-white px-3 py-2 text-center transition hover:border-rose-300",
                                                    selected
                                                        ? "border-rose-500 ring-1 ring-rose-200"
                                                        : "border-slate-200"
                                                )}
                                            >
                                                {selected && <SelectedCorner />}

                                                <div className="line-clamp-1 text-xs font-semibold text-slate-900">
                                                    {option.name}
                                                </div>
                                                <div className="mt-1 text-[11px] font-bold text-rose-600">
                                                    Từ {formatCurrency(option.minPrice)}
                                                </div>
                                                <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                                    Còn {option.totalQuantity}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </OptionSection>

                            <OptionSection title="Hạn sử dụng">
                                {expiryOptions.length ? (
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                        {expiryOptions.map((option) => {
                                            const selected = selectedExpiryKey === option.key

                                            return (
                                                <button
                                                    key={option.key}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedExpiryKey(option.key)
                                                        setSelectedUnitKey("")
                                                    }}
                                                    className={cn(
                                                        "relative min-h-[74px] rounded-xl border bg-white px-3 py-2 text-center transition hover:border-rose-300",
                                                        selected
                                                            ? "border-rose-500 ring-1 ring-rose-200"
                                                            : "border-slate-200"
                                                    )}
                                                >
                                                    {selected && <SelectedCorner />}

                                                    <div
                                                        className={cn(
                                                            "mx-auto w-fit rounded-full px-2 py-0.5 text-[10px] font-bold",
                                                            getUrgencyTone(option.nearestDays)
                                                        )}
                                                    >
                                                        {getExpiryShortText(option.nearestDays)}
                                                    </div>
                                                    <div className="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-500">
                                                        {option.label}
                                                    </div>
                                                    <div className="mt-0.5 text-[10px] font-bold text-rose-600">
                                                        Từ {formatCurrency(option.minPrice)}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <EmptyOption message="Siêu thị này chưa còn hạn sử dụng khả dụng." />
                                )}
                            </OptionSection>

                            <OptionSection title="Quy cách lô">
                                {unitOptions.length ? (
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                        {unitOptions.map((option) => {
                                            const selected = selectedUnitKey === option.key

                                            return (
                                                <button
                                                    key={option.key}
                                                    type="button"
                                                    onClick={() => setSelectedUnitKey(option.key)}
                                                    className={cn(
                                                        "relative min-h-[68px] rounded-xl border bg-white px-3 py-2 text-center transition hover:border-rose-300",
                                                        selected
                                                            ? "border-rose-500 ring-1 ring-rose-200"
                                                            : "border-slate-200"
                                                    )}
                                                >
                                                    {selected && <SelectedCorner />}

                                                    <div className="text-xs font-semibold text-slate-900">
                                                        {formatUnitDisplay(
                                                            option.option.raw?.unitName,
                                                            option.option.raw?.unitSymbol,
                                                            option.label,
                                                        )}
                                                    </div>
                                                    {option.option.raw &&
                                                    formatConversionRateHint(
                                                        toLotUnitContext(option.option.raw),
                                                    ) ? (
                                                        <div className="mt-1 line-clamp-2 text-[9px] font-medium text-sky-700">
                                                            {formatConversionRateHint(
                                                                toLotUnitContext(option.option.raw),
                                                            )}
                                                        </div>
                                                    ) : null}
                                                    <div className="mt-1 text-[11px] font-bold text-rose-600">
                                                        {formatCurrency(option.minPrice)}
                                                    </div>
                                                    <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                                        Còn {option.totalQuantity}{" "}
                                                        {option.option.raw?.unitName || "đơn vị"}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <EmptyOption message="Hạn sử dụng này chưa còn quy cách lô khả dụng." />
                                )}
                            </OptionSection>

                            <OptionSection title="Đơn vị mua">
                                {effectivePurchaseUnits.length ? (
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                        {effectivePurchaseUnits.map((unit) => {
                                            const selected =
                                                selectedPurchaseUnit?.unitId ===
                                                unit.unitId

                                            return (
                                                <button
                                                    key={unit.unitId}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedPurchaseUnitId(
                                                            unit.unitId,
                                                        )
                                                    }
                                                    className={cn(
                                                        "relative min-h-[68px] rounded-xl border bg-white px-3 py-2 text-center transition hover:border-rose-300",
                                                        selected
                                                            ? "border-rose-500 ring-1 ring-rose-200"
                                                            : "border-slate-200",
                                                    )}
                                                >
                                                    {selected && <SelectedCorner />}

                                                    <div className="text-xs font-semibold text-slate-900">
                                                        {formatUnitDisplay(
                                                            unit.name,
                                                            unit.symbol,
                                                        )}
                                                    </div>
                                                    {formatConversionRateHint({
                                                        name: unit.name,
                                                        symbol: unit.symbol,
                                                        type: unit.type,
                                                        conversionRate:
                                                            unit.conversionRate,
                                                    }) ? (
                                                        <div className="mt-1 line-clamp-2 text-[9px] font-medium text-sky-700">
                                                            {formatConversionRateHint(
                                                                {
                                                                    name: unit.name,
                                                                    symbol: unit.symbol,
                                                                    type: unit.type,
                                                                    conversionRate:
                                                                        unit.conversionRate,
                                                                },
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <EmptyOption message="Chưa có đơn vị mua khả dụng cho sản phẩm này." />
                                )}
                            </OptionSection>

                        </div>

                        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-[14px] font-semibold text-slate-900">
                                Thông tin sản phẩm
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <InfoRow label="Tên sản phẩm" value={product.name} />
                                <InfoRow label="Thương hiệu" value={product.brand || "Chưa cập nhật"} />
                                <InfoRow label="Danh mục" value={product.category || "Thực phẩm"} />
                                <InfoRow
                                    label="Đơn vị đang bán"
                                    value={
                                        product.unitNames.length
                                            ? product.unitNames.join(", ")
                                            : "Đang cập nhật"
                                    }
                                />
                                <InfoRow
                                    label="Siêu thị cung cấp"
                                    value={product.supermarketNames.join(", ") || "Siêu thị gần bạn"}
                                />
                                <InfoRow
                                    label="Hạn gần nhất"
                                    value={product.timeLeft || "Đang cập nhật"}
                                />
                            </div>
                        </section>
                    </section>

                    <aside className="lg:col-span-2 xl:col-span-1 xl:sticky xl:top-4 xl:self-start">
                        <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="text-[16px] font-bold tracking-[-0.01em] text-slate-900">
                                Thông tin mua hàng
                            </div>

                            {selectedLot ? (
                                <>
                                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <div className="text-xs font-bold text-slate-500">
                                            Lựa chọn đang chọn
                                        </div>
                                        <div className="mt-1 text-sm font-semibold leading-5 text-slate-900">
                                            {buildLotOptionLabel(selectedOption, product.rawLots)}
                                        </div>
                                        <p className="mt-2 text-[11px] leading-5 text-sky-800">
                                            {selectedPurchaseUnitHint}
                                        </p>

                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div className="rounded-xl bg-white p-2">
                                                <div className="text-[10px] font-bold text-slate-400">
                                                    Siêu thị
                                                </div>
                                                <div className="mt-1 line-clamp-1 text-xs font-semibold text-slate-800">
                                                    {selectedLot.supermarketName}
                                                </div>
                                            </div>

                                            <div className="rounded-xl bg-white p-2">
                                                <div className="text-[10px] font-bold text-slate-400">
                                                    Còn lại
                                                </div>
                                                <div className="mt-1 text-xs font-semibold text-slate-800">
                                                    {selectedMaxPurchaseQty}{" "}
                                                    {selectedPurchaseUnit?.name ||
                                                        selectedRawLot?.unitName ||
                                                        "đơn vị"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-2 rounded-xl bg-white p-2">
                                            <div className="text-[10px] font-bold text-slate-400">
                                                Hạn sử dụng
                                            </div>
                                            <div className="mt-1 text-xs font-semibold text-slate-800">
                                                {formatBestBefore(selectedRawLot?.expiryDate)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3">
                                        <div className="text-xs font-bold tracking-normal text-rose-500">
                                            Giá bán
                                        </div>

                                        {selectedLot.originalPrice > selectedLot.price && (
                                            <div className="mt-1 text-sm font-semibold text-slate-400 line-through">
                                                {formatCurrency(selectedLot.originalPrice)}
                                            </div>
                                        )}

                                        <div className="text-[28px] font-bold tracking-[-0.02em] text-rose-600">
                                            {formatCurrency(selectedDisplayPrice) ||
                                                "Giá cập nhật"}
                                            {selectedPurchaseUnit?.name
                                                ? ` / ${selectedPurchaseUnit.name}`
                                                : selectedRawLot?.unitName
                                                  ? ` / ${selectedRawLot.unitName}`
                                                  : ""}
                                        </div>
                                        {selectedUnitPriceHint ? (
                                            <p className="mt-1 text-xs font-medium text-slate-600">
                                                {selectedUnitPriceHint}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                Số lượng
                                            </div>
                                            <div className="mt-0.5 text-xs font-semibold text-slate-500">
                                                {selectedCartQty > 0
                                                    ? `Đã chọn ${selectedCartQty} ${selectedPurchaseUnit?.name || selectedRawLot?.unitName || ""}`.trim()
                                                    : "Chưa có trong giỏ"}
                                            </div>
                                            {selectedQuantityEquivalence ? (
                                                <p className="mt-1 text-[11px] font-medium text-sky-700">
                                                    {selectedQuantityEquivalence}
                                                </p>
                                            ) : null}
                                        </div>

                                        {selectedCartQty > 0 ? (
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const line = buildSelectedCartLine()
                                                        if (line) decreaseCart(line)
                                                    }}
                                                    className={qtyBtn}
                                                    aria-label={
                                                        selectedCartQty === 1
                                                            ? "Xóa khỏi giỏ"
                                                            : "Giảm số lượng"
                                                    }
                                                >
                                                    {selectedCartQty === 1 ? (
                                                        <Trash2 size={15} />
                                                    ) : (
                                                        <Minus size={15} />
                                                    )}
                                                </button>

                                                <div className="min-w-[28px] text-center text-sm font-semibold text-slate-900">
                                                    {selectedCartQty}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const line = buildSelectedCartLine()
                                                        if (line) increaseCart(line)
                                                    }}
                                                    disabled={selectedOutOfStock || selectedReachedStockLimit}
                                                    className={cn(
                                                        qtyBtn,
                                                        (selectedOutOfStock ||
                                                            selectedReachedStockLimit) &&
                                                        "cursor-not-allowed bg-slate-100 text-slate-300 hover:bg-slate-100"
                                                    )}
                                                    aria-label="Tăng số lượng"
                                                >
                                                    <Plus size={15} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs font-bold text-slate-400">0</div>
                                        )}
                                    </div>

                                    <div className="mt-4 grid gap-2">
                                        {selectedCartQty > 0 ? (
                                            <button
                                                type="button"
                                                onClick={handleViewCart}
                                                className={primaryBtn}
                                            >
                                                <ShoppingCart size={17} />
                                                Xem giỏ hàng
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleAddSelected}
                                                disabled={selectedOutOfStock}
                                                className={cn(
                                                    primaryBtn,
                                                    selectedOutOfStock &&
                                                    "cursor-not-allowed bg-slate-300 hover:bg-slate-300"
                                                )}
                                            >
                                                <ShoppingCart size={17} />
                                                {selectedOutOfStock ? "Tạm hết hàng" : "Thêm vào giỏ"}
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleViewCart}
                                            className={softBtn}
                                        >
                                            Đi tới giỏ hàng
                                        </button>
                                    </div>

                                    {selectedReachedStockLimit && (
                                        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                                            Bạn đã chọn tối đa số lượng còn lại của lô này.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                                    Chưa có lựa chọn phù hợp.
                                </div>
                            )}
                        </div>

                        <div className="mt-3 overflow-hidden rounded-[12px] border border-rose-100 bg-white shadow-sm">
                            <div className="bg-gradient-to-r from-rose-600 to-red-500 px-4 py-3 text-white">
                                <div className="text-base font-bold">Ưu đãi mua hàng</div>
                                <div className="text-xs font-semibold text-white/80">
                                    Áp dụng theo điều kiện đơn hàng hiện tại.
                                </div>
                            </div>

                            <div className="space-y-2 p-3">
                                <PromoLine index={1} text="Tối ưu giá theo từng siêu thị và hạn sử dụng." />
                                <PromoLine index={2} text="Thông tin lô hàng rõ ràng trước khi thêm vào giỏ." />
                                <PromoLine index={3} text="Có thể chọn lại khu vực để xem thêm siêu thị khác." />
                                <PromoLine index={4} text="Giỏ hàng giữ đúng lô đã chọn để tránh sai giá và tồn kho." />
                            </div>
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    )
}

const SelectedCorner = () => (
    <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-xl rounded-tr-xl bg-rose-600 text-white">
        <Check size={12} />
    </span>
)

const OptionSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <section>
        <div className="mb-2 text-[14px] font-semibold text-slate-900">{title}</div>
        {children}
    </section>
)

const EmptyOption = ({ message }: { message: string }) => (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
        {message}
    </div>
)

const CommitmentCard = ({
    icon,
    title,
    description,
}: {
    icon: ReactNode
    title: string
    description: string
}) => (
    <div className="min-h-[92px] rounded-xl bg-slate-50 p-3">
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            {icon}
        </div>
        <div className="mt-2 text-xs font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-[11px] font-medium leading-4 text-slate-500">{description}</div>
    </div>
)

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
        <div className="text-xs font-bold text-slate-400">{label}</div>
        <div className="mt-1 text-sm font-bold text-slate-800">{value}</div>
    </div>
)

const PromoLine = ({ index, text }: { index: number; text: string }) => (
    <div className="flex gap-2 rounded-xl bg-slate-50 px-3 py-2">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white">
            {index}
        </div>
        <div className="text-xs font-semibold leading-5 text-slate-600">{text}</div>
    </div>
)

export default ProductDetailPage

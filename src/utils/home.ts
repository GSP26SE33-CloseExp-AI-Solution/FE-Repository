import type {
    HomeProductGroupView,
    HomeProductLotApiItem,
    HomeProductView,
} from "@/types/home.type"

export const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

export const imageBg = (variant?: HomeProductView["imageVariant"]) => {
    switch (variant) {
        case "milk":
            return "bg-[radial-gradient(circle_at_28%_22%,rgba(59,130,246,0.14),transparent_40%),linear-gradient(135deg,#ffffff,#eef6ff)]"
        case "bread":
            return "bg-[radial-gradient(circle_at_28%_22%,rgba(245,158,11,0.18),transparent_40%),linear-gradient(135deg,#ffffff,#fff6e8)]"
        case "beef":
            return "bg-[radial-gradient(circle_at_28%_22%,rgba(239,68,68,0.14),transparent_40%),linear-gradient(135deg,#ffffff,#fff1f2)]"
        case "avocado":
            return "bg-[radial-gradient(circle_at_28%_22%,rgba(34,197,94,0.16),transparent_40%),linear-gradient(135deg,#ffffff,#edfdf2)]"
        default:
            return "bg-[radial-gradient(circle_at_28%_22%,rgba(15,23,42,0.06),transparent_40%),linear-gradient(135deg,#ffffff,#f8fafc)]"
    }
}

export const formatCurrency = (value: number) => {
    if (!value || value <= 0) return ""
    return `${value.toLocaleString("vi-VN")}đ`
}

export const formatBestBefore = (input?: string) => {
    if (!input) return "Chưa cập nhật"

    const date = new Date(input)
    if (Number.isNaN(date.getTime())) return "Chưa cập nhật"

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

export const getHoursUntilCutoff21 = () => {
    const now = new Date()
    const cutoff = new Date(now)
    cutoff.setHours(21, 0, 0, 0)

    const diffMs = cutoff.getTime() - now.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60))
}

export const isProductVisibleByExpiry = (daysRemaining?: number, hoursRemaining?: number) => {
    if (typeof daysRemaining !== "number") return false
    if (daysRemaining < 0) return false
    if (daysRemaining > 0) return true

    const effectiveHours =
        typeof hoursRemaining === "number" ? hoursRemaining : getHoursUntilCutoff21()

    return effectiveHours > 0
}

export const getTimeLeftText = (daysRemaining?: number, hoursRemaining?: number) => {
    if (typeof daysRemaining !== "number") return ""
    if (daysRemaining < 0) return "Đã hết hạn"

    if (daysRemaining === 0) {
        const effectiveHours =
            typeof hoursRemaining === "number" ? hoursRemaining : getHoursUntilCutoff21()

        if (effectiveHours <= 0) return "Trong ngày"
        return "Trong ngày"
    }

    if (daysRemaining === 1) return "Còn 1 ngày"
    return `Còn ${daysRemaining} ngày`
}

export const getDiscountLabel = (originalPrice?: number, finalPrice?: number) => {
    const original = Number(originalPrice ?? 0)
    const final = Number(finalPrice ?? 0)

    if (original <= 0 || final <= 0 || final >= original) return ""

    const percent = Math.round(((original - final) / original) * 100)
    return `-${percent}%`
}

export const inferImageVariant = (
    name: string,
    category?: string
): HomeProductView["imageVariant"] => {
    const text = `${name} ${category ?? ""}`.toLowerCase()

    if (text.includes("sữa") || text.includes("milk") || text.includes("trứng")) return "milk"
    if (text.includes("bánh") || text.includes("bread")) return "bread"
    if (text.includes("thịt") || text.includes("bò") || text.includes("gà")) return "beef"
    if (text.includes("bơ") || text.includes("rau") || text.includes("quả")) return "avocado"

    return undefined
}

export const formatSupermarketLabel = (supermarketId?: string) => {
    if (!supermarketId) return "Siêu thị gần bạn"
    return `Siêu thị ${supermarketId.slice(0, 8)}`
}

type RawHomeLotApiItem = HomeProductLotApiItem & {
    ConversionRate?: number
    ProductUnitId?: string
    ProductUnitName?: string
    ProductUnitType?: string
    ProductUnitSymbol?: string
    ProductConversionRate?: number
    UnitType?: string
    UnitSymbol?: string
    ProductImagePreSignedUrl?: string | null
}

export const normalizeHomeLotApiItem = (
    item: RawHomeLotApiItem,
): HomeProductLotApiItem => ({
    ...item,
    productImagePreSignedUrl:
        item.productImagePreSignedUrl ?? item.ProductImagePreSignedUrl ?? null,
    unitType: item.unitType ?? item.UnitType,
    unitSymbol: item.unitSymbol ?? item.UnitSymbol,
    conversionRate: item.conversionRate ?? item.ConversionRate ?? 1,
    productUnitId: item.productUnitId ?? item.ProductUnitId,
    productUnitName: item.productUnitName ?? item.ProductUnitName,
    productUnitType: item.productUnitType ?? item.ProductUnitType,
    productUnitSymbol: item.productUnitSymbol ?? item.ProductUnitSymbol,
    productConversionRate:
        item.productConversionRate ?? item.ProductConversionRate ?? 1,
})

export const mapProductLotFromApi = (
    item: HomeProductLotApiItem,
    supermarketNameMap: Map<string, string>
): HomeProductView => {
    const originalPrice = Number(item.originalUnitPrice ?? 0)
    const suggestedPrice = Number(item.suggestedUnitPrice ?? 0)
    const finalPrice = Number(item.finalUnitPrice ?? 0)
    const sellingPrice = Number(item.sellingUnitPrice ?? 0)

    const resolvedPrice =
        sellingPrice > 0
            ? sellingPrice
            : finalPrice > 0
                ? finalPrice
                : suggestedPrice > 0
                    ? suggestedPrice
                    : originalPrice

    const fallbackImage = item.productImages?.find((img) => img.imageUrl)?.imageUrl || ""
    const rawImageUrl =
        item.productImageUrl || item.mainImageUrl || fallbackImage || undefined
    const displayImageUrl =
        item.productImagePreSignedUrl?.trim() || rawImageUrl

    const resolvedCategory = resolveCategoryFromApi(item)

    const supermarketName =
        item.supermarketName ||
        supermarketNameMap.get(item.supermarketId) ||
        formatSupermarketLabel(item.supermarketId)

    const daysToExpiry =
        typeof item.daysRemaining === "number" ? item.daysRemaining : null

    const hoursRemaining =
        typeof item.hoursRemaining === "number" ? item.hoursRemaining : null

    return {
        lotId: item.lotId,
        productId: item.productId,
        supermarketId: item.supermarketId,
        supermarketName,
        name: item.productName || "Sản phẩm",
        brand: item.brand || "",
        subtitle: supermarketName,
        category: resolvedCategory.categoryName,
        categoryId: resolvedCategory.categoryId,
        originalPrice: originalPrice > 0 ? originalPrice : resolvedPrice,
        price: resolvedPrice,
        discountLabel: getDiscountLabel(
            originalPrice > 0 ? originalPrice : resolvedPrice,
            resolvedPrice
        ),
        timeLeft: getTimeLeftText(item.daysRemaining, item.hoursRemaining),
        imageUrl: rawImageUrl,
        preSignedImageUrl: displayImageUrl,
        imageVariant: inferImageVariant(item.productName || "", resolvedCategory.categoryName),
        isFreshFood: resolvedCategory.isFreshFood,
        daysToExpiry,
        hoursRemaining,
        quantity: Number(item.quantity ?? 0),

        unitId: item.unitId,
        unitName: item.unitName,
        unitType: item.unitType,
        unitSymbol: item.unitSymbol,
        conversionRate: item.conversionRate,
        productUnitId: item.productUnitId,
        productUnitName: item.productUnitName,
        productUnitType: item.productUnitType,
        productUnitSymbol: item.productUnitSymbol,
        productConversionRate: item.productConversionRate,
    }
}

const inferCategoryFallback = (name?: string) => {
    const lower = (name ?? "").toLowerCase()

    if (lower.includes("sữa") || lower.includes("trứng")) return "Sữa & Trứng"
    if (lower.includes("bánh") || lower.includes("mì")) return "Bánh mì & Khô"

    if (
        lower.includes("rau") ||
        lower.includes("củ") ||
        lower.includes("quả") ||
        lower.includes("bơ")
    ) {
        return "Nông sản"
    }

    if (
        lower.includes("thịt") ||
        lower.includes("bò") ||
        lower.includes("gà") ||
        lower.includes("heo")
    ) {
        return "Thịt & Gia cầm"
    }

    return "Thực phẩm"
}

const resolveCategoryFromApi = (item: HomeProductLotApiItem) => {
    const categoryObject =
        item.category && typeof item.category === "object" ? item.category : undefined

    const categoryName =
        categoryObject?.name?.trim() ||
        item.categoryRef?.name?.trim() ||
        item.categoryName?.trim() ||
        item.productCategory?.trim() ||
        (typeof item.category === "string" ? item.category.trim() : "")

    return {
        categoryId:
            categoryObject?.categoryId ||
            item.categoryRef?.categoryId ||
            item.categoryId ||
            undefined,
        categoryName: categoryName || inferCategoryFallback(item.productName),
        isFreshFood:
            typeof item.isFreshFood === "boolean"
                ? item.isFreshFood
                : !!categoryObject?.isFreshFood || !!item.categoryRef?.isFreshFood,
    }
}

export const groupHomeProductsByProduct = (
    products: HomeProductView[],
    rawProducts: HomeProductLotApiItem[] = []
): HomeProductGroupView[] => {
    const rawByLotId = new Map(rawProducts.map((item) => [item.lotId, item]))
    const groupMap = new Map<string, HomeProductGroupView>()

    products.forEach((product) => {
        const rawLot = rawByLotId.get(product.lotId)
        const current = groupMap.get(product.productId)

        if (!current) {
            groupMap.set(product.productId, {
                productId: product.productId,
                name: product.name,
                brand: product.brand,
                subtitle: buildProductGroupSubtitle(product),
                category: product.category,
                categoryId: product.categoryId,
                imageUrl: product.imageUrl,
                preSignedImageUrl: product.preSignedImageUrl,
                imageVariant: product.imageVariant,
                isFreshFood: product.isFreshFood,

                minPrice: product.price,
                maxPrice: product.price,
                originalMinPrice: product.originalPrice,
                originalMaxPrice: product.originalPrice,
                discountLabel: product.discountLabel,

                totalQuantity: product.quantity,
                supermarketCount: 1,
                supermarketNames: product.supermarketName ? [product.supermarketName] : [],
                unitNames: [
                    ...(rawLot?.productUnitName ? [rawLot.productUnitName] : []),
                    ...(rawLot?.unitName ? [rawLot.unitName] : []),
                ],

                nearestExpiryDate: rawLot?.expiryDate,
                nearestDaysToExpiry: product.daysToExpiry,
                nearestHoursRemaining: product.hoursRemaining,
                timeLeft: product.timeLeft,

                lots: [product],
                rawLots: rawLot ? [rawLot] : [],
            })
            return
        }

        const supermarketNames = new Set(current.supermarketNames)
        if (product.supermarketName) supermarketNames.add(product.supermarketName)

        const unitNames = new Set(current.unitNames)
        if (rawLot?.unitName) unitNames.add(rawLot.unitName)
        if (rawLot?.productUnitName) unitNames.add(rawLot.productUnitName)

        const nextLots = [...current.lots, product]
        const nextRawLots = rawLot ? [...current.rawLots, rawLot] : current.rawLots

        const nearestLot = getNearestExpiryLot([
            ...current.lots,
            product,
        ])

        current.minPrice = Math.min(current.minPrice, product.price)
        current.maxPrice = Math.max(current.maxPrice, product.price)
        current.originalMinPrice = Math.min(current.originalMinPrice, product.originalPrice)
        current.originalMaxPrice = Math.max(current.originalMaxPrice, product.originalPrice)
        current.totalQuantity += product.quantity
        current.supermarketNames = Array.from(supermarketNames)
        current.supermarketCount = current.supermarketNames.length
        current.unitNames = Array.from(unitNames)
        current.lots = nextLots
        current.rawLots = nextRawLots

        if (nearestLot) {
            current.nearestDaysToExpiry = nearestLot.daysToExpiry
            current.nearestHoursRemaining = nearestLot.hoursRemaining
            current.timeLeft = nearestLot.timeLeft

            const nearestRawLot = rawByLotId.get(nearestLot.lotId)
            current.nearestExpiryDate = nearestRawLot?.expiryDate
        }

        if (!current.preSignedImageUrl && product.preSignedImageUrl) {
            current.preSignedImageUrl = product.preSignedImageUrl
            current.imageUrl = product.imageUrl ?? current.imageUrl
        }

        current.discountLabel = getBestDiscountLabel(current.lots)
        current.subtitle = buildProductGroupSubtitle(current)
    })

    return Array.from(groupMap.values()).sort((a, b) => {
        const aDays = a.nearestDaysToExpiry ?? Number.MAX_SAFE_INTEGER
        const bDays = b.nearestDaysToExpiry ?? Number.MAX_SAFE_INTEGER

        if (aDays !== bDays) return aDays - bDays
        return a.minPrice - b.minPrice
    })
}

const buildProductGroupSubtitle = (
    product: Pick<
        HomeProductGroupView,
        "supermarketCount" | "unitNames" | "totalQuantity"
    > | HomeProductView
) => {
    if ("supermarketCount" in product) {
        const unitText = product.unitNames.length
            ? ` · ${product.unitNames.slice(0, 2).join(", ")}`
            : ""

        return `${product.supermarketCount} siêu thị${unitText} · còn ${product.totalQuantity}`
    }

    return product.subtitle
}

const getNearestExpiryLot = (lots: HomeProductView[]) => {
    return lots
        .filter((lot) => typeof lot.daysToExpiry === "number")
        .sort((a, b) => {
            const aDays = a.daysToExpiry ?? Number.MAX_SAFE_INTEGER
            const bDays = b.daysToExpiry ?? Number.MAX_SAFE_INTEGER

            if (aDays !== bDays) return aDays - bDays

            const aHours = a.hoursRemaining ?? Number.MAX_SAFE_INTEGER
            const bHours = b.hoursRemaining ?? Number.MAX_SAFE_INTEGER

            return aHours - bHours
        })[0]
}

const getBestDiscountLabel = (lots: HomeProductView[]) => {
    const bestPercent = lots.reduce((max, lot) => {
        if (!lot.discountLabel.startsWith("-")) return max

        const percent = Number(lot.discountLabel.replace(/[^\d]/g, ""))
        if (Number.isNaN(percent)) return max

        return Math.max(max, percent)
    }, 0)

    return bestPercent > 0 ? `-${bestPercent}%` : ""
}

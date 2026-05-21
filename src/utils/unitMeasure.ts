export type UnitMeasureLike = {
    name?: string | null
    symbol?: string | null
    type?: string | null
    conversionRate?: number | null
}

export type UnitMeasureKind = "COUNT" | "WEIGHT" | "UNKNOWN"

/** Phân loại đơn vị: đếm (số lượng) vs khối lượng. */
export const normalizeUnitMeasureKind = (value?: string | null): UnitMeasureKind => {
    const normalized = value?.trim().toLowerCase() || ""

    if (
        normalized.includes("đếm") ||
        normalized.includes("count") ||
        normalized.includes("fixed") ||
        normalized.includes("piece") ||
        normalized.includes("cố định") ||
        normalized.includes("số lượng")
    ) {
        return "COUNT"
    }

    if (
        normalized.includes("khối lượng") ||
        normalized.includes("weight") ||
        normalized.includes("mass") ||
        normalized.includes("variable") ||
        normalized.includes("kg") ||
        normalized.includes("gram") ||
        normalized.includes("gam")
    ) {
        return "WEIGHT"
    }

    return "UNKNOWN"
}

export const formatUnitDisplay = (
    name?: string | null,
    symbol?: string | null,
    fallback = "—",
) => {
    const safeName = name?.trim() || fallback
    const safeSymbol = symbol?.trim() || ""

    if (!safeName || safeName === "—") return "—"
    return safeSymbol ? `${safeName} (${safeSymbol})` : safeName
}

export const formatConversionRateValue = (rate?: number | null) => {
    if (rate == null || Number.isNaN(rate)) return "1"
    return Number(rate).toLocaleString("vi-VN", {
        maximumFractionDigits: 6,
    })
}

/** Mô tả hệ số quy đổi (khớp BE: qty_base = qty × conversionRate). */
export const formatConversionRateHint = (unit: UnitMeasureLike): string | null => {
    const rate = unit.conversionRate ?? 1
    if (rate === 1) return null

    const typeLabel = unit.type?.trim() || "cùng loại"
    const unitName = unit.name?.trim() || "đơn vị"

    return `1 ${unitName} = ${formatConversionRateValue(rate)} đơn vị gốc (${typeLabel})`
}

export const formatConversionRateHintWithBase = (
    unit: UnitMeasureLike,
    allUnits: UnitMeasureLike[],
): string | null => {
    const rate = unit.conversionRate ?? 1
    if (rate === 1) return null

    const unitName = unit.name?.trim() || "đơn vị"
    const typeKey = unit.type?.trim().toLowerCase() || ""

    const baseCandidates = allUnits.filter((candidate) => {
        if ((candidate.type?.trim().toLowerCase() || "") !== typeKey) return false
        return (candidate.conversionRate ?? 1) === 1 && candidate.name?.trim()
    })

    const baseUnit =
        baseCandidates.find(
            (candidate) =>
                candidate.name?.trim().toLowerCase() !== unitName.toLowerCase(),
        ) ?? baseCandidates[0]

    if (baseUnit?.name) {
        return `1 ${unitName} = ${formatConversionRateValue(rate)} ${baseUnit.name}`
    }

    return formatConversionRateHint(unit)
}

export const formatUnitOptionLabel = (
    unit: UnitMeasureLike,
    allUnits?: UnitMeasureLike[],
) => {
    const label = formatUnitDisplay(unit.name, unit.symbol)
    const hint = allUnits?.length
        ? formatConversionRateHintWithBase(unit, allUnits)
        : formatConversionRateHint(unit)

    if (!hint) return label
    return `${label} · ${hint}`
}

export type LotUnitContext = {
    unitId?: string | null
    unitName?: string | null
    unitSymbol?: string | null
    unitType?: string | null
    conversionRate?: number | null
    productUnitId?: string | null
    productUnitName?: string | null
    productUnitSymbol?: string | null
    productConversionRate?: number | null
}

export const convertQuantityBetweenRates = (
    quantity: number,
    fromRate?: number | null,
    toRate?: number | null,
) => {
    const from = fromRate ?? 1
    const to = toRate ?? 1
    if (from <= 0 || to <= 0) return quantity
    return (quantity * from) / to
}

export const convertUnitPriceBetweenRates = (
    unitPrice: number,
    fromRate?: number | null,
    toRate?: number | null,
) => {
    const from = fromRate ?? 1
    const to = toRate ?? 1
    if (from <= 0 || to <= 0) return unitPrice
    return unitPrice * (to / from)
}

export const formatCustomerLotUnitSummary = (ctx: LotUnitContext) => {
    const lotUnit = formatUnitDisplay(ctx.unitName, ctx.unitSymbol)
    return lotUnit
}

export type OrderItemUnitLike = {
    quantity: number
    purchaseUnitId?: string | null
    purchaseUnitName?: string | null
    purchaseUnitSymbol?: string | null
    purchaseQuantity?: number | null
    productUnitName?: string | null
    productUnitSymbol?: string | null
}

export const formatOrderItemPurchaseQuantityLine = (item: OrderItemUnitLike) => {
    const purchaseName = item.purchaseUnitName?.trim()
    const purchaseSymbol = item.purchaseUnitSymbol?.trim()
    const purchaseLabel = formatUnitDisplay(purchaseName, purchaseSymbol, "")

    if (purchaseLabel && purchaseLabel !== "—") {
        const qty =
            item.purchaseQuantity != null && !Number.isNaN(item.purchaseQuantity)
                ? item.purchaseQuantity
                : item.quantity
        return `${qty} ${purchaseLabel}`
    }

    return `${item.quantity} ${formatUnitDisplay(item.productUnitName, item.productUnitSymbol, "đơn vị")}`
}

export const formatCustomerPurchaseUnitHint = (ctx: LotUnitContext) => {
    const lotRate = ctx.conversionRate ?? 1
    const productRate = ctx.productConversionRate ?? 1
    const lotName = ctx.unitName?.trim() || "đơn vị lô"
    const productName = ctx.productUnitName?.trim() || "đơn vị sản phẩm"

    const sameUnit =
        ctx.unitId &&
        ctx.productUnitId &&
        ctx.unitId === ctx.productUnitId

    if (sameUnit && lotRate === 1) {
        return `Bạn mua theo đơn vị ${lotName}.`
    }

    const lines: string[] = [`Bạn mua theo đơn vị lô: ${formatUnitDisplay(ctx.unitName, ctx.unitSymbol)}.`]

    if (!sameUnit) {
        lines.push(`Sản phẩm chuẩn: ${formatUnitDisplay(ctx.productUnitName, ctx.productUnitSymbol)}.`)
    }

    if (lotRate !== 1) {
        const baseHint = formatConversionRateHint({
            name: lotName,
            type: ctx.unitType,
            conversionRate: lotRate,
        })
        if (baseHint) lines.push(baseHint + ".")
    }

    if (!sameUnit && lotRate !== productRate) {
        lines.push(
            `1 ${lotName} ≈ ${formatConversionRateValue(
                convertQuantityBetweenRates(1, lotRate, productRate),
            )} ${productName} (quy đổi khi đặt hàng).`,
        )
    }

    return lines.join(" ")
}

export const formatCustomerQuantityEquivalence = (
    qty: number,
    ctx: LotUnitContext,
) => {
    if (qty <= 0) return null

    const lotRate = ctx.conversionRate ?? 1
    const productRate = ctx.productConversionRate ?? 1
    const sameUnit =
        ctx.unitId && ctx.productUnitId && ctx.unitId === ctx.productUnitId

    if (sameUnit || lotRate === productRate) return null

    const productName = ctx.productUnitName?.trim() || "đơn vị sản phẩm"
    const lotName = ctx.unitName?.trim() || "đơn vị lô"
    const equivalent = convertQuantityBetweenRates(qty, lotRate, productRate)

    if (!Number.isFinite(equivalent)) return null

    const formattedQty = Number.isInteger(equivalent)
        ? equivalent.toLocaleString("vi-VN")
        : equivalent.toLocaleString("vi-VN", { maximumFractionDigits: 2 })

    return `${qty.toLocaleString("vi-VN")} ${lotName} ≈ ${formattedQty} ${productName}`
}

export const formatCustomerUnitPriceHint = (
    unitPrice: number,
    ctx: LotUnitContext,
) => {
    const lotRate = ctx.conversionRate ?? 1
    const productRate = ctx.productConversionRate ?? 1
    const sameUnit =
        ctx.unitId && ctx.productUnitId && ctx.unitId === ctx.productUnitId

    if (sameUnit || lotRate === productRate || unitPrice <= 0) return null

    const productName = ctx.productUnitName?.trim() || "đơn vị sản phẩm"
    const priceInProductUnit = convertUnitPriceBetweenRates(
        unitPrice,
        lotRate,
        productRate,
    )

    return `≈ ${priceInProductUnit.toLocaleString("vi-VN")} đ / ${productName}`
}

import type { HomeProductLotApiItem } from "@/types/home.type"
import type { ProductPurchaseUnit } from "@/types/purchase-unit.type"

const upsertUnit = (
    map: Map<string, ProductPurchaseUnit>,
    unit: Partial<ProductPurchaseUnit> & Pick<ProductPurchaseUnit, "unitId" | "name">,
) => {
    if (!unit.unitId) return

    const existing = map.get(unit.unitId)
    map.set(unit.unitId, {
        unitId: unit.unitId,
        name: unit.name,
        type: unit.type ?? existing?.type ?? "Count",
        symbol: unit.symbol ?? existing?.symbol ?? "",
        conversionRate: unit.conversionRate ?? existing?.conversionRate ?? 1,
        isProductDefault: unit.isProductDefault ?? existing?.isProductDefault ?? false,
        hasPublishedLot: unit.hasPublishedLot ?? existing?.hasPublishedLot ?? false,
    })
}

const sameUnitType = (a?: string | null, b?: string | null) => {
    const left = a?.trim()
    const right = b?.trim()
    if (!left || !right) return false
    return left.toLowerCase() === right.toLowerCase()
}

/** Chỉ giữ đơn vị cùng loại (Type) với đơn vị chuẩn sản phẩm. */
export const filterPurchaseUnitsByProductType = (
    units: ProductPurchaseUnit[],
    productUnitType?: string | null,
): ProductPurchaseUnit[] => {
    const type = productUnitType?.trim()
    if (!type) return units
    return units.filter((unit) => sameUnitType(unit.type, type))
}

/** Gộp đơn vị từ API + các lô đã load (tránh chỉ còn đơn vị chuẩn SP). */
export const mergePurchaseUnits = (
    fromApi: ProductPurchaseUnit[],
    rawLots: HomeProductLotApiItem[],
): ProductPurchaseUnit[] => {
    const map = new Map<string, ProductPurchaseUnit>()

    for (const unit of fromApi) {
        upsertUnit(map, unit)
    }

    for (const lot of rawLots) {
        if (lot.unitId && lot.unitName) {
            upsertUnit(map, {
                unitId: lot.unitId,
                name: lot.unitName,
                symbol: lot.unitSymbol,
                type: lot.unitType,
                conversionRate: lot.conversionRate,
                hasPublishedLot: true,
            })
        }

        if (lot.productUnitId && lot.productUnitName) {
            upsertUnit(map, {
                unitId: lot.productUnitId,
                name: lot.productUnitName,
                symbol: lot.productUnitSymbol,
                type: lot.productUnitType,
                conversionRate: lot.productConversionRate,
                isProductDefault: true,
            })
        }
    }

    return Array.from(map.values()).sort((a, b) => {
        if (a.isProductDefault !== b.isProductDefault) {
            return a.isProductDefault ? -1 : 1
        }
        if (a.hasPublishedLot !== b.hasPublishedLot) {
            return a.hasPublishedLot ? -1 : 1
        }
        return a.name.localeCompare(b.name, "vi")
    })
}

export const parsePurchaseUnitsResponse = (body: unknown): ProductPurchaseUnit[] => {
    if (!body || typeof body !== "object") return []

    const record = body as Record<string, unknown>
    const raw = record.data ?? record.Data

    if (!Array.isArray(raw)) return []

    return raw.map((item) => {
        const row = item as Record<string, unknown>
        return {
            unitId: String(row.unitId ?? row.UnitId ?? ""),
            name: String(row.name ?? row.Name ?? ""),
            type: String(row.type ?? row.Type ?? "Count"),
            symbol: String(row.symbol ?? row.Symbol ?? ""),
            conversionRate: Number(row.conversionRate ?? row.ConversionRate ?? 1),
            isProductDefault: Boolean(
                row.isProductDefault ?? row.IsProductDefault ?? false,
            ),
            hasPublishedLot: Boolean(
                row.hasPublishedLot ?? row.HasPublishedLot ?? false,
            ),
        }
    })
}

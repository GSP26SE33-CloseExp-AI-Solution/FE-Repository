import { normalizeUnitMeasureKind } from "@/utils/unitMeasure"

export const COUNT_UNIT_TYPE = "Đếm"
export const WEIGHT_UNIT_TYPE = "Khối lượng"

export const getAllowedUnitTypeForCategory = (isFreshFood: boolean) =>
    isFreshFood ? WEIGHT_UNIT_TYPE : COUNT_UNIT_TYPE

export const getAllowedUnitMeasureKindForCategory = (isFreshFood: boolean) =>
    isFreshFood ? "WEIGHT" : "COUNT"

export const isUnitTypeAllowedForCategory = (
    unitType?: string | null,
    isFreshFood?: boolean,
) => {
    const expectedKind = getAllowedUnitMeasureKindForCategory(Boolean(isFreshFood))
    return normalizeUnitMeasureKind(unitType) === expectedKind
}

export const isBaseProductUnit = (conversionRate?: number | null) =>
    (conversionRate ?? 1) === 1

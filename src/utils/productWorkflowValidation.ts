import type { ProductFormState } from "@/types/product-ai-workflow.type"
import {
    getAllowedUnitTypeForCategory,
    isBaseProductUnit,
    isUnitTypeAllowedForCategory,
} from "@/utils/categoryUnitType"

export const getMissingProductFieldsForLot = (form: ProductFormState): string[] => {
    const missing: string[] = []

    if (!form.name.trim()) missing.push("Tên sản phẩm")
    if (!form.categoryId.trim() && !form.categoryName.trim()) missing.push("Danh mục")
    if (!form.barcode.trim()) missing.push("Mã vạch")
    if (!form.unitId.trim()) missing.push("Đơn vị chuẩn")
    if (!form.isFreshFood && !form.brand.trim()) missing.push("Thương hiệu")

    return missing
}

type UnitOptionLike = {
    unitId: string
    unitType?: string
    conversionRate?: number
}

export const filterProductUnitsForCategory = <T extends UnitOptionLike>(
    units: T[],
    isFreshFood: boolean,
): T[] =>
    units.filter(
        (unit) =>
            isUnitTypeAllowedForCategory(unit.unitType, isFreshFood) &&
            isBaseProductUnit(unit.conversionRate),
    )

export const getProductUnitTypeHint = (isFreshFood: boolean) => {
    const allowedType = getAllowedUnitTypeForCategory(isFreshFood)
    return isFreshFood
        ? `Danh mục tươi sống — chỉ chọn đơn vị loại ${allowedType} (kg, g…).`
        : `Danh mục đóng gói — chỉ chọn đơn vị loại ${allowedType} (chai, hộp, gói…).`
}

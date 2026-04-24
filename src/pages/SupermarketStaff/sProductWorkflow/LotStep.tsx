import React from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

import type {
    ExistingProductSummaryDto,
    LotFormState,
    WorkflowCreateAndPublishLotResultDto,
    WorkflowCreateProductResultDto,
} from "@/types/product-ai-workflow.type"
import {
    CheckboxField,
    CurrencyField,
    DateField,
    Field,
    formatCurrencyVN,
    InfoRow,
    NumberField,
    SectionCard,
    TextareaField,
    cn,
} from "./WorkflowShared"
import { mapProductStateLabel } from "@/mappers/product-ai.mapper"

type ProductUnitOption = {
    unitId: string
    label: string
    value: string
    unitType?: string
    unitSymbol?: string
}

type Props = {
    ownProduct: ExistingProductSummaryDto | null
    createdProduct: WorkflowCreateProductResultDto | null
    selectedUnit?: ProductUnitOption
    form: LotFormState
    loading: boolean
    createdLot: WorkflowCreateAndPublishLotResultDto | null
    isFreshFood?: boolean
    onChange: (next: LotFormState) => void
    onBack: () => void
    onSubmit: () => void
}

const formatDateTimeVN = (value?: string | null) => {
    if (!value) return "—"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"

    return date.toLocaleString("vi-VN")
}

const stringifyNutritionFacts = (value?: Record<string, string> | null) => {
    if (!value || Object.keys(value).length === 0) return "—"

    return Object.entries(value)
        .map(([key, itemValue]) => `${key}: ${itemValue}`)
        .join(" | ")
}

const formatUnit = (name?: string | null, symbol?: string | null) => {
    const safeName = name?.trim() || "—"
    const safeSymbol = symbol?.trim() || ""

    if (safeName === "—") return "—"
    return safeSymbol ? `${safeName} (${safeSymbol})` : safeName
}

const normalizeUnitType = (value?: string | null) => {
    const normalized = value?.trim().toLowerCase() || ""

    if (
        normalized.includes("variable") ||
        normalized.includes("weight") ||
        normalized.includes("mass") ||
        normalized.includes("kg") ||
        normalized.includes("gram") ||
        normalized.includes("khối lượng")
    ) {
        return "VARIABLE"
    }

    if (
        normalized.includes("fixed") ||
        normalized.includes("piece") ||
        normalized.includes("unit") ||
        normalized.includes("cố định") ||
        normalized.includes("số lượng")
    ) {
        return "FIXED"
    }

    return "UNKNOWN"
}

const WorkflowLotStep: React.FC<Props> = ({
    ownProduct,
    createdProduct,
    selectedUnit,
    form,
    loading,
    createdLot,
    isFreshFood = false,
    onChange,
    onBack,
    onSubmit,
}) => {
    const effectiveProductId = createdProduct?.productId || ownProduct?.productId || ""
    const effectiveProductName =
        createdProduct?.name || ownProduct?.name || "Chưa có tên sản phẩm"

    const effectiveBarcode = createdProduct?.barcode || ownProduct?.barcode || "—"
    const effectiveBrand = createdProduct?.brand || ownProduct?.brand || "—"
    const effectiveCategory = createdProduct?.category || ownProduct?.category || "—"
    const effectiveManufacturer =
        createdProduct?.manufacturer || ownProduct?.manufacturer || "—"
    
    const stockLot = createdLot?.stockLot
    const pricing = createdLot?.pricingSuggestion

    const effectiveUnit = formatUnit(
        stockLot?.unitName || createdProduct?.unitName || selectedUnit?.label,
        stockLot?.unitSymbol || createdProduct?.unitSymbol || selectedUnit?.unitSymbol,
    )

    const effectiveUnitType = normalizeUnitType(
        stockLot?.unitType || createdProduct?.unitType || selectedUnit?.unitType,
    )

    const quantityValid = typeof form.quantity === "number" && form.quantity > 0
    const weightValid = typeof form.weight === "number" && form.weight > 0

    const requiredAmountValid =
        effectiveUnitType === "VARIABLE"
            ? weightValid
            : effectiveUnitType === "FIXED"
                ? quantityValid
                : quantityValid || weightValid

    const amountHint =
        effectiveUnitType === "VARIABLE"
            ? "Đơn vị theo khối lượng nên cần nhập khối lượng."
            : effectiveUnitType === "FIXED"
                ? "Đơn vị cố định nên cần nhập số lượng."
                : "Chưa xác định được loại đơn vị, bạn có thể nhập số lượng hoặc khối lượng."

    const canSubmit = Boolean(
        effectiveProductId &&
        form.expiryDate &&
        typeof form.originalUnitPrice === "number" &&
        form.originalUnitPrice > 0 &&
        requiredAmountValid &&
        (form.acceptedSuggestion ||
            (typeof form.finalUnitPrice === "number" && form.finalUnitPrice > 0)),
    )

    return (
        <div className="space-y-5">
            <SectionCard
                title="Bước 3: Tạo lô hàng, định giá và đăng bán"
                description="Bước này chỉ dùng sản phẩm thuộc siêu thị hiện tại."
            >
                <div className="mb-5 grid gap-4 md:grid-cols-2">
                    <Field label="Mã sản phẩm" value={effectiveProductId} readOnly />
                    <Field label="Tên sản phẩm" value={effectiveProductName} readOnly />
                    <Field label="Mã vạch" value={effectiveBarcode} readOnly />
                    <Field label="Thương hiệu" value={effectiveBrand} readOnly />
                    <Field label="Danh mục" value={effectiveCategory} readOnly />
                    <Field label="Đơn vị" value={effectiveUnit} readOnly />
                    <Field
                        label="Loại thực phẩm"
                        value={isFreshFood ? "Tươi sống" : "Thông thường"}
                        readOnly
                    />
                    <Field label="Nhà sản xuất" value={effectiveManufacturer} readOnly />

                    <DateField
                        label="Hạn sử dụng *"
                        value={form.expiryDate}
                        onChange={(value) => onChange({ ...form, expiryDate: value })}
                    />

                    <DateField
                        label="Ngày sản xuất"
                        value={form.manufactureDate}
                        onChange={(value) => onChange({ ...form, manufactureDate: value })}
                    />

                    <NumberField
                        label={effectiveUnitType === "FIXED" ? "Số lượng *" : "Số lượng"}
                        value={form.quantity}
                        onChange={(value) => onChange({ ...form, quantity: value })}
                    />

                    <NumberField
                        label={effectiveUnitType === "VARIABLE" ? "Khối lượng *" : "Khối lượng"}
                        value={form.weight}
                        onChange={(value) => onChange({ ...form, weight: value })}
                    />

                    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {amountHint}
                    </div>

                    <CurrencyField
                        label="Giá gốc *"
                        value={form.originalUnitPrice}
                        onChange={(value) => onChange({ ...form, originalUnitPrice: value })}
                    />

                    <CurrencyField
                        label="Giá bán mong muốn"
                        value={form.finalUnitPrice}
                        onChange={(value) => onChange({ ...form, finalUnitPrice: value })}
                    />

                    <div className="md:col-span-2">
                        <TextareaField
                            label="Ghi chú về giá"
                            value={form.priceFeedback}
                            onChange={(value) => onChange({ ...form, priceFeedback: value })}
                        />
                    </div>

                    <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                        <CheckboxField
                            label="Dùng giá gợi ý từ hệ thống"
                            checked={form.acceptedSuggestion}
                            onChange={(checked) =>
                                onChange({ ...form, acceptedSuggestion: checked })
                            }
                        />
                        <CheckboxField
                            label="Dùng dữ liệu nhập tay thay cho dữ liệu hệ thống"
                            checked={form.isManualFallback}
                            onChange={(checked) =>
                                onChange({ ...form, isManualFallback: checked })
                            }
                        />
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Quay lại
                    </button>

                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={!canSubmit || loading}
                        className={cn(
                            "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition",
                            canSubmit && !loading
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "cursor-not-allowed bg-slate-100 text-slate-400",
                        )}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}
                        Tạo lô hàng, định giá và đăng bán
                    </button>
                </div>
            </SectionCard>

            {createdLot ? (
                <SectionCard
                    title="Kết quả vừa tạo"
                    description="Thông tin lô hàng sau khi hoàn tất đăng bán sản phẩm."
                >
                    <div className="space-y-3 text-sm text-slate-600">
                        <InfoRow label="Mã lô hàng" value={stockLot?.lotId || createdLot.lotId} />
                        <InfoRow label="Mã sản phẩm" value={createdLot.productId} />
                        <InfoRow label="Giai đoạn" value={createdLot.phase || "—"} />
                        <InfoRow
                            label="Tên sản phẩm"
                            value={stockLot?.productName || effectiveProductName}
                        />
                        <InfoRow
                            label="Mã vạch sản phẩm"
                            value={stockLot?.productBarcode || effectiveBarcode}
                        />
                        <InfoRow
                            label="Thương hiệu sản phẩm"
                            value={stockLot?.productBrand || effectiveBrand}
                        />
                        <InfoRow
                            label="Ảnh sản phẩm"
                            value={stockLot?.productImageUrl || "—"}
                        />
                        <InfoRow
                            label="Danh mục sản phẩm"
                            value={createdLot.productCategory || effectiveCategory}
                        />
                        <InfoRow label="Đơn vị" value={effectiveUnit} />
                        <InfoRow
                            label="Loại thực phẩm"
                            value={isFreshFood ? "Tươi sống" : "Thông thường"}
                        />
                        <InfoRow
                            label="Thông tin dinh dưỡng"
                            value={stringifyNutritionFacts(createdLot.productNutritionFacts)}
                        />
                        <InfoRow
                            label="Nguồn dữ liệu"
                            value={
                                typeof createdLot.isManualFallback === "boolean"
                                    ? createdLot.isManualFallback
                                        ? "Nhập tay"
                                        : "Hệ thống"
                                    : "—"
                            }
                        />
                        <InfoRow
                            label="Trạng thái lô hàng"
                            value={mapProductStateLabel(stockLot?.status)}
                        />
                        <InfoRow
                            label="Giá hệ thống đề xuất"
                            value={formatCurrencyVN(pricing?.suggestedPrice)}
                        />
                        <InfoRow
                            label="Giá gốc"
                            value={formatCurrencyVN(
                                stockLot?.originalPrice ?? pricing?.originalPrice,
                            )}
                        />
                        <InfoRow
                            label="Giá bán cuối"
                            value={formatCurrencyVN(stockLot?.finalPrice)}
                        />
                        <InfoRow
                            label="Số ngày còn lại trước hạn sử dụng"
                            value={
                                typeof stockLot?.daysToExpiry === "number"
                                    ? String(stockLot.daysToExpiry)
                                    : typeof pricing?.daysToExpiry === "number"
                                        ? String(pricing.daysToExpiry)
                                        : "—"
                            }
                        />
                        <InfoRow
                            label="Hạn sử dụng"
                            value={formatDateTimeVN(stockLot?.expiryDate)}
                        />
                        <InfoRow
                            label="Ngày sản xuất"
                            value={formatDateTimeVN(stockLot?.manufactureDate)}
                        />
                        <InfoRow
                            label="Số lượng"
                            value={
                                typeof stockLot?.quantity === "number"
                                    ? String(stockLot.quantity)
                                    : "—"
                            }
                        />
                        <InfoRow
                            label="Khối lượng"
                            value={
                                typeof stockLot?.weight === "number"
                                    ? String(stockLot.weight)
                                    : "—"
                            }
                        />
                        <InfoRow
                            label="Thời điểm tạo"
                            value={formatDateTimeVN(stockLot?.createdAt)}
                        />
                        <InfoRow label="Người tạo" value={stockLot?.createdBy || "—"} />
                        <InfoRow label="Người đăng bán" value={stockLot?.publishedBy || "—"} />
                        <InfoRow
                            label="Thời điểm đăng bán"
                            value={formatDateTimeVN(stockLot?.publishedAt)}
                        />
                    </div>
                </SectionCard>
            ) : null}
        </div>
    )
}

export default WorkflowLotStep

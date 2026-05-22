import React from "react"
import { CheckCircle2, Image as ImageIcon } from "lucide-react"

import type {
    LocalImageFile,
    ProductWorkflowState,
} from "@/types/product-ai-workflow.type"
import type { UnitOption } from "@/types/unit.type"
import {
    formatConversionRateHintWithBase,
    formatConversionRateValue,
} from "@/utils/unitMeasure"
import { InfoRow, SectionCard } from "./WorkflowShared"
import { resolveProductDisplayImageUrl } from "@/utils/productImage"

type Props = {
    workflow: ProductWorkflowState
    images: LocalImageFile[]
    unitOptions?: UnitOption[]
}

const formatMoney = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—"
    return `${value.toLocaleString("vi-VN")} đ`
}

const formatUnit = (name?: string | null, symbol?: string | null, fallback?: string | null) => {
    const safeName = name?.trim() || fallback?.trim() || "—"
    const safeSymbol = symbol?.trim() || ""

    if (safeName === "—") return "—"
    return safeSymbol ? `${safeName} (${safeSymbol})` : safeName
}

const WorkflowSummaryAside: React.FC<Props> = ({ workflow, images, unitOptions = [] }) => {
    const previewImage =
        images[0]?.preview ||
        resolveProductDisplayImageUrl(
            null,
            workflow.createdLot?.stockLot?.productImageUrl,
        ) ||
        resolveProductDisplayImageUrl(null, workflow.createdProduct?.mainImageUrl) ||
        resolveProductDisplayImageUrl(null, workflow.ownProduct?.mainImageUrl) ||
        resolveProductDisplayImageUrl(null, workflow.referenceProduct?.mainImageUrl) ||
        ""

    const ocrConfidence =
        typeof workflow.analyzeResult?.confidence === "number"
            ? `${Math.round(workflow.analyzeResult.confidence * 100)}%`
            : "—"

    const pricingConfidence =
        typeof workflow.createdLot?.stockLot?.pricingConfidence === "number"
            ? `${Math.round(workflow.createdLot.stockLot.pricingConfidence * 100)}%`
            : typeof workflow.createdLot?.pricingSuggestion?.confidence === "number"
                ? `${Math.round(workflow.createdLot.pricingSuggestion.confidence * 100)}%`
                : "—"

    const selectedUnit = unitOptions.find(
        (item) => item.unitId === workflow.productForm.unitId,
    )

    const activeUnit = formatUnit(
        workflow.createdLot?.stockLot?.unitName ||
        workflow.createdProduct?.unitName ||
        workflow.identifyResult?.unitName ||
        selectedUnit?.label,
        workflow.createdLot?.stockLot?.unitSymbol ||
        workflow.createdProduct?.unitSymbol ||
        workflow.identifyResult?.unitSymbol ||
        selectedUnit?.unitSymbol,
        selectedUnit?.label || workflow.productForm.unitId,
    )

    const unitCatalog = unitOptions.map((item) => ({
        name: item.label,
        symbol: item.unitSymbol,
        type: item.unitType,
        conversionRate: item.conversionRate,
    }))

    const activeConversionRate =
        workflow.createdLot?.stockLot?.conversionRate ??
        workflow.createdProduct?.conversionRate ??
        selectedUnit?.conversionRate ??
        1

    const activeUnitConversionHint = selectedUnit
        ? formatConversionRateHintWithBase(
            {
                name: selectedUnit.label,
                symbol: selectedUnit.unitSymbol,
                type: selectedUnit.unitType,
                conversionRate: activeConversionRate,
            },
            unitCatalog,
        )
        : null

    return (
        <div className="space-y-5">
            <SectionCard title="Ảnh hiện tại">
                {previewImage ? (
                    <div className="flex h-[280px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                        <img
                            src={previewImage}
                            alt={workflow.productForm.name || "Xem trước"}
                            className="h-full w-full object-contain"
                        />
                    </div>
                ) : (
                    <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                            <ImageIcon className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">Chưa có hình ảnh</p>
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Tóm tắt quy trình">
                <div className="space-y-3 text-sm text-slate-600">
                    <InfoRow label="Bước hiện tại" value={workflow.step} />
                    <InfoRow label="Mã vạch" value={workflow.barcode || workflow.productForm.barcode || "—"} />
                    <InfoRow label="Đơn vị" value={activeUnit} />
                    {activeUnitConversionHint ? (
                        <InfoRow label="Hệ số quy đổi" value={activeUnitConversionHint} />
                    ) : selectedUnit ? (
                        <InfoRow
                            label="Hệ số quy đổi"
                            value={`${formatConversionRateValue(activeConversionRate)} (đơn vị gốc)`}
                        />
                    ) : null}

                    {workflow.analyzeResult ? (
                        <InfoRow label="Độ tin cậy OCR" value={ocrConfidence} />
                    ) : null}

                    {workflow.createdProduct?.productId || workflow.ownProduct?.productId ? (
                        <InfoRow
                            label="Mã sản phẩm"
                            value={
                                workflow.createdProduct?.productId ||
                                workflow.ownProduct?.productId ||
                                "—"
                            }
                        />
                    ) : null}

                    {workflow.createdLot?.stockLot?.lotId || workflow.createdLot?.lotId ? (
                        <InfoRow
                            label="Mã lô"
                            value={
                                workflow.createdLot?.stockLot?.lotId ||
                                workflow.createdLot?.lotId ||
                                "—"
                            }
                        />
                    ) : null}
                </div>
            </SectionCard>

            {workflow.step === "DONE" && workflow.createdLot ? (
                <SectionCard title="Hoàn tất">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                        <div className="mb-2 flex items-center gap-2 font-semibold">
                            <CheckCircle2 className="h-4 w-4" />
                            Hoàn thành quy trình
                        </div>

                        <div className="space-y-3">
                            <InfoRow
                                label="Mã lô"
                                value={
                                    workflow.createdLot.stockLot?.lotId ||
                                    workflow.createdLot.lotId
                                }
                            />
                            <InfoRow
                                label="Tên sản phẩm"
                                value={workflow.createdLot.stockLot?.productName || "—"}
                            />
                            <InfoRow
                                label="Danh mục"
                                value={workflow.createdLot.productCategory || "—"}
                            />
                            <InfoRow
                                label="Đơn vị"
                                value={formatUnit(
                                    workflow.createdLot.stockLot?.unitName,
                                    workflow.createdLot.stockLot?.unitSymbol,
                                )}
                            />
                            <InfoRow
                                label="Giá đề xuất"
                                value={formatMoney(
                                    workflow.createdLot.pricingSuggestion?.suggestedPrice,
                                )}
                            />
                            <InfoRow
                                label="Giá bán cuối"
                                value={formatMoney(
                                    workflow.createdLot.stockLot?.sellingUnitPrice ??
                                    workflow.createdLot.stockLot?.finalUnitPrice ??
                                    workflow.createdLot.stockLot?.finalPrice,
                                )}
                            />
                            <InfoRow
                                label="Độ tin cậy định giá"
                                value={pricingConfidence}
                            />
                            <InfoRow
                                label="Đã xử lý giá trước khi đăng"
                                value={
                                    typeof workflow.createdLot
                                        .pricingSuggestionResolvedBeforePublish === "boolean"
                                        ? workflow.createdLot
                                            .pricingSuggestionResolvedBeforePublish
                                            ? "Có"
                                            : "Không"
                                        : "—"
                                }
                            />
                            <InfoRow
                                label="Người tạo lô"
                                value={workflow.createdLot.stockLot?.createdBy || "—"}
                            />
                        </div>
                    </div>
                </SectionCard>
            ) : null}
        </div>
    )
}

export default WorkflowSummaryAside

import React from "react"
import { CheckCircle2, Image as ImageIcon } from "lucide-react"

import type {
    LocalImageFile,
    ProductWorkflowState,
} from "@/types/product-ai-workflow.type"
import type { UnitOption } from "@/types/unit.type"
import { mapProductStateLabel } from "@/mappers/product-ai.mapper"
import { InfoRow, SectionCard } from "./WorkflowShared"

type Props = {
    workflow: ProductWorkflowState
    images: LocalImageFile[]
    unitOptions?: UnitOption[]
}

const stringifyNutritionFacts = (value?: Record<string, string> | null) => {
    if (!value || Object.keys(value).length === 0) return "—"
    return Object.entries(value)
        .map(([key, itemValue]) => `${key}: ${itemValue}`)
        .join(" | ")
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
        workflow.createdLot?.stockLot?.productImageUrl ||
        workflow.createdProduct?.mainImageUrl ||
        workflow.ownProduct?.mainImageUrl ||
        workflow.referenceProduct?.mainImageUrl ||
        workflow.analyzeResult?.imageUrl ||
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

    const activeProductName =
        workflow.createdLot?.stockLot?.productName ||
        workflow.createdProduct?.name ||
        workflow.ownProduct?.name ||
        workflow.productForm.name ||
        "—"

    const activeProductCategory =
        workflow.createdLot?.productCategory ||
        workflow.createdProduct?.category ||
        workflow.ownProduct?.category ||
        workflow.productForm.categoryName ||
        "—"

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

    const activeManufacturer =
        workflow.createdProduct?.manufacturer ||
        workflow.ownProduct?.manufacturer ||
        workflow.productForm.manufacturer ||
        "—"

    const finalNutritionFacts =
        stringifyNutritionFacts(workflow.createdLot?.productNutritionFacts) !== "—"
            ? stringifyNutritionFacts(workflow.createdLot?.productNutritionFacts)
            : workflow.productForm.nutritionFacts || "—"

    const activeProductStatus =
        workflow.createdProduct?.status ?? workflow.ownProduct?.status ?? null

    return (
        <div className="space-y-5">
            <SectionCard title="Ảnh sản phẩm">
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
                    <InfoRow label="Chế độ" value={workflow.mode || "—"} />
                    <InfoRow label="Giai đoạn" value={workflow.phase || "—"} />
                    <InfoRow label="Hành động tiếp theo" value={workflow.nextAction || "—"} />
                    <InfoRow label="Mã vạch" value={workflow.barcode || "—"} />
                    <InfoRow label="Đơn vị" value={activeUnit} />
                    <InfoRow label="Độ tin cậy OCR" value={ocrConfidence} />
                    <InfoRow
                        label="Mã sản phẩm"
                        value={
                            workflow.createdProduct?.productId ||
                            workflow.ownProduct?.productId ||
                            "—"
                        }
                    />
                    <InfoRow
                        label="Mã lô"
                        value={
                            workflow.createdLot?.stockLot?.lotId ||
                            workflow.createdLot?.lotId ||
                            "—"
                        }
                    />
                    <InfoRow
                        label="Cho phép tạo lô trực tiếp"
                        value={workflow.canCreateLotDirectly ? "Có" : "Không"}
                    />
                    <InfoRow
                        label="Yêu cầu xác nhận sản phẩm"
                        value={workflow.requiresVerification ? "Có" : "Không"}
                    />
                </div>
            </SectionCard>

            {(workflow.ownProduct || workflow.createdProduct || workflow.createdLot) ? (
                <SectionCard title="Thông tin sản phẩm">
                    <div className="space-y-3 text-sm text-slate-600">
                        <InfoRow label="Tên sản phẩm" value={activeProductName} />
                        <InfoRow
                            label="Trạng thái"
                            value={mapProductStateLabel(activeProductStatus)}
                        />
                        <InfoRow label="Danh mục" value={activeProductCategory} />
                        <InfoRow label="Đơn vị" value={activeUnit} />
                        <InfoRow label="Nhà sản xuất" value={activeManufacturer} />
                    </div>
                </SectionCard>
            ) : null}

            {workflow.referenceProduct ? (
                <SectionCard title="Sản phẩm tham khảo">
                    <div className="space-y-3 text-sm text-slate-600">
                        <InfoRow label="Tên sản phẩm" value={workflow.referenceProduct.name || "—"} />
                        <InfoRow
                            label="Thương hiệu"
                            value={workflow.referenceProduct.brand || "—"}
                        />
                        <InfoRow
                            label="Danh mục"
                            value={workflow.referenceProduct.category || "—"}
                        />
                        <InfoRow
                            label="Mã vạch"
                            value={workflow.referenceProduct.barcode || "—"}
                        />
                        <InfoRow
                            label="Siêu thị"
                            value={workflow.referenceProduct.supermarketName || "—"}
                        />
                    </div>
                </SectionCard>
            ) : null}

            {workflow.analyzeResult ? (
                <SectionCard title="Dữ liệu AI phân tích">
                    <div className="space-y-3 text-sm text-slate-600">
                        <InfoRow
                            label="Tên sản phẩm"
                            value={
                                workflow.analyzeResult.extractedInfo?.name ||
                                workflow.analyzeResult.barcodeLookupInfo?.productName ||
                                "—"
                            }
                        />
                        <InfoRow
                            label="Thương hiệu"
                            value={
                                workflow.analyzeResult.extractedInfo?.brand ||
                                workflow.analyzeResult.barcodeLookupInfo?.brand ||
                                "—"
                            }
                        />
                        <InfoRow
                            label="Danh mục"
                            value={
                                workflow.analyzeResult.extractedInfo?.category ||
                                workflow.analyzeResult.barcodeLookupInfo?.category ||
                                "—"
                            }
                        />
                        <InfoRow
                            label="Mã vạch"
                            value={
                                workflow.analyzeResult.extractedInfo?.barcode ||
                                workflow.analyzeResult.barcodeLookupInfo?.barcode ||
                                "—"
                            }
                        />
                    </div>
                </SectionCard>
            ) : null}

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
                                value={formatMoney(workflow.createdLot.stockLot?.finalPrice)}
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
                            <InfoRow
                                label="Thông tin dinh dưỡng"
                                value={finalNutritionFacts}
                            />
                        </div>
                    </div>
                </SectionCard>
            ) : null}
        </div>
    )
}

export default WorkflowSummaryAside

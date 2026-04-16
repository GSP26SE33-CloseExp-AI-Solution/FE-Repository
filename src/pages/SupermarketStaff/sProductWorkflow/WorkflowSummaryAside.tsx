import React from "react"
import { CheckCircle2, Image as ImageIcon } from "lucide-react"

import type { LocalImageFile, ProductWorkflowState } from "@/types/product-ai-workflow.type"
import { InfoRow, SectionCard } from "./WorkflowShared"
import { mapProductStateLabel } from "@/mappers/product-ai.mapper"

type Props = {
    workflow: ProductWorkflowState
    images: LocalImageFile[]
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

const WorkflowSummaryAside: React.FC<Props> = ({ workflow, images }) => {
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
        "—"

    const activeProductCategory =
        workflow.createdLot?.productCategory ||
        workflow.createdProduct?.category ||
        workflow.ownProduct?.category ||
        "—"

    const activeManufacturer =
        workflow.createdProduct?.manufacturer ||
        workflow.ownProduct?.manufacturer ||
        "—"

    const finalNutritionFacts =
        stringifyNutritionFacts(workflow.createdLot?.productNutritionFacts) !== "—"
            ? stringifyNutritionFacts(workflow.createdLot?.productNutritionFacts)
            : workflow.productForm.nutritionFacts || "—"

    return (
        <div className="space-y-5">
            <SectionCard title="Ảnh sản phẩm">
                {previewImage ? (
                    <div className="flex h-[280px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                        <img
                            src={previewImage}
                            alt={workflow.productForm.name || "Preview"}
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
                    <InfoRow label="Step" value={workflow.step} />
                    <InfoRow label="Mode" value={workflow.mode || "—"} />
                    <InfoRow label="Phase" value={workflow.phase || "—"} />
                    <InfoRow label="NextAction" value={workflow.nextAction || "—"} />
                    <InfoRow label="Barcode" value={workflow.barcode || "—"} />
                    <InfoRow label="OCR confidence" value={ocrConfidence} />
                    <InfoRow
                        label="Product ID"
                        value={
                            workflow.createdProduct?.productId ||
                            workflow.ownProduct?.productId ||
                            "—"
                        }
                    />
                    <InfoRow
                        label="Lot ID"
                        value={
                            workflow.createdLot?.stockLot?.lotId ||
                            workflow.createdLot?.lotId ||
                            "—"
                        }
                    />
                    <InfoRow
                        label="Create lot trực tiếp"
                        value={workflow.canCreateLotDirectly ? "Có" : "Không"}
                    />
                    <InfoRow
                        label="Cần xác nhận product"
                        value={workflow.requiresVerification ? "Có" : "Không"}
                    />
                </div>
            </SectionCard>

            {(workflow.ownProduct || workflow.createdProduct || workflow.createdLot) ? (
                <SectionCard title="Sản phẩm đang thao tác">
                    <div className="space-y-3 text-sm text-slate-600">
                        <InfoRow label="Tên" value={activeProductName} />
                        <InfoRow
                            label="Trạng thái"
                            value={mapProductStateLabel(
                                workflow.createdProduct?.status || workflow.ownProduct?.status,
                            )}
                        />
                        <InfoRow label="Danh mục" value={activeProductCategory} />
                        <InfoRow label="Nhà sản xuất" value={activeManufacturer} />
                    </div>
                </SectionCard>
            ) : null}

            {workflow.referenceProduct ? (
                <SectionCard title="Sản phẩm tham khảo">
                    <div className="space-y-3 text-sm text-slate-600">
                        <InfoRow label="Tên" value={workflow.referenceProduct.name || "—"} />
                        <InfoRow
                            label="Thương hiệu"
                            value={workflow.referenceProduct.brand || "—"}
                        />
                        <InfoRow
                            label="Danh mục"
                            value={workflow.referenceProduct.category || "—"}
                        />
                        <InfoRow
                            label="Barcode"
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
                <SectionCard title="Dữ liệu AI đọc được">
                    <div className="space-y-3 text-sm text-slate-600">
                        <InfoRow
                            label="Tên"
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
                            label="Barcode"
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
                            Workflow đã xong
                        </div>

                        <div className="space-y-3">
                            <InfoRow
                                label="Lot"
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
                                label="Giá AI đề xuất"
                                value={formatMoney(
                                    workflow.createdLot.pricingSuggestion?.suggestedPrice,
                                )}
                            />
                            <InfoRow
                                label="Giá cuối"
                                value={formatMoney(workflow.createdLot.stockLot?.finalPrice)}
                            />
                            <InfoRow
                                label="Độ tin cậy định giá"
                                value={pricingConfidence}
                            />
                            <InfoRow
                                label="Đã resolve giá trước publish"
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
                                label="Tạo lot bởi"
                                value={workflow.createdLot.stockLot?.createdBy || "—"}
                            />
                            <InfoRow
                                label="Nutrition facts"
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

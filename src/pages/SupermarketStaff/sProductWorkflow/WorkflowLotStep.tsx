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

type Props = {
    ownProduct: ExistingProductSummaryDto | null
    createdProduct: WorkflowCreateProductResultDto | null
    form: LotFormState
    loading: boolean
    createdLot: WorkflowCreateAndPublishLotResultDto | null
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

const WorkflowLotStep: React.FC<Props> = ({
    ownProduct,
    createdProduct,
    form,
    loading,
    createdLot,
    onChange,
    onBack,
    onSubmit,
}) => {
    const effectiveProductId = createdProduct?.productId || ownProduct?.productId || ""
    const effectiveProductName =
        createdProduct?.name || ownProduct?.name || "Chưa có tên sản phẩm"

    const hasQuantityOrWeight =
        (typeof form.quantity === "number" && form.quantity > 0) ||
        (typeof form.weight === "number" && form.weight > 0)

    const canSubmit = Boolean(
        effectiveProductId &&
        form.expiryDate &&
        typeof form.originalUnitPrice === "number" &&
        form.originalUnitPrice > 0 &&
        hasQuantityOrWeight &&
        (form.acceptedSuggestion ||
            (typeof form.finalUnitPrice === "number" && form.finalUnitPrice > 0)),
    )

    const stockLot = createdLot?.stockLot
    const pricing = createdLot?.pricingSuggestion
    const confidence =
        typeof stockLot?.pricingConfidence === "number"
            ? stockLot.pricingConfidence
            : typeof pricing?.confidence === "number"
                ? pricing.confidence
                : null

    return (
        <div className="space-y-5">
            <SectionCard
                title="Bước 3: Tạo lot + định giá + publish"
                description="Bước này chỉ dùng product thuộc siêu thị hiện tại."
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Product ID" value={effectiveProductId} readOnly />
                    <Field label="Tên sản phẩm" value={effectiveProductName} readOnly />

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
                        label="Số lượng"
                        value={form.quantity}
                        onChange={(value) => onChange({ ...form, quantity: value })}
                    />

                    <NumberField
                        label="Khối lượng"
                        value={form.weight}
                        onChange={(value) => onChange({ ...form, weight: value })}
                    />

                    <CurrencyField
                        label="Giá gốc *"
                        value={form.originalUnitPrice}
                        onChange={(value) => onChange({ ...form, originalUnitPrice: value })}
                    />

                    <CurrencyField
                        label="Giá cuối mong muốn"
                        value={form.finalUnitPrice}
                        onChange={(value) => onChange({ ...form, finalUnitPrice: value })}
                    />

                    <div className="md:col-span-2">
                        <TextareaField
                            label="Ghi chú giá"
                            value={form.priceFeedback}
                            onChange={(value) => onChange({ ...form, priceFeedback: value })}
                        />
                    </div>

                    <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                        <CheckboxField
                            label="Chấp nhận suggested price của AI"
                            checked={form.acceptedSuggestion}
                            onChange={(checked) =>
                                onChange({ ...form, acceptedSuggestion: checked })
                            }
                        />
                        <CheckboxField
                            label="Dùng manual fallback cho bước lot/pricing"
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
                        Tạo lot + định giá + publish
                    </button>
                </div>
            </SectionCard>

            {createdLot ? (
                <SectionCard
                    title="Kết quả vừa tạo"
                    description="Thông tin lot sau khi hoàn tất workflow."
                >
                    <div className="space-y-3 text-sm text-slate-600">
                        <InfoRow label="Lot ID" value={stockLot?.lotId || createdLot.lotId} />
                        <InfoRow label="Product ID" value={createdLot.productId} />
                        <InfoRow
                            label="Tên sản phẩm"
                            value={stockLot?.productName || effectiveProductName}
                        />
                        <InfoRow
                            label="Danh mục sản phẩm"
                            value={createdLot.productCategory || "—"}
                        />
                        <InfoRow
                            label="Đã resolve giá trước publish"
                            value={
                                typeof createdLot.pricingSuggestionResolvedBeforePublish === "boolean"
                                    ? createdLot.pricingSuggestionResolvedBeforePublish
                                        ? "Có"
                                        : "Không"
                                    : "—"
                            }
                        />
                        <InfoRow
                            label="Giá AI đề xuất"
                            value={formatCurrencyVN(pricing?.suggestedPrice)}
                        />
                        <InfoRow
                            label="Giá gốc"
                            value={formatCurrencyVN(stockLot?.originalPrice ?? pricing?.originalPrice)}
                        />
                        <InfoRow
                            label="Giá bán cuối"
                            value={formatCurrencyVN(stockLot?.finalPrice)}
                        />
                        <InfoRow
                            label="Độ tin cậy định giá"
                            value={
                                typeof confidence === "number"
                                    ? `${Math.round(confidence * 100)}%`
                                    : "—"
                            }
                        />
                        <InfoRow
                            label="Số ngày tới hạn"
                            value={
                                typeof stockLot?.daysToExpiry === "number"
                                    ? String(stockLot.daysToExpiry)
                                    : typeof pricing?.daysToExpiry === "number"
                                        ? String(pricing.daysToExpiry)
                                        : "—"
                            }
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
                            label="Tạo bởi"
                            value={stockLot?.createdBy || "—"}
                        />
                        <InfoRow
                            label="Đăng bán bởi"
                            value={stockLot?.publishedBy || "—"}
                        />
                        <InfoRow
                            label="Đăng bán lúc"
                            value={formatDateTimeVN(stockLot?.publishedAt)}
                        />
                    </div>

                    {createdLot.productNutritionFacts ? (
                        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-4">
                            <div className="mb-2 text-sm font-semibold text-sky-800">
                                Thành phần dinh dưỡng của sản phẩm
                            </div>
                            <div className="text-sm leading-6 text-sky-700">
                                {stringifyNutritionFacts(createdLot.productNutritionFacts)}
                            </div>
                        </div>
                    ) : null}

                    {typeof pricing?.minMarketPrice === "number" ||
                        typeof pricing?.avgMarketPrice === "number" ||
                        typeof pricing?.maxMarketPrice === "number" ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="mb-3 text-sm font-semibold text-slate-800">
                                Tham chiếu giá thị trường
                            </div>

                            <div className="space-y-3 text-sm text-slate-600">
                                <InfoRow
                                    label="Giá thấp nhất"
                                    value={formatCurrencyVN(pricing?.minMarketPrice)}
                                />
                                <InfoRow
                                    label="Giá trung bình"
                                    value={formatCurrencyVN(pricing?.avgMarketPrice)}
                                />
                                <InfoRow
                                    label="Giá cao nhất"
                                    value={formatCurrencyVN(pricing?.maxMarketPrice)}
                                />
                            </div>
                        </div>
                    ) : null}

                    {pricing?.marketPriceSources?.length ? (
                        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4">
                            <div className="mb-2 text-sm font-semibold text-indigo-800">
                                Nguồn giá tham khảo
                            </div>

                            <div className="space-y-3">
                                {pricing.marketPriceSources.map((source, index) => (
                                    <div
                                        key={`${source.storeName || "source"}-${index}`}
                                        className="rounded-lg border border-indigo-100 bg-white/70 px-3 py-3 text-sm text-indigo-900"
                                    >
                                        <div className="font-medium">
                                            {source.storeName || "Không rõ cửa hàng"}
                                        </div>
                                        <div className="mt-1 text-indigo-700">
                                            Giá: {formatCurrencyVN(source.price)}
                                        </div>
                                        <div className="mt-1 text-xs text-indigo-600">
                                            Nguồn: {source.source || "—"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {pricing?.reasons?.length ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                            <div className="mb-2 text-sm font-semibold text-amber-800">
                                Lý do AI gợi ý giá
                            </div>
                            <ul className="space-y-2 text-sm text-amber-700">
                                {pricing.reasons.map((reason, index) => (
                                    <li key={`${reason}-${index}`} className="flex gap-2">
                                        <span>•</span>
                                        <span>{reason}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </SectionCard>
            ) : null}
        </div>
    )
}

export default WorkflowLotStep

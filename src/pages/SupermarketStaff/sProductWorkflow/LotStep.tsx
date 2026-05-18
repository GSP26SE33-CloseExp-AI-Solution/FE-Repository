import React, { useState } from "react"
import { CheckCircle2, Loader2, X, TrendingUp } from "lucide-react"
import toast from "react-hot-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts"

import type {
    ExistingProductSummaryDto,
    LotFormState,
    WorkflowCreateAndPublishLotResultDto,
    WorkflowCreateProductResultDto,
    WorkflowMarketPriceReferenceDto
} from "@/types/product-ai-workflow.type"
import { productAiService } from "@/services/product-ai-workflow.service"
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
    onPreviewPricing?: () => void
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
    onPreviewPricing,
}) => {
    const [isMarketPriceModalOpen, setIsMarketPriceModalOpen] = useState(false)
    const [marketPriceData, setMarketPriceData] = useState<WorkflowMarketPriceReferenceDto | null>(null)
    const [loadingMarketPrice, setLoadingMarketPrice] = useState(false)

    const effectiveProductId = createdProduct?.productId || ownProduct?.productId || ""
    const effectiveProductName =
        createdProduct?.name || ownProduct?.name || "Chưa có tên sản phẩm"

    const effectiveBarcode = createdProduct?.barcode || ownProduct?.barcode || "—"

    const handleViewMarketPrice = async () => {
        setIsMarketPriceModalOpen(true)
        if (marketPriceData) return // Already loaded

        setLoadingMarketPrice(true)
        try {
            const data = await productAiService.getMarketPriceReference({
                barcode: effectiveBarcode !== "—" ? effectiveBarcode : undefined,
                productName: effectiveProductName !== "Chưa có tên sản phẩm" ? effectiveProductName : undefined,
                autoCrawl: true
            })
            setMarketPriceData(data)
        } catch (error) {
            toast.error("Không thể lấy dữ liệu giá thị trường")
        } finally {
            setLoadingMarketPrice(false)
        }
    }
    const effectiveBrand = createdProduct?.brand || ownProduct?.brand || "—"
    const effectiveCategory = createdProduct?.category || ownProduct?.category || "—"
    const effectiveManufacturer =
        createdProduct?.manufacturer || ownProduct?.manufacturer || "—"

    const stockLot = createdLot?.stockLot
    const pricing = createdLot?.pricingSuggestion

    const originalPrice =
        stockLot?.originalUnitPrice ?? stockLot?.originalPrice ?? pricing?.originalPrice

    const suggestedPrice =
        stockLot?.suggestedUnitPrice ?? stockLot?.suggestedPrice ?? pricing?.suggestedPrice

    const finalPrice =
        stockLot?.sellingUnitPrice ??
        stockLot?.finalUnitPrice ??
        stockLot?.finalPrice ??
        (form.acceptedSuggestion ? suggestedPrice : undefined)

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
                        label="Ngày sản xuất *"
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
                        label="Giá bán mong muốn *"
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

                    {pricing?.suggestedPrice && (
                        <div className="md:col-span-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 mt-2">
                            <div className="font-semibold mb-1 border-b border-blue-100 pb-1">Đề xuất giá từ hệ thống</div>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div><strong>Giá gốc:</strong> {formatCurrencyVN(pricing.originalPrice)}</div>
                                <div><strong>Giá đề xuất:</strong> {formatCurrencyVN(pricing.suggestedPrice)}</div>
                                {pricing.minMarketPrice && <div><strong>Giá TT thấp nhất:</strong> {formatCurrencyVN(pricing.minMarketPrice)}</div>}
                                {pricing.maxMarketPrice && <div><strong>Giá TT cao nhất:</strong> {formatCurrencyVN(pricing.maxMarketPrice)}</div>}
                            </div>
                            {pricing.reasons && pricing.reasons.length > 0 && (
                                <div className="mt-2 text-xs">
                                    <strong className="block mb-1">Lý do đề xuất:</strong>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {pricing.reasons.map((r: string, i: number) => (
                                            <li key={i}>{r}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="mt-2 text-xs italic text-blue-700 font-medium">
                                * Lưu ý: Giá gợi ý này chỉ để bạn tham khảo. Khi bấm "Tạo lô hàng & đăng bán", AI sẽ phân tích lại giá một lần nữa và áp dụng (nếu bạn check chọn "Dùng giá gợi ý").
                            </div>
                        </div>
                    )}

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
                        onClick={onPreviewPricing}
                        disabled={loading || !form.expiryDate || !form.originalUnitPrice}
                        className={cn(
                            "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                            !loading && form.expiryDate && form.originalUnitPrice
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "cursor-not-allowed bg-slate-100 text-slate-400",
                        )}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Giá đề xuất
                    </button>

                    <button
                        type="button"
                        onClick={() => void handleViewMarketPrice()}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Giá thị trường
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
                            value={formatCurrencyVN(suggestedPrice)}
                        />
                        <InfoRow
                            label="Giá gốc"
                            value={formatCurrencyVN(originalPrice)}
                        />
                        <InfoRow
                            label="Giá bán cuối"
                            value={formatCurrencyVN(finalPrice)}
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

            {isMarketPriceModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setIsMarketPriceModalOpen(false)}>
                    <div className="w-full max-w-2xl rounded-[24px] bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Khảo sát giá thị trường</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{effectiveProductName}</p>
                            </div>
                            <button onClick={() => setIsMarketPriceModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6">
                            {loadingMarketPrice ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                                    <p className="text-sm text-slate-500">Đang tra cứu giá thị trường...</p>
                                </div>
                            ) : marketPriceData && marketPriceData.hasData ? (
                                <div>
                                    <div className="mb-6 grid grid-cols-3 gap-4">
                                        <div className="rounded-xl bg-slate-50 p-4 text-center">
                                            <p className="text-xs font-medium text-slate-500 mb-1">Thấp nhất</p>
                                            <p className="text-lg font-bold text-emerald-600">{marketPriceData.minPrice ? formatCurrencyVN(marketPriceData.minPrice) : "—"}</p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-4 text-center">
                                            <p className="text-xs font-medium text-slate-500 mb-1">Trung bình</p>
                                            <p className="text-lg font-bold text-indigo-600">{marketPriceData.avgPrice ? formatCurrencyVN(marketPriceData.avgPrice) : "—"}</p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-4 text-center">
                                            <p className="text-xs font-medium text-slate-500 mb-1">Cao nhất</p>
                                            <p className="text-lg font-bold text-rose-600">{marketPriceData.maxPrice ? formatCurrencyVN(marketPriceData.maxPrice) : "—"}</p>
                                        </div>
                                    </div>

                                    {marketPriceData.details && marketPriceData.details.length > 0 ? (
                                        <div className="h-64 w-full relative">
                                            <div className="absolute -top-6 right-0 text-xs italic text-slate-400">
                                                * Bấm vào cột biểu đồ để mở trang gốc
                                            </div>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={marketPriceData.details} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="storeName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                                                    <RechartsTooltip 
                                                        formatter={(value) =>
                                                            formatCurrencyVN(
                                                                value == null ? undefined : Number(value)
                                                            )
                                                        }
                                                        cursor={{ fill: '#F1F5F9' }}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar 
                                                        dataKey="price" 
                                                        radius={[6, 6, 0, 0]} 
                                                        maxBarSize={50}
                                                    >
                                                        {
                                                            marketPriceData.details.map((entry, index) => (
                                                                <Cell 
                                                                    key={`cell-${index}`} 
                                                                    fill={entry.price === marketPriceData.minPrice ? '#10B981' : entry.price === marketPriceData.maxPrice ? '#F43F5E' : '#6366F1'} 
                                                                    style={{ cursor: entry.source ? 'pointer' : 'default' }}
                                                                    onClick={() => {
                                                                        const rawSource = entry.source;
                                                                        if (!rawSource) return;

                                                                        let finalUrl = rawSource.trim();
                                                                        if (finalUrl.startsWith('//')) {
                                                                            finalUrl = `https:${finalUrl}`;
                                                                        } else if (!finalUrl.startsWith('http')) {
                                                                            finalUrl = `https://${finalUrl}`;
                                                                        }

                                                                        try {
                                                                            // Kiểm tra xem có phải là URL hợp lệ không
                                                                            new URL(finalUrl);
                                                                            window.open(finalUrl, '_blank', 'noopener,noreferrer');
                                                                        } catch (err) {
                                                                            console.error("Invalid URL:", finalUrl, err);
                                                                            toast.error("Đường dẫn không đúng định dạng: " + rawSource);
                                                                        }
                                                                    }}
                                                                />
                                                            ))
                                                        }
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
                                            Chưa có đủ dữ liệu từ các nguồn khác nhau để vẽ biểu đồ.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                        <TrendingUp className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <h4 className="text-base font-semibold text-slate-900 mb-1">Không có dữ liệu</h4>
                                    <p className="text-sm text-slate-500">Hệ thống chưa tìm thấy dữ liệu giá thị trường cho sản phẩm này.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default WorkflowLotStep

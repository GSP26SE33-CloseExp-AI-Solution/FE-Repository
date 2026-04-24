import React from "react"
import {
    Camera,
    CheckCircle2,
    Loader2,
    Sparkles,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react"

import type {
    ExistingProductSummaryDto,
    LocalImageFile,
    ProductFormState,
    ProductWorkflowMode,
    WorkflowAnalyzeImageResultDto,
    WorkflowNextAction,
} from "@/types/product-ai-workflow.type"
import {
    CheckboxField,
    cn,
    Field,
    InfoRow,
    SectionCard,
    SelectField,
    TextareaField,
} from "./WorkflowShared"

type ProductCategoryOption = {
    categoryId: string
    label: string
    value: string
    isFreshFood: boolean
}

type ProductUnitOption = {
    unitId: string
    label: string
    value: string
    unitType?: string
    unitSymbol?: string
}

type Props = {
    mode: ProductWorkflowMode
    nextAction: WorkflowNextAction | null
    form: ProductFormState
    loading: null | "CREATE_PRODUCT" | "ANALYZE"
    externalProducts: ExistingProductSummaryDto[]
    selectedReferenceProductId?: string
    analyzeResult: WorkflowAnalyzeImageResultDto | null
    images: LocalImageFile[]
    uploadError: string | null
    usingCamera: boolean
    fileInputRef: React.RefObject<HTMLInputElement | null>
    videoRef: React.RefObject<HTMLVideoElement | null>
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    categoryOptions: ProductCategoryOption[]
    unitOptions: ProductUnitOption[]
    nutritionRows: Array<{
        id: string
        label: string
        value: string
    }>
    onNutritionRowChange: (
        id: string,
        key: "label" | "value",
        value: string,
    ) => void
    onAddNutritionRow: () => void
    onRemoveNutritionRow: (id: string) => void
    onChooseReference: (product: ExistingProductSummaryDto) => void
    onChange: (next: ProductFormState) => void
    onSubmit: () => void
    onBack: () => void
    onAnalyzeImage: () => void
    onStartCamera: () => void
    onStopCamera: () => void
    onCapturePhoto: () => void
    onTriggerUpload: () => void
    onRemoveImage: (id: string) => void
    onFileChange: React.ChangeEventHandler<HTMLInputElement>
}

const formatConfidence = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—"
    return `${Math.round(value * 100)}%`
}

const stringifyIngredients = (value?: string[] | null) => {
    if (!value?.length) return "—"
    return value.filter(Boolean).join(", ")
}

const stringifyNutritionFacts = (value?: Record<string, string> | null) => {
    if (!value || Object.keys(value).length === 0) return "—"
    return Object.entries(value)
        .map(([key, itemValue]) => `${key}: ${itemValue}`)
        .join(" | ")
}

const WorkflowProductStep: React.FC<Props> = ({
    mode,
    nextAction,
    form,
    loading,
    externalProducts,
    selectedReferenceProductId,
    analyzeResult,
    images,
    uploadError,
    usingCamera,
    fileInputRef,
    videoRef,
    canvasRef,
    categoryOptions,
    unitOptions,
    nutritionRows,
    onNutritionRowChange,
    onAddNutritionRow,
    onRemoveNutritionRow,
    onChooseReference,
    onChange,
    onSubmit,
    onBack,
    onAnalyzeImage,
    onStartCamera,
    onStopCamera,
    onCapturePhoto,
    onTriggerUpload,
    onRemoveImage,
    onFileChange,
}) => {
    const canSubmit = Boolean(
        form.name.trim() &&
        form.categoryName.trim() &&
        form.barcode.trim() &&
        form.unitId.trim(),
    )

    const showOcrStep = mode === "CREATE_NEW_PRODUCT" && nextAction === "CREATE_PRODUCT"

    const title =
        mode === "VERIFY_OWN_PRODUCT"
            ? "Bước 2: Xác nhận sản phẩm nội bộ"
            : mode === "CREATE_PRIVATE_PRODUCT"
                ? "Bước 2: Tạo sản phẩm riêng từ dữ liệu tham khảo"
                : "Bước 2: Tạo sản phẩm mới"

    const description =
        mode === "VERIFY_OWN_PRODUCT"
            ? "Bạn chỉ xác nhận sản phẩm của chính siêu thị hiện tại."
            : mode === "CREATE_PRIVATE_PRODUCT"
                ? "Sản phẩm từ siêu thị khác chỉ dùng để điền sẵn thông tin. Sau khi lưu, sản phẩm mới vẫn thuộc siêu thị hiện tại."
                : "Mã vạch chưa có trong hệ thống, bạn có thể dùng OCR ảnh hoặc nhập tay thông tin sản phẩm."

    return (
        <div className="space-y-5">
            {mode === "CREATE_PRIVATE_PRODUCT" && externalProducts.length > 0 ? (
                <SectionCard
                    title="Sản phẩm tham khảo"
                    description="Chọn một sản phẩm cùng mã vạch để điền sẵn thông tin."
                >
                    <div className="space-y-3">
                        {externalProducts.map((item) => {
                            const active = selectedReferenceProductId === item.productId

                            return (
                                <button
                                    key={item.productId}
                                    type="button"
                                    onClick={() => onChooseReference(item)}
                                    className={cn(
                                        "w-full rounded-[18px] border p-4 text-left transition",
                                        active
                                            ? "border-emerald-400 bg-emerald-50"
                                            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
                                    )}
                                >
                                    <div className="text-sm font-semibold text-slate-900">
                                        {item.name || "Chưa có tên sản phẩm"}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-500">
                                        {item.brand || "Chưa có thương hiệu"} •{" "}
                                        {item.category || "Chưa có danh mục"}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-500">
                                        Mã vạch: {item.barcode || "—"}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-500">
                                        Siêu thị: {item.supermarketName || "—"}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-500">
                                        Nhà sản xuất: {item.manufacturer || "—"}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-500">
                                        Thành phần: {stringifyIngredients(item.ingredients)}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </SectionCard>
            ) : null}

            {showOcrStep ? (
                <SectionCard
                    title="Phân tích ảnh sản phẩm"
                    description="Chỉ xuất hiện khi hệ thống chưa có sản phẩm phù hợp với mã vạch này."
                >
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={onStartCamera}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                            <Camera className="h-4 w-4" />
                            Chụp ảnh
                        </button>

                        <button
                            type="button"
                            onClick={onTriggerUpload}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <UploadCloud className="h-4 w-4" />
                            Tải ảnh lên
                        </button>

                        <button
                            type="button"
                            onClick={onAnalyzeImage}
                            disabled={loading === "ANALYZE" || images.length === 0}
                            className={cn(
                                "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                loading === "ANALYZE" || images.length === 0
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700",
                            )}
                        >
                            {loading === "ANALYZE" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            Phân tích ảnh
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onFileChange}
                            className="hidden"
                        />
                    </div>

                    {uploadError ? (
                        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {uploadError}
                        </div>
                    ) : null}

                    {usingCamera ? (
                        <div className="mt-4 relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="h-[420px] w-full object-contain"
                            />

                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/65 via-black/20 to-transparent px-5 pb-5 pt-16">
                                <button
                                    type="button"
                                    onClick={onStopCamera}
                                    className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                                >
                                    <X className="h-4 w-4" />
                                    Đóng camera
                                </button>

                                <button
                                    type="button"
                                    onClick={onCapturePhoto}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <Camera className="h-4 w-4" />
                                    Chụp ảnh
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <canvas ref={canvasRef} className="hidden" />

                    {images.length > 0 ? (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {images.map((img, index) => (
                                <div
                                    key={img.id}
                                    className="group relative overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50"
                                >
                                    <img
                                        src={img.preview}
                                        alt={`Ảnh sản phẩm ${index + 1}`}
                                        className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                    />

                                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                                        <div className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                            {index === 0 ? "Ảnh chính" : `Ảnh ${index + 1}`}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onRemoveImage(img.id)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {analyzeResult ? (
                        <div className="mt-4 space-y-4">
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                Hệ thống đã điền sẵn một phần thông tin. Bạn kiểm tra lại trước khi xác nhận.
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                                <div className="mb-3 text-sm font-semibold text-slate-900">
                                    Dữ liệu hệ thống đọc được
                                </div>

                                <div className="space-y-3 text-sm text-slate-600">
                                    <InfoRow
                                        label="Tên sản phẩm"
                                        value={
                                            analyzeResult.extractedInfo?.name ||
                                            analyzeResult.barcodeLookupInfo?.productName ||
                                            "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Thương hiệu"
                                        value={
                                            analyzeResult.extractedInfo?.brand ||
                                            analyzeResult.barcodeLookupInfo?.brand ||
                                            "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Danh mục"
                                        value={
                                            analyzeResult.extractedInfo?.category ||
                                            analyzeResult.barcodeLookupInfo?.category ||
                                            "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Mã vạch"
                                        value={
                                            analyzeResult.extractedInfo?.barcode ||
                                            analyzeResult.barcodeLookupInfo?.barcode ||
                                            "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Nhà sản xuất"
                                        value={
                                            analyzeResult.extractedInfo?.manufacturer ||
                                            analyzeResult.barcodeLookupInfo?.manufacturer ||
                                            "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Xuất xứ"
                                        value={
                                            analyzeResult.extractedInfo?.origin ||
                                            analyzeResult.barcodeLookupInfo?.country ||
                                            "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Khối lượng"
                                        value={
                                            analyzeResult.extractedInfo?.weight ||
                                            analyzeResult.barcodeLookupInfo?.weight ||
                                            "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Thành phần"
                                        value={
                                            stringifyIngredients(
                                                analyzeResult.extractedInfo?.ingredients,
                                            ) !== "—"
                                                ? stringifyIngredients(
                                                    analyzeResult.extractedInfo?.ingredients,
                                                )
                                                : stringifyIngredients(
                                                    analyzeResult.barcodeLookupInfo?.ingredients,
                                                )
                                        }
                                    />
                                    <InfoRow
                                        label="Thông tin dinh dưỡng"
                                        value={
                                            stringifyNutritionFacts(
                                                analyzeResult.extractedInfo?.nutritionFacts,
                                            ) !== "—"
                                                ? stringifyNutritionFacts(
                                                    analyzeResult.extractedInfo
                                                        ?.nutritionFacts,
                                                )
                                                : stringifyNutritionFacts(
                                                    analyzeResult.barcodeLookupInfo
                                                        ?.nutritionFacts,
                                                )
                                        }
                                    />
                                    <InfoRow
                                        label="Độ tin cậy AI"
                                        value={formatConfidence(analyzeResult.confidence)}
                                    />
                                    <InfoRow
                                        label="AI có bỏ qua xử lý không"
                                        value={
                                            typeof analyzeResult.aiSkipped === "boolean"
                                                ? analyzeResult.aiSkipped
                                                    ? "Có"
                                                    : "Không"
                                                : "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Đường dẫn ảnh phân tích"
                                        value={analyzeResult.imageUrl || "—"}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Bạn có thể phân tích ảnh trước rồi chỉnh lại form bên dưới, hoặc bỏ qua và nhập tay toàn bộ.
                        </div>
                    )}
                </SectionCard>
            ) : null}

            <SectionCard title={title} description={description}>
                <div className="grid gap-4 md:grid-cols-2">
                    <Field
                        label="Tên sản phẩm *"
                        value={form.name}
                        onChange={(value) => onChange({ ...form, name: value })}
                    />
                    <Field
                        label="Thương hiệu"
                        value={form.brand}
                        onChange={(value) => onChange({ ...form, brand: value })}
                    />

                    <SelectField
                        label="Danh mục *"
                        value={form.categoryId}
                        onChange={(value) => {
                            const selected = categoryOptions.find(
                                (item) => item.categoryId === String(value),
                            )

                            onChange({
                                ...form,
                                categoryId: selected?.categoryId || "",
                                categoryName: selected?.label || "",
                                isFreshFood: selected?.isFreshFood ?? false,
                            })
                        }}
                        options={categoryOptions.map((item) => ({
                            label: `${item.label}${item.isFreshFood ? " • Tươi sống" : ""}`,
                            value: item.categoryId,
                        }))}
                    />

                    <SelectField
                        label="Đơn vị *"
                        value={form.unitId}
                        onChange={(value) =>
                            onChange({
                                ...form,
                                unitId: String(value),
                            })
                        }
                        options={unitOptions.map((item) => ({
                            label: item.label,
                            value: item.unitId,
                        }))}
                    />

                    <Field
                        label="Loại thực phẩm"
                        value={form.isFreshFood ? "Tươi sống" : "Không tươi sống"}
                        readOnly
                    />

                    <Field
                        label="Mã vạch *"
                        value={form.barcode}
                        onChange={(value) => onChange({ ...form, barcode: value })}
                    />
                    <Field
                        label="Nhà sản xuất"
                        value={form.manufacturer}
                        onChange={(value) => onChange({ ...form, manufacturer: value })}
                    />
                    <Field
                        label="Xuất xứ"
                        value={form.origin}
                        onChange={(value) => onChange({ ...form, origin: value })}
                    />

                    <div className="md:col-span-2">
                        <TextareaField
                            label="Mô tả sản phẩm"
                            value={form.description}
                            onChange={(value) => onChange({ ...form, description: value })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <TextareaField
                            label="Thành phần"
                            value={form.ingredients}
                            onChange={(value) => onChange({ ...form, ingredients: value })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <div className="mb-2 text-sm font-medium text-slate-700">
                            Thông tin dinh dưỡng
                        </div>

                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            {nutritionRows.map((row, index) => (
                                <div
                                    key={row.id}
                                    className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]"
                                >
                                    <Field
                                        label=""
                                        value={row.label}
                                        onChange={(value) =>
                                            onNutritionRowChange(row.id, "label", value)
                                        }
                                    />

                                    <Field
                                        label=""
                                        value={row.value}
                                        onChange={(value) =>
                                            onNutritionRowChange(row.id, "value", value)
                                        }
                                    />

                                    <button
                                        type="button"
                                        onClick={() => onRemoveNutritionRow(row.id)}
                                        className="mt-0 inline-flex h-[46px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 md:mt-[28px]"
                                        title="Xóa dòng"
                                    >
                                        ×
                                    </button>

                                    {index === 0 ? (
                                        <>
                                            <div className="-mt-2 text-xs text-slate-400">
                                                Ví dụ: Năng lượng
                                            </div>
                                            <div className="-mt-2 text-xs text-slate-400">
                                                Ví dụ: 286 kcal
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={onAddNutritionRow}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                                Thêm dòng
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <TextareaField
                            label="Hướng dẫn sử dụng"
                            value={form.usageInstructions}
                            onChange={(value) =>
                                onChange({ ...form, usageInstructions: value })
                            }
                        />
                    </div>

                    <div className="md:col-span-2">
                        <TextareaField
                            label="Hướng dẫn bảo quản"
                            value={form.storageInstructions}
                            onChange={(value) =>
                                onChange({ ...form, storageInstructions: value })
                            }
                        />
                    </div>

                    <div className="md:col-span-2">
                        <TextareaField
                            label="Cảnh báo an toàn"
                            value={form.safetyWarnings}
                            onChange={(value) => onChange({ ...form, safetyWarnings: value })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <CheckboxField
                            label="Sử dụng chế độ nhập tay thủ công cho bước tạo / xác nhận sản phẩm"
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
                        disabled={!canSubmit || loading === "CREATE_PRODUCT"}
                        className={cn(
                            "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition",
                            canSubmit && loading !== "CREATE_PRODUCT"
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "cursor-not-allowed bg-slate-100 text-slate-400",
                        )}
                    >
                        {loading === "CREATE_PRODUCT" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}
                        {mode === "VERIFY_OWN_PRODUCT"
                            ? "Xác nhận sản phẩm"
                            : "Tạo sản phẩm"}
                    </button>
                </div>
            </SectionCard>
        </div>
    )
}

export default WorkflowProductStep

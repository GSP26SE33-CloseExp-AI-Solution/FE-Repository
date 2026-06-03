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
    OcrPrefillFieldsDto,
    ProductFormState,
    ProductWorkflowMode,
    WorkflowAnalyzeImageResultDto,
    WorkflowNextAction,
} from "@/types/product-ai-workflow.type"
import {
    formatConversionRateHintWithBase,
    formatUnitOptionLabel,
} from "@/utils/unitMeasure"
import {
    CheckboxField,
    cn,
    Field,
    SectionCard,
    SelectField,
    TextareaField,
} from "./WorkflowShared"

type OcrProgressStep = {
    label: string
    description: string
}

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
    conversionRate?: number
}

type Props = {
    mode: ProductWorkflowMode
    nextAction: WorkflowNextAction | null
    form: ProductFormState
    loading: null | "CREATE_PRODUCT" | "ANALYZE"
    externalProducts: ExistingProductSummaryDto[]
    selectedReferenceProductId?: string
    analyzeResult: WorkflowAnalyzeImageResultDto | null
    prefillFields?: OcrPrefillFieldsDto | null
    missingRequiredFields?: string[] | null
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

const SOURCE_LABEL: Record<string, string> = {
    ocr_llm: "OCR/LLM",
    barcode_lookup: "Barcode lookup",
    rule_based: "Rule-based",
    missing: "Thiếu dữ liệu",
}

const STATUS_LABEL: Record<string, string> = {
    ok: "Tốt",
    needs_review: "Cần kiểm tra",
    missing: "Thiếu",
}

const statusClass = (status?: string | null) => {
    if (status === "ok") return "bg-emerald-100 text-emerald-700 border-emerald-200"
    if (status === "needs_review")
        return "bg-amber-100 text-amber-700 border-amber-200"
    return "bg-slate-100 text-slate-600 border-slate-200"
}

const OCR_PROGRESS_STEPS: OcrProgressStep[] = [
    {
        label: "Chuẩn bị ảnh",
        description: "Tối ưu ảnh trước khi gửi lên hệ thống.",
    },
    {
        label: "Gửi ảnh lên hệ thống",
        description: "Ảnh đang được tải lên để thực hiện quá trình OCR.",
    },
    {
        label: "AI đọc nhãn sản phẩm",
        description: "Hệ thống đang nhận diện tên, thương hiệu, barcode và thông tin nhãn.",
    },
    {
        label: "Đối chiếu dữ liệu tham khảo",
        description: "Kiểm tra barcode và dữ liệu sản phẩm có thể tìm được.",
    },
    {
        label: "Điền dữ liệu vào form",
        description: "Chuẩn bị tự điền thông tin để bạn kiểm tra lại.",
    },
]

const OcrLoadingPanel = ({ activeIndex, uploadPercent = 0 }: { activeIndex: number, uploadPercent?: number }) => {
    let percent = Math.round(((activeIndex) / OCR_PROGRESS_STEPS.length) * 100)
    if (activeIndex === 1) { // Gửi ảnh
        percent += Math.round((uploadPercent / 100) * (100 / OCR_PROGRESS_STEPS.length))
    }

    return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
            <div className="border-b border-emerald-100 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-emerald-900">
                            Đang OCR ảnh sản phẩm
                        </div>
                        <div className="mt-1 text-xs leading-5 text-emerald-700">
                            Vui lòng giữ nguyên màn hình, hệ thống đang đọc thông tin trên nhãn.
                        </div>
                    </div>

                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-700" />
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            <div className="space-y-3 px-4 py-4">
                {OCR_PROGRESS_STEPS.map((step, index) => {
                    const done = index < activeIndex
                    const active = index === activeIndex

                    return (
                        <div key={step.label} className="flex gap-3">
                            <div
                                className={cn(
                                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                                    done
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : active
                                            ? "border-emerald-500 bg-white text-emerald-700"
                                            : "border-emerald-200 bg-white text-emerald-300",
                                )}
                            >
                                {done ? "✓" : index + 1}
                            </div>

                            <div>
                                <div
                                    className={cn(
                                        "text-sm font-semibold",
                                        active || done
                                            ? "text-emerald-900"
                                            : "text-emerald-500",
                                    )}
                                >
                                    {step.label}
                                </div>
                                <div className="mt-0.5 text-xs leading-5 text-emerald-700">
                                    {step.description}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const WorkflowProductStep: React.FC<Props & { ocrStepIndex?: number, ocrUploadPercent?: number }> = ({
    mode,
    nextAction,
    form,
    loading,
    externalProducts,
    selectedReferenceProductId,
    analyzeResult,
    prefillFields,
    missingRequiredFields,
    images,
    uploadError,
    usingCamera,
    fileInputRef,
    videoRef,
    canvasRef,
    categoryOptions,
    unitOptions,
    nutritionRows,
    ocrStepIndex = 0,
    ocrUploadPercent = 0,
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

    const selectedUnit = unitOptions.find((item) => item.unitId === form.unitId)
    const unitCatalog = unitOptions.map((item) => ({
        name: item.label,
        symbol: item.unitSymbol,
        type: item.unitType,
        conversionRate: item.conversionRate,
    }))
    const selectedUnitConversionHint = selectedUnit
        ? formatConversionRateHintWithBase(
              {
                  name: selectedUnit.label,
                  symbol: selectedUnit.unitSymbol,
                  type: selectedUnit.unitType,
                  conversionRate: selectedUnit.conversionRate,
              },
              unitCatalog,
          )
        : null

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
                    title="OCR thông tin nhãn sản phẩm"
                    description="Chỉ xuất hiện khi barcode sản phẩm chưa có trong hệ thống. 
                    OCR sẽ tự điền thông tin, bạn vẫn có thể chỉnh tay trước khi lưu."
                >
                    <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
                        <span className="font-semibold text-sky-900">
                            Chụp mặt có thông tin sản phẩm.
                        </span>{" "}
                        Ưu tiên ảnh rõ tên, thành phần, dinh dưỡng, NSX/HSD. OCR chỉ dùng 1 ảnh chính.
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={onStartCamera}
                            disabled={Boolean(loading)}
                            className={cn(
                                "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition",
                                loading
                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                            )}
                        >
                            <Camera className="h-4 w-4" />
                            Chụp ảnh
                        </button>

                        <button
                            type="button"
                            onClick={onTriggerUpload}
                            disabled={Boolean(loading)}
                            className={cn(
                                "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                loading
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-slate-900 text-white hover:bg-slate-800",
                            )}
                        >
                            <UploadCloud className="h-4 w-4" />
                            Tải ảnh lên
                        </button>

                        <button
                            type="button"
                            onClick={onAnalyzeImage}
                            disabled={Boolean(loading) || images.length === 0}
                            className={cn(
                                "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                                Boolean(loading) || images.length === 0
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700",
                            )}
                        >
                            {loading === "ANALYZE" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            {loading === "ANALYZE"
                                ? "Đang OCR..."
                                : "Phân tích ảnh bằng OCR"}
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onFileChange}
                            className="hidden"
                        />

                        {loading === "ANALYZE" ? <OcrLoadingPanel activeIndex={ocrStepIndex} uploadPercent={ocrUploadPercent} /> : null}
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
                                    disabled={Boolean(loading)}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
                                        loading
                                            ? "cursor-not-allowed bg-white/60 text-slate-400"
                                            : "bg-white/90 text-slate-700 hover:bg-white",
                                    )}
                                >
                                    <X className="h-4 w-4" />
                                    Đóng camera
                                </button>

                                <button
                                    type="button"
                                    onClick={onCapturePhoto}
                                    disabled={Boolean(loading)}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                                        loading
                                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                            : "bg-emerald-600 text-white hover:bg-emerald-700",
                                    )}
                                >
                                    <Camera className="h-4 w-4" />
                                    Chụp ảnh
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <canvas ref={canvasRef} className="hidden" />

                    {images.length > 0 ? (
                        <div className="mt-4">
                            {images.map((img, index) => (
                                <div
                                    key={img.id}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                                >
                                    <img
                                        src={img.preview}
                                        alt={`Ảnh sản phẩm ${index + 1}`}
                                        className="h-20 w-20 rounded-xl object-cover"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-slate-900">
                                            Ảnh OCR chính
                                        </div>
                                        <div className="mt-1 text-xs leading-5 text-slate-500">
                                            Hệ thống sẽ phân tích ảnh này để điền thông tin sản phẩm.
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onRemoveImage(img.id)}
                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {analyzeResult ? (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="font-semibold text-emerald-900">
                                        OCR đã điền dữ liệu vào form bên dưới
                                    </div>
                                    <div className="text-xs leading-5 text-emerald-700">
                                        Vui lòng kiểm tra lại dữ liệu trong form trước khi tạo sản phẩm.
                                    </div>
                                </div>

                                <div className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                                    Độ tin cậy: {formatConfidence(analyzeResult.confidence)}
                                </div>
                            </div>

                            {prefillFields ? (
                                <div className="mt-3 grid gap-2 md:grid-cols-2">
                                    {(
                                        [
                                            ["name", "Tên sản phẩm"],
                                            ["brand", "Thương hiệu"],
                                            ["barcode", "Mã vạch"],
                                            ["category", "Danh mục"],
                                        ] as const
                                    ).map(([key, label]) => {
                                        const field = prefillFields[key]
                                        const source = field?.source || "missing"
                                        const status = field?.status || "missing"
                                        return (
                                            <div
                                                key={key}
                                                className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs"
                                            >
                                                <div className="font-semibold text-slate-700">{label}</div>
                                                <div className="mt-1 text-slate-600">
                                                    {field?.value || "—"}
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                                                        {SOURCE_LABEL[source] || source}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "rounded-full border px-2 py-0.5 text-[11px]",
                                                            statusClass(status),
                                                        )}
                                                    >
                                                        {STATUS_LABEL[status] || status}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : null}

                            {missingRequiredFields?.length ? (
                                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    Trường cần bổ sung trước khi tạo sản phẩm:{" "}
                                    <span className="font-semibold">
                                        {missingRequiredFields.join(", ")}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Bạn có thể OCR ảnh trước để hệ thống điền sẵn, hoặc bỏ qua và nhập tay toàn bộ.
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

                    <div className="space-y-2">
                        <SelectField
                            label="Đơn vị chuẩn sản phẩm *"
                            value={form.unitId}
                            onChange={(value) =>
                                onChange({
                                    ...form,
                                    unitId: value ? String(value) : "",
                                })
                            }
                            options={unitOptions.map((item) => ({
                                label: formatUnitOptionLabel(
                                    {
                                        name: item.label,
                                        symbol: item.unitSymbol,
                                        type: item.unitType,
                                        conversionRate: item.conversionRate,
                                    },
                                    unitCatalog,
                                ),
                                value: item.unitId,
                            }))}
                        />
                        {selectedUnitConversionHint ? (
                            <p className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs leading-5 text-sky-800">
                                {selectedUnitConversionHint}. Đây là đơn vị chuẩn của sản phẩm;
                                ở bước tạo lô bạn có thể chọn đơn vị bán khác (Hộp, Gói…).
                            </p>
                        ) : selectedUnit ? (
                            <p className="text-xs text-slate-500">
                                Đơn vị gốc trong nhóm {selectedUnit.unitType || "—"} (hệ số = 1).
                            </p>
                        ) : null}
                    </div>

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
                        disabled={!canSubmit || Boolean(loading)}
                        className={cn(
                            "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition",
                            canSubmit && !loading
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

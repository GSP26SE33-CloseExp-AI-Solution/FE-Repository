import React, { useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Image as ImageIcon,
    RefreshCcw,
    Save,
    Sparkles,
} from "lucide-react"
import toast from "react-hot-toast"

import { useAuth } from "@/hooks/useAuth"
import { productAiService } from "@/services/product-ai.service"
import {
    mapProductStateLabel,
    mapVerifyProductResultToWorkflow,
    mergeWorkflowSnapshots,
} from "@/mappers/product-ai.mapper"
import type { ProductWorkflowSnapshot } from "@/types/product-ai-workflow.type"

type UploadedPreviewItem = {
    id: string
    preview: string
    source: "upload" | "camera"
}

type ConfirmFormState = {
    productId: string
    name: string
    brand: string
    category: string
    barcode: string
    ingredients: string
    nutritionFacts: string
    originalPrice: number | ""
    expiryDate: string
    manufactureDate: string
    isFreshFood: boolean
}

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

const CATEGORY_OPTIONS = [
    { label: "Thực phẩm tươi", value: "Fresh Food" },
    { label: "Thực phẩm khô", value: "Dry Food" },
    { label: "Đồ uống", value: "Beverages" },
    { label: "Gia vị", value: "Spices" },
    { label: "Bánh kẹo", value: "Snacks" },
    { label: "Đông lạnh", value: "Frozen Food" },
    { label: "Khác", value: "Other" },
] as const

const formatCurrencyVN = (num: number) => num.toLocaleString("vi-VN") + " đ"

const parseCurrencyVN = (value: string) => {
    const parsed = Number(value.replace(/[^\d]/g, ""))
    return Number.isNaN(parsed) ? 0 : parsed
}

const normalizeDateInput = (value?: string | null) => {
    if (!value) return ""
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) {
        return value.includes("T") ? value.slice(0, 10) : value
    }
    return d.toISOString().slice(0, 10)
}

const stringifyNutritionFacts = (value: unknown) => {
    if (!value) return ""
    if (typeof value === "string") return value
    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return ""
    }
}

const buildInitialForm = (workflow: ProductWorkflowSnapshot): ConfirmFormState => {
    const extracted = workflow.extractedInfo
    const barcodeLookup = workflow.barcodeLookupInfo
    const verification = workflow.verification
    const draft = workflow.draft

    return {
        productId: workflow.productId ?? draft.productId ?? "",
        name:
            workflow.name ??
            draft.name ??
            extracted?.name ??
            barcodeLookup?.productName ??
            "",
        brand:
            workflow.brand ??
            draft.brand ??
            extracted?.brand ??
            barcodeLookup?.brand ??
            "",
        category:
            workflow.category ??
            draft.category ??
            extracted?.category ??
            barcodeLookup?.category ??
            "",
        barcode:
            workflow.barcode ??
            draft.barcode ??
            extracted?.barcode ??
            barcodeLookup?.barcode ??
            "",
        ingredients:
            draft.ingredients ??
            extracted?.ingredients ??
            barcodeLookup?.ingredients ??
            "",
        nutritionFacts: stringifyNutritionFacts(verification.nutritionFacts),
        originalPrice:
            workflow.pricing.originalPrice ??
            verification.originalPrice ??
            "",
        expiryDate: normalizeDateInput(verification.expiryDate),
        manufactureDate: normalizeDateInput(verification.manufactureDate),
        isFreshFood: Boolean(draft.isFreshFood),
    }
}

const ConfirmProduct: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()

    const workflow = (location.state as { workflow?: ProductWorkflowSnapshot } | null)?.workflow
    const uploadedImages =
        (
            location.state as
            | { uploadedImages?: UploadedPreviewItem[] }
            | null
        )?.uploadedImages ?? []

    const initialForm = useMemo<ConfirmFormState | null>(() => {
        if (!workflow) return null
        return buildInitialForm(workflow)
    }, [workflow])

    const [form, setForm] = useState<ConfirmFormState | null>(initialForm)
    const [activeImageIndex, setActiveImageIndex] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const initialFormRef = useRef<ConfirmFormState | null>(initialForm)

    const previewImages = useMemo(() => {
        if (uploadedImages.length > 0) return uploadedImages.map((item) => item.preview)

        if (workflow?.productImages?.length) {
            return workflow.productImages.map((item) => item.imageUrl).filter(Boolean)
        }

        if (workflow?.mainImageUrl) return [workflow.mainImageUrl]

        return []
    }, [uploadedImages, workflow])

    const validation = useMemo(() => {
        if (!form) {
            return {
                isValid: false,
                missingFields: [] as string[],
            }
        }

        const missingFields: string[] = []

        if (!form.name.trim()) missingFields.push("Tên sản phẩm")
        if (!form.brand.trim()) missingFields.push("Thương hiệu")
        if (!form.category.trim()) missingFields.push("Danh mục")
        if (!form.barcode.trim()) missingFields.push("Mã vạch")
        if (form.originalPrice === "" || Number(form.originalPrice) <= 0) {
            missingFields.push("Giá gốc")
        }
        if (!form.expiryDate) missingFields.push("Hạn sử dụng")

        return {
            isValid: missingFields.length === 0,
            missingFields,
        }
    }, [form])

    const aiConfidencePercent = useMemo(() => {
        const confidence = workflow?.draft.ocrConfidence
        if (typeof confidence !== "number") return null
        return Math.round(confidence * 100)
    }, [workflow])

    const statusLabel = useMemo(() => {
        return mapProductStateLabel(workflow?.productState) ?? "Draft"
    }, [workflow?.productState])

    const handleBack = () => {
        navigate(-1)
    }

    const handleResetAll = () => {
        if (!initialFormRef.current) return
        setForm({ ...initialFormRef.current })
        toast.success("Đã khôi phục dữ liệu ban đầu")
    }

    const updateField = <K extends keyof ConfirmFormState>(
        key: K,
        value: ConfirmFormState[K],
    ) => {
        setForm((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                [key]: value,
            }
        })
    }

    const handleSubmit = async () => {
        if (!workflow || !form) return

        if (!validation.isValid) {
            toast.error(`Còn thiếu ${validation.missingFields.length} trường bắt buộc`)
            return
        }

        if (!user?.userId) {
            toast.error("Không xác định được người xác nhận")
            return
        }

        if (!form.productId) {
            toast.error("Thiếu productId để xác nhận sản phẩm")
            return
        }

        setIsSubmitting(true)

        try {
            const verifyResult = await productAiService.verifyProduct(form.productId, {
                name: form.name.trim(),
                brand: form.brand.trim(),
                category: form.category.trim(),
                barcode: form.barcode.trim(),
                originalPrice: Number(form.originalPrice),
                expiryDate: new Date(form.expiryDate).toISOString(),
                manufactureDate: form.manufactureDate
                    ? new Date(form.manufactureDate).toISOString()
                    : undefined,
                isFreshFood: form.isFreshFood,
                verifiedBy: user.userId,
            })

            const verifiedWorkflow = mapVerifyProductResultToWorkflow(verifyResult)
            const nextWorkflow = mergeWorkflowSnapshots(workflow, verifiedWorkflow)

            console.log("✅ ConfirmProduct.verifyResult:", verifyResult)
            console.log("✅ ConfirmProduct.nextWorkflow:", nextWorkflow)

            toast.success("Xác nhận sản phẩm thành công")

            navigate(
                `/supermarketStaff/products/${verifyResult.productId}/pricing`,
                {
                    state: {
                        workflow: nextWorkflow,
                        uploadedImages,
                    },
                },
            )
        } catch (error) {
            console.error("❌ ConfirmProduct.handleSubmit -> error:", error)
            toast.error("Xác nhận sản phẩm thất bại")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!workflow || !form) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
                <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                        <AlertCircle className="h-7 w-7" />
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900">
                        Không có dữ liệu để xác nhận
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Bạn hãy quay lại bước thêm ảnh để AI tạo workflow sản phẩm trước.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/supermarketStaff/products/add")}
                        className="mt-5 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Quay về trang thêm sản phẩm
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-7xl px-6 pb-14 pt-28">
                <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50/60 p-6 shadow-[0_16px_50px_rgba(14,165,233,0.08)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                Xác nhận dữ liệu AI
                            </div>

                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Xác nhận sản phẩm trước khi định giá
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Kiểm tra và chỉnh lại thông tin AI đã đọc được. Sau khi xác nhận,
                                hệ thống sẽ chuyển sang bước định giá lô hàng.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                                Trạng thái: <span className="font-semibold text-slate-900">{statusLabel}</span>
                            </div>

                            {aiConfidencePercent !== null ? (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                                    Độ tin cậy AI: {aiConfidencePercent}%
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                            <div className="border-b border-slate-100 px-5 py-4">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Hình ảnh sản phẩm
                                </h2>
                            </div>

                            {previewImages.length > 0 ? (
                                <div className="p-5">
                                    <div className="flex h-[360px] items-center justify-center overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                                        <img
                                            src={previewImages[activeImageIndex]}
                                            alt="Ảnh sản phẩm"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>

                                    {previewImages.length > 1 ? (
                                        <div className="mt-4 flex gap-2 overflow-x-auto">
                                            {previewImages.map((img, index) => (
                                                <button
                                                    key={`${img}-${index}`}
                                                    type="button"
                                                    onClick={() => setActiveImageIndex(index)}
                                                    className={cn(
                                                        "h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white",
                                                        index === activeImageIndex
                                                            ? "border-sky-500 ring-2 ring-sky-100"
                                                            : "border-slate-200",
                                                    )}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`thumb-${index}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-10 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                        <ImageIcon className="h-7 w-7 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Chưa có hình ảnh sản phẩm
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                            <h3 className="text-base font-semibold text-slate-900">
                                Gợi ý từ AI
                            </h3>

                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <span className="font-medium text-slate-800">Tên AI đọc được:</span>{" "}
                                    {workflow.extractedInfo?.name || workflow.barcodeLookupInfo?.productName || "—"}
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <span className="font-medium text-slate-800">Barcode AI đọc được:</span>{" "}
                                    {workflow.extractedInfo?.barcode || workflow.barcodeLookupInfo?.barcode || "—"}
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <span className="font-medium text-slate-800">Thương hiệu AI đọc được:</span>{" "}
                                    {workflow.extractedInfo?.brand || workflow.barcodeLookupInfo?.brand || "—"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Thông tin sản phẩm
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Các trường có dấu * là bắt buộc trước khi sang bước định giá.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Reset dữ liệu
                            </button>
                        </div>

                        <div className="space-y-6">
                            <section className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                                    AI nhận diện sản phẩm
                                </div>

                                <div className="grid gap-4 p-4 md:grid-cols-2">
                                    <Field
                                        label="Mã sản phẩm"
                                        value={form.productId}
                                        readOnly
                                    />
                                    <Field
                                        label="Mã vạch *"
                                        value={form.barcode}
                                        onChange={(value) => updateField("barcode", value)}
                                    />
                                    <Field
                                        label="Tên sản phẩm *"
                                        value={form.name}
                                        onChange={(value) => updateField("name", value)}
                                    />
                                    <Field
                                        label="Thương hiệu *"
                                        value={form.brand}
                                        onChange={(value) => updateField("brand", value)}
                                    />
                                    <SelectField
                                        label="Danh mục *"
                                        value={form.category}
                                        onChange={(value) => updateField("category", value)}
                                        options={CATEGORY_OPTIONS}
                                    />
                                    <CheckboxField
                                        label="Thực phẩm tươi"
                                        checked={form.isFreshFood}
                                        onChange={(checked) => updateField("isFreshFood", checked)}
                                    />
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                                    Thông tin chi tiết
                                </div>

                                <div className="grid gap-4 p-4">
                                    <TextareaField
                                        label="Thành phần"
                                        value={form.ingredients}
                                        onChange={(value) => updateField("ingredients", value)}
                                    />
                                    <TextareaField
                                        label="Thành phần dinh dưỡng"
                                        value={form.nutritionFacts}
                                        onChange={(value) => updateField("nutritionFacts", value)}
                                    />
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                                    Thông tin cần xác nhận
                                </div>

                                <div className="grid gap-4 p-4 md:grid-cols-2">
                                    <CurrencyField
                                        label="Giá gốc *"
                                        value={form.originalPrice}
                                        onChange={(value) => updateField("originalPrice", value)}
                                    />
                                    <DateField
                                        label="Hạn sử dụng *"
                                        value={form.expiryDate}
                                        onChange={(value) => updateField("expiryDate", value)}
                                    />
                                    <DateField
                                        label="Ngày sản xuất"
                                        value={form.manufactureDate}
                                        onChange={(value) => updateField("manufactureDate", value)}
                                    />
                                </div>
                            </section>
                        </div>

                        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            {validation.isValid ? (
                                <div className="flex items-center gap-2 font-medium">
                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                    Dữ liệu đã đủ để chuyển sang bước định giá
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 font-medium">
                                        <AlertCircle className="h-4.5 w-4.5" />
                                        Còn thiếu {validation.missingFields.length} trường bắt buộc
                                    </div>
                                    <div className="text-amber-700">
                                        {validation.missingFields.join(" • ")}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Quay lại
                            </button>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => toast.success("Bản nháp đang nằm trong workflow hiện tại")}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                                >
                                    <Save className="h-4 w-4" />
                                    Lưu nháp
                                </button>

                                <button
                                    type="button"
                                    disabled={!validation.isValid || isSubmitting}
                                    onClick={handleSubmit}
                                    className={cn(
                                        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition",
                                        validation.isValid && !isSubmitting
                                            ? "bg-sky-600 text-white shadow-[0_12px_30px_rgba(14,165,233,0.24)] hover:bg-sky-700"
                                            : "cursor-not-allowed bg-slate-100 text-slate-400",
                                    )}
                                >
                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                    {isSubmitting ? "Đang xác nhận..." : "Xác nhận và sang bước định giá"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

type FieldProps = {
    label: string
    value: string
    onChange?: (value: string) => void
    readOnly?: boolean
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, readOnly = false }) => {
    return (
        <label className="block">
            <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
            <input
                type="text"
                value={value}
                readOnly={readOnly}
                onChange={(e) => onChange?.(e.target.value)}
                className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                    readOnly
                        ? "border-slate-200 bg-slate-50 text-slate-500"
                        : "border-slate-200 bg-white text-slate-900 focus:border-sky-400 focus:ring-4 focus:ring-sky-100",
                )}
            />
        </label>
    )
}

type SelectFieldProps = {
    label: string
    value: string
    onChange: (value: string) => void
    options: ReadonlyArray<{ label: string; value: string }>
}

const SelectField: React.FC<SelectFieldProps> = ({
    label,
    value,
    onChange,
    options,
}) => {
    return (
        <label className="block">
            <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
                <option value="">-- Chọn --</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    )
}

type CheckboxFieldProps = {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({
    label,
    checked,
    onChange,
}) => {
    return (
        <label className="flex h-full min-h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
            />
            <span className="text-sm font-medium text-slate-700">{label}</span>
        </label>
    )
}

type TextareaFieldProps = {
    label: string
    value: string
    onChange: (value: string) => void
}

const TextareaField: React.FC<TextareaFieldProps> = ({
    label,
    value,
    onChange,
}) => {
    return (
        <label className="block">
            <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
        </label>
    )
}

type CurrencyFieldProps = {
    label: string
    value: number | ""
    onChange: (value: number) => void
}

const CurrencyField: React.FC<CurrencyFieldProps> = ({
    label,
    value,
    onChange,
}) => {
    return (
        <label className="block">
            <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
            <input
                type="text"
                inputMode="numeric"
                value={typeof value === "number" ? formatCurrencyVN(value) : ""}
                onChange={(e) => onChange(parseCurrencyVN(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
        </label>
    )
}

type DateFieldProps = {
    label: string
    value: string
    onChange: (value: string) => void
}

const DateField: React.FC<DateFieldProps> = ({ label, value, onChange }) => {
    return (
        <label className="block">
            <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
        </label>
    )
}

export default ConfirmProduct

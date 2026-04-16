import React, { useEffect, useMemo, useState } from "react"
import { Loader2, Save, X } from "lucide-react"
import toast from "react-hot-toast"

import { productService } from "@/services/product.service"
import type {
    ProductDetailDto,
    ProductEditFormValues,
    ProductResponseDto,
    UpdateProductRequestDto,
} from "@/types/product.type"
import {
    PRODUCT_STATUS_OPTIONS,
    PRODUCT_TYPE_OPTIONS,
} from "@/types/product.type"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type ProductEditModalProps = {
    open: boolean
    productId: string | null
    onClose: () => void
    onSaved?: () => void
}

const createEmptyForm = (): ProductEditFormValues => ({
    supermarketId: "",
    name: "",
    categoryName: "",
    barcode: "",
    type: 0,
    sku: "",
    status: 0,
    responsibleOrg: "",
    isFeatured: false,
    tagsText: "",

    brand: "",
    ingredientsText: "",
    nutritionFactsText: "{}",
    usageInstructions: "",
    storageInstructions: "",
    manufacturer: "",
    origin: "",
    description: "",
    safetyWarnings: "",
})

const parseNutritionFactsText = (value: string): string => {
    const trimmed = value.trim()

    if (!trimmed) {
        return "{}"
    }

    try {
        const parsed = JSON.parse(trimmed)
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return JSON.stringify(parsed)
        }

        throw new Error("Nutrition facts phải là object JSON")
    } catch (error) {
        throw new Error("Thành phần dinh dưỡng phải là JSON object hợp lệ")
    }
}

const joinArrayToMultiline = (items?: string[]) => {
    if (!items?.length) return ""
    return items.join("\n")
}

const prettyJson = (value?: Record<string, string>) => {
    if (!value || Object.keys(value).length === 0) return "{}"
    return JSON.stringify(value, null, 2)
}

const buildFormFromResponses = (
    product: ProductResponseDto,
    details: ProductDetailDto,
): ProductEditFormValues => {
    return {
        supermarketId: product.supermarketId || "",
        name: product.name || details.name || "",
        categoryName: product.category || details.category || "",
        barcode: product.barcode || details.barcode || "",
        type: typeof product.type === "number" ? product.type : 0,
        sku: product.sku || "",
        status: typeof product.status === "number" ? product.status : 0,
        responsibleOrg: details.distributor || "",
        isFeatured: false,
        tagsText: "",

        brand: details.brand || product.brand || "",
        ingredientsText: joinArrayToMultiline(details.ingredients || product.ingredients),
        nutritionFactsText: prettyJson(details.nutritionFacts || product.nutritionFacts || {}),
        usageInstructions: details.usageInstructions || "",
        storageInstructions: details.storageInstructions || "",
        manufacturer: details.manufacturer || "",
        origin: details.origin || "",
        description: details.description || "",
        safetyWarnings: details.safetyWarning || "",
    }
}

const mapFormToPayload = (form: ProductEditFormValues): UpdateProductRequestDto => {
    return {
        supermarketId: form.supermarketId.trim(),
        name: form.name.trim(),
        categoryName: form.categoryName.trim(),
        barcode: form.barcode.trim(),
        type: Number(form.type) || 0,
        sku: form.sku.trim(),
        status: Number(form.status) || 0,
        responsibleOrg: form.responsibleOrg.trim(),
        isFeatured: Boolean(form.isFeatured),
        tags: form.tagsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        detail: {
            brand: form.brand.trim(),
            ingredients: form.ingredientsText
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
                .join(", "),
            nutritionFactsJson: parseNutritionFactsText(form.nutritionFactsText),
            usageInstructions: form.usageInstructions.trim(),
            storageInstructions: form.storageInstructions.trim(),
            manufacturer: form.manufacturer.trim(),
            origin: form.origin.trim(),
            description: form.description.trim(),
            safetyWarnings: form.safetyWarnings.trim(),
        },
    }
}

const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
    children,
    required,
}) => (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {children} {required ? <span className="text-rose-500">*</span> : null}
    </label>
)

const TextInput: React.FC<
    React.InputHTMLAttributes<HTMLInputElement> & {
        error?: string
    }
> = ({ className, error, ...props }) => (
    <div>
        <input
            {...props}
            className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
                "focus:border-slate-400 focus:ring-2 focus:ring-slate-100",
                error && "border-rose-300 focus:border-rose-400 focus:ring-rose-50",
                className,
            )}
        />
        {error ? <p className="mt-1 text-xs text-rose-500">{error}</p> : null}
    </div>
)

const TextArea: React.FC<
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
        error?: string
    }
> = ({ className, error, ...props }) => (
    <div>
        <textarea
            {...props}
            className={cn(
                "min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
                "focus:border-slate-400 focus:ring-2 focus:ring-slate-100",
                error && "border-rose-300 focus:border-rose-400 focus:ring-rose-50",
                className,
            )}
        />
        {error ? <p className="mt-1 text-xs text-rose-500">{error}</p> : null}
    </div>
)

const SelectInput: React.FC<
    React.SelectHTMLAttributes<HTMLSelectElement> & {
        error?: string
        options: Array<{ value: number | string; label: string }>
    }
> = ({ className, error, options, ...props }) => (
    <div>
        <select
            {...props}
            className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
                "focus:border-slate-400 focus:ring-2 focus:ring-slate-100",
                error && "border-rose-300 focus:border-rose-400 focus:ring-rose-50",
                className,
            )}
        >
            {options.map((option) => (
                <option key={String(option.value)} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        {error ? <p className="mt-1 text-xs text-rose-500">{error}</p> : null}
    </div>
)

const ProductEditModal: React.FC<ProductEditModalProps> = ({
    open,
    productId,
    onClose,
    onSaved,
}) => {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<ProductEditFormValues>(createEmptyForm())
    const [errors, setErrors] = useState<Record<string, string>>({})

    const title = useMemo(() => {
        if (!form.name?.trim()) return "Chỉnh sửa sản phẩm"
        return `Chỉnh sửa: ${form.name}`
    }, [form.name])

    useEffect(() => {
        if (!open || !productId) {
            setForm(createEmptyForm())
            setErrors({})
            return
        }

        const loadData = async () => {
            setLoading(true)
            setErrors({})

            try {
                const [product, details] = await Promise.all([
                    productService.getProductById(productId),
                    productService.getProductDetails(productId),
                ])

                setForm(buildFormFromResponses(product, details))
            } catch (error) {
                console.error("ProductEditModal.loadData -> error:", error)
                toast.error("Không tải được thông tin sản phẩm")
            } finally {
                setLoading(false)
            }
        }

        void loadData()
    }, [open, productId])

    const setField = <K extends keyof ProductEditFormValues>(
        key: K,
        value: ProductEditFormValues[K],
    ) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }))

        setErrors((prev) => {
            if (!prev[key as string]) return prev
            const next = { ...prev }
            delete next[key as string]
            return next
        })
    }

    const validate = () => {
        const nextErrors: Record<string, string> = {}

        if (!form.supermarketId.trim()) {
            nextErrors.supermarketId = "Thiếu supermarketId"
        }

        if (!form.name.trim()) {
            nextErrors.name = "Vui lòng nhập tên sản phẩm"
        }

        if (!form.categoryName.trim()) {
            nextErrors.categoryName = "Vui lòng nhập danh mục"
        }

        if (!form.barcode.trim()) {
            nextErrors.barcode = "Vui lòng nhập mã vạch"
        }

        try {
            parseNutritionFactsText(form.nutritionFactsText)
        } catch (error) {
            nextErrors.nutritionFactsText =
                error instanceof Error ? error.message : "JSON không hợp lệ"
        }

        setErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const handleSave = async () => {
        if (!productId) return
        if (!validate()) return

        setSaving(true)

        try {
            const payload = mapFormToPayload(form)

            console.log("ProductEditModal.handleSave -> payload:", payload)

            await productService.updateProduct(productId, payload)

            toast.success("Cập nhật thông tin sản phẩm thành công")
            onSaved?.()
            onClose()
        } catch (error) {
            console.error("ProductEditModal.handleSave -> error:", error)
            toast.error("Không thể cập nhật thông tin sản phẩm")
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Chỉnh sửa product theo Swagger `GET /Products/{`id`}`,
                            `GET /Products/{`id`}/details`, `PUT /Products/{`id`}`.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải thông tin sản phẩm...
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Thông tin chính
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <FieldLabel required>Tên sản phẩm</FieldLabel>
                                            <TextInput
                                                value={form.name}
                                                onChange={(e) => setField("name", e.target.value)}
                                                error={errors.name}
                                                placeholder="Nhập tên sản phẩm"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel required>Mã vạch</FieldLabel>
                                            <TextInput
                                                value={form.barcode}
                                                onChange={(e) =>
                                                    setField("barcode", e.target.value)
                                                }
                                                error={errors.barcode}
                                                placeholder="Nhập mã vạch"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel required>Danh mục</FieldLabel>
                                            <TextInput
                                                value={form.categoryName}
                                                onChange={(e) =>
                                                    setField("categoryName", e.target.value)
                                                }
                                                error={errors.categoryName}
                                                placeholder="Ví dụ: Đồ uống"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>Thương hiệu</FieldLabel>
                                            <TextInput
                                                value={form.brand}
                                                onChange={(e) => setField("brand", e.target.value)}
                                                placeholder="Nhập thương hiệu"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>SKU</FieldLabel>
                                            <TextInput
                                                value={form.sku}
                                                onChange={(e) => setField("sku", e.target.value)}
                                                placeholder="Nhập SKU"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>Loại sản phẩm</FieldLabel>
                                            <SelectInput
                                                value={form.type}
                                                onChange={(e) =>
                                                    setField("type", Number(e.target.value))
                                                }
                                                options={PRODUCT_TYPE_OPTIONS}
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>Trạng thái</FieldLabel>
                                            <SelectInput
                                                value={form.status}
                                                onChange={(e) =>
                                                    setField("status", Number(e.target.value))
                                                }
                                                options={PRODUCT_STATUS_OPTIONS}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <FieldLabel>Supermarket ID</FieldLabel>
                                            <TextInput
                                                value={form.supermarketId}
                                                onChange={(e) =>
                                                    setField("supermarketId", e.target.value)
                                                }
                                                error={errors.supermarketId}
                                                placeholder="Guid siêu thị"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <FieldLabel>Responsible org</FieldLabel>
                                            <TextInput
                                                value={form.responsibleOrg}
                                                onChange={(e) =>
                                                    setField("responsibleOrg", e.target.value)
                                                }
                                                placeholder="Đơn vị chịu trách nhiệm / distributor"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <FieldLabel>Tags</FieldLabel>
                                            <TextInput
                                                value={form.tagsText}
                                                onChange={(e) =>
                                                    setField("tagsText", e.target.value)
                                                }
                                                placeholder="tag1, tag2, tag3"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={form.isFeatured}
                                                    onChange={(e) =>
                                                        setField("isFeatured", e.target.checked)
                                                    }
                                                    className="h-4 w-4 rounded border-slate-300"
                                                />
                                                Đánh dấu nổi bật
                                            </label>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Mô tả chi tiết
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <FieldLabel>Nhà sản xuất</FieldLabel>
                                            <TextInput
                                                value={form.manufacturer}
                                                onChange={(e) =>
                                                    setField("manufacturer", e.target.value)
                                                }
                                                placeholder="Nhập nhà sản xuất"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>Xuất xứ</FieldLabel>
                                            <TextInput
                                                value={form.origin}
                                                onChange={(e) => setField("origin", e.target.value)}
                                                placeholder="Nhập xuất xứ"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>Mô tả</FieldLabel>
                                            <TextArea
                                                value={form.description}
                                                onChange={(e) =>
                                                    setField("description", e.target.value)
                                                }
                                                placeholder="Mô tả sản phẩm"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>Thành phần</FieldLabel>
                                            <TextArea
                                                value={form.ingredientsText}
                                                onChange={(e) =>
                                                    setField("ingredientsText", e.target.value)
                                                }
                                                placeholder={
                                                    "Mỗi dòng một thành phần\nVí dụ:\nNước\nĐường\nSữa bột"
                                                }
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>Thành phần dinh dưỡng JSON</FieldLabel>
                                            <TextArea
                                                value={form.nutritionFactsText}
                                                onChange={(e) =>
                                                    setField("nutritionFactsText", e.target.value)
                                                }
                                                error={errors.nutritionFactsText}
                                                className="min-h-[180px] font-mono"
                                                placeholder={`{\n  "energy": "100 kcal",\n  "protein": "3 g"\n}`}
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>Hướng dẫn sử dụng</FieldLabel>
                                            <TextArea
                                                value={form.usageInstructions}
                                                onChange={(e) =>
                                                    setField("usageInstructions", e.target.value)
                                                }
                                                placeholder="Nhập hướng dẫn sử dụng"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>Hướng dẫn bảo quản</FieldLabel>
                                            <TextArea
                                                value={form.storageInstructions}
                                                onChange={(e) =>
                                                    setField("storageInstructions", e.target.value)
                                                }
                                                placeholder="Nhập hướng dẫn bảo quản"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel>Cảnh báo an toàn</FieldLabel>
                                            <TextArea
                                                value={form.safetyWarnings}
                                                onChange={(e) =>
                                                    setField("safetyWarnings", e.target.value)
                                                }
                                                placeholder="Nhập cảnh báo an toàn"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Form này chỉ sửa <strong>product info</strong>. Các field thuộc
                                lot như hạn dùng, ngày sản xuất, số lượng, cân nặng, giá lot,
                                đơn vị lot hiện chưa có API update riêng trong Swagger.
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Lưu thay đổi
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default ProductEditModal

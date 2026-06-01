import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { Loader2, Plus, X } from "lucide-react"

import type {
    CategoryItem,
    PromotionItem,
    UpsertPromotionPayload,
} from "@/types/admin.type"
import type { PromotionClient } from "@/types/promotion.type"
import { adminService } from "@/services/admin.service"
import { categoryService } from "@/services/category.service"
import type { CategoryProductImpact } from "@/types/category.type"
import { showError, showSuccess } from "@/utils/toast"

import {
    buildPromotionForm,
    formatDateTime,
    formatMoney,
    formatNumber,
    getDiscountTypeLabel,
    logApiError,
    logApiSuccess,
    normalizeCreatePromotionPayload,
    buildPromotionUpdatePayload,
    validatePromotionPayload,
} from "./Shared"
import {
    getPromotionStatusClass,
    getPromotionStatusLabel,
} from "@/utils/promotionDisplay"

type Props = {
    loading: boolean
    promotions: PromotionItem[]
    categories: CategoryItem[]
    onRefresh: () => Promise<void>
    client?: PromotionClient
    title?: string
    description?: string
    showHeader?: boolean
}

type PromotionStatusFilter = "ALL" | "Draft" | "Active" | "Expired" | "Disabled"

const EMPTY_PROMOTION: UpsertPromotionPayload = {
    code: "",
    categoryId: "",
    name: "",
    discountType: "Percentage",
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    maxUsage: 0,
    perUserLimit: 0,
    startDate: "",
    endDate: "",
    status: "Draft",
}

const normalizeText = (value?: string | null) =>
    (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()

const compareText = (left?: string | null, right?: string | null) =>
    (left ?? "").localeCompare(right ?? "", "vi", {
        sensitivity: "base",
        numeric: true,
    })

const createStatusOptions = [
    { value: "Draft", label: "Bản nháp" },
    { value: "Active", label: "Áp dụng" },
]

const statusOptions = [
    { value: "Draft", label: "Bản nháp" },
    { value: "Active", label: "Đang áp dụng" },
    { value: "Expired", label: "Đã hết hạn" },
    { value: "Disabled", label: "Đã tắt" },
]

const discountTypeOptions = [
    { value: "Percentage", label: "Giảm theo phần trăm" },
    { value: "FixedAmount", label: "Giảm theo số tiền cố định" },
]

const buildCategoryLabel = (category: CategoryItem) => {
    const parentName = category.parentName?.trim()
    return parentName ? `${parentName} → ${category.name}` : category.name
}

const parseNumericInput = (value: string) => {
    const digits = value.replace(/[^\d]/g, "")
    return Number(digits || 0)
}

const formatIntegerDisplay = (value?: number | null) => formatNumber(value ?? 0)

const formatPercentDisplay = (value?: number | null) => `${formatNumber(value ?? 0)}%`

const FieldLabel = ({
    children,
    hint,
}: {
    children: string
    hint?: string
}) => (
    <label className="mb-2 block text-xs font-semibold text-slate-500">
        <span>{children}</span>
        {hint ? <span className="ml-1 font-normal text-slate-400">• {hint}</span> : null}
    </label>
)

type NumericInputProps = {
    value?: number | null
    onChange: (value: number) => void
    placeholder?: string
    suffix?: string
}

const NumericInput = ({
    value,
    onChange,
    placeholder,
    suffix,
}: NumericInputProps) => {
    const displayValue =
        value && value > 0 ? formatIntegerDisplay(value) : ""

    return (
        <div className="relative">
            <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={(e) => onChange(parseNumericInput(e.target.value))}
                placeholder={placeholder}
                className={[
                    "w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900",
                    suffix ? "pr-14" : "",
                ].join(" ")}
            />
            {suffix ? (
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-slate-400">
                    {suffix}
                </span>
            ) : null}
        </div>
    )
}

const PromotionCategoryImpact = ({ categoryId }: { categoryId: string }) => {
    const [impact, setImpact] = useState<CategoryProductImpact | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!categoryId) {
            setImpact(null)
            setError(null)
            return
        }

        let cancelled = false
        const timer = window.setTimeout(() => {
            setLoading(true)
            setError(null)
            void categoryService
                .getProductImpact(categoryId)
                .then((data) => {
                    if (!cancelled) setImpact(data)
                })
                .catch((err) => {
                    if (!cancelled) {
                        setImpact(null)
                        setError(
                            err instanceof Error
                                ? err.message
                                : "Không thể tải số sản phẩm ảnh hưởng",
                        )
                    }
                })
                .finally(() => {
                    if (!cancelled) setLoading(false)
                })
        }, 300)

        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [categoryId])

    if (!categoryId) return null

    if (loading) {
        return (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tính số sản phẩm trong danh mục...
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
            </div>
        )
    }

    if (!impact) return null

    if (impact.totalProducts === 0) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">Chưa có sản phẩm trong phạm vi danh mục</p>
                <p className="mt-1 text-amber-800">
                    Danh mục &quot;{impact.categoryName}&quot;
                    {impact.subcategoryCount > 0
                        ? ` (gồm ${impact.subcategoryCount} danh mục con)`
                        : ""}{" "}
                    hiện không có sản phẩm. Cân nhắc chọn danh mục khác hoặc phối hợp
                    siêu thị bổ sung hàng trước khi tạo khuyến mãi.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
            <p className="font-semibold">Phạm vi ảnh hưởng ước tính</p>
            <p className="mt-1">
                Danh mục <span className="font-medium">{impact.categoryName}</span>
                {impact.subcategoryCount > 0 ? (
                    <>
                        {" "}
                        — gồm <span className="font-medium">{impact.subcategoryCount}</span>{" "}
                        danh mục con
                    </>
                ) : null}
                :{" "}
                <span className="font-semibold">{formatNumber(impact.totalProducts)}</span>{" "}
                sản phẩm liên quan
                {impact.publishedProducts < impact.totalProducts ? (
                    <>
                        , trong đó{" "}
                        <span className="font-semibold">
                            {formatNumber(impact.publishedProducts)}
                        </span>{" "}
                        đang đăng bán
                    </>
                ) : (
                    <> (đều đang đăng bán)</>
                )}
                .
            </p>
            <p className="mt-2 text-xs text-sky-800/90">
                Đếm theo danh mục sản phẩm trong hệ thống (bao gồm danh mục con), không
                bao gồm sản phẩm đã ẩn hoặc đã xóa.
            </p>
        </div>
    )
}

const PromotionSummaryChip = ({
    label,
    value,
}: {
    label: string
    value: string
}) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
)

const PromotionFormGrid = ({
    value,
    onChange,
    categories,
    mode = "create",
}: {
    value: UpsertPromotionPayload
    onChange: React.Dispatch<React.SetStateAction<UpsertPromotionPayload>>
    categories: CategoryItem[]
    mode?: "create" | "edit"
}) => {
    const selectedCategory = categories.find(
        (item) => item.categoryId === value.categoryId
    )
    const isCreate = mode === "create"

    return (
        <div className="space-y-4">
            {!isCreate ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Chỉ được sửa mã, tên và danh mục. Mức giảm, thời gian và trạng thái
                    không thể thay đổi sau khi tạo.
                </p>
            ) : null}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                    <FieldLabel>Mã ưu đãi</FieldLabel>
                    <input
                        value={value.code}
                        onChange={(e) =>
                            onChange((prev) => ({
                                ...prev,
                                code: e.target.value,
                            }))
                        }
                        placeholder="Ví dụ: GIAM20"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    />
                </div>

                <div>
                    <FieldLabel>Tên chương trình</FieldLabel>
                    <input
                        value={value.name}
                        onChange={(e) =>
                            onChange((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                        placeholder="Ví dụ: Ưu đãi cuối ngày"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    />
                </div>

                <div>
                    <FieldLabel>Danh mục áp dụng</FieldLabel>
                    <select
                        value={value.categoryId}
                        onChange={(e) =>
                            onChange((prev) => ({
                                ...prev,
                                categoryId: e.target.value,
                            }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    >
                        <option value="">Chọn danh mục áp dụng</option>
                        {categories.map((category) => (
                            <option
                                key={category.categoryId}
                                value={category.categoryId}
                            >
                                {buildCategoryLabel(category)}
                            </option>
                        ))}
                    </select>
                </div>

                {value.categoryId ? (
                    <div className="md:col-span-2 xl:col-span-4">
                        <PromotionCategoryImpact categoryId={value.categoryId} />
                    </div>
                ) : null}

                {isCreate ? (
                    <>
                <div>
                    <FieldLabel>Kiểu giảm giá</FieldLabel>
                    <select
                        value={value.discountType}
                        onChange={(e) =>
                            onChange((prev) => ({
                                ...prev,
                                discountType: e.target.value,
                            }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    >
                        {discountTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <FieldLabel>
                        {value.discountType === "FixedAmount"
                            ? "Số tiền giảm"
                            : "Phần trăm giảm"}
                    </FieldLabel>
                    <NumericInput
                        value={value.discountValue}
                        onChange={(nextValue) =>
                            onChange((prev) => ({
                                ...prev,
                                discountValue: nextValue,
                            }))
                        }
                        placeholder={
                            value.discountType === "FixedAmount" ? "Ví dụ: 20.000" : "Ví dụ: 10"
                        }
                        suffix={value.discountType === "FixedAmount" ? "đ" : "%"}
                    />
                </div>

                <div>
                    <FieldLabel>Đơn tối thiểu</FieldLabel>
                    <NumericInput
                        value={value.minOrderAmount ?? 0}
                        onChange={(nextValue) =>
                            onChange((prev) => ({
                                ...prev,
                                minOrderAmount: nextValue,
                            }))
                        }
                        placeholder="Ví dụ: 25.000"
                        suffix="đ"
                    />
                </div>

                <div>
                    <FieldLabel>Mức giảm tối đa</FieldLabel>
                    <NumericInput
                        value={value.maxDiscountAmount ?? 0}
                        onChange={(nextValue) =>
                            onChange((prev) => ({
                                ...prev,
                                maxDiscountAmount: nextValue,
                            }))
                        }
                        placeholder="Ví dụ: 50.000"
                        suffix="đ"
                    />
                </div>

                <div>
                    <FieldLabel>Tổng số lượt sử dụng</FieldLabel>
                    <NumericInput
                        value={value.maxUsage}
                        onChange={(nextValue) =>
                            onChange((prev) => ({
                                ...prev,
                                maxUsage: nextValue,
                            }))
                        }
                        placeholder="Ví dụ: 1.000"
                    />
                </div>

                <div>
                    <FieldLabel>Giới hạn mỗi người</FieldLabel>
                    <NumericInput
                        value={value.perUserLimit}
                        onChange={(nextValue) =>
                            onChange((prev) => ({
                                ...prev,
                                perUserLimit: nextValue,
                            }))
                        }
                        placeholder="Ví dụ: 1"
                    />
                </div>

                <div>
                    <FieldLabel>Thời gian bắt đầu</FieldLabel>
                    <input
                        type="datetime-local"
                        value={value.startDate}
                        onChange={(e) =>
                            onChange((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                            }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    />
                </div>

                <div>
                    <FieldLabel>Thời gian kết thúc</FieldLabel>
                    <input
                        type="datetime-local"
                        value={value.endDate}
                        onChange={(e) =>
                            onChange((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                            }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    />
                </div>

                <div>
                    <FieldLabel>Trạng thái ban đầu</FieldLabel>
                    <select
                        value={value.status}
                        onChange={(e) =>
                            onChange((prev) => ({
                                ...prev,
                                status: e.target.value,
                            }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    >
                        {createStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                    </>
                ) : null}
            </div>

            {isCreate ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <PromotionSummaryChip
                    label="Danh mục"
                    value={
                        selectedCategory
                            ? buildCategoryLabel(selectedCategory)
                            : "Chưa chọn"
                    }
                />
                <PromotionSummaryChip
                    label="Mức giảm"
                    value={
                        value.discountType === "FixedAmount"
                            ? formatMoney(value.discountValue)
                            : formatPercentDisplay(value.discountValue)
                    }
                />
                <PromotionSummaryChip
                    label="Đơn tối thiểu"
                    value={formatMoney(value.minOrderAmount)}
                />
                <PromotionSummaryChip
                    label="Giảm tối đa"
                    value={formatMoney(value.maxDiscountAmount)}
                />
                <PromotionSummaryChip
                    label="Tổng lượt dùng"
                    value={formatIntegerDisplay(value.maxUsage)}
                />
                <PromotionSummaryChip
                    label="Mỗi người tối đa"
                    value={`${formatIntegerDisplay(value.perUserLimit)} lượt`}
                />
                <PromotionSummaryChip
                    label="Bắt đầu"
                    value={value.startDate ? formatDateTime(value.startDate) : "Chưa chọn"}
                />
                <PromotionSummaryChip
                    label="Kết thúc"
                    value={value.endDate ? formatDateTime(value.endDate) : "Chưa chọn"}
                />
            </div>
            ) : null}
        </div>
    )
}

const AdminSettingsPromotions = ({
    loading,
    promotions,
    categories,
    onRefresh,
    client,
    title = "Chương trình khuyến mãi",
    description = "Tạo, chỉnh sửa và theo dõi trạng thái các chương trình ưu đãi.",
    showHeader = true,
}: Props) => {
    const location = useLocation()

    const api: PromotionClient = client ?? {
        getPromotions: () => adminService.getPromotions(),
        createPromotion: (payload) => adminService.createPromotion(payload),
        updatePromotion: (promotionId, payload) =>
            adminService.updatePromotion(promotionId, payload),
        deletePromotion: (promotionId) => adminService.deletePromotion(promotionId),
    }
    const [newPromotion, setNewPromotion] =
        useState<UpsertPromotionPayload>(EMPTY_PROMOTION)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)

    const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null)
    const [editPromotion, setEditPromotion] =
        useState<UpsertPromotionPayload>(EMPTY_PROMOTION)

    const [searchKeyword, setSearchKeyword] = useState("")
    const [statusFilter, setStatusFilter] =
        useState<PromotionStatusFilter>("ALL")

    useEffect(() => {
        const shouldOpen =
            (location.state as { focusCreate?: boolean } | null)?.focusCreate ===
                true || location.hash === "#create"

        if (shouldOpen) {
            setNewPromotion(EMPTY_PROMOTION)
            setCreateModalOpen(true)
        }
    }, [location.hash, location.state])

    const openCreateModal = () => {
        setNewPromotion(EMPTY_PROMOTION)
        setCreateModalOpen(true)
    }

    const closeCreateModal = () => {
        if (creating) return
        setCreateModalOpen(false)
        setNewPromotion(EMPTY_PROMOTION)
    }

    const totalPromotions = promotions.length
    const activePromotions = promotions.filter(
        (item) => item.status === "Active"
    ).length
    const draftPromotions = promotions.filter(
        (item) => item.status === "Draft"
    ).length

    const categoryMap = useMemo(() => {
        return new Map(categories.map((item) => [item.categoryId, item]))
    }, [categories])

    const categoryOptions = useMemo(() => {
        return [...categories]
            .filter((item) => item.isActive)
            .sort((a, b) => {
                const parentCompare = compareText(
                    a.parentName || "",
                    b.parentName || ""
                )
                if (parentCompare !== 0) return parentCompare
                return compareText(a.name, b.name)
            })
    }, [categories])

    const filteredPromotions = useMemo(() => {
        const keyword = normalizeText(searchKeyword)

        return [...promotions]
            .filter((item) => {
                if (statusFilter !== "ALL" && item.status !== statusFilter) {
                    return false
                }

                if (!keyword) return true

                const selectedCategory = categoryMap.get(item.categoryId)
                const haystacks = [
                    item.name,
                    item.code,
                    item.categoryId,
                    selectedCategory?.name,
                    selectedCategory?.parentName,
                ]
                    .map((value) => normalizeText(value))
                    .filter(Boolean)

                return haystacks.some((value) => value.includes(keyword))
            })
            .sort((a, b) => compareText(a.name, b.name))
    }, [promotions, searchKeyword, statusFilter, categoryMap])

    const resetEditing = () => {
        setEditingPromotionId(null)
        setEditPromotion(EMPTY_PROMOTION)
    }

    const handleCreatePromotion = async () => {
        const payload = normalizeCreatePromotionPayload(newPromotion)
        const validationError = validatePromotionPayload(payload)

        if (validationError) {
            showError(validationError)
            return
        }

        try {
            setCreating(true)
            logApiSuccess("handleCreatePromotion - request", payload)
            const res = await api.createPromotion(payload)
            logApiSuccess("handleCreatePromotion - response", payload, res)

            showSuccess("Đã tạo chương trình khuyến mãi")
            setNewPromotion(EMPTY_PROMOTION)
            setCreateModalOpen(false)
            await onRefresh()
        } catch (error) {
            logApiError("handleCreatePromotion", error, payload)
            showError("Không thể tạo chương trình khuyến mãi")
        } finally {
            setCreating(false)
        }
    }

    const handleStartEdit = (item: PromotionItem) => {
        setEditingPromotionId(item.promotionId)
        setEditPromotion(buildPromotionForm(item))
    }

    const handleUpdatePromotion = async (promotionId: string) => {
        const payload = buildPromotionUpdatePayload(editPromotion)

        if (!payload.code) {
            showError("Vui lòng nhập mã khuyến mãi")
            return
        }
        if (!payload.categoryId) {
            showError("Vui lòng chọn danh mục áp dụng")
            return
        }
        if (!payload.name) {
            showError("Vui lòng nhập tên chương trình")
            return
        }

        try {
            logApiSuccess("handleUpdatePromotion - request", {
                promotionId,
                payload,
            })
            const res = await api.updatePromotion(promotionId, payload)
            logApiSuccess(
                "handleUpdatePromotion - response",
                { promotionId, payload },
                res
            )

            showSuccess("Đã cập nhật chương trình khuyến mãi")
            resetEditing()
            await onRefresh()
        } catch (error) {
            logApiError("handleUpdatePromotion", error, {
                promotionId,
                payload,
            })
            showError("Không thể cập nhật chương trình khuyến mãi")
        }
    }

    const handleDeletePromotion = async (item: PromotionItem) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa khuyến mãi "${item.name}" (${item.code})?`,
        )
        if (!confirmed) return

        try {
            await api.deletePromotion(item.promotionId)
            showSuccess("Đã xóa khuyến mãi")
            if (editingPromotionId === item.promotionId) {
                resetEditing()
            }
            await onRefresh()
        } catch (error) {
            logApiError("handleDeletePromotion", error, {
                promotionId: item.promotionId,
            })
            showError(
                error instanceof Error
                    ? error.message
                    : "Không thể xóa khuyến mãi",
            )
        }
    }

    const renderDiscountValue = (payload: {
        discountType?: string
        discountValue?: number
    }) => {
        if (
            payload.discountType === "FixedAmount"
        ) {
            return formatMoney(payload.discountValue)
        }

        return formatPercentDisplay(payload.discountValue)
    }

    return (
        <div className="space-y-5">
            {showHeader && (title || description) ? (
                <div>
                    {title ? (
                        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    ) : null}
                    {description ? (
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                    ) : null}
                </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-sm text-slate-500">Tổng số chương trình</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatNumber(totalPromotions)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-sm text-slate-500">Đang áp dụng</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatNumber(activePromotions)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-sm text-slate-500">Bản nháp</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatNumber(draftPromotions)}
                    </p>
                </div>
            </div>

            {createModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
                    onClick={closeCreateModal}
                    role="presentation"
                >
                    <div
                        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-promotion-title"
                    >
                        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-white px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2
                                        id="create-promotion-title"
                                        className="text-xl font-bold text-slate-900"
                                    >
                                        Tạo chương trình khuyến mãi
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Chọn danh mục áp dụng rồi điền mức giảm, điều kiện
                                        và thời gian hiệu lực.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    disabled={creating}
                                    className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                                    aria-label="Đóng"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
                            <PromotionFormGrid
                                value={newPromotion}
                                onChange={setNewPromotion}
                                categories={categoryOptions}
                                mode="create"
                            />
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                disabled={creating}
                                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleCreatePromotion()}
                                disabled={creating}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {creating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : null}
                                Tạo chương trình
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr]">
                        <input
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="Tìm theo tên, mã ưu đãi, tên danh mục"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value as PromotionStatusFilter,
                                )
                            }
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        <Plus className="h-4 w-4" />
                        Thêm khuyến mãi
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                        {formatNumber(filteredPromotions.length)} chương trình
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                {filteredPromotions.map((item) => {
                    const isEditing = editingPromotionId === item.promotionId
                    const selectedCategory = categoryMap.get(item.categoryId)

                    return (
                        <div
                            key={item.promotionId}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                            {isEditing ? (
                                <div className="space-y-4">
                                    <PromotionFormGrid
                                        value={editPromotion}
                                        onChange={setEditPromotion}
                                        categories={categoryOptions}
                                        mode="edit"
                                    />

                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() =>
                                                void handleUpdatePromotion(item.promotionId)
                                            }
                                            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                        >
                                            Lưu thay đổi
                                        </button>
                                        <button
                                            onClick={resetEditing}
                                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-base font-semibold text-slate-900">
                                                {item.name}
                                            </p>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${getPromotionStatusClass(
                                                    item.status
                                                )}`}
                                            >
                                                {getPromotionStatusLabel(item.status)}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-500 md:grid-cols-2">
                                            <p>
                                                <span className="font-medium text-slate-700">
                                                    Mã ưu đãi:
                                                </span>{" "}
                                                {item.code}
                                            </p>
                                            <p>
                                                <span className="font-medium text-slate-700">
                                                    Danh mục áp dụng:
                                                </span>{" "}
                                                {selectedCategory
                                                    ? buildCategoryLabel(selectedCategory)
                                                    : item.categoryId}
                                            </p>
                                            <p>
                                                <span className="font-medium text-slate-700">
                                                    Kiểu giảm:
                                                </span>{" "}
                                                {getDiscountTypeLabel(item.discountType)}
                                            </p>
                                            <p>
                                                <span className="font-medium text-slate-700">
                                                    Mức giảm:
                                                </span>{" "}
                                                {renderDiscountValue(item)}
                                            </p>
                                            <p>
                                                <span className="font-medium text-slate-700">
                                                    Đơn tối thiểu:
                                                </span>{" "}
                                                {formatMoney(item.minOrderAmount)}
                                            </p>
                                            <p>
                                                <span className="font-medium text-slate-700">
                                                    Giảm tối đa:
                                                </span>{" "}
                                                {formatMoney(item.maxDiscountAmount)}
                                            </p>
                                            <p>
                                                <span className="font-medium text-slate-700">
                                                    Tổng lượt dùng:
                                                </span>{" "}
                                                {formatNumber(item.maxUsage)}
                                            </p>
                                            <p>
                                                <span className="font-medium text-slate-700">
                                                    Đã sử dụng:
                                                </span>{" "}
                                                {formatNumber(item.usedCount)}
                                            </p>
                                            <p>
                                                <span className="font-medium text-slate-700">
                                                    Mỗi người tối đa:
                                                </span>{" "}
                                                {formatNumber(item.perUserLimit)} lượt
                                            </p>
                                            <p>
                                                <span className="font-medium text-slate-700">
                                                    Thời gian áp dụng:
                                                </span>{" "}
                                                {formatDateTime(item.startDate)} →{" "}
                                                {formatDateTime(item.endDate)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleStartEdit(item)}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            Sửa
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleDeletePromotion(item)
                                            }
                                            className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {!loading && filteredPromotions.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-500">
                        Chưa có chương trình nào phù hợp.
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminSettingsPromotions

import { useMemo, useState } from "react"

import type {
    CategoryItem,
    PromotionItem,
    UpsertPromotionPayload,
} from "@/types/admin.type"
import { adminService } from "@/services/admin.service"
import { showError, showSuccess } from "@/utils/toast"

import {
    buildPromotionForm,
    formatDateTime,
    formatMoney,
    formatNumber,
    getDiscountTypeLabel,
    getPromotionStatusClass,
    getPromotionStatusLabel,
    logApiError,
    logApiSuccess,
    normalizePromotionPayload,
    validatePromotionPayload,
} from "./Shared"

type Props = {
    loading: boolean
    promotions: PromotionItem[]
    categories: CategoryItem[]
    onRefresh: () => Promise<void>
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
}: {
    value: UpsertPromotionPayload
    onChange: React.Dispatch<React.SetStateAction<UpsertPromotionPayload>>
    categories: CategoryItem[]
}) => {
    const selectedCategory = categories.find(
        (item) => item.categoryId === value.categoryId
    )

    return (
        <div className="space-y-4">
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
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

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
        </div>
    )
}

const AdminSettingsPromotions = ({
    loading,
    promotions,
    categories,
    onRefresh,
}: Props) => {
    const [newPromotion, setNewPromotion] =
        useState<UpsertPromotionPayload>(EMPTY_PROMOTION)

    const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null)
    const [editPromotion, setEditPromotion] =
        useState<UpsertPromotionPayload>(EMPTY_PROMOTION)

    const [searchKeyword, setSearchKeyword] = useState("")
    const [statusFilter, setStatusFilter] =
        useState<PromotionStatusFilter>("ALL")

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
        const payload = normalizePromotionPayload(newPromotion)
        const validationError = validatePromotionPayload(payload)

        if (validationError) {
            showError(validationError)
            return
        }

        try {
            logApiSuccess("handleCreatePromotion - request", payload)
            const res = await adminService.createPromotion(payload)
            logApiSuccess("handleCreatePromotion - response", payload, res)

            showSuccess("Đã tạo chương trình khuyến mãi")
            setNewPromotion(EMPTY_PROMOTION)
            await onRefresh()
        } catch (error) {
            logApiError("handleCreatePromotion", error, payload)
            showError("Không thể tạo chương trình khuyến mãi")
        }
    }

    const handleStartEdit = (item: PromotionItem) => {
        setEditingPromotionId(item.promotionId)
        setEditPromotion(buildPromotionForm(item))
    }

    const handleUpdatePromotion = async (promotionId: string) => {
        const payload = normalizePromotionPayload(editPromotion)
        const validationError = validatePromotionPayload(payload)

        if (validationError) {
            showError(validationError)
            return
        }

        try {
            logApiSuccess("handleUpdatePromotion - request", {
                promotionId,
                payload,
            })
            const res = await adminService.updatePromotion(promotionId, payload)
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

    const handleUpdatePromotionStatus = async (
        promotionId: string,
        status: string
    ) => {
        try {
            logApiSuccess("handleUpdatePromotionStatus - request", {
                promotionId,
                status,
            })
            const res = await adminService.updatePromotionStatus(promotionId, status)
            logApiSuccess(
                "handleUpdatePromotionStatus - response",
                { promotionId, status },
                res
            )

            showSuccess("Đã cập nhật trạng thái")
            await onRefresh()
        } catch (error) {
            logApiError("handleUpdatePromotionStatus", error, {
                promotionId,
                status,
            })
            showError("Không thể cập nhật trạng thái khuyến mãi")
        }
    }

    const renderDiscountValue = (payload: {
        discountType?: string
        discountValue?: number
    }) => {
        if (payload.discountType === "FixedAmount") {
            return formatMoney(payload.discountValue)
        }

        return formatPercentDisplay(payload.discountValue)
    }

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Khuyến mãi</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Tạo mới và quản lý các chương trình ưu đãi theo từng danh mục sản phẩm.
                </p>
            </div>

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

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">
                        Tạo chương trình mới
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Chọn danh mục áp dụng rồi điền mức giảm, điều kiện và thời gian hiệu lực.
                    </p>
                </div>

                <PromotionFormGrid
                    value={newPromotion}
                    onChange={setNewPromotion}
                    categories={categoryOptions}
                />

                <div className="mt-4 flex justify-end">
                    <button
                        onClick={() => void handleCreatePromotion()}
                        className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        Tạo chương trình
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr]">
                    <input
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Tìm theo tên, mã ưu đãi, tên danh mục"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-slate-900"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value as PromotionStatusFilter)
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

                                        <select
                                            value={item.status}
                                            onChange={(e) =>
                                                void handleUpdatePromotionStatus(
                                                    item.promotionId,
                                                    e.target.value
                                                )
                                            }
                                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                                        >
                                            {statusOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
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

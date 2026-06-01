import type {
    AdminTimeSlot,
    CategoryItem,
    CollectionPoint,
    PromotionItem,
    UpsertPromotionPayload,
    UnitItem,
} from "@/types/admin.type"

export type TabKey =
    | "timeSlots"
    | "collectionPoints"
    | "parameters"
    | "categories"
    | "units"
    | "promotions"

export type TimeSlotUsageRow = AdminTimeSlot & {
    isInUse: boolean
}

export type UnitUsageRow = UnitItem & {
    isInUse: boolean
}

export type CollectionUsageRow = CollectionPoint & {
    isInUse: boolean
}

export type CategoryUsageRow = CategoryItem

export type CollectionSearchResultItem = {
    id: string
    displayName: string
    lat: number
    lng: number
}

export type EditableCollectionForm = {
    name: string
    addressLine: string
    latitude: string
    longitude: string
}

export const logApiError = (label: string, error: unknown, extra?: unknown) => {
    console.group(`[AdminSettings] ${label}`)
    if (extra !== undefined) console.log("context:", extra)
    console.log("error:", error)
    if (error instanceof Error) {
        console.log("message:", error.message)
    }
    console.log(
        "note:",
        "Chi tiết backend response dạng axios đã được admin.service.ts log ở console nếu request đi qua service."
    )
    console.groupEnd()
}

export const logApiSuccess = (
    label: string,
    payload?: unknown,
    response?: unknown
) => {
    console.group(`[AdminSettings] ${label}`)
    if (payload !== undefined) console.log("payload:", payload)
    if (response !== undefined) console.log("response:", response)
    console.groupEnd()
}

export const normalizeTimeSlotValue = (value?: string | null) => {
    if (!value) return "00:00:00"

    const normalized = value.trim()
    if (!normalized) return "00:00:00"

    const match = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (!match) return normalized

    const [, hourText, minuteText, secondText = "00"] = match
    const hour = Number(hourText)
    const minute = Number(minuteText)
    const second = Number(secondText)

    if (
        Number.isNaN(hour) ||
        Number.isNaN(minute) ||
        Number.isNaN(second) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59 ||
        second < 0 ||
        second > 59
    ) {
        return normalized
    }

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
        2,
        "0"
    )}:${String(second).padStart(2, "0")}`
}

export const hhmmFromTimeSpan = (
    value?: AdminTimeSlot["startTime"] | string | null
) => {
    if (!value) return "--"

    const normalized = normalizeTimeSlotValue(value)
    if (!normalized || normalized === "00:00:00") {
        return normalized === "00:00:00" ? "00:00" : "--"
    }

    const match = normalized.match(/^(\d{2}):(\d{2})(?::\d{2})?$/)
    if (!match) return normalized

    const [, hh, mm] = match
    return `${hh}:${mm}`
}

export const toTimeInputValue = (value?: string | null) => {
    if (!value) return ""

    const normalized = normalizeTimeSlotValue(value)
    const match = normalized.match(/^(\d{2}):(\d{2})(?::\d{2})?$/)

    if (!match) return ""
    const [, hh, mm] = match
    return `${hh}:${mm}`
}

export const formatDateTime = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"
    if (date.getFullYear() <= 1) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

export const formatNumber = (value?: number | null) =>
    new Intl.NumberFormat("vi-VN").format(value ?? 0)

export const formatMoney = (value?: number | null) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value ?? 0)

export {
    getPromotionStatusClass,
    getPromotionStatusLabel,
} from "@/utils/promotionDisplay"

export const getDiscountTypeLabel = (discountType?: string) => {
    switch ((discountType ?? "").toLowerCase()) {
        case "percentage":
        case "percent":
            return "Giảm theo phần trăm"
        case "fixedamount":
            return "Giảm số tiền cố định"
        default:
            return discountType || "--"
    }
}

export const normalizeText = (value?: string) =>
    (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()

export const googleMapsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`

export const parseCoordinate = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

export const parseMinutes = (value: string) => {
    const normalized = normalizeTimeSlotValue(value)
    const [hourText, minuteText] = normalized.split(":")
    const hour = Number(hourText)
    const minute = Number(minuteText)

    if (
        Number.isNaN(hour) ||
        Number.isNaN(minute) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
    ) {
        return null
    }

    return hour * 60 + minute
}

export const buildPromotionForm = (
    item: PromotionItem
): UpsertPromotionPayload => ({
    code: item.code ?? "",
    categoryId: item.categoryId ?? "",
    name: item.name ?? "",
    discountType:
        item.discountType === "Percent" ? "Percentage" : item.discountType ?? "Percentage",
    discountValue: Number(item.discountValue ?? 0),
    minOrderAmount: Number(item.minOrderAmount ?? 0),
    maxDiscountAmount: Number(item.maxDiscountAmount ?? 0),
    maxUsage: Number(item.maxUsage ?? 0),
    perUserLimit: Number(item.perUserLimit ?? 0),
    startDate: item.startDate ? item.startDate.slice(0, 16) : "",
    endDate: item.endDate ? item.endDate.slice(0, 16) : "",
    status: item.status ?? "Draft",
})

const toApiDateTime = (value: string) => {
    if (!value) return value
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toISOString()
}

export const normalizeCreatePromotionPayload = (
    source: UpsertPromotionPayload
): UpsertPromotionPayload => ({
    ...normalizePromotionPayload(source),
    startDate: toApiDateTime(source.startDate),
    endDate: toApiDateTime(source.endDate),
    status: source.status === "Active" ? "Active" : "Draft",
})

export const buildPromotionUpdatePayload = (source: UpsertPromotionPayload) => ({
    code: source.code.trim(),
    categoryId: source.categoryId.trim(),
    name: source.name.trim(),
})

export const validatePromotionPayload = (payload: UpsertPromotionPayload) => {
    if (!payload.code.trim()) return "Vui lòng nhập mã khuyến mãi"
    if (!payload.categoryId.trim()) return "Vui lòng nhập mã danh mục"
    if (!payload.name.trim()) return "Vui lòng nhập tên chương trình"
    if (!payload.startDate) return "Vui lòng chọn thời gian bắt đầu"
    if (!payload.endDate) return "Vui lòng chọn thời gian kết thúc"

    if (
        new Date(payload.endDate).getTime() <=
        new Date(payload.startDate).getTime()
    ) {
        return "Thời gian kết thúc phải sau thời gian bắt đầu"
    }

    if (payload.discountValue <= 0) return "Giá trị giảm phải lớn hơn 0"
    if ((payload.minOrderAmount ?? 0) < 0)
        return "Giá trị đơn tối thiểu không được âm"
    if ((payload.maxDiscountAmount ?? 0) < 0)
        return "Mức giảm tối đa không được âm"
    if (payload.maxUsage < 0) return "Tổng số lượt sử dụng không được âm"
    if (payload.perUserLimit < 0)
        return "Số lần dùng tối đa mỗi người không được âm"

    return null
}

export const normalizePromotionPayload = (
    source: UpsertPromotionPayload
): UpsertPromotionPayload => ({
    ...source,
    code: source.code.trim(),
    categoryId: source.categoryId.trim(),
    name: source.name.trim(),
    discountValue: Number(source.discountValue ?? 0),
    minOrderAmount: Number(source.minOrderAmount ?? 0),
    maxDiscountAmount: Number(source.maxDiscountAmount ?? 0),
    maxUsage: Number(source.maxUsage ?? 0),
    perUserLimit: Number(source.perUserLimit ?? 0),
})

export const normalizeCategoryPayload = (source: {
    parentCatId?: string | null
    isFreshFood: boolean
    name: string
    description?: string | null
    catIconUrl?: string | null
    isActive: boolean
}) => ({
    parentCatId: source.parentCatId || null,
    isFreshFood: Boolean(source.isFreshFood),
    name: source.name.trim(),
    description: source.description?.trim() || null,
    catIconUrl: source.catIconUrl?.trim() || null,
    isActive: Boolean(source.isActive),
})

export const compareText = (left?: string | null, right?: string | null) =>
    (left ?? "").localeCompare(right ?? "", "vi", {
        sensitivity: "base",
        numeric: true,
    })

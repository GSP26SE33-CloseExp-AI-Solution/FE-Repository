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

export const hhmmFromTimeSpan = (
    value?: AdminTimeSlot["startTime"] | string | null
) => {
    if (!value) return "--"

    if (typeof value === "string") {
        const normalized = value.trim()
        if (!normalized) return "--"

        const hhmmssMatch = normalized.match(/(\d{1,2}):(\d{2})(?::\d{2})?$/)
        if (hhmmssMatch) {
            const [, hh, mm] = hhmmssMatch
            return `${hh.padStart(2, "0")}:${mm}`
        }

        return normalized
    }

    if (typeof value.hours === "number" || typeof value.minutes === "number") {
        const hh = String(value.hours ?? 0).padStart(2, "0")
        const mm = String(value.minutes ?? 0).padStart(2, "0")
        return `${hh}:${mm}`
    }

    if (typeof value.totalMinutes === "number") {
        const totalMinutes = Math.round(value.totalMinutes ?? 0)
        const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
        const mm = String(totalMinutes % 60).padStart(2, "0")
        return `${hh}:${mm}`
    }

    if (typeof value.ticks === "number") {
        const totalMinutes = Math.floor(value.ticks / 10_000_000 / 60)
        const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
        const mm = String(totalMinutes % 60).padStart(2, "0")
        return `${hh}:${mm}`
    }

    return "--"
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

export const getPromotionStatusLabel = (status?: string) => {
    switch ((status ?? "").toLowerCase()) {
        case "draft":
            return "Bản nháp"
        case "active":
            return "Đang áp dụng"
        case "expired":
            return "Đã hết hạn"
        case "disabled":
            return "Đã tắt"
        default:
            return status || "--"
    }
}

export const getPromotionStatusClass = (status?: string) => {
    switch ((status ?? "").toLowerCase()) {
        case "draft":
            return "bg-slate-100 text-slate-700"
        case "active":
            return "bg-emerald-100 text-emerald-700"
        case "expired":
            return "bg-amber-100 text-amber-700"
        case "disabled":
            return "bg-rose-100 text-rose-700"
        default:
            return "bg-slate-100 text-slate-700"
    }
}

export const getDiscountTypeLabel = (discountType?: string) => {
    switch ((discountType ?? "").toLowerCase()) {
        case "percentage":
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
    const [hourText, minuteText] = value.split(":")
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
    discountType: item.discountType ?? "Percentage",
    discountValue: Number(item.discountValue ?? 0),
    minOrderAmount: Number(item.minOrderAmount ?? 0),
    maxDiscountAmount: Number(item.maxDiscountAmount ?? 0),
    maxUsage: Number(item.maxUsage ?? 0),
    perUserLimit: Number(item.perUserLimit ?? 0),
    startDate: item.startDate ? item.startDate.slice(0, 16) : "",
    endDate: item.endDate ? item.endDate.slice(0, 16) : "",
    status: item.status ?? "Draft",
})

export const validatePromotionPayload = (payload: UpsertPromotionPayload) => {
    if (!payload.code.trim()) return "Vui lòng nhập mã khuyến mãi"
    if (!payload.categoryId.trim()) return "Vui lòng nhập mã danh mục"
    if (!payload.name.trim()) return "Vui lòng nhập tên chương trình"
    if (!payload.startDate) return "Vui lòng chọn thời gian bắt đầu"
    if (!payload.endDate) return "Vui lòng chọn thời gian kết thúc"

    if (new Date(payload.endDate).getTime() <= new Date(payload.startDate).getTime()) {
        return "Thời gian kết thúc phải sau thời gian bắt đầu"
    }

    if (payload.discountValue <= 0) return "Giá trị giảm phải lớn hơn 0"
    if ((payload.minOrderAmount ?? 0) < 0) return "Giá trị đơn tối thiểu không được âm"
    if ((payload.maxDiscountAmount ?? 0) < 0) return "Mức giảm tối đa không được âm"
    if (payload.maxUsage < 0) return "Tổng số lượt sử dụng không được âm"
    if (payload.perUserLimit < 0) return "Số lần dùng tối đa mỗi người không được âm"

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

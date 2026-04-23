import type { AdminSupermarketItem } from "@/types/admin.type"

export const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

export const formatCompactNumber = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value)

export const formatDate = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

export const formatDateTime = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

export const normalizeStatus = (value?: string) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "")

export const hasCoordinates = (item: {
    latitude?: number | null
    longitude?: number | null
}) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)

export const getProfileScore = (item: AdminSupermarketItem) => {
    let score = 0
    if (item.name?.trim()) score += 1
    if (item.address?.trim()) score += 1
    if (item.contactPhone?.trim()) score += 1
    if (hasCoordinates(item)) score += 1
    return score
}

export const getMissingFields = (item: AdminSupermarketItem) => {
    const missing: string[] = []

    if (!item.name?.trim()) missing.push("Tên siêu thị")
    if (!item.address?.trim()) missing.push("Địa chỉ")
    if (!item.contactPhone?.trim()) missing.push("Số điện thoại")
    if (!hasCoordinates(item)) missing.push("Tọa độ")

    return missing
}

export const getProfileLabel = (item: AdminSupermarketItem) =>
    getMissingFields(item).length === 0 ? "Hoàn chỉnh" : "Cần bổ sung"

export const getProfileClass = (item: AdminSupermarketItem) => {
    const score = getProfileScore(item)

    if (score >= 4) return "border-emerald-200 bg-emerald-50 text-emerald-700"
    if (score >= 2) return "border-amber-200 bg-amber-50 text-amber-700"
    return "border-rose-200 bg-rose-50 text-rose-700"
}

export const getStatusLabel = (status?: number) => {
    switch (status) {
        case 0:
            return "Chờ duyệt"
        case 1:
            return "Đang hoạt động"
        case 2:
            return "Tạm ngưng"
        case 3:
            return "Đã đóng"
        case 4:
            return "Đã từ chối"
        default:
            return "Không xác định"
    }
}

export const getStatusClass = (status?: number) => {
    switch (status) {
        case 0:
            return "border-amber-200 bg-amber-50 text-amber-700"
        case 1:
            return "border-emerald-200 bg-emerald-50 text-emerald-700"
        case 2:
            return "border-violet-200 bg-violet-50 text-violet-700"
        case 3:
            return "border-rose-200 bg-rose-50 text-rose-700"
        case 4:
            return "border-slate-300 bg-slate-100 text-slate-700"
        default:
            return "border-slate-200 bg-slate-50 text-slate-700"
    }
}

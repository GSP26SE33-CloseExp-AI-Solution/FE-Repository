import type { PackagingOrderSummary } from "@/types/packaging.type"

export const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
})

export const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

export const formatDateTime = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

export const normalizeStatus = (value?: string) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "")

const ORDER_STATUS_LABEL: Record<string, string> = {
    pending: "Chờ xử lý",
    paid: "Đã thanh toán",
    confirmed: "Đã xác nhận",
    readytoship: "Sẵn sàng giao",
    deliveredwaitconfirm: "Đã giao, chờ xác nhận",
    completed: "Hoàn tất",
    canceled: "Đã hủy",
    failed: "Thất bại",
}

const PACKAGING_STATUS_LABEL: Record<string, string> = {
    pending: "Chờ đóng gói",
    confirmed: "Đã nhận xử lý",
    collecting: "Đang thu gom",
    collected: "Đã thu gom",
    packaging: "Đang đóng gói",
    packaged: "Đã đóng gói",
    completed: "Hoàn tất đóng gói",
    failed: "Đóng gói thất bại",
}

const DELIVERY_TYPE_LABEL: Record<string, string> = {
    pickup: "Nhận tại điểm tập kết",
    delivery: "Giao tận nơi",
    shipping: "Giao tận nơi",
}

export const getOrderStatusLabel = (status?: string) => {
    const key = normalizeStatus(status)
    return ORDER_STATUS_LABEL[key] || status || "--"
}

export const getPackagingStatusLabel = (status?: string) => {
    const key = normalizeStatus(status)
    return PACKAGING_STATUS_LABEL[key] || status || "--"
}

export const getDeliveryTypeLabel = (type?: string) => {
    const key = normalizeStatus(type)
    return DELIVERY_TYPE_LABEL[key] || type || "--"
}

export const getPackagingStatusClass = (status?: string) => {
    const value = normalizeStatus(status)

    if (value.includes("pending")) {
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
    }

    if (value.includes("confirm")) {
        return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
    }

    if (value.includes("collect")) {
        return "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
    }

    if (value.includes("pack") || value.includes("completed")) {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    }

    if (value.includes("fail")) {
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
    }

    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
}

export const getPackagingStepText = (status?: string) => {
    const value = normalizeStatus(status)

    if (value.includes("pending")) return "Cần xác nhận đóng gói"
    if (value.includes("confirm")) return "Đã nhận xử lý"
    if (value.includes("collect")) return "Đang / đã thu gom"
    if (value.includes("pack") || value.includes("completed")) return "Đã đóng gói"
    if (value.includes("fail")) return "Có lỗi đóng gói"

    return "Cần xử lý"
}

export const getFriendlyPackagingErrorMessage = (
    error: any,
    fallback: string
) => {
    const responseData = error?.response?.data
    const message = responseData?.message || ""

    if (
        message.includes("expected to affect 1 row") ||
        message.includes("optimistic concurrency")
    ) {
        return "Đơn hàng đã thay đổi trạng thái hoặc không còn khả dụng. Vui lòng tải lại dữ liệu."
    }

    if (message.includes('relation "OrderPackaging" does not exist')) {
        return "Hệ thống đóng gói đang thiếu dữ liệu bảng OrderPackaging ở backend."
    }

    if (typeof message === "string" && message.trim()) {
        return message
    }

    if (Array.isArray(responseData?.errors)) {
        return responseData.errors.filter(Boolean).join(", ") || fallback
    }

    return fallback
}

export const getTimeSlotStartMinutes = (timeSlotDisplay?: string) => {
    if (!timeSlotDisplay) return Number.MAX_SAFE_INTEGER

    const normalized = timeSlotDisplay.trim()
    const rangeMatch = normalized.match(/(\d{1,2})[:h](\d{2})/i)

    if (rangeMatch) {
        const hour = Number(rangeMatch[1])
        const minute = Number(rangeMatch[2])

        if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
            return hour * 60 + minute
        }
    }

    const shortHourMatch = normalized.match(/\b(\d{1,2})\b/)

    if (shortHourMatch) {
        const hour = Number(shortHourMatch[1])
        if (!Number.isNaN(hour)) return hour * 60
    }

    return Number.MAX_SAFE_INTEGER
}

export const sortOrdersByDeliverySlot = (list: PackagingOrderSummary[]) => {
    return [...list].sort((a, b) => {
        const aMinutes = getTimeSlotStartMinutes(a.timeSlotDisplay)
        const bMinutes = getTimeSlotStartMinutes(b.timeSlotDisplay)

        if (aMinutes !== bMinutes) return aMinutes - bMinutes

        const aDate = new Date(a.orderDate).getTime()
        const bDate = new Date(b.orderDate).getTime()

        if (aDate !== bDate) {
            return (Number.isNaN(aDate) ? 0 : aDate) - (Number.isNaN(bDate) ? 0 : bDate)
        }

        return String(a.orderCode || "").localeCompare(String(b.orderCode || ""))
    })
}

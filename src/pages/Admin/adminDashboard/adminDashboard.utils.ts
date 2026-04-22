import type { RevenueTrendItem, SlaAlertItem } from "@/types/admin.type"

export const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
})

export const compactNumber = new Intl.NumberFormat("vi-VN")

export const compactAxisNumber = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
})

export const formatCompactNumber = (value?: number | null) =>
    compactNumber.format(value ?? 0)

export const formatDate = (value?: string | Date) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

export const formatDateTime = (value?: string | Date) => {
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

export const formatDurationFromMinutes = (minutes?: number) => {
    const totalMinutes = Math.max(0, Math.floor(minutes ?? 0))

    const days = Math.floor(totalMinutes / (24 * 60))
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
    const mins = totalMinutes % 60

    const parts: string[] = []

    if (days > 0) parts.push(`${days} ngày`)
    if (hours > 0) parts.push(`${hours} giờ`)
    if (mins > 0 || parts.length === 0) parts.push(`${mins} phút`)

    return parts.join(" ")
}

export const getErrorMessage = (error: unknown, fallback: string) => {
    const err = error as
        | {
            response?: {
                data?: {
                    message?: string
                    errors?: string[] | Record<string, unknown>
                    error?: string[] | string
                }
            }
            message?: string
        }
        | undefined

    const responseData = err?.response?.data

    if (typeof responseData?.message === "string" && responseData.message.trim()) {
        return responseData.message.trim()
    }

    if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
        return String(responseData.errors[0] ?? fallback)
    }

    if (
        responseData?.errors &&
        typeof responseData.errors === "object" &&
        !Array.isArray(responseData.errors)
    ) {
        const firstValue = Object.values(responseData.errors)[0]

        if (Array.isArray(firstValue) && firstValue.length > 0) {
            return String(firstValue[0] ?? fallback)
        }

        if (firstValue != null) {
            return String(firstValue)
        }
    }

    if (Array.isArray(responseData?.error) && responseData.error.length > 0) {
        return String(responseData.error[0] ?? fallback)
    }

    if (typeof responseData?.error === "string" && responseData.error.trim()) {
        return responseData.error.trim()
    }

    return err?.message || fallback
}

export const formatOrderCode = (alert: SlaAlertItem) => {
    if (alert.orderCode?.trim()) return alert.orderCode.trim()
    if (alert.orderId?.trim()) return `Đơn #${alert.orderId.slice(0, 8)}`
    return "Đơn hàng không xác định"
}

export const mapOrderStatusLabel = (status?: string) => {
    const normalized = status?.trim().toLowerCase()

    switch (normalized) {
        case "pending":
            return "Chờ xác nhận"
        case "paid":
        case "paid_processing":
        case "paidprocessing":
            return "Đang xử lý sau thanh toán"
        case "processing":
            return "Đang xử lý"
        case "confirmed":
            return "Đã xác nhận"
        case "assigned":
            return "Đã phân công"
        case "packed":
            return "Đã đóng gói"
        case "ready_to_ship":
        case "readytoship":
            return "Sẵn sàng giao"
        case "shipping":
        case "in_transit":
        case "intransit":
            return "Đang giao"
        case "delivered":
            return "Đã giao"
        case "completed":
            return "Hoàn tất"
        case "cancelled":
            return "Đã hủy"
        case "failed":
            return "Giao thất bại"
        default:
            return status || "Không xác định"
    }
}

export const mapDeliveryTypeLabel = (deliveryType?: string) => {
    const normalized = deliveryType?.trim().toLowerCase()

    switch (normalized) {
        case "delivery":
        case "homedelivery":
        case "home_delivery":
        case "home-delivery":
            return "Giao tận nơi"
        case "pickup":
        case "pick_up":
        case "pick-up":
            return "Nhận tại điểm tập kết"
        default:
            return deliveryType || "--"
    }
}

export const getStatusClass = (status?: string) => {
    const normalized = status?.trim().toLowerCase()

    switch (normalized) {
        case "pending":
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case "paid":
        case "paid_processing":
        case "paidprocessing":
        case "processing":
            return "border border-violet-200 bg-violet-100 text-violet-700"
        case "confirmed":
        case "assigned":
        case "packed":
            return "border border-sky-200 bg-sky-100 text-sky-700"
        case "ready_to_ship":
        case "readytoship":
        case "shipping":
        case "in_transit":
        case "intransit":
            return "border border-indigo-200 bg-indigo-100 text-indigo-700"
        case "delivered":
        case "completed":
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case "cancelled":
        case "failed":
            return "border border-rose-200 bg-rose-100 text-rose-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

export const DAY_MS = 24 * 60 * 60 * 1000

export const startOfDay = (value: string | Date) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return new Date("")

    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export const toDateKey = (value: string | Date) => {
    const date = startOfDay(value)
    if (Number.isNaN(date.getTime())) return ""

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

export type ComparisonChartItem = {
    label: string
    fullDate: string
    currentRevenue: number
    previousRevenue: number
    currentOrders: number
    previousOrders: number
}

export const buildComparisonChartData = (
    revenueTrend: RevenueTrendItem[]
): ComparisonChartItem[] => {
    if (revenueTrend.length === 0) return []

    const validTrend = revenueTrend.filter((item) => Boolean(toDateKey(item.date)))
    if (validTrend.length === 0) return []

    const revenueMap = new Map(validTrend.map((item) => [toDateKey(item.date), item]))

    const sortedTimes = validTrend
        .map((item) => startOfDay(item.date).getTime())
        .filter((time) => !Number.isNaN(time))
        .sort((a, b) => a - b)

    const latestTime = sortedTimes[sortedTimes.length - 1]
    if (latestTime === undefined) return []

    const currentStart = latestTime - 6 * DAY_MS
    const previousStart = latestTime - 13 * DAY_MS

    return Array.from({ length: 7 }, (_, index) => {
        const previousDate = new Date(previousStart + index * DAY_MS)
        const currentDate = new Date(currentStart + index * DAY_MS)

        const previousItem = revenueMap.get(toDateKey(previousDate))
        const currentItem = revenueMap.get(toDateKey(currentDate))

        return {
            label: new Intl.DateTimeFormat("vi-VN", {
                day: "2-digit",
                month: "2-digit",
            }).format(currentDate),
            fullDate: formatDate(currentDate),
            currentRevenue: currentItem?.revenue ?? 0,
            previousRevenue: previousItem?.revenue ?? 0,
            currentOrders: currentItem?.orderCount ?? 0,
            previousOrders: previousItem?.orderCount ?? 0,
        }
    })
}

import type {
    PackagingOrderItem,
    PackagingOrderSummary,
} from "@/types/packaging.type"
import { formatOrderItemPurchaseQuantityLine } from "@/utils/unitMeasure"

export const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
})

export const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

export const formatDate = (value?: string | null) => {
    if (!value) return "--"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

export const formatShortDate = (value?: string | null) => {
    if (!value) return "--"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
    }).format(date)
}

export const formatDateTime = (value?: string | null) => {
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

export const normalizeStatus = (value?: string | number) =>
    String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "")

/** BE order-level packagingStatus is often a Vietnamese progress summary, not an enum. */
const normalizeSummaryText = (value?: string) =>
    String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

export const isPackagingProgressSummaryCompleted = (status?: string) => {
    const key = normalizeStatus(status)
    if (key === "completed") return true

    const raw = normalizeSummaryText(status)
    return raw.includes("tat ca dong da dong goi xong")
}

export const isPackagingProgressSummaryHasFailures = (status?: string) => {
    const key = normalizeStatus(status)
    if (key === "failed") return true

    const raw = normalizeSummaryText(status)
    return raw.includes("that bai") && raw.includes("thanh cong")
}

export const isPackagingProgressSummaryInProgress = (status?: string) => {
    const key = normalizeStatus(status)
    if (key === "pending" || key === "packaging") return true

    const raw = normalizeSummaryText(status)
    return raw.includes("dang xu ly")
}

/** Parsed from BE summary e.g. "0/1 dòng đã đóng gói xong, 1 dòng đang xử lý" */
export const parsePackagingProgressSummary = (status?: string) => {
    if (!status) return null

    const match = status.match(/(\d+)\s*\/\s*(\d+)/)
    if (!match) return null

    const done = Number.parseInt(match[1], 10)
    const total = Number.parseInt(match[2], 10)

    if (Number.isNaN(done) || Number.isNaN(total) || total <= 0) {
        return null
    }

    return {
        done,
        total,
        open: Math.max(0, total - done),
    }
}

export type PackagingOrderActionPhase = "collect" | "packing" | "view"

/** Next staff step: gom hàng → đóng gói → chỉ xem */
export const resolvePackagingOrderActionPhase = (
    packagingStatus?: string,
    orderStatus?: string,
    items?: PackagingOrderItem[],
): PackagingOrderActionPhase => {
    if (isPackagingOrderCompleted(packagingStatus, orderStatus, items)) {
        return "view"
    }

    if (items?.length) {
        const statuses = items.map((item) =>
            normalizeStatus(item.packagingStatus),
        )

        if (statuses.every((value) => value === "pending")) {
            return "collect"
        }

        if (
            statuses.some(
                (value) =>
                    value === "packaging" ||
                    value === "completed" ||
                    value === "failed",
            )
        ) {
            return "packing"
        }

        return "collect"
    }

    if (isPackagingProgressSummaryHasFailures(packagingStatus)) {
        return "packing"
    }

    const parsed = parsePackagingProgressSummary(packagingStatus)
    if (parsed) {
        if (parsed.done === 0 && parsed.open > 0) return "collect"
        if (parsed.open > 0) return "packing"
    }

    const key = normalizeStatus(packagingStatus)
    if (key === "pending") return "collect"
    if (key === "packaging" || key === "failed") return "packing"
    if (isPackagingProgressSummaryInProgress(packagingStatus)) {
        const progress = parsePackagingProgressSummary(packagingStatus)
        if (progress?.done === 0) return "collect"
        return "packing"
    }

    return "collect"
}

export const isPackagingOrderItemsCompleted = (
    items?: PackagingOrderItem[],
) => {
    if (!items?.length) return false

    return items.every(
        (item) => normalizeStatus(item.packagingStatus) === "completed",
    )
}

export const isPackagingOrderItemsHasActionable = (
    items?: PackagingOrderItem[],
) => {
    if (!items?.length) return false

    return items.some((item) => {
        const value = normalizeStatus(item.packagingStatus)
        return (
            value === "pending" ||
            value === "packaging" ||
            value === "failed"
        )
    })
}

export const isPackagingOrderCompleted = (
    packagingStatus?: string,
    orderStatus?: string,
    items?: PackagingOrderItem[],
) => {
    if (items?.length && isPackagingOrderItemsCompleted(items)) {
        return true
    }

    if (isPackagingProgressSummaryCompleted(packagingStatus)) {
        return true
    }

    return normalizeStatus(orderStatus) === "readytoship"
}

export const isPackagingOrderActionableFromSummary = (
    packagingStatus?: string,
    orderStatus?: string,
) => {
    if (isPackagingOrderCompleted(packagingStatus, orderStatus)) {
        return false
    }

    const key = normalizeStatus(packagingStatus)
    if (key === "pending" || key === "packaging" || key === "failed") {
        return true
    }

    if (isPackagingProgressSummaryInProgress(packagingStatus)) {
        return true
    }

    if (isPackagingProgressSummaryHasFailures(packagingStatus)) {
        return true
    }

    return false
}

export const isPackagingOrderActionable = (
    packagingStatus?: string,
    orderStatus?: string,
    items?: PackagingOrderItem[],
) => {
    if (isPackagingOrderCompleted(packagingStatus, orderStatus, items)) {
        return false
    }

    if (items?.length) {
        return isPackagingOrderItemsHasActionable(items)
    }

    return isPackagingOrderActionableFromSummary(packagingStatus, orderStatus)
}

const ORDER_STATUS_LABEL: Record<string, string> = {
    pending: "Chờ thanh toán",
    paid: "Đã thanh toán",
    readytoship: "Chờ giao hàng",
    deliveredwaitconfirm: "Đã giao, chờ xác nhận",
    completed: "Hoàn tất",
    canceled: "Đã hủy",
    refunded: "Đã hoàn tiền",
    failed: "Thất bại",
}

const PACKAGING_STATUS_LABEL: Record<string, string> = {
    pending: "Chờ xử lý",
    packaging: "Đang xử lý",
    completed: "Đã đóng gói",
    failed: "Có lỗi",
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

export const getPackagingStatusClass = (
    status?: string,
    orderStatus?: string,
    items?: PackagingOrderItem[],
) => {
    const phase = resolvePackagingOrderActionPhase(
        status,
        orderStatus,
        items,
    )

    if (phase === "view") {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    }

    if (
        isPackagingProgressSummaryHasFailures(status) ||
        items?.some((item) => normalizeStatus(item.packagingStatus) === "failed")
    ) {
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
    }

    if (phase === "packing") {
        return "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
    }

    if (phase === "collect") {
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
    }

    const value = normalizeStatus(status)

    if (value === "pending") {
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
    }

    if (value === "packaging" || isPackagingProgressSummaryInProgress(status)) {
        return "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
    }

    if (value === "completed" || isPackagingProgressSummaryCompleted(status)) {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    }

    if (value === "failed" || isPackagingProgressSummaryHasFailures(status)) {
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
    }

    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
}

export const getPackagingStatusDotClass = (status?: string) => {
    const value = normalizeStatus(status)

    if (value === "pending") return "bg-amber-500"
    if (value === "packaging") return "bg-sky-500"
    if (value === "completed") return "bg-emerald-500"
    if (value === "failed") return "bg-rose-500"

    return "bg-slate-400"
}

export const getPackagingStepText = (
    status?: string,
    orderStatus?: string,
    items?: PackagingOrderItem[],
) => {
    const phase = resolvePackagingOrderActionPhase(
        status,
        orderStatus,
        items,
    )

    if (phase === "view") return "Sẵn sàng bàn giao"
    if (phase === "collect") return "Cần bắt đầu gom hàng"
    if (phase === "packing") {
        if (
            items?.some(
                (item) => normalizeStatus(item.packagingStatus) === "failed",
            ) ||
            isPackagingProgressSummaryHasFailures(status)
        ) {
            return "Cần kiểm tra lỗi"
        }

        return "Đang kiểm tra / đóng gói"
    }

    return status || "Cần xử lý"
}

export const getPackagingActionLabel = (
    status?: string,
    orderStatus?: string,
    items?: PackagingOrderItem[],
) => {
    const phase = resolvePackagingOrderActionPhase(
        status,
        orderStatus,
        items,
    )

    if (phase === "view") return "Xem đơn đã đóng gói"
    if (phase === "collect") return "Bắt đầu gom hàng"
    if (phase === "packing") {
        if (
            items?.some(
                (item) => normalizeStatus(item.packagingStatus) === "failed",
            ) ||
            isPackagingProgressSummaryHasFailures(status)
        ) {
            return "Xem lỗi đóng gói"
        }

        return "Tiếp tục đóng gói"
    }

    return "Xử lý đơn"
}

export const getPackagingActionRoute = (
    orderId: string,
    status?: string,
    orderStatus?: string,
    items?: PackagingOrderItem[],
) => {
    const phase = resolvePackagingOrderActionPhase(
        status,
        orderStatus,
        items,
    )

    if (phase === "view") {
        return `/package/packing?orderId=${orderId}&view=1`
    }

    if (phase === "packing") {
        return `/package/packing?orderId=${orderId}`
    }

    return `/package/collect?orderId=${orderId}`
}

export const getPackagingProgress = (
    status?: string,
    orderStatus?: string,
    items?: PackagingOrderItem[],
) => {
    if (isPackagingOrderCompleted(status, orderStatus, items)) return 100

    const parsed = parsePackagingProgressSummary(status)
    if (parsed && parsed.total > 0) {
        return Math.min(
            100,
            Math.max(8, Math.round((parsed.done / parsed.total) * 100)),
        )
    }

    const phase = resolvePackagingOrderActionPhase(
        status,
        orderStatus,
        items,
    )

    if (phase === "collect") return 25
    if (phase === "packing") return 65

    const value = normalizeStatus(status)
    if (value === "pending") return 25
    if (value === "packaging") return 65
    if (value === "completed") return 100
    if (value === "failed") return 100

    return 10
}

export const getPackagingProgressClass = (
    status?: string,
    orderStatus?: string,
    items?: PackagingOrderItem[],
) => {
    if (isPackagingOrderCompleted(status, orderStatus, items)) {
        return "bg-emerald-500"
    }

    if (
        isPackagingProgressSummaryHasFailures(status) ||
        items?.some((item) => normalizeStatus(item.packagingStatus) === "failed")
    ) {
        return "bg-rose-500"
    }

    const phase = resolvePackagingOrderActionPhase(
        status,
        orderStatus,
        items,
    )

    if (phase === "packing") return "bg-sky-500"
    if (phase === "collect") return "bg-amber-500"

    const value = normalizeStatus(status)
    if (value === "failed") return "bg-rose-500"
    if (value === "completed") return "bg-emerald-500"
    if (value === "packaging") return "bg-sky-500"

    return "bg-amber-500"
}

export const formatPackagingItemQuantityLabel = (item: PackagingOrderItem) =>
    formatOrderItemPurchaseQuantityLine({
        quantity: item.quantity,
        purchaseUnitId: item.purchaseUnitId,
        purchaseUnitName: item.purchaseUnitName,
        purchaseUnitSymbol: item.purchaseUnitSymbol,
        purchaseQuantity: item.purchaseQuantity,
        productUnitName: item.unitName,
        productUnitSymbol: undefined,
    })

/** Line count for summaries when purchase units may differ per row. */
export const countPackagingOrderLines = (items?: PackagingOrderItem[]) =>
    items?.length ?? 0

export const getPackagingItemMeta = (item: PackagingOrderItem) => [
    {
        label: "NSX",
        value: formatDate(item.manufactureDate),
    },
    {
        label: "HSD",
        value: formatDate(item.expiryDate),
    },
    {
        label: "Đơn vị mua",
        value:
            item.purchaseUnitName && item.purchaseQuantity != null
                ? `${item.purchaseQuantity} ${item.purchaseUnitName}${item.purchaseUnitSymbol ? ` (${item.purchaseUnitSymbol})` : ""}`
                : item.purchaseUnitName || item.unitName || "--",
    },
    {
        label: "Đơn vị lô",
        value: item.unitName || "--",
    },
    {
        label: "Siêu thị",
        value: item.supermarketName || "--",
    },
]

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
            return (
                (Number.isNaN(aDate) ? 0 : aDate) -
                (Number.isNaN(bDate) ? 0 : bDate)
            )
        }

        return String(a.orderCode || "").localeCompare(String(b.orderCode || ""))
    })
}

export const formatActionDateTime = (date = new Date()) => {
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

export const buildPackagingActionNotes = ({
    actionLabel,
    userNote,
}: {
    actionLabel: string
    userNote?: string
}) => {
    const actionTime = formatActionDateTime()
    const cleanNote = userNote?.trim()

    return cleanNote
        ? `${actionLabel}: ${actionTime}\nGhi chú: ${cleanNote}`
        : `${actionLabel}: ${actionTime}`
}

export const getDaysRemaining = (value?: string | null) => {
    if (!value) return null

    const expiry = new Date(value)
    if (Number.isNaN(expiry.getTime())) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)

    return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
}

export const getExpiryToneClass = (value?: string | null) => {
    const days = getDaysRemaining(value)

    if (days === null) return "bg-slate-50 text-slate-500 ring-slate-200"
    if (days < 0) return "bg-rose-50 text-rose-700 ring-rose-200"
    if (days <= 3) return "bg-red-50 text-red-700 ring-red-200"
    if (days <= 7) return "bg-amber-50 text-amber-700 ring-amber-200"
    if (days <= 30) return "bg-sky-50 text-sky-700 ring-sky-200"

    return "bg-emerald-50 text-emerald-700 ring-emerald-200"
}

export const getExpiryText = (value?: string | null) => {
    const days = getDaysRemaining(value)

    if (days === null) return "Chưa có HSD"
    if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`
    if (days === 0) return "Hết hạn hôm nay"
    if (days <= 30) return `Còn ${days} ngày`

    return "Còn hạn"
}

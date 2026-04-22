import type {
    DeliveryCalendarDaySummary,
    DeliveryCalendarSlotSummary,
    DeliveryGroupDetail,
    DeliveryGroupSummary,
    DeliveryStaffBoardItem,
} from "@/types/admin.type"

export const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

export const DEBUG_SCOPE = "[AdminDeliveryCalendar]"

export const debugLog = (label: string, payload?: unknown) => {
    if (payload === undefined) {
        console.log(`${DEBUG_SCOPE} ${label}`)
        return
    }

    console.log(`${DEBUG_SCOPE} ${label}`, payload)
}

export const formatNumber = (value?: number) =>
    new Intl.NumberFormat("vi-VN").format(value ?? 0)

export const formatCurrency = (value?: number) =>
    `${formatNumber(value)} đ`

export const formatCoordinate = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "--"
    }

    return Number(value).toFixed(6)
}

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

export const formatTime = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

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

export const normalizeText = (value?: string) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "")

export const mapGroupStatusLabel = (value?: string) => {
    switch (normalizeText(value)) {
        case "draft":
            return "Nhóm draft"
        case "pending":
            return "Chờ xử lý"
        case "confirmed":
            return "Đã xác nhận"
        case "assigned":
            return "Đã phân công"
        case "intransit":
            return "Đang giao"
        case "completed":
            return "Hoàn tất"
        case "failed":
            return "Thất bại"
        default:
            return value || "--"
    }
}

export const mapOrderStatusLabel = (value?: string) => {
    switch (normalizeText(value)) {
        case "pending":
            return "Chờ xử lý"
        case "paid":
            return "Đã thanh toán"
        case "readytoship":
            return "Sẵn sàng giao"
        case "deliveredwaitconfirm":
            return "Chờ khách xác nhận"
        case "completed":
            return "Hoàn tất"
        case "failed":
            return "Thất bại"
        case "canceled":
            return "Đã hủy"
        case "refunded":
            return "Đã hoàn tiền"
        default:
            return value || "--"
    }
}

export const mapPackagingStatusLabel = (value?: string) => {
    switch (normalizeText(value)) {
        case "pending":
            return "Chờ đóng gói"
        case "packaging":
            return "Đang đóng gói"
        case "completed":
            return "Đã đóng gói"
        case "failed":
            return "Đóng gói lỗi"
        default:
            return value || "--"
    }
}

export const mapDeliveryItemStatusLabel = (value?: string) => {
    switch (normalizeText(value)) {
        case "readytoship":
            return "Sẵn sàng giao"
        case "pickedup":
            return "Đã nhận hàng"
        case "intransit":
            return "Đang di chuyển"
        case "deliveredwaitconfirm":
            return "Chờ khách xác nhận"
        case "completed":
            return "Hoàn tất"
        case "failed":
            return "Giao thất bại"
        default:
            return value || "--"
    }
}

export const mapDeliveryTypeLabel = (value?: string) => {
    switch (normalizeText(value)) {
        case "delivery":
        case "homedelivery":
            return "Giao tận nơi"
        case "pickup":
            return "Nhận tại điểm tập kết"
        default:
            return value || "--"
    }
}

export const getStatusClass = (value?: string) => {
    switch (normalizeText(value)) {
        case "draft":
            return "border border-slate-200 bg-slate-100 text-slate-700"
        case "pending":
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case "confirmed":
            return "border border-sky-200 bg-sky-100 text-sky-700"
        case "assigned":
            return "border border-indigo-200 bg-indigo-100 text-indigo-700"
        case "intransit":
            return "border border-violet-200 bg-violet-100 text-violet-700"
        case "completed":
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case "failed":
            return "border border-rose-200 bg-rose-100 text-rose-700"
        case "paid":
        case "readytoship":
        case "pickedup":
        case "deliveredwaitconfirm":
        case "packaging":
            return "border border-sky-200 bg-sky-100 text-sky-700"
        case "canceled":
        case "refunded":
            return "border border-slate-200 bg-slate-100 text-slate-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

export const getStaffLoadMeta = (staff: DeliveryStaffBoardItem) => {
    if (staff.activeGroups >= 4) {
        return {
            label: "Gần quá tải",
            className: "border border-rose-200 bg-rose-50 text-rose-700",
        }
    }

    if (staff.activeGroups >= 2) {
        return {
            label: "Đang bận",
            className: "border border-amber-200 bg-amber-50 text-amber-700",
        }
    }

    return {
        label: "Đang rảnh",
        className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    }
}

export const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
]

export const weekdayLabels = ["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "CN"]

export type MonthGridCell = {
    dateKey: string | null
    dayNumber: number | null
}

export const getMonthGrid = (year: number, month: number): MonthGridCell[] => {
    const firstDate = new Date(year, month - 1, 1)
    const lastDate = new Date(year, month, 0)

    const jsDay = firstDate.getDay()
    const mondayBased = jsDay === 0 ? 6 : jsDay - 1

    const cells: MonthGridCell[] = []

    for (let i = 0; i < mondayBased; i += 1) {
        cells.push({
            dateKey: null,
            dayNumber: null,
        })
    }

    for (let day = 1; day <= lastDate.getDate(); day += 1) {
        const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

        cells.push({
            dateKey,
            dayNumber: day,
        })
    }

    while (cells.length % 7 !== 0) {
        cells.push({
            dateKey: null,
            dayNumber: null,
        })
    }

    return cells
}

export const buildFallbackGroupDetailFromSummary = (
    item: DeliveryGroupSummary,
    currentDetail?: DeliveryGroupDetail | null
): DeliveryGroupDetail => {
    return {
        deliveryGroupId: item.deliveryGroupId,
        groupCode: item.groupCode || currentDetail?.groupCode || item.deliveryGroupId,
        deliveryStaffId:
            item.deliveryStaffId ?? currentDetail?.deliveryStaffId ?? undefined,
        deliveryStaffName:
            item.deliveryStaffName ?? currentDetail?.deliveryStaffName ?? undefined,
        timeSlotId: item.timeSlotId || currentDetail?.timeSlotId || "",
        timeSlotDisplay: item.timeSlotDisplay || currentDetail?.timeSlotDisplay || "",
        deliveryType: item.deliveryType || currentDetail?.deliveryType || "",
        deliveryArea: item.deliveryArea || currentDetail?.deliveryArea || "",
        centerLatitude: item.centerLatitude ?? currentDetail?.centerLatitude ?? 0,
        centerLongitude: item.centerLongitude ?? currentDetail?.centerLongitude ?? 0,
        status: item.status || currentDetail?.status || "",
        totalOrders: item.totalOrders ?? currentDetail?.totalOrders ?? 0,
        completedOrders: item.completedOrders ?? currentDetail?.completedOrders ?? 0,
        failedOrders: item.failedOrders ?? currentDetail?.failedOrders ?? 0,
        notes: currentDetail?.notes ?? "",
        deliveryDate: item.deliveryDate || currentDetail?.deliveryDate || "",
        createdAt: item.createdAt || currentDetail?.createdAt || "",
        updatedAt: item.updatedAt || currentDetail?.updatedAt || "",
        orders:
            currentDetail?.deliveryGroupId === item.deliveryGroupId
                ? currentDetail.orders || []
                : [],
        collectionId: item.collectionId ?? currentDetail?.collectionId ?? undefined,
        collectionPointName:
            item.collectionPointName ?? currentDetail?.collectionPointName ?? undefined,
    }
}

export const mergeGroupDetail = (
    base: DeliveryGroupDetail,
    incoming: DeliveryGroupDetail
): DeliveryGroupDetail => {
    return {
        ...base,
        ...incoming,
        groupCode: incoming.groupCode || base.groupCode,
        deliveryStaffId: incoming.deliveryStaffId ?? base.deliveryStaffId,
        deliveryStaffName: incoming.deliveryStaffName ?? base.deliveryStaffName,
        timeSlotId: incoming.timeSlotId || base.timeSlotId,
        timeSlotDisplay: incoming.timeSlotDisplay || base.timeSlotDisplay,
        deliveryType: incoming.deliveryType || base.deliveryType,
        deliveryArea: incoming.deliveryArea || base.deliveryArea,
        centerLatitude: incoming.centerLatitude ?? base.centerLatitude,
        centerLongitude: incoming.centerLongitude ?? base.centerLongitude,
        status: incoming.status || base.status,
        totalOrders: incoming.totalOrders ?? base.totalOrders,
        completedOrders: incoming.completedOrders ?? base.completedOrders,
        failedOrders: incoming.failedOrders ?? base.failedOrders,
        notes: incoming.notes ?? base.notes,
        deliveryDate: incoming.deliveryDate || base.deliveryDate,
        createdAt: incoming.createdAt || base.createdAt,
        updatedAt: incoming.updatedAt || base.updatedAt,
        collectionId: incoming.collectionId ?? base.collectionId,
        collectionPointName: incoming.collectionPointName ?? base.collectionPointName,
        orders: incoming.orders?.length ? incoming.orders : base.orders,
    }
}

export const buildDayMap = (monthSummary: DeliveryCalendarDaySummary[]) => {
    const map = new Map<string, DeliveryCalendarDaySummary>()

    monthSummary.forEach((item) => {
        map.set(item.date, item)
    })

    return map
}

export const buildMonthStats = (monthSummary: DeliveryCalendarDaySummary[]) => {
    const totalGroups = monthSummary.reduce((sum, item) => sum + item.totalGroups, 0)
    const totalOrders = monthSummary.reduce((sum, item) => sum + item.totalOrders, 0)
    const totalUnassigned = monthSummary.reduce(
        (sum, item) => sum + item.totalUnassignedGroups,
        0
    )
    const workingDays = monthSummary.filter((item) => item.totalGroups > 0).length
    const totalDraftGroups = monthSummary.reduce(
        (sum, item) => sum + item.totalDraftGroups,
        0
    )
    const totalPendingGroups = monthSummary.reduce(
        (sum, item) => sum + item.totalPendingGroups,
        0
    )
    const totalAssignedGroups = monthSummary.reduce(
        (sum, item) => sum + item.totalAssignedGroups,
        0
    )
    const totalInTransitGroups = monthSummary.reduce(
        (sum, item) => sum + item.totalInTransitGroups,
        0
    )
    const totalCompletedGroups = monthSummary.reduce(
        (sum, item) => sum + item.totalCompletedGroups,
        0
    )
    const totalFailedGroups = monthSummary.reduce(
        (sum, item) => sum + item.totalFailedGroups,
        0
    )

    return {
        totalGroups,
        totalOrders,
        totalUnassigned,
        workingDays,
        totalDraftGroups,
        totalPendingGroups,
        totalAssignedGroups,
        totalInTransitGroups,
        totalCompletedGroups,
        totalFailedGroups,
    }
}

export const filterSlotSummaries = (
    slotSummaries: DeliveryCalendarSlotSummary[],
    keyword: string
): DeliveryCalendarSlotSummary[] => {
    if (!keyword.trim()) return slotSummaries

    const normalizedKeyword = normalizeText(keyword)

    return slotSummaries
        .map((slot) => ({
            ...slot,
            groups: slot.groups.filter((group) =>
                [
                    group.groupCode,
                    group.deliveryGroupId,
                    group.timeSlotDisplay,
                    group.collectionPointName,
                    group.deliveryStaffName,
                    group.deliveryStaffId,
                    group.status,
                    group.deliveryType,
                    group.deliveryArea,
                    group.slotStartAtUtc,
                    group.slotEndAtUtc,
                    group.priorityScore,
                    group.distanceFromCurrentKm,
                    ...(group.priorityReasons ?? []),
                ]
                    .filter(Boolean)
                    .some((value) =>
                        normalizeText(String(value)).includes(normalizedKeyword)
                    )
            ),
        }))
        .filter((slot) => slot.groups.length > 0)
        .map((slot) => ({
            ...slot,
            totalGroups: slot.groups.length,
            totalOrders: slot.groups.reduce(
                (sum, item) => sum + (item.totalOrders || 0),
                0
            ),
            unassignedGroups: slot.groups.filter(
                (item) => !(item.deliveryStaffId || item.deliveryStaffName)
            ).length,
        }))
}

export const filterAndSortStaffBoard = (
    staffBoard: DeliveryStaffBoardItem[],
    keyword: string
) => {
    const normalizedKeyword = normalizeText(keyword)

    return [...staffBoard]
        .filter((item) => {
            if (!normalizedKeyword) return true

            return [item.deliveryStaffName, item.deliveryStaffId, item.email, item.phone]
                .filter(Boolean)
                .some((value) => normalizeText(String(value)).includes(normalizedKeyword))
        })
        .sort((a, b) => {
            if ((a.activeGroups ?? 0) !== (b.activeGroups ?? 0)) {
                return (a.activeGroups ?? 0) - (b.activeGroups ?? 0)
            }

            if ((a.pendingGroups ?? 0) !== (b.pendingGroups ?? 0)) {
                return (a.pendingGroups ?? 0) - (b.pendingGroups ?? 0)
            }

            if ((a.completedGroups ?? 0) !== (b.completedGroups ?? 0)) {
                return (b.completedGroups ?? 0) - (a.completedGroups ?? 0)
            }

            return (a.deliveryStaffName || "").localeCompare(
                b.deliveryStaffName || "",
                "vi"
            )
        })
}

export const getSelectedDaySummary = (
    monthSummary: DeliveryCalendarDaySummary[],
    selectedDate: string
) => {
    return monthSummary.find((item) => item.date === selectedDate) || null
}

export const isGroupUnassigned = (group?: DeliveryGroupSummary | DeliveryGroupDetail | null) =>
    !(group?.deliveryStaffId || group?.deliveryStaffName)

export const isDraftGroup = (group?: DeliveryGroupSummary | DeliveryGroupDetail | null) =>
    normalizeText(group?.status) === "draft"

export const getPriorityToneClass = (priorityScore?: number | null) => {
    if ((priorityScore ?? 0) >= 80) {
        return "border border-rose-200 bg-rose-50 text-rose-700"
    }

    if ((priorityScore ?? 0) >= 50) {
        return "border border-amber-200 bg-amber-50 text-amber-700"
    }

    if ((priorityScore ?? 0) > 0) {
        return "border border-sky-200 bg-sky-50 text-sky-700"
    }

    return "border border-slate-200 bg-slate-50 text-slate-600"
}

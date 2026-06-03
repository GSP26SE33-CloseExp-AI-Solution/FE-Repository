export type VendorDeliveryOrderItem = {
    orderItemId?: string
    productName?: string
    lotId?: string
    packagingStatus?: string
    deliveryStatus?: string | null
    deliveryFailedReason?: string | null
}

export type DeliveryProgress = {
    totalItems: number
    shippableCount: number
    completedCount: number
    waitConfirmCount: number
    stillShippingCount: number
    failedCount: number
    waitConfirmItems: VendorDeliveryOrderItem[]
    stillShippingItems: VendorDeliveryOrderItem[]
    isPartialDelivery: boolean
    canConfirmReceipt: boolean
}

export type VendorOrderStatusDisplay = {
    label: string
    className: string
    note: string
}

const normalizeStatus = (value?: string | null) =>
    (value || "").trim().toLowerCase()

export const isPackagingCompleted = (packagingStatus?: string) =>
    normalizeStatus(packagingStatus) === "completed"

export const isDeliveryTerminal = (deliveryStatus?: string | null) => {
    const status = normalizeStatus(deliveryStatus)
    return status === "completed" || status === "failed"
}

export const deriveDeliveryProgress = (
    items?: VendorDeliveryOrderItem[] | null,
): DeliveryProgress => {
    const list = items ?? []
    const shippable = list.filter((item) =>
        isPackagingCompleted(item.packagingStatus),
    )

    const waitConfirmItems = shippable.filter(
        (item) =>
            normalizeStatus(item.deliveryStatus) === "deliveredwaitconfirm",
    )
    const stillShippingItems = shippable.filter(
        (item) =>
            !isDeliveryTerminal(item.deliveryStatus) &&
            normalizeStatus(item.deliveryStatus) !== "deliveredwaitconfirm",
    )

    const completedCount = shippable.filter(
        (item) => normalizeStatus(item.deliveryStatus) === "completed",
    ).length
    const failedCount = shippable.filter(
        (item) => normalizeStatus(item.deliveryStatus) === "failed",
    ).length

    const waitConfirmCount = waitConfirmItems.length
    const stillShippingCount = stillShippingItems.length
    const isPartialDelivery =
        waitConfirmCount > 0 && stillShippingCount > 0

    return {
        totalItems: list.length,
        shippableCount: shippable.length,
        completedCount,
        waitConfirmCount,
        stillShippingCount,
        failedCount,
        waitConfirmItems,
        stillShippingItems,
        isPartialDelivery,
        canConfirmReceipt: waitConfirmCount > 0,
    }
}

export const getDeliveryItemStatusLabel = (deliveryStatus?: string | null) => {
    switch (normalizeStatus(deliveryStatus)) {
        case "readytoship":
            return "Đang giao"
        case "pickedup":
            return "Shipper đã lấy hàng"
        case "intransit":
            return "Đang di chuyển"
        case "deliveredwaitconfirm":
            return "Đã giao — chờ bạn xác nhận"
        case "completed":
            return "Đã nhận"
        case "failed":
            return "Giao thất bại"
        default:
            return deliveryStatus?.trim() ? deliveryStatus : "Chưa giao"
    }
}

export const getDeliveryItemStatusClass = (deliveryStatus?: string | null) => {
    switch (normalizeStatus(deliveryStatus)) {
        case "deliveredwaitconfirm":
            return "border-indigo-200 bg-indigo-50 text-indigo-700 ring-indigo-100"
        case "completed":
            return "border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-100"
        case "failed":
            return "border-rose-200 bg-rose-50 text-rose-700 ring-rose-100"
        case "readytoship":
        case "pickedup":
        case "intransit":
            return "border-violet-200 bg-violet-50 text-violet-700 ring-violet-100"
        default:
            return "border-slate-200 bg-slate-50 text-slate-600 ring-slate-100"
    }
}

export const getDeliveryProgressPercent = (progress: DeliveryProgress) => {
    if (progress.shippableCount <= 0) return 0

    const deliveredCount =
        progress.completedCount + progress.waitConfirmCount + progress.failedCount

    return Math.min(
        100,
        Math.round((deliveredCount / progress.shippableCount) * 100),
    )
}

export const getDeliveryProgressSummaryText = (progress: DeliveryProgress) => {
    if (progress.shippableCount <= 0) {
        return "Chưa có món nào sẵn sàng giao."
    }

    const parts: string[] = [
        `${progress.completedCount + progress.waitConfirmCount}/${progress.shippableCount} món đã tới`,
    ]

    if (progress.waitConfirmCount > 0) {
        parts.push(`${progress.waitConfirmCount} chờ xác nhận`)
    }

    if (progress.stillShippingCount > 0) {
        parts.push(`${progress.stillShippingCount} đang giao`)
    }

    if (progress.failedCount > 0) {
        parts.push(`${progress.failedCount} giao thất bại`)
    }

    return parts.join(" · ")
}

export const getDeliveryItemDisplayName = (item: VendorDeliveryOrderItem) =>
    item.productName?.trim() || item.lotId?.trim() || "Sản phẩm"

const buildItemNameList = (items: VendorDeliveryOrderItem[]) =>
    items.map(getDeliveryItemDisplayName).join(", ")

export const getConfirmReceiptButtonLabel = (progress: DeliveryProgress) => {
    if (!progress.canConfirmReceipt) return "Xác nhận đã nhận hàng"

    if (progress.isPartialDelivery) {
        return `Xác nhận đã nhận ${progress.waitConfirmCount} món`
    }

    if (progress.waitConfirmCount === 1) {
        return "Xác nhận đã nhận 1 món"
    }

    return `Xác nhận đã nhận đủ ${progress.waitConfirmCount} món`
}

export const buildConfirmReceiptDialogMessage = (
    progress: DeliveryProgress,
    orderCode?: string,
) => {
    const orderLabel = orderCode?.trim() || "này"
    const itemNames = buildItemNameList(progress.waitConfirmItems)

    if (progress.isPartialDelivery) {
        return [
            `Bạn xác nhận đã nhận: ${itemNames}.`,
            `${progress.stillShippingCount} món còn lại vẫn đang được giao — đơn ${orderLabel} chưa hoàn tất.`,
        ].join("\n\n")
    }

    if (progress.waitConfirmCount === 1) {
        return `Bạn xác nhận đã nhận: ${itemNames}? Sau khi xác nhận, đơn sẽ hoàn tất nếu không còn món nào đang giao.`
    }

    return `Bạn xác nhận đã nhận đủ ${progress.waitConfirmCount} món (${itemNames})? Sau khi xác nhận, đơn sẽ hoàn tất nếu không còn món nào đang giao.`
}

export const getConfirmReceiptSuccessMessage = (progress: DeliveryProgress) => {
    if (progress.isPartialDelivery) {
        return `Đã xác nhận ${progress.waitConfirmCount} món. ${progress.stillShippingCount} món còn lại đang được giao.`
    }

    return "Đã xác nhận nhận hàng. Đơn đã hoàn tất."
}

export const getPartialDeliveryBannerText = (progress: DeliveryProgress) => ({
    title: "Đơn đang giao từng phần",
    description: `Bạn đã nhận ${progress.waitConfirmCount}/${progress.shippableCount} món (chờ xác nhận). ${progress.stillShippingCount} món còn lại đang được shipper giao trong đợt tiếp theo.`,
})

export const resolveVendorOrderStatusDisplay = (
    orderStatus?: string,
    progress?: DeliveryProgress,
): VendorOrderStatusDisplay => {
    const status = normalizeStatus(orderStatus)

    if (status === "deliveredwaitconfirm" && progress?.isPartialDelivery) {
        return {
            label: "Giao một phần — chờ xác nhận",
            className: "border-amber-200 bg-amber-50 text-amber-800",
            note: "Một số món đã tới. Vui lòng kiểm tra và xác nhận phần đã nhận; các món khác vẫn đang giao.",
        }
    }

    switch (status) {
        case "pending":
            return {
                label: "Chờ xác nhận",
                className: "border-amber-200 bg-amber-50 text-amber-700",
                note: "Đơn hàng đã được ghi nhận và đang chờ hệ thống xử lý.",
            }
        case "paid":
            return {
                label: "Đang chuẩn bị hàng",
                className: "border-sky-200 bg-sky-50 text-sky-700",
                note: "Đơn hàng đã thanh toán và đang được chuẩn bị.",
            }
        case "readytoship":
            return {
                label: "Sẵn sàng giao",
                className: "border-violet-200 bg-violet-50 text-violet-700",
                note: "Đơn hàng đã sẵn sàng để giao hoặc bàn giao tại điểm nhận.",
            }
        case "deliveredwaitconfirm":
            return {
                label: "Đã giao, chờ xác nhận",
                className: "border-indigo-200 bg-indigo-50 text-indigo-700",
                note: "Đơn hàng đã được giao và đang chờ xác nhận hoàn tất.",
            }
        case "completed":
            return {
                label: "Hoàn tất",
                className: "border-emerald-200 bg-emerald-50 text-emerald-700",
                note: "Đơn hàng đã hoàn tất.",
            }
        case "canceled":
            return {
                label: "Đã hủy",
                className: "border-rose-200 bg-rose-50 text-rose-700",
                note: "Đơn hàng đã bị hủy.",
            }
        case "refunded":
            return {
                label: "Đã hoàn tiền",
                className: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
                note: "Đơn hàng đã được hoàn tiền.",
            }
        case "failed":
            return {
                label: "Không thành công",
                className: "border-rose-200 bg-rose-50 text-rose-700",
                note: "Đã có lỗi xảy ra khi xử lý đơn hàng.",
            }
        default:
            return {
                label: orderStatus || "Chưa rõ",
                className: "border-slate-200 bg-slate-50 text-slate-700",
                note: "Trạng thái đơn hàng hiện chưa được xác định rõ.",
            }
    }
}

export const shouldShowDeliverySection = (
    orderStatus?: string,
    progress?: DeliveryProgress,
) => {
    const status = normalizeStatus(orderStatus)
    if (status === "pending" || status === "canceled" || status === "refunded") {
        return false
    }

    return (progress?.shippableCount ?? 0) > 0
}

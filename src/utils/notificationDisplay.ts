import type {
    ApiNotification,
    ApiNotificationType,
    NotificationListItem,
    NotificationTypeKey,
} from "@/types/notification.type"

const TYPE_KEY_BY_API: Record<string, NotificationTypeKey> = {
    OrderUpdate: "orderUpdate",
    Promotion: "promotion",
    SystemAlert: "systemAlert",
    DeliveryUpdate: "deliveryUpdate",
    PriceAlert: "priceAlert",
    "0": "orderUpdate",
    "1": "promotion",
    "2": "systemAlert",
    "3": "deliveryUpdate",
    "4": "priceAlert",
}

export const NOTIFICATION_TYPE_FILTERS: Array<{
    value: NotificationTypeKey | "all"
    label: string
}> = [
    { value: "all", label: "Tất cả" },
    { value: "orderUpdate", label: "Đơn hàng" },
    { value: "promotion", label: "Khuyến mãi" },
    { value: "systemAlert", label: "Hệ thống" },
    { value: "deliveryUpdate", label: "Giao hàng" },
    { value: "priceAlert", label: "Giá" },
]

export const normalizeNotificationTypeKey = (
    type: ApiNotificationType,
): NotificationTypeKey => {
    const key = TYPE_KEY_BY_API[String(type)]
    return key ?? "systemAlert"
}

export const mapApiNotificationToListItem = (
    item: ApiNotification,
): NotificationListItem => ({
    id: item.notificationId,
    typeKey: normalizeNotificationTypeKey(item.type),
    title: item.title,
    message: item.content,
    createdAt: item.createdAt,
    isRead: item.isRead,
    orderCode: item.orderCode ?? null,
    userFullName: item.userFullName ?? null,
})

export const formatNotificationDateTime = (value?: string | null) => {
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

export const getNotificationTypeLabel = (typeKey: NotificationTypeKey) =>
    NOTIFICATION_TYPE_FILTERS.find((item) => item.value === typeKey)?.label ??
    "Thông báo"

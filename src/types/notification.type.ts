/** Matches BE CloseExpAISolution.Domain.Enums.NotificationType */
export type ApiNotificationType =
    | "OrderUpdate"
    | "Promotion"
    | "SystemAlert"
    | "DeliveryUpdate"
    | "PriceAlert"
    | 0
    | 1
    | 2
    | 3
    | 4

export type NotificationTypeKey =
    | "orderUpdate"
    | "promotion"
    | "systemAlert"
    | "deliveryUpdate"
    | "priceAlert"

export type ApiNotification = {
    notificationId: string
    userId: string
    userFullName?: string | null
    orderId?: string | null
    parentNotificationId?: string | null
    orderCode?: string | null
    title: string
    content: string
    type: ApiNotificationType
    isRead: boolean
    createdAt: string
}

export type NotificationListItem = {
    id: string
    typeKey: NotificationTypeKey
    title: string
    message: string
    createdAt: string
    isRead: boolean
    orderCode?: string | null
    userFullName?: string | null
}

export type UpdateNotificationPayload = {
    isRead?: boolean
    title?: string
    content?: string
    type?: ApiNotificationType
}

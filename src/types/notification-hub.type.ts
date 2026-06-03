import type { ApiNotificationType } from "@/types/notification.type"

/** Payload from BE `SendAsync(NotificationCreatedEvent, ...)`. */
export type NotificationHubPayload = {
    notificationId: string
    userId: string
    orderId?: string | null
    parentNotificationId?: string | null
    title: string
    content: string
    type: ApiNotificationType
    isRead: boolean
    createdAt: string
}

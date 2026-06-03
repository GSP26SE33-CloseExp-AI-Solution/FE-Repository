import {
    NOTIFICATION_REALTIME_EVENT,
    NOTIFICATION_UPDATED_EVENT,
} from "@/constants/notificationRealtime"
import type { ApiNotification } from "@/types/notification.type"
import { countUnreadNotifications } from "@/utils/notificationDisplay"

export type NotificationRealtimeDetail = {
    notifications: ApiNotification[]
    newItems: ApiNotification[]
    unreadCount: number
}

export const dispatchNotificationUpdated = () => {
    window.dispatchEvent(new Event(NOTIFICATION_UPDATED_EVENT))
}

export const dispatchNotificationRealtime = (
    notifications: ApiNotification[],
    newItems: ApiNotification[],
) => {
    const detail: NotificationRealtimeDetail = {
        notifications,
        newItems,
        unreadCount: countUnreadNotifications(notifications),
    }

    window.dispatchEvent(
        new CustomEvent<NotificationRealtimeDetail>(
            NOTIFICATION_REALTIME_EVENT,
            { detail },
        ),
    )

    dispatchNotificationUpdated()
}

export const subscribeNotificationRealtime = (
    handler: (detail: NotificationRealtimeDetail) => void,
) => {
    const listener = (event: Event) => {
        const custom = event as CustomEvent<NotificationRealtimeDetail>
        if (!custom.detail) return
        handler(custom.detail)
    }

    window.addEventListener(NOTIFICATION_REALTIME_EVENT, listener)
    return () => {
        window.removeEventListener(NOTIFICATION_REALTIME_EVENT, listener)
    }
}

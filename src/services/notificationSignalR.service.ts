import * as signalR from "@microsoft/signalr"

import {
    NOTIFICATION_HUB_PATH,
    SIGNALR_NOTIFICATION_RECEIVED_EVENT,
} from "@/constants/notificationRealtime"
import type { ApiNotification } from "@/types/notification.type"
import type { NotificationHubPayload } from "@/types/notification-hub.type"
import { getApiOrigin } from "@/utils/apiConfig"
import { authStorage } from "@/utils/authStorage"

export const getNotificationHubUrl = (): string => {
    const origin = getApiOrigin()
    if (!origin) {
        throw new Error("API origin is not configured")
    }
    return `${origin}${NOTIFICATION_HUB_PATH}`
}

export const mapHubPayloadToApiNotification = (
    payload: NotificationHubPayload,
): ApiNotification => ({
    notificationId: String(payload.notificationId),
    userId: String(payload.userId),
    orderId: payload.orderId ? String(payload.orderId) : null,
    parentNotificationId: payload.parentNotificationId
        ? String(payload.parentNotificationId)
        : null,
    title: payload.title,
    content: payload.content,
    type: payload.type,
    isRead: Boolean(payload.isRead),
    createdAt: payload.createdAt,
})

export const createNotificationHubConnection = (): signalR.HubConnection => {
    return new signalR.HubConnectionBuilder()
        .withUrl(getNotificationHubUrl(), {
            accessTokenFactory: () => authStorage.getAccessToken() ?? "",
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build()
}

export const subscribeNotificationReceived = (
    connection: signalR.HubConnection,
    handler: (payload: NotificationHubPayload) => void,
) => {
    connection.on(SIGNALR_NOTIFICATION_RECEIVED_EVENT, handler)
}

export const unsubscribeNotificationReceived = (
    connection: signalR.HubConnection,
) => {
    connection.off(SIGNALR_NOTIFICATION_RECEIVED_EVENT)
}

import type { HubConnection } from "@microsoft/signalr"

import {
    NOTIFICATION_ADMIN_FALLBACK_POLL_MS,
    NOTIFICATION_MAX_TOASTS_PER_TICK,
} from "@/constants/notificationRealtime"
import { notificationService } from "@/services/notification.service"
import {
    createNotificationHubConnection,
    mapHubPayloadToApiNotification,
    subscribeNotificationReceived,
    unsubscribeNotificationReceived,
} from "@/services/notificationSignalR.service"
import type { ApiNotification } from "@/types/notification.type"
import type { NotificationHubPayload } from "@/types/notification-hub.type"
import { authStorage } from "@/utils/authStorage"
import { dispatchNotificationRealtime } from "@/utils/notificationRealtimeEvents"
import type { NotificationListScope } from "@/utils/notificationDisplay"
import {
    getNotificationTypeLabel,
    normalizeNotificationTypeKey,
} from "@/utils/notificationDisplay"
import { showInfo } from "@/utils/toast"

type RealtimeOptions = {
    scope: NotificationListScope
    showToasts?: boolean
    onConnectionError?: (error: unknown) => void
}

type RealtimeController = {
    start: () => void
    stop: () => void
    refreshNow: () => Promise<void>
}

const fetchNotificationsByScope = async (scope: NotificationListScope) =>
    scope === "admin"
        ? notificationService.getAll()
        : notificationService.getMine()

const showNewNotificationToasts = (items: ApiNotification[]) => {
    items.slice(0, NOTIFICATION_MAX_TOASTS_PER_TICK).forEach((item) => {
        const typeLabel = getNotificationTypeLabel(
            normalizeNotificationTypeKey(item.type),
        )
        const preview = item.content?.trim()
            ? item.content.trim().slice(0, 120)
            : ""
        showInfo(
            preview
                ? `${typeLabel}: ${item.title}\n${preview}`
                : `${typeLabel}: ${item.title}`,
        )
    })

    const remaining = items.length - NOTIFICATION_MAX_TOASTS_PER_TICK
    if (remaining > 0) {
        showInfo(`+${remaining} thông báo mới khác`)
    }
}

const detectNewItems = (
    notifications: ApiNotification[],
    knownIds: Set<string>,
    seeded: boolean,
) => {
    if (!seeded) return []
    return notifications.filter((item) => !knownIds.has(item.notificationId))
}

const seedKnownIds = (
    notifications: ApiNotification[],
    knownIds: Set<string>,
) => {
    notifications.forEach((item) => {
        knownIds.add(item.notificationId)
    })
}

export const createNotificationRealtimeController = (
    options: RealtimeOptions,
): RealtimeController => {
    const { scope, showToasts = true, onConnectionError } = options

    let connection: HubConnection | null = null
    let adminPollId: ReturnType<typeof setInterval> | null = null
    let syncing = false
    let seeded = false
    let stopped = false
    const knownIds = new Set<string>()

    const publishSnapshot = (
        notifications: ApiNotification[],
        newItems: ApiNotification[],
    ) => {
        if (newItems.length > 0 && showToasts) {
            showNewNotificationToasts(newItems)
        }
        dispatchNotificationRealtime(notifications, newItems)
    }

    const syncFromServer = async (options?: { silent?: boolean }) => {
        if (syncing || stopped) return
        syncing = true

        try {
            const notifications = await fetchNotificationsByScope(scope)
            const newItems = detectNewItems(notifications, knownIds, seeded)
            seedKnownIds(notifications, knownIds)
            seeded = true

            if (!options?.silent || newItems.length > 0) {
                publishSnapshot(notifications, newItems)
            }
        } catch (error) {
            onConnectionError?.(error)
        } finally {
            syncing = false
        }
    }

    const mergeHubNotification = async (payload: NotificationHubPayload) => {
        const incoming = mapHubPayloadToApiNotification(payload)
        const isNew = seeded && !knownIds.has(incoming.notificationId)

        if (scope === "admin") {
            await syncFromServer()
            return
        }

        if (!seeded) {
            await syncFromServer()
            return
        }

        const current = await fetchNotificationsByScope(scope)
        const merged = isNew
            ? [incoming, ...current.filter((n) => n.notificationId !== incoming.notificationId)]
            : current.map((n) =>
                  n.notificationId === incoming.notificationId ? { ...n, ...incoming } : n,
              )

        seedKnownIds(merged, knownIds)
        publishSnapshot(merged, isNew ? [incoming] : [])
    }

    const startAdminFallbackPoll = () => {
        if (scope !== "admin" || adminPollId) return
        adminPollId = setInterval(() => {
            void syncFromServer({ silent: true })
        }, NOTIFICATION_ADMIN_FALLBACK_POLL_MS)
    }

    const stopAdminFallbackPoll = () => {
        if (adminPollId) {
            clearInterval(adminPollId)
            adminPollId = null
        }
    }

    const startHub = async () => {
        if (connection || stopped) return

        const token = authStorage.getAccessToken()
        if (!token) return

        connection = createNotificationHubConnection()

        subscribeNotificationReceived(connection, (payload) => {
            void mergeHubNotification(payload)
        })

        connection.onreconnected(() => {
            void syncFromServer()
        })

        connection.onclose(() => {
            if (!stopped) {
                startAdminFallbackPoll()
            }
        })

        try {
            await connection.start()
            stopAdminFallbackPoll()
            await syncFromServer()
            startAdminFallbackPoll()
        } catch (error) {
            onConnectionError?.(error)
            startAdminFallbackPoll()
            await syncFromServer()
        }
    }

    const start = () => {
        if (stopped) return
        stopped = false
        void startHub()
    }

    const stop = () => {
        stopped = true
        stopAdminFallbackPoll()

        if (connection) {
            unsubscribeNotificationReceived(connection)
            void connection.stop()
            connection = null
        }

        seeded = false
        knownIds.clear()
    }

    return {
        start,
        stop,
        refreshNow: () => syncFromServer(),
    }
}

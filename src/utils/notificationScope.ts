import type { NotificationListScope } from "@/utils/notificationDisplay"

/** Admin sees all notifications via REST; other roles use /notifications/me. */
export const getNotificationScopeForRole = (
    roleName: string | null | undefined,
): NotificationListScope | null => {
    if (!roleName) return null
    if (roleName === "Admin") return "admin"
    return "mine"
}

import { useNotificationRealtime } from "@/hooks/useNotificationRealtime"
import type { NotificationListScope } from "@/utils/notificationDisplay"

type NotificationRealtimeBridgeProps = {
    enabled: boolean
    scope: NotificationListScope
    showToasts?: boolean
}

/** Невидимый компонент: подключает SignalR-хаб уведомлений. */
const NotificationRealtimeBridge = ({
    enabled,
    scope,
    showToasts = true,
}: NotificationRealtimeBridgeProps) => {
    useNotificationRealtime({ enabled, scope, showToasts })
    return null
}

export default NotificationRealtimeBridge

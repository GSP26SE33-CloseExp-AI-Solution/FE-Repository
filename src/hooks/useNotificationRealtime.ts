import { useEffect, useRef } from "react"

import { createNotificationRealtimeController } from "@/services/notificationRealtime.service"
import type { NotificationListScope } from "@/utils/notificationDisplay"

type UseNotificationRealtimeOptions = {
    enabled: boolean
    scope: NotificationListScope
    showToasts?: boolean
}

/** Подключение SignalR + синхронизация списка уведомлений. */
export const useNotificationRealtime = ({
    enabled,
    scope,
    showToasts = true,
}: UseNotificationRealtimeOptions) => {
    const controllerRef = useRef<ReturnType<
        typeof createNotificationRealtimeController
    > | null>(null)

    useEffect(() => {
        if (!enabled) {
            controllerRef.current?.stop()
            controllerRef.current = null
            return
        }

        const controller = createNotificationRealtimeController({
            scope,
            showToasts,
        })
        controllerRef.current = controller
        controller.start()

        return () => {
            controller.stop()
            if (controllerRef.current === controller) {
                controllerRef.current = null
            }
        }
    }, [enabled, scope, showToasts])
}

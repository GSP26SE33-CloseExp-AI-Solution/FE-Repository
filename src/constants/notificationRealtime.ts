/** Custom event: payload carries latest notification list + newly detected items. */
export const NOTIFICATION_REALTIME_EVENT = "notifications:realtime"

/** Existing event used by header/sidebar badges after mark-as-read. */
export const NOTIFICATION_UPDATED_EVENT = "notifications:updated"

/** SignalR hub method from BE (`SignalRRealtimeNotificationPublisher`). */
export const SIGNALR_NOTIFICATION_RECEIVED_EVENT = "notification.received"

/** Hub path mapped in BE `PipelineConfigurationExtensions`. */
export const NOTIFICATION_HUB_PATH = "/hubs/notifications"

/**
 * Admin list uses GET /notifications (all users); hub only pushes to each recipient.
 * Light poll keeps the admin inbox in sync until BE fans out to admins.
 */
export const NOTIFICATION_ADMIN_FALLBACK_POLL_MS = 30_000

/** Max toast popups per push tick (avoid flooding). */
export const NOTIFICATION_MAX_TOASTS_PER_TICK = 3

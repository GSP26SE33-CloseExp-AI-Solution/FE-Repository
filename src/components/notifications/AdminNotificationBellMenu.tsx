import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, Loader2 } from "lucide-react"

import NotificationUnreadBadge from "@/components/notifications/NotificationUnreadBadge"
import { STAFF_NOTIFICATION_ROUTES } from "@/constants/layoutByRole"
import { notificationService } from "@/services/notification.service"
import type { ApiNotification } from "@/types/notification.type"
import {
    countUnreadNotifications,
    formatNotificationDateTime,
    getNotificationTypeLabel,
    normalizeNotificationTypeKey,
} from "@/utils/notificationDisplay"
import {
    subscribeNotificationRealtime,
    type NotificationRealtimeDetail,
} from "@/utils/notificationRealtimeEvents"

const PREVIEW_LIMIT = 8

const AdminNotificationBellMenu = () => {
    const navigate = useNavigate()
    const containerRef = useRef<HTMLDivElement>(null)

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [notifications, setNotifications] = useState<ApiNotification[]>([])

    const unreadCount = useMemo(
        () => countUnreadNotifications(notifications),
        [notifications],
    )

    const previewItems = useMemo(
        () =>
            [...notifications]
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                )
                .slice(0, PREVIEW_LIMIT),
        [notifications],
    )

    const loadNotifications = useCallback(async () => {
        setLoading(true)
        try {
            const items = await notificationService.getAll()
            setNotifications(items)
        } catch {
            // Превью в шапке — best-effort.
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadNotifications()
    }, [loadNotifications])

    useEffect(() => {
        return subscribeNotificationRealtime(
            (detail: NotificationRealtimeDetail) => {
                setNotifications(detail.notifications)
            },
        )
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleToggle = () => {
        setOpen((value) => {
            const next = !value
            if (next) {
                void loadNotifications()
            }
            return next
        })
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={handleToggle}
                className="relative grid h-10 w-10 place-items-center rounded-xl text-gray-500 transition hover:bg-white/70 hover:text-green-600"
                title="Thông báo"
                aria-label="Thông báo"
                aria-expanded={open}
            >
                <Bell size={20} />
                <NotificationUnreadBadge count={unreadCount} />
            </button>

            {open ? (
                <div className="absolute right-0 z-[60] mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Thông báo hệ thống
                            </p>
                            <p className="text-xs text-slate-500">
                                Cập nhật qua SignalR
                            </p>
                        </div>
                        {unreadCount > 0 ? (
                            <NotificationUnreadBadge count={unreadCount} inline />
                        ) : null}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                            </div>
                        ) : previewItems.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-slate-500">
                                Chưa có thông báo
                            </p>
                        ) : (
                            previewItems.map((item) => (
                                <button
                                    key={item.notificationId}
                                    type="button"
                                    onClick={() => {
                                        setOpen(false)
                                        navigate(STAFF_NOTIFICATION_ROUTES.Admin)
                                    }}
                                    className={`flex w-full flex-col gap-1 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                                        item.isRead ? "" : "bg-emerald-50/40"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium text-slate-900 line-clamp-1">
                                            {item.title}
                                        </p>
                                        {!item.isRead ? (
                                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-2">
                                        {item.content}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {getNotificationTypeLabel(
                                            normalizeNotificationTypeKey(item.type),
                                        )}{" "}
                                        ·{" "}
                                        {formatNotificationDateTime(item.createdAt)}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="border-t border-slate-100 p-2">
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false)
                                navigate(STAFF_NOTIFICATION_ROUTES.Admin)
                            }}
                            className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            Xem tất cả thông báo
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default AdminNotificationBellMenu

import { useCallback, useEffect, useMemo, useState } from "react"
import {
    AlertTriangle,
    Bell,
    Clock3,
    Info,
    Loader2,
    PackageCheck,
    RefreshCcw,
    Tag,
    Truck,
} from "lucide-react"

import NotificationUnreadBadge from "@/components/notifications/NotificationUnreadBadge"
import { notificationService } from "@/services/notification.service"
import type { NotificationListItem, NotificationTypeKey } from "@/types/notification.type"
import {
    formatNotificationDateTime,
    mapApiNotificationToListItem,
    NOTIFICATION_TYPE_FILTERS,
} from "@/utils/notificationDisplay"
import { subscribeNotificationRealtime } from "@/utils/notificationRealtimeEvents"
import { showError } from "@/utils/toast"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type NotificationAccent = "blue" | "rose"

const ACCENT_STYLES: Record<
    NotificationAccent,
    {
        icon: string
        spinner: string
        markAll: string
        filterActive: string
        unreadOnlyActive: string
        cardUnread: string
        dot: string
    }
> = {
    blue: {
        icon: "text-blue-600",
        spinner: "text-blue-600",
        markAll:
            "border-blue-200 text-blue-700 hover:bg-blue-50",
        filterActive: "bg-blue-600 text-white",
        unreadOnlyActive: "bg-blue-600 text-white",
        cardUnread: "border-blue-200 bg-blue-50",
        dot: "bg-blue-600",
    },
    rose: {
        icon: "text-rose-600",
        spinner: "text-rose-600",
        markAll:
            "border-rose-200 text-rose-700 hover:bg-rose-50",
        filterActive: "bg-rose-600 text-white",
        unreadOnlyActive: "bg-rose-600 text-white",
        cardUnread: "border-rose-200 bg-rose-50",
        dot: "bg-rose-600",
    },
}

type NotificationListPageProps = {
    title?: string
    scope: "mine" | "admin"
    maxWidthClass?: string
    accent?: NotificationAccent
}

const getNotificationIcon = (typeKey: NotificationTypeKey) => {
    switch (typeKey) {
        case "orderUpdate":
            return <PackageCheck className="h-5 w-5" />
        case "promotion":
            return <Tag className="h-5 w-5" />
        case "deliveryUpdate":
            return <Truck className="h-5 w-5" />
        case "priceAlert":
            return <AlertTriangle className="h-5 w-5" />
        case "systemAlert":
        default:
            return <Info className="h-5 w-5" />
    }
}

const getNotificationColor = (typeKey: NotificationTypeKey, isRead: boolean) => {
    const baseOpacity = isRead ? "opacity-60" : ""

    switch (typeKey) {
        case "orderUpdate":
            return cn(
                "border-blue-200 bg-blue-50 text-blue-700",
                baseOpacity,
            )
        case "promotion":
            return cn(
                "border-violet-200 bg-violet-50 text-violet-700",
                baseOpacity,
            )
        case "deliveryUpdate":
            return cn(
                "border-cyan-200 bg-cyan-50 text-cyan-700",
                baseOpacity,
            )
        case "priceAlert":
            return cn(
                "border-amber-200 bg-amber-50 text-amber-700",
                baseOpacity,
            )
        case "systemAlert":
        default:
            return cn(
                "border-slate-200 bg-slate-50 text-slate-700",
                baseOpacity,
            )
    }
}

const NotificationListPage = ({
    title = "Thông báo",
    scope,
    maxWidthClass = "max-w-5xl",
    accent = "blue",
}: NotificationListPageProps) => {
    const accentStyles = ACCENT_STYLES[accent]
    const [notifications, setNotifications] = useState<NotificationListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [filterType, setFilterType] = useState<NotificationTypeKey | "all">("all")
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)

    const filteredNotifications = useMemo(() => {
        return notifications.filter((notif) => {
            const matchesType =
                filterType === "all" || notif.typeKey === filterType
            const matchesRead = !showUnreadOnly || !notif.isRead
            return matchesType && matchesRead
        })
    }, [notifications, filterType, showUnreadOnly])

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.isRead).length,
        [notifications],
    )

    const fetchNotifications = useCallback(async () => {
        try {
            const raw =
                scope === "admin"
                    ? await notificationService.getAll()
                    : await notificationService.getMine()
            setNotifications(raw.map(mapApiNotificationToListItem))
        } catch (err) {
            showError(
                notificationService.getErrorMessage(
                    err,
                    "Không thể tải danh sách thông báo",
                ),
            )
            console.error("Failed to fetch notifications:", err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [scope])

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        void fetchNotifications()
    }, [fetchNotifications])

    const handleMarkAsRead = useCallback(
        async (id: string) => {
            const target = notifications.find((n) => n.id === id)
            if (!target || target.isRead) return

            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === id ? { ...notif, isRead: true } : notif,
                ),
            )

            try {
                await notificationService.markAsRead(id)
            } catch (err) {
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif.id === id ? { ...notif, isRead: false } : notif,
                    ),
                )
                showError(
                    notificationService.getErrorMessage(
                        err,
                        "Không thể đánh dấu đã đọc",
                    ),
                )
            }
        },
        [notifications],
    )

    const handleMarkAllAsRead = useCallback(async () => {
        const unread = notifications.filter((n) => !n.isRead)
        if (!unread.length) return

        setNotifications((prev) =>
            prev.map((notif) => ({ ...notif, isRead: true })),
        )

        const results = await Promise.allSettled(
            unread.map((n) => notificationService.markAsRead(n.id)),
        )

        const failed = results.filter((r) => r.status === "rejected").length
        if (failed > 0) {
            showError(`Không thể đánh dấu ${failed} thông báo`)
            void fetchNotifications()
        }
    }, [notifications, fetchNotifications])

    useEffect(() => {
        void fetchNotifications()
    }, [fetchNotifications])

    useEffect(() => {
        return subscribeNotificationRealtime((detail) => {
            setNotifications(detail.notifications.map(mapApiNotificationToListItem))
            setLoading(false)
            setRefreshing(false)
        })
    }, [])

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2
                    className={cn("h-8 w-8 animate-spin", accentStyles.spinner)}
                />
            </div>
        )
    }

    return (
        <div
            className={cn(
                "container mx-auto space-y-6 px-4 py-6",
                maxWidthClass,
            )}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-800">
                        <Bell className={cn("h-7 w-7", accentStyles.icon)} />
                        {title}
                        <NotificationUnreadBadge count={unreadCount} inline />
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        {unreadCount > 0
                            ? `Bạn có ${unreadCount} thông báo chưa đọc`
                            : "Danh sách được cập nhật tự động"}
                        <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            SignalR
                        </span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={() => void handleMarkAllAsRead()}
                            className={cn(
                                "rounded-lg border bg-white px-3 py-2 text-sm font-medium transition-colors",
                                accentStyles.markAll,
                            )}
                        >
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCcw
                            className={cn(
                                "h-4 w-4",
                                refreshing && "animate-spin",
                            )}
                        />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {NOTIFICATION_TYPE_FILTERS.map((filter) => (
                    <button
                        key={filter.value}
                        type="button"
                        onClick={() => setFilterType(filter.value)}
                        className={cn(
                            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                            filterType === filter.value
                                ? accentStyles.filterActive
                                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                        )}
                    >
                        {filter.label}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                    className={cn(
                        "ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        showUnreadOnly
                            ? accentStyles.unreadOnlyActive
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                    )}
                >
                    Chỉ chưa đọc
                    <NotificationUnreadBadge count={unreadCount} inline />
                </button>
            </div>

            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-16">
                        <Bell className="mb-3 h-12 w-12 text-slate-400" />
                        <p className="text-sm font-medium text-slate-600">
                            Không có thông báo
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Bạn đã xem hết các thông báo
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => void handleMarkAsRead(notif.id)}
                            className={cn(
                                "group cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md",
                                notif.isRead
                                    ? "border-slate-200 bg-white"
                                    : accentStyles.cardUnread,
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                                        getNotificationColor(
                                            notif.typeKey,
                                            notif.isRead,
                                        ),
                                    )}
                                >
                                    {getNotificationIcon(notif.typeKey)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3
                                            className={cn(
                                                "font-semibold",
                                                notif.isRead
                                                    ? "text-slate-700"
                                                    : "text-slate-900",
                                            )}
                                        >
                                            {notif.title}
                                        </h3>
                                        {!notif.isRead && (
                                            <span
                                                className={cn(
                                                    "h-2 w-2 shrink-0 rounded-full",
                                                    accentStyles.dot,
                                                )}
                                            />
                                        )}
                                    </div>
                                    <p
                                        className={cn(
                                            "mt-1 text-sm",
                                            notif.isRead
                                                ? "text-slate-600"
                                                : "text-slate-700",
                                        )}
                                    >
                                        {notif.message}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            {formatNotificationDateTime(
                                                notif.createdAt,
                                            )}
                                        </span>
                                        {scope === "admin" &&
                                            notif.userFullName && (
                                                <span>
                                                    Người nhận:{" "}
                                                    {notif.userFullName}
                                                </span>
                                            )}
                                        {notif.orderCode && (
                                            <span>Đơn: {notif.orderCode}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default NotificationListPage

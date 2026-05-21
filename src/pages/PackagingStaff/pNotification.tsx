import { useCallback, useEffect, useMemo, useState } from "react"
import {
    Bell,
    CheckCircle2,
    Clock3,
    Info,
    Loader2,
    PackageCheck,
    RefreshCcw,
    AlertTriangle,
} from "lucide-react"

import { showError } from "@/utils/toast"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type NotificationType = "info" | "success" | "warning" | "packaging"

type NotificationItem = {
    id: string
    type: NotificationType
    title: string
    message: string
    createdAt: string
    isRead: boolean
}

const formatDateTime = (value?: string | null) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case "success":
            return <CheckCircle2 className="h-5 w-5" />
        case "warning":
            return <AlertTriangle className="h-5 w-5" />
        case "packaging":
            return <PackageCheck className="h-5 w-5" />
        default:
            return <Info className="h-5 w-5" />
    }
}

const getNotificationColor = (type: NotificationType, isRead: boolean) => {
    const baseOpacity = isRead ? "opacity-60" : ""
    
    switch (type) {
        case "success":
            return cn(
                "border-emerald-200 bg-emerald-50 text-emerald-700",
                baseOpacity
            )
        case "warning":
            return cn(
                "border-amber-200 bg-amber-50 text-amber-700",
                baseOpacity
            )
        case "packaging":
            return cn(
                "border-blue-200 bg-blue-50 text-blue-700",
                baseOpacity
            )
        default:
            return cn(
                "border-slate-200 bg-slate-50 text-slate-700",
                baseOpacity
            )
    }
}

const PackageNotification = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [filterType, setFilterType] = useState<NotificationType | "all">("all")
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)

    const filteredNotifications = useMemo(() => {
        return notifications.filter((notif) => {
            const matchesType = filterType === "all" || notif.type === filterType
            const matchesRead = !showUnreadOnly || !notif.isRead
            return matchesType && matchesRead
        })
    }, [notifications, filterType, showUnreadOnly])

    const unreadCount = useMemo(() => {
        return notifications.filter((n) => !n.isRead).length
    }, [notifications])

    const fetchNotifications = useCallback(async () => {
        try {
            // TODO: Replace with actual API call when backend is ready
            // const response = await packagingService.getNotifications()
            
            // Mock data for now
            const mockNotifications: NotificationItem[] = [
                {
                    id: "1",
                    type: "packaging",
                    title: "Đơn hàng mới cần đóng gói",
                    message: "Có 3 đơn hàng mới đang chờ đóng gói. Vui lòng kiểm tra và xử lý.",
                    createdAt: new Date().toISOString(),
                    isRead: false,
                },
                {
                    id: "2",
                    type: "success",
                    title: "Hoàn tất đóng gói đơn hàng #ORD-12345",
                    message: "Bạn đã hoàn tất đóng gói đơn hàng #ORD-12345 thành công.",
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    isRead: false,
                },
                {
                    id: "3",
                    type: "warning",
                    title: "Cảnh báo thời gian đóng gói",
                    message: "Đơn hàng #ORD-12340 cần được đóng gói trong 30 phút tới.",
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    isRead: true,
                },
                {
                    id: "4",
                    type: "info",
                    title: "Thông báo hệ thống",
                    message: "Hệ thống sẽ bảo trì vào 23:00 - 01:00 đêm nay.",
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    isRead: true,
                },
            ]

            setNotifications(mockNotifications)
        } catch (err) {
            showError("Không thể tải danh sách thông báo")
            console.error("Failed to fetch notifications:", err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        void fetchNotifications()
    }, [fetchNotifications])

    const handleMarkAsRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((notif) =>
                notif.id === id ? { ...notif, isRead: true } : notif
            )
        )
    }, [])

    const handleMarkAllAsRead = useCallback(() => {
        setNotifications((prev) =>
            prev.map((notif) => ({ ...notif, isRead: true }))
        )
    }, [])

    useEffect(() => {
        void fetchNotifications()
    }, [fetchNotifications])

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
                        <Bell className="h-7 w-7 text-blue-600" />
                        Thông báo
                    </h1>
                    {unreadCount > 0 && (
                        <p className="mt-1 text-sm text-slate-600">
                            Bạn có {unreadCount} thông báo chưa đọc
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
                        >
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCcw
                            className={cn(
                                "h-4 w-4",
                                refreshing && "animate-spin"
                            )}
                        />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterType("all")}
                    className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        filterType === "all"
                            ? "bg-blue-600 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                >
                    Tất cả
                </button>
                <button
                    onClick={() => setFilterType("packaging")}
                    className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        filterType === "packaging"
                            ? "bg-blue-600 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                >
                    Đóng gói
                </button>
                <button
                    onClick={() => setFilterType("success")}
                    className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        filterType === "success"
                            ? "bg-blue-600 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                >
                    Thành công
                </button>
                <button
                    onClick={() => setFilterType("warning")}
                    className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        filterType === "warning"
                            ? "bg-blue-600 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                >
                    Cảnh báo
                </button>
                <button
                    onClick={() => setFilterType("info")}
                    className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        filterType === "info"
                            ? "bg-blue-600 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                >
                    Thông tin
                </button>
                <button
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                    className={cn(
                        "ml-auto rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        showUnreadOnly
                            ? "bg-blue-600 text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                >
                    Chỉ chưa đọc
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
                            onClick={() => handleMarkAsRead(notif.id)}
                            className={cn(
                                "group cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md",
                                notif.isRead
                                    ? "border-slate-200 bg-white"
                                    : "border-blue-200 bg-blue-50"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                                        getNotificationColor(notif.type, notif.isRead)
                                    )}
                                >
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3
                                            className={cn(
                                                "font-semibold",
                                                notif.isRead
                                                    ? "text-slate-700"
                                                    : "text-slate-900"
                                            )}
                                        >
                                            {notif.title}
                                        </h3>
                                        {!notif.isRead && (
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                        )}
                                    </div>
                                    <p
                                        className={cn(
                                            "mt-1 text-sm",
                                            notif.isRead
                                                ? "text-slate-600"
                                                : "text-slate-700"
                                        )}
                                    >
                                        {notif.message}
                                    </p>
                                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        {formatDateTime(notif.createdAt)}
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

export default PackageNotification

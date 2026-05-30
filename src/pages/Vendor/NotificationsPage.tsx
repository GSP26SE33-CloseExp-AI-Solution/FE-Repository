import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    Bell,
    ChevronRight,
    Loader2,
    Package,
    RefreshCcw,
    ShoppingBag,
    Tag,
    Truck,
    Info,
} from "lucide-react"
import toast from "react-hot-toast"

import { getBreadcrumbsByPath } from "@/constants/breadcrumbs"
import {
    NOTIFICATION_TYPE_LABELS,
    notificationService,
} from "@/services/notification.service"
import type { NotificationItem, NotificationType } from "@/types/notification.type"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

const secondaryBtn =
    "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"

const filterBtn =
    "inline-flex items-center justify-center rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition active:scale-[0.99]"

const formatDateTime = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case "OrderUpdate":
            return <ShoppingBag className="h-5 w-5" />
        case "DeliveryUpdate":
            return <Truck className="h-5 w-5" />
        case "Promotion":
            return <Tag className="h-5 w-5" />
        case "PriceAlert":
            return <Package className="h-5 w-5" />
        default:
            return <Info className="h-5 w-5" />
    }
}

const getNotificationColor = (type: NotificationType, isRead: boolean) => {
    const faded = isRead ? "opacity-65" : ""

    switch (type) {
        case "OrderUpdate":
            return cn("border-sky-200 bg-sky-50 text-sky-700", faded)
        case "DeliveryUpdate":
            return cn("border-violet-200 bg-violet-50 text-violet-700", faded)
        case "Promotion":
            return cn("border-amber-200 bg-amber-50 text-amber-700", faded)
        case "PriceAlert":
            return cn("border-rose-200 bg-rose-50 text-rose-700", faded)
        default:
            return cn("border-emerald-200 bg-emerald-50 text-emerald-700", faded)
    }
}

const FILTER_OPTIONS: Array<{ key: NotificationType | "all"; label: string }> = [
    { key: "all", label: "Tất cả" },
    { key: "OrderUpdate", label: "Đơn hàng" },
    { key: "DeliveryUpdate", label: "Giao hàng" },
    { key: "Promotion", label: "Khuyến mãi" },
    { key: "SystemAlert", label: "Hệ thống" },
    { key: "PriceAlert", label: "Giá" },
]

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [markingAll, setMarkingAll] = useState(false)
    const [filterType, setFilterType] = useState<NotificationType | "all">("all")
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)

    const breadcrumbs = useMemo(
        () => getBreadcrumbsByPath(location.pathname),
        [location.pathname],
    )

    const filteredNotifications = useMemo(() => {
        return notifications.filter((notif) => {
            const matchesType = filterType === "all" || notif.type === filterType
            const matchesRead = !showUnreadOnly || !notif.isRead
            return matchesType && matchesRead
        })
    }, [notifications, filterType, showUnreadOnly])

    const unreadCount = useMemo(
        () => notifications.filter((item) => !item.isRead).length,
        [notifications],
    )

    const fetchNotifications = useCallback(async () => {
        try {
            const items = await notificationService.getMine()
            setNotifications(
                [...items].sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                ),
            )
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Không thể tải danh sách thông báo",
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        void fetchNotifications()
    }, [fetchNotifications])

    const handleMarkAsRead = useCallback(async (item: NotificationItem) => {
        if (item.isRead) return

        setNotifications((prev) =>
            prev.map((notif) =>
                notif.notificationId === item.notificationId
                    ? { ...notif, isRead: true }
                    : notif,
            ),
        )

        try {
            await notificationService.markAsRead(item.notificationId)
        } catch (err) {
            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.notificationId === item.notificationId
                        ? { ...notif, isRead: false }
                        : notif,
                ),
            )
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Không thể đánh dấu đã đọc",
            )
        }
    }, [])

    const handleMarkAllAsRead = useCallback(async () => {
        if (unreadCount === 0) return

        setMarkingAll(true)
        const snapshot = notifications

        setNotifications((prev) =>
            prev.map((notif) => ({ ...notif, isRead: true })),
        )

        try {
            await notificationService.markAllAsRead(snapshot)
            toast.success("Đã đánh dấu tất cả là đã đọc")
        } catch (err) {
            setNotifications(snapshot)
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Không thể đánh dấu tất cả đã đọc",
            )
        } finally {
            setMarkingAll(false)
        }
    }, [notifications, unreadCount])

    const handleOpenNotification = useCallback(
        async (item: NotificationItem) => {
            await handleMarkAsRead(item)

            if (item.orderId) {
                navigate(`/orders/${item.orderId}`)
            }
        },
        [handleMarkAsRead, navigate],
    )

    useEffect(() => {
        void fetchNotifications()
    }, [fetchNotifications])

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-5 lg:px-6">
                <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="transition hover:text-slate-800"
                    >
                        Trang chủ
                    </button>

                    {breadcrumbs.map((crumb, index) => (
                        <Fragment key={`${crumb}-${index}`}>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span
                                className={
                                    index === breadcrumbs.length - 1
                                        ? "font-medium text-slate-800"
                                        : ""
                                }
                            >
                                {crumb}
                            </span>
                        </Fragment>
                    ))}
                </div>

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                            <Bell className="h-3.5 w-3.5" />
                            Thông báo
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Thông báo của bạn
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Cập nhật trạng thái đơn hàng, giao hàng và tin từ hệ thống.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className={cn(secondaryBtn, refreshing && "opacity-60")}
                        >
                            {refreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCcw className="h-4 w-4" />
                            )}
                            Làm mới
                        </button>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => void handleMarkAllAsRead()}
                                disabled={markingAll}
                                className={cn(
                                    "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:shadow-md active:scale-[0.99]",
                                    markingAll && "opacity-60",
                                )}
                            >
                                {markingAll ? (
                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                ) : null}
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {FILTER_OPTIONS.map((option) => {
                            const active = filterType === option.key
                            return (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => setFilterType(option.key)}
                                    className={cn(
                                        filterBtn,
                                        active
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                                    )}
                                >
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={showUnreadOnly}
                            onChange={(e) => setShowUnreadOnly(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Chỉ hiện chưa đọc
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white">
                                {unreadCount}
                            </span>
                        )}
                    </label>
                </div>

                {loading ? (
                    <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                            Đang tải thông báo...
                        </div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <Bell className="h-7 w-7" />
                        </div>
                        <p className="text-base font-semibold text-slate-800">
                            {showUnreadOnly
                                ? "Không còn thông báo chưa đọc"
                                : "Chưa có thông báo nào"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Khi có cập nhật đơn hàng hoặc tin từ hệ thống, bạn sẽ thấy tại đây.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((item) => (
                            <button
                                key={item.notificationId}
                                type="button"
                                onClick={() => void handleOpenNotification(item)}
                                className={cn(
                                    "w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md",
                                    item.isRead
                                        ? "border-slate-200"
                                        : "border-emerald-200 ring-1 ring-emerald-100",
                                )}
                            >
                                <div className="flex gap-3">
                                    <div
                                        className={cn(
                                            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border",
                                            getNotificationColor(
                                                item.type,
                                                item.isRead,
                                            ),
                                        )}
                                    >
                                        {getNotificationIcon(item.type)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p
                                                    className={cn(
                                                        "text-[15px] text-slate-900",
                                                        !item.isRead &&
                                                            "font-semibold",
                                                    )}
                                                >
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                                                    {item.content}
                                                </p>
                                            </div>

                                            {!item.isRead && (
                                                <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                                    Mới
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-600">
                                                {NOTIFICATION_TYPE_LABELS[item.type]}
                                            </span>
                                            {item.orderCode && (
                                                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                                                    {item.orderCode}
                                                </span>
                                            )}
                                            <span>{formatDateTime(item.createdAt)}</span>
                                            {item.orderId && (
                                                <span className="text-emerald-600">
                                                    Xem đơn hàng →
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default NotificationsPage

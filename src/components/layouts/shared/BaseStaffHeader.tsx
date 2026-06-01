import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Bell, LogOut, ShieldCheck, type LucideIcon } from "lucide-react"

import Logo from "@/assets/logo.png"
import NotificationUnreadBadge from "@/components/notifications/NotificationUnreadBadge"
import { BREAD_CRUMB_MAP } from "@/constants/breadcrumbs"
import { useAuthContext } from "@/contexts/AuthContext"
import { notificationService } from "@/services/notification.service"
import {
    countUnreadNotifications,
    type NotificationListScope,
} from "@/utils/notificationDisplay"

type BaseStaffHeaderProps = {
    portalSubtitle: string
    roleLabel: string
    profileRoute: string
    accentClass: string
    centerHint?: string
    extraMeta?: React.ReactNode
    headerActions?: React.ReactNode
    profileMenuItems?: {
        label: string
        path: string
        icon: LucideIcon
        description?: string
    }[]
    profileDropdownExtra?: React.ReactNode
    onLogoutAll?: () => Promise<void> | void
    loggingOutAll?: boolean
    notificationRoute?: string
    notificationScope?: NotificationListScope
}

const BaseStaffHeader = ({
    portalSubtitle,
    roleLabel,
    profileRoute,
    accentClass,
    centerHint,
    extraMeta,
    headerActions,
    profileMenuItems = [],
    profileDropdownExtra,
    onLogoutAll,
    loggingOutAll = false,
    notificationRoute,
    notificationScope = "mine",
}: BaseStaffHeaderProps) => {
    const { user, logout, primaryAvatarUrl } = useAuthContext()
    const navigate = useNavigate()
    const location = useLocation()

    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
    const [open, setOpen] = useState(false)

    const syncUnreadNotifications = useCallback(async () => {
        if (!notificationRoute || !user?.userId) {
            setUnreadNotificationCount(0)
            return
        }

        try {
            const items =
                notificationScope === "admin"
                    ? await notificationService.getAll()
                    : await notificationService.getMine()
            setUnreadNotificationCount(countUnreadNotifications(items))
        } catch {
            // Badge is best-effort; notification page shows errors on load.
        }
    }, [notificationRoute, notificationScope, user?.userId])
    const ref = useRef<HTMLDivElement>(null)

    const breadcrumbs = useMemo(() => {
        const match = Object.keys(BREAD_CRUMB_MAP)
            .sort((a, b) => b.length - a.length)
            .find((key) => location.pathname.startsWith(key))

        return match ? BREAD_CRUMB_MAP[match] : []
    }, [location.pathname])

    useEffect(() => {
        void syncUnreadNotifications()
    }, [syncUnreadNotifications])

    useEffect(() => {
        if (!notificationRoute || !user?.userId) return

        const handleSync = () => {
            void syncUnreadNotifications()
        }

        window.addEventListener("focus", handleSync)
        window.addEventListener("notifications:updated", handleSync)

        return () => {
            window.removeEventListener("focus", handleSync)
            window.removeEventListener("notifications:updated", handleSync)
        }
    }, [notificationRoute, syncUnreadNotifications, user?.userId])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const avatarText = user?.fullName
        ? user.fullName.charAt(0).toUpperCase()
        : "U"

    return (
        <header className="fixed top-0 left-0 z-50 h-20 w-full border-b border-white/40 bg-white/70 shadow-sm backdrop-blur-xl">
            <div className="flex h-full w-full items-center gap-6 px-8">
                <div className="flex w-[310px] shrink-0 items-center gap-0">
                    <img
                        src={Logo}
                        alt="CloseExp AI"
                        className="h-20 w-20 shrink-0 object-contain translate-y-1"
                    />
                    <div className="-ml-2 leading-tight">
                        <p className="text-base font-bold text-gray-800">CloseExp AI</p>
                        <p className="text-sm text-gray-500">{portalSubtitle}</p>
                        {extraMeta ? <div className="mt-1">{extraMeta}</div> : null}
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={`${crumb}-${index}`} className="flex items-center gap-2">
                                {index > 0 && <span>/</span>}
                                <span
                                    className={
                                        index === breadcrumbs.length - 1
                                            ? "font-medium text-gray-800"
                                            : ""
                                    }
                                >
                                    {crumb}
                                </span>
                            </span>
                        ))}
                    </div>

                    {centerHint ? (
                        <p className="mt-1 truncate text-xs text-gray-400">
                            {centerHint}
                        </p>
                    ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {headerActions}

                    {notificationRoute ? (
                        <button
                            type="button"
                            onClick={() => navigate(notificationRoute)}
                            className="relative grid h-10 w-10 place-items-center rounded-xl text-gray-500 transition hover:bg-white/70 hover:text-green-600"
                            title="Thông báo"
                            aria-label="Thông báo"
                        >
                            <Bell size={20} />
                            <NotificationUnreadBadge
                                count={unreadNotificationCount}
                            />
                        </button>
                    ) : null}

                    <div className="relative" ref={ref}>
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/60"
                        >
                            <div
                                className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${accentClass} font-bold text-white`}
                            >
                                {primaryAvatarUrl ? (
                                    <img
                                        src={primaryAvatarUrl}
                                        alt=""
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{avatarText}</span>
                                )}
                            </div>

                            <div className="flex flex-col text-left leading-tight">
                                <span className="font-medium text-gray-700">
                                    {user?.fullName ?? "Người dùng"}
                                </span>

                                <span className="text-xs text-gray-500">
                                    {roleLabel}
                                </span>
                            </div>
                        </button>

                        {open && (
                            <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
                                <div className="border-b border-gray-100 px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {user?.fullName ?? "Người dùng"}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                        {user?.email ?? ""}
                                    </p>
                                </div>

                                {profileDropdownExtra}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false)
                                        navigate(profileRoute)
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-gray-50"
                                >
                                    <ShieldCheck size={16} className="text-slate-500" />
                                    <span>Hồ sơ</span>
                                </button>

                                {profileMenuItems.map((item) => {
                                    const Icon = item.icon

                                    return (
                                        <button
                                            key={item.path}
                                            type="button"
                                            onClick={() => {
                                                setOpen(false)
                                                navigate(item.path)
                                            }}
                                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                                        >
                                            <Icon size={16} className="mt-0.5 text-slate-500" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">
                                                    {item.label}
                                                </p>
                                                {item.description ? (
                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        {item.description}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </button>
                                    )
                                })}

                                {onLogoutAll ? (
                                    <>
                                        <div className="mx-4 h-px bg-gray-100" />

                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setOpen(false)
                                                await onLogoutAll()
                                            }}
                                            disabled={loggingOutAll}
                                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <ShieldCheck size={16} className="mt-0.5 text-rose-600" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">
                                                    {loggingOutAll
                                                        ? "Đang xử lý..."
                                                        : "Đăng xuất tất cả thiết bị"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    Thu hồi toàn bộ phiên đang đăng nhập
                                                </p>
                                            </div>
                                        </button>
                                    </>
                                ) : null}

                                <div className="mx-4 h-px bg-gray-100" />

                                <button
                                    type="button"
                                    onClick={async () => {
                                        setOpen(false)
                                        await logout()
                                        navigate("/", { replace: true })
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 transition hover:bg-red-50"
                                >
                                    <LogOut size={16} />
                                    <span>Đăng xuất</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default BaseStaffHeader

import { formatNotificationBadgeCount } from "@/utils/notificationDisplay"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type NotificationUnreadBadgeProps = {
    count: number
    className?: string
    inline?: boolean
    /** Badge on green/active nav — white fill, emerald digits */
    onAccent?: boolean
}

const getBadgeSizeClass = (label: string) => {
    if (label.length >= 3) {
        return "h-[18px] min-w-[18px] px-1"
    }

    if (label.length === 2) {
        return "h-[18px] w-[18px]"
    }

    return "h-[18px] w-[18px]"
}

const NotificationUnreadBadge = ({
    count,
    className,
    inline = false,
    onAccent = false,
}: NotificationUnreadBadgeProps) => {
    if (count <= 0) return null

    const label = formatNotificationBadgeCount(count)

    const badgeClass = cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none tabular-nums",
        onAccent
            ? "bg-white !text-emerald-700 ring-1 ring-emerald-200/90"
            : "bg-emerald-500 !text-white",
        getBadgeSizeClass(label),
        !inline && "shadow-sm",
        className,
    )

    if (inline) {
        return <span className={badgeClass}>{label}</span>
    }

    return (
        <span className={cn("absolute -right-1.5 -top-1.5", badgeClass)}>
            {label}
        </span>
    )
}

export default NotificationUnreadBadge

import type { ComponentType } from "react"
import { Link } from "react-router-dom"

type Props = {
    title: string
    value: string
    hint: string
    icon: ComponentType<{ className?: string }>
    to?: string
    tone?: "default" | "dark" | "success" | "warning"
}

const toneClassMap: Record<NonNullable<Props["tone"]>, string> = {
    default: "border-slate-200 bg-white text-slate-900",
    dark: "border-sky-200 bg-sky-50 text-sky-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
}

const iconToneClassMap: Record<NonNullable<Props["tone"]>, string> = {
    default: "bg-slate-100 text-slate-700",
    dark: "bg-sky-100 text-sky-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
}

const titleToneClassMap: Record<NonNullable<Props["tone"]>, string> = {
    default: "text-slate-500",
    dark: "text-sky-700",
    success: "text-emerald-700",
    warning: "text-amber-700",
}

const hintToneClassMap: Record<NonNullable<Props["tone"]>, string> = {
    default: "text-slate-500",
    dark: "text-sky-800/80",
    success: "text-emerald-800/80",
    warning: "text-amber-800/80",
}

const DashboardStatCard = ({
    title,
    value,
    hint,
    icon: Icon,
    to,
    tone = "default",
}: Props) => {
    const content = (
        <div
            className={[
                "h-full min-h-[132px] rounded-2xl border p-4 shadow-sm transition",
                "hover:-translate-y-0.5 hover:shadow-md",
                toneClassMap[tone],
            ].join(" ")}
        >
            <div className="flex h-full items-start gap-3">
                <div className="min-w-0 flex-1">
                    <p
                        className={[
                            "line-clamp-2 text-[13px] font-medium leading-5",
                            titleToneClassMap[tone],
                        ].join(" ")}
                        title={title}
                    >
                        {title}
                    </p>

                    <h3 className="mt-2 break-words text-xl font-bold leading-tight">
                        {value}
                    </h3>

                    <p
                        className={[
                            "mt-2 line-clamp-2 text-xs leading-5",
                            hintToneClassMap[tone],
                        ].join(" ")}
                        title={hint}
                    >
                        {hint}
                    </p>
                </div>

                <div
                    className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        iconToneClassMap[tone],
                    ].join(" ")}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </div>
        </div>
    )

    if (!to) return content

    return (
        <Link to={to} className="block h-full">
            {content}
        </Link>
    )
}

export default DashboardStatCard

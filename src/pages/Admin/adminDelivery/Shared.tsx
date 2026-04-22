import type { ReactNode } from "react"
import { UserRound } from "lucide-react"

import type { DeliveryStaffBoardItem } from "@/types/admin.type"
import {
    cn,
    formatNumber,
    getStaffLoadMeta,
} from "./adminDelivery.utils"

export const EmptyState = ({ message }: { message: string }) => (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {message}
    </div>
)

export const StatCard = ({
    title,
    value,
    hint,
    icon,
}: {
    title: string
    value: string
    hint: string
    icon: ReactNode
}) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                    {value}
                </h3>
                <p className="mt-2 text-sm leading-5 text-slate-500">{hint}</p>
            </div>

            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                {icon}
            </div>
        </div>
    </div>
)

export const SectionCard = ({
    title,
    description,
    right,
    children,
}: {
    title: string
    description?: string
    right?: ReactNode
    children: ReactNode
}) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
                <h2 className="text-base font-bold tracking-tight text-slate-900">
                    {title}
                </h2>
                {description ? (
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                        {description}
                    </p>
                ) : null}
            </div>

            {right}
        </div>

        {children}
    </div>
)

export const StaffCard = ({
    item,
    active,
    onClick,
    onDragStart,
    onDragEnd,
}: {
    item: DeliveryStaffBoardItem
    active: boolean
    onClick: () => void
    onDragStart: () => void
    onDragEnd: () => void
}) => {
    const loadMeta = getStaffLoadMeta(item)

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className={cn(
                "cursor-grab rounded-xl border px-3 py-3 transition active:cursor-grabbing",
                active
                    ? "border-sky-300 bg-sky-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "rounded-xl p-2.5",
                                active
                                    ? "bg-sky-100 text-sky-700"
                                    : "bg-slate-100 text-slate-700"
                            )}
                        >
                            <UserRound className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                            <p
                                className={cn(
                                    "truncate text-sm font-semibold",
                                    active ? "text-sky-950" : "text-slate-900"
                                )}
                            >
                                {item.deliveryStaffName || "--"}
                            </p>
                            <p
                                className={cn(
                                    "mt-0.5 truncate text-[11px]",
                                    active ? "text-sky-700" : "text-slate-500"
                                )}
                            >
                                ID: {item.deliveryStaffId}
                            </p>
                            {(item.email || item.phone) ? (
                                <p
                                    className={cn(
                                        "mt-0.5 truncate text-[11px]",
                                        active ? "text-sky-600" : "text-slate-400"
                                    )}
                                >
                                    {[item.email, item.phone].filter(Boolean).join(" • ")}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                        <div
                            className={cn(
                                "rounded-full px-2.5 py-1",
                                active
                                    ? "bg-white text-slate-700"
                                    : "bg-slate-100 text-slate-600"
                            )}
                        >
                            <span className="font-medium">Active:</span>{" "}
                            <span className="font-semibold">
                                {formatNumber(item.activeGroups)}
                            </span>
                        </div>

                        <div
                            className={cn(
                                "rounded-full px-2.5 py-1",
                                active
                                    ? "bg-white text-slate-700"
                                    : "bg-slate-100 text-slate-600"
                            )}
                        >
                            <span className="font-medium">Hoàn tất:</span>{" "}
                            <span className="font-semibold">
                                {formatNumber(item.completedGroups)}
                            </span>
                        </div>

                        <div
                            className={cn(
                                "rounded-full px-2.5 py-1",
                                active
                                    ? "bg-white text-slate-700"
                                    : "bg-slate-100 text-slate-600"
                            )}
                        >
                            <span className="font-medium">Draft:</span>{" "}
                            <span className="font-semibold">
                                {formatNumber(item.draftGroups)}
                            </span>
                        </div>
                    </div>
                </div>

                <span
                    className={cn(
                        "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                        active
                            ? "border border-sky-200 bg-white text-sky-700"
                            : loadMeta.className
                    )}
                >
                    {loadMeta.label}
                </span>
            </div>
        </div>
    )
}

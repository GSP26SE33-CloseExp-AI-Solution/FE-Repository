import { ChevronLeft, ChevronRight } from "lucide-react"

import type { DeliveryCalendarDaySummary } from "@/types/admin.type"
import { adminService } from "@/services/admin.service"
import {
    cn,
    formatDate,
    formatNumber,
    getMonthGrid,
    monthNames,
    weekdayLabels,
} from "./adminDelivery.utils"
import { EmptyState, SectionCard } from "./Shared"

type AdminDeliveryCalendarPanelProps = {
    currentMonth: number
    currentYear: number
    selectedDate: string
    monthSummary: DeliveryCalendarDaySummary[]
    onPrevMonth: () => void
    onNextMonth: () => void
    onSelectDate: (date: string) => void
}

export const AdminDeliveryCalendarPanel = ({
    currentMonth,
    currentYear,
    selectedDate,
    monthSummary,
    onPrevMonth,
    onNextMonth,
    onSelectDate,
}: AdminDeliveryCalendarPanelProps) => {
    const monthGrid = getMonthGrid(currentYear, currentMonth)

    const dayMap = new Map<string, DeliveryCalendarDaySummary>()
    monthSummary.forEach((item) => {
        dayMap.set(item.date, item)
    })

    const selectedDaySummary =
        monthSummary.find((item) => item.date === selectedDate) || null

    return (
        <SectionCard
            title="Lịch tháng điều phối"
            description="Chọn ngày để xem timeline."
            right={
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrevMonth}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="min-w-[138px] rounded-lg border border-sky-100 bg-sky-50 px-3 py-1.5 text-center">
                        <p className="text-sm font-bold text-slate-900">
                            {monthNames[currentMonth - 1]} / {currentYear}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onNextMonth}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            }
        >
            <div className="space-y-3">
                {!selectedDaySummary ? (
                    <EmptyState message="Chưa có đơn để thực hiện điều phối." />
                ) : (
                    <div className="flex flex-col gap-1 rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2 text-xs text-slate-600 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="font-semibold text-slate-900">Ngày:</span>{" "}
                            {formatDate(selectedDaySummary.date)}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <span>
                                <span className="font-semibold text-slate-900">
                                    {formatNumber(selectedDaySummary.totalGroups)}
                                </span>{" "}
                                nhóm
                            </span>
                            <span>
                                <span className="font-semibold text-slate-900">
                                    {formatNumber(selectedDaySummary.totalOrders)}
                                </span>{" "}
                                đơn
                            </span>
                            <span
                                className={cn(
                                    "font-medium",
                                    (selectedDaySummary.totalUnassignedGroups ?? 0) > 0
                                        ? "text-amber-700"
                                        : "text-emerald-700"
                                )}
                            >
                                {(selectedDaySummary.totalUnassignedGroups ?? 0) > 0
                                    ? `${formatNumber(selectedDaySummary.totalUnassignedGroups)} chưa gán`
                                    : "Đủ shipper"}
                            </span>
                        </div>
                    </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                    <div className="mb-1.5 grid grid-cols-7 gap-1.5">
                        {weekdayLabels.map((label) => (
                            <div
                                key={label}
                                className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                        {monthGrid.map((cell, index) => {
                            const daySummary = cell.dateKey ? dayMap.get(cell.dateKey) : undefined
                            const isSelected =
                                Boolean(cell.dateKey) && cell.dateKey === selectedDate
                            const hasData = Boolean(daySummary?.totalGroups)
                            const hasUrgent = Boolean(daySummary?.totalUnassignedGroups)
                            const isToday =
                                cell.dateKey === adminService.toDateKey(new Date().toISOString())

                            return (
                                <button
                                    key={`${cell.dateKey || "blank"}-${index}`}
                                    type="button"
                                    disabled={!cell.dateKey}
                                    onClick={() => {
                                        if (cell.dateKey) onSelectDate(cell.dateKey)
                                    }}
                                    className={cn(
                                        "min-h-[62px] rounded-lg border px-2 py-1.5 text-left transition",
                                        !cell.dateKey &&
                                        "cursor-default border-transparent bg-transparent",
                                        cell.dateKey &&
                                        !isSelected &&
                                        !hasData &&
                                        "border-slate-200 bg-white hover:bg-slate-50",
                                        cell.dateKey &&
                                        !isSelected &&
                                        hasData &&
                                        !hasUrgent &&
                                        "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50",
                                        cell.dateKey &&
                                        !isSelected &&
                                        hasData &&
                                        hasUrgent &&
                                        "border-amber-200 bg-amber-50/80 hover:bg-amber-50",
                                        isSelected &&
                                        "border-sky-300 bg-sky-50 shadow-sm ring-1 ring-sky-200/70"
                                    )}
                                >
                                    {cell.dateKey ? (
                                        <div className="flex h-full flex-col justify-between">
                                            <div className="flex items-start justify-between gap-1">
                                                <span
                                                    className={cn(
                                                        "text-xs font-bold leading-none",
                                                        isSelected
                                                            ? "text-sky-950"
                                                            : isToday
                                                                ? "text-sky-700"
                                                                : "text-slate-900"
                                                    )}
                                                >
                                                    {cell.dayNumber}
                                                </span>

                                                {isToday ? (
                                                    <span
                                                        className={cn(
                                                            "rounded-full px-1 py-0.5 text-[8px] font-semibold",
                                                            isSelected
                                                                ? "border border-sky-200 bg-white text-sky-700"
                                                                : "bg-sky-100 text-sky-700"
                                                        )}
                                                    >
                                                        Hôm nay
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="space-y-0.5">
                                                {hasData ? (
                                                    <>
                                                        <div
                                                            className={cn(
                                                                "text-[10px] font-semibold leading-none",
                                                                isSelected
                                                                    ? "text-sky-900"
                                                                    : "text-slate-700"
                                                            )}
                                                        >
                                                            {formatNumber(daySummary?.totalGroups)} nhóm
                                                        </div>

                                                        {(daySummary?.totalUnassignedGroups ?? 0) >
                                                            0 ? (
                                                            <div
                                                                className={cn(
                                                                    "text-[9px] font-medium leading-none",
                                                                    isSelected
                                                                        ? "text-amber-700"
                                                                        : "text-amber-700"
                                                                )}
                                                            >
                                                                {formatNumber(
                                                                    daySummary?.totalUnassignedGroups
                                                                )} chưa gán
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={cn(
                                                                    "text-[9px] leading-none",
                                                                    isSelected
                                                                        ? "text-sky-700"
                                                                        : "text-slate-500"
                                                                )}
                                                            >
                                                                {formatNumber(daySummary?.totalOrders)} đơn
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div
                                                        className={cn(
                                                            "text-[9px] leading-none",
                                                            isSelected
                                                                ? "text-sky-600"
                                                                : "text-slate-400"
                                                        )}
                                                    >
                                                        Trống
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </SectionCard>
    )
}

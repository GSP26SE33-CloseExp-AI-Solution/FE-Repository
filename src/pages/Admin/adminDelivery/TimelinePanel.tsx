import type { FormEvent, ReactNode } from "react"
import { AlertTriangle, Loader2, Search, Sparkles, UserRound } from "lucide-react"

import type {
    DeliveryCalendarSlotSummary,
    DeliveryGroupSummary,
} from "@/types/admin.type"
import {
    cn,
    formatNumber,
    formatTime,
    getPriorityToneClass,
    getStatusClass,
    mapDeliveryTypeLabel,
    mapGroupStatusLabel,
} from "./adminDelivery.utils"
import { EmptyState, SectionCard } from "./Shared"

type AdminDeliveryTimelinePanelProps = {
    selectedDate: string
    slotLoading: boolean
    searchInput: string
    onSearchInputChange: (value: string) => void
    onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void
    filteredSlotSummaries: DeliveryCalendarSlotSummary[]
    selectedGroupId?: string
    onSelectGroup: (group: DeliveryGroupSummary) => void | Promise<void>
}

const MetaChip = ({
    label,
    value,
    active,
    icon,
}: {
    label: string
    value: string
    active?: boolean
    icon?: ReactNode
}) => (
    <div
        className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]",
            active
                ? "bg-white text-sky-700 ring-1 ring-sky-200"
                : "bg-slate-100 text-slate-600"
        )}
    >
        {icon}
        <span className="font-medium">{label}:</span>
        <span className="font-semibold">{value}</span>
    </div>
)

const formatDistance = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return "--"
    return `${Number(value).toFixed(2)} km`
}

const isGroupUnassignedFromSummary = (group: DeliveryGroupSummary) =>
    !(group.deliveryStaffName || group.deliveryStaffId)

export const AdminDeliveryTimelinePanel = ({
    selectedDate,
    slotLoading,
    searchInput,
    onSearchInputChange,
    onSearchSubmit,
    filteredSlotSummaries,
    selectedGroupId,
    onSelectGroup,
}: AdminDeliveryTimelinePanelProps) => {
    return (
        <SectionCard
            title="Timeline theo ca giao"
            description="Chọn nhóm để mở panel xử lý ở phía dưới."
            right={
                <form onSubmit={onSearchSubmit} className="w-full max-w-sm">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={searchInput}
                            onChange={(e) => onSearchInputChange(e.target.value)}
                            placeholder="Tìm mã nhóm, phương thức giao hàng, địa điểm giao..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-sky-300"
                        />
                    </div>
                </form>
            }
        >
            {!selectedDate ? (
                <EmptyState message="Hãy chọn một ngày trong lịch để xem các ca giao." />
            ) : slotLoading ? (
                <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải timeline theo ca...
                    </div>
                </div>
            ) : filteredSlotSummaries.length === 0 ? (
                <EmptyState message="Ngày này hiện chưa có nhóm nào phù hợp." />
            ) : (
                <div className="space-y-3">
                    {filteredSlotSummaries.map((slot) => (
                        <div
                            key={slot.timeSlotId || slot.timeSlotDisplay}
                            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
                        >
                            <div className="flex flex-col gap-1.5 border-b border-slate-200/80 pb-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        {slot.timeSlotDisplay || "--"}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {formatNumber(slot.totalGroups)} nhóm •{" "}
                                        {formatNumber(slot.totalOrders)} đơn •{" "}
                                        {formatNumber(slot.unassignedGroups)} chưa gán
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2.5">
                                {slot.groups.map((group) => {
                                    const isActive = selectedGroupId === group.deliveryGroupId
                                    const isUnassigned = isGroupUnassignedFromSummary(group)
                                    const hasAssignedStaff = !isUnassigned
                                    const hasPriority =
                                        (group.priorityScore ?? 0) > 0 ||
                                        (group.priorityReasons?.length ?? 0) > 0

                                    const slotTimeText =
                                        group.slotStartAtUtc || group.slotEndAtUtc
                                            ? `${formatTime(group.slotStartAtUtc)} - ${formatTime(group.slotEndAtUtc)}`
                                            : group.timeSlotDisplay || "--"

                                    const collectionPointText =
                                        group.collectionPointName || "--"

                                    return (
                                        <button
                                            key={group.deliveryGroupId}
                                            type="button"
                                            onClick={() => void onSelectGroup(group)}
                                            className={cn(
                                                "w-full rounded-xl border px-3 py-3 text-left transition",
                                                isActive
                                                    ? "border-sky-300 bg-sky-50 shadow-sm"
                                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="space-y-2.5">
                                                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p
                                                                className={cn(
                                                                    "truncate text-sm font-semibold",
                                                                    isActive
                                                                        ? "text-sky-950"
                                                                        : "text-slate-900"
                                                                )}
                                                            >
                                                                {group.groupCode ||
                                                                    group.deliveryGroupId}
                                                            </p>

                                                            <span
                                                                className={cn(
                                                                    "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                                                    isActive
                                                                        ? "border border-sky-200 bg-white text-sky-700"
                                                                        : getStatusClass(group.status)
                                                                )}
                                                            >
                                                                {mapGroupStatusLabel(group.status)}
                                                            </span>

                                                            {isUnassigned ? (
                                                                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                                                    Chưa có shipper
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className={cn(
                                                                        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                                                        isActive
                                                                            ? "border border-sky-200 bg-white text-sky-700"
                                                                            : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                                                    )}
                                                                >
                                                                    Đã phân công
                                                                </span>
                                                            )}

                                                            {hasPriority ? (
                                                                <span
                                                                    className={cn(
                                                                        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                                                        isActive
                                                                            ? "border border-sky-200 bg-white text-sky-700"
                                                                            : getPriorityToneClass(
                                                                                group.priorityScore
                                                                            )
                                                                    )}
                                                                >
                                                                    Ưu tiên:{" "}
                                                                    {formatNumber(
                                                                        group.priorityScore ?? 0
                                                                    )}
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        <div
                                                            className={cn(
                                                                "mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs md:grid-cols-2 xl:grid-cols-3",
                                                                isActive
                                                                    ? "text-sky-900"
                                                                    : "text-slate-600"
                                                            )}
                                                        >
                                                            <p>
                                                                <span className="font-medium">
                                                                    Địa điểm giao:
                                                                </span>{" "}
                                                                {collectionPointText}
                                                            </p>
                                                            <p>
                                                                <span className="font-medium">
                                                                    Phương thức giao hàng:
                                                                </span>{" "}
                                                                {mapDeliveryTypeLabel(
                                                                    group.deliveryType
                                                                )}
                                                            </p>
                                                            <p>
                                                                <span className="font-medium">
                                                                    Tổng đơn:
                                                                </span>{" "}
                                                                {formatNumber(group.totalOrders)}
                                                            </p>
                                                            <p>
                                                                <span className="font-medium">
                                                                    Đã hoàn tất:
                                                                </span>{" "}
                                                                {formatNumber(
                                                                    group.completedOrders
                                                                )}
                                                            </p>
                                                            <p>
                                                                <span className="font-medium">
                                                                    Khung giờ:
                                                                </span>{" "}
                                                                {slotTimeText}
                                                            </p>
                                                            <p>
                                                                <span className="font-medium">
                                                                    Shipper:
                                                                </span>{" "}
                                                                {group.deliveryStaffName ||
                                                                    group.deliveryStaffId ||
                                                                    "--"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={cn(
                                                            "grid min-w-[190px] grid-cols-3 gap-2 rounded-xl px-2.5 py-2 text-center text-[11px]",
                                                            isActive
                                                                ? "bg-white text-sky-800 ring-1 ring-sky-200"
                                                                : "bg-slate-50 text-slate-600"
                                                        )}
                                                    >
                                                        <div>
                                                            <p>Hoàn tất</p>
                                                            <p className="mt-0.5 text-sm font-bold">
                                                                {formatNumber(
                                                                    group.completedOrders
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p>Thất bại</p>
                                                            <p className="mt-0.5 text-sm font-bold">
                                                                {formatNumber(
                                                                    group.failedOrders ?? 0
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p>Ưu tiên</p>
                                                            <p className="mt-0.5 text-sm font-bold">
                                                                {formatNumber(
                                                                    group.priorityScore ?? 0
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {hasAssignedStaff ? (
                                                    <div
                                                        className={cn(
                                                            "rounded-xl border px-3 py-2",
                                                            isActive
                                                                ? "border-sky-200 bg-white"
                                                                : "border-emerald-200 bg-emerald-50/70"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={cn(
                                                                    "rounded-lg p-1.5",
                                                                    isActive
                                                                        ? "bg-sky-100 text-sky-700"
                                                                        : "bg-emerald-100 text-emerald-700"
                                                                )}
                                                            >
                                                                <UserRound className="h-3.5 w-3.5" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p
                                                                    className={cn(
                                                                        "text-[11px] font-semibold uppercase tracking-wide",
                                                                        isActive
                                                                            ? "text-sky-700"
                                                                            : "text-emerald-700"
                                                                    )}
                                                                >
                                                                    Người đang phụ trách
                                                                </p>
                                                                <p
                                                                    className={cn(
                                                                        "mt-0.5 truncate text-xs font-medium",
                                                                        isActive
                                                                            ? "text-slate-700"
                                                                            : "text-slate-800"
                                                                    )}
                                                                >
                                                                    {group.deliveryStaffName ||
                                                                        group.deliveryStaffId ||
                                                                        "--"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {group.priorityReasons?.length ? (
                                                    <div
                                                        className={cn(
                                                            "rounded-xl border px-3 py-2",
                                                            isActive
                                                                ? "border-sky-200 bg-white"
                                                                : "border-amber-200 bg-amber-50/70"
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <AlertTriangle
                                                                className={cn(
                                                                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                                                                    isActive
                                                                        ? "text-sky-700"
                                                                        : "text-amber-700"
                                                                )}
                                                            />
                                                            <div className="min-w-0">
                                                                <p
                                                                    className={cn(
                                                                        "text-[11px] font-semibold uppercase tracking-wide",
                                                                        isActive
                                                                            ? "text-sky-700"
                                                                            : "text-amber-700"
                                                                    )}
                                                                >
                                                                    Lý do ưu tiên
                                                                </p>

                                                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                                    {group.priorityReasons.map(
                                                                        (reason, index) => (
                                                                            <span
                                                                                key={`${group.deliveryGroupId}-reason-${index}`}
                                                                                className={cn(
                                                                                    "inline-flex items-center rounded-full px-2 py-1 text-[11px]",
                                                                                    isActive
                                                                                        ? "border border-sky-200 bg-sky-50 text-sky-700"
                                                                                        : "border border-amber-200 bg-white text-slate-700"
                                                                                )}
                                                                            >
                                                                                <Sparkles className="mr-1 h-3 w-3" />
                                                                                {reason}
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                <div className="flex flex-wrap gap-1.5">
                                                    <MetaChip
                                                        label="Khoảng cách"
                                                        value={formatDistance(
                                                            group.distanceFromCurrentKm
                                                        )}
                                                        active={isActive}
                                                    />
                                                    <MetaChip
                                                        label="Ca"
                                                        value={group.timeSlotDisplay || "--"}
                                                        active={isActive}
                                                    />
                                                    <MetaChip
                                                        label="Điểm nhận"
                                                        value={collectionPointText}
                                                        active={isActive}
                                                    />
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </SectionCard>
    )
}

import type { Dispatch, SetStateAction } from "react"
import {
    CheckCircle2,
    Loader2,
    Search,
    Send,
    ShieldCheck,
    UserRound,
    Users2,
    X,
} from "lucide-react"

import type {
    DeliveryGroupDetail,
    DeliveryStaffBoardItem,
} from "@/types/admin.type"
import {
    cn,
    formatCoordinate,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatNumber,
    getStatusClass,
    isDraftGroup,
    mapDeliveryItemStatusLabel,
    mapDeliveryTypeLabel,
    mapGroupStatusLabel,
    mapOrderStatusLabel,
    mapPackagingStatusLabel,
} from "./adminDelivery.utils"
import { EmptyState, SectionCard, StaffCard } from "./Shared"

type AssignFormState = {
    deliveryStaffId: string
    reason: string
}

type AdminDeliveryAssignmentPanelProps = {
    selectedGroup: DeliveryGroupDetail | null
    detailLoading: boolean
    detailNotice: string
    filteredStaffBoard: DeliveryStaffBoardItem[]
    staffBoard: DeliveryStaffBoardItem[]
    staffKeyword: string
    onStaffKeywordChange: (value: string) => void
    selectedAssignStaff: DeliveryStaffBoardItem | null
    setSelectedAssignStaff: (staff: DeliveryStaffBoardItem | null) => void
    draggingStaff: DeliveryStaffBoardItem | null
    setDraggingStaff: (staff: DeliveryStaffBoardItem | null) => void
    isAssignDropActive: boolean
    setIsAssignDropActive: (active: boolean) => void
    assignForm: AssignFormState
    setAssignForm: Dispatch<SetStateAction<AssignFormState>>
    assigningGroupId: string
    confirmingGroupId: string
    onAssignShipper: () => void | Promise<void>
    onConfirmDraftGroup: (groupId: string) => void | Promise<void>
    onClearSelectedStaff: () => void
}

const MiniInfo = ({
    label,
    value,
    tone = "default",
}: {
    label: string
    value: string
    tone?: "default" | "success" | "warning"
}) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {label}
        </p>
        <p
            className={cn(
                "mt-1 text-sm font-semibold",
                tone === "success" && "text-emerald-700",
                tone === "warning" && "text-amber-700",
                tone === "default" && "text-slate-900"
            )}
        >
            {value}
        </p>
    </div>
)

const InfoChip = ({
    label,
    value,
    active = false,
}: {
    label: string
    value: string
    active?: boolean
}) => (
    <div
        className={cn(
            "rounded-full px-2.5 py-1 text-[11px]",
            active
                ? "bg-white text-sky-700 ring-1 ring-sky-200"
                : "bg-slate-100 text-slate-600"
        )}
    >
        <span className="font-medium">{label}:</span> {value}
    </div>
)

const safeText = (value?: string | null, fallback = "--") => {
    const text = String(value || "").trim()
    return text || fallback
}

const cleanGroupNotes = (value?: string | null) => {
    const text = String(value || "").trim()
    if (!text) return "--"

    return (
        text
            .replace(
                /Auto draft by admin [a-f0-9-]{36}\s*\(item buckets\)\s*\|?\s*/gi,
                ""
            )
            .replace(/Admin điều phối:\s*/gi, "")
            .replace(/\s*\|\s*/g, " • ")
            .replace(/\s{2,}/g, " ")
            .trim() || "--"
    )
}

const formatOptionalCoordinate = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return "--"
    }

    return formatCoordinate(value)
}

const formatOptionalCount = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return "--"
    }

    return formatNumber(value)
}

export const AdminDeliveryAssignmentPanel = ({
    selectedGroup,
    detailLoading,
    detailNotice,
    filteredStaffBoard,
    staffBoard,
    staffKeyword,
    onStaffKeywordChange,
    selectedAssignStaff,
    setSelectedAssignStaff,
    draggingStaff,
    setDraggingStaff,
    isAssignDropActive,
    setIsAssignDropActive,
    assignForm,
    setAssignForm,
    assigningGroupId,
    confirmingGroupId,
    onAssignShipper,
    onConfirmDraftGroup,
    onClearSelectedStaff,
}: AdminDeliveryAssignmentPanelProps) => {
    const selectedIsDraft = isDraftGroup(selectedGroup)
    const hasAssignedStaff = Boolean(
        selectedGroup?.deliveryStaffId || selectedGroup?.deliveryStaffName
    )
    const isReadonlyAssignedMode = Boolean(selectedGroup && hasAssignedStaff)

    return (
        <SectionCard
            title={isReadonlyAssignedMode ? "Chi tiết nhóm đã phân công" : "Phân công shipper"}
            description={
                isReadonlyAssignedMode
                    ? "Nhóm này đã có shipper phụ trách. Bạn xem chi tiết đơn, người phụ trách và trạng thái xử lý."
                    : "Chọn nhóm giao từ timeline, sau đó gán shipper và theo dõi nhanh đơn trong nhóm."
            }
        >
            {!selectedGroup ? (
                <EmptyState message="Hãy chọn một nhóm trong timeline để bắt đầu xử lý." />
            ) : detailLoading ? (
                <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải dữ liệu nhóm giao...
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {detailNotice ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            {detailNotice}
                        </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        <MiniInfo
                            label="Mã nhóm"
                            value={safeText(
                                selectedGroup.groupCode || selectedGroup.deliveryGroupId
                            )}
                        />
                        <MiniInfo
                            label="Trạng thái"
                            value={mapGroupStatusLabel(selectedGroup.status)}
                        />
                        <MiniInfo
                            label="Khung giờ"
                            value={safeText(selectedGroup.timeSlotDisplay)}
                        />
                        <MiniInfo
                            label="Tổng đơn"
                            value={formatNumber(selectedGroup.totalOrders)}
                        />
                        <MiniInfo
                            label="Hoàn tất"
                            value={formatNumber(selectedGroup.completedOrders)}
                            tone="success"
                        />
                        <MiniInfo
                            label="Thất bại"
                            value={formatNumber(selectedGroup.failedOrders)}
                            tone="warning"
                        />
                        <MiniInfo
                            label="Điểm tập kết"
                            value={safeText(selectedGroup.collectionPointName)}
                        />
                        <MiniInfo
                            label="Phương thức giao hàng"
                            value={mapDeliveryTypeLabel(selectedGroup.deliveryType)}
                        />
                    </div>

                    {isReadonlyAssignedMode ? (
                        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-white p-2.5 text-sky-700 ring-1 ring-sky-200">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900">
                                                Shipper đang phụ trách
                                            </p>
                                            <p className="mt-1 text-base font-bold text-sky-900">
                                                {safeText(selectedGroup.deliveryStaffName)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                ID: {safeText(selectedGroup.deliveryStaffId)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <InfoChip
                                        label="Ngày giao"
                                        value={formatDate(selectedGroup.deliveryDate)}
                                        active
                                    />
                                    <InfoChip
                                        label="Cập nhật"
                                        value={formatDateTime(selectedGroup.updatedAt)}
                                        active
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Danh sách shipper
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Chọn nhanh hoặc kéo-thả sang ô phân công.
                                        </p>
                                    </div>

                                    <div className="w-full max-w-xs">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                value={staffKeyword}
                                                onChange={(e) =>
                                                    onStaffKeywordChange(e.target.value)
                                                }
                                                placeholder="Tìm shipper..."
                                                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-sky-300"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {filteredStaffBoard.length === 0 ? (
                                    <EmptyState message="Chưa có shipper phù hợp." />
                                ) : (
                                    <div className="space-y-2.5">
                                        {filteredStaffBoard.map((item) => (
                                            <StaffCard
                                                key={item.deliveryStaffId}
                                                item={item}
                                                active={
                                                    selectedAssignStaff?.deliveryStaffId ===
                                                    item.deliveryStaffId
                                                }
                                                onClick={() => {
                                                    setSelectedAssignStaff(item)
                                                    setAssignForm((prev) => ({
                                                        ...prev,
                                                        deliveryStaffId: item.deliveryStaffId,
                                                    }))
                                                }}
                                                onDragStart={() => setDraggingStaff(item)}
                                                onDragEnd={() => setDraggingStaff(null)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="mb-3">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Ô phân công
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Kéo-thả shipper hoặc nhập tay mã nhân sự giao hàng.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div
                                        onDragOver={(event) => event.preventDefault()}
                                        onDragEnter={() => setIsAssignDropActive(true)}
                                        onDragLeave={() => setIsAssignDropActive(false)}
                                        onDrop={(event) => {
                                            event.preventDefault()
                                            setIsAssignDropActive(false)

                                            if (draggingStaff) {
                                                setSelectedAssignStaff(draggingStaff)
                                                setAssignForm((prev) => ({
                                                    ...prev,
                                                    deliveryStaffId:
                                                        draggingStaff.deliveryStaffId,
                                                }))
                                            }
                                        }}
                                        className={cn(
                                            "rounded-xl border border-dashed px-4 py-3 transition",
                                            isAssignDropActive
                                                ? "border-sky-400 bg-sky-50"
                                                : "border-slate-200 bg-slate-50"
                                        )}
                                    >
                                        {!selectedAssignStaff ? (
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <Users2 className="h-4 w-4" />
                                                {draggingStaff
                                                    ? `Thả ${draggingStaff.deliveryStaffName} vào đây để chọn`
                                                    : "Kéo shipper từ cột trái và thả vào đây"}
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-xl bg-sky-100 p-2.5 text-sky-700">
                                                            <UserRound className="h-4 w-4" />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                                {safeText(
                                                                    selectedAssignStaff.deliveryStaffName
                                                                )}
                                                            </p>
                                                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                                                ID:{" "}
                                                                {safeText(
                                                                    selectedAssignStaff.deliveryStaffId
                                                                )}
                                                            </p>
                                                            {(selectedAssignStaff.email ||
                                                                selectedAssignStaff.phone) ? (
                                                                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                                                    {[
                                                                        selectedAssignStaff.email,
                                                                        selectedAssignStaff.phone,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(" • ")}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <InfoChip
                                                            label="Active"
                                                            value={formatNumber(
                                                                selectedAssignStaff.activeGroups
                                                            )}
                                                            active
                                                        />
                                                        <InfoChip
                                                            label="Hoàn tất"
                                                            value={formatNumber(
                                                                selectedAssignStaff.completedGroups
                                                            )}
                                                            active
                                                        />
                                                        <InfoChip
                                                            label="Thất bại"
                                                            value={formatNumber(
                                                                selectedAssignStaff.failedGroups
                                                            )}
                                                            active
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={onClearSelectedStaff}
                                                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Delivery staff ID
                                            </label>
                                            <input
                                                value={assignForm.deliveryStaffId}
                                                onChange={(e) => {
                                                    const nextId = e.target.value

                                                    setAssignForm((prev) => ({
                                                        ...prev,
                                                        deliveryStaffId: nextId,
                                                    }))

                                                    const matched =
                                                        staffBoard.find(
                                                            (item) =>
                                                                item.deliveryStaffId === nextId
                                                        ) || null

                                                    setSelectedAssignStaff(matched)
                                                }}
                                                placeholder="Kéo-thả hoặc nhập deliveryStaffId"
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Lý do / ghi chú
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={assignForm.reason}
                                                onChange={(e) =>
                                                    setAssignForm((prev) => ({
                                                        ...prev,
                                                        reason: e.target.value,
                                                    }))
                                                }
                                                placeholder="Nhập lý do nếu cần"
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => void onAssignShipper()}
                                            disabled={
                                                assigningGroupId ===
                                                selectedGroup.deliveryGroupId ||
                                                !assignForm.deliveryStaffId.trim()
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {assigningGroupId ===
                                                selectedGroup.deliveryGroupId ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                            Phân công shipper
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void onConfirmDraftGroup(
                                                    selectedGroup.deliveryGroupId
                                                )
                                            }
                                            disabled={
                                                !selectedIsDraft ||
                                                confirmingGroupId ===
                                                selectedGroup.deliveryGroupId
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {confirmingGroupId ===
                                                selectedGroup.deliveryGroupId ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4" />
                                            )}
                                            {selectedIsDraft
                                                ? "Xác nhận draft"
                                                : "Không phải draft"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Đơn hàng trong nhóm
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Xem nhanh khách hàng, trạng thái đơn và các item liên quan.
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                {formatNumber(selectedGroup.orders?.length ?? 0)} đơn
                            </div>
                        </div>

                        {selectedGroup.orders?.length ? (
                            <div className="mt-3 space-y-3">
                                {selectedGroup.orders.map((order) => (
                                    <div
                                        key={order.orderId}
                                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                                    >
                                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {safeText(order.orderCode || order.orderId)}
                                                    </p>
                                                    <span
                                                        className={cn(
                                                            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                                            getStatusClass(order.status)
                                                        )}
                                                    >
                                                        {mapOrderStatusLabel(order.status)}
                                                    </span>
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    <InfoChip
                                                        label="Khách"
                                                        value={safeText(order.customerName)}
                                                    />
                                                    <InfoChip
                                                        label="SĐT"
                                                        value={safeText(order.customerPhone)}
                                                    />
                                                    <InfoChip
                                                        label="Phương thức giao hàng"
                                                        value={mapDeliveryTypeLabel(
                                                            order.deliveryType
                                                        )}
                                                    />
                                                    <InfoChip
                                                        label="Số món"
                                                        value={formatOptionalCount(
                                                            order.totalItems
                                                        )}
                                                    />
                                                    <InfoChip
                                                        label="Khung giờ"
                                                        value={safeText(order.timeSlotDisplay)}
                                                    />
                                                </div>

                                                <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-slate-600 md:grid-cols-2">
                                                    <p>
                                                        <span className="font-medium text-slate-900">
                                                            Điểm nhận:
                                                        </span>{" "}
                                                        {safeText(order.collectionPointName)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-900">
                                                            Ngày đặt:
                                                        </span>{" "}
                                                        {formatDateTime(order.orderDate)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-900">
                                                            Kinh độ:
                                                        </span>{" "}
                                                        {formatOptionalCoordinate(order.longitude)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-900">
                                                            Vĩ độ:
                                                        </span>{" "}
                                                        {formatOptionalCoordinate(order.latitude)}
                                                    </p>
                                                    <p className="md:col-span-2">
                                                        <span className="font-medium text-slate-900">
                                                            Địa chỉ:
                                                        </span>{" "}
                                                        {safeText(order.addressLine)}
                                                    </p>
                                                    <p className="md:col-span-2">
                                                        <span className="font-medium text-slate-900">
                                                            Ghi chú giao:
                                                        </span>{" "}
                                                        {safeText(order.deliveryNote)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="rounded-xl bg-white px-3 py-2 text-sm xl:min-w-[180px]">
                                                <p className="text-xs text-slate-500">
                                                    Tổng thanh toán
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-900">
                                                    {formatCurrency(order.totalAmount)}
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-500">
                                                    Phí giao: {formatCurrency(order.deliveryFee)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                                                    Các món chi tiết trong đơn
                                                </h4>
                                                <div className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                    {order.items?.length
                                                        ? formatNumber(order.items.length)
                                                        : "--"}{" "}
                                                    món
                                                </div>
                                            </div>

                                            {order.items?.length ? (
                                                <div className="mt-3 space-y-2">
                                                    {order.items.map((item) => (
                                                        <div
                                                            key={item.orderItemId}
                                                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                                                        >
                                                            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <p className="text-sm font-semibold text-slate-900">
                                                                            {safeText(
                                                                                item.productName
                                                                            )}
                                                                        </p>

                                                                        <span
                                                                            className={cn(
                                                                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                                                                getStatusClass(
                                                                                    item.packagingStatus
                                                                                )
                                                                            )}
                                                                        >
                                                                            Đóng gói:{" "}
                                                                            {mapPackagingStatusLabel(
                                                                                item.packagingStatus
                                                                            )}
                                                                        </span>

                                                                        <span
                                                                            className={cn(
                                                                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                                                                getStatusClass(
                                                                                    item.deliveryStatus
                                                                                )
                                                                            )}
                                                                        >
                                                                            Giao hàng:{" "}
                                                                            {mapDeliveryItemStatusLabel(
                                                                                item.deliveryStatus
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                                                                        <p>
                                                                            <span className="font-medium text-slate-900">
                                                                                Số lượng:
                                                                            </span>{" "}
                                                                            {formatNumber(
                                                                                item.quantity
                                                                            )}
                                                                        </p>
                                                                        <p>
                                                                            <span className="font-medium text-slate-900">
                                                                                Đơn giá:
                                                                            </span>{" "}
                                                                            {formatCurrency(
                                                                                item.unitPrice
                                                                            )}
                                                                        </p>
                                                                        <p>
                                                                            <span className="font-medium text-slate-900">
                                                                                Thành tiền:
                                                                            </span>{" "}
                                                                            {formatCurrency(
                                                                                item.subTotal
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="mt-3">
                                                    <EmptyState message="Chưa có dữ liệu chi tiết." />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-3">
                                <EmptyState message="Nhóm này hiện chưa có dữ liệu đơn chi tiết." />
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                        <div className="flex flex-wrap gap-2">
                            <InfoChip
                                label="Mã nhóm"
                                value={safeText(
                                    selectedGroup.groupCode || selectedGroup.deliveryGroupId
                                )}
                            />
                            <InfoChip
                                label="Ngày giao"
                                value={formatDate(selectedGroup.deliveryDate)}
                            />
                            <InfoChip
                                label="Điểm tập kết"
                                value={safeText(selectedGroup.collectionPointName)}
                            />
                            <InfoChip
                                label="Shipper"
                                value={safeText(selectedGroup.deliveryStaffName)}
                            />
                            <InfoChip
                                label="Tọa độ"
                                value={`${formatCoordinate(
                                    selectedGroup.centerLatitude
                                )} / ${formatCoordinate(selectedGroup.centerLongitude)}`}
                            />
                        </div>

                        <div className="mt-2 text-xs">
                            <span className="font-medium text-slate-900">Ghi chú nhóm:</span>{" "}
                            {cleanGroupNotes(selectedGroup.notes)}
                        </div>
                    </div>
                </div>
            )}
        </SectionCard>
    )
}

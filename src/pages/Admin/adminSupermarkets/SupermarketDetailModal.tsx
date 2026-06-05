import { useEffect, useMemo, useState } from "react"
import {
    Building2,
    Copy,
    Loader2,
    Mail,
    MapPin,
    MapPinned,
    Phone,
    User,
    X,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type {
    AdminSupermarketItem,
    AdminSupermarketStaffItem,
} from "@/types/admin.type"

import {
    cn,
    formatDate,
    formatDateTime,
    getMissingFields,
    getProfileClass,
    getProfileLabel,
    getStatusClass,
    getStatusLabel,
    hasCoordinates,
} from "./adminSupermarkets.utils"

type SupermarketDetailModalProps = {
    supermarket: AdminSupermarketItem | null
    copiedCode: string
    updatingStatusId: string
    onClose: () => void
    onCopyCode: (code: string) => void | Promise<void>
    onOpenMap: (item: { latitude?: number | null; longitude?: number | null }) => void
    onUpdateStatus: (item: AdminSupermarketItem, nextStatus: number) => void | Promise<void>
}

const STAFF_STATUS_LABELS: Record<number, string> = {
    0: "Đang hoạt động",
    1: "Tạm ngưng",
    2: "Đã nghỉ",
}

const getStaffStatusLabel = (status: number) =>
    STAFF_STATUS_LABELS[status] ?? `Trạng thái ${status}`

const getStaffStatusClass = (status: number) => {
    if (status === 0) return "border-emerald-200 bg-emerald-50 text-emerald-700"
    if (status === 1) return "border-amber-200 bg-amber-50 text-amber-700"
    return "border-slate-200 bg-slate-50 text-slate-600"
}

const SupermarketDetailModal = ({
    supermarket,
    copiedCode,
    updatingStatusId,
    onClose,
    onCopyCode,
    onOpenMap,
    onUpdateStatus,
}: SupermarketDetailModalProps) => {
    const [staff, setStaff] = useState<AdminSupermarketStaffItem[]>([])
    const [loadingStaff, setLoadingStaff] = useState(false)
    const [staffError, setStaffError] = useState("")

    useEffect(() => {
        if (!supermarket?.supermarketId) {
            setStaff([])
            setStaffError("")
            return
        }

        let cancelled = false

        const loadStaff = async () => {
            setLoadingStaff(true)
            setStaffError("")

            try {
                const rows = await adminService.getSupermarketStaff(supermarket.supermarketId)
                if (!cancelled) {
                    setStaff(Array.isArray(rows) ? rows : [])
                }
            } catch (error) {
                if (!cancelled) {
                    setStaff([])
                    setStaffError(
                        error instanceof Error
                            ? error.message
                            : "Không tải được danh sách nhân viên",
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoadingStaff(false)
                }
            }
        }

        void loadStaff()

        return () => {
            cancelled = true
        }
    }, [supermarket?.supermarketId])

    const managerFromStaff = useMemo(
        () => staff.find((row) => row.isManager) ?? null,
        [staff],
    )

    const managerFullName =
        managerFromStaff?.fullName || supermarket?.managerFullName || ""
    const managerEmail =
        managerFromStaff?.email || supermarket?.managerEmail || ""

    if (!supermarket) return null

    const disabled = updatingStatusId === supermarket.supermarketId
    const baseClass =
        "rounded-xl border px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"

    const renderStatusActions = () => {
        if (supermarket.status === 1) {
            return (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => void onUpdateStatus(supermarket, 2)}
                        disabled={disabled}
                        className={cn(
                            baseClass,
                            "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                        )}
                    >
                        {disabled ? "Đang xử lý..." : "Tạm ngưng"}
                    </button>
                    <button
                        type="button"
                        onClick={() => void onUpdateStatus(supermarket, 3)}
                        disabled={disabled}
                        className={cn(
                            baseClass,
                            "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                        )}
                    >
                        {disabled ? "Đang xử lý..." : "Đóng"}
                    </button>
                </div>
            )
        }

        if (
            supermarket.status === 0 ||
            supermarket.status === 2 ||
            supermarket.status === 3 ||
            supermarket.status === 4
        ) {
            return (
                <button
                    type="button"
                    onClick={() => void onUpdateStatus(supermarket, 1)}
                    disabled={disabled}
                    className={cn(
                        baseClass,
                        "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                    )}
                >
                    {disabled ? "Đang xử lý..." : "Kích hoạt"}
                </button>
            )
        }

        return null
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Chi tiết siêu thị
                        </p>
                        <h3 className="mt-1 truncate text-lg font-semibold text-slate-900">
                            {supermarket.name || "--"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {supermarket.supermarketId || "--"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[calc(90vh-81px)] overflow-y-auto px-5 py-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                Trạng thái
                            </p>
                            <div className="mt-3">
                                <span
                                    className={cn(
                                        "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                                        getStatusClass(supermarket.status)
                                    )}
                                >
                                    {getStatusLabel(supermarket.status)}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                Mức hoàn chỉnh
                            </p>
                            <div className="mt-3">
                                <span
                                    className={cn(
                                        "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                                        getProfileClass(supermarket)
                                    )}
                                >
                                    {getProfileLabel(supermarket)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Thông tin cơ bản
                        </p>

                        <div className="mt-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-slate-100 p-2">
                                    <Building2 className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Tên siêu thị</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {supermarket.name || "--"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-slate-100 p-2">
                                    <Phone className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Số điện thoại</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {supermarket.contactPhone || "--"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-slate-100 p-2">
                                    <Mail className="h-4 w-4 text-slate-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="break-all text-sm font-medium text-slate-900">
                                        {supermarket.contactEmail || "--"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-slate-100 p-2">
                                    <MapPin className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Địa chỉ</p>
                                    <p className="text-sm leading-6 text-slate-900">
                                        {supermarket.address || "--"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Tài khoản quản lý
                        </p>

                        {loadingStaff ? (
                            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang tải thông tin quản lý...
                            </div>
                        ) : staffError ? (
                            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {staffError}
                            </div>
                        ) : managerFullName || managerEmail ? (
                            <div className="mt-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-xl bg-emerald-100 p-2">
                                        <User className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Họ tên</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {managerFullName || "--"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="rounded-xl bg-emerald-100 p-2">
                                        <Mail className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-500">Email đăng nhập</p>
                                        <p className="break-all text-sm font-medium text-slate-900">
                                            {managerEmail || "--"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                                <p className="text-sm text-slate-500">
                                    Chưa có tài khoản quản lý được gán
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Định vị & thời gian
                        </p>

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-slate-500">Tọa độ</p>
                                <p className="mt-1 text-sm font-medium text-slate-900">
                                    {hasCoordinates(supermarket)
                                        ? `${supermarket.latitude}, ${supermarket.longitude}`
                                        : "--"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">Ngày tạo</p>
                                <p className="mt-1 text-sm font-medium text-slate-900">
                                    {formatDate(supermarket.createdAt)}
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <p className="text-xs text-slate-500">Cập nhật gần nhất</p>
                                <p className="mt-1 text-sm font-medium text-slate-900">
                                    {formatDateTime(supermarket.updatedAt)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Thông tin cần bổ sung
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {getMissingFields(supermarket).length === 0 ? (
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                                    Hồ sơ đã đầy đủ
                                </span>
                            ) : (
                                getMissingFields(supermarket).map((field) => (
                                    <span
                                        key={field}
                                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700"
                                    >
                                        {field}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Quản trị
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => onCopyCode(supermarket.supermarketId || "--")}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                <Copy className="h-4 w-4" />
                                {copiedCode === supermarket.supermarketId
                                    ? "Đã sao chép"
                                    : "Sao chép mã"}
                            </button>

                            <button
                                type="button"
                                onClick={() => onOpenMap(supermarket)}
                                disabled={!hasCoordinates(supermarket)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <MapPinned className="h-4 w-4" />
                                Xem vị trí
                            </button>

                            {renderStatusActions()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SupermarketDetailModal

import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
    CalendarDays,
    CheckCircle2,
    ExternalLink,
    Loader2,
    PackageCheck,
    Truck,
    UserRound,
    X,
} from "lucide-react"

import { packagingService } from "@/services/packaging.service"
import type { PackagingOrderDetail } from "@/types/packaging.type"
import { showError } from "@/utils/toast"

import PackagingActivitySection from "./PackagingActivitySection"
import {
    cn,
    currency,
    formatDateTime,
    formatPackagingItemQuantityLabel,
    getDeliveryTypeLabel,
    getFriendlyPackagingErrorMessage,
    getOrderStatusLabel,
    getPackagingStatusClass,
    getPackagingStatusLabel,
    isPackagingOrderCompleted,
} from "./packagingShared"

type PackagingOrderDetailModalProps = {
    open: boolean
    orderId: string | null
    highlightOrderItemId?: string | null
    onClose: () => void
}

const PackagingOrderDetailModal = ({
    open,
    orderId,
    highlightOrderItemId,
    onClose,
}: PackagingOrderDetailModalProps) => {
    const [order, setOrder] = useState<PackagingOrderDetail | null>(null)
    const [loading, setLoading] = useState(false)

    const loadDetail = useCallback(async () => {
        if (!orderId) return

        setLoading(true)

        try {
            const response = await packagingService.getOrderDetail(orderId)
            setOrder(response.data || null)
        } catch (error) {
            console.error("[PackagingOrderDetailModal] loadDetail failed:", error)
            setOrder(null)
            showError(
                getFriendlyPackagingErrorMessage(
                    error,
                    "Không tải được chi tiết đơn đóng gói.",
                ),
            )
        } finally {
            setLoading(false)
        }
    }, [orderId])

    useEffect(() => {
        if (!open || !orderId) {
            setOrder(null)
            return
        }

        void loadDetail()
    }, [open, orderId, loadDetail])

    useEffect(() => {
        if (!open) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [open, onClose])

    if (!open) return null

    const orderCompleted = order
        ? isPackagingOrderCompleted(
            order.packagingStatus,
            order.orderStatus,
            order.items,
        )
        : false

    const packingViewUrl = orderId
        ? `/package/packing?orderId=${orderId}&view=1`
        : null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="packaging-order-detail-title"
            >
                <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-white px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <PackageCheck className="h-3.5 w-3.5" />
                                Chi tiết đóng gói
                            </div>

                            <h2
                                id="packaging-order-detail-title"
                                className="mt-3 truncate text-xl font-bold text-slate-900"
                            >
                                {loading
                                    ? "Đang tải đơn..."
                                    : order?.orderCode
                                        ? `Đơn ${order.orderCode}`
                                        : "Chi tiết đơn đóng gói"}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {orderCompleted
                                    ? "Đơn đã hoàn tất đóng gói — chỉ xem lại thông tin và danh sách món."
                                    : "Xem nhanh thông tin đơn và trạng thái từng dòng đóng gói."}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Đóng"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-slate-50">
                            <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                                Đang tải chi tiết đơn...
                            </div>
                        </div>
                    ) : !order ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
                            Không có dữ liệu chi tiết đơn.
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex flex-wrap gap-2">
                                <span
                                    className={cn(
                                        "rounded-full px-3 py-1 text-xs font-semibold",
                                        getPackagingStatusClass(order.packagingStatus),
                                    )}
                                >
                                    {getPackagingStatusLabel(order.packagingStatus)}
                                </span>

                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {getOrderStatusLabel(order.orderStatus)}
                                </span>

                                {orderCompleted ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Đã hoàn tất đóng gói
                                    </span>
                                ) : null}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <UserRound className="h-3.5 w-3.5" />
                                        Khách hàng
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {order.customerName || "--"}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Truck className="h-3.5 w-3.5" />
                                        Giao nhận
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {getDeliveryTypeLabel(order.deliveryType)}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        Khung giờ
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {order.timeSlotDisplay || "--"}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                                    <p className="text-xs text-emerald-600">Thành tiền</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {currency.format(order.finalAmount || 0)}
                                    </p>
                                </div>
                            </div>

                            {(order.packagingStaffName || order.lastPackagedAt) && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {order.packagingStaffName ? (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Nhân viên đóng gói
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-slate-900">
                                                {order.packagingStaffName}
                                            </p>
                                        </div>
                                    ) : null}

                                    {order.lastPackagedAt ? (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Đóng gói lần cuối
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-slate-900">
                                                {formatDateTime(order.lastPackagedAt)}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            <PackagingActivitySection logs={order.activityLogs} />

                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Danh sách món ({order.items?.length ?? 0})
                                    </h3>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {order.items?.map((item, index) => {
                                        const highlighted =
                                            highlightOrderItemId &&
                                            item.orderItemId === highlightOrderItemId

                                        return (
                                            <div
                                                key={item.orderItemId}
                                                className={cn(
                                                    "px-4 py-4",
                                                    highlighted &&
                                                    "bg-sky-50/80 ring-1 ring-inset ring-sky-200",
                                                )}
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                                Món #{index + 1}
                                                            </span>

                                                            <span
                                                                className={cn(
                                                                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                                                                    getPackagingStatusClass(
                                                                        item.packagingStatus,
                                                                    ),
                                                                )}
                                                            >
                                                                {getPackagingStatusLabel(
                                                                    item.packagingStatus,
                                                                )}
                                                            </span>

                                                            {highlighted ? (
                                                                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                                                    Dòng lịch sử
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        <p className="mt-2 text-sm font-semibold text-slate-900">
                                                            {item.productName || "--"}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {formatPackagingItemQuantityLabel(
                                                                item,
                                                            )}
                                                            {item.supermarketName
                                                                ? ` · ${item.supermarketName}`
                                                                : ""}
                                                        </p>

                                                        {item.packagingFailedReason ? (
                                                            <p className="mt-2 text-xs font-medium text-rose-700">
                                                                Lý do lỗi:{" "}
                                                                {item.packagingFailedReason}
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div className="shrink-0 text-left sm:text-right">
                                                        <p className="text-xs text-slate-500">
                                                            Thành tiền
                                                        </p>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {currency.format(
                                                                item.subTotal || 0,
                                                            )}
                                                        </p>
                                                        {item.packagedAt ? (
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {formatDateTime(
                                                                    item.packagedAt,
                                                                )}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        Đóng
                    </button>

                    {packingViewUrl && orderCompleted ? (
                        <Link
                            to={packingViewUrl}
                            onClick={onClose}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Mở trang đóng gói
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default PackagingOrderDetailModal

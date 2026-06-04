import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Loader2,
    PackageCheck,
    RefreshCcw,
    ShoppingBag,
    Truck,
    UserRound,
    XCircle,
} from "lucide-react"

import { packagingService } from "@/services/packaging.service"
import type { PackagingOrderDetail } from "@/types/packaging.type"
import { showError, showSuccess } from "@/utils/toast"

import PackagingActivitySection from "./PackagingActivitySection"
import PackagingLabelPrintModal from "./PackagingLabelPrintModal"
import PackagingLabelPrintSection from "./PackagingLabelPrintSection"
import {
    cn,
    currency,
    formatDateTime,
    countPackagingOrderLines,
    filterSelectablePackagingItemIds,
    formatPackagingItemQuantityLabel,
    getDeliveryTypeLabel,
    getFriendlyPackagingErrorMessage,
    getOrderStatusLabel,
    getPackagingStatusClass,
    getPackagingStatusLabel,
    isPackagingLineSelectableForPacking,
    isPackagingOrderActionable,
    isPackagingOrderCompleted,
    isPackagingOrderPartiallyPackaged,
} from "./packagingShared"

const formatActionDateTime = (date = new Date()) => {
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

const buildActionNotes = ({
    actionLabel,
    userNote,
}: {
    actionLabel: string
    userNote?: string
}) => {
    const actionTime = formatActionDateTime()
    const cleanNote = userNote?.trim()

    return cleanNote
        ? `${actionLabel}: ${actionTime}\nGhi chú: ${cleanNote}`
        : `${actionLabel}: ${actionTime}`
}

const formatDateOnly = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

const getItemExpiryDate = (item: any) => {
    return (
        item.expiryDate ||
        item.expiredAt ||
        item.expirationDate ||
        item.lotExpiryDate ||
        item.stockLotExpiryDate ||
        item.expireDate ||
        ""
    )
}

const getDaysRemaining = (value?: string) => {
    if (!value) return null

    const expiry = new Date(value)
    if (Number.isNaN(expiry.getTime())) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)

    return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
}

const getExpiryToneClass = (value?: string) => {
    const days = getDaysRemaining(value)

    if (days === null) return "bg-slate-50 text-slate-500 ring-slate-200"
    if (days < 0) return "bg-rose-50 text-rose-700 ring-rose-200"
    if (days <= 3) return "bg-red-50 text-red-700 ring-red-200"
    if (days <= 7) return "bg-amber-50 text-amber-700 ring-amber-200"
    if (days <= 30) return "bg-sky-50 text-sky-700 ring-sky-200"

    return "bg-emerald-50 text-emerald-700 ring-emerald-200"
}

const getExpiryText = (value?: string) => {
    const days = getDaysRemaining(value)

    if (days === null) return "Chưa có HSD"
    if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`
    if (days === 0) return "Hết hạn hôm nay"
    if (days <= 30) return `Còn ${days} ngày`

    return "Còn hạn"
}

const PackagePacking = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get("orderId") || ""
    const isViewOnly = searchParams.get("view") === "1"

    const [order, setOrder] = useState<PackagingOrderDetail | null>(null)
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [failing, setFailing] = useState(false)
    const [notes, setNotes] = useState("")
    const [failureReason, setFailureReason] = useState("")
    const [failNotes, setFailNotes] = useState("")
    const [printModalOpen, setPrintModalOpen] = useState(false)

    const allItemIds = useMemo(
        () => order?.items?.map((item) => item.orderItemId).filter(Boolean) || [],
        [order],
    )

    const selectableItemIds = useMemo(
        () => filterSelectablePackagingItemIds(order?.items, "packing"),
        [order?.items],
    )

    const selectedItems = useMemo(() => {
        if (!order) return []

        return order.items.filter((item) =>
            selectedItemIds.includes(item.orderItemId)
        )
    }, [order, selectedItemIds])

    const totalQuantity = useMemo(
        () => countPackagingOrderLines(order?.items),
        [order],
    )

    const selectedQuantity = useMemo(
        () => countPackagingOrderLines(selectedItems),
        [selectedItems],
    )

    const selectedTotal = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + (item.subTotal || 0), 0)
    }, [selectedItems])

    const failedItems = useMemo(() => {
        return (
            order?.items?.filter((item) => item.packagingFailedReason?.trim()) || []
        )
    }, [order])

    const orderCompleted = useMemo(
        () =>
            isPackagingOrderCompleted(
                order?.packagingStatus,
                order?.orderStatus,
                order?.items,
            ),
        [order],
    )

    const orderPartiallyPackaged = useMemo(
        () =>
            isPackagingOrderPartiallyPackaged(
                order?.packagingStatus,
                order?.orderStatus,
                order?.items,
            ),
        [order],
    )

    const canPerformActions = useMemo(() => {
        if (!order || isViewOnly) return false

        return isPackagingOrderActionable(
            order.packagingStatus,
            order.orderStatus,
            order.items,
        )
    }, [order, isViewOnly])

    const isAllSelected =
        selectableItemIds.length > 0 &&
        selectableItemIds.every((id) => selectedItemIds.includes(id))

    const fetchDetail = useCallback(
        async (isRefresh = false) => {
            if (!orderId) {
                setLoading(false)
                return
            }

            try {
                if (isRefresh) setRefreshing(true)
                else setLoading(true)

                const response = await packagingService.getOrderDetail(orderId)
                const nextOrder = response.data || null

                setOrder(nextOrder)
                setSelectedItemIds(
                    filterSelectablePackagingItemIds(nextOrder?.items, "packing"),
                )
            } catch (error: any) {
                showError(
                    getFriendlyPackagingErrorMessage(
                        error,
                        "Không tải được chi tiết đơn."
                    )
                )
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        },
        [orderId]
    )

    useEffect(() => {
        void fetchDetail()
    }, [fetchDetail])

    const toggleItem = (itemId: string) => {
        if (!selectableItemIds.includes(itemId)) return

        setSelectedItemIds((current) => {
            if (current.includes(itemId)) {
                return current.filter((id) => id !== itemId)
            }

            return [...current, itemId]
        })
    }

    const toggleAllItems = () => {
        setSelectedItemIds(isAllSelected ? [] : selectableItemIds)
    }

    const handlePackage = async () => {
        if (!orderId) return

        if (selectedItemIds.length === 0) {
            showError("Chọn ít nhất một món để hoàn tất đóng gói.")
            return
        }

        try {
            setSubmitting(true)

            const response = await packagingService.packageOrder(orderId, {
                orderItemIds: selectedItemIds,
                notes: buildActionNotes({
                    actionLabel: "Hoàn tất đóng gói",
                    userNote: notes,
                }),
            })

            const nextOrder = response.data || null
            setOrder(nextOrder)
            showSuccess(response.message || "Hoàn tất đóng gói thành công.")
            setNotes("")

            await fetchDetail(true)

            if (
                nextOrder &&
                isPackagingOrderCompleted(
                    nextOrder.packagingStatus,
                    nextOrder.orderStatus,
                    nextOrder.items,
                )
            ) {
                setPrintModalOpen(true)
            }
        } catch (error: any) {
            showError(
                getFriendlyPackagingErrorMessage(
                    error,
                    "Không thể hoàn tất đóng gói."
                )
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleFailPackaging = async () => {
        if (!orderId) return

        const reason = failureReason.trim()

        if (!reason) {
            showError("Nhập lý do lỗi trước khi báo lỗi đóng gói.")
            return
        }

        if (selectedItemIds.length === 0) {
            showError("Chọn ít nhất một món bị lỗi.")
            return
        }

        try {
            setFailing(true)

            const response = await packagingService.failPackaging(orderId, {
                orderItemIds: selectedItemIds,
                failureReason: reason,
                notes: buildActionNotes({
                    actionLabel: "Ghi nhận lỗi đóng gói",
                    userNote: failNotes,
                }),
            })

            setOrder(response.data)
            showSuccess(response.message || "Đã ghi nhận lỗi đóng gói.")
            setFailureReason("")
            setFailNotes("")
            await fetchDetail(true)
        } catch (error: any) {
            showError(
                getFriendlyPackagingErrorMessage(
                    error,
                    "Không thể ghi nhận lỗi đóng gói."
                )
            )
        } finally {
            setFailing(false)
        }
    }

    if (!orderId) {
        return (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-semibold text-slate-900">
                    Chưa chọn đơn hàng
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Hãy chọn một đơn từ danh sách để thực hiện bước đóng gói.
                </p>

                <button
                    type="button"
                    onClick={() => navigate("/package/orders")}
                    className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                >
                    Quay về danh sách đơn
                </button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang tải thông tin đóng gói...</span>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-semibold text-slate-900">
                    Không tìm thấy đơn
                </h1>

                <button
                    type="button"
                    onClick={() => navigate("/package/orders")}
                    className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                >
                    Quay về danh sách đơn
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <button
                    type="button"
                    onClick={() => navigate("/package/orders")}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại danh sách
                </button>

                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                            <PackageCheck className="h-3.5 w-3.5" />
                            Bước 2 · Kiểm tra & đóng gói
                        </div>

                        <h1 className="mt-3 text-2xl font-semibold text-slate-900 lg:text-3xl">
                            Đóng gói đơn {order.orderCode}
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Kiểm lại món đã gom, chọn đúng món được đóng gói. Nếu thiếu hàng,
                            sai hàng hoặc hư hỏng, chọn món đó và báo lỗi riêng.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span
                            className={cn(
                                "rounded-full px-3 py-1 text-xs font-medium",
                                getPackagingStatusClass(order.packagingStatus)
                            )}
                        >
                            {getPackagingStatusLabel(order.packagingStatus)}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {getOrderStatusLabel(order.orderStatus)}
                        </span>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <UserRound className="h-3.5 w-3.5" />
                            Khách hàng
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-slate-900">
                            {order.customerName || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                        <div className="flex items-center gap-2 text-xs text-emerald-600">
                            <PackageCheck className="h-3.5 w-3.5" />
                            Đã chọn
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {selectedItemIds.length}/{selectableItemIds.length} món
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
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Thành tiền
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {currency.format(order.finalAmount || 0)}
                        </p>
                    </div>
                </div>
            </div>

            {orderPartiallyPackaged && canPerformActions ? (
                <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                            <h2 className="font-semibold text-amber-900">
                                Đóng gói một phần
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-amber-800">
                                {order?.packagingStatus ||
                                    "Một số dòng đã xong, còn dòng chưa đóng gói. Tiếp tục xử lý các món còn lại trước khi đơn sẵn sàng giao."}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            {!canPerformActions && orderCompleted ? (
                <div className="space-y-4">
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                            <div>
                                <h2 className="font-semibold text-emerald-800">
                                    Đã hoàn tất đóng gói
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-emerald-700">
                                    {order.packagingStatus ||
                                        "Đơn đã sẵn sàng bàn giao. In tem đơn rồi dán lên túi/kiện trước khi bàn giao."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <PackagingLabelPrintSection order={order} />
                </div>
            ) : null}

            {failedItems.length > 0 && canPerformActions ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
                    <div className="flex gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                        <div>
                            <h2 className="font-semibold text-rose-800">
                                Đơn này có món đã được báo lỗi
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-rose-700">
                                Kiểm tra lại trước khi bàn giao. Nếu lỗi đã được xử lý, chọn lại món
                                và hoàn tất đóng gói.
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            <PackagingActivitySection
                logs={order?.activityLogs}
                className="mb-4"
            />

            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Checklist kiểm tra cuối
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Đã chọn {selectedItemIds.length}/
                                {selectableItemIds.length} món cần đóng gói
                                {allItemIds.length > selectableItemIds.length
                                    ? ` (${allItemIds.length - selectableItemIds.length} món đã xử lý)`
                                    : ""}{" "}
                                · {selectedQuantity}/{totalQuantity} sản phẩm
                            </p>
                        </div>

                        {canPerformActions && selectableItemIds.length > 0 ? (
                            <button
                                type="button"
                                onClick={toggleAllItems}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </button>
                        ) : null}
                    </div>

                    <div className="divide-y divide-slate-100">
                        {order.items?.map((item, index) => {
                            const checked = selectedItemIds.includes(item.orderItemId)
                            const selectable = isPackagingLineSelectableForPacking(
                                item.packagingStatus,
                            )
                            const rowInteractive = canPerformActions && selectable
                            const hasFailedReason = Boolean(
                                item.packagingFailedReason?.trim()
                            )
                            const expiryDate = getItemExpiryDate(item)

                            const RowTag = rowInteractive ? "label" : "div"

                            return (
                                <RowTag
                                    key={item.orderItemId}
                                    className={cn(
                                        "flex gap-4 px-5 py-4 transition",
                                        rowInteractive &&
                                            "cursor-pointer hover:bg-slate-50",
                                        checked && rowInteractive && "bg-emerald-50/50",
                                        hasFailedReason && "bg-rose-50/60",
                                        canPerformActions &&
                                            !selectable &&
                                            "bg-slate-50/80 opacity-75",
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={!rowInteractive}
                                        onChange={() => toggleItem(item.orderItemId)}
                                        className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                        Món #{index + 1}
                                                    </span>

                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                                                            getExpiryToneClass(expiryDate)
                                                        )}
                                                    >
                                                        <CalendarDays className="h-3.5 w-3.5" />
                                                        HSD: {formatDateOnly(expiryDate)}
                                                    </span>

                                                    <span
                                                        className={cn(
                                                            "rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                                                            getExpiryToneClass(expiryDate)
                                                        )}
                                                    >
                                                        {getExpiryText(expiryDate)}
                                                    </span>
                                                </div>

                                                <h3 className="mt-2 text-base font-semibold text-slate-900">
                                                    {item.productName || "--"}
                                                </h3>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                                        Số lượng:{" "}
                                                        {formatPackagingItemQuantityLabel(item)}
                                                    </span>

                                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                                        Đơn giá:{" "}
                                                        {currency.format(item.unitPrice || 0)}
                                                    </span>

                                                    <span
                                                        className={cn(
                                                            "rounded-full px-3 py-1 text-xs font-medium",
                                                            getPackagingStatusClass(
                                                                item.packagingStatus
                                                            )
                                                        )}
                                                    >
                                                        {getPackagingStatusLabel(
                                                            item.packagingStatus
                                                        )}
                                                    </span>

                                                    {item.packagedAt ? (
                                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                                                            Đã xử lý:{" "}
                                                            {formatDateTime(item.packagedAt)}
                                                        </span>
                                                    ) : null}

                                                    {item.packagingFailedReason ? (
                                                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-100">
                                                            Lỗi: {item.packagingFailedReason}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="shrink-0 rounded-2xl bg-slate-50 px-4 py-3 text-left lg:min-w-[140px] lg:text-right">
                                                <p className="text-xs font-medium text-slate-500">
                                                    Thành tiền
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {currency.format(item.subTotal || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </RowTag>
                            )
                        })}
                    </div>
                </div>

                <aside className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                <ClipboardCheck className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Tóm tắt đóng gói
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Đơn đặt: {formatDateTime(order.orderDate)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Món đã chọn</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">
                                    {selectedItemIds.length}/{selectableItemIds.length}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Số lượng</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">
                                    {selectedQuantity}/{totalQuantity}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Giá trị đã chọn</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">
                                    {currency.format(selectedTotal)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {canPerformActions ? (
                        <>
                            <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                        <PackageCheck className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Hoàn tất đóng gói
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            Dùng khi các món đã đúng và sẵn sàng bàn giao.
                                        </p>
                                    </div>
                                </div>

                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Ví dụ: đã kiểm đủ món, đóng 2 túi..."
                                    className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                                />

                                <button
                                    type="button"
                                    onClick={handlePackage}
                                    disabled={
                                        submitting || selectedItemIds.length === 0
                                    }
                                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    Hoàn tất đóng gói
                                </button>
                            </div>

                            <div className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-100">
                                        <XCircle className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            Báo lỗi món đã chọn
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            Dùng khi thiếu hàng, sai hàng hoặc hàng hư hỏng.
                                        </p>
                                    </div>
                                </div>

                                <input
                                    value={failureReason}
                                    onChange={(e) => setFailureReason(e.target.value)}
                                    placeholder="Lý do lỗi, ví dụ: thiếu hàng / hàng hỏng"
                                    className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400"
                                />

                                <textarea
                                    value={failNotes}
                                    onChange={(e) => setFailNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Ghi chú thêm nếu cần..."
                                    className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400"
                                />

                                <button
                                    type="button"
                                    onClick={handleFailPackaging}
                                    disabled={
                                        failing || selectedItemIds.length === 0
                                    }
                                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {failing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4" />
                                    )}
                                    Báo lỗi các món đã chọn
                                </button>
                            </div>
                        </>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => void fetchDetail(true)}
                        disabled={refreshing}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCcw
                            className={cn("h-4 w-4", refreshing && "animate-spin")}
                        />
                        Tải lại dữ liệu
                    </button>
                </aside>
            </div>

            <PackagingLabelPrintModal
                open={printModalOpen}
                order={order}
                onClose={() => setPrintModalOpen(false)}
            />
        </div>
    )
}

export default PackagePacking

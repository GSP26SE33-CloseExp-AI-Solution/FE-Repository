import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    Clock3,
    Loader2,
    Package,
    PackageOpen,
    ScanSearch,
    UserRound,
} from "lucide-react"

import { packagingService } from "@/services/packaging.service"
import type { PackagingOrderDetail } from "@/types/packaging.type"
import { showError, showSuccess } from "@/utils/toast"

import {
    cn,
    currency,
    formatDateTime,
    getDeliveryTypeLabel,
    getFriendlyPackagingErrorMessage,
    getOrderStatusLabel,
    getPackagingStatusClass,
    getPackagingStatusLabel,
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

const PackageCollect = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get("orderId") || ""

    const [order, setOrder] = useState<PackagingOrderDetail | null>(null)
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [confirming, setConfirming] = useState(false)
    const [collecting, setCollecting] = useState(false)
    const [confirmNotes, setConfirmNotes] = useState("")
    const [collectNotes, setCollectNotes] = useState("")

    const allItemIds = useMemo(
        () => order?.items?.map((item) => item.orderItemId).filter(Boolean) || [],
        [order]
    )

    const totalQuantity = useMemo(() => {
        return order?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
    }, [order])

    const selectedQuantity = useMemo(() => {
        if (!order) return 0

        return order.items
            .filter((item) => selectedItemIds.includes(item.orderItemId))
            .reduce((sum, item) => sum + (item.quantity || 0), 0)
    }, [order, selectedItemIds])

    const selectedTotal = useMemo(() => {
        if (!order) return 0

        return order.items
            .filter((item) => selectedItemIds.includes(item.orderItemId))
            .reduce((sum, item) => sum + (item.subTotal || 0), 0)
    }, [order, selectedItemIds])

    const isAllSelected = allItemIds.length > 0 && selectedItemIds.length === allItemIds.length

    const fetchDetail = useCallback(async () => {
        if (!orderId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await packagingService.getOrderDetail(orderId)
            const nextOrder = response.data || null

            setOrder(nextOrder)
            setSelectedItemIds(
                nextOrder?.items?.map((item) => item.orderItemId).filter(Boolean) || []
            )
        } catch (error: any) {
            showError(getFriendlyPackagingErrorMessage(error, "Không tải được chi tiết đơn."))
        } finally {
            setLoading(false)
        }
    }, [orderId])

    useEffect(() => {
        void fetchDetail()
    }, [fetchDetail])

    const toggleItem = (itemId: string) => {
        setSelectedItemIds((current) => {
            if (current.includes(itemId)) {
                return current.filter((id) => id !== itemId)
            }

            return [...current, itemId]
        })
    }

    const toggleAllItems = () => {
        setSelectedItemIds(isAllSelected ? [] : allItemIds)
    }

    const buildSelectedPayload = ({
        actionLabel,
        userNote,
    }: {
        actionLabel: string
        userNote?: string
    }) => ({
        orderItemIds: selectedItemIds,
        notes: buildActionNotes({
            actionLabel,
            userNote,
        }),
    })

    const handleConfirm = async () => {
        if (!orderId) return

        if (selectedItemIds.length === 0) {
            showError("Vui lòng chọn ít nhất một sản phẩm trước khi xác nhận.")
            return
        }

        try {
            setConfirming(true)
            const response = await packagingService.confirmOrder(
                orderId,
                buildSelectedPayload({
                    actionLabel: "Thời gian bắt đầu xử lý",
                    userNote: confirmNotes,
                })
            )

            showSuccess(response.message || "Xác nhận bắt đầu đóng gói thành công.")
            await fetchDetail()
        } catch (error: any) {
            showError(getFriendlyPackagingErrorMessage(error, "Không thể xác nhận đơn."))
        } finally {
            setConfirming(false)
        }
    }

    const handleCollect = async () => {
        if (!orderId) return

        if (selectedItemIds.length === 0) {
            showError("Vui lòng chọn ít nhất một sản phẩm cần thu gom.")
            return
        }

        try {
            setCollecting(true)
            const response = await packagingService.collectOrder(
                orderId,
                buildSelectedPayload({
                    actionLabel: "Thời gian hoàn tất thu gom",
                    userNote: collectNotes,
                })
            )

            showSuccess(response.message || "Đã cập nhật bước thu gom.")
            await fetchDetail()
        } catch (error: any) {
            showError(getFriendlyPackagingErrorMessage(error, "Không thể cập nhật bước thu gom."))
        } finally {
            setCollecting(false)
        }
    }

    if (!orderId) {
        return (
            <div className="rounded-[28px] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-bold text-slate-900">Chưa chọn đơn hàng</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Hãy vào danh sách đơn chờ đóng gói và chọn một đơn để thao tác.
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
            <div className="flex min-h-[320px] items-center justify-center rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang tải chi tiết đơn hàng...</span>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="rounded-[28px] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-bold text-slate-900">Không tìm thấy đơn</h1>
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
            <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <button
                    type="button"
                    onClick={() => navigate("/package/orders")}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại danh sách
                </button>

                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white">
                                Bước 1 · Thu gom
                            </span>

                            <span
                                className={cn(
                                    "rounded-full px-3 py-1 text-xs font-semibold",
                                    getPackagingStatusClass(order.packagingStatus)
                                )}
                            >
                                {getPackagingStatusLabel(order.packagingStatus)}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {getOrderStatusLabel(order.orderStatus)}
                            </span>
                        </div>

                        <h1 className="mt-3 text-2xl font-bold text-slate-900">
                            {order.orderCode}
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Chọn sản phẩm cần xử lý, xác nhận bắt đầu rồi hoàn tất thu gom.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[560px]">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Khách hàng</p>
                            <p className="mt-1 truncate text-sm font-bold text-slate-900">
                                {order.customerName || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
                            <p className="text-xs text-sky-600">Khung giờ</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {order.timeSlotDisplay || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Số lượng</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {totalQuantity}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Giá trị</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {currency.format(order.finalAmount || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <div className="space-y-5">
                    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                                <ClipboardList className="h-5 w-5 text-sky-600" />
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Thông tin đơn
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Kiểm tra nhanh trước khi thu gom.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] text-slate-500">Giao nhận</p>
                                    <p className="mt-1 text-xs font-semibold text-slate-900">
                                        {getDeliveryTypeLabel(order.deliveryType)}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] text-slate-500">Ngày đặt</p>
                                    <p className="mt-1 text-xs font-semibold text-slate-900">
                                        {formatDateTime(order.orderDate)}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                    <p className="text-[11px] text-slate-500">Cập nhật</p>
                                    <p className="mt-1 text-xs font-semibold text-slate-900">
                                        {formatDateTime(order.lastPackagedAt ?? undefined)}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-sky-50 px-3 py-2 ring-1 ring-sky-100">
                                    <p className="text-[11px] text-sky-600">Đã chọn</p>
                                    <p className="mt-1 text-xs font-bold text-slate-900">
                                        {selectedItemIds.length}/{allItemIds.length} dòng · SL {selectedQuantity}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <PackageOpen className="h-5 w-5 text-sky-600" />
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Sản phẩm cần thu gom
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Tên sản phẩm và số lượng cần lấy.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={toggleAllItems}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </button>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                            <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                                <div className="col-span-6">Sản phẩm</div>
                                <div className="col-span-2 text-center">SL</div>
                                <div className="col-span-2 text-right">Giá</div>
                                <div className="col-span-2 text-right">Trạng thái</div>
                            </div>

                            {order.items.map((item) => {
                                const checked = selectedItemIds.includes(item.orderItemId)

                                return (
                                    <button
                                        key={item.orderItemId}
                                        type="button"
                                        onClick={() => toggleItem(item.orderItemId)}
                                        className={cn(
                                            "grid w-full grid-cols-12 items-center border-t border-slate-100 px-4 py-3 text-left text-sm transition",
                                            checked ? "bg-sky-50/70" : "bg-white hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="col-span-6 flex min-w-0 items-center gap-3">
                                            <div
                                                className={cn(
                                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                                                    checked
                                                        ? "border-sky-600 bg-sky-600 text-white"
                                                        : "border-slate-300 bg-white text-transparent"
                                                )}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-900">
                                                    {item.productName}
                                                </p>
                                                {item.packagingFailedReason ? (
                                                    <p className="mt-0.5 truncate text-xs text-rose-600">
                                                        Lỗi: {item.packagingFailedReason}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="col-span-2 text-center">
                                            <span className="inline-flex min-w-10 justify-center rounded-xl bg-white px-3 py-1 text-sm font-black text-slate-900 ring-1 ring-slate-200">
                                                {item.quantity}
                                            </span>
                                        </div>

                                        <div className="col-span-2 text-right text-sm font-semibold text-slate-700">
                                            {currency.format(item.subTotal || 0)}
                                        </div>

                                        <div className="col-span-2 text-right">
                                            <span
                                                className={cn(
                                                    "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                                    getPackagingStatusClass(item.packagingStatus)
                                                )}
                                            >
                                                {getPackagingStatusLabel(item.packagingStatus)}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-50 text-sky-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Xác nhận bắt đầu
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Gửi tín hiệu bắt đầu xử lý kèm thời gian hiện tại.
                                </p>
                            </div>
                        </div>

                        <textarea
                            value={confirmNotes}
                            onChange={(e) => setConfirmNotes(e.target.value)}
                            rows={3}
                            placeholder="Ghi chú nếu có..."
                            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                        />

                        <button
                            type="button"
                            onClick={() => void handleConfirm()}
                            disabled={confirming || collecting || selectedItemIds.length === 0}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {confirming ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang xác nhận...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Xác nhận bắt đầu
                                </>
                            )}
                        </button>
                    </div>

                    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <ScanSearch className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Hoàn tất thu gom
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Xác nhận đã lấy đủ hàng kèm thời gian hiện tại.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Đang chọn</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {selectedItemIds.length} dòng · {selectedQuantity} sản phẩm
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                {currency.format(selectedTotal)}
                            </p>
                        </div>

                        <textarea
                            value={collectNotes}
                            onChange={(e) => setCollectNotes(e.target.value)}
                            rows={4}
                            placeholder="Ghi chú thu gom..."
                            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                        />

                        <button
                            type="button"
                            onClick={() => void handleCollect()}
                            disabled={collecting || confirming || selectedItemIds.length === 0}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {collecting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang cập nhật...
                                </>
                            ) : (
                                <>
                                    <Package className="h-4 w-4" />
                                    Hoàn tất thu gom
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate(`/package/packing?orderId=${order.orderId}`)}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Sang bước đóng gói
                        </button>
                    </div>

                    <div className="rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm ring-1 ring-sky-100">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-100">
                                <UserRound className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="text-base font-bold text-slate-900">Người xử lý</h2>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    Thông tin thao tác thu gom đơn hàng.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3 text-sm">
                            <div className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">
                                <p className="text-xs text-slate-500">Nhân viên</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {order.packagingStaffName || "--"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">
                                <p className="text-xs text-slate-500">Khung giờ</p>
                                <div className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
                                    <Clock3 className="h-4 w-4 text-sky-600" />
                                    <span>{order.timeSlotDisplay || "--"}</span>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">
                                <p className="text-xs text-slate-500">Mã đơn</p>
                                <p className="mt-1 break-all font-semibold text-slate-900">
                                    {order.orderId || "--"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PackageCollect

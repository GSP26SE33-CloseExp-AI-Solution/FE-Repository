import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock3,
    Loader2,
    PackageOpen,
    RefreshCcw,
    ShoppingBag,
    Store,
    Truck,
    UserRound,
} from "lucide-react"

import { packagingService } from "@/services/packaging.service"
import type { PackagingOrderDetail } from "@/types/packaging.type"
import { showError, showSuccess } from "@/utils/toast"

import {
    buildPackagingActionNotes,
    cn,
    currency,
    formatDate,
    formatDateTime,
    getDeliveryTypeLabel,
    getExpiryText,
    getExpiryToneClass,
    getFriendlyPackagingErrorMessage,
    getOrderStatusLabel,
    countPackagingOrderLines,
    filterSelectablePackagingItemIds,
    formatPackagingItemQuantityLabel,
    getPackagingItemMeta,
    getPackagingStatusClass,
    getPackagingStatusLabel,
    isPackagingLineSelectableForCollect,
} from "./packagingShared"
import PackagingActivitySection from "./PackagingActivitySection"

const PackageCollect = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get("orderId") || ""

    const [order, setOrder] = useState<PackagingOrderDetail | null>(null)
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [collecting, setCollecting] = useState(false)
    const [confirmNotes, setConfirmNotes] = useState("")
    const [collectNotes, setCollectNotes] = useState("")
    const [hasStartedCollecting, setHasStartedCollecting] = useState(false)
    const [startedCollectNote, setStartedCollectNote] = useState("")

    const allItemIds = useMemo(
        () => order?.items?.map((item) => item.orderItemId).filter(Boolean) || [],
        [order],
    )

    const selectableItemIds = useMemo(
        () => filterSelectablePackagingItemIds(order?.items, "collect"),
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

    const supermarketNames = useMemo(() => {
        const names =
            order?.items
                ?.map((item) => item.supermarketName?.trim())
                .filter((name): name is string => Boolean(name)) || []

        return Array.from(new Set(names))
    }, [order])

    const primarySupermarketName = useMemo(() => {
        if (supermarketNames.length === 0) return "--"
        if (supermarketNames.length === 1) return supermarketNames[0]

        return `${supermarketNames.length} siêu thị`
    }, [supermarketNames])

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
                    filterSelectablePackagingItemIds(nextOrder?.items, "collect"),
                )
                setHasStartedCollecting(false)
                setStartedCollectNote("")
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

    const buildSelectedPayload = ({
        actionLabel,
        userNote,
    }: {
        actionLabel: string
        userNote?: string
    }) => ({
        orderItemIds: selectedItemIds,
        notes: buildPackagingActionNotes({
            actionLabel,
            userNote,
        }),
    })

    const handleConfirm = async () => {
        if (!orderId) return

        if (selectedItemIds.length === 0) {
            showError("Chọn ít nhất một món trước khi bắt đầu gom hàng.")
            return
        }

        try {
            setConfirming(true)

            const response = await packagingService.confirmOrder(
                orderId,
                buildSelectedPayload({
                    actionLabel: "Bắt đầu gom hàng",
                    userNote: confirmNotes,
                })
            )

            showSuccess(response.message || "Đã ghi nhận bắt đầu gom hàng.")

            const savedNote = confirmNotes.trim()

            setConfirmNotes("")
            await fetchDetail(true)

            setHasStartedCollecting(true)
            setStartedCollectNote(savedNote)
        } catch (error: any) {
            showError(
                getFriendlyPackagingErrorMessage(
                    error,
                    "Không thể ghi nhận bắt đầu gom hàng."
                )
            )
        } finally {
            setConfirming(false)
        }
    }

    const handleCollect = async () => {
        if (!orderId) return

        if (selectedItemIds.length === 0) {
            showError("Chọn ít nhất một món đã gom được.")
            return
        }

        try {
            setCollecting(true)

            const response = await packagingService.collectOrder(
                orderId,
                buildSelectedPayload({
                    actionLabel: "Hoàn tất gom hàng",
                    userNote: collectNotes,
                })
            )

            showSuccess(response.message || "Đã hoàn tất gom hàng.")
            setCollectNotes("")
            await fetchDetail(true)
            navigate(`/package/packing?orderId=${orderId}`)
        } catch (error: any) {
            showError(
                getFriendlyPackagingErrorMessage(
                    error,
                    "Không thể hoàn tất gom hàng."
                )
            )
        } finally {
            setCollecting(false)
        }
    }

    if (!orderId) {
        return (
            <div className="rounded-[28px] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-bold text-slate-900">
                    Chưa chọn đơn hàng
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Hãy vào danh sách đơn đóng gói và chọn một đơn để gom hàng.
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
                <h1 className="text-xl font-bold text-slate-900">
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
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-sky-50 via-white to-amber-50 p-6">
                    <button
                        type="button"
                        onClick={() => navigate("/package/orders")}
                        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại danh sách
                    </button>

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-sm font-medium tracking-wide text-sky-700">
                                Bước 1 · Gom hàng
                            </p>

                            <h1 className="mt-2 text-2xl font-semibold text-slate-900 lg:text-3xl">
                                Gom hàng cho đơn {order.orderCode}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Tick đúng những món thực tế đã lấy được. Nếu món nào không có hàng,
                                bỏ chọn món đó và ghi chú rõ để xử lý ở bước đóng gói/báo lỗi.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span
                                className={cn(
                                    "rounded-full px-3 py-1 text-xs font-semibold",
                                    getPackagingStatusClass(order.packagingStatus)
                                )}
                            >
                                {getPackagingStatusLabel(order.packagingStatus)}
                            </span>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                {getOrderStatusLabel(order.orderStatus)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 border-t border-slate-100 bg-white p-4 md:grid-cols-5">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <UserRound className="h-3.5 w-3.5" />
                            Khách hàng
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                            {order.customerName || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
                        <div className="flex items-center gap-2 text-xs text-sky-600">
                            <Clock3 className="h-3.5 w-3.5" />
                            Khung giờ
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {order.timeSlotDisplay || "--"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Truck className="h-3.5 w-3.5" />
                            Giao nhận
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {getDeliveryTypeLabel(order.deliveryType)}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                        <div className="flex items-center gap-2 text-xs text-emerald-700">
                            <Store className="h-3.5 w-3.5" />
                            Siêu thị phụ trách
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                            {primarySupermarketName}
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

            <PackagingActivitySection
                logs={order?.activityLogs}
                className="mb-4"
            />

            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Checklist món cần gom
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Đã chọn {selectedItemIds.length}/
                                {selectableItemIds.length} món cần gom
                                {allItemIds.length > selectableItemIds.length
                                    ? ` (${allItemIds.length - selectableItemIds.length} món đã xử lý)`
                                    : ""}{" "}
                                · {selectedQuantity}/{totalQuantity} sản phẩm
                            </p>
                        </div>

                        {selectableItemIds.length > 0 ? (
                            <button
                                type="button"
                                onClick={toggleAllItems}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </button>
                        ) : null}
                    </div>

                    <div className="divide-y divide-slate-100">
                        {order.items?.map((item, index) => {
                            const checked = selectedItemIds.includes(item.orderItemId)
                            const selectable = isPackagingLineSelectableForCollect(
                                item.packagingStatus,
                            )
                            const expiryDate = item.expiryDate
                            const expiryText = getExpiryText(expiryDate)
                            const RowTag = selectable ? "label" : "div"

                            return (
                                <RowTag
                                    key={item.orderItemId}
                                    className={cn(
                                        "flex gap-4 px-5 py-4 transition",
                                        selectable &&
                                            "cursor-pointer hover:bg-slate-50",
                                        checked && selectable && "bg-sky-50/50",
                                        !selectable && "bg-slate-50/80 opacity-75",
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={!selectable}
                                        onChange={() => toggleItem(item.orderItemId)}
                                        className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                        Món #{index + 1}
                                                    </span>

                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                                        <Store className="h-3.5 w-3.5" />
                                                        {item.supermarketName || "Chưa có siêu thị"}
                                                    </span>

                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                                                            getExpiryToneClass(expiryDate)
                                                        )}
                                                    >
                                                        <CalendarDays className="h-3.5 w-3.5" />
                                                        HSD: {formatDate(expiryDate)}
                                                    </span>

                                                    <span
                                                        className={cn(
                                                            "rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                                                            getExpiryToneClass(expiryDate)
                                                        )}
                                                    >
                                                        {expiryText}
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
                                                        Đơn giá: {currency.format(item.unitPrice || 0)}
                                                    </span>

                                                    <span
                                                        className={cn(
                                                            "rounded-full px-3 py-1 text-xs font-medium",
                                                            getPackagingStatusClass(item.packagingStatus)
                                                        )}
                                                    >
                                                        {getPackagingStatusLabel(item.packagingStatus)}
                                                    </span>

                                                    {item.packagingFailedReason ? (
                                                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-100">
                                                            {item.packagingFailedReason}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                                    {getPackagingItemMeta(item).map((meta) => (
                                                        <div
                                                            key={meta.label}
                                                            className={cn(
                                                                "rounded-xl px-3 py-2 ring-1",
                                                                meta.label === "Siêu thị"
                                                                    ? "bg-emerald-50 ring-emerald-100"
                                                                    : "bg-slate-50 ring-slate-100"
                                                            )}
                                                        >
                                                            <p
                                                                className={cn(
                                                                    "text-[11px] font-semibold uppercase tracking-wide",
                                                                    meta.label === "Siêu thị"
                                                                        ? "text-emerald-700"
                                                                        : "text-slate-400"
                                                                )}
                                                            >
                                                                {meta.label}
                                                            </p>
                                                            <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-700">
                                                                {meta.value}
                                                            </p>
                                                        </div>
                                                    ))}
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
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                                <ClipboardList className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Tóm tắt gom hàng
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {formatDateTime(order.orderDate)}
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
                                <p className="text-xs text-slate-500">Số lượng đã gom</p>
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

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                                <PackageOpen className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Thao tác gom hàng
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Làm theo thứ tự từ trên xuống.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-4">
                            {hasStartedCollecting ? (
                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                    <div className="text-sm font-semibold text-emerald-800">
                                        Đã ghi nhận bắt đầu gom
                                    </div>

                                    {startedCollectNote ? (
                                        <div className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-sm leading-6 text-emerald-900">
                                            {startedCollectNote}
                                        </div>
                                    ) : (
                                        <div className="mt-1 text-sm text-emerald-700">
                                            Không có ghi chú bắt đầu gom.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-semibold text-slate-700">
                                        Ghi chú khi bắt đầu gom
                                    </label>
                                    <textarea
                                        value={confirmNotes}
                                        onChange={(e) => setConfirmNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Ví dụ: bắt đầu gom lúc 09:30, ưu tiên hàng lạnh trước..."
                                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                                    />

                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={confirming || selectedItemIds.length === 0}
                                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {confirming ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : null}
                                        Ghi nhận bắt đầu gom
                                    </button>
                                </div>
                            )}

                            {hasStartedCollecting ? (
                                <div>
                                    <label className="text-sm font-semibold text-slate-700">
                                        Ghi chú khi gom xong
                                    </label>
                                    <textarea
                                        value={collectNotes}
                                        onChange={(e) => setCollectNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Ví dụ: thiếu 1 món, đã bỏ chọn khỏi checklist..."
                                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCollect}
                                        disabled={collecting || selectedItemIds.length === 0}
                                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {collecting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        Gom xong, sang đóng gói
                                    </button>
                                </div>
                            ) : null}

                            <button
                                type="button"
                                onClick={() => void fetchDetail(true)}
                                disabled={refreshing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCcw
                                    className={cn(
                                        "h-4 w-4",
                                        refreshing && "animate-spin"
                                    )}
                                />
                                Tải lại dữ liệu
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default PackageCollect

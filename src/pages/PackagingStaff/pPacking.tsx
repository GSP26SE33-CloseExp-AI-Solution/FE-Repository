import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    AlertTriangle,
    ArrowLeft,
    Boxes,
    CheckCheck,
    CheckCircle2,
    Clock3,
    Loader2,
    PackageCheck,
    ReceiptText,
    XCircle,
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

const PackagePacking = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get("orderId") || ""

    const [order, setOrder] = useState<PackagingOrderDetail | null>(null)
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [failing, setFailing] = useState(false)
    const [notes, setNotes] = useState("")
    const [failureReason, setFailureReason] = useState("")
    const [failNotes, setFailNotes] = useState("")

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

    const handlePackage = async () => {
        if (!orderId) return

        if (selectedItemIds.length === 0) {
            showError("Vui lòng chọn ít nhất một sản phẩm để hoàn tất đóng gói.")
            return
        }

        try {
            setSubmitting(true)
            const response = await packagingService.packageOrder(orderId, {
                orderItemIds: selectedItemIds,
                notes: buildActionNotes({
                    actionLabel: "Thời gian hoàn tất đóng gói",
                    userNote: notes,
                }),
            })

            setOrder(response.data)
            showSuccess(response.message || "Hoàn tất đóng gói thành công.")
            await fetchDetail()
        } catch (error: any) {
            showError(getFriendlyPackagingErrorMessage(error, "Không thể hoàn tất đóng gói."))
        } finally {
            setSubmitting(false)
        }
    }

    const handleFailPackaging = async () => {
        if (!orderId) return

        const reason = failureReason.trim()
        if (!reason) {
            showError("Vui lòng nhập lý do đóng gói thất bại.")
            return
        }

        if (selectedItemIds.length === 0) {
            showError("Vui lòng chọn ít nhất một sản phẩm bị lỗi.")
            return
        }

        try {
            setFailing(true)
            const response = await packagingService.failPackaging(orderId, {
                orderItemIds: selectedItemIds,
                failureReason: reason,
                notes: buildActionNotes({
                    actionLabel: "Thời gian ghi nhận đóng gói thất bại",
                    userNote: failNotes,
                }),
            })

            setOrder(response.data)
            showSuccess(response.message || "Đã ghi nhận đóng gói thất bại.")
            setFailureReason("")
            setFailNotes("")
            await fetchDetail()
        } catch (error: any) {
            showError(getFriendlyPackagingErrorMessage(error, "Không thể ghi nhận thất bại."))
        } finally {
            setFailing(false)
        }
    }

    if (!orderId) {
        return (
            <div className="rounded-[28px] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-bold text-slate-900">Chưa chọn đơn hàng</h1>
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
            <div className="flex min-h-[320px] items-center justify-center rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang tải thông tin đóng gói...</span>
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
        <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-sm">
                <button
                    type="button"
                    onClick={() => navigate("/package/orders")}
                    className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại danh sách
                </button>

                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                            Bước 2 · Đóng gói sản phẩm
                        </p>
                        <h1 className="mt-2 text-2xl font-bold text-slate-900 lg:text-3xl">
                            {order.orderCode}
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Kiểm đủ sản phẩm, đúng số lượng, rồi hoàn tất đóng gói hoặc ghi nhận lỗi theo từng dòng hàng.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">Khách hàng</p>
                            <p className="mt-1 truncate text-sm font-bold text-slate-900">
                                {order.customerName || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">Số dòng hàng</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {order.totalItems ?? order.items.length}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">Tổng số lượng</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {totalQuantity}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">Giá trị đơn</p>
                            <p className="mt-1 text-sm font-bold text-emerald-700">
                                {currency.format(order.finalAmount || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
                <div className="space-y-6">
                    <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3">
                            <ReceiptText className="h-5 w-5 text-slate-700" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Tóm tắt đơn hàng
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Thông tin chính để đối soát trước khi niêm phong.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Trạng thái đơn</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {getOrderStatusLabel(order.orderStatus)}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Trạng thái đóng gói</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {getPackagingStatusLabel(order.packagingStatus)}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Khung giờ</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {order.timeSlotDisplay || "--"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Loại giao nhận</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {getDeliveryTypeLabel(order.deliveryType)}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Ngày đặt</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {formatDateTime(order.orderDate)}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                                <p className="text-xs text-emerald-600">Sản phẩm đã chọn</p>
                                <p className="mt-1 font-bold text-slate-900">
                                    {selectedItemIds.length}/{allItemIds.length} dòng · Số lượng {selectedQuantity}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <Boxes className="h-5 w-5 text-emerald-600" />
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Sản phẩm cần đóng gói
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Chọn sản phẩm muốn hoàn tất đóng gói hoặc ghi nhận lỗi. Mỗi dòng hiển thị rõ số lượng cần xử lý.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={toggleAllItems}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </button>
                        </div>

                        <div className="mt-5 space-y-3">
                            {order.items.map((item) => {
                                const checked = selectedItemIds.includes(item.orderItemId)

                                return (
                                    <button
                                        key={item.orderItemId}
                                        type="button"
                                        onClick={() => toggleItem(item.orderItemId)}
                                        className={cn(
                                            "flex w-full items-stretch gap-3 rounded-3xl border p-4 text-left transition",
                                            checked
                                                ? "border-emerald-200 bg-emerald-50/70 ring-1 ring-emerald-100"
                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border",
                                                checked
                                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                                    : "border-slate-300 bg-white text-transparent"
                                            )}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <p className="min-w-0 flex-1 font-bold text-slate-900">
                                                    {item.productName}
                                                </p>

                                                <span
                                                    className={cn(
                                                        "shrink-0 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold sm:self-auto",
                                                        getPackagingStatusClass(item.packagingStatus)
                                                    )}
                                                >
                                                    {getPackagingStatusLabel(item.packagingStatus)}
                                                </span>
                                            </div>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-4">
                                                <div className="rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-slate-100">
                                                    <p className="text-xs text-slate-500">Số lượng đóng gói</p>
                                                    <p className="mt-1 text-lg font-black text-slate-900">
                                                        {item.quantity}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-slate-100">
                                                    <p className="text-xs text-slate-500">Đơn giá</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                                        {currency.format(item.unitPrice || 0)}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-slate-100">
                                                    <p className="text-xs text-slate-500">Thành tiền</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-900">
                                                        {currency.format(item.subTotal || 0)}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-slate-100">
                                                    <p className="text-xs text-slate-500">Đóng gói lúc</p>
                                                    <p className="mt-1 text-xs font-semibold text-slate-900">
                                                        {formatDateTime(item.packagedAt ?? undefined)}
                                                    </p>
                                                </div>
                                            </div>

                                            {item.packagingFailedReason ? (
                                                <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
                                                    Lý do lỗi: {item.packagingFailedReason}
                                                </p>
                                            ) : null}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <PackageCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Bước 3 · Hoàn tất đóng gói
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Gửi xác nhận hoàn tất cho các sản phẩm đã chọn kèm thời gian hiện tại.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Đang chọn</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {selectedItemIds.length} dòng hàng · {selectedQuantity} sản phẩm ·{" "}
                                {currency.format(selectedTotal)}
                            </p>
                        </div>

                        <div className="mt-4 space-y-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
                            <div className="flex gap-2">
                                <CheckCheck className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>Đã kiểm đủ sản phẩm theo số lượng.</span>
                            </div>
                            <div className="flex gap-2">
                                <CheckCheck className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>Bao bì sạch, chắc chắn, sẵn sàng bàn giao.</span>
                            </div>
                        </div>

                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                            placeholder="Ghi chú hoàn tất đóng gói, nếu có..."
                            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                        />

                        <button
                            type="button"
                            onClick={() => void handlePackage()}
                            disabled={submitting || failing || selectedItemIds.length === 0}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang hoàn tất...
                                </>
                            ) : (
                                <>
                                    <CheckCheck className="h-4 w-4" />
                                    Hoàn tất đóng gói
                                </>
                            )}
                        </button>
                    </div>

                    <div className="rounded-[28px] border border-rose-100 bg-rose-50/70 p-6 shadow-sm ring-1 ring-rose-100">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-rose-600 ring-1 ring-rose-100">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-rose-900">
                                    Ghi nhận đóng gói thất bại
                                </h2>
                                <p className="mt-1 text-sm text-rose-800/90">
                                    Dùng khi sản phẩm không thể đóng gói. Vui lòng nhập lý do cụ thể.
                                </p>
                            </div>
                        </div>

                        <textarea
                            value={failureReason}
                            onChange={(e) => setFailureReason(e.target.value)}
                            rows={3}
                            placeholder="Lý do thất bại, ví dụ: thiếu hàng, bao bì hỏng, sản phẩm lỗi..."
                            className="mt-4 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                        />

                        <textarea
                            value={failNotes}
                            onChange={(e) => setFailNotes(e.target.value)}
                            rows={3}
                            placeholder="Ghi chú thêm, nếu có..."
                            className="mt-3 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                        />

                        <button
                            type="button"
                            onClick={() => void handleFailPackaging()}
                            disabled={
                                failing ||
                                submitting ||
                                selectedItemIds.length === 0 ||
                                !failureReason.trim()
                            }
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {failing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4" />
                                    Ghi nhận thất bại
                                </>
                            )}
                        </button>
                    </div>

                    <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-sm ring-1 ring-emerald-100">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                                <Clock3 className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Thông tin xử lý</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Theo dõi nhanh ca xử lý và người phụ trách đơn.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <div className="rounded-2xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium text-slate-500">Khung giờ</p>
                                <p className="mt-1 text-sm font-bold text-slate-900">
                                    {order.timeSlotDisplay || "--"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium text-slate-500">Nhân viên</p>
                                <p className="mt-1 text-sm font-bold text-slate-900">
                                    {order.packagingStaffName || "--"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium text-slate-500">Mã đơn</p>
                                <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                                    {order.orderId || "--"}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-slate-100">
                                <p className="text-xs font-medium text-slate-500">Cập nhật gần nhất</p>
                                <p className="mt-1 text-sm font-bold text-emerald-700">
                                    {formatDateTime(order.lastPackagedAt ?? undefined)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PackagePacking

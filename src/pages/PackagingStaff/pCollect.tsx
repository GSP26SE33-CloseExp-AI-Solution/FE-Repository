import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    Loader2,
    Package,
    ScanSearch,
    UserRound,
} from "lucide-react"

import { packagingService } from "@/services/packaging.service"
import type { PackagingOrderDetail } from "@/types/packaging.type"
import { showError, showSuccess } from "@/utils/toast"

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
})

const formatDateTime = (value?: string) => {
    if (!value) return "--"
    const date = new Date(value)
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

const getFriendlyErrorMessage = (error: any, fallback: string) => {
    const message = error?.response?.data?.message || ""

    if (
        message.includes("expected to affect 1 row") ||
        message.includes("optimistic concurrency")
    ) {
        return "Đơn hàng đã thay đổi trạng thái hoặc không còn khả dụng để xác nhận. Vui lòng tải lại dữ liệu."
    }

    if (message.includes('relation "OrderPackaging" does not exist')) {
        return "Hệ thống đóng gói đang thiếu dữ liệu bảng OrderPackaging ở backend."
    }

    return message || fallback
}

const PackageCollect = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get("orderId") || ""

    const [order, setOrder] = useState<PackagingOrderDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [confirming, setConfirming] = useState(false)
    const [collecting, setCollecting] = useState(false)
    const [confirmNotes, setConfirmNotes] = useState("")
    const [collectNotes, setCollectNotes] = useState("")

    const totalQuantity = useMemo(() => {
        return order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    }, [order])

    const fetchDetail = async () => {
        if (!orderId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await packagingService.getOrderDetail(orderId)
            setOrder(response.data)
        } catch (error: any) {
            showError(getFriendlyErrorMessage(error, "Không tải được chi tiết đơn."))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDetail()
    }, [orderId])

    const handleConfirm = async () => {
        if (!orderId) return

        try {
            setConfirming(true)
            const response = await packagingService.confirmOrder(orderId, {
                notes: confirmNotes.trim() || undefined,
            })

            showSuccess(response.message || "Xác nhận bắt đầu đóng gói thành công.")
            await fetchDetail()
        } catch (error: any) {
            showError(getFriendlyErrorMessage(error, "Không thể xác nhận đơn."))
        } finally {
            setConfirming(false)
        }
    }

    const handleCollect = async () => {
        if (!orderId) return

        try {
            setCollecting(true)
            const response = await packagingService.collectOrder(orderId, {
                notes: collectNotes.trim(),
            })

            showSuccess(response.message || "Đã cập nhật bước thu gom.")
            await fetchDetail()
        } catch (error: any) {
            showError(
                getFriendlyErrorMessage(error, "Không thể cập nhật bước thu gom.")
            )
        } finally {
            setCollecting(false)
        }
    }

    if (!orderId) {
        return (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-bold text-slate-900">Chưa chọn đơn hàng</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Hãy vào danh sách đơn chờ đóng gói và chọn một đơn để thao tác bước thu gom.
                </p>
                <button
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
                    <span>Đang tải chi tiết đơn hàng...</span>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-bold text-slate-900">Không tìm thấy đơn</h1>
                <button
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
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <button
                    onClick={() => navigate("/package/orders")}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại danh sách
                </button>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-sky-600">Bước 1 · Thu gom sản phẩm</p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            {order.orderCode}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Kiểm tra thông tin đơn, xác nhận bắt đầu và cập nhật trạng thái thu gom.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Khách hàng</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {order.customerName}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Tổng món</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {order.totalItems}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Tổng SL</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {totalQuantity}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs text-slate-500">Giá trị đơn</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                                {currency.format(order.finalAmount || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <div className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="h-5 w-5 text-sky-600" />
                            <h2 className="text-lg font-semibold text-slate-900">
                                Thông tin đơn hàng
                            </h2>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Trạng thái đơn</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {order.orderStatus}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Trạng thái đóng gói</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {order.packagingStatus}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Khung giờ</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {order.timeSlotDisplay}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Loại giao nhận</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {order.deliveryType}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Ngày đặt</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {formatDateTime(order.orderDate)}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Cập nhật đóng gói gần nhất</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {formatDateTime(order.lastPackagedAt ?? undefined)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-sky-600" />
                            <h2 className="text-lg font-semibold text-slate-900">
                                Danh sách sản phẩm cần thu gom
                            </h2>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                            <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                <div className="col-span-5">Sản phẩm</div>
                                <div className="col-span-2 text-center">SL</div>
                                <div className="col-span-2 text-right">Đơn giá</div>
                                <div className="col-span-3 text-right">Thành tiền</div>
                            </div>

                            {order.items.map((item) => (
                                <div
                                    key={item.orderItemId}
                                    className="grid grid-cols-12 border-t border-slate-100 px-4 py-4 text-sm"
                                >
                                    <div className="col-span-5 font-medium text-slate-800">
                                        {item.productName}
                                    </div>
                                    <div className="col-span-2 text-center text-slate-600">
                                        {item.quantity}
                                    </div>
                                    <div className="col-span-2 text-right text-slate-600">
                                        {currency.format(item.unitPrice || 0)}
                                    </div>
                                    <div className="col-span-3 text-right font-semibold text-slate-900">
                                        {currency.format(item.subTotal || 0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <h2 className="text-lg font-semibold text-slate-900">
                                Xác nhận bắt đầu
                            </h2>
                        </div>

                        <textarea
                            value={confirmNotes}
                            onChange={(e) => setConfirmNotes(e.target.value)}
                            rows={4}
                            placeholder="Ghi chú trước khi bắt đầu đóng gói (không bắt buộc)"
                            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                        />

                        <button
                            onClick={handleConfirm}
                            disabled={confirming}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {confirming ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang xác nhận...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Xác nhận bắt đầu đóng gói
                                </>
                            )}
                        </button>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3">
                            <ScanSearch className="h-5 w-5 text-sky-600" />
                            <h2 className="text-lg font-semibold text-slate-900">
                                Cập nhật bước thu gom
                            </h2>
                        </div>

                        <textarea
                            value={collectNotes}
                            onChange={(e) => setCollectNotes(e.target.value)}
                            rows={5}
                            placeholder="Bắt buộc: ghi chú thu gom (ví dụ: Đã thu gom đủ sản phẩm, kiểm tra bao bì...)"
                            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                        />

                        <button
                            onClick={handleCollect}
                            disabled={collecting || !collectNotes.trim()}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {collecting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang cập nhật...
                                </>
                            ) : (
                                <>
                                    <Package className="h-4 w-4" />
                                    Hoàn tất bước thu gom
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => navigate(`/package/packing?orderId=${order.orderId}`)}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Sang bước đóng gói
                        </button>
                    </div>

                    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <UserRound className="h-5 w-5 text-slate-300" />
                            <h2 className="text-lg font-semibold">Thông tin nhân viên xử lý</h2>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-slate-200">
                            <div>
                                <span className="text-slate-400">Nhân viên:</span>{" "}
                                <span className="font-medium text-white">
                                    {order.packagingStaffName || "--"}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400">Mã đơn:</span>{" "}
                                <span className="break-all font-medium text-white">
                                    {order.orderId || "--"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PackageCollect

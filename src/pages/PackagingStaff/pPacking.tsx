import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    ArrowLeft,
    Boxes,
    CheckCheck,
    Loader2,
    PackageCheck,
    ReceiptText,
} from "lucide-react"

import { packagingService } from "@/services/packaging.service"
import type { PackagingOrderDetail } from "@/types/packaging.type"
import { showError, showSuccess } from "@/utils/toast"

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
})

const PackagePacking = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const orderId = searchParams.get("orderId") || ""

    const [order, setOrder] = useState<PackagingOrderDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [failing, setFailing] = useState(false)
    const [notes, setNotes] = useState("")
    const [failureReason, setFailureReason] = useState("")
    const [failNotes, setFailNotes] = useState("")

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
            showError(error?.response?.data?.message || "Không tải được chi tiết đơn.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDetail()
    }, [orderId])

    const handlePackage = async () => {
        if (!orderId) return

        try {
            setSubmitting(true)
            const response = await packagingService.packageOrder(orderId, {
                notes: notes.trim() || undefined,
            })
            setOrder(response.data)
            showSuccess(response.message || "Hoàn tất đóng gói thành công.")
        } catch (error: any) {
            showError(error?.response?.data?.message || "Không thể hoàn tất đóng gói.")
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

        try {
            setFailing(true)
            const response = await packagingService.failPackaging(orderId, {
                failureReason: reason,
                notes: failNotes.trim() || undefined,
            })
            setOrder(response.data)
            showSuccess(response.message || "Đã ghi nhận đóng gói thất bại.")
            setFailureReason("")
            setFailNotes("")
        } catch (error: any) {
            showError(error?.response?.data?.message || "Không thể ghi nhận thất bại.")
        } finally {
            setFailing(false)
        }
    }

    if (!orderId) {
        return (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-bold text-slate-900">Chưa chọn đơn hàng</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Hãy chọn một đơn từ danh sách để thực hiện bước đóng gói.
                </p>
                <button
                    onClick={() => navigate("/packaging/orders")}
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
                <h1 className="text-xl font-bold text-slate-900">Không tìm thấy đơn</h1>
                <button
                    onClick={() => navigate("/packaging/orders")}
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
                    onClick={() => navigate("/packaging/orders")}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại danh sách
                </button>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-emerald-600">Bước 2 · Hoàn tất đóng gói</p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            {order.orderCode}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Kiểm tra lại thành phần đơn hàng, bao bì và xác nhận đơn đã sẵn sàng giao.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 px-5 py-4 ring-1 ring-emerald-200">
                        <p className="text-xs text-emerald-700">Tổng giá trị đơn</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-800">
                            {currency.format(order.finalAmount || 0)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <div className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3">
                            <ReceiptText className="h-5 w-5 text-slate-700" />
                            <h2 className="text-lg font-semibold text-slate-900">
                                Tóm tắt đơn hàng
                            </h2>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Khách hàng</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {order.customerName}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Loại giao nhận</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {order.deliveryType}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Tổng món</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {order.totalItems}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Trạng thái đóng gói</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {order.packagingStatus}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3">
                            <Boxes className="h-5 w-5 text-slate-700" />
                            <h2 className="text-lg font-semibold text-slate-900">
                                Kiểm tra sản phẩm trước khi niêm phong
                            </h2>
                        </div>

                        <div className="mt-5 space-y-3">
                            {order.items.map((item) => (
                                <div
                                    key={item.orderItemId}
                                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">{item.productName}</p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Số lượng: {item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">Thành tiền</p>
                                        <p className="font-semibold text-slate-900">
                                            {currency.format(item.subTotal || 0)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-center gap-3">
                            <PackageCheck className="h-5 w-5 text-emerald-600" />
                            <h2 className="text-lg font-semibold text-slate-900">
                                Xác nhận hoàn tất đóng gói
                            </h2>
                        </div>

                        <ul className="mt-4 space-y-2 text-sm text-slate-600">
                            <li>• Đã kiểm đủ sản phẩm theo đơn</li>
                            <li>• Bao bì còn nguyên vẹn, sạch, chắc chắn</li>
                            <li>• Sẵn sàng bàn giao sang bước giao hàng / nhận hàng</li>
                        </ul>

                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                            placeholder="Ghi chú hoàn tất đóng gói (không bắt buộc)"
                            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                        />

                        <button
                            onClick={handlePackage}
                            disabled={submitting || failing}
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

                    <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-6 shadow-sm ring-1 ring-rose-100">
                        <h2 className="text-lg font-semibold text-rose-900">
                            Ghi nhận đóng gói thất bại
                        </h2>
                        <p className="mt-2 text-sm text-rose-800/90">
                            Dùng khi không thể hoàn tất đóng gói theo yêu cầu. Lý do được gửi lên server
                            theo API <span className="font-mono text-xs">POST .../fail</span>.
                        </p>
                        <textarea
                            value={failureReason}
                            onChange={(e) => setFailureReason(e.target.value)}
                            rows={3}
                            placeholder="Lý do thất bại (bắt buộc)"
                            className="mt-4 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                        />
                        <textarea
                            value={failNotes}
                            onChange={(e) => setFailNotes(e.target.value)}
                            rows={3}
                            placeholder="Ghi chú thêm (không bắt buộc)"
                            className="mt-3 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                        />
                        <button
                            type="button"
                            onClick={() => void handleFailPackaging()}
                            disabled={failing || submitting || !failureReason.trim()}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {failing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                "Ghi nhận thất bại"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PackagePacking

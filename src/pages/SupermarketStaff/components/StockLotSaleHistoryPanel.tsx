import React, { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, History, Loader2 } from "lucide-react"

import { productLotService } from "@/services/product-lot.service"
import type { StockLotSaleHistoryResponse } from "@/types/product-lot.type"
import { getOrderStatusLabel } from "@/pages/PackagingStaff/packagingShared"

type Props = {
    lotId: string
}

const formatPrice = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—"
    return `${value.toLocaleString("vi-VN")} đ`
}

const formatDateTime = (value?: string | null) => {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleString("vi-VN")
}

const formatUnitLabel = (name?: string | null, symbol?: string | null) => {
    const safeName = name?.trim()
    const safeSymbol = symbol?.trim()
    if (!safeName) return "—"
    return safeSymbol ? `${safeName} (${safeSymbol})` : safeName
}

const formatQuantity = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—"
    return Number.isInteger(value) ? String(value) : value.toLocaleString("vi-VN")
}

const getOrderStatusClass = (status?: string) => {
    const key = (status || "").trim().toLowerCase()
    if (key === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-800"
    if (key === "paid" || key === "readytoship") return "border-sky-200 bg-sky-50 text-sky-800"
    if (key === "deliveredwaitconfirm") return "border-indigo-200 bg-indigo-50 text-indigo-800"
    if (key === "pending") return "border-amber-200 bg-amber-50 text-amber-800"
    if (key === "canceled" || key === "failed") return "border-rose-200 bg-rose-50 text-rose-800"
    if (key === "refunded") return "border-violet-200 bg-violet-50 text-violet-800"
    return "border-slate-200 bg-slate-50 text-slate-700"
}

export const StockLotSaleHistoryPanel: React.FC<Props> = ({ lotId }) => {
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [history, setHistory] = useState<StockLotSaleHistoryResponse | null>(null)

    const pageSize = history?.pageSize ?? 10
    const totalPages = useMemo(() => {
        const total = history?.totalResult ?? 0
        return Math.max(1, Math.ceil(total / pageSize))
    }, [history?.totalResult, pageSize])

    useEffect(() => {
        setPage(1)
    }, [lotId])

    useEffect(() => {
        let cancelled = false

        const loadHistory = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await productLotService.getLotSalesHistory(lotId, page, 10)
                if (!cancelled) setHistory(data)
            } catch (loadError) {
                if (!cancelled) {
                    setHistory(null)
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Không tải được lịch sử bán",
                    )
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void loadHistory()

        return () => {
            cancelled = true
        }
    }, [lotId, page])

    const summary = history?.summary
    const items = history?.items ?? []

    return (
        <div className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <History className="h-4 w-4 text-slate-600" />
                Lịch sử bán ra
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">
                Các đơn hàng đã đặt từ lô này. Số liệu tổng chỉ tính đơn đã thanh toán trở đi.
            </p>

            {loading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải lịch sử bán...
                </div>
            ) : error ? (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                </p>
            ) : (
                <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                Đơn đã thanh toán
                            </div>
                            <div className="mt-1 text-lg font-semibold text-slate-900">
                                {summary?.confirmedOrderCount ?? 0}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                Đã bán (đơn vị lô)
                            </div>
                            <div className="mt-1 text-lg font-semibold text-slate-900">
                                {formatQuantity(summary?.totalQuantityInLotUnit)}
                                {summary?.lotUnitName ? (
                                    <span className="ml-1 text-sm font-medium text-slate-600">
                                        {formatUnitLabel(summary.lotUnitName, summary.lotUnitSymbol)}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                Doanh thu
                            </div>
                            <div className="mt-1 text-lg font-semibold text-slate-900">
                                {formatPrice(summary?.totalRevenue)}
                            </div>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                            Lô hàng chưa có đơn bán nào.
                        </p>
                    ) : (
                        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2.5 font-semibold">Mã đơn</th>
                                        <th className="px-3 py-2.5 font-semibold">Ngày đặt</th>
                                        <th className="px-3 py-2.5 font-semibold">Khách hàng</th>
                                        <th className="px-3 py-2.5 font-semibold">Số lượng</th>
                                        <th className="px-3 py-2.5 font-semibold">Quy đổi lô</th>
                                        <th className="px-3 py-2.5 font-semibold">Thành tiền</th>
                                        <th className="px-3 py-2.5 font-semibold">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <tr key={item.orderItemId} className="bg-white">
                                            <td className="px-3 py-3 font-medium text-slate-900">
                                                {item.orderCode || "—"}
                                            </td>
                                            <td className="px-3 py-3 text-slate-700">
                                                {formatDateTime(item.orderDate)}
                                            </td>
                                            <td className="px-3 py-3 text-slate-700">
                                                {item.customerName || "—"}
                                            </td>
                                            <td className="px-3 py-3 text-slate-700">
                                                {formatQuantity(item.quantity)}{" "}
                                                <span className="text-xs text-slate-500">
                                                    {formatUnitLabel(
                                                        item.purchaseUnitName,
                                                        item.purchaseUnitSymbol,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-slate-700">
                                                {formatQuantity(item.quantityInLotUnit)}
                                            </td>
                                            <td className="px-3 py-3 font-medium text-slate-900">
                                                {formatPrice(item.totalPrice)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getOrderStatusClass(item.orderStatus)}`}
                                                >
                                                    {item.orderStatusText ||
                                                        getOrderStatusLabel(item.orderStatus)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {(history?.totalResult ?? 0) > pageSize ? (
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-500">
                                Trang {page}/{totalPages} · {history?.totalResult ?? 0} dòng
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={page <= 1 || loading}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Trước
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((current) => Math.min(totalPages, current + 1))
                                    }
                                    disabled={page >= totalPages || loading}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
                                >
                                    Sau
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    )
}

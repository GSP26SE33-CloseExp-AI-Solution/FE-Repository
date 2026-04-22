import { AlertTriangle, ArrowUpDown, Clock3 } from "lucide-react"

import type { AdminDashboardOverview, SlaAlertItem } from "@/types/admin.type"
import {
    formatCompactNumber,
    formatDateTime,
    formatDurationFromMinutes,
    formatOrderCode,
    getStatusClass,
    mapDeliveryTypeLabel,
    mapOrderStatusLabel,
} from "./adminDashboard.utils"

type Props = {
    overview: AdminDashboardOverview | null
    slaAlerts: SlaAlertItem[]
    slaSort: "late-desc" | "late-asc" | "date-desc" | "date-asc"
    onChangeSort: (
        value: "late-desc" | "late-asc" | "date-desc" | "date-asc"
    ) => void
}

const DashboardSlaPanel = ({
    overview,
    slaAlerts,
    slaSort,
    onChangeSort,
}: Props) => {
    const breachedCount = overview?.slaBreachedOrders ?? 0

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-slate-900">
                            Cảnh báo SLA
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Những đơn hàng đang chậm xử lý và cần ưu tiên theo dõi.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-2.5 ring-1 ring-amber-200">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                            Đơn vượt SLA
                        </p>
                        <p className="mt-2 text-2xl font-bold text-amber-900">
                            {formatCompactNumber(breachedCount)}
                        </p>
                        <p className="mt-1 text-xs text-amber-700">
                            Tổng số đơn đang vượt ngưỡng xử lý cho phép
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Danh sách đang hiển thị
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {formatCompactNumber(slaAlerts.length)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Số cảnh báo theo bộ sắp xếp hiện tại
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ArrowUpDown className="h-4 w-4" />
                        <span>Sắp xếp danh sách cảnh báo</span>
                    </div>

                    <select
                        value={slaSort}
                        onChange={(e) =>
                            onChangeSort(
                                e.target.value as
                                | "late-desc"
                                | "late-asc"
                                | "date-desc"
                                | "date-asc"
                            )
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-300"
                    >
                        <option value="late-desc">Quá hạn nhiều nhất</option>
                        <option value="late-asc">Quá hạn ít nhất</option>
                        <option value="date-desc">Đơn mới hơn</option>
                        <option value="date-asc">Đơn cũ hơn</option>
                    </select>
                </div>
            </div>

            <div className="mt-5 max-h-[720px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {slaAlerts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        Chưa có đơn hàng nào bị quá hạn xử lý.
                    </div>
                ) : (
                    slaAlerts.map((alert) => (
                        <div
                            key={alert.orderId}
                            className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50/40"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                                        Mã đơn
                                    </p>
                                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                                        {formatOrderCode(alert)}
                                    </p>
                                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        <span>{formatDateTime(alert.orderDate)}</span>
                                    </div>
                                </div>

                                <span
                                    className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                        alert.status
                                    )}`}
                                >
                                    {mapOrderStatusLabel(alert.status)}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                    <p className="text-xs text-slate-500">
                                        Thời gian quá hạn
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {formatDurationFromMinutes(alert.minutesLate)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                    <p className="text-xs text-slate-500">
                                        Hình thức nhận hàng
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {mapDeliveryTypeLabel(alert.deliveryType)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default DashboardSlaPanel

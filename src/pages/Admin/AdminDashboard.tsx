import { useEffect, useMemo, useState } from "react"
import {
    AlertTriangle,
    DollarSign,
    RefreshCcw,
    ShoppingCart,
    Store,
    Users,
} from "lucide-react"
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { adminService } from "@/services/admin.service"
import type {
    AdminDashboardOverview,
    RevenueTrendItem,
    SlaAlertItem,
} from "@/types/admin.type"

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
})

const formatCompactNumber = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value)
}

const formatDate = (value?: string) => {
    if (!value) return "--"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

const formatDateTime = (value?: string) => {
    if (!value) return "--"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

const getStatusClass = (status?: string) => {
    const normalized = status?.toLowerCase()

    switch (normalized) {
        case "pending":
            return "bg-amber-100 text-amber-700 border border-amber-200"
        case "confirmed":
        case "assigned":
            return "bg-sky-100 text-sky-700 border border-sky-200"
        case "delivered":
        case "completed":
            return "bg-emerald-100 text-emerald-700 border border-emerald-200"
        case "cancelled":
        case "failed":
            return "bg-rose-100 text-rose-700 border border-rose-200"
        default:
            return "bg-slate-100 text-slate-700 border border-slate-200"
    }
}

const StatCard = ({
    title,
    value,
    hint,
    icon: Icon,
}: {
    title: string
    value: string
    hint: string
    icon: React.ComponentType<{ className?: string }>
}) => {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
                    <p className="mt-2 text-sm text-slate-500">{hint}</p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-3">
                    <Icon className="h-5 w-5 text-slate-700" />
                </div>
            </div>
        </div>
    )
}

const AdminDashboard = () => {
    const [overview, setOverview] = useState<AdminDashboardOverview | null>(null)
    const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([])
    const [slaAlerts, setSlaAlerts] = useState<SlaAlertItem[]>([])

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string>("")

    const chartData = useMemo(() => {
        return revenueTrend.map((item) => ({
            ...item,
            label: formatDate(item.date),
        }))
    }, [revenueTrend])

    const loadDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const [overviewRes, trendRes, slaRes] = await Promise.all([
                adminService.getDashboardOverview(),
                adminService.getRevenueTrend(),
                adminService.getSlaAlerts({ page: 1, pageSize: 5 }),
            ])

            setOverview(overviewRes)
            setRevenueTrend(trendRes)
            setSlaAlerts(slaRes.items ?? [])
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải dữ liệu dashboard.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadDashboard()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Đang tải dữ liệu tổng quan hệ thống...
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="h-[380px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100 xl:col-span-2" />
                    <div className="h-[380px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Theo dõi nhanh doanh thu, đơn hàng, người dùng và cảnh báo SLA.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadDashboard(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </button>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Tổng doanh thu"
                    value={currency.format(overview?.totalRevenue ?? 0)}
                    hint="Tổng giá trị giao dịch toàn hệ thống"
                    icon={DollarSign}
                />
                <StatCard
                    title="Tổng đơn hàng"
                    value={formatCompactNumber(overview?.totalOrders ?? 0)}
                    hint="Số đơn đã ghi nhận"
                    icon={ShoppingCart}
                />
                <StatCard
                    title="Người dùng"
                    value={formatCompactNumber(overview?.totalUsers ?? 0)}
                    hint="Tài khoản đang có trong hệ thống"
                    icon={Users}
                />
                <StatCard
                    title="Siêu thị hoạt động"
                    value={formatCompactNumber(overview?.activeSupermarkets ?? 0)}
                    hint="Số siêu thị đang vận hành"
                    icon={Store}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Xu hướng doanh thu</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Biến động doanh thu và số đơn theo thời gian.
                            </p>
                        </div>
                    </div>

                    <div className="h-[320px]">
                        {chartData.length === 0 ? (
                            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                                Chưa có dữ liệu doanh thu để hiển thị.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="currentColor" stopOpacity={0.18} />
                                            <stop offset="95%" stopColor="currentColor" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={24}
                                        fontSize={12}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        fontSize={12}
                                        tickFormatter={(value) =>
                                            new Intl.NumberFormat("vi-VN", {
                                                notation: "compact",
                                                maximumFractionDigits: 1,
                                            }).format(value)
                                        }
                                    />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            const safeValue =
                                                typeof value === "number"
                                                    ? value
                                                    : Number(Array.isArray(value) ? value[0] : value) || 0

                                            if (name === "revenue") {
                                                return [currency.format(safeValue), "Doanh thu"]
                                            }

                                            return [formatCompactNumber(safeValue), "Đơn hàng"]
                                        }}
                                        labelFormatter={(label) => `Ngày: ${label}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        strokeWidth={2.5}
                                        fill="url(#revenueFill)"
                                        className="text-slate-900"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Cảnh báo SLA</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Đơn hàng đang chậm xử lý cần theo dõi.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-amber-50 p-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                    </div>

                    <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3">
                        <p className="text-sm text-amber-800">
                            Hiện có{" "}
                            <span className="font-bold">
                                {formatCompactNumber(overview?.slaBreachedOrders ?? 0)}
                            </span>{" "}
                            đơn vượt SLA.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {slaAlerts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                Chưa có cảnh báo SLA nào.
                            </div>
                        ) : (
                            slaAlerts.map((alert) => (
                                <div
                                    key={alert.orderId}
                                    className="rounded-2xl border border-slate-200 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {alert.orderCode || alert.orderId}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {formatDateTime(alert.orderDate)}
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(alert.status)}`}
                                        >
                                            {alert.status || "Unknown"}
                                        </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                                            <p className="text-slate-500">Trễ</p>
                                            <p className="font-semibold text-slate-900">
                                                {formatCompactNumber(alert.minutesLate)} phút
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                                            <p className="text-slate-500">Hình thức</p>
                                            <p className="font-semibold capitalize text-slate-900">
                                                {alert.deliveryType || "--"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Tóm tắt doanh thu gần đây</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Dữ liệu chi tiết theo từng mốc thời gian.
                    </p>
                </div>

                {chartData.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        Chưa có dữ liệu để hiển thị bảng tóm tắt.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-left text-sm text-slate-500">
                                    <th className="px-4 py-2 font-medium">Ngày</th>
                                    <th className="px-4 py-2 font-medium">Doanh thu</th>
                                    <th className="px-4 py-2 font-medium">Số đơn</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chartData.map((item) => (
                                    <tr key={`${item.date}-${item.orderCount}`} className="bg-slate-50">
                                        <td className="rounded-l-2xl px-4 py-3 text-sm font-medium text-slate-900">
                                            {formatDate(item.date)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            {currency.format(item.revenue)}
                                        </td>
                                        <td className="rounded-r-2xl px-4 py-3 text-sm text-slate-700">
                                            {formatCompactNumber(item.orderCount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminDashboard

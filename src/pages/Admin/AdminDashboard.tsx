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
    CartesianGrid,
    Line,
    LineChart,
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

const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (value: string | Date) => {
    const date = new Date(value)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const toDateKey = (value: string | Date) => {
    const date = startOfDay(value)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
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

    const comparisonChartData = useMemo(() => {
        if (revenueTrend.length === 0) return []

        const revenueMap = new Map(
            revenueTrend.map((item) => [toDateKey(item.date), item])
        )

        const sortedDates = [...revenueTrend]
            .map((item) => startOfDay(item.date).getTime())
            .sort((a, b) => a - b)

        const latestTime = sortedDates[sortedDates.length - 1]
        if (!latestTime) return []

        const currentStart = latestTime - 6 * DAY_MS
        const previousStart = latestTime - 13 * DAY_MS

        return Array.from({ length: 7 }, (_, index) => {
            const previousDate = new Date(previousStart + index * DAY_MS)
            const currentDate = new Date(currentStart + index * DAY_MS)

            const previousKey = toDateKey(previousDate)
            const currentKey = toDateKey(currentDate)

            const previousItem = revenueMap.get(previousKey)
            const currentItem = revenueMap.get(currentKey)

            return {
                label: new Intl.DateTimeFormat("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                }).format(currentDate),
                fullDate: formatDate(currentDate.toISOString()),
                currentRevenue: currentItem?.revenue ?? 0,
                previousRevenue: previousItem?.revenue ?? 0,
                currentOrders: currentItem?.orderCount ?? 0,
                previousOrders: previousItem?.orderCount ?? 0,
            }
        })
    }, [revenueTrend])

    const revenueComparison = useMemo(() => {
        if (comparisonChartData.length === 0) return null

        const currentTotal = comparisonChartData.reduce(
            (sum, item) => sum + item.currentRevenue,
            0
        )
        const previousTotal = comparisonChartData.reduce(
            (sum, item) => sum + item.previousRevenue,
            0
        )

        const diff = currentTotal - previousTotal
        const percent =
            previousTotal > 0 ? (diff / previousTotal) * 100 : null

        return {
            currentTotal,
            previousTotal,
            diff,
            percent,
            isUp: diff >= 0,
        }
    }, [comparisonChartData])

    const recentSummaryData = useMemo(() => {
        return comparisonChartData.map((item) => ({
            date: item.fullDate,
            label: item.label,
            revenue: item.currentRevenue,
            orderCount: item.currentOrders,
        }))
    }, [comparisonChartData])

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
                adminService.getRevenueTrend({ days: 14 }),
                adminService.getSlaAlerts({ top: 5 }),
            ])

            console.log("overviewRes", overviewRes)
            console.log("trendRes length", trendRes?.length)
            console.log("trendRes", trendRes)
            console.log("slaRes", slaRes)

            setOverview(overviewRes)
            setRevenueTrend(trendRes)
            setSlaAlerts(slaRes ?? [])
        } catch (err: any) {
            console.error("loadDashboard error", err)
            console.error("error response", err?.response)
            console.error("error data", err?.response?.data)

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
                        Theo dõi nhanh doanh thu, đơn hàng, tài khoản người dùng và cảnh báo đơn hàng quá hạn xử lý.
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
                    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Xu hướng doanh thu</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                So sánh doanh thu 7 ngày gần đây với 7 ngày trước đó.
                            </p>

                            {revenueComparison ? (
                                <p className="mt-2 text-sm text-slate-500">
                                    {revenueComparison.isUp ? "Doanh thu đang tăng" : "Doanh thu đang giảm"}{" "}
                                    <span className="font-semibold text-slate-900">
                                        {revenueComparison.percent === null
                                            ? "--"
                                            : `${Math.abs(revenueComparison.percent).toFixed(1)}%`}
                                    </span>{" "}
                                    so với giai đoạn trước.
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <div className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                                7 ngày gần đây
                            </div>
                            <div className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                7 ngày trước
                            </div>
                        </div>
                    </div>

                    <div className="h-[320px]">
                        {comparisonChartData.length === 0 ? (
                            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                                Chưa có dữ liệu doanh thu để hiển thị.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={comparisonChartData}>
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

                                            if (name === "currentRevenue") {
                                                return [currency.format(safeValue), "7 ngày gần đây"]
                                            }

                                            return [currency.format(safeValue), "7 ngày trước"]
                                        }}
                                        labelFormatter={(_, payload) => {
                                            const item = payload?.[0]?.payload
                                            return `Ngày: ${item?.fullDate ?? "--"}`
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="previousRevenue"
                                        stroke="#cbd5e1"
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: "#cbd5e1", strokeWidth: 0 }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="currentRevenue"
                                        stroke="#0f172a"
                                        strokeWidth={3}
                                        dot={{ r: 3.5, fill: "#0f172a", strokeWidth: 0 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Cảnh báo quá hạn xử lý</h2>
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
                            đơn đã quá hạn xử lý cho phép.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {slaAlerts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                Chưa có đơn hàng nào bị quá hạn xử lý.
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

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Tổng quan doanh thu
                        </div>

                        <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                            Tóm tắt doanh thu gần đây
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Theo dõi nhanh kết quả kinh doanh trong những ngày gần đây, cùng một số
                            chỉ số nổi bật để hỗ trợ quan sát xu hướng vận hành.
                        </p>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Thống kê 7 ngày gần đây
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="xl:col-span-8">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm">
                                <p className="text-sm font-medium text-slate-300">
                                    Tổng doanh thu
                                </p>

                                <p className="mt-3 text-2xl font-bold tracking-tight">
                                    {currency.format(
                                        recentSummaryData.reduce((sum, item) => sum + item.revenue, 0)
                                    )}
                                </p>

                                <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                                    Giá trị doanh thu ghi nhận trong giai đoạn gần đây
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-sm font-medium text-slate-500">
                                    Tổng số đơn hàng
                                </p>

                                <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                                    {formatCompactNumber(
                                        recentSummaryData.reduce((sum, item) => sum + item.orderCount, 0)
                                    )}
                                </p>

                                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full w-2/3 rounded-full bg-slate-300" />
                                </div>

                                <p className="mt-3 text-xs leading-5 text-slate-500">
                                    Số lượng đơn hàng phát sinh trong giai đoạn được thống kê.
                                </p>
                            </div>

                            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-slate-500">
                                        Chỉ số bổ sung
                                    </p>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                                        Đang cập nhật
                                    </span>
                                </div>

                                <div className="mt-3 h-8 w-28 rounded-xl bg-slate-200" />

                                <p className="mt-3 text-xs leading-5 text-slate-500">
                                    Một số chỉ số phân tích nâng cao sẽ được bổ sung để mang lại góc
                                    nhìn đầy đủ hơn về hiệu quả kinh doanh.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Chi tiết theo từng ngày
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Tổng hợp doanh thu và số lượng đơn hàng theo từng mốc thời gian gần đây.
                                    </p>
                                </div>

                                <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                                    {formatCompactNumber(recentSummaryData.length)} mốc dữ liệu
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                            <th className="px-5 py-4">Ngày</th>
                                            <th className="px-5 py-4">Doanh thu</th>
                                            <th className="px-5 py-4">Số đơn</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentSummaryData.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-5 py-10 text-center text-sm text-slate-500"
                                                >
                                                    Chưa có dữ liệu để hiển thị bảng tóm tắt.
                                                </td>
                                            </tr>
                                        ) : (
                                            recentSummaryData.map((item, index) => (
                                                <tr
                                                    key={`${item.date}-${item.orderCount}`}
                                                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-600">
                                                                {index + 1}
                                                            </div>

                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {item.date}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    Dữ liệu ghi nhận trong ngày
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {currency.format(item.revenue)}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                                                            {formatCompactNumber(item.orderCount)} đơn
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-4">
                        <div className="h-full rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100/80 p-5 shadow-sm">
                            <div>
                                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Góc nhìn thêm
                                </div>

                                <h3 className="mt-3 text-base font-bold text-slate-900">
                                    Chỉ số nổi bật
                                </h3>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Khu vực này giúp tổng hợp thêm những chỉ số và nhận định ngắn để
                                    việc theo dõi doanh thu trở nên trực quan hơn.
                                </p>
                            </div>

                            <div className="mt-5 space-y-4">
                                <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-800">
                                            Doanh thu trung bình mỗi đơn
                                        </p>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                                            Đang cập nhật
                                        </span>
                                    </div>

                                    <div className="mt-3 h-8 w-24 rounded-xl bg-slate-200" />

                                    <div className="mt-4 space-y-2">
                                        <div className="h-2.5 w-full rounded-full bg-slate-100" />
                                        <div className="h-2.5 w-4/5 rounded-full bg-slate-100" />
                                    </div>
                                </div>

                                <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-800">
                                            So sánh với giai đoạn trước
                                        </p>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                                            Sắp bổ sung
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-end gap-2">
                                        <div className="h-10 w-8 rounded-t-xl bg-slate-100" />
                                        <div className="h-16 w-8 rounded-t-xl bg-slate-200" />
                                        <div className="h-12 w-8 rounded-t-xl bg-slate-100" />
                                        <div className="h-20 w-8 rounded-t-xl bg-slate-200" />
                                        <div className="h-14 w-8 rounded-t-xl bg-slate-100" />
                                    </div>

                                    <p className="mt-3 text-xs leading-5 text-slate-500">
                                        Khu vực này sẽ giúp làm nổi bật sự thay đổi giữa các giai đoạn để việc theo dõi trở nên dễ dàng hơn.
                                    </p>
                                </div>

                                <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-800">
                                            Nhận định nhanh
                                        </p>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                                            Đang hoàn thiện
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-2.5">
                                        <div className="h-3 w-full rounded bg-slate-100" />
                                        <div className="h-3 w-11/12 rounded bg-slate-100" />
                                        <div className="h-3 w-4/5 rounded bg-slate-100" />
                                        <div className="h-3 w-3/5 rounded bg-slate-100" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard

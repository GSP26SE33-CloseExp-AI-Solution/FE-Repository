import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Receipt,
    Wallet,
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

import {
    compactAxisNumber,
    currency,
    formatCompactNumber,
    type ComparisonChartItem,
} from "./adminDashboard.utils"

type Props = {
    comparisonChartData: ComparisonChartItem[]
}

const DashboardRevenuePanel = ({ comparisonChartData }: Props) => {
    const currentRevenue = comparisonChartData.reduce(
        (sum, item) => sum + item.currentRevenue,
        0
    )
    const previousRevenue = comparisonChartData.reduce(
        (sum, item) => sum + item.previousRevenue,
        0
    )
    const currentOrders = comparisonChartData.reduce(
        (sum, item) => sum + item.currentOrders,
        0
    )
    const avgOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0
    const revenueDelta = currentRevenue - previousRevenue
    const revenueDeltaPercent =
        previousRevenue > 0 ? (revenueDelta / previousRevenue) * 100 : null

    const deltaToneClass =
        revenueDelta >= 0
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-slate-900">
                            Xu hướng doanh thu
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            So sánh doanh thu 7 ngày gần đây với 7 ngày liền trước.
                        </p>
                    </div>

                    <div
                        className={[
                            "inline-flex w-fit items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold",
                            deltaToneClass,
                        ].join(" ")}
                    >
                        {revenueDelta >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                        ) : (
                            <ArrowDownRight className="h-4 w-4" />
                        )}

                        {revenueDeltaPercent === null
                            ? "Chưa đủ dữ liệu so sánh"
                            : `${Math.abs(revenueDeltaPercent).toFixed(1)}% so với kỳ trước`}
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                        <div className="flex items-center gap-2 text-sky-700">
                            <Wallet className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Doanh thu 7 ngày
                            </span>
                        </div>

                        <p className="mt-3 text-2xl font-bold text-sky-950">
                            {currency.format(currentRevenue)}
                        </p>

                        <p className="mt-2 text-xs text-sky-800/80">
                            Kỳ trước: {currency.format(previousRevenue)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Receipt className="h-4 w-4" />
                            <span className="text-sm font-medium">Số đơn 7 ngày</span>
                        </div>

                        <p className="mt-3 text-2xl font-bold text-slate-900">
                            {formatCompactNumber(currentOrders)}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                            Dựa trên dữ liệu biểu đồ doanh thu hiện có
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <BarChart3 className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Giá trị đơn trung bình
                            </span>
                        </div>

                        <p className="mt-3 text-2xl font-bold text-slate-900">
                            {currency.format(avgOrderValue)}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                            Doanh thu chia cho tổng số đơn trong 7 ngày gần đây
                        </p>
                    </div>
                </div>

                <div className="mt-6 h-[340px]">
                    {comparisonChartData.length === 0 ? (
                        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                            Chưa có dữ liệu doanh thu để hiển thị.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={comparisonChartData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
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
                                        compactAxisNumber.format(Number(value) || 0)
                                    }
                                />
                                <Tooltip
                                    formatter={(value, name) => {
                                        const safeValue =
                                            typeof value === "number"
                                                ? value
                                                : Number(value) || 0

                                        if (name === "currentRevenue") {
                                            return [
                                                currency.format(safeValue),
                                                "7 ngày gần đây",
                                            ]
                                        }

                                        return [
                                            currency.format(safeValue),
                                            "7 ngày trước",
                                        ]
                                    }}
                                    labelFormatter={(_, payload) => {
                                        const item = payload?.[0]
                                            ?.payload as ComparisonChartItem | undefined
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
                                    stroke="#0284c7"
                                    strokeWidth={3}
                                    dot={{ r: 3.5, fill: "#0284c7", strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Doanh thu theo ngày
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Dữ liệu thực tế từ API xu hướng doanh thu.
                        </p>
                    </div>

                    <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                        {formatCompactNumber(comparisonChartData.length)} ngày hiển thị
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-white text-slate-500">
                            <tr className="border-b border-slate-200">
                                <th className="px-5 py-4 text-left font-medium">Ngày</th>
                                <th className="px-5 py-4 text-left font-medium">
                                    7 ngày gần đây
                                </th>
                                <th className="px-5 py-4 text-left font-medium">
                                    7 ngày trước
                                </th>
                                <th className="px-5 py-4 text-left font-medium">
                                    Số đơn hiện tại
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {comparisonChartData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-5 py-10 text-center text-sm text-slate-500"
                                    >
                                        Chưa có dữ liệu để hiển thị.
                                    </td>
                                </tr>
                            ) : (
                                [...comparisonChartData].reverse().map((item) => (
                                    <tr
                                        key={item.fullDate}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                                    >
                                        <td className="px-5 py-4 font-medium text-slate-900">
                                            {item.fullDate}
                                        </td>
                                        <td className="px-5 py-4 text-slate-900">
                                            {currency.format(item.currentRevenue)}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">
                                            {currency.format(item.previousRevenue)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                                                {formatCompactNumber(item.currentOrders)} đơn
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
    )
}

export default DashboardRevenuePanel

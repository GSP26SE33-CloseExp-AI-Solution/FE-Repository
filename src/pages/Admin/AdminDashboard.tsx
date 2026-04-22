import { useEffect, useMemo, useState } from "react"
import {
    DollarSign,
    RefreshCcw,
    ShoppingCart,
    Store,
    Users,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type {
    AdminDashboardOverview,
    RevenueTrendItem,
    SlaAlertItem,
} from "@/types/admin.type"

import DashboardRevenuePanel from "./adminDashboard/RevenuePanel"
import DashboardSlaPanel from "./adminDashboard/SlaPanel"
import DashboardStatCard from "./adminDashboard/StatCard"
import {
    buildComparisonChartData,
    currency,
    formatCompactNumber,
    getErrorMessage,
} from "./adminDashboard/adminDashboard.utils"

const AdminDashboard = () => {
    const [overview, setOverview] = useState<AdminDashboardOverview | null>(null)
    const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([])
    const [slaAlerts, setSlaAlerts] = useState<SlaAlertItem[]>([])

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")

    const [slaSort, setSlaSort] = useState<
        "late-desc" | "late-asc" | "date-desc" | "date-asc"
    >("late-desc")

    const comparisonChartData = useMemo(
        () => buildComparisonChartData(revenueTrend),
        [revenueTrend]
    )

    const currentRevenue7d = useMemo(
        () =>
            comparisonChartData.reduce((sum, item) => sum + item.currentRevenue, 0),
        [comparisonChartData]
    )

    const currentOrders7d = useMemo(
        () => comparisonChartData.reduce((sum, item) => sum + item.currentOrders, 0),
        [comparisonChartData]
    )

    const averageOrderValue7d = useMemo(() => {
        if (currentOrders7d <= 0) return 0
        return currentRevenue7d / currentOrders7d
    }, [currentRevenue7d, currentOrders7d])

    const sortedSlaAlerts = useMemo(() => {
        const list = [...slaAlerts]

        switch (slaSort) {
            case "late-asc":
                return list.sort((a, b) => (a.minutesLate ?? 0) - (b.minutesLate ?? 0))
            case "date-desc":
                return list.sort(
                    (a, b) =>
                        new Date(b.orderDate ?? 0).getTime() -
                        new Date(a.orderDate ?? 0).getTime()
                )
            case "date-asc":
                return list.sort(
                    (a, b) =>
                        new Date(a.orderDate ?? 0).getTime() -
                        new Date(b.orderDate ?? 0).getTime()
                )
            case "late-desc":
            default:
                return list.sort((a, b) => (b.minutesLate ?? 0) - (a.minutesLate ?? 0))
        }
    }, [slaAlerts, slaSort])

    const loadDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const [overviewRes, trendRes, slaRes] = await Promise.allSettled([
                adminService.getDashboardOverview(),
                adminService.getRevenueTrend({ days: 14 }),
                adminService.getSlaAlerts({ thresholdMinutes: 120, top: 50 }),
            ])

            const errorMessages: string[] = []

            if (overviewRes.status === "fulfilled") {
                setOverview(overviewRes.value)
            } else {
                setOverview(null)
                errorMessages.push(
                    `Tổng quan: ${getErrorMessage(
                        overviewRes.reason,
                        "Không tải được dữ liệu tổng quan."
                    )}`
                )
            }

            if (trendRes.status === "fulfilled") {
                setRevenueTrend(trendRes.value ?? [])
            } else {
                setRevenueTrend([])
                errorMessages.push(
                    `Xu hướng doanh thu: ${getErrorMessage(
                        trendRes.reason,
                        "Không tải được dữ liệu doanh thu."
                    )}`
                )
            }

            if (slaRes.status === "fulfilled") {
                setSlaAlerts(slaRes.value ?? [])
            } else {
                setSlaAlerts([])
                errorMessages.push(
                    `Cảnh báo SLA: ${getErrorMessage(
                        slaRes.reason,
                        "Không tải được dữ liệu cảnh báo SLA."
                    )}`
                )
            }

            setError(errorMessages.join(" | "))
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
                        <h1 className="text-2xl font-bold text-slate-900">
                            Dashboard quản trị
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Đang tải dữ liệu tổng quan hệ thống...
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
                    <div className="h-[760px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
                    <div className="h-[760px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Dashboard quản trị
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Theo dõi nhanh doanh thu, đơn hàng, người dùng và các đơn đang
                        vượt ngưỡng SLA xử lý.
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
                <DashboardStatCard
                    title="Tổng doanh thu"
                    value={currency.format(overview?.totalRevenue ?? 0)}
                    hint="Doanh thu toàn hệ thống"
                    icon={DollarSign}
                    to="/admin/reports"
                    tone="dark"
                />

                <DashboardStatCard
                    title="Tổng đơn hàng"
                    value={formatCompactNumber(overview?.totalOrders ?? 0)}
                    hint="Số đơn đã ghi nhận"
                    icon={ShoppingCart}
                    to="/admin/transactions"
                />

                <DashboardStatCard
                    title="Người dùng"
                    value={formatCompactNumber(overview?.totalUsers ?? 0)}
                    hint="Tổng tài khoản hiện có"
                    icon={Users}
                    to="/admin/users"
                />

                <DashboardStatCard
                    title="Siêu thị hoạt động"
                    value={formatCompactNumber(overview?.activeSupermarkets ?? 0)}
                    hint="Đối tác đang vận hành"
                    icon={Store}
                    to="/admin/supermarkets"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DashboardStatCard
                    title="Doanh thu 7 ngày"
                    value={currency.format(currentRevenue7d)}
                    hint="Tổng doanh thu trong 7 ngày gần đây"
                    icon={DollarSign}
                    tone="success"
                />

                <DashboardStatCard
                    title="Số đơn 7 ngày"
                    value={formatCompactNumber(currentOrders7d)}
                    hint="Tổng đơn trong 7 ngày gần đây"
                    icon={ShoppingCart}
                />

                <DashboardStatCard
                    title="Giá trị đơn trung bình"
                    value={currency.format(averageOrderValue7d)}
                    hint="Trung bình mỗi đơn trong 7 ngày"
                    icon={Users}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
                <DashboardRevenuePanel comparisonChartData={comparisonChartData} />

                <DashboardSlaPanel
                    overview={overview}
                    slaAlerts={sortedSlaAlerts}
                    slaSort={slaSort}
                    onChangeSort={setSlaSort}
                />
            </div>
        </div>
    )
}

export default AdminDashboard

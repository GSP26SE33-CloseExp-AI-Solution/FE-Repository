import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  LineChart,
  RefreshCcw,
  SearchCheck,
  TrendingUp,
  Truck,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { adminService } from "@/services/admin.service"
import type {
  DeliveryStats,
  RevenueTrendItem,
  SlaAlertItem,
} from "@/types/admin.type"

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const numberFormat = new Intl.NumberFormat("vi-VN")

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
      return "border border-amber-200 bg-amber-100 text-amber-700"
    case "assigned":
    case "confirmed":
      return "border border-sky-200 bg-sky-100 text-sky-700"
    case "intransit":
    case "in-transit":
    case "shipping":
      return "border border-violet-200 bg-violet-100 text-violet-700"
    case "delivered":
    case "completed":
      return "border border-emerald-200 bg-emerald-100 text-emerald-700"
    case "failed":
    case "cancelled":
      return "border border-rose-200 bg-rose-100 text-rose-700"
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700"
  }
}

const SectionCard = ({
  title,
  description,
  right,
  children,
}: {
  title: string
  description?: string
  right?: React.ReactNode
  children: React.ReactNode
}) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>

        {right}
      </div>

      {children}
    </div>
  )
}

const StatCard = ({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string
  value: string | number
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

const AdminReports = () => {
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([])
  const [slaAlerts, setSlaAlerts] = useState<SlaAlertItem[]>([])
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const loadReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const [trendRes, slaRes, statsRes] = await Promise.all([
        adminService.getRevenueTrend({
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }),
        adminService.getSlaAlerts({ page: 1, pageSize: 20 }),
        adminService.getDeliveryStats({
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }),
      ])

      setRevenueTrend(trendRes ?? [])
      setSlaAlerts(slaRes.items ?? [])
      setDeliveryStats(statsRes ?? [])
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể tải dữ liệu báo cáo.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [])

  const revenueChartData = useMemo(() => {
    return revenueTrend.map((item) => ({
      ...item,
      label: formatDate(item.date),
    }))
  }, [revenueTrend])

  const totalRevenue = useMemo(() => {
    return revenueTrend.reduce((sum, item) => sum + (item.revenue ?? 0), 0)
  }, [revenueTrend])

  const totalOrders = useMemo(() => {
    return revenueTrend.reduce((sum, item) => sum + (item.orderCount ?? 0), 0)
  }, [revenueTrend])

  const avgOrderValue = useMemo(() => {
    if (!totalOrders) return 0
    return totalRevenue / totalOrders
  }, [totalRevenue, totalOrders])

  const deliveryBreakdown = useMemo(() => {
    let completed = 0
    let failed = 0
    let pending = 0
    let inTransit = 0

    deliveryStats.forEach((item) => {
      completed += item.completedOrders ?? 0
      failed += item.failedOrders ?? 0
      pending += item.pendingOrders ?? 0
      inTransit += item.inTransitOrders ?? 0
    })

    return [
      { name: "Completed", value: completed },
      { name: "Failed", value: failed },
      { name: "Pending", value: pending },
      { name: "In Transit", value: inTransit },
    ]
  }, [deliveryStats])

  const topDeliveryStaff = useMemo(() => {
    return [...deliveryStats]
      .sort((a, b) => (b.completionRate ?? 0) - (a.completionRate ?? 0))
      .slice(0, 6)
  }, [deliveryStats])

  const pieColors = ["#0f172a", "#ef4444", "#f59e0b", "#8b5cf6"]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Reports</h1>
            <p className="mt-1 text-sm text-slate-500">
              Đang tải dữ liệu báo cáo...
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="h-[380px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
          <div className="h-[380px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Báo cáo doanh thu, vận hành giao hàng và cảnh báo SLA chi tiết.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadReports(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      <SectionCard
        title="Bộ lọc thời gian"
        description="Áp dụng khoảng thời gian để xem báo cáo theo giai đoạn mong muốn."
        right={
          <button
            type="button"
            onClick={() => void loadReports(true)}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Áp dụng
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFromDate("")
              setToDate("")
            }}
            className="self-end rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Xóa bộ lọc
          </button>
        </div>
      </SectionCard>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng doanh thu"
          value={currency.format(totalRevenue)}
          hint="Tổng doanh thu trong kỳ báo cáo"
          icon={TrendingUp}
        />
        <StatCard
          title="Tổng đơn hàng"
          value={numberFormat.format(totalOrders)}
          hint="Tổng số đơn ghi nhận từ revenue trend"
          icon={ClipboardList}
        />
        <StatCard
          title="Giá trị đơn trung bình"
          value={currency.format(avgOrderValue)}
          hint="Average order value"
          icon={LineChart}
        />
        <StatCard
          title="SLA Alerts"
          value={numberFormat.format(slaAlerts.length)}
          hint="Số cảnh báo SLA đang hiển thị"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Xu hướng doanh thu"
          description="Theo dõi doanh thu theo thời gian."
        >
          <div className="h-[320px]">
            {revenueChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Chưa có dữ liệu doanh thu.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="reportRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0.03} />
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

                      return [numberFormat.format(safeValue), "Đơn hàng"]
                    }}
                    labelFormatter={(label) => `Ngày: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    fill="url(#reportRevenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Phân bố vận hành giao hàng"
          description="Tỷ trọng trạng thái giao hàng tổng hợp từ delivery stats."
        >
          <div className="h-[320px]">
            {deliveryBreakdown.every((item) => item.value === 0) ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Chưa có dữ liệu vận hành giao hàng.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {deliveryBreakdown.map((_, index) => (
                      <Cell
                        key={index}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name) => {
                      const safeValue =
                        typeof value === "number"
                          ? value
                          : Number(Array.isArray(value) ? value[0] : value) || 0

                      return [numberFormat.format(safeValue), String(name)]
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {deliveryBreakdown.map((item, index) => (
              <div
                key={item.name}
                className="rounded-2xl border border-slate-200 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: pieColors[index % pieColors.length] }}
                  />
                  <p className="text-sm font-medium text-slate-700">{item.name}</p>
                </div>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {numberFormat.format(item.value)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Top delivery staff"
          description="Nhân sự giao hàng có completion rate cao nhất."
        >
          <div className="h-[320px]">
            {topDeliveryStaff.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Chưa có dữ liệu delivery staff.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topDeliveryStaff.map((item) => ({
                    name: item.deliveryStaffName || item.deliveryStaffId,
                    completionRate: item.completionRate ?? 0,
                  }))}
                  layout="vertical"
                  margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const safeValue =
                        typeof value === "number"
                          ? value
                          : Number(Array.isArray(value) ? value[0] : value) || 0

                      return [`${safeValue}%`, "Completion Rate"]
                    }}
                  />
                  <Bar
                    dataKey="completionRate"
                    radius={[0, 12, 12, 0]}
                    fill="#0f172a"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Tóm tắt delivery staff"
          description="Bảng hiệu suất nhanh của nhân sự giao hàng."
        >
          {topDeliveryStaff.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
              Chưa có dữ liệu hiệu suất giao hàng.
            </div>
          ) : (
            <div className="space-y-3">
              {topDeliveryStaff.map((item) => (
                <div
                  key={item.deliveryStaffId}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.deliveryStaffName || "--"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        ID: {item.deliveryStaffId}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                      {item.completionRate ?? 0}%
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <p className="text-slate-500">Nhóm giao</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {numberFormat.format(item.totalAssignedGroups ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <p className="text-slate-500">Tổng đơn</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {numberFormat.format(item.totalOrders ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <p className="text-slate-500">Hoàn tất</p>
                      <p className="mt-1 font-semibold text-emerald-700">
                        {numberFormat.format(item.completedOrders ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <p className="text-slate-500">Thất bại</p>
                      <p className="mt-1 font-semibold text-rose-700">
                        {numberFormat.format(item.failedOrders ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Báo cáo SLA Alerts"
        description="Danh sách đơn hàng đang chậm xử lý, cần theo dõi sát."
        right={
          <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            <SearchCheck className="h-4 w-4" />
            {numberFormat.format(slaAlerts.length)} cảnh báo
          </div>
        }
      >
        {slaAlerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
            Chưa có cảnh báo SLA nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-sm text-slate-500">
                  <th className="px-4 py-2 font-medium">Mã đơn</th>
                  <th className="px-4 py-2 font-medium">Trạng thái</th>
                  <th className="px-4 py-2 font-medium">Hình thức</th>
                  <th className="px-4 py-2 font-medium">Trễ</th>
                  <th className="px-4 py-2 font-medium">Ngày đặt</th>
                  <th className="px-4 py-2 font-medium">User ID</th>
                </tr>
              </thead>
              <tbody>
                {slaAlerts.map((item) => (
                  <tr key={item.orderId} className="bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-3 text-sm font-medium text-slate-900">
                      {item.orderCode || item.orderId}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {item.deliveryType || "--"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-rose-700">
                      {numberFormat.format(item.minutesLate ?? 0)} phút
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {formatDateTime(item.orderDate)}
                    </td>
                    <td className="rounded-r-2xl px-4 py-3 text-sm text-slate-700">
                      {item.userId || "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Tóm tắt doanh thu theo ngày"
        description="Danh sách dữ liệu gốc dùng cho revenue trend."
        right={
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            <BarChart3 className="h-4 w-4" />
            {numberFormat.format(revenueChartData.length)} mốc dữ liệu
          </div>
        }
      >
        {revenueChartData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
            Chưa có dữ liệu revenue trend.
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
                {revenueChartData.map((item) => (
                  <tr key={`${item.date}-${item.orderCount}`} className="bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-3 text-sm font-medium text-slate-900">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {currency.format(item.revenue ?? 0)}
                    </td>
                    <td className="rounded-r-2xl px-4 py-3 text-sm text-slate-700">
                      {numberFormat.format(item.orderCount ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default AdminReports

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
    ArrowUpRight,
    Bot,
    CalendarClock,
    ChartColumn,
    CircleAlert,
    ClipboardList,
    Loader2,
    Package,
    RefreshCcw,
    Store,
    Tag,
    TrendingUp,
} from "lucide-react"
import toast from "react-hot-toast"

import axiosClient from "@/utils/axiosClient"
import { authStorage } from "@/utils/authStorage"
import { productLotService } from "@/services/product-lot.service"
import type { ApiResponse } from "@/types/api.types"
import type { ProductLotItem } from "@/types/product-lot.type"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type WorkflowSummaryDto = {
    draftCount: number
    verifiedCount: number
    pricedCount: number
    publishedCount: number
    expiredCount: number
    totalCount: number
}

type LotStatusValue =
    | "DRAFT"
    | "VERIFIED"
    | "PRICED"
    | "PUBLISHED"
    | "EXPIRED"
    | "UNKNOWN"

type StatCardProps = {
    title: string
    value: string
    hint: string
    icon: React.ReactNode
}

type MiniPanelProps = {
    title: string
    subtitle?: string
    children: React.ReactNode
    rightNode?: React.ReactNode
}

const unwrap = <T,>(response?: ApiResponse<T> | null): T => {
    if (!response) {
        throw new Error("Không nhận được phản hồi từ máy chủ")
    }

    if (!response.success) {
        const message =
            response.errors?.filter(Boolean).join(", ") ||
            response.message ||
            "Yêu cầu thất bại"

        throw new Error(message)
    }

    return response.data
}

const normalizeLotStatus = (status?: string | number | null): LotStatusValue => {
    const normalized = String(status ?? "").trim().toLowerCase()

    if (normalized === "0" || normalized === "draft") return "DRAFT"
    if (normalized === "1" || normalized === "verified") return "VERIFIED"
    if (
        normalized === "2" ||
        normalized === "priced" ||
        normalized === "priceconfirmed"
    ) {
        return "PRICED"
    }
    if (normalized === "3" || normalized === "published") return "PUBLISHED"
    if (normalized === "4" || normalized === "expired") return "EXPIRED"

    return "UNKNOWN"
}

const formatNumber = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "0"
    return value.toLocaleString("vi-VN")
}

const formatMoney = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—"
    return `${value.toLocaleString("vi-VN")} đ`
}

const formatRelativeDateVN = (value?: string | null) => {
    if (!value) return "Vừa cập nhật"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Vừa cập nhật"

    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 60) return `${diffMinutes || 1} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`

    return `${diffDays} ngày trước`
}

const getLotUpdatedAt = (lot: ProductLotItem) =>
    lot.publishedAt || lot.createdAt || lot.expiryDate || ""

const isLotExpired = (lot: ProductLotItem) => {
    if (lot.expiryStatus === 5) return true

    if (typeof lot.daysRemaining === "number") {
        return lot.daysRemaining < 0
    }

    if (!lot.expiryDate) return false

    const expiry = new Date(lot.expiryDate)
    if (Number.isNaN(expiry.getTime())) return false

    return expiry.getTime() < Date.now()
}

const isLotNearExpiry = (lot: ProductLotItem) => {
    if (isLotExpired(lot)) return false

    if ([1, 2, 3].includes(Number(lot.expiryStatus))) return true

    if (typeof lot.daysRemaining === "number") {
        return lot.daysRemaining >= 0 && lot.daysRemaining <= 7
    }

    return false
}

const getExpiryText = (lot: ProductLotItem) => {
    if (typeof lot.daysRemaining === "number") {
        if (lot.daysRemaining < 0) return "Đã hết hạn"
        if (lot.daysRemaining === 0) return "Hết hạn hôm nay"
        return `Còn ${lot.daysRemaining} ngày`
    }

    if (typeof lot.hoursRemaining === "number") {
        return `Còn ${lot.hoursRemaining} giờ`
    }

    return lot.expiryStatusText || "—"
}

const getPerformanceLabel = ({
    publishedLots,
    nearExpiryLots,
    expiredLots,
}: {
    publishedLots: number
    nearExpiryLots: number
    expiredLots: number
}) => {
    if (expiredLots > 0) return "Cần xử lý"
    if (nearExpiryLots >= 5) return "Cần chú ý"
    if (publishedLots >= 20) return "Tốt"
    if (publishedLots >= 8) return "Ổn định"

    return "Đang khởi động"
}

const StatCard: React.FC<StatCardProps> = ({ title, value, hint, icon }) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium text-slate-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                    {icon}
                </div>
            </div>
        </div>
    )
}

const MiniPanel: React.FC<MiniPanelProps> = ({
    title,
    subtitle,
    children,
    rightNode,
}) => {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                    {subtitle ? (
                        <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
                    ) : null}
                </div>

                {rightNode}
            </div>

            <div className="p-4">{children}</div>
        </section>
    )
}

const SupermarketDashboard: React.FC = () => {
    const session = authStorage.get()

    const supermarketId =
        session?.user?.marketStaffInfo?.supermarket?.supermarketId ?? ""

    const supermarketName =
        session?.user?.marketStaffInfo?.supermarket?.name ?? "Siêu thị của bạn"

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [workflowSummary, setWorkflowSummary] = useState<WorkflowSummaryDto | null>(null)
    const [lots, setLots] = useState<ProductLotItem[]>([])
    const [lotTotal, setLotTotal] = useState(0)

    const loadDashboard = useCallback(
        async (silent = false) => {
            if (!supermarketId) {
                setWorkflowSummary(null)
                setLots([])
                setLotTotal(0)
                setLoading(false)
                return
            }

            if (silent) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            try {
                const [workflowResponse, lotsResponse] = await Promise.all([
                    axiosClient.get<ApiResponse<WorkflowSummaryDto>>(
                        `/Products/workflow-summary/${supermarketId}`,
                    ),
                    productLotService.getMySupermarketLots({
                        pageNumber: 1,
                        pageSize: 200,
                    }),
                ])

                const nextWorkflowSummary = unwrap(workflowResponse.data)
                const nextLots = Array.isArray(lotsResponse.items)
                    ? lotsResponse.items
                    : []

                setWorkflowSummary(nextWorkflowSummary)
                setLots(nextLots)
                setLotTotal(
                    typeof lotsResponse.totalResult === "number"
                        ? lotsResponse.totalResult
                        : nextLots.length,
                )
            } catch (error) {
                console.error("SupermarketDashboard.loadDashboard -> error:", error)
                toast.error("Không tải được dashboard siêu thị")
                setWorkflowSummary(null)
                setLots([])
                setLotTotal(0)
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        },
        [supermarketId],
    )

    useEffect(() => {
        void loadDashboard()
    }, [loadDashboard])

    const stats = useMemo(() => {
        const publishedLots = lots.filter(
            (item) => normalizeLotStatus(item.status) === "PUBLISHED",
        ).length

        const pricedLots = lots.filter(
            (item) => normalizeLotStatus(item.status) === "PRICED",
        ).length

        const draftLots = lots.filter(
            (item) => normalizeLotStatus(item.status) === "DRAFT",
        ).length

        const aiSuggestedLots = lots.filter(
            (item) =>
                typeof item.suggestedUnitPrice === "number" &&
                item.suggestedUnitPrice > 0,
        ).length

        const nearExpiryLots = lots.filter(isLotNearExpiry).length
        const expiredLots = lots.filter(isLotExpired).length

        const pendingWorkflowTasks =
            (workflowSummary?.draftCount ?? 0) +
            (workflowSummary?.verifiedCount ?? 0) +
            (workflowSummary?.pricedCount ?? 0)

        const pendingTasks = pendingWorkflowTasks + nearExpiryLots + expiredLots

        return {
            totalLots: lotTotal,
            loadedLots: lots.length,
            publishedLots,
            pricedLots,
            draftLots,
            aiSuggestedLots,
            nearExpiryLots,
            expiredLots,
            pendingWorkflowTasks,
            pendingTasks,
            workflowTotal: workflowSummary?.totalCount ?? 0,
            workflowPublished: workflowSummary?.publishedCount ?? 0,
            performanceLabel: getPerformanceLabel({
                publishedLots,
                nearExpiryLots,
                expiredLots,
            }),
        }
    }, [lots, lotTotal, workflowSummary])

    const trendData = useMemo(() => {
        const now = new Date()

        const buckets = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(now)
            date.setDate(now.getDate() - (6 - index))

            return {
                key: date.toISOString().slice(0, 10),
                label: date.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                }),
                value: 0,
            }
        })

        lots.forEach((lot) => {
            const rawDate = lot.createdAt || lot.publishedAt
            if (!rawDate) return

            const date = new Date(rawDate)
            if (Number.isNaN(date.getTime())) return

            const key = date.toISOString().slice(0, 10)
            const bucket = buckets.find((item) => item.key === key)

            if (bucket) {
                bucket.value += 1
            }
        })

        const maxValue = Math.max(...buckets.map((item) => item.value), 1)

        return buckets.map((item) => ({
            ...item,
            heightPercent: item.value > 0
                ? Math.max(14, Math.round((item.value / maxValue) * 100))
                : 6,
        }))
    }, [lots])

    const priorityItems = useMemo(() => {
        const items: Array<{
            title: string
            text: string
            tone: "rose" | "amber" | "emerald" | "slate"
        }> = []

        if (stats.expiredLots > 0) {
            items.push({
                title: "Xử lý lô đã hết hạn",
                text: `Có ${stats.expiredLots} lô đã hết hạn. Nên kiểm tra và ẩn/ngừng bán nếu cần.`,
                tone: "rose",
            })
        }

        if (stats.nearExpiryLots > 0) {
            items.push({
                title: "Ưu tiên lô sắp hết hạn",
                text: `Có ${stats.nearExpiryLots} lô đang gần hạn. Nên kiểm tra giá bán và tồn kho.`,
                tone: "amber",
            })
        }

        if ((workflowSummary?.pricedCount ?? 0) > 0) {
            items.push({
                title: "Publish sản phẩm đã chốt giá",
                text: `${workflowSummary?.pricedCount ?? 0} sản phẩm đang ở trạng thái Priced trong workflow.`,
                tone: "emerald",
            })
        }

        if ((workflowSummary?.draftCount ?? 0) > 0) {
            items.push({
                title: "Hoàn tất sản phẩm nháp",
                text: `${workflowSummary?.draftCount ?? 0} sản phẩm còn ở Draft, cần xác minh để đi tiếp.`,
                tone: "slate",
            })
        }

        if (items.length === 0) {
            items.push({
                title: "Chưa có đầu việc gấp",
                text: "Dữ liệu hiện tại chưa phát hiện lô cận hạn hoặc workflow cần xử lý ngay.",
                tone: "emerald",
            })
        }

        return items.slice(0, 4)
    }, [stats.expiredLots, stats.nearExpiryLots, workflowSummary])

    const recentLots = useMemo(() => {
        return [...lots]
            .sort((a, b) => {
                const timeA = new Date(getLotUpdatedAt(a) || 0).getTime()
                const timeB = new Date(getLotUpdatedAt(b) || 0).getTime()

                return timeB - timeA
            })
            .slice(0, 6)
    }, [lots])

    const recentActivities = useMemo(() => {
        if (recentLots.length === 0) {
            return [
                {
                    title: "Chưa có hoạt động gần đây",
                    subtitle: "Chưa tìm thấy dữ liệu lô hàng từ API hiện tại.",
                    time: "Vừa cập nhật",
                },
            ]
        }

        return recentLots.map((item) => {
            const status = normalizeLotStatus(item.status)
            const productName = item.productName || "Một lô sản phẩm"

            let title = `${productName} vừa được cập nhật`
            if (status === "PUBLISHED") title = `${productName} đang bán`
            if (status === "PRICED") title = `${productName} đã chốt giá`
            if (status === "DRAFT") title = `${productName} đang ở bản nháp`
            if (isLotExpired(item)) title = `${productName} đã hết hạn`

            return {
                title,
                subtitle: `${item.category || "Chưa có danh mục"} • ${formatMoney(
                    item.finalUnitPrice ?? item.sellingUnitPrice ?? item.suggestedUnitPrice,
                )}`,
                time: formatRelativeDateVN(getLotUpdatedAt(item)),
            }
        })
    }, [recentLots])

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center p-4 md:p-5">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải dashboard siêu thị...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-5">
                <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                <Store size={13} />
                                Supermarket Dashboard
                            </div>

                            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                Tổng quan vận hành siêu thị
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Theo dõi tình trạng lô hàng, workflow sản phẩm, gợi ý giá AI và
                                các việc cần ưu tiên của {supermarketName}.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:min-w-[430px]">
                                {[
                                    {
                                        label: "Tổng lô",
                                        value: `${formatNumber(stats.totalLots)} lot`,
                                        icon: <Package size={15} />,
                                    },
                                    {
                                        label: "Gợi ý AI",
                                        value: `${formatNumber(stats.aiSuggestedLots)} lot`,
                                        icon: <Bot size={15} />,
                                    },
                                    {
                                        label: "Cận hạn",
                                        value: `${formatNumber(stats.nearExpiryLots)} lot`,
                                        icon: <CircleAlert size={15} />,
                                    },
                                    {
                                        label: "Tình trạng",
                                        value: stats.performanceLabel,
                                        icon: <TrendingUp size={15} />,
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                                    >
                                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700">
                                            {item.icon}
                                        </div>
                                        <p className="text-[11px] font-medium text-slate-500">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => void loadDashboard(true)}
                                disabled={refreshing}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCcw
                                    className={cn(
                                        "h-4 w-4",
                                        refreshing ? "animate-spin" : "",
                                    )}
                                />
                                Làm mới
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Lot đang bán"
                        value={formatNumber(stats.publishedLots)}
                        hint="Đếm từ danh sách lot có trạng thái Published."
                        icon={<Tag size={20} />}
                    />
                    <StatCard
                        title="Workflow cần xử lý"
                        value={formatNumber(stats.pendingWorkflowTasks)}
                        hint="Draft + Verified + Priced từ workflow summary."
                        icon={<ClipboardList size={20} />}
                    />
                    <StatCard
                        title="Lô sắp hết hạn"
                        value={formatNumber(stats.nearExpiryLots)}
                        hint="Bao gồm hết hạn hôm nay, sắp hết hạn và hạn ngắn."
                        icon={<CalendarClock size={20} />}
                    />
                    <StatCard
                        title="Lô đã hết hạn"
                        value={formatNumber(stats.expiredLots)}
                        hint="Các lô có expiryStatus Expired hoặc quá hạn."
                        icon={<CircleAlert size={20} />}
                    />
                </section>

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                    <MiniPanel
                        title="Xu hướng tạo lot"
                        subtitle="Tính theo createdAt/publishedAt của tối đa 200 lot gần nhất."
                        rightNode={
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-500">
                                <ChartColumn size={13} />
                                7 ngày gần đây
                            </div>
                        }
                    >
                        <div className="flex h-[220px] items-end gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                            {trendData.map((item) => (
                                <div
                                    key={item.key}
                                    className="flex flex-1 flex-col items-center gap-2"
                                >
                                    <div className="flex min-h-[120px] w-full items-end">
                                        <div
                                            className={cn(
                                                "w-full rounded-t-xl rounded-b-sm transition-all",
                                                item.value > 0
                                                    ? "bg-emerald-400"
                                                    : "bg-slate-200",
                                            )}
                                            style={{ height: `${item.heightPercent}%` }}
                                            title={`${item.value} lot`}
                                        />
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </MiniPanel>

                    <MiniPanel
                        title="Nhắc việc ưu tiên"
                        subtitle="Suy ra từ workflow summary và danh sách lot của siêu thị."
                    >
                        <div className="space-y-2.5">
                            {priorityItems.map((item) => (
                                <div
                                    key={item.title}
                                    className={cn(
                                        "rounded-xl border px-3.5 py-3",
                                        item.tone === "rose"
                                            ? "border-rose-200 bg-rose-50"
                                            : item.tone === "amber"
                                                ? "border-amber-200 bg-amber-50"
                                                : item.tone === "emerald"
                                                    ? "border-emerald-200 bg-emerald-50"
                                                    : "border-slate-200 bg-slate-50",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                {item.text}
                                            </p>
                                        </div>

                                        <div className="mt-0.5 text-slate-400">
                                            <ArrowUpRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </MiniPanel>
                </section>

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <MiniPanel
                        title="Tình trạng workflow sản phẩm"
                        subtitle="Dữ liệu từ workflow summary theo siêu thị hiện tại."
                    >
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                            {[
                                {
                                    label: "Draft",
                                    value: workflowSummary?.draftCount ?? 0,
                                },
                                {
                                    label: "Verified",
                                    value: workflowSummary?.verifiedCount ?? 0,
                                },
                                {
                                    label: "Priced",
                                    value: workflowSummary?.pricedCount ?? 0,
                                },
                                {
                                    label: "Published",
                                    value: workflowSummary?.publishedCount ?? 0,
                                },
                                {
                                    label: "Expired",
                                    value: workflowSummary?.expiredCount ?? 0,
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"
                                >
                                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                                        {item.label}
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-slate-900">
                                        {formatNumber(item.value)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 space-y-3">
                            {[
                                {
                                    label: "Draft",
                                    value: workflowSummary?.draftCount ?? 0,
                                },
                                {
                                    label: "Verified",
                                    value: workflowSummary?.verifiedCount ?? 0,
                                },
                                {
                                    label: "Priced",
                                    value: workflowSummary?.pricedCount ?? 0,
                                },
                                {
                                    label: "Published",
                                    value: workflowSummary?.publishedCount ?? 0,
                                },
                            ].map((item) => {
                                const total = workflowSummary?.totalCount ?? 0
                                const percent =
                                    total > 0
                                        ? Math.max(6, Math.round((item.value / total) * 100))
                                        : 0

                                return (
                                    <div key={item.label} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">{item.label}</span>
                                            <span className="font-medium text-slate-700">
                                                {formatNumber(item.value)}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100">
                                            <div
                                                className="h-2 rounded-full bg-emerald-400"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </MiniPanel>

                    <MiniPanel
                        title="Hoạt động gần đây"
                        subtitle="Từ createdAt / publishedAt của lot trả về từ API."
                    >
                        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                            {recentActivities.map((item, index) => (
                                <div key={index} className="flex items-start gap-3 px-4 py-3">
                                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                                    <div className="min-w-0">
                                        <p className="text-sm leading-6 text-slate-800">
                                            {item.title}
                                        </p>
                                        <p className="text-xs leading-5 text-slate-500">
                                            {item.subtitle}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            {item.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </MiniPanel>
                </section>

                <MiniPanel
                    title="Lô cần chú ý"
                    subtitle="Ưu tiên hiển thị lô đã hết hạn hoặc sắp hết hạn."
                    rightNode={
                        <div className="text-[11px] font-medium text-slate-500">
                            Đang đọc {formatNumber(stats.loadedLots)} / {formatNumber(stats.totalLots)} lot
                        </div>
                    }
                >
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <div className="grid grid-cols-[minmax(0,1.2fr)_110px_110px_120px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                            <div>Sản phẩm</div>
                            <div>Trạng thái</div>
                            <div>Hạn dùng</div>
                            <div className="text-right">Giá bán</div>
                        </div>

                        {recentLots.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-slate-500">
                                Chưa có dữ liệu lô hàng.
                            </div>
                        ) : (
                            recentLots
                                .filter((lot) => isLotNearExpiry(lot) || isLotExpired(lot))
                                .slice(0, 5)
                                .map((lot) => (
                                    <div
                                        key={lot.lotId}
                                        className="grid grid-cols-[minmax(0,1.2fr)_110px_110px_120px] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate font-semibold text-slate-900">
                                                {lot.productName || "—"}
                                            </div>
                                            <div className="mt-0.5 truncate text-xs text-slate-500">
                                                {lot.brand || lot.category || lot.barcode || "—"}
                                            </div>
                                        </div>

                                        <div className="text-xs font-medium text-slate-600">
                                            {normalizeLotStatus(lot.status)}
                                        </div>

                                        <div
                                            className={cn(
                                                "text-xs font-semibold",
                                                isLotExpired(lot)
                                                    ? "text-rose-600"
                                                    : isLotNearExpiry(lot)
                                                        ? "text-amber-600"
                                                        : "text-slate-500",
                                            )}
                                        >
                                            {getExpiryText(lot)}
                                        </div>

                                        <div className="text-right text-sm font-semibold text-emerald-700">
                                            {formatMoney(
                                                lot.finalUnitPrice ??
                                                lot.sellingUnitPrice ??
                                                lot.suggestedUnitPrice,
                                            )}
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </MiniPanel>
            </div>
        </div>
    )
}

export default SupermarketDashboard

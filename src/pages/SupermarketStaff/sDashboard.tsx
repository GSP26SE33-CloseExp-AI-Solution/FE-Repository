import React, { useEffect, useMemo, useState } from "react"
import {
    ArrowUpRight,
    Bot,
    CalendarClock,
    ChartColumn,
    CircleAlert,
    ClipboardList,
    Loader2,
    Package,
    Sparkles,
    Store,
    Tag,
    TrendingUp,
} from "lucide-react"
import toast from "react-hot-toast"

import axiosClient from "@/utils/axiosClient"
import { authStorage } from "@/utils/authStorage"
import type { ApiResponse } from "@/types/api.types"

import ProductEditModal from "./sProductEditModal"

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

type ProductLotItem = {
    lotId: string
    productId: string
    expiryDate?: string
    manufactureDate?: string
    quantity?: number
    weight?: number
    status?: string
    unitId?: string
    unitName?: string
    unitType?: string
    originalUnitPrice?: number
    suggestedUnitPrice?: number
    finalUnitPrice?: number
    productName?: string
    brand?: string
    category?: string
    barcode?: string
    isFreshFood?: boolean
    supermarketId?: string
    supermarketName?: string
    mainImageUrl?: string
    totalImages?: number
    productImages?: Array<{
        productImageId?: string
        productId?: string
        imageUrl?: string
        createdAt?: string
    }>
    expiryStatus?: number
    daysRemaining?: number
    hoursRemaining?: number
    expiryStatusText?: string
    ingredients?: string[]
    nutritionFacts?: Record<string, string>
    createdAt?: string
    createdBy?: string
    publishedBy?: string
    publishedAt?: string
}

type PagedLotsResult = {
    items: ProductLotItem[]
    totalResult: number
    page: number
    pageSize: number
}

type StatCardProps = {
    title: string
    value: string
    hint: string
    icon: React.ReactNode
}

const StatCard: React.FC<StatCardProps> = ({ title, value, hint, icon }) => {
    return (
        <div
            className={cn(
                "rounded-2xl border border-slate-200 bg-white",
                "p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
            )}
        >
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

type MiniPanelProps = {
    title: string
    subtitle?: string
    children: React.ReactNode
    rightNode?: React.ReactNode
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

const unwrap = <T,>(response: ApiResponse<T>): T => {
    if (!response.success) {
        const message =
            response.errors?.filter(Boolean).join(", ") ||
            response.message ||
            "Request failed"
        throw new Error(message)
    }

    return response.data
}

const normalizeLotStatus = (status?: string | null) => {
    const normalized = (status || "").trim().toLowerCase()

    if (normalized === "draft") return "DRAFT"
    if (normalized === "verified") return "VERIFIED"
    if (normalized === "priced" || normalized === "priceconfirmed") return "PRICED"
    if (normalized === "published") return "PUBLISHED"
    if (normalized === "expired") return "EXPIRED"

    return "UNKNOWN"
}

const formatRelativeDateVN = (value?: string) => {
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

const SupermarketDashboard: React.FC = () => {
    const session = authStorage.get()
    const supermarketId =
        session?.user?.marketStaffInfo?.supermarket?.supermarketId ?? ""
    const supermarketName =
        session?.user?.marketStaffInfo?.supermarket?.name ?? "Siêu thị của bạn"

    const [loading, setLoading] = useState(true)
    const [workflowSummary, setWorkflowSummary] = useState<WorkflowSummaryDto | null>(null)
    const [lots, setLots] = useState<ProductLotItem[]>([])

    const loadDashboard = async () => {
        if (!supermarketId) {
            setWorkflowSummary(null)
            setLots([])
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            const [workflowResponse, lotsResponse] = await Promise.all([
                axiosClient.get<ApiResponse<WorkflowSummaryDto>>(
                    `/Products/workflow-summary/${supermarketId}`,
                ),
                axiosClient.get<ApiResponse<PagedLotsResult>>("/Products/my-supermarket/lots", {
                    params: {
                        pageNumber: 1,
                        pageSize: 100,
                    },
                }),
            ])

            setWorkflowSummary(unwrap(workflowResponse.data))
            setLots(unwrap(lotsResponse.data).items || [])
        } catch (error) {
            console.error("SupermarketDashboard.loadDashboard -> error:", error)
            toast.error("Không tải được dashboard siêu thị")
            setWorkflowSummary(null)
            setLots([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadDashboard()
    }, [supermarketId])

    const stats = useMemo(() => {
        const publishedLots = lots.filter(
            (item) => normalizeLotStatus(item.status) === "PUBLISHED",
        ).length

        const aiSuggestedLots = lots.filter(
            (item) =>
                typeof item.suggestedUnitPrice === "number" && item.suggestedUnitPrice > 0,
        ).length

        const nearExpiryLots = lots.filter(
            (item) => item.expiryStatus === 3 || item.expiryStatus === 4,
        ).length

        const expiringTodayLots = lots.filter((item) => item.expiryStatus === 4).length

        const pendingTasks =
            (workflowSummary?.draftCount || 0) +
            (workflowSummary?.verifiedCount || 0) +
            (workflowSummary?.pricedCount || 0) +
            expiringTodayLots

        const totalWorkflow =
            workflowSummary?.totalCount ??
            workflowSummary?.draftCount ??
            0

        const performanceLabel =
            publishedLots >= 20 ? "Tốt" : publishedLots >= 8 ? "Ổn định" : "Cần đẩy mạnh"

        return {
            publishedLots,
            aiSuggestedLots,
            nearExpiryLots,
            expiringTodayLots,
            pendingTasks,
            totalWorkflow,
            performanceLabel,
        }
    }, [lots, workflowSummary])

    const trendData = useMemo(() => {
        const dayLabels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7"]
        const today = new Date()
        const buckets = dayLabels.map((label) => ({
            label,
            value: 0,
        }))

        lots.forEach((lot) => {
            if (!lot.createdAt) return
            const createdAt = new Date(lot.createdAt)
            if (Number.isNaN(createdAt.getTime())) return

            const diffDays = Math.floor(
                (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
            )

            if (diffDays >= 0 && diffDays < 7) {
                const bucketIndex = 6 - diffDays
                if (buckets[bucketIndex]) {
                    buckets[bucketIndex].value += 1
                }
            }
        })

        const maxValue = Math.max(...buckets.map((item) => item.value), 1)

        return buckets.map((item) => ({
            ...item,
            heightPercent: Math.max(12, Math.round((item.value / maxValue) * 100)),
        }))
    }, [lots])

    const priorityItems = useMemo(() => {
        const items = []

        if ((workflowSummary?.pricedCount || 0) > 0) {
            items.push({
                title: "Xem lại các lot đã chốt giá",
                text: `${workflowSummary?.pricedCount || 0} workflow đang ở bước priced, có thể cần publish tiếp.`,
            })
        }

        if (stats.nearExpiryLots > 0) {
            items.push({
                title: "Ưu tiên xử lý lô sắp hết hạn",
                text: `Hiện có ${stats.nearExpiryLots} lot ở trạng thái cận hạn hoặc hết hạn hôm nay.`,
            })
        }

        if ((workflowSummary?.draftCount || 0) > 0) {
            items.push({
                title: "Hoàn tất các sản phẩm còn ở draft",
                text: `${workflowSummary?.draftCount || 0} workflow vẫn còn ở bước draft.`,
            })
        }

        if (items.length === 0) {
            items.push({
                title: "Chưa có đầu việc nổi bật",
                text: "Hiện chưa thấy mục nào cần ưu tiên gấp từ dữ liệu lot/workflow.",
            })
        }

        return items.slice(0, 3)
    }, [workflowSummary, stats.nearExpiryLots])

    const recentActivities = useMemo(() => {
        const sorted = [...lots]
            .sort((a, b) => {
                const timeA = new Date(b.createdAt || b.publishedAt || 0).getTime()
                const timeB = new Date(a.createdAt || a.publishedAt || 0).getTime()
                return timeA - timeB
            })
            .slice(0, 5)

        if (sorted.length === 0) {
            return [
                {
                    title: "Chưa có hoạt động gần đây",
                    time: "Vừa cập nhật",
                },
            ]
        }

        return sorted.map((item) => {
            const status = normalizeLotStatus(item.status)

            let title = `Lot ${item.productName || item.lotId} vừa được cập nhật`
            if (status === "PUBLISHED") {
                title = `${item.productName || "Một lot sản phẩm"} đã được publish`
            } else if (status === "PRICED") {
                title = `${item.productName || "Một lot sản phẩm"} đã được chốt giá`
            } else if (status === "DRAFT") {
                title = `${item.productName || "Một lot sản phẩm"} đang ở bước draft`
            }

            return {
                title,
                time: formatRelativeDateVN(item.publishedAt || item.createdAt),
            }
        })
    }, [lots])

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
                                Theo dõi nhanh tình trạng sản phẩm, workflow, lot gần hết hạn và
                                các mục nên ưu tiên xử lý của {supermarketName}.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:min-w-[400px]">
                            {[
                                {
                                    label: "Gợi ý giá AI",
                                    value: `${stats.aiSuggestedLots} lot`,
                                    icon: <Bot size={15} />,
                                },
                                {
                                    label: "Sắp hết hạn",
                                    value: `${stats.nearExpiryLots} lot`,
                                    icon: <CircleAlert size={15} />,
                                },
                                {
                                    label: "Đã publish",
                                    value: `${stats.publishedLots} lot`,
                                    icon: <Tag size={15} />,
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
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Sản phẩm đang hiển thị"
                        value={String(stats.publishedLots)}
                        hint="Các lot đang ở trạng thái published."
                        icon={<Package size={20} />}
                    />
                    <StatCard
                        title="Gợi ý giá AI"
                        value={String(stats.aiSuggestedLots)}
                        hint="Các lot hiện có suggestedUnitPrice."
                        icon={<Sparkles size={20} />}
                    />
                    <StatCard
                        title="Lô sắp hết hạn"
                        value={String(stats.nearExpiryLots)}
                        hint="Các lot cận hạn hoặc hết hạn hôm nay."
                        icon={<CalendarClock size={20} />}
                    />
                    <StatCard
                        title="Tác vụ cần xử lý"
                        value={String(stats.pendingTasks)}
                        hint="Tổng draft, verified, priced và lot hết hạn hôm nay."
                        icon={<ClipboardList size={20} />}
                    />
                </section>

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                    <MiniPanel
                        title="Xu hướng tạo lot"
                        subtitle="Nhóm theo createdAt trong 7 ngày gần đây từ dữ liệu lot hiện có."
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
                                    key={item.label}
                                    className="flex flex-1 flex-col items-center gap-2"
                                >
                                    <div
                                        className="w-full rounded-t-xl rounded-b-sm bg-slate-300"
                                        style={{ height: `${item.heightPercent}%` }}
                                    />
                                    <span className="text-[10px] font-medium text-slate-400">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </MiniPanel>

                    <MiniPanel
                        title="Nhắc việc ưu tiên"
                        subtitle="Suy ra từ workflow summary và các lot gần hết hạn."
                    >
                        <div className="space-y-2.5">
                            {priorityItems.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
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
                        subtitle="Dữ liệu thật từ /api/Products/workflow-summary/{supermarketId}."
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
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 space-y-3">
                            {[
                                {
                                    label: "Draft",
                                    value: workflowSummary?.draftCount ?? 0,
                                    total: workflowSummary?.totalCount ?? 0,
                                },
                                {
                                    label: "Verified",
                                    value: workflowSummary?.verifiedCount ?? 0,
                                    total: workflowSummary?.totalCount ?? 0,
                                },
                                {
                                    label: "Priced",
                                    value: workflowSummary?.pricedCount ?? 0,
                                    total: workflowSummary?.totalCount ?? 0,
                                },
                                {
                                    label: "Published",
                                    value: workflowSummary?.publishedCount ?? 0,
                                    total: workflowSummary?.totalCount ?? 0,
                                },
                            ].map((item) => {
                                const percent =
                                    item.total > 0
                                        ? Math.max(6, Math.round((item.value / item.total) * 100))
                                        : 0

                                return (
                                    <div key={item.label} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">{item.label}</span>
                                            <span className="font-medium text-slate-700">
                                                {item.value}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100">
                                            <div
                                                className="h-2 rounded-full bg-slate-300"
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
                        subtitle="Tạo từ dữ liệu createdAt / publishedAt của lot."
                    >
                        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                            {recentActivities.map((item, index) => (
                                <div key={index} className="flex items-start gap-3 px-4 py-3">
                                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                                    <div className="min-w-0">
                                        <p className="text-sm leading-6 text-slate-800">
                                            {item.title}
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
            </div>
        </div>
    )
}

export default SupermarketDashboard

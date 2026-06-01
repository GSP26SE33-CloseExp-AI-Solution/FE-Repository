import { useCallback, useEffect, useMemo, useState } from "react"
import {
    BarChart3,
    CheckCircle2,
    Loader2,
    RefreshCcw,
    Search,
    TrendingUp,
    XCircle,
} from "lucide-react"

import { marketingPromotionService } from "@/services/marketing-promotion.service"
import type { PromotionItem } from "@/types/admin.type"
import type {
    PromotionAnalyticsOverview,
    PromotionTrendPoint,
    PromotionUsageItem,
} from "@/types/promotion.type"
import {
    getPromotionStatusClass,
    getPromotionStatusLabel,
} from "@/utils/promotionDisplay"
import { showError } from "@/utils/toast"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

const money = (value?: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value ?? 0)

const formatDateTime = (value?: string) => {
    if (!value) return "--"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

type TabKey =
    | "overview"
    | "trend"
    | "usages"
    | "validate"
    | "my-usages"

type Props = {
    mode?: "marketing" | "admin"
}

const PromotionInsights = ({ mode = "marketing" }: Props) => {
    const [activeTab, setActiveTab] = useState<TabKey>("overview")
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const [overview, setOverview] = useState<PromotionAnalyticsOverview | null>(
        null,
    )
    const [topPromotions, setTopPromotions] = useState<PromotionItem[]>([])
    const [promotions, setPromotions] = useState<PromotionItem[]>([])
    const [selectedPromotionId, setSelectedPromotionId] = useState("")
    const [trend, setTrend] = useState<PromotionTrendPoint[]>([])
    const [usages, setUsages] = useState<PromotionUsageItem[]>([])
    const [myUsages, setMyUsages] = useState<PromotionUsageItem[]>([])
    const [usageTotal, setUsageTotal] = useState(0)

    const [validateCode, setValidateCode] = useState("")
    const [validateAmount, setValidateAmount] = useState("100000")
    const [validateLoading, setValidateLoading] = useState(false)
    const [validateResult, setValidateResult] = useState<{
        isValid: boolean
        message: string
        discountAmount: number
        finalAmount: number
    } | null>(null)

    const tabs = useMemo(() => {
        const base: Array<{ key: TabKey; label: string }> = [
            { key: "overview", label: "Tổng quan" },
            { key: "trend", label: "Xu hướng chiến dịch" },
            { key: "usages", label: "Lịch sử sử dụng" },
            { key: "validate", label: "Kiểm tra mã" },
        ]

        if (mode === "marketing") {
            base.push({ key: "my-usages", label: "Lượt dùng tài khoản" })
        }

        return base
    }, [mode])

    const loadOverview = useCallback(async () => {
        const [overviewData, topData, promotionRows] = await Promise.all([
            marketingPromotionService.getAnalyticsOverview(),
            marketingPromotionService.getTopPromotions({ metric: "usage", limit: 5 }),
            marketingPromotionService.getPromotions(),
        ])
        setOverview(overviewData)
        setTopPromotions(topData)
        setPromotions(promotionRows)
        if (!selectedPromotionId && promotionRows[0]) {
            setSelectedPromotionId(promotionRows[0].promotionId)
        }
    }, [selectedPromotionId])

    const loadTrend = useCallback(async () => {
        if (!selectedPromotionId) {
            setTrend([])
            return
        }
        const data = await marketingPromotionService.getPromotionTrend(
            selectedPromotionId,
        )
        setTrend(data)
    }, [selectedPromotionId])

    const loadUsages = useCallback(async () => {
        const data = await marketingPromotionService.getUsages({
            pageNumber: 1,
            pageSize: 20,
        })
        setUsages(data.items ?? [])
        setUsageTotal(data.totalResult ?? 0)
    }, [])

    const loadMyUsages = useCallback(async () => {
        const data = await marketingPromotionService.getMyUsages({
            pageNumber: 1,
            pageSize: 20,
        })
        setMyUsages(data.items ?? [])
    }, [])

    const loadActiveTab = useCallback(async () => {
        try {
            if (activeTab === "overview") {
                await loadOverview()
            } else if (activeTab === "trend") {
                if (promotions.length === 0) {
                    const rows = await marketingPromotionService.getPromotions()
                    setPromotions(rows)
                    if (!selectedPromotionId && rows[0]) {
                        setSelectedPromotionId(rows[0].promotionId)
                    }
                }
                await loadTrend()
            } else if (activeTab === "usages") {
                await loadUsages()
            } else if (activeTab === "my-usages") {
                await loadMyUsages()
            }
        } catch (err) {
            showError(
                err instanceof Error ? err.message : "Không thể tải dữ liệu phân tích",
            )
        }
    }, [
        activeTab,
        loadMyUsages,
        loadOverview,
        loadTrend,
        loadUsages,
        promotions.length,
        selectedPromotionId,
    ])

    const refreshAll = useCallback(async () => {
        setRefreshing(true)
        try {
            await loadActiveTab()
        } finally {
            setRefreshing(false)
            setLoading(false)
        }
    }, [loadActiveTab])

    useEffect(() => {
        setLoading(true)
        void refreshAll()
    }, [activeTab, refreshAll])

    useEffect(() => {
        if (activeTab !== "trend" || !selectedPromotionId) return
        void loadTrend().catch((err) =>
            showError(err instanceof Error ? err.message : "Không thể tải xu hướng"),
        )
    }, [activeTab, loadTrend, selectedPromotionId])

    const handleValidate = async () => {
        const amount = Number(validateAmount.replace(/[^\d]/g, "") || 0)
        if (!validateCode.trim()) {
            showError("Vui lòng nhập mã khuyến mãi")
            return
        }
        if (amount <= 0) {
            showError("Giá trị đơn hàng phải lớn hơn 0")
            return
        }

        try {
            setValidateLoading(true)
            const result = await marketingPromotionService.validatePromotion({
                promotionCode: validateCode.trim(),
                totalAmount: amount,
            })
            setValidateResult(result)
        } catch (err) {
            showError(
                err instanceof Error ? err.message : "Không thể kiểm tra mã khuyến mãi",
            )
        } finally {
            setValidateLoading(false)
        }
    }

    const renderUsageTable = (rows: PromotionUsageItem[]) => (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                        <th className="px-4 py-3 font-semibold">Mã KM</th>
                        <th className="px-4 py-3 font-semibold">Giảm</th>
                        <th className="px-4 py-3 font-semibold">Thời gian</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.usageId} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-medium text-slate-800">
                                {row.promotionCode}
                            </td>
                            <td className="px-4 py-3 text-emerald-700">
                                {money(row.discountAmount)}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                                {formatDateTime(row.usedAt)}
                            </td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr>
                            <td
                                colSpan={3}
                                className="px-4 py-10 text-center text-slate-500"
                            >
                                Chưa có dữ liệu sử dụng.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {mode === "admin"
                            ? "Phân tích khuyến mãi"
                            : "Hiệu quả khuyến mãi"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Theo dõi hiệu quả chiến dịch, lịch sử sử dụng và kiểm tra mã ưu đãi.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void refreshAll()}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                    {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCcw className="h-4 w-4" />
                    )}
                    Làm mới
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "rounded-xl border px-3.5 py-2 text-sm font-semibold transition",
                            activeTab === tab.key
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
            ) : null}

            {!loading && activeTab === "overview" && overview ? (
                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                        {[
                            {
                                label: "Lượt sử dụng",
                                value: overview.totalPromotionUsages.toLocaleString("vi-VN"),
                            },
                            {
                                label: "Người dùng",
                                value: overview.uniqueUsers.toLocaleString("vi-VN"),
                            },
                            {
                                label: "Tổng giảm",
                                value: money(overview.totalDiscountAmount),
                            },
                            {
                                label: "Doanh thu gộp",
                                value: money(overview.grossRevenueAffected),
                            },
                            {
                                label: "Doanh thu ròng",
                                value: money(overview.netRevenueAffected),
                            },
                            {
                                label: "Giảm TB/lượt",
                                value: money(overview.avgDiscountPerUsage),
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                            >
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    {item.label}
                                </p>
                                <p className="mt-2 text-lg font-bold text-slate-900">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-emerald-600" />
                            <h2 className="text-base font-semibold text-slate-900">
                                Top khuyến mãi theo lượt dùng
                            </h2>
                        </div>
                        <div className="space-y-2">
                            {topPromotions.map((item, index) => (
                                <div
                                    key={item.promotionId}
                                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
                                >
                                    <div>
                                        <p className="font-medium text-slate-800">
                                            #{index + 1} {item.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {item.code} • Đã dùng {item.usedCount}/
                                            {item.maxUsage}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPromotionStatusClass(
                                            item.status,
                                        )}`}
                                    >
                                        {getPromotionStatusLabel(item.status)}
                                    </span>
                                </div>
                            ))}
                            {topPromotions.length === 0 && (
                                <p className="py-6 text-center text-sm text-slate-500">
                                    Chưa có dữ liệu top khuyến mãi.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            {!loading && activeTab === "trend" ? (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <label className="block text-sm font-semibold text-slate-800">
                            Chọn chiến dịch
                        </label>
                        <select
                            value={selectedPromotionId}
                            onChange={(e) => setSelectedPromotionId(e.target.value)}
                            className="mt-2 w-full max-w-xl rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                        >
                            {promotions.map((item) => (
                                <option key={item.promotionId} value={item.promotionId}>
                                    {item.code} — {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-sky-600" />
                            <h2 className="text-base font-semibold text-slate-900">
                                Xu hướng theo ngày
                            </h2>
                        </div>
                        <div className="space-y-2">
                            {trend.map((point) => (
                                <div
                                    key={point.date}
                                    className="grid grid-cols-1 gap-2 rounded-xl border border-slate-100 px-3 py-2.5 md:grid-cols-4"
                                >
                                    <p className="font-medium text-slate-800">
                                        {formatDateTime(point.date)}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        Lượt: {point.usageCount}
                                    </p>
                                    <p className="text-sm text-emerald-700">
                                        Giảm: {money(point.discountAmount)}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        DT ròng: {money(point.netRevenueAffected)}
                                    </p>
                                </div>
                            ))}
                            {trend.length === 0 && (
                                <p className="py-6 text-center text-sm text-slate-500">
                                    Chưa có dữ liệu xu hướng cho chiến dịch này.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            {!loading && activeTab === "usages" ? (
                <div className="space-y-3">
                    <p className="text-sm text-slate-500">
                        Tổng bản ghi: {usageTotal.toLocaleString("vi-VN")}
                    </p>
                    {renderUsageTable(usages)}
                </div>
            ) : null}

            {!loading && activeTab === "my-usages" ? (
                <div className="space-y-3">
                    <p className="text-sm text-slate-500">
                        Các lần bạn đã dùng mã khuyến mãi khi đặt hàng.
                    </p>
                    {renderUsageTable(myUsages)}
                </div>
            ) : null}

            {!loading && activeTab === "validate" ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                        <div>
                            <label className="block text-sm font-semibold text-slate-800">
                                Mã khuyến mãi
                            </label>
                            <input
                                value={validateCode}
                                onChange={(e) => setValidateCode(e.target.value)}
                                placeholder="Nhập mã ưu đãi"
                                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-800">
                                Giá trị đơn (VND)
                            </label>
                            <input
                                value={validateAmount}
                                onChange={(e) => setValidateAmount(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => void handleValidate()}
                                disabled={validateLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {validateLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                Kiểm tra
                            </button>
                        </div>
                    </div>

                    {validateResult ? (
                        <div
                            className={cn(
                                "mt-4 rounded-2xl border px-4 py-4",
                                validateResult.isValid
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-rose-200 bg-rose-50",
                            )}
                        >
                            <div className="flex items-start gap-2">
                                {validateResult.isValid ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                                ) : (
                                    <XCircle className="mt-0.5 h-5 w-5 text-rose-600" />
                                )}
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {validateResult.message}
                                    </p>
                                    {validateResult.isValid ? (
                                        <p className="mt-1 text-sm text-slate-600">
                                            Giảm {money(validateResult.discountAmount)} •
                                            Thanh toán {money(validateResult.finalAmount)}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}

export default PromotionInsights

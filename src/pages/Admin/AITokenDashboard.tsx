import React, { useCallback, useEffect, useState } from "react"
import {
    AlertTriangle,
    Bot,
    Camera,
    CircleDollarSign,
    History,
    Loader2,
    RefreshCcw,
    Settings2,
    Sparkles,
} from "lucide-react"

import { aiTokenService } from "@/services/ai-token.service"
import type {
    TokenAllFeaturesUsage,
    TokenConfigInfo,
    TokenHistory,
    TokenUsageInfo,
} from "@/types/ai-token.type"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

type FeatureKey = "ocr" | "pricing"

const FEATURE_META: Record<
    FeatureKey,
    {
        label: string
        icon: React.ReactNode
        headerClass: string
        accentText: string
        progressBar: string
    }
> = {
    ocr: {
        label: "OCR – Phân tích ảnh",
        icon: <Camera className="h-5 w-5" />,
        headerClass:
            "bg-gradient-to-br from-sky-100 via-indigo-50 to-violet-100/80 text-indigo-950",
        accentText: "text-indigo-700",
        progressBar: "bg-indigo-500",
    },
    pricing: {
        label: "Đề xuất giá",
        icon: <CircleDollarSign className="h-5 w-5" />,
        headerClass:
            "bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 text-emerald-950",
        accentText: "text-emerald-700",
        progressBar: "bg-emerald-500",
    },
}

const formatMonth = (key: string) => {
    const [year, month] = key.split("-")
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1)
    return date.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
}

function getUsageTone(pct: number) {
    if (pct >= 90) {
        return {
            chip: "border-rose-200 bg-rose-50 text-rose-700",
            label: "Gần hết",
            bar: "bg-rose-500",
            value: "text-rose-600",
        }
    }
    if (pct >= 75) {
        return {
            chip: "border-amber-200 bg-amber-50 text-amber-700",
            label: "Cảnh báo",
            bar: "bg-amber-500",
            value: "text-amber-600",
        }
    }
    return {
        chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
        label: "Còn tốt",
        bar: "",
        value: "text-emerald-600",
    }
}

function StatItem({
    label,
    value,
    unit,
    valueClassName,
}: {
    label: string
    value: string
    unit?: string
    valueClassName?: string
}) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-center">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div
                className={cn(
                    "mt-1 text-lg font-bold text-slate-900",
                    valueClassName,
                )}
            >
                {value}
                {unit ? (
                    <span className="ml-0.5 text-xs font-normal text-slate-500">
                        {unit}
                    </span>
                ) : null}
            </div>
        </div>
    )
}

function TokenCard({ info }: { info: TokenUsageInfo }) {
    const featureKey = (info.feature as FeatureKey) in FEATURE_META
        ? (info.feature as FeatureKey)
        : null
    const meta = featureKey
        ? FEATURE_META[featureKey]
        : {
              label: info.feature,
              icon: <Bot className="h-5 w-5" />,
              headerClass: "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900",
              accentText: "text-slate-700",
              progressBar: "bg-slate-500",
          }

    const pct = Math.min(info.percentage_used, 100)
    const tone = getUsageTone(pct)
    const barClass = tone.bar || meta.progressBar

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
            <div
                className={cn(
                    "flex flex-wrap items-center gap-4 border-b border-white/60 px-5 py-4",
                    meta.headerClass,
                )}
            >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/70 bg-white/80 shadow-sm">
                    {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">{meta.label}</div>
                    <div className="mt-0.5 text-xs opacity-80">
                        {formatMonth(info.month)}
                    </div>
                </div>
                <span
                    className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        tone.chip,
                    )}
                >
                    {tone.label}
                </span>
            </div>

            <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatItem
                        label="Ngân sách"
                        value={info.budget.toString()}
                        unit="token"
                        valueClassName={meta.accentText}
                    />
                    <StatItem
                        label="Đã dùng"
                        value={info.used.toString()}
                        unit="token"
                        valueClassName={tone.value}
                    />
                    <StatItem
                        label="Còn lại"
                        value={info.remaining.toString()}
                        unit="token"
                        valueClassName="text-emerald-600"
                    />
                    <StatItem
                        label="Tỷ lệ"
                        value={`${pct.toFixed(1)}%`}
                        valueClassName={tone.value}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                barClass,
                            )}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span
                        className={cn(
                            "min-w-[3rem] text-right text-sm font-bold",
                            tone.value,
                        )}
                    >
                        {pct.toFixed(1)}%
                    </span>
                </div>

                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                    Còn{" "}
                    <strong className={meta.accentText}>{info.remaining}</strong>{" "}
                    token cho tháng này
                    {info.feature === "ocr" && (
                        <span className="text-slate-500">
                            {" "}
                            (≈ {info.remaining} ảnh)
                        </span>
                    )}
                    {info.feature === "pricing" && (
                        <span className="text-slate-500">
                            {" "}
                            (≈ {info.remaining} lần đề xuất)
                        </span>
                    )}
                </p>
            </div>
        </article>
    )
}

function HistoryTable({ history }: { history: TokenHistory }) {
    const months = Object.keys(history).sort((a, b) => b.localeCompare(a))

    if (months.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-slate-500">
                <History className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium">Chưa có dữ liệu lịch sử</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Tháng
                        </th>
                        {(["ocr", "pricing"] as const).map((f) => (
                            <React.Fragment key={f}>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {FEATURE_META[f].label} – Dùng
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Ngân sách
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Còn lại
                                </th>
                            </React.Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {months.map((month, idx) => {
                        const row = history[month]
                        return (
                            <tr
                                key={month}
                                className={cn(
                                    "border-b border-slate-50 last:border-0",
                                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                                )}
                            >
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                    {formatMonth(month)}
                                </td>
                                {(["ocr", "pricing"] as const).map((f) => {
                                    const entry = row[f]
                                    if (!entry) {
                                        return (
                                            <React.Fragment key={f}>
                                                <td className="px-4 py-3 text-slate-400">
                                                    —
                                                </td>
                                                <td className="px-4 py-3 text-slate-400">
                                                    —
                                                </td>
                                                <td className="px-4 py-3 text-slate-400">
                                                    —
                                                </td>
                                            </React.Fragment>
                                        )
                                    }
                                    const entryPct = Math.min(
                                        (entry.used / entry.budget) * 100,
                                        100,
                                    )
                                    const entryTone = getUsageTone(entryPct)
                                    return (
                                        <React.Fragment key={f}>
                                            <td
                                                className={cn(
                                                    "px-4 py-3 font-semibold",
                                                    entryTone.value,
                                                )}
                                            >
                                                {entry.used}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {entry.budget}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-emerald-600">
                                                {entry.remaining}
                                            </td>
                                        </React.Fragment>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

function CostInfoSection({ config }: { config: TokenConfigInfo }) {
    const costs = config.token_costs ?? {}
    const budgets = config.monthly_budgets ?? {}

    const costItems = [
        { key: "ocr_1_image", label: "OCR – 1 ảnh", cost: costs["ocr_1_image"] },
        { key: "ocr_2_images", label: "OCR – 2 ảnh", cost: costs["ocr_2_images"] },
        { key: "ocr_3_images", label: "OCR – 3 ảnh", cost: costs["ocr_3_images"] },
        { key: "pricing", label: "Đề xuất giá (1 lần)", cost: costs["pricing"] },
    ]

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Settings2 className="h-4 w-4 text-sky-600" />
                Cấu hình Token
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {costItems.map((item) => (
                    <div
                        key={item.key}
                        className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white px-4 py-4 text-center"
                    >
                        <div className="text-xs font-medium text-slate-500">
                            {item.label}
                        </div>
                        <div className="mt-2 text-lg font-bold text-indigo-700">
                            {item.cost ?? "—"} token
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                <p>
                    <Camera className="mr-1 inline h-4 w-4 text-indigo-600" />
                    <strong>Ngân sách OCR:</strong>{" "}
                    <span className="font-bold text-indigo-700">
                        {budgets["ocr"] ?? "—"} token/tháng
                    </span>
                </p>
                <p>
                    <CircleDollarSign className="mr-1 inline h-4 w-4 text-emerald-600" />
                    <strong>Ngân sách đề xuất giá:</strong>{" "}
                    <span className="font-bold text-emerald-700">
                        {budgets["pricing"] ?? "—"} token/tháng
                    </span>
                </p>
            </div>
        </section>
    )
}

const TAB_ITEMS = [
    { id: "status" as const, label: "Trạng thái", icon: Sparkles },
    { id: "history" as const, label: "Lịch sử", icon: History },
    { id: "config" as const, label: "Cấu hình", icon: Settings2 },
]

const AITokenDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [usage, setUsage] = useState<TokenAllFeaturesUsage | null>(null)
    const [history, setHistory] = useState<TokenHistory | null>(null)
    const [config, setConfig] = useState<TokenConfigInfo | null>(null)
    const [tab, setTab] = useState<"status" | "history" | "config">("status")

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }
        setError(null)
        try {
            const [usageData, historyData, configData] = await Promise.all([
                aiTokenService.getAllTokenStatus(),
                aiTokenService.getTokenHistory(),
                aiTokenService.getTokenConfig(),
            ])
            setUsage(usageData)
            setHistory(historyData)
            setConfig(configData)
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Lỗi không xác định"
            setError(message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        void fetchData()
    }, [fetchData])

    return (
        <div className="space-y-6">
            <div
                className={cn(
                    "flex flex-col gap-4 rounded-3xl border border-slate-200 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between",
                    "bg-gradient-to-br from-slate-50 via-sky-50/50 to-indigo-50/30",
                )}
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-white text-sky-600 shadow-sm">
                        <Bot className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            AI Token
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Theo dõi lượng token AI sử dụng trong tháng
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => void fetchData(true)}
                    disabled={loading || refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw
                        className={cn(
                            "h-4 w-4",
                            (loading || refreshing) && "animate-spin",
                        )}
                    />
                    {loading || refreshing ? "Đang tải..." : "Làm mới"}
                </button>
            </div>

            {error ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <span className="inline-flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                    </span>
                    <button
                        type="button"
                        onClick={() => void fetchData(true)}
                        className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                        Thử lại
                    </button>
                </div>
            ) : null}

            <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                            tab === id
                                ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/80"
                                : "text-slate-600 hover:bg-white/60 hover:text-slate-900",
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
                    <Loader2 className="h-9 w-9 animate-spin text-sky-600" />
                    <p className="mt-4 text-sm font-medium text-slate-600">
                        Đang tải dữ liệu token...
                    </p>
                </div>
            ) : (
                <>
                    {tab === "status" && usage ? (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Tháng {usage.month} – Trạng thái Token
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Lượng token được reset vào đầu mỗi tháng.
                                    Mỗi tính năng AI có ngân sách token riêng.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                {Object.values(usage.features).map(
                                    (featureUsage: TokenUsageInfo) => (
                                        <TokenCard
                                            key={featureUsage.feature}
                                            info={featureUsage}
                                        />
                                    ),
                                )}
                            </div>

                            {config ? <CostInfoSection config={config} /> : null}
                        </div>
                    ) : null}

                    {tab === "history" && history ? (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Lịch sử sử dụng Token
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Xem lịch sử tiêu hao token theo từng tháng.
                                </p>
                            </div>
                            <HistoryTable history={history} />
                        </div>
                    ) : null}

                    {tab === "config" && config ? (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Cấu hình Token
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Chi phí token cho mỗi tác vụ AI và ngân sách
                                    hàng tháng.
                                </p>
                            </div>

                            <CostInfoSection config={config} />

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-900">
                                    Mô tả chi tiết
                                </h3>
                                <div className="mt-4 divide-y divide-slate-100">
                                    {Object.entries(config.description).map(
                                        ([key, desc]) => (
                                            <div
                                                key={key}
                                                className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4"
                                            >
                                                <span className="min-w-[10rem] font-mono text-xs font-semibold text-indigo-700">
                                                    {key}
                                                </span>
                                                <span className="text-sm text-slate-600">
                                                    {desc}
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </section>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    )
}

export default AITokenDashboard

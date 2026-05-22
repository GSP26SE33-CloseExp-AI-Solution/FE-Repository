import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bot, ChevronRight, Loader2 } from "lucide-react"

import { aiTokenService } from "@/services/ai-token.service"
import type { TokenAllFeaturesUsage, TokenUsageInfo } from "@/types/ai-token.type"

const FEATURE_META: Record<string, { label: string; short: string; bar: string }> = {
    ocr: { label: "OCR phân tích ảnh", short: "OCR", bar: "bg-indigo-500" },
    pricing: { label: "Đề xuất giá", short: "Giá", bar: "bg-emerald-500" },
}

function TokenMiniBar({ info }: { info: TokenUsageInfo }) {
    const meta = FEATURE_META[info.feature] ?? {
        label: info.feature,
        short: info.feature,
        bar: "bg-slate-500",
    }
    const pct = Math.min(info.percentage_used, 100)
    const barTone =
        pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : meta.bar

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-slate-700">{meta.short}</span>
                <span className="text-slate-500">
                    <span className="font-semibold text-slate-800">{info.remaining}</span>
                    /{info.budget}
                </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                    className={`h-full rounded-full transition-all ${barTone}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-[11px] text-slate-500">{meta.label}</p>
        </div>
    )
}

const AiTokenDropdownPanel = ({
    detailRoute = "/supermarketStaff/ai-tokens",
}: {
    detailRoute?: string
}) => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [usage, setUsage] = useState<TokenAllFeaturesUsage | null>(null)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await aiTokenService.getAllTokenStatus()
                if (!cancelled) setUsage(data)
            } catch (e) {
                if (!cancelled) {
                    setError(
                        e instanceof Error ? e.message : "Không tải được token AI",
                    )
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void load()
        return () => {
            cancelled = true
        }
    }, [])

    const ocr = usage?.features?.ocr
    const pricing = usage?.features?.pricing

    return (
        <div className="border-b border-gray-100 bg-gradient-to-br from-slate-50 to-emerald-50/40 px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm">
                    <Bot size={16} className="text-emerald-600" />
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Token AI của bạn
                    </p>
                    {usage?.month ? (
                        <p className="text-[11px] text-slate-400">Tháng {usage.month}</p>
                    ) : null}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                    <Loader2 size={14} className="animate-spin" />
                    Đang tải...
                </div>
            ) : error ? (
                <p className="text-xs text-red-600">{error}</p>
            ) : (
                <div className="space-y-3">
                    {ocr ? <TokenMiniBar info={ocr} /> : null}
                    {pricing ? <TokenMiniBar info={pricing} /> : null}
                </div>
            )}

            <button
                type="button"
                onClick={() => navigate(detailRoute)}
                className="mt-3 flex w-full items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2 text-left text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
                <span>Xem chi tiết & lịch sử</span>
                <ChevronRight size={14} />
            </button>
        </div>
    )
}

export default AiTokenDropdownPanel

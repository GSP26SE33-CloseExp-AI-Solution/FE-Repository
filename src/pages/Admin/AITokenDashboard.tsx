import React, { useEffect, useState, useCallback } from "react"
import {
    aiTokenService,
    type TokenAllFeaturesUsage,
    type TokenConfigInfo,
    type TokenHistory,
    type TokenUsageInfo,
} from "@/services/ai-token.service"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FEATURE_LABELS: Record<string, { label: string; icon: string; color: string; gradient: string }> = {
    ocr: {
        label: "OCR – Phân tích ảnh",
        icon: "📷",
        color: "#6366f1",
        gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    },
    pricing: {
        label: "Đề xuất giá",
        icon: "💰",
        color: "#10b981",
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
}

const formatMonth = (key: string) => {
    const [year, month] = key.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
}

function TokenCard({ info }: { info: TokenUsageInfo }) {
    const meta = FEATURE_LABELS[info.feature] ?? {
        label: info.feature,
        icon: "🤖",
        color: "#64748b",
        gradient: "linear-gradient(135deg, #64748b, #475569)",
    }

    const pct = Math.min(info.percentage_used, 100)
    const isWarning = pct >= 75
    const isDanger = pct >= 90

    const barColor = isDanger ? "#ef4444" : isWarning ? "#f59e0b" : meta.color

    return (
        <div style={styles.card}>
            {/* Header */}
            <div style={{ ...styles.cardHeader, background: meta.gradient }}>
                <span style={styles.cardIcon}>{meta.icon}</span>
                <div>
                    <div style={styles.cardTitle}>{meta.label}</div>
                    <div style={styles.cardMonth}>{formatMonth(info.month)}</div>
                </div>
                <div style={styles.cardBudgeChip}>
                    {isDanger
                        ? "⚠️ Gần hết"
                        : isWarning
                        ? "🔶 Cảnh báo"
                        : "✅ Còn tốt"}
                </div>
            </div>

            {/* Stats */}
            <div style={styles.cardBody}>
                <div style={styles.statGrid}>
                    <StatItem label="Ngân sách" value={info.budget.toString()} unit="token" color={meta.color} />
                    <StatItem label="Đã dùng" value={info.used.toString()} unit="token" color={barColor} />
                    <StatItem label="Còn lại" value={info.remaining.toString()} unit="token" color="#10b981" />
                    <StatItem label="Tỷ lệ" value={`${pct.toFixed(1)}%`} unit="" color={barColor} />
                </div>

                {/* Progress bar */}
                <div style={styles.progressWrap}>
                    <div style={styles.progressBg}>
                        <div
                            style={{
                                ...styles.progressBar,
                                width: `${pct}%`,
                                background: barColor,
                                boxShadow: `0 0 8px ${barColor}60`,
                            }}
                        />
                    </div>
                    <span style={{ ...styles.progressLabel, color: barColor }}>{pct.toFixed(1)}%</span>
                </div>

                {/* Remaining hint */}
                <div style={styles.remainingHint}>
                    💡 Còn <strong style={{ color: meta.color }}>{info.remaining}</strong> token cho tháng này
                    {info.feature === "ocr" && (
                        <span style={styles.hintSmall}>&nbsp;(≈ {info.remaining} ảnh)</span>
                    )}
                    {info.feature === "pricing" && (
                        <span style={styles.hintSmall}>&nbsp;(≈ {info.remaining} lần đề xuất)</span>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatItem({
    label,
    value,
    unit,
    color,
}: {
    label: string
    value: string
    unit: string
    color: string
}) {
    return (
        <div style={styles.statItem}>
            <div style={styles.statLabel}>{label}</div>
            <div style={{ ...styles.statValue, color }}>
                {value}
                {unit && <span style={styles.statUnit}> {unit}</span>}
            </div>
        </div>
    )
}

function HistoryTable({ history }: { history: TokenHistory }) {
    const months = Object.keys(history).sort((a, b) => b.localeCompare(a))

    if (months.length === 0) {
        return (
            <div style={styles.emptyHistory}>
                <span style={{ fontSize: 48 }}>📊</span>
                <p>Chưa có dữ liệu lịch sử</p>
            </div>
        )
    }

    return (
        <div style={styles.historyWrap}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Tháng</th>
                        {["ocr", "pricing"].map((f) => (
                            <React.Fragment key={f}>
                                <th style={styles.th}>{FEATURE_LABELS[f]?.label ?? f} - Dùng</th>
                                <th style={styles.th}>Ngân sách</th>
                                <th style={styles.th}>Còn lại</th>
                            </React.Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {months.map((month, idx) => {
                        const row = history[month]
                        return (
                            <tr key={month} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                                <td style={{ ...styles.td, fontWeight: 600 }}>{formatMonth(month)}</td>
                                {["ocr", "pricing"].map((f) => {
                                    const entry = row[f]
                                    if (!entry) {
                                        return (
                                            <React.Fragment key={f}>
                                                <td style={styles.td}>-</td>
                                                <td style={styles.td}>-</td>
                                                <td style={styles.td}>-</td>
                                            </React.Fragment>
                                        )
                                    }
                                    const pct = Math.min((entry.used / entry.budget) * 100, 100)
                                    const color =
                                        pct >= 90 ? "#ef4444" : pct >= 75 ? "#f59e0b" : "#10b981"
                                    return (
                                        <React.Fragment key={f}>
                                            <td style={{ ...styles.td, color, fontWeight: 600 }}>
                                                {entry.used}
                                            </td>
                                            <td style={styles.td}>{entry.budget}</td>
                                            <td style={{ ...styles.td, color: "#10b981" }}>
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
        {
            key: "ocr_1_image",
            icon: "1️⃣",
            label: "OCR – 1 ảnh",
            cost: costs["ocr_1_image"] ?? "—",
        },
        {
            key: "ocr_2_images",
            icon: "2️⃣",
            label: "OCR – 2 ảnh",
            cost: costs["ocr_2_images"] ?? "—",
        },
        {
            key: "ocr_3_images",
            icon: "3️⃣",
            label: "OCR – 3 ảnh",
            cost: costs["ocr_3_images"] ?? "—",
        },
        {
            key: "pricing",
            icon: "💰",
            label: "Đề xuất giá (1 lần)",
            cost: costs["pricing"] ?? "—",
        },
    ]

    return (
        <div style={styles.costSection}>
            <h3 style={styles.sectionSubtitle}>
                ⚙️ Cấu hình Token
            </h3>
            <div style={styles.costGrid}>
                {costItems.map((item) => (
                    <div key={item.key} style={styles.costCard}>
                        <div style={styles.costIcon}>{item.icon}</div>
                        <div style={styles.costLabel}>{item.label}</div>
                        <div style={styles.costValue}>{item.cost} token</div>
                    </div>
                ))}
            </div>
            <div style={styles.budgetRow}>
                <div style={styles.budgetItem}>
                    📷 &nbsp;<strong>Ngân sách OCR:</strong>&nbsp;
                    <span style={{ color: "#6366f1", fontWeight: 700 }}>
                        {budgets["ocr"] ?? "—"} token/tháng
                    </span>
                </div>
                <div style={styles.budgetItem}>
                    💰 &nbsp;<strong>Ngân sách Đề xuất giá:</strong>&nbsp;
                    <span style={{ color: "#10b981", fontWeight: 700 }}>
                        {budgets["pricing"] ?? "—"} token/tháng
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AITokenDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [usage, setUsage] = useState<TokenAllFeaturesUsage | null>(null)
    const [history, setHistory] = useState<TokenHistory | null>(null)
    const [config, setConfig] = useState<TokenConfigInfo | null>(null)
    const [tab, setTab] = useState<"status" | "history" | "config">("status")

    const fetchData = useCallback(async () => {
        setLoading(true)
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
            const message = err instanceof Error ? err.message : "Lỗi không xác định"
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return (
        <div style={styles.page}>
            {/* Hero Header */}
            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <div style={styles.heroIcon}>🤖</div>
                    <div>
                        <h1 style={styles.heroTitle}>AI Token Dashboard</h1>
                        <p style={styles.heroSubtitle}>
                            Theo dõi lượng token AI sử dụng trong tháng
                        </p>
                    </div>
                </div>
                <button
                    style={styles.refreshBtn}
                    onClick={fetchData}
                    disabled={loading}
                    id="ai-token-refresh-btn"
                >
                    {loading ? "⏳ Đang tải..." : "🔄 Làm mới"}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={styles.errorBanner}>
                    ⚠️ {error}
                    <button style={styles.retryBtn} onClick={fetchData}>
                        Thử lại
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div style={styles.tabs}>
                {(["status", "history", "config"] as const).map((t) => (
                    <button
                        key={t}
                        style={{
                            ...styles.tabBtn,
                            ...(tab === t ? styles.tabBtnActive : {}),
                        }}
                        onClick={() => setTab(t)}
                        id={`ai-token-tab-${t}`}
                    >
                        {t === "status" && "📊 Trạng thái"}
                        {t === "history" && "📅 Lịch sử"}
                        {t === "config" && "⚙️ Cấu hình"}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={styles.content}>
                {loading ? (
                    <div style={styles.loadingWrap}>
                        <div style={styles.spinner} />
                        <p style={styles.loadingText}>Đang tải dữ liệu token...</p>
                    </div>
                ) : (
                    <>
                        {/* Status Tab */}
                        {tab === "status" && usage && (
                            <div>
                                <h2 style={styles.sectionTitle}>
                                    📊 Tháng {usage.month} – Trạng thái Token
                                </h2>
                                <p style={styles.sectionDesc}>
                                    Lượng token được reset vào đầu mỗi tháng. Mỗi tính năng AI có ngân sách token riêng.
                                </p>
                                <div style={styles.cardGrid}>
                                    {Object.values(usage.features).map((featureUsage: TokenUsageInfo) => (
                                        <TokenCard key={featureUsage.feature} info={featureUsage} />
                                    ))}
                                </div>

                                {/* Token cost breakdown */}
                                {config && <CostInfoSection config={config} />}
                            </div>
                        )}

                        {/* History Tab */}
                        {tab === "history" && history && (
                            <div>
                                <h2 style={styles.sectionTitle}>📅 Lịch sử sử dụng Token</h2>
                                <p style={styles.sectionDesc}>
                                    Xem lịch sử tiêu hao token theo từng tháng.
                                </p>
                                <HistoryTable history={history} />
                            </div>
                        )}

                        {/* Config Tab */}
                        {tab === "config" && config && (
                            <div>
                                <h2 style={styles.sectionTitle}>⚙️ Cấu hình Token</h2>
                                <p style={styles.sectionDesc}>
                                    Chi phí token cho mỗi loại tác vụ AI và ngân sách hàng tháng.
                                </p>
                                <CostInfoSection config={config} />

                                {/* Description table */}
                                <div style={styles.descTable}>
                                    <h3 style={styles.sectionSubtitle}>📖 Mô tả chi tiết</h3>
                                    {Object.entries(config.description).map(([key, desc]) => (
                                        <div key={key} style={styles.descRow}>
                                            <span style={styles.descKey}>{key}</span>
                                            <span style={styles.descValue}>{desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        padding: "24px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    hero: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "24px 32px",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 16,
    },
    heroContent: {
        display: "flex",
        alignItems: "center",
        gap: 20,
    },
    heroIcon: {
        fontSize: 52,
        lineHeight: 1,
    },
    heroTitle: {
        margin: 0,
        fontSize: 28,
        fontWeight: 800,
        color: "#fff",
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        margin: "4px 0 0",
        color: "rgba(255,255,255,0.6)",
        fontSize: 15,
    },
    refreshBtn: {
        padding: "10px 22px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.1)",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
    },
    errorBanner: {
        background: "rgba(239,68,68,0.15)",
        border: "1px solid rgba(239,68,68,0.4)",
        borderRadius: 12,
        padding: "16px 20px",
        color: "#fca5a5",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
    },
    retryBtn: {
        padding: "6px 16px",
        borderRadius: 8,
        border: "1px solid #ef4444",
        background: "transparent",
        color: "#fca5a5",
        cursor: "pointer",
        fontSize: 13,
    },
    tabs: {
        display: "flex",
        gap: 8,
        marginBottom: 24,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 14,
        padding: 6,
        width: "fit-content",
    },
    tabBtn: {
        padding: "10px 20px",
        borderRadius: 10,
        border: "none",
        background: "transparent",
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
    },
    tabBtnActive: {
        background: "rgba(255,255,255,0.15)",
        color: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    },
    content: {
        color: "#fff",
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 700,
        color: "#fff",
        margin: "0 0 8px",
    },
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: 600,
        color: "rgba(255,255,255,0.8)",
        margin: "0 0 16px",
    },
    sectionDesc: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 14,
        margin: "0 0 24px",
    },
    cardGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 20,
        marginBottom: 32,
    },
    card: {
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        overflow: "hidden",
        transition: "transform 0.2s",
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "20px 24px",
        color: "#fff",
    },
    cardIcon: {
        fontSize: 36,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: "#fff",
    },
    cardMonth: {
        fontSize: 12,
        color: "rgba(255,255,255,0.7)",
        marginTop: 2,
    },
    cardBudgeChip: {
        marginLeft: "auto",
        background: "rgba(255,255,255,0.2)",
        borderRadius: 20,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap" as const,
    },
    cardBody: {
        padding: "20px 24px",
    },
    statGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        marginBottom: 20,
    },
    statItem: {
        textAlign: "center" as const,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        padding: "12px 8px",
    },
    statLabel: {
        fontSize: 11,
        color: "rgba(255,255,255,0.5)",
        marginBottom: 4,
        textTransform: "uppercase" as const,
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 800,
    },
    statUnit: {
        fontSize: 11,
        fontWeight: 400,
        color: "rgba(255,255,255,0.5)",
    },
    progressWrap: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    progressBg: {
        flex: 1,
        height: 10,
        background: "rgba(255,255,255,0.1)",
        borderRadius: 10,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        borderRadius: 10,
        transition: "width 0.6s ease",
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: 700,
        minWidth: 46,
        textAlign: "right" as const,
    },
    remainingHint: {
        fontSize: 13,
        color: "rgba(255,255,255,0.6)",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        padding: "8px 12px",
    },
    hintSmall: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
    },
    costSection: {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: "24px",
        marginTop: 8,
    },
    costGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
        marginBottom: 20,
    },
    costCard: {
        textAlign: "center" as const,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "16px 12px",
        border: "1px solid rgba(255,255,255,0.08)",
    },
    costIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    costLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.6)",
        marginBottom: 6,
    },
    costValue: {
        fontSize: 16,
        fontWeight: 700,
        color: "#a78bfa",
    },
    budgetRow: {
        display: "flex",
        gap: 24,
        flexWrap: "wrap" as const,
        fontSize: 14,
        color: "rgba(255,255,255,0.7)",
    },
    budgetItem: {
        display: "flex",
        alignItems: "center",
    },
    historyWrap: {
        overflowX: "auto" as const,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.1)",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse" as const,
        fontSize: 14,
    },
    th: {
        padding: "14px 16px",
        background: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.7)",
        textAlign: "left" as const,
        fontWeight: 600,
        fontSize: 12,
        textTransform: "uppercase" as const,
        letterSpacing: 0.5,
        whiteSpace: "nowrap" as const,
    },
    td: {
        padding: "12px 16px",
        color: "rgba(255,255,255,0.8)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
    trEven: {
        background: "rgba(255,255,255,0.03)",
    },
    trOdd: {
        background: "transparent",
    },
    emptyHistory: {
        textAlign: "center" as const,
        padding: "60px 20px",
        color: "rgba(255,255,255,0.4)",
        fontSize: 16,
    },
    descTable: {
        marginTop: 24,
        background: "rgba(255,255,255,0.04)",
        borderRadius: 12,
        padding: 20,
        border: "1px solid rgba(255,255,255,0.08)",
    },
    descRow: {
        display: "flex",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    descKey: {
        fontSize: 13,
        fontFamily: "monospace",
        color: "#a78bfa",
        minWidth: 160,
    },
    descValue: {
        fontSize: 13,
        color: "rgba(255,255,255,0.6)",
    },
    loadingWrap: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        gap: 16,
    },
    spinner: {
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: "4px solid rgba(255,255,255,0.1)",
        borderTop: "4px solid #6366f1",
        animation: "spin 1s linear infinite",
    },
    loadingText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 15,
    },
}

// Inject keyframe animation once
if (typeof document !== "undefined") {
    const styleEl = document.createElement("style")
    styleEl.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `
    if (!document.head.querySelector("[data-ai-token-spin]")) {
        styleEl.setAttribute("data-ai-token-spin", "true")
        document.head.appendChild(styleEl)
    }
}

export default AITokenDashboard

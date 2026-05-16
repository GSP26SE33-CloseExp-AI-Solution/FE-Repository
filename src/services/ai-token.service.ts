import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TokenUsageInfo {
    feature: string
    month: string
    budget: number
    used: number
    remaining: number
    percentage_used: number
}

export interface TokenAllFeaturesUsage {
    month: string
    features: {
        ocr: TokenUsageInfo
        pricing: TokenUsageInfo
    }
}

export interface TokenConfigInfo {
    monthly_budgets: Record<string, number>
    token_costs: Record<string, number>
    description: Record<string, string>
}

export interface TokenHistoryMonth {
    [feature: string]: {
        used: number
        budget: number
        remaining: number
    }
}

export interface TokenHistory {
    [month: string]: TokenHistoryMonth
}

// BE serializes with camelCase; AI service uses snake_case — accept both.
type RawTokenUsageInfo = TokenUsageInfo & { percentageUsed?: number }

type RawTokenConfigInfo = {
    monthly_budgets?: Record<string, number>
    monthlyBudgets?: Record<string, number>
    token_costs?: Record<string, number>
    tokenCosts?: Record<string, number>
    description?: Record<string, string>
}

type RawTokenAllFeaturesUsage = {
    month: string
    features: Record<string, RawTokenUsageInfo>
}

function normalizeTokenUsageInfo(raw: RawTokenUsageInfo): TokenUsageInfo {
    return {
        feature: raw.feature,
        month: raw.month,
        budget: raw.budget,
        used: raw.used,
        remaining: raw.remaining,
        percentage_used: raw.percentage_used ?? raw.percentageUsed ?? 0,
    }
}

function normalizeTokenConfigInfo(raw: RawTokenConfigInfo): TokenConfigInfo {
    return {
        monthly_budgets: raw.monthly_budgets ?? raw.monthlyBudgets ?? {},
        token_costs: raw.token_costs ?? raw.tokenCosts ?? {},
        description: raw.description ?? {},
    }
}

function normalizeTokenAllFeaturesUsage(raw: RawTokenAllFeaturesUsage): TokenAllFeaturesUsage {
    const features = raw.features ?? {}
    return {
        month: raw.month,
        features: {
            ocr: normalizeTokenUsageInfo(features.ocr ?? { feature: "ocr", month: raw.month, budget: 0, used: 0, remaining: 0, percentage_used: 0 }),
            pricing: normalizeTokenUsageInfo(features.pricing ?? { feature: "pricing", month: raw.month, budget: 0, used: 0, remaining: 0, percentage_used: 0 }),
        },
    }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const aiTokenService = {
    /**
     * Get current month token usage for all AI features.
     */
    async getAllTokenStatus(month?: string): Promise<TokenAllFeaturesUsage> {
        const params = month ? { month } : {}
        const response = await axiosClient.get<ApiResponse<RawTokenAllFeaturesUsage>>(
            "/AIToken/status",
            { params },
        )
        if (!response.data?.success || !response.data.data) {
            throw new Error(response.data?.message || "Không lấy được thông tin token")
        }
        return normalizeTokenAllFeaturesUsage(response.data.data as RawTokenAllFeaturesUsage)
    },

    /**
     * Get current month token usage for a specific feature (ocr | pricing).
     */
    async getFeatureTokenStatus(feature: "ocr" | "pricing", month?: string): Promise<TokenUsageInfo> {
        const params = month ? { month } : {}
        const response = await axiosClient.get<ApiResponse<RawTokenUsageInfo>>(
            `/AIToken/status/${feature}`,
            { params },
        )
        if (!response.data?.success || !response.data.data) {
            throw new Error(response.data?.message || "Không lấy được thông tin token")
        }
        return normalizeTokenUsageInfo(response.data.data)
    },

    /**
     * Get token usage history across all months.
     */
    async getTokenHistory(): Promise<TokenHistory> {
        const response = await axiosClient.get<ApiResponse<TokenHistory>>("/AIToken/history")
        if (!response.data?.success || !response.data.data) {
            throw new Error(response.data?.message || "Không lấy được lịch sử token")
        }
        return response.data.data
    },

    /**
     * Get token budget configuration.
     */
    async getTokenConfig(): Promise<TokenConfigInfo> {
        const response = await axiosClient.get<ApiResponse<RawTokenConfigInfo>>("/AIToken/config")
        if (!response.data?.success || !response.data.data) {
            throw new Error(response.data?.message || "Không lấy được cấu hình token")
        }
        return normalizeTokenConfigInfo(response.data.data)
    },
}

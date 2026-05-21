import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    AiTokenFeature,
    RawTokenAllFeaturesUsage,
    RawTokenConfigInfo,
    RawTokenUsageInfo,
    TokenAllFeaturesUsage,
    TokenConfigInfo,
    TokenHistory,
    TokenUsageInfo,
} from "@/types/ai-token.type"

// ─── Normalizers ─────────────────────────────────────────────────────────────

const createEmptyFeatureUsage = (
    feature: AiTokenFeature,
    month: string
): RawTokenUsageInfo => ({
    feature,
    month,
    budget: 0,
    used: 0,
    remaining: 0,
    percentage_used: 0,
})

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

function normalizeTokenAllFeaturesUsage(
    raw: RawTokenAllFeaturesUsage
): TokenAllFeaturesUsage {
    const features = raw.features ?? {}

    return {
        month: raw.month,
        features: {
            ocr: normalizeTokenUsageInfo(
                features.ocr ?? createEmptyFeatureUsage("ocr", raw.month)
            ),
            pricing: normalizeTokenUsageInfo(
                features.pricing ?? createEmptyFeatureUsage("pricing", raw.month)
            ),
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

        const response = await axiosClient.get<
            ApiResponse<RawTokenAllFeaturesUsage>
        >("/AIToken/status", { params })

        if (!response.data?.success || !response.data.data) {
            throw new Error(
                response.data?.message || "Không lấy được thông tin token"
            )
        }

        return normalizeTokenAllFeaturesUsage(response.data.data)
    },

    /**
     * Get current month token usage for a specific feature.
     */
    async getFeatureTokenStatus(
        feature: AiTokenFeature,
        month?: string
    ): Promise<TokenUsageInfo> {
        const params = month ? { month } : {}

        const response = await axiosClient.get<ApiResponse<RawTokenUsageInfo>>(
            `/AIToken/status/${feature}`,
            { params }
        )

        if (!response.data?.success || !response.data.data) {
            throw new Error(
                response.data?.message || "Không lấy được thông tin token"
            )
        }

        return normalizeTokenUsageInfo(response.data.data)
    },

    /**
     * Get token usage history across all months.
     */
    async getTokenHistory(): Promise<TokenHistory> {
        const response =
            await axiosClient.get<ApiResponse<TokenHistory>>("/AIToken/history")

        if (!response.data?.success || !response.data.data) {
            throw new Error(
                response.data?.message || "Không lấy được lịch sử token"
            )
        }

        return response.data.data
    },

    /**
     * Get token budget configuration.
     */
    async getTokenConfig(): Promise<TokenConfigInfo> {
        const response =
            await axiosClient.get<ApiResponse<RawTokenConfigInfo>>(
                "/AIToken/config"
            )

        if (!response.data?.success || !response.data.data) {
            throw new Error(
                response.data?.message || "Không lấy được cấu hình token"
            )
        }

        return normalizeTokenConfigInfo(response.data.data)
    },
}

export type AiTokenFeature = "ocr" | "pricing"

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
export type RawTokenUsageInfo = TokenUsageInfo & {
    percentageUsed?: number
}

export type RawTokenConfigInfo = {
    monthly_budgets?: Record<string, number>
    monthlyBudgets?: Record<string, number>
    token_costs?: Record<string, number>
    tokenCosts?: Record<string, number>
    description?: Record<string, string>
}

export type RawTokenAllFeaturesUsage = {
    month: string
    features: Record<string, RawTokenUsageInfo>
}

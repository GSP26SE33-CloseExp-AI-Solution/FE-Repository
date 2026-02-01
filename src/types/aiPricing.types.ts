export interface AiPricingRequest {
    category: string
    expiryDate: string
    originalPrice: number
    brand: string
}

export interface AiPricingResponse {
    success: boolean
    errorMessage?: string

    suggestedPrice: number
    minPrice: number
    maxPrice: number
    discountPercent: number

    confidence: number
    urgencyLevel: string
    recommendedAction: string
    daysToExpire: number

    originalPrice: number
    category: string
    processingTimeMs: number
}

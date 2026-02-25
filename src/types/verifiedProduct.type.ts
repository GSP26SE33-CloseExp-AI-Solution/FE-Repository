export interface VerifiedProduct {
    productId: string
    supermarketId: string
    name: string
    brand: string
    category: string
    barcode: string
    description?: string
    origin?: string
    weight?: string
    isFreshFood: boolean
    weightType: number
    defaultPricePerKg?: number
    status: string
    createdAt: string
    updatedAt?: string
    imageUrl?: string
    expiryDate?: string
}

export interface PricingSuggestionResponse {
    productId: string
    productName: string
    originalPrice: number
    suggestedPrice: number
    confidence: number
    discountPercent: number
    expiryDate?: string | null
    daysToExpiry?: number | null
    reasons: string[]
    minMarketPrice: number
    avgMarketPrice: number
    maxMarketPrice: number
    marketPriceSources: {
        storeName: string
        price: number
        source: string
    }[]
}

export interface ConfirmPriceRequest {
    finalPrice: number
    acceptsSuggestion: boolean
    confirmedBy: string
}

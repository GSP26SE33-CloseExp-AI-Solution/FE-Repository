export type ProductStateValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type ProductStateLabel =
    | "Draft"
    | "Verified"
    | "Priced"
    | "Published"
    | "Expired"
    | "SoldOut"
    | "Hidden"
    | "Deleted"

export type ProductAiStep =
    | "SCAN_BARCODE"
    | "ANALYZE_IMAGE"
    | "CREATE_DRAFT_PRODUCT"
    | "VERIFY_PRODUCT"
    | "CREATE_PRODUCT_LOT"
    | "GET_PRICING_SUGGESTION"
    | "CONFIRM_LOT_PRICE"
    | "PUBLISH_PRODUCT_LOT"

export type NutritionFactsMap = Record<string, string | number | null>

export type JsonLike =
    | string
    | number
    | boolean
    | null
    | JsonLike[]
    | { [key: string]: JsonLike }

export type BarcodeLookupInfo = {
    barcode: string
    productName?: string
    brand?: string
    category?: string
    description?: string
    imageUrl?: string
    manufacturer?: string
    weight?: string
    ingredients?: string
    nutritionFacts?: NutritionFactsMap | string | null
    country?: string
    source?: string
    confidence?: number
    isVietnameseProduct?: boolean
    gs1Prefix?: string
    scanCount?: number
    isVerified?: boolean
}

export type ProductImageItem = {
    productImageId?: string
    imageUrl: string
    isPrimary?: boolean
    createdAt?: string
}

export type MarketPriceSource = {
    storeName: string
    price: number
    source?: string
}

export type ExistingProductSummary = {
    productId: string
    name: string
    brand?: string
    category?: string
    barcode: string
    mainImageUrl?: string
    isFreshFood?: boolean
    manufacturer?: string
    ingredients?: string
    lastPrice?: number
    totalLotsSold?: number
}

export type OcrExtractedInfo = {
    name?: string
    brand?: string
    barcode?: string
    category?: string
    expiryDate?: string
    manufactureDate?: string
    weight?: string
    ingredients?: string
    manufacturer?: string
    origin?: string
    nutritionFacts?: NutritionFactsMap | string | null
}

export type ProductScanResult = {
    barcode: string
    productExists: boolean
    existingProduct?: ExistingProductSummary
    barcodeLookupInfo?: BarcodeLookupInfo
    nextAction?: string
    requiresOcrUpload?: boolean
}

export type AnalyzeImageResult = {
    imageUrl?: string
    extractedInfo?: OcrExtractedInfo
    barcodeLookupInfo?: BarcodeLookupInfo
    confidence?: number
    rawOcrData?: JsonLike
}

export type CreateDraftProductResult = {
    productId: string
    supermarketId: string
    name: string
    brand?: string
    category?: string
    barcode: string
    isFreshFood?: boolean
    manufacturer?: string
    ingredients?: string
    origin?: string
    mainImageUrl?: string
    status: ProductStateLabel | ProductStateValue | string
    ocrConfidence?: number
    createdBy: string
    createdAt?: string
    nextAction?: string
    nextActionDescription?: string
}

export type VerifyProductResult = {
    productId: string
    supermarketId: string
    name: string
    brand?: string
    category?: string
    barcode?: string
    isFreshFood?: boolean
    type?: string
    sku?: string
    status: ProductStateLabel | ProductStateValue | string
    weightType?: string | number
    weightTypeName?: string
    originalPrice?: number
    suggestedPrice?: number
    finalPrice?: number
    expiryDate?: string
    manufactureDate?: string
    daysToExpiry?: number
    ocrConfidence?: number
    pricingConfidence?: number
    pricingReasons?: string[]
    createdBy?: string
    createdAt?: string
    verifiedBy?: string
    verifiedAt?: string
    mainImageUrl?: string
    totalImages?: number
    productImages?: ProductImageItem[]
    ingredients?: string
    nutritionFacts?: NutritionFactsMap | string | null
    barcodeLookupInfo?: BarcodeLookupInfo
}

export type CreateLotFromExistingResult = {
    lotId: string
    productId: string
    productName: string
    productBarcode?: string
    productBrand?: string
    productImageUrl?: string
    expiryDate: string
    manufactureDate?: string
    daysToExpiry?: number
    quantity?: number
    weight?: number
    status: ProductStateLabel | ProductStateValue | string
    createdAt?: string
    publishedBy?: string
    publishedAt?: string
    originalPrice?: number
    suggestedPrice?: number
    finalPrice?: number
    pricingConfidence?: number
}

export type LotPricingSuggestionResult = {
    productId: string
    productName: string
    originalPrice: number
    suggestedPrice: number
    confidence?: number
    discountPercent?: number
    expiryDate?: string
    daysToExpiry?: number
    reasons?: string[]
    minMarketPrice?: number
    avgMarketPrice?: number
    maxMarketPrice?: number
    marketPriceSources?: MarketPriceSource[]
}

export type ConfirmLotPriceResult = {
    lotId: string
    productId: string
    productName: string
    productBarcode?: string
    expiryDate?: string
    daysToExpiry?: number
    quantity?: number
    weight?: number
    status: ProductStateLabel | ProductStateValue | string
    originalPrice?: number
    suggestedPrice?: number
    finalPrice?: number
    pricingConfidence?: number
    createdAt?: string
}

export type PublishLotResult = {
    lotId: string
    productId: string
    productName: string
    productBarcode?: string
    productBrand?: string
    productImageUrl?: string
    expiryDate?: string
    daysToExpiry?: number
    quantity?: number
    weight?: number
    status: ProductStateLabel | ProductStateValue | string
    originalPrice?: number
    suggestedPrice?: number
    finalPrice?: number
    pricingConfidence?: number
    createdAt?: string
    publishedBy?: string
    publishedAt?: string
}

export type AiExtractResult = {
    extractedText?: string
    extractedInfo?: OcrExtractedInfo
    confidence?: number
    imageUrl?: string
    rawData?: JsonLike
}

export type AiDirectPricingResult = {
    suggestedPrice?: number
    confidence?: number
    reasons?: string[]
    minMarketPrice?: number
    avgMarketPrice?: number
    maxMarketPrice?: number
    marketPriceSources?: MarketPriceSource[]
}

// request payloads

export type AnalyzeImagePayload = {
    supermarketId: string
    file: File
}

export type CreateDraftProductPayload = {
    supermarketId: string
    name: string
    barcode: string
    brand?: string
    category?: string
    isFreshFood?: boolean
    ingredients?: string
    manufacturer?: string
    origin?: string
    ocrImageUrl?: string
    ocrExtractedData?: JsonLike
    ocrConfidence?: number
    createdBy: string
}

export type VerifyProductPayload = {
    name?: string
    brand?: string
    category?: string
    barcode?: string
    originalPrice: number
    expiryDate?: string
    manufactureDate?: string
    isFreshFood?: boolean
    verifiedBy: string
}

export type CreateLotFromExistingPayload = {
    productId: string
    expiryDate: string
    manufactureDate?: string
    quantity?: number
    weight?: number
    createdBy: string
}

export type LotPricingSuggestionPayload = {
    originalPrice: number
}

export type ConfirmLotPricePayload = {
    finalPrice?: number
    priceFeedback?: string
    acceptedSuggestion: boolean
    confirmedBy: string
}

export type PublishLotPayload = {
    publishedBy: string
}

export type AiExtractPayload = {
    file: File
}

export type AiPricingPayload = {
    productName?: string
    category?: string
    brand?: string
    originalPrice?: number
    expiryDate?: string
    manufactureDate?: string
    daysToExpiry?: number
}

// FE normalized models

export type ProductWorkflowDraft = {
    productId?: string
    supermarketId?: string
    name?: string
    brand?: string
    category?: string
    barcode?: string
    isFreshFood?: boolean
    manufacturer?: string
    ingredients?: string
    origin?: string
    mainImageUrl?: string
    createdBy?: string
    createdAt?: string
    ocrConfidence?: number
}

export type ProductWorkflowVerification = {
    verifiedBy?: string
    verifiedAt?: string
    originalPrice?: number
    expiryDate?: string
    manufactureDate?: string
    daysToExpiry?: number
    nutritionFacts?: NutritionFactsMap | string | null
    barcodeLookupInfo?: BarcodeLookupInfo
}

export type ProductWorkflowLot = {
    lotId?: string
    quantity?: number
    weight?: number
    createdAt?: string
    publishedBy?: string
    publishedAt?: string
}

export type ProductWorkflowPricing = {
    originalPrice?: number
    suggestedPrice?: number
    finalPrice?: number
    discountPercent?: number
    pricingConfidence?: number
    pricingReasons: string[]
    minMarketPrice?: number
    avgMarketPrice?: number
    maxMarketPrice?: number
    marketPriceSources: MarketPriceSource[]
    acceptedSuggestion?: boolean
    priceFeedback?: string
}

export type ProductWorkflowSnapshot = {
    step: ProductAiStep
    productState?: ProductStateLabel | ProductStateValue | string

    barcode?: string
    productExists?: boolean
    requiresOcrUpload?: boolean
    nextAction?: string

    existingProduct?: ExistingProductSummary
    barcodeLookupInfo?: BarcodeLookupInfo

    extractedInfo?: OcrExtractedInfo
    rawOcrData?: JsonLike
    aiExtract?: AiExtractResult

    draft: ProductWorkflowDraft
    verification: ProductWorkflowVerification
    lot: ProductWorkflowLot
    pricing: ProductWorkflowPricing

    name?: string
    brand?: string
    category?: string
    productId?: string
    supermarketId?: string
    mainImageUrl?: string
    productImages: ProductImageItem[]

    statusText?: string
}

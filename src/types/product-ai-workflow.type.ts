import type {
    ProductNutritionFacts,
    ProductStateValue,
} from "./product.type"

export type ProductUnitInfoDto = {
    unitId?: string | null
    unitName?: string | null
    unitType?: string | null
    unitSymbol?: string | null
}

export type NutritionFactsMap = ProductNutritionFacts

export type WorkflowNextAction =
    | "CREATE_STOCKLOT"
    | "VERIFY_PRODUCT"
    | "CHOOSE_OR_CREATE_PRIVATE_PRODUCT"
    | "CREATE_PRODUCT"
    | string

export type ProductWorkflowStep =
    | "SCAN"
    | "PRODUCT"
    | "LOT"
    | "DONE"
    | "ERROR"

export type ProductWorkflowMode =
    | "CREATE_STOCKLOT"
    | "VERIFY_OWN_PRODUCT"
    | "CREATE_PRIVATE_PRODUCT"
    | "CREATE_NEW_PRODUCT"
    | null

export type WorkflowTimeoutInfoDto = {
    timeoutSeconds?: number | null
    isAiStep?: boolean | null
    supportsManualFallback?: boolean | null
}

export type ExistingProductSummaryDto = {
    productId: string
    supermarketId?: string | null
    supermarketName?: string | null
    name?: string | null
    brand?: string | null
    category?: string | null
    barcode?: string | null
    mainImageUrl?: string | null
    manufacturer?: string | null
    ingredients?: string[] | null
    lastPrice?: number | null
    totalLotsSold?: number | null
    status?: ProductStateValue | string | null

    isCurrentSupermarket?: boolean | null
}

export type BarcodeLookupInfoDto = {
    barcode?: string | null
    productName?: string | null
    brand?: string | null
    category?: string | null
    description?: string | null
    imageUrl?: string | null
    manufacturer?: string | null
    weight?: string | null
    ingredients?: string[] | null
    nutritionFacts?: NutritionFactsMap | null
    country?: string | null
    source?: string | null
    confidence?: number | null
    isVietnameseProduct?: boolean | null
    gs1Prefix?: string | null
    scanCount?: number | null
    isVerified?: boolean | null
}

export type OcrExtractedInfoDto = {
    name?: string | null
    brand?: string | null
    barcode?: string | null
    category?: string | null
    expiryDate?: string | null
    manufactureDate?: string | null
    weight?: string | null
    ingredients?: string[] | null
    manufacturer?: string | null
    origin?: string | null
    nutritionFacts?: NutritionFactsMap | null
}

export type WorkflowIdentifyResultDto = ProductUnitInfoDto & {
    barcode: string
    productExists: boolean
    phase?: string | null
    nextAction: WorkflowNextAction
    existingProduct?: ExistingProductSummaryDto | null
    barcodeLookupInfo?: BarcodeLookupInfoDto | null
    timeoutInfo?: WorkflowTimeoutInfoDto | null

    matchedProducts?: ExistingProductSummaryDto[] | null
    canCreatePrivateProductForCurrentSupermarket?: boolean | null
    requiresVerification?: boolean | null
    verificationProductId?: string | null
    canCreateLotDirectly?: boolean | null
}

export type WorkflowAnalyzeImageResultDto = {
    imageUrl?: string | null
    extractedInfo?: OcrExtractedInfoDto | null
    barcodeLookupInfo?: BarcodeLookupInfoDto | null
    confidence?: number | null
    rawOcrData?: string | null
    aiSkipped?: boolean | null
}

export type WorkflowCreateProductDetailRequestDto = {
    brand?: string
    ingredients?: string
    nutritionFactsJson?: string
    usageInstructions?: string
    storageInstructions?: string
    manufacturer?: string
    origin?: string
    description?: string
    safetyWarnings?: string
}

export type WorkflowCreateProductRequestDto = {
    barcode: string
    name: string
    detail: WorkflowCreateProductDetailRequestDto
    categoryName: string
    ocrImageUrl?: string
    ocrExtractedData?: string
    ocrConfidence?: number
    isManualFallback?: boolean
    unitId?: string | null
}

export type WorkflowCreateProductResultDto = ProductUnitInfoDto & {
    productId: string
    supermarketId?: string | null
    name?: string | null
    brand?: string | null
    category?: string | null
    barcode?: string | null
    manufacturer?: string | null
    ingredients?: string[] | null
    mainImageUrl?: string | null
    status?: ProductStateValue | string | null
    createdBy?: string | null
    createdAt?: string | null
    isManualFallback?: boolean | null
    nextAction?: WorkflowNextAction | null
    nextActionDescription?: string | null
}

export type WorkflowCreateAndPublishLotRequestDto = {
    productId: string
    expiryDate: string
    manufactureDate?: string | null
    unitId?: string | null
    quantity?: number
    weight?: number
    originalUnitPrice: number
    finalUnitPrice?: number
    acceptedSuggestion?: boolean
    priceFeedback?: string
    isManualFallback?: boolean
}

export type WorkflowMarketPriceSourceDto = {
    storeName?: string | null
    price?: number | null
    source?: string | null
}

export type WorkflowPricingSuggestionDto = {
    productId?: string | null
    productName?: string | null
    originalPrice?: number | null
    suggestedPrice?: number | null
    confidence?: number | null
    discountPercent?: number | null
    expiryDate?: string | null
    daysToExpiry?: number | null
    reasons?: string[] | null
    minMarketPrice?: number | null
    avgMarketPrice?: number | null
    maxMarketPrice?: number | null
    marketPriceSources?: WorkflowMarketPriceSourceDto[] | null
}

export type WorkflowMarketPriceReferenceDto = {
    barcode?: string | null
    productName?: string | null
    hasData?: boolean | null
    minPrice?: number | null
    avgPrice?: number | null
    maxPrice?: number | null
    sourceCount?: number | null
    lastUpdated?: string | null
    sources?: string[] | null
    details?: WorkflowMarketPriceSourceDto[] | null
    crawled?: boolean | null
    crawlError?: string | null
    message?: string | null
}

export type GetWorkflowMarketPriceReferenceQuery = {
    barcode?: string
    productName?: string
    autoCrawl?: boolean
}

export type WorkflowStockLotDto = ProductUnitInfoDto & {
    lotId: string
    productId: string
    productName?: string | null
    productBarcode?: string | null
    productBrand?: string | null
    productImageUrl?: string | null
    expiryDate?: string | null
    manufactureDate?: string | null
    daysToExpiry?: number | null
    quantity?: number | null
    weight?: number | null
    status?: number | string | null
    createdAt?: string | null
    createdBy?: string | null
    publishedBy?: string | null
    publishedAt?: string | null
    originalPrice?: number | null
    suggestedPrice?: number | null
    finalPrice?: number | null
    pricingConfidence?: number | null
}

export type WorkflowCreateAndPublishLotResultDto = {
    productId: string
    lotId: string
    phase?: string | null
    pricingSuggestionResolvedBeforePublish?: boolean | null
    pricingSuggestion?: WorkflowPricingSuggestionDto | null
    stockLot?: WorkflowStockLotDto | null
    isManualFallback?: boolean | null
    timeoutInfo?: WorkflowTimeoutInfoDto | null

    productCategory?: string | null
    productNutritionFacts?: NutritionFactsMap | null
}

export type LocalImageFile = {
    id: string
    file: File
    preview: string
    source: "upload" | "camera"
}

export type ProductFormState = {
    name: string
    brand: string
    categoryName: string
    categoryId: string
    unitId: string
    isFreshFood: boolean
    barcode: string
    manufacturer: string
    origin: string
    description: string
    ingredients: string
    nutritionFacts: string
    usageInstructions: string
    storageInstructions: string
    safetyWarnings: string
    isManualFallback: boolean
}

export type LotFormState = {
    expiryDate: string
    manufactureDate: string
    quantity: number | ""
    weight: number | ""
    originalUnitPrice: number | ""
    finalUnitPrice: number | ""
    acceptedSuggestion: boolean
    priceFeedback: string
    isManualFallback: boolean
}

export type ProductWorkflowState = {
    step: ProductWorkflowStep
    mode: ProductWorkflowMode
    nextAction: WorkflowNextAction | null
    barcode: string
    phase?: string | null
    statusText: string
    errorMessage: string | null

    identifyResult: WorkflowIdentifyResultDto | null
    analyzeResult: WorkflowAnalyzeImageResultDto | null
    createdProduct: WorkflowCreateProductResultDto | null
    createdLot: WorkflowCreateAndPublishLotResultDto | null

    ownProduct: ExistingProductSummaryDto | null
    referenceProduct: ExistingProductSummaryDto | null
    externalProducts: ExistingProductSummaryDto[]

    requiresVerification: boolean
    verificationProductId?: string | null
    canCreateLotDirectly: boolean
    canCreatePrivateProductForCurrentSupermarket: boolean

    productForm: ProductFormState
    lotForm: LotFormState
}

export const emptyProductForm = (): ProductFormState => ({
    name: "",
    brand: "",
    categoryName: "",
    categoryId: "",
    unitId: "",
    isFreshFood: false,
    barcode: "",
    manufacturer: "",
    origin: "",
    description: "",
    ingredients: "",
    nutritionFacts: "",
    usageInstructions: "",
    storageInstructions: "",
    safetyWarnings: "",
    isManualFallback: false,
})

export const emptyLotForm = (): LotFormState => ({
    expiryDate: "",
    manufactureDate: "",
    quantity: 1,
    weight: "",
    originalUnitPrice: "",
    finalUnitPrice: "",
    acceptedSuggestion: true,
    priceFeedback: "",
    isManualFallback: false,
})

export const buildInitialWorkflowState = (): ProductWorkflowState => ({
    step: "SCAN",
    mode: null,
    nextAction: null,
    barcode: "",
    phase: null,
    statusText: "Bắt đầu bằng mã vạch hoặc ảnh sản phẩm",
    errorMessage: null,

    identifyResult: null,
    analyzeResult: null,
    createdProduct: null,
    createdLot: null,

    ownProduct: null,
    referenceProduct: null,
    externalProducts: [],

    requiresVerification: false,
    verificationProductId: null,
    canCreateLotDirectly: false,
    canCreatePrivateProductForCurrentSupermarket: false,

    productForm: emptyProductForm(),
    lotForm: emptyLotForm(),
})

export const joinIngredientsForRequest = (value: string) => {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", ")
}

export const stringifyNutritionFactsForRequest = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return undefined

    try {
        JSON.parse(trimmed)
        return trimmed
    } catch {
        return JSON.stringify({ note: trimmed })
    }
}

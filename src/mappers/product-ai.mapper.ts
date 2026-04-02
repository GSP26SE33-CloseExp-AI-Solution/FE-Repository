// src/mappers/product-ai.mapper.ts

import type {
    AiExtractResult,
    AnalyzeImageResult,
    ConfirmLotPriceResult,
    CreateDraftProductResult,
    CreateLotFromExistingResult,
    LotPricingSuggestionResult,
    ProductAiStep,
    ProductImageItem,
    ProductStateLabel,
    ProductStateValue,
    ProductWorkflowSnapshot,
    ProductScanResult,
    PublishLotResult,
    VerifyProductResult,
} from "@/types/product-ai-workflow.type"

const PRODUCT_STATE_MAP: Record<number, ProductStateLabel> = {
    0: "Draft",
    1: "Verified",
    2: "Priced",
    3: "Published",
    4: "Expired",
    5: "SoldOut",
    6: "Hidden",
    7: "Deleted",
}

export const mapProductStateLabel = (
    value?: string | number | null,
): ProductStateLabel | string | undefined => {
    if (typeof value === "number") return PRODUCT_STATE_MAP[value] ?? String(value)
    if (typeof value === "string") return value
    return undefined
}

export const mapProductStateValue = (
    value?: string | number | null,
): ProductStateValue | undefined => {
    if (typeof value === "number" && value >= 0 && value <= 7) {
        return value as ProductStateValue
    }

    if (typeof value === "string") {
        const found = Object.entries(PRODUCT_STATE_MAP).find(([, label]) => label === value)
        return found ? (Number(found[0]) as ProductStateValue) : undefined
    }

    return undefined
}

const emptySnapshot = (step: ProductAiStep): ProductWorkflowSnapshot => ({
    step,
    draft: {},
    verification: {
        barcodeLookupInfo: undefined,
    },
    lot: {},
    pricing: {
        pricingReasons: [],
        marketPriceSources: [],
    },
    productImages: [],
})

export const mapScanResultToWorkflow = (data: ProductScanResult): ProductWorkflowSnapshot => {
    const snapshot = emptySnapshot("SCAN_BARCODE")

    snapshot.barcode = data.barcode
    snapshot.productExists = data.productExists
    snapshot.requiresOcrUpload = data.requiresOcrUpload
    snapshot.nextAction = data.nextAction
    snapshot.existingProduct = data.existingProduct
    snapshot.barcodeLookupInfo = data.barcodeLookupInfo

    if (data.existingProduct) {
        snapshot.productId = data.existingProduct.productId
        snapshot.name = data.existingProduct.name
        snapshot.brand = data.existingProduct.brand
        snapshot.category = data.existingProduct.category
        snapshot.mainImageUrl = data.existingProduct.mainImageUrl
        snapshot.draft = {
            productId: data.existingProduct.productId,
            name: data.existingProduct.name,
            brand: data.existingProduct.brand,
            category: data.existingProduct.category,
            barcode: data.existingProduct.barcode,
            isFreshFood: data.existingProduct.isFreshFood,
            manufacturer: data.existingProduct.manufacturer,
            ingredients: data.existingProduct.ingredients,
            mainImageUrl: data.existingProduct.mainImageUrl,
        }
    }

    return snapshot
}

export const mapAnalyzeImageResultToWorkflow = (
    data: AnalyzeImageResult,
): ProductWorkflowSnapshot => {
    const snapshot = emptySnapshot("ANALYZE_IMAGE")

    snapshot.extractedInfo = data.extractedInfo
    snapshot.barcodeLookupInfo = data.barcodeLookupInfo
    snapshot.rawOcrData = data.rawOcrData

    snapshot.name = data.extractedInfo?.name ?? data.barcodeLookupInfo?.productName
    snapshot.brand = data.extractedInfo?.brand ?? data.barcodeLookupInfo?.brand
    snapshot.category = data.extractedInfo?.category ?? data.barcodeLookupInfo?.category
    snapshot.barcode = data.extractedInfo?.barcode ?? data.barcodeLookupInfo?.barcode
    snapshot.mainImageUrl = data.imageUrl ?? data.barcodeLookupInfo?.imageUrl

    snapshot.draft = {
        name: snapshot.name,
        brand: snapshot.brand,
        category: snapshot.category,
        barcode: snapshot.barcode,
        manufacturer:
            data.extractedInfo?.manufacturer ?? data.barcodeLookupInfo?.manufacturer,
        ingredients:
            data.extractedInfo?.ingredients ?? data.barcodeLookupInfo?.ingredients,
        origin: data.extractedInfo?.origin ?? data.barcodeLookupInfo?.country,
        mainImageUrl: snapshot.mainImageUrl,
        ocrConfidence: data.confidence,
    }

    return snapshot
}

export const mapCreateDraftResultToWorkflow = (
    data: CreateDraftProductResult,
): ProductWorkflowSnapshot => {
    const snapshot = emptySnapshot("CREATE_DRAFT_PRODUCT")

    snapshot.productId = data.productId
    snapshot.supermarketId = data.supermarketId
    snapshot.barcode = data.barcode
    snapshot.name = data.name
    snapshot.brand = data.brand
    snapshot.category = data.category
    snapshot.mainImageUrl = data.mainImageUrl
    snapshot.productState = mapProductStateLabel(data.status)
    snapshot.nextAction = data.nextAction

    snapshot.draft = {
        productId: data.productId,
        supermarketId: data.supermarketId,
        name: data.name,
        brand: data.brand,
        category: data.category,
        barcode: data.barcode,
        isFreshFood: data.isFreshFood,
        manufacturer: data.manufacturer,
        ingredients: data.ingredients,
        origin: data.origin,
        mainImageUrl: data.mainImageUrl,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        ocrConfidence: data.ocrConfidence,
    }

    snapshot.statusText = mapProductStateLabel(data.status)

    return snapshot
}

export const mapVerifyProductResultToWorkflow = (
    data: VerifyProductResult,
): ProductWorkflowSnapshot => {
    const snapshot = emptySnapshot("VERIFY_PRODUCT")

    snapshot.productId = data.productId
    snapshot.supermarketId = data.supermarketId
    snapshot.barcode = data.barcode
    snapshot.name = data.name
    snapshot.brand = data.brand
    snapshot.category = data.category
    snapshot.mainImageUrl = data.mainImageUrl
    snapshot.productState = mapProductStateLabel(data.status)
    snapshot.barcodeLookupInfo = data.barcodeLookupInfo

    snapshot.draft = {
        productId: data.productId,
        supermarketId: data.supermarketId,
        name: data.name,
        brand: data.brand,
        category: data.category,
        barcode: data.barcode,
        isFreshFood: data.isFreshFood,
        manufacturer: undefined,
        ingredients: data.ingredients,
        mainImageUrl: data.mainImageUrl,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        ocrConfidence: data.ocrConfidence,
    }

    snapshot.verification = {
        verifiedBy: data.verifiedBy,
        verifiedAt: data.verifiedAt,
        originalPrice: data.originalPrice,
        expiryDate: data.expiryDate,
        manufactureDate: data.manufactureDate,
        daysToExpiry: data.daysToExpiry,
        nutritionFacts: data.nutritionFacts,
        barcodeLookupInfo: data.barcodeLookupInfo,
    }

    snapshot.pricing = {
        originalPrice: data.originalPrice,
        suggestedPrice: data.suggestedPrice,
        finalPrice: data.finalPrice,
        pricingConfidence: data.pricingConfidence,
        pricingReasons: data.pricingReasons ?? [],
        marketPriceSources: [],
    }

    snapshot.productImages = data.productImages ?? []
    snapshot.statusText = mapProductStateLabel(data.status)

    return snapshot
}

export const mapCreateLotResultToWorkflow = (
    data: CreateLotFromExistingResult,
): ProductWorkflowSnapshot => {
    const snapshot = emptySnapshot("CREATE_PRODUCT_LOT")

    snapshot.productId = data.productId
    snapshot.barcode = data.productBarcode
    snapshot.name = data.productName
    snapshot.brand = data.productBrand
    snapshot.mainImageUrl = data.productImageUrl
    snapshot.productState = mapProductStateLabel(data.status)

    snapshot.lot = {
        lotId: data.lotId,
        quantity: data.quantity,
        weight: data.weight,
        createdAt: data.createdAt,
        publishedBy: data.publishedBy,
        publishedAt: data.publishedAt,
    }

    snapshot.verification = {
        expiryDate: data.expiryDate,
        manufactureDate: data.manufactureDate,
        daysToExpiry: data.daysToExpiry,
    }

    snapshot.pricing = {
        originalPrice: data.originalPrice,
        suggestedPrice: data.suggestedPrice,
        finalPrice: data.finalPrice,
        pricingConfidence: data.pricingConfidence,
        pricingReasons: [],
        marketPriceSources: [],
    }

    snapshot.statusText = mapProductStateLabel(data.status)

    return snapshot
}

export const mapPricingSuggestionResultToWorkflow = (
    data: LotPricingSuggestionResult,
): ProductWorkflowSnapshot => {
    const snapshot = emptySnapshot("GET_PRICING_SUGGESTION")

    snapshot.productId = data.productId
    snapshot.name = data.productName

    snapshot.verification = {
        expiryDate: data.expiryDate,
        daysToExpiry: data.daysToExpiry,
    }

    snapshot.pricing = {
        originalPrice: data.originalPrice,
        suggestedPrice: data.suggestedPrice,
        discountPercent: data.discountPercent,
        pricingConfidence: data.confidence,
        pricingReasons: data.reasons ?? [],
        minMarketPrice: data.minMarketPrice,
        avgMarketPrice: data.avgMarketPrice,
        maxMarketPrice: data.maxMarketPrice,
        marketPriceSources: data.marketPriceSources ?? [],
    }

    return snapshot
}

export const mapConfirmPriceResultToWorkflow = (
    data: ConfirmLotPriceResult,
): ProductWorkflowSnapshot => {
    const snapshot = emptySnapshot("CONFIRM_LOT_PRICE")

    snapshot.productId = data.productId
    snapshot.barcode = data.productBarcode
    snapshot.name = data.productName
    snapshot.productState = mapProductStateLabel(data.status)

    snapshot.lot = {
        lotId: data.lotId,
        quantity: data.quantity,
        weight: data.weight,
        createdAt: data.createdAt,
    }

    snapshot.verification = {
        expiryDate: data.expiryDate,
        daysToExpiry: data.daysToExpiry,
    }

    snapshot.pricing = {
        originalPrice: data.originalPrice,
        suggestedPrice: data.suggestedPrice,
        finalPrice: data.finalPrice,
        pricingConfidence: data.pricingConfidence,
        pricingReasons: [],
        marketPriceSources: [],
    }

    snapshot.statusText = mapProductStateLabel(data.status)

    return snapshot
}

export const mapPublishLotResultToWorkflow = (
    data: PublishLotResult,
): ProductWorkflowSnapshot => {
    const snapshot = emptySnapshot("PUBLISH_PRODUCT_LOT")

    snapshot.productId = data.productId
    snapshot.barcode = data.productBarcode
    snapshot.name = data.productName
    snapshot.brand = data.productBrand
    snapshot.mainImageUrl = data.productImageUrl
    snapshot.productState = mapProductStateLabel(data.status)

    snapshot.lot = {
        lotId: data.lotId,
        quantity: data.quantity,
        weight: data.weight,
        createdAt: data.createdAt,
        publishedBy: data.publishedBy,
        publishedAt: data.publishedAt,
    }

    snapshot.verification = {
        expiryDate: data.expiryDate,
        daysToExpiry: data.daysToExpiry,
    }

    snapshot.pricing = {
        originalPrice: data.originalPrice,
        suggestedPrice: data.suggestedPrice,
        finalPrice: data.finalPrice,
        pricingConfidence: data.pricingConfidence,
        pricingReasons: [],
        marketPriceSources: [],
    }

    snapshot.statusText = mapProductStateLabel(data.status)

    return snapshot
}

export const mergeWorkflowSnapshots = (
    base?: Partial<ProductWorkflowSnapshot> | null,
    incoming?: Partial<ProductWorkflowSnapshot> | null,
): ProductWorkflowSnapshot => {
    const safeBase = base ?? emptySnapshot("SCAN_BARCODE")
    const safeIncoming = incoming ?? {}

    return {
        step: safeIncoming.step ?? safeBase.step ?? "SCAN_BARCODE",
        productState: safeIncoming.productState ?? safeBase.productState,
        barcode: safeIncoming.barcode ?? safeBase.barcode,
        productExists: safeIncoming.productExists ?? safeBase.productExists,
        requiresOcrUpload: safeIncoming.requiresOcrUpload ?? safeBase.requiresOcrUpload,
        nextAction: safeIncoming.nextAction ?? safeBase.nextAction,
        existingProduct: safeIncoming.existingProduct ?? safeBase.existingProduct,
        barcodeLookupInfo: safeIncoming.barcodeLookupInfo ?? safeBase.barcodeLookupInfo,
        extractedInfo: safeIncoming.extractedInfo ?? safeBase.extractedInfo,
        rawOcrData: safeIncoming.rawOcrData ?? safeBase.rawOcrData,
        aiExtract: safeIncoming.aiExtract ?? safeBase.aiExtract,
        draft: {
            ...(safeBase.draft ?? {}),
            ...(safeIncoming.draft ?? {}),
        },
        verification: {
            ...(safeBase.verification ?? {}),
            ...(safeIncoming.verification ?? {}),
        },
        lot: {
            ...(safeBase.lot ?? {}),
            ...(safeIncoming.lot ?? {}),
        },
        pricing: {
            ...(safeBase.pricing ?? { pricingReasons: [], marketPriceSources: [] }),
            ...(safeIncoming.pricing ?? {}),
            pricingReasons:
                safeIncoming.pricing?.pricingReasons ??
                safeBase.pricing?.pricingReasons ??
                [],
            marketPriceSources:
                safeIncoming.pricing?.marketPriceSources ??
                safeBase.pricing?.marketPriceSources ??
                [],
        },
        name: safeIncoming.name ?? safeBase.name,
        brand: safeIncoming.brand ?? safeBase.brand,
        category: safeIncoming.category ?? safeBase.category,
        productId: safeIncoming.productId ?? safeBase.productId,
        supermarketId: safeIncoming.supermarketId ?? safeBase.supermarketId,
        mainImageUrl: safeIncoming.mainImageUrl ?? safeBase.mainImageUrl,
        productImages:
            safeIncoming.productImages ??
            safeBase.productImages ??
            ([] as ProductImageItem[]),
        statusText: safeIncoming.statusText ?? safeBase.statusText,
    }
}

export const mapAiExtractResultToWorkflow = (data: AiExtractResult): ProductWorkflowSnapshot => {
    const snapshot = emptySnapshot("ANALYZE_IMAGE")

    snapshot.aiExtract = data
    snapshot.extractedInfo = data.extractedInfo
    snapshot.mainImageUrl = data.imageUrl
    snapshot.name = data.extractedInfo?.name
    snapshot.brand = data.extractedInfo?.brand
    snapshot.category = data.extractedInfo?.category
    snapshot.barcode = data.extractedInfo?.barcode
    snapshot.rawOcrData = data.rawData

    snapshot.draft = {
        name: data.extractedInfo?.name,
        brand: data.extractedInfo?.brand,
        category: data.extractedInfo?.category,
        barcode: data.extractedInfo?.barcode,
        manufacturer: data.extractedInfo?.manufacturer,
        ingredients: data.extractedInfo?.ingredients,
        origin: data.extractedInfo?.origin,
        mainImageUrl: data.imageUrl,
        ocrConfidence: data.confidence,
    }

    return snapshot
}

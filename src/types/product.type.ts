export type ProductNutritionFacts = Record<string, string>

export type ProductSelectOption<T extends string | number = number> = {
    value: T
    label: string
}

export type ProductImageDto = {
    productImageId: string
    productId: string
    imageUrl: string
    createdAt: string
}

export type ProductBarcodeLookupInfoDto = {
    barcode: string
    productName: string
    brand: string
    category: string
    description: string
    imageUrl: string
    manufacturer: string
    weight: string
    ingredients: string[]
    nutritionFacts: ProductNutritionFacts
    country: string
    source: string
    confidence: number
    isVietnameseProduct: boolean
    gs1Prefix: string
    scanCount: number
    isVerified: boolean
}

export type ProductResponseDto = {
    productId: string
    supermarketId: string
    name: string
    brand: string
    category: string
    barcode: string
    isFreshFood: boolean
    type: number
    sku: string
    status: number
    weightTypeName: string
    originalPrice: number
    suggestedPrice: number
    finalPrice: number

    expiryDate?: string
    manufactureDate?: string
    daysToExpiry?: number
    pricingConfidence?: number
    pricingReasons?: string

    createdBy?: string
    createdAt?: string
    verifiedBy?: string
    verifiedAt?: string
    pricedBy?: string
    pricedAt?: string

    mainImageUrl?: string
    totalImages?: number
    productImages?: ProductImageDto[]

    ingredients?: string[]
    nutritionFacts?: ProductNutritionFacts
    barcodeLookupInfo?: ProductBarcodeLookupInfoDto | null

    // FE-safe optional fields:
    responsibleOrg?: string
    isFeatured?: boolean
    tags?: string[]
}

export type ProductDetailDto = {
    productId: string
    name: string
    description?: string
    brand?: string
    origin?: string
    weight?: string
    ingredients?: string[]
    usageInstructions?: string
    storageInstructions?: string
    manufactureDate?: string
    expiryDate?: string
    manufacturer?: string
    safetyWarning?: string
    distributor?: string
    nutritionFacts?: ProductNutritionFacts
    category?: string
    unitName?: string
    quantity?: number
    originalPrice?: number
    finalPrice?: number
    discountPercent?: number
    suggestedPrice?: number
    barcode?: string
    isFreshFood?: boolean
    status?: number
    supermarketName?: string
    mainImageUrl?: string
    totalImages?: number
    productImages?: ProductImageDto[]
    daysToExpiry?: number
    expiryStatus?: number
    expiryStatusText?: string

    // FE-safe optional fields:
    supermarketId?: string
    type?: number
    sku?: string
    responsibleOrg?: string
    isFeatured?: boolean
    tags?: string[]
}

export type ProductListResult = {
    items: ProductResponseDto[]
    totalResult: number
    page: number
    pageSize: number
}

export type GetProductsQuery = {
    pageNumber?: number
    pageSize?: number
}

export type GetMySupermarketProductsQuery = {
    searchTerm?: string
    category?: string
    pageNumber?: number
    pageSize?: number
}

export type UpdateProductDetailRequestDto = {
    brand: string
    ingredients: string
    nutritionFactsJson: string
    usageInstructions: string
    storageInstructions: string
    manufacturer: string
    origin: string
    description: string
    safetyWarnings: string
}

export type UpdateProductRequestDto = {
    supermarketId: string
    name: string
    categoryName: string
    barcode: string
    type: number
    sku: string
    status: number
    responsibleOrg: string
    isFeatured: boolean
    tags: string[]
    detail: UpdateProductDetailRequestDto
}

export type ProductEditFormValues = {
    supermarketId: string
    name: string
    categoryName: string
    barcode: string
    type: number
    sku: string
    status: number
    responsibleOrg: string
    isFeatured: boolean
    tagsText: string

    brand: string
    ingredientsText: string
    nutritionFactsText: string
    usageInstructions: string
    storageInstructions: string
    manufacturer: string
    origin: string
    description: string
    safetyWarnings: string
}

export const PRODUCT_STATUS_OPTIONS: ProductSelectOption<number>[] = [
    { value: 0, label: "Draft" },
    { value: 1, label: "Verified" },
    { value: 2, label: "Priced" },
    { value: 3, label: "Published" },
    { value: 4, label: "Expired" },
    { value: 5, label: "SoldOut" },
    { value: 6, label: "Hidden" },
    { value: 7, label: "Deleted" },
]

export const PRODUCT_TYPE_OPTIONS: ProductSelectOption<number>[] = [
    { value: 0, label: "Standard" },
    { value: 1, label: "Fresh" },
    { value: 2, label: "Frozen" },
    { value: 3, label: "Dry" },
    { value: 4, label: "Beverage" },
    { value: 5, label: "Other" },
]

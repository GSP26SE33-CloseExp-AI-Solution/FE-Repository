export type ProductNutritionFacts = Record<string, string>

export type ProductSelectOption<T extends string | number = number> = {
    value: T
    label: string
}

export type ProductStateValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export type ProductTypeValue = 0 | 1 | 2 | 3 | 4 | 5
export type ExpiryStatusValue = 1 | 2 | 3 | 4 | 5
export type ProductWeightTypeValue = 1 | 2

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
    type: ProductTypeValue
    sku: string
    status: ProductStateValue
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

    // Unit-safe optional fields
    unitId?: string | null
    unitName?: string | null
    unitType?: string | null
    unitSymbol?: string | null

    // FE-safe optional fields
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
    status?: ProductStateValue
    supermarketName?: string
    mainImageUrl?: string
    totalImages?: number
    productImages?: ProductImageDto[]
    daysToExpiry?: number
    expiryStatus?: ExpiryStatusValue
    expiryStatusText?: string

    // Unit-safe optional fields
    unitId?: string | null
    unitType?: string | null
    unitSymbol?: string | null

    // FE-safe optional fields
    supermarketId?: string
    type?: ProductTypeValue
    sku?: string
    weightTypeName?: string
    pricingConfidence?: number
    pricingReasons?: string
    responsibleOrg?: string
    isFeatured?: boolean
    tags?: string[]
    barcodeLookupInfo?: ProductBarcodeLookupInfoDto | null
    createdBy?: string
    createdAt?: string
    verifiedBy?: string
    verifiedAt?: string
    pricedBy?: string
    pricedAt?: string
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

export type ProductEditFormValues = {
    supermarketId: string
    name: string
    categoryName: string
    barcode: string
    type: ProductTypeValue
    sku: string
    status: ProductStateValue
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

export type ProductEnumOptionDto = {
    value: number
    name: string
    description: string
}

export type ProductUpdateDetailPayload = {
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

export type ProductUpdatePayload = {
    supermarketId: string
    name: string
    categoryName: string
    barcode: string
    type: ProductTypeValue
    sku: string
    status: ProductStateValue
    responsibleOrg?: string
    isFeatured?: boolean
    tags?: string[]
    detail: ProductUpdateDetailPayload
}

export const PRODUCT_STATUS_OPTIONS: ProductSelectOption<ProductStateValue>[] = [
    { value: 0, label: "Nháp" },
    { value: 1, label: "Đã xác minh" },
    { value: 2, label: "Đã định giá" },
    { value: 3, label: "Đang bán" },
    { value: 4, label: "Hết hạn" },
    { value: 5, label: "Hết hàng" },
    { value: 6, label: "Đã ẩn" },
    { value: 7, label: "Đã xóa" },
]

export const PRODUCT_TYPE_OPTIONS: ProductSelectOption<ProductTypeValue>[] = [
    { value: 0, label: "Thông thường" },
    { value: 1, label: "Tươi sống" },
    { value: 2, label: "Đông lạnh" },
    { value: 3, label: "Hàng khô" },
    { value: 4, label: "Đồ uống" },
    { value: 5, label: "Khác" },
]

export const PRODUCT_WEIGHT_TYPE_OPTIONS: ProductSelectOption<ProductWeightTypeValue>[] = [
    { value: 1, label: "Cố định" },
    { value: 2, label: "Theo khối lượng" },
]

export const EXPIRY_STATUS_OPTIONS: ProductSelectOption<ExpiryStatusValue>[] = [
    { value: 1, label: "Hết hạn hôm nay" },
    { value: 2, label: "Sắp hết hạn" },
    { value: 3, label: "Hạn ngắn" },
    { value: 4, label: "Hạn dài" },
    { value: 5, label: "Đã hết hạn" },
]

import type {
    ExpiryStatusValue,
    ProductNutritionFacts,
    ProductWeightTypeValue,
} from "./product.type"

export type ProductLotImageItem = {
    productImageId?: string
    productId?: string
    imageUrl: string
    createdAt?: string
}

export type ProductLotItem = {
    lotId: string
    productId: string
    expiryDate: string
    manufactureDate?: string | null
    quantity?: number | null
    weight?: number | null
    status?: string | null

    unitId?: string | null
    unitName?: string | null
    unitType?: string | null
    unitSymbol?: string | null

    originalUnitPrice?: number | null
    suggestedUnitPrice?: number | null
    finalUnitPrice?: number | null
    sellingUnitPrice?: number | null

    productName?: string | null
    brand?: string | null
    category?: string | null
    barcode?: string | null
    isFreshFood?: boolean | null

    supermarketId?: string | null
    supermarketName?: string | null

    mainImageUrl?: string | null
    totalImages?: number | null
    productImages?: ProductLotImageItem[] | null

    expiryStatus?: ExpiryStatusValue | null
    expiryStatusText?: string | null
    daysRemaining?: number | null
    hoursRemaining?: number | null

    // FE-safe optional fields
    daysToExpiry?: number | null
    ingredients?: string[] | null
    nutritionFacts?: ProductNutritionFacts | null

    createdAt?: string | null
    createdBy?: string | null
    publishedBy?: string | null
    publishedAt?: string | null
}

export type ProductLotListResult = {
    items: ProductLotItem[]
    totalResult: number
    page: number
    pageSize: number
}

export type GetMySupermarketLotsQuery = {
    expiryStatus?: ExpiryStatusValue
    weightType?: ProductWeightTypeValue
    isFreshFood?: boolean
    searchTerm?: string
    category?: string
    pageNumber?: number
    pageSize?: number
}

export type GetSupermarketLotsQuery = GetMySupermarketLotsQuery & {
    supermarketId: string
}

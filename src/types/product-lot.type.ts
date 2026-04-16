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
    originalUnitPrice?: number | null
    suggestedUnitPrice?: number | null
    finalUnitPrice?: number | null
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
    expiryStatus?: number | null
    daysRemaining?: number | null
    hoursRemaining?: number | null
    expiryStatusText?: string | null
    ingredients?: string[] | null
    nutritionFacts?: Record<string, string> | null
    createdAt?: string | null
    createdBy?: string | null
    publishedBy?: string | null
    publishedAt?: string | null
    sellingUnitPrice?: number | null
}

export type ProductLotListResult = {
    items: ProductLotItem[]
    totalResult: number
    page: number
    pageSize: number
}

export type GetMySupermarketLotsQuery = {
    expiryStatus?: number
    weightType?: number
    isFreshFood?: boolean
    searchTerm?: string
    category?: string
    pageNumber?: number
    pageSize?: number
}

export type GetSupermarketLotsQuery = GetMySupermarketLotsQuery & {
    supermarketId: string
}

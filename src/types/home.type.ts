export type HomeProductLotApiItem = {
    lotId: string
    productId: string
    productName?: string
    productImageUrl?: string | null
    productImagePreSignedUrl?: string | null
    barcode?: string
    brand?: string
    supermarketId: string
    supermarketName?: string
    unitId?: string
    unitName?: string
    unitType?: string
    unitSymbol?: string
    conversionRate?: number
    productUnitId?: string
    productUnitName?: string
    productUnitType?: string
    productUnitSymbol?: string
    productConversionRate?: number
    quantity?: number
    weight?: number
    status?: string
    manufactureDate?: string
    expiryDate?: string
    createdAt?: string
    publishedBy?: string
    publishedAt?: string
    originalUnitPrice?: number
    suggestedUnitPrice?: number
    finalUnitPrice?: number
    sellingUnitPrice?: number
    daysRemaining?: number
    hoursRemaining?: number

    categoryId?: string
    categoryName?: string
    productCategory?: string
    category?: string | HomeProductCategoryRef | null
    categoryRef?: HomeProductCategoryRef | null

    isFreshFood?: boolean
    mainImageUrl?: string
    productImages?: Array<{
        productImageId: string
        productId: string
        imageUrl: string
        createdAt: string
    }>
}

export type HomeProductLotsResponse = {
    success: boolean
    message: string
    data?: {
        items?: HomeProductLotApiItem[]
        totalResult?: number
        page?: number
        pageSize?: number
    }
    errors?: string[] | null
}

export type HomeProductView = {
    lotId: string
    productId: string
    supermarketId: string
    supermarketName: string
    name: string
    brand: string
    subtitle: string
    category: string
    categoryId?: string
    originalPrice: number
    price: number
    discountLabel: string
    timeLeft: string
    imageUrl?: string
    preSignedImageUrl?: string
    imageVariant?: "milk" | "bread" | "beef" | "avocado"
    isFreshFood: boolean
    daysToExpiry: number | null
    hoursRemaining: number | null
    quantity: number

    unitId?: string
    unitName?: string
    unitType?: string
    unitSymbol?: string
    conversionRate?: number
    productUnitId?: string
    productUnitName?: string
    productUnitType?: string
    productUnitSymbol?: string
    productConversionRate?: number
}

export type HomeProductGroupView = {
    productId: string
    name: string
    brand: string
    subtitle: string
    category: string
    categoryId?: string
    imageUrl?: string
    preSignedImageUrl?: string
    imageVariant?: "milk" | "bread" | "beef" | "avocado"
    isFreshFood: boolean

    minPrice: number
    maxPrice: number
    originalMinPrice: number
    originalMaxPrice: number
    discountLabel: string

    totalQuantity: number
    supermarketCount: number
    supermarketNames: string[]
    unitNames: string[]

    nearestExpiryDate?: string
    nearestDaysToExpiry: number | null
    nearestHoursRemaining: number | null
    timeLeft: string

    lots: HomeProductView[]
    rawLots: HomeProductLotApiItem[]
}

export type HomeStatCard = {
    icon: "meals" | "co2" | "stores"
    title: string
    value: string
    note: string
}

export type HomeCategoryItem = {
    value: string
    label: string
    count: number
}

export type HomeProductCategoryRef = {
    categoryId?: string
    name?: string
    isFreshFood?: boolean
    parentCatId?: string | null
    parentName?: string | null
    description?: string | null
    catIconUrl?: string | null
    isActive?: boolean
}

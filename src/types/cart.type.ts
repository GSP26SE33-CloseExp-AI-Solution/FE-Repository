export type ApiCartItem = {
    cartItemId: string
    lotId: string
    purchaseUnitId?: string | null
    purchaseUnitName?: string | null
    purchaseUnitSymbol?: string | null
    productId: string
    productName: string
    productImageUrl?: string | null
    productImagePreSignedUrl?: string | null
    supermarketId: string
    supermarketName?: string | null
    unitId: string
    unitName?: string | null
    unitSymbol?: string | null
    conversionRate?: number
    productUnitId: string
    productUnitName?: string | null
    productUnitSymbol?: string | null
    productConversionRate?: number
    expiryDate: string
    quantity: number
    unitPrice: number
    lineTotal: number
}

export type ApiCart = {
    cartId: string
    userId: string
    totalItems: number
    totalAmount: number
    updatedAt: string
    items: ApiCartItem[]
}

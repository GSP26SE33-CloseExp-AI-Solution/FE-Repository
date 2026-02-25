export interface ProductLotUI {
    lotId: string
    productId: string

    productName: string
    brand: string
    category: string
    imageUrl: string

    lotCode: string
    barcode?: string

    expiryDate: string
    manufactureDate: string
    quantity: number
    unitName: string

    originalPrice: number
    salePrice: number
    suggestedPrice?: number

    // Product workflow status: Draft, Verified, PriceConfirmed, Published
    productStatus?: string
}


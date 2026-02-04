export interface ProductDraft {
    id: string
    images: string[]

    name: string
    brand: string
    category: string
    barcode: string

    origin?: string
    unit?: string
    qty?: number | null

    description?: string
    ingredients?: string
    usage?: string
    storage?: string
    warning?: string

    manufactureDate?: string
    expiry?: string
    shelfLife?: string

    originalPrice?: number | null
    salePrice?: number | null
}

export interface Product extends ProductDraft {
    createdAt: string
}

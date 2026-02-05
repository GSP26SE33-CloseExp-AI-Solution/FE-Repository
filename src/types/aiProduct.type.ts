export enum ProductState {
    Draft = 0,
    Verified = 1,
    Priced = 2,
    Published = 3,
    Expired = 4,
    SoldOut = 5,
    Hidden = 6,
    Deleted = 7,
}

export interface ProductImage {
    productImageId: string
    productId: string
    imageUrl: string
    uploadedAt: string
}

export interface NutritionFacts {
    [key: string]: string
}

export interface BarcodeLookupInfo {
    barcode: string
    productName: string
    brand: string
    category: string
    description: string
    imageUrl: string
    manufacturer: string
    weight: string
    ingredients: string
    nutritionFacts: NutritionFacts
    country: string
    source: string
    confidence: number
    isVietnameseProduct: boolean
    gs1Prefix: string
    scanCount: number
    isVerified: boolean
}

export interface Product {
    productId: string
    supermarketId: string

    name: string
    brand: string
    category: string
    barcode: string

    isFreshFood: boolean
    status: ProductState

    weightType: number
    weightTypeName: string
    defaultPricePerKg: number

    originalPrice: number
    suggestedPrice: number
    finalPrice: number

    expiryDate?: string | null
    manufactureDate?: string | null
    daysToExpiry: number

    ocrConfidence: number
    pricingConfidence: number
    pricingReasons?: string | null

    createdBy: string
    createdAt: string
    verifiedBy?: string
    verifiedAt?: string
    pricedBy?: string
    pricedAt?: string

    mainImageUrl?: string | null
    totalImages: number
    productImages: ProductImage[]

    ingredients?: string | null
    nutritionFacts?: NutritionFacts | null
    barcodeLookupInfo?: BarcodeLookupInfo
}

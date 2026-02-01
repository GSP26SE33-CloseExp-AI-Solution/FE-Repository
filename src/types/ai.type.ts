export interface AiScanResponse {
    productName?: string;
    brand?: string;
    barcode?: string;
    suggestedCategory?: string;
    suggestedShelfLifeDays?: number;
    storageRecommendation?: string;
    usageInstructions?: string;
    ingredients?: string[];
    weight?: string;
    origin?: string;
    warnings?: string[];
    certifications?: string[];
    qualityStandards?: string[];

    expiryDate?: string;
    manufacturedDate?: string;

    nutritionFacts?: Record<string, string>;

    manufacturerInfo?: {
        name?: string;
        distributor?: string;
        address?: string;
        contact?: string[];
    };

    productCodes?: {
        sku?: string;
        batch?: string;
    };

    vietnameseBarcodeInfo?: {
        barcode?: string;
        company?: string;
        category?: string;
    };

    isVietnameseProduct?: boolean;
}

export interface AiPricingResponse {
    success: boolean;
    errorMessage?: string;

    suggestedPrice: number;
    minPrice: number;
    maxPrice: number;
    discountPercent: number;

    confidence: number;
    urgencyLevel: "LOW" | "MEDIUM" | "HIGH";
    recommendedAction: string;

    daysToExpire: number;
    originalPrice: number;
    category: string;

    processingTimeMs: number;
}
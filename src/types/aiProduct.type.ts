export interface Product {
    productId: string;
    supermarketId: string;

    name: string;
    brand: string;
    category: string;
    barcode: string;

    originalPrice: number;
    salePrice: number;
    suggestedPrice: number;
    finalPrice: number;

    expiryDate: string;
    manufactureDate: string;
    daysToExpiry: number | null;

    status: number;

    isFreshFood: boolean;
    weightType: number;
    weightTypeName: string;

    ocrConfidence: number;
    pricingConfidence: number;
    pricingReasons: string[] | null;

    mainImageUrl: string | null;
    productImages: string[];
    totalImages: number;

    createdAt: string;
    createdBy: string;

    verifiedAt: string | null;
    verifiedBy: string | null;

    pricedAt: string | null;
    pricedBy: string | null;

    defaultPricePerKg: number | null;
}

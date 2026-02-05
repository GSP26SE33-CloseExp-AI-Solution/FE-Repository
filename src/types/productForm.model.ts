import { BarcodeLookupInfo } from "./aiProduct.type";
import { ProductImage } from "./productImage.type";

export interface ProductFormModel {
    // identity
    productId: string;
    supermarketId: string;

    // AI nhận diện
    barcode: string;
    name: string;
    brand: string;
    category: string;
    isFreshFood: boolean;

    // dates & price
    originalPrice: number;
    expiryDate: string | null;
    manufactureDate: string | null;

    // text fields (UI dùng textarea)
    ingredients: string | null;
    nutritionFacts: string | null;

    // images từ BE
    productImages: ProductImage[];

    // trạng thái
    status: number;

    // AI meta
    ocrConfidence?: number;
    pricingConfidence?: number;
    pricingReasons?: string[];

    // barcode lookup (debug / gợi ý)
    barcodeLookupInfo?: BarcodeLookupInfo;
}

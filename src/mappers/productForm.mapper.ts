import { Product } from "@/types/aiProduct.type";
import { ProductFormModel } from "@/types/productForm.model";

/**
 * BE → UI FORM
 * Ưu tiên dữ liệu từ barcodeLookupInfo (AI nhận diện)
 */
export const productToForm = (product: Product): ProductFormModel => {
    return {
        productId: product.productId,
        supermarketId: product.supermarketId,

        name:
            product.barcodeLookupInfo?.productName?.trim() ||
            product.name ||
            "",

        brand:
            product.barcodeLookupInfo?.brand?.trim() ||
            product.brand ||
            "",

        category:
            product.barcodeLookupInfo?.category?.trim() ||
            product.category ||
            "",

        barcode: product.barcode ?? "",

        isFreshFood: product.isFreshFood ?? false,

        originalPrice: product.originalPrice ?? 0,
        expiryDate: product.expiryDate ?? null,
        manufactureDate: product.manufactureDate ?? null,

        ingredients: product.ingredients ?? null,
        nutritionFacts: product.nutritionFacts
            ? JSON.stringify(product.nutritionFacts, null, 2)
            : null,

        productImages: product.productImages ?? [],
        status: product.status,

        // giữ lại cho UI hiển thị / debug
        barcodeLookupInfo: product.barcodeLookupInfo ?? undefined,
        ocrConfidence: product.ocrConfidence ?? undefined,
        // finalPrice: product.finalPrice ?? undefined,
    };
};

/**
 * UI FORM → BE
 * Chỉ gửi những field BE cần khi verify
 */
export const formToProduct = (form: ProductFormModel): Product => {
    return {
        productId: form.productId,
        supermarketId: form.supermarketId,

        name: form.name,
        brand: form.brand,
        category: form.category,
        barcode: form.barcode,

        isFreshFood: form.isFreshFood,

        originalPrice: form.originalPrice,
        expiryDate: form.expiryDate,
        manufactureDate: form.manufactureDate,

        ingredients: form.ingredients,
        nutritionFacts: form.nutritionFacts,

        productImages: form.productImages,
        status: form.status,
    } as Product;
};

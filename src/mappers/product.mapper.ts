import { ProductLotUI } from "@/types/productLotUI.type"

const mapStatus = (status: number): string => {
    switch (status) {
        case 0: return "Draft"
        case 1: return "Verified"
        case 2: return "PriceConfirmed"
        case 3: return "Published"
        default: return "Unknown"
    }
}

export const mapProductsToLotsUI = (products: any[]): ProductLotUI[] => {
    if (!Array.isArray(products)) return []

    return products.map((product) => {
        const imageUrl =
            product.mainImageUrl ||
            product.productImages?.[0]?.imageUrl ||
            "https://via.placeholder.com/60x60?text=No+Image"

        return {
            lotId: product.productId,
            productId: product.productId,

            productName: product.name,
            brand: product.brand,
            category: product.category,
            imageUrl,

            lotCode: "P" + product.productId.substring(0, 4), // Placeholder code
            barcode: product.barcode,

            expiryDate: product.expiryDate || new Date(2099, 11, 31).toISOString(), // Fallback to future date
            manufactureDate: product.manufactureDate,
            quantity: 0, // No quantity info in product
            unitName: product.weightTypeName || "",

            originalPrice: product.originalPrice,
            salePrice: product.finalPrice || product.suggestedPrice || 0,
            suggestedPrice: product.suggestedPrice,
            productStatus: mapStatus(product.status),
        }
    })
}

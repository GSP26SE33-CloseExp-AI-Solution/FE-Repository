import { ProductLotUI } from "@/types/productLotUI.type"

export const mapProductsToLotsUI = (products: any[]): ProductLotUI[] => {
    if (!Array.isArray(products)) return []

    return products.flatMap((product) => {
        const imageUrl =
            product.productImages?.[0]?.imageUrl ||
            "https://via.placeholder.com/60x60?text=No+Image"

        if (!product.productLots?.length) return []

        return product.productLots.map((lot: any) => ({
            lotId: lot.lotId,
            productId: product.productId,

            productName: product.name,
            brand: product.brand,
            category: product.category,
            imageUrl,

            lotCode: lot.lotCode,
            barcode: product.barcode,

            expiryDate: lot.expiryDate,
            manufactureDate: lot.manufactureDate,
            quantity: lot.quantity,
            unitName: lot.unit?.name || "",

            originalPrice: lot.originalUnitPrice,
            salePrice: lot.finalUnitPrice,
            suggestedPrice: lot.suggestedUnitPrice,
        }))
    })
}

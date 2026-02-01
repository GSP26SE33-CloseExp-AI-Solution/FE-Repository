import { Product } from "@/types/product.type"

export const mapProductApiToUI = (p: any): Product => {
    const expiryDate = p.expiryDate || new Date().toISOString()

    return {
        id: p.productId ?? crypto.randomUUID(),
        name: p.name ?? "Unknown Product",
        brand: p.brand ?? "No brand",
        category: p.category ?? "Other",
        origin: p.origin ?? "Vietnam",
        expiry: expiryDate,
        qty: p.quantity ?? 0,
        originalPrice: p.originalPrice ?? 0,
        salePrice: p.finalPrice ?? p.suggestedPrice ?? 0,
        image: p.productImages?.[0]?.imageUrl ?? "/no-image.png",

        sku: "",
        barcode: "",
        description: "",
        unit: "",
        manufactureDate: "",
        shelfLife: "",
        weight: "",
        ingredients: "",
        usage: "",
        storage: "",
        manufacturer: "",
        warning: "",
        organization: "",

        createdAt: p.createdAt ?? new Date().toISOString(),
    }
}

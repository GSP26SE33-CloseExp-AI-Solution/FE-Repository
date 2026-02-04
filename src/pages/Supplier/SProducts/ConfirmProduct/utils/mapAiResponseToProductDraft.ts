import { ProductDraft } from "@/types/product.type";
import { AiScanResponse } from "@/types/ai.type";

/* ================= HELPERS ================= */

const toText = (v?: string | string[]) =>
    Array.isArray(v) ? v.join(", ") : v ?? "";

const formatDate = (iso?: string) => {
    if (!iso) return "";
    return iso.slice(0, 10); // yyyy-mm-dd for input[type=date]
};

const mapNutritionToDescription = (facts?: Record<string, string>) => {
    if (!facts) return "";
    return Object.entries(facts)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
};

/* ================= MAIN MAPPER ================= */

export function mapAiResponseToProductDraft(
    ai: AiScanResponse,
    image: string
): ProductDraft {
    const barcode =
        ai.barcode ||
        ai.vietnameseBarcodeInfo?.barcode ||
        "";

    const manufacturerCombined = [
        ai.manufacturerInfo?.name,
        ai.manufacturerInfo?.address,
        ai.manufacturerInfo?.contact?.join(", "),
    ]
        .filter(Boolean)
        .join(" - ");

    const distributor = ai.manufacturerInfo?.distributor ?? "";

    const certifications = [
        ...(ai.certifications ?? []),
        ...(ai.qualityStandards ?? []),
    ].join(", ");

    return {
        id: crypto.randomUUID(),
        image,

        sku: ai.productCodes?.sku ?? barcode,
        barcode,

        name: ai.productName ?? "",
        description: mapNutritionToDescription(ai.nutritionFacts),
        category:
            ai.suggestedCategory ||
            ai.vietnameseBarcodeInfo?.category ||
            "",

        brand: ai.brand ?? "",
        origin: ai.isVietnameseProduct ? "Việt Nam" : ai.origin ?? "",

        unit: "Gói",
        qty: null,

        manufactureDate: formatDate(ai.manufacturedDate),
        expiry: formatDate(ai.expiryDate),
        shelfLife: ai.suggestedShelfLifeDays
            ? `${ai.suggestedShelfLifeDays} ngày`
            : "",

        weight: ai.weight ?? "",
        ingredients: toText(ai.ingredients),
        usage: toText(ai.usageInstructions),
        storage: toText(ai.storageRecommendation),

        manufacturer: manufacturerCombined,
        organization: distributor,

        warning: toText(ai.warnings),

        /** Giá sẽ do siêu thị nhập hoặc AI Pricing xử lý sau */
        originalPrice: null,
        salePrice: null,
    };
}

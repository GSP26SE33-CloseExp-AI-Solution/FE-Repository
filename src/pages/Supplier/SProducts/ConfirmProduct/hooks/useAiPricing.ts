import { useState } from "react";
import { ProductDraft } from "@/types/product.type";
import { AiPricingResponse } from "@/types/aiPricing.types";

export const useAiPricing = (product: ProductDraft) => {
    const [priceSuggestion, setPriceSuggestion] =
        useState<AiPricingResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchAiPrice = async () => {
        setLoading(true);

        const payload = {
            category: product.category,
            brand: product.brand,
            originalPrice: product.originalPrice ?? 0,
            expiryDate: new Date(product.expiry).toISOString(),
        };

        const res = await fetch("/api/AI/pricing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data: AiPricingResponse = await res.json();

        if (data.success) {
            setPriceSuggestion(data);
        }

        setLoading(false);
    };

    return { priceSuggestion, loading, fetchAiPrice };
};

import { useState } from "react";
import { Product } from "@/types/aiProduct.type";
import { AiPricingResponse } from "@/types/aiPricing.types";

export const useAiPricing = (product: Product) => {
    const [priceSuggestion, setPriceSuggestion] =
        useState<AiPricingResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchAiPrice = async () => {
        if (!product.expiryDate) {
            throw new Error("expiryDate is required for AI pricing");
        }

        setLoading(true);

        const payload = {
            category: product.category,
            brand: product.brand,
            originalPrice: product.originalPrice ?? 0,
            expiryDate: new Date(product.expiryDate).toISOString(),
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

import { useState } from "react";
import { fakeAiPrice } from "@/mocks/fakeAiPrice.mock";
import { PriceSuggestion } from "../types/priceSuggestion.types";
import { ProductDraft } from "@/mocks/fakeProducts.mock";

export const useAiPricing = (product: ProductDraft) => {
    const [priceSuggestion, setPriceSuggestion] =
        useState<PriceSuggestion | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchAiPrice = async () => {
        setLoading(true);

        await new Promise((r) => setTimeout(r, 800));

        const result = fakeAiPrice();
        setPriceSuggestion(result);

        setLoading(false);
    };

    return { priceSuggestion, loading, fetchAiPrice };
};

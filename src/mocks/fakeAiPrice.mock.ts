import { PriceSuggestion } from "@/pages/Supermarket/SProducts/ConfirmProduct/types/priceSuggestion.types";

export const fakeAiPrice = (): PriceSuggestion => {
    return {
        suggestedPrice: 12000,
        marketMin: 9000,
        marketMax: 15000,
        performance: {
            competitiveness: 0.72,
            expectedSellRate: "High",
        },
    };
};

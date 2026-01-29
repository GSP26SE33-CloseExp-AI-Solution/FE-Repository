export interface PriceSuggestion {
    suggestedPrice: number;
    marketMin: number;
    marketMax: number;
    performance: {
        competitiveness: number; // 0 -> 1
        expectedSellRate: "Low" | "Medium" | "High";
    };
}

export const calcCompetitiveness = (
    salePrice: number,
    marketMin: number,
    marketMax: number,
    suggestedPrice: number
) => {
    if (!salePrice || !marketMin || !marketMax) return 0.5;

    // nếu trong market range
    if (salePrice >= marketMin && salePrice <= marketMax) {
        const center = (marketMin + marketMax) / 2;
        const diff = Math.abs(salePrice - center);
        const maxDiff = (marketMax - marketMin) / 2;

        // càng gần trung tâm market càng cạnh tranh
        return Math.max(0.6, 1 - diff / maxDiff);
    }

    // nếu thấp hơn marketMin → cạnh tranh cao
    if (salePrice < marketMin) {
        const diff = marketMin - salePrice;
        const ratio = diff / marketMin;
        return Math.min(1, 0.8 + ratio);
    }

    // nếu cao hơn marketMax → cạnh tranh giảm mạnh
    if (salePrice > marketMax) {
        const diff = salePrice - marketMax;
        const ratio = diff / marketMax;
        return Math.max(0.05, 0.6 - ratio);
    }

    return 0.5;
};

export const calcSellRate = (competitiveness: number): "Low" | "Medium" | "High" => {
    if (competitiveness >= 0.75) return "High";
    if (competitiveness >= 0.45) return "Medium";
    return "Low";
};

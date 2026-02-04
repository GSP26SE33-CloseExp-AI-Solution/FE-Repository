export const calcCompetitiveness = (
    price: number,
    min: number,
    max: number
) => {
    if (price == null || min == null || max == null) return 0;
    if (max <= min) return 50;

    const score = ((max - price) / (max - min)) * 100;
    return Math.max(0, Math.min(100, Math.round(score)));
};

export const calcSellRate = (urgency: string, discount: number) => {
    const urgencyScore =
        urgency === "HIGH" ? 90 :
        urgency === "MEDIUM" ? 60 :
        urgency === "LOW" ? 30 : 50;

    return Math.max(0, Math.min(100, Math.round(urgencyScore + discount / 2)));
};

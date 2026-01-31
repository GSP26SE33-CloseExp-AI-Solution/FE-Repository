export interface MarketPriceItem {
    supermarket: string;
    price: number;
    discountPercent: number;
    quantity: number;
}

export interface AiPricingExplain {
    suggestedPrice: number;
    competitiveness: number; // 0 - 1
    expectedSellRate: number; // %
    timeToSell: string;
    reasons: string[];
    marketPrices: MarketPriceItem[];
}

import { AiPricingExplain } from "@/pages/Supermarket/SProducts/ConfirmProduct/components/AiPricingDetail/types/aiPricingDetail.types";

export const mockAiPricingExplain: AiPricingExplain = {
    suggestedPrice: 40000,
    competitiveness: 0.82,
    expectedSellRate: 78,
    timeToSell: "1 tuần",
    reasons: [
        "Giá nằm gần mức trung bình thị trường",
        "Độ cạnh tranh cao so với đối thủ",
        "Phù hợp với lượng tồn kho hiện tại",
        "Tối ưu khả năng bán ra trong ngắn hạn"
    ],
    marketPrices: [
        {
            supermarket: "Co.opmart",
            price: 42000,
            discountPercent: 20,
            quantity: 30,
        },
        {
            supermarket: "WinMart",
            price: 40000,
            discountPercent: 24,
            quantity: 20,
        },
        {
            supermarket: "AEON",
            price: 39000,
            discountPercent: 18,
            quantity: 15,
        },
        {
            supermarket: "Bach Hoa Xanh",
            price: 45000,
            discountPercent: 10,
            quantity: 40,
        },
    ],
};

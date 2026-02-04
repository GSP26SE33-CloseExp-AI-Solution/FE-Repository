import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { AiPricingResponse } from "@/types/aiPricing.types";
import PriceCompare from "./PriceCompare";
import PerformanceBar from "./PerformanceBar";
import PriceAdjustInput from "./PriceAdjustInput";
import { calcCompetitiveness, calcSellRate } from "../../utils/aiPricing";

interface Props {
    data: AiPricingResponse;
    salePrice: number;
    onChangePrice: (price: number) => void;
}

const PriceSuggestionPanel: React.FC<Props> = ({
    data,
    salePrice,
    onChangePrice,
}) => {
    const navigate = useNavigate();

    const competitiveness = useMemo(() => {
        return calcCompetitiveness(
            salePrice,
            data.minPrice,
            data.maxPrice
        );
    }, [salePrice, data.minPrice, data.maxPrice]);

    const sellRate = useMemo(() => {
        return calcSellRate(
            data.urgencyLevel,
            data.discountPercent
        );
    }, [data.urgencyLevel, data.discountPercent]);

    return (
        <div className="p-4 border rounded-lg bg-blue-50 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">🤖 AI đề xuất giá</h3>

                <button
                    onClick={() => navigate(`/supplier/products/${data.category}/ai-pricing`)}
                    className="text-xs text-gray-500 hover:text-blue-600 transition"
                >
                    Xem phân tích chi tiết
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <p>
                    Giá AI đề xuất:{" "}
                    <span className="font-bold text-blue-600">
                        {data.suggestedPrice.toLocaleString()} đ
                    </span>
                </p>

                <PerformanceBar
                    label="Mức độ cạnh tranh giá"
                    value={competitiveness}
                />
            </div>

            <PriceCompare
                suggested={data.suggestedPrice}
                min={data.minPrice}
                max={data.maxPrice}
                current={salePrice}
            />

            <PriceAdjustInput
                value={salePrice}
                suggested={data.suggestedPrice}
                onChange={onChangePrice}
            />

            <PerformanceBar
                label="Khả năng bán dự kiến"
                value={sellRate}
            />

            <div className="text-sm text-gray-600">
                ⏳ Còn {data.daysToExpire} ngày trước khi hết hạn
            </div>

            <div className="text-sm text-orange-600 font-medium">
                📌 Khuyến nghị: {data.recommendedAction}
            </div>
        </div>
    );
};

export default PriceSuggestionPanel;

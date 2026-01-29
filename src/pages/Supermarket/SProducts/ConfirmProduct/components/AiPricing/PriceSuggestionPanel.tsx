import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { PriceSuggestion } from "../../types/priceSuggestion.types";
import PriceCompare from "./PriceCompare";
import PerformanceBar from "./PerformanceBar";
import PriceAdjustInput from "./PriceAdjustInput";
import { calcCompetitiveness, calcSellRate } from "../../utils/aiPricing";

interface Props {
    data: PriceSuggestion;
    salePrice: number;
    onChangePrice: (price: number) => void;
}

const PriceSuggestionPanel: React.FC<Props> = ({
    data,
    salePrice,
    onChangePrice,
}) => {

    // tính competitiveness theo giá hiện tại
    const competitiveness = useMemo(() => {
        return calcCompetitiveness(
            salePrice,
            data.marketMin,
            data.marketMax,
            data.suggestedPrice
        );
    }, [salePrice, data]);

    // tính tỷ lệ bán dự kiến
    const sellRate = useMemo(() => {
        return calcSellRate(competitiveness);
    }, [competitiveness]);

    const navigate = useNavigate();

    return (
        <div className="p-4 border rounded-lg bg-blue-50 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">🤖 AI đề xuất giá</h3>

                <button
                    onClick={() => navigate(`/supermarket/products/1/ai-pricing`)}
                    className="text-xs text-gray-500 hover:text-blue-600 transition"
                >
                    xem chi tiết →
                </button>
            </div>

            <div className="flex items-center justify-between gap-4">
                <p>
                    Giá AI đề xuất:{" "}
                    <span className="font-bold text-blue-600">
                        {data.suggestedPrice.toLocaleString()} đ
                    </span>
                </p>

                <PerformanceBar value={competitiveness} />
            </div>

            <PriceCompare
                suggested={data.suggestedPrice}
                min={data.marketMin}
                max={data.marketMax}
                current={salePrice}
            />

            <PriceAdjustInput
                value={salePrice}
                suggested={data.suggestedPrice}
                onChange={onChangePrice}
            />

            <p className="text-sm text-gray-700">
                📈 Dự đoán khả năng bán:{" "}
                <span className="font-semibold">
                    {sellRate === "High" && "Cao"}
                    {sellRate === "Medium" && "Trung bình"}
                    {sellRate === "Low" && "Thấp"}
                </span>
            </p>
        </div>
    );
};

export default PriceSuggestionPanel;

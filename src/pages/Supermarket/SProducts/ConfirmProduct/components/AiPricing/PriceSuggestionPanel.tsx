import React, { useMemo } from "react";
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

    // ✅ tính competitiveness theo giá hiện tại
    const competitiveness = useMemo(() => {
        return calcCompetitiveness(
            salePrice,
            data.marketMin,
            data.marketMax,
            data.suggestedPrice
        );
    }, [salePrice, data]);

    // ✅ tính tỷ lệ bán dự kiến
    const sellRate = useMemo(() => {
        return calcSellRate(competitiveness);
    }, [competitiveness]);

    return (
        <div className="p-4 border rounded-lg bg-blue-50 space-y-4">
            <h3 className="font-semibold text-lg">🤖 AI đề xuất giá</h3>

            <div className="flex items-center justify-between gap-4">
                <p>
                    Giá AI đề xuất:{" "}
                    <span className="font-bold text-blue-600">
                        {data.suggestedPrice.toLocaleString()} đ
                    </span>
                </p>

                {/* ✅ giữ PerformanceBar như bạn muốn */}
                <PerformanceBar value={competitiveness} />
            </div>

            {/* ✅ giữ nguyên nùi so sánh giá */}
            <PriceCompare
                suggested={data.suggestedPrice}
                min={data.marketMin}
                max={data.marketMax}
                current={salePrice}
            />

            {/* ✅ input chỉnh giá */}
            <PriceAdjustInput
                value={salePrice}
                suggested={data.suggestedPrice}
                onChange={onChangePrice}
            />

            {/* ✅ thêm sellRate nếu muốn show */}
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

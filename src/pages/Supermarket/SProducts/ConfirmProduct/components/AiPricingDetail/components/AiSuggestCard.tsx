import { mockAiPricingExplain } from "../../../../../../../mocks/fakeMarketPrices.mock";
import AiReasonList from "./AiReasonList";

const AiSuggestCard = () => {
    const data = mockAiPricingExplain;

    return (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">

            {/* Header */}
            <div className="bg-green-50 p-4 space-y-2">
                <h3 className="text-xl font-semibold">
                    🤖 Đề xuất từ AI
                </h3>

                <p className="text-3xl font-bold text-green-700">
                    {data.suggestedPrice.toLocaleString()} VND
                </p>

                <div className="flex justify-between text-sm text-gray-700">
                    <span>Cơ hội bán ra: {data.expectedSellRate}%</span>
                    <span className="px-2 py-1 bg-green-100 rounded">
                        {data.timeToSell}
                    </span>
                </div>

                <div className="text-sm">
                    Mức cạnh tranh:{" "}
                    <span className="font-semibold">
                        {(data.competitiveness * 100).toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-green-50 border rounded text-green-700 text-sm">
                        Lý do đề xuất
                    </span>

                    <button className="px-3 py-1 bg-green-700 text-white rounded text-sm hover:bg-green-800 transition">
                        Áp dụng giá
                    </button>
                </div>

                <AiReasonList reasons={data.reasons} />
            </div>
        </div>
    );
};

export default AiSuggestCard;

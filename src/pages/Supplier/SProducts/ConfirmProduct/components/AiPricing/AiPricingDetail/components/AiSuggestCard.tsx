import AiReasonList from "./AiReasonList";
import { AiPricingResponse } from "@/types/aiPricing.types"

interface Props {
    pricing: AiPricingResponse | null;
    loading: boolean;
    onApplyPrice?: (price: number) => void;
}

const AiSuggestCard = ({ pricing, loading, onApplyPrice }: Props) => {
    if (loading) {
        return (
            <div className="border rounded-xl overflow-hidden bg-white shadow-sm p-6">
                Đang phân tích giá bằng AI...
            </div>
        );
    }

    if (!pricing) return null;

    return (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">

            {/* Header */}
            <div className="bg-green-50 p-4 space-y-2">
                <h3 className="text-xl font-semibold">
                    🤖 Đề xuất từ AI
                </h3>

                <p className="text-3xl font-bold text-green-700">
                    {pricing.suggestedPrice.toLocaleString() ?? "--"} đ
                </p>

                <div className="flex justify-between text-sm text-gray-700">
                    <span>
                        Cơ hội bán ra:{" "}
                        {Math.min(100, Math.round((pricing.confidence ?? 0) * 100))}%
                    </span>

                    <span className="px-2 py-1 bg-green-100 rounded">
                        {pricing.urgencyLevel}
                    </span>
                </div>

                <div className="text-sm">
                    Mức cạnh tranh:{" "}
                    <span className="font-semibold">
                        {pricing.discountPercent}%
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-green-50 border rounded text-green-700 text-sm">
                        Lý do đề xuất
                    </span>

                    <button
                        onClick={() =>
                            onApplyPrice?.(pricing.suggestedPrice)
                        }
                        className="px-3 py-1 bg-green-700 text-white rounded text-sm hover:bg-green-800 transition"
                    >
                        Áp dụng giá
                    </button>
                </div>

                {/* BE chưa có reasons chi tiết → dùng recommendedAction tạm */}
                <AiReasonList reasons={[pricing.recommendedAction]} />
            </div>

            {/* Confidence */}
            <div className="px-4 pb-2">
                <p className="text-3xl font-bold text-green-600">
                    {pricing.suggestedPrice.toLocaleString() ?? "--"} đ
                </p>

                <p className="text-sm text-gray-500">
                    AI tự tin {Math.round(pricing.confidence * 100)}%
                </p>
            </div>

            {/* Bảng so sánh giá */}
            <div className="px-4 pb-4">
                <table className="w-full text-sm">
                    <tbody>
                        <tr>
                            <td>Khoảng giá hợp lý</td>
                            <td className="text-right">
                                {pricing.minPrice.toLocaleString()} đ -{" "}
                                {pricing.maxPrice.toLocaleString()} đ
                            </td>
                        </tr>
                        <tr>
                            <td>Mức giảm đề xuất</td>
                            <td className="text-right">
                                {pricing.discountPercent}%
                            </td>
                        </tr>
                        <tr>
                            <td>Số ngày còn lại</td>
                            <td className="text-right">
                                {pricing.daysToExpire} ngày
                            </td>
                        </tr>
                        <tr>
                            <td>Hành động khuyến nghị</td>
                            <td className="text-right font-semibold text-orange-600">
                                {pricing.recommendedAction}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default AiSuggestCard;

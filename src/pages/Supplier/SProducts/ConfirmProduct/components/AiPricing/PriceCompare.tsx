import React from "react";

interface PriceCompareProps {
    suggested: number;
    min: number;
    max: number;
    current: number;
}

const PriceCompare: React.FC<PriceCompareProps> = ({
    suggested,
    min,
    max,
    current,
}) => {
    const diff = current - suggested;
    const diffPercent = suggested === 0 ? 0 : ((diff / suggested) * 100).toFixed(1);

    const getDiffColor = () => {
        if (diff === 0) return "text-gray-600";
        return diff > 0 ? "text-red-600" : "text-green-600";
    };

    const getMarketStatus = () => {
        if (current < min) return "Giá thấp hơn thị trường";
        if (current > max) return "Giá cao hơn thị trường";
        return "Giá nằm trong vùng thị trường";
    };

    return (
        <div className="border rounded-lg p-3 bg-white space-y-2">
            <h4 className="font-medium text-gray-800">
                📊 So sánh giá
            </h4>

            <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Giá thị trường</p>
                    <p className="font-semibold">
                        {min.toLocaleString()} - {max.toLocaleString()} đ
                    </p>
                </div>

                <div>
                    <p className="text-gray-500">Giá AI đề xuất</p>
                    <p className="font-semibold text-blue-600">
                        {suggested.toLocaleString()} đ
                    </p>
                </div>

                <div>
                    <p className="text-gray-500">Giá hiện tại</p>
                    <p className={`font-semibold ${getDiffColor()}`}>
                        {current.toLocaleString()} đ
                    </p>
                </div>
            </div>

            <div className="text-xs space-y-1">
                <p className="text-gray-500">
                    📌 {getMarketStatus()}
                </p>

                <p className={getDiffColor()}>
                    {diff === 0
                        ? "Giá đang trùng với đề xuất của AI"
                        : diff > 0
                            ? `Cao hơn AI: +${diff.toLocaleString()} đ (${diffPercent}%)`
                            : `Thấp hơn AI: ${diff.toLocaleString()} đ (${diffPercent}%)`}
                </p>
            </div>
        </div>
    );
};

export default PriceCompare;

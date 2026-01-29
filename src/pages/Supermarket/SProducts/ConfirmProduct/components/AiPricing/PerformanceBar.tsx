import React from "react";

interface Props {
    value: number; // 0 -> 1
}

const getColor = (percent: number) => {
    if (percent >= 80) return "bg-green-500";
    if (percent >= 60) return "bg-yellow-500";
    if (percent >= 40) return "bg-orange-500";
    return "bg-red-500";
};

const PerformanceBar: React.FC<Props> = ({ value }) => {
    const percent = Math.round(value * 100);

    return (
        <div className="w-full space-y-1">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor(percent)} transition-all`}
                    style={{ width: `${percent}%` }}
                />
            </div>

            <p className="text-xs text-gray-600">
                Hiệu suất bán dự kiến: {percent}%
            </p>
        </div>
    );
};

export default PerformanceBar;

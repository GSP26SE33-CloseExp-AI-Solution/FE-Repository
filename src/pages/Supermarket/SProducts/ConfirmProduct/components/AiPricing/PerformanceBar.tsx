import React from "react";

interface Props {
    value: number; // 0 -> 100
    label?: string;
}

const getColor = (percent: number) => {
    if (percent >= 80) return "bg-green-500";
    if (percent >= 60) return "bg-yellow-500";
    if (percent >= 40) return "bg-orange-500";
    return "bg-red-500";
};

const getStatusText = (percent: number) => {
    if (percent >= 85) return "Bán cực nhanh";
    if (percent >= 70) return "Bán tốt";
    if (percent >= 50) return "Bán ổn";
    if (percent >= 30) return "Bán hơi chậm";
    return "Khó bán";
};

const PerformanceBar: React.FC<Props> = ({ value, label }) => {
    const percent = Math.max(0, Math.min(100, Math.round(value)));

    return (
        <div className="w-full space-y-1">
            {label && (
                <div className="flex justify-between text-xs text-gray-600">
                    <span>{label}</span>
                    <span className="font-medium">{getStatusText(percent)}</span>
                </div>
            )}

            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor(percent)} transition-all duration-500 ease-out`}
                    style={{ width: `${percent}%` }}
                />
            </div>

            <p className="text-xs text-gray-600">
                Hiệu suất dự kiến:{" "}
                <span className="font-semibold">{percent}%</span>
            </p>
        </div>
    );
};

export default PerformanceBar;

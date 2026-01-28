import React from "react";

const ExpiryLegend: React.FC = () => {
    return (
        <div className="px-5 py-4 bg-white">
            <div className="text-sm font-semibold text-gray-700 mb-3">
                Chú thích trạng thái hạn sử dụng
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        Còn dài hạn
                    </span>
                    <span className="text-gray-600">≥ 8 ngày</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                        Còn ngắn hạn
                    </span>
                    <span className="text-gray-600">3 – 7 ngày</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                        Sắp hết hạn
                    </span>
                    <span className="text-gray-600">1 – 2 ngày</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                        Trong ngày
                    </span>
                    <span className="text-gray-600">Hết hạn hôm nay</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                        Hết hạn
                    </span>
                    <span className="text-gray-600">Đã quá hạn</span>
                </div>
            </div>
        </div>
    );
};

export default ExpiryLegend;

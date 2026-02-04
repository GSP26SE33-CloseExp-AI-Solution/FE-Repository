import { useMemo, useState } from "react";
import { AiPricingResponse } from "@/types/aiPricing.types";

import MarketCompareRow from "./MarketCompareRow";
import MarketFilterBar from "./MarketFilterBar";
import MarketSortSelect from "./MarketSortSelect";

interface Props {
    pricing: AiPricingResponse | null;
    loading: boolean;
}

interface MarketItem {
    supermarket: string;
    price: number;
    discountPercent: number;
    quantity: number;
}

const MarketCompareTable: React.FC<Props> = ({ pricing, loading }) => {
    const [keyword, setKeyword] = useState("");
    const [sort, setSort] = useState("price-asc");

    /*
     Tạm thời dựng data dựa trên khoảng giá AI
     */
    const data: MarketItem[] = useMemo(() => {
        if (!pricing) return [];

        const baseList: MarketItem[] = [
            {
                supermarket: "Giá tối thiểu AI",
                price: pricing.minPrice,
                discountPercent: pricing.discountPercent,
                quantity: 120,
            },
            {
                supermarket: "Giá đề xuất AI",
                price: pricing.suggestedPrice,
                discountPercent: pricing.discountPercent,
                quantity: 80,
            },
            {
                supermarket: "Giá tối đa AI",
                price: pricing.maxPrice,
                discountPercent: pricing.discountPercent - 5,
                quantity: 60,
            },
        ];

        let list = [...baseList];

        if (keyword) {
            list = list.filter((item) =>
                item.supermarket.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        switch (sort) {
            case "price-asc":
                list.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                list.sort((a, b) => b.price - a.price);
                break;
            case "discount-desc":
                list.sort((a, b) => b.discountPercent - a.discountPercent);
                break;
            case "quantity-desc":
                list.sort((a, b) => b.quantity - a.quantity);
                break;
        }

        return list;
    }, [pricing, keyword, sort]);

    return (
        <div className="border rounded-xl bg-white overflow-hidden">

            {/* Header */}
            <div className="p-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                    So sánh giá thị trường
                </h3>

                <div className="flex gap-2">
                    <MarketFilterBar
                        keyword={keyword}
                        onChange={setKeyword}
                    />
                    <MarketSortSelect
                        value={sort}
                        onChange={setSort}
                    />
                </div>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-4 bg-gray-100 text-center font-medium py-3 text-sm">
                <div>Siêu thị</div>
                <div>Giá (VND)</div>
                <div>% Giảm giá</div>
                <div>Số lượng</div>
            </div>

            {/* Rows */}
            {loading && (
                <div className="p-6 text-center text-gray-400 text-sm">
                    Đang phân tích dữ liệu thị trường...
                </div>
            )}

            {!loading && data.map((item, idx) => (
                <MarketCompareRow key={idx} item={item} />
            ))}

            {!loading && data.length === 0 && (
                <div className="p-6 text-center text-gray-400 text-sm">
                    Không có dữ liệu so sánh
                </div>
            )}
        </div>
    );
};

export default MarketCompareTable;

import { useMemo, useState } from "react";
import { mockAiPricingExplain } from "../../../../../../../mocks/fakeMarketPrices.mock";
import MarketCompareRow from "./MarketCompareRow";
import MarketFilterBar from "./MarketFilterBar";
import MarketSortSelect from "./MarketSortSelect";

const MarketCompareTable = () => {
    const [keyword, setKeyword] = useState("");
    const [sort, setSort] = useState("price-asc");

    const data = useMemo(() => {
        let list = [...mockAiPricingExplain.marketPrices];

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
    }, [keyword, sort]);

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
            {data.map((item, idx) => (
                <MarketCompareRow key={idx} item={item} />
            ))}
        </div>
    );
};

export default MarketCompareTable;

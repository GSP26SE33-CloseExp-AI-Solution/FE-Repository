import { MarketPriceItem } from "../types/aiPricingDetail.types";

interface Props {
    item: MarketPriceItem;
}

const MarketCompareRow: React.FC<Props> = ({ item }) => {
    return (
        <div className="grid grid-cols-4 text-center py-3 border-t hover:bg-gray-50 transition">
            <div className="font-medium">{item.supermarket}</div>
            <div>{item.price.toLocaleString()}</div>
            <div>{item.discountPercent}%</div>
            <div>{item.quantity}</div>
        </div>
    );
};

export default MarketCompareRow;

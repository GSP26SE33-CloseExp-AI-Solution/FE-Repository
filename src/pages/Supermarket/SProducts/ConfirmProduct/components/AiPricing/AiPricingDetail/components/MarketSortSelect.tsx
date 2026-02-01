interface Props {
    value: string;
    onChange: (value: string) => void;
}

const MarketSortSelect: React.FC<Props> = ({ value, onChange }) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
        >
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
            <option value="discount-desc">Giảm giá nhiều nhất</option>
            <option value="quantity-desc">Số lượng nhiều nhất</option>
        </select>
    );
};

export default MarketSortSelect;

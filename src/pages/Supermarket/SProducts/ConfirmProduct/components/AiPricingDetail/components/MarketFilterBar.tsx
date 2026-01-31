interface Props {
    keyword: string;
    onChange: (value: string) => void;
}

const MarketFilterBar: React.FC<Props> = ({ keyword, onChange }) => {
    return (
        <input
            value={keyword}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Tìm siêu thị..."
            className="border rounded px-3 py-1 text-sm w-60"
        />
    );
};

export default MarketFilterBar;

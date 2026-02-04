interface PriceAdjustInputProps {
    value: number;
    suggested: number;
    onChange: (value: number) => void;
}

const PriceAdjustInput: React.FC<PriceAdjustInputProps> = ({
    value,
    suggested,
    onChange,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (!isNaN(val)) {
            onChange(val);
        }
    };

    return (
        <div className="border rounded-lg p-3 bg-white space-y-2">
            <h4 className="font-medium text-gray-800">
                💰 Điều chỉnh giá bán
            </h4>

            <div className="flex items-center gap-3">
                <input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">đ</span>
            </div>

            <div className="text-xs text-gray-500 flex justify-between">
                <span>AI đề xuất: {suggested.toLocaleString()} đ</span>
                <button
                    onClick={() => onChange(suggested)}
                    className="text-blue-600 hover:underline"
                >
                    Dùng giá do AI đề xuất
                </button>
            </div>
        </div>
    );
};

export default PriceAdjustInput;

const ProductInfoCard = () => {
    return (
        <div className="border rounded-xl p-4 flex gap-4 bg-white">
            <img
                src="https://via.placeholder.com/120"
                alt="product"
                className="w-28 h-28 rounded-lg object-cover"
            />

            <div className="flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-semibold">
                        Sữa tươi Vinamilk 1L
                    </h3>
                    <p className="text-sm text-gray-500">
                        SKU: MILK-001
                    </p>
                </div>

                <div className="text-sm space-y-1">
                    <p>Giá nhập: 32,000 VND</p>
                    <p>Giá bán hiện tại: 53,000 VND</p>
                    <p>Tồn kho: 125 sản phẩm</p>
                </div>
            </div>
        </div>
    );
};

export default ProductInfoCard;

const AddProductHeader = () => {
    return (
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                    Thêm sản phẩm mới
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Tải lên hình ảnh để AI nhận diện thông tin sản phẩm và hỗ trợ tạo dữ liệu nhanh chóng.
                </p>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                <span className="px-3 py-1 rounded-full bg-gray-100 border">
                    AI Smart Scan
                </span>
            </div>
        </div>
    );
};

export default AddProductHeader;

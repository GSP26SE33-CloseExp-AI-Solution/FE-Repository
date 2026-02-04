import React, { ChangeEvent } from "react";
import { Search, Plus, ChevronDown } from "lucide-react";

export interface ProductsTopBarProps {
    keyword: string;
    searchType: string;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSearchTypeChange: (value: string) => void;
    onAddProduct: () => void;
}

const ProductsTopBar: React.FC<ProductsTopBarProps> = ({
    keyword,
    searchType,
    onSearchChange,
    onSearchTypeChange,
    onAddProduct,
}) => {
    return (
        <div className="flex items-center gap-5 mb-6">
            {/* SEARCH INPUT */}
            <div className="flex items-center flex-1 h-[50px] bg-white border border-gray-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-green-600 overflow-hidden">
                {/* SEARCH TYPE DROPDOWN */}
                <div className="relative h-full">
                    <select
                        value={searchType}
                        onChange={(e) => onSearchTypeChange(e.target.value)}
                        className="appearance-none h-full pl-4 pr-10 text-[15px] bg-gray-50 border-r border-gray-200 outline-none text-gray-700"
                    >
                        <option>Tất cả</option>
                        <option>Tên sản phẩm</option>
                        <option>Phân loại</option>
                        <option>Thương hiệu</option>
                        <option>Xuất xứ</option>
                    </select>
                    <ChevronDown
                        size={18}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                </div>

                {/* SEARCH ICON */}
                <Search className="text-green-700 mx-3" size={20} />

                {/* INPUT */}
                <input
                    type="text"
                    placeholder="Nhập từ khóa tìm kiếm..."
                    value={keyword}
                    onChange={onSearchChange}
                    className="w-full h-full outline-none text-[18px] text-gray-600 font-light pr-4"
                />
            </div>

            {/* BUTTON ADD PRODUCT */}
            <button
                type="button"
                onClick={onAddProduct}
                className="flex items-center justify-center gap-3 w-[200px] h-[50px] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
                <span className="text-[20px] font-semibold">
                    Thêm sản phẩm
                </span>
                <Plus size={26} />
            </button>
        </div>
    );
};

export default ProductsTopBar;

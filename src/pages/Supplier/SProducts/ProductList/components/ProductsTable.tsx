import React from "react"
import { ChevronDown } from "lucide-react"
import ProductRow from "./ProductRow"
import { ProductLotUI } from "@/types/productLotUI.type"

interface ProductsTableProps {
    lots: ProductLotUI[]
    expiryFilter: string
    onExpiryFilterChange: (value: string) => void

    formatDate: (date: string) => string
    formatPrice: (price: number) => string
    calcDiscount: (original: number, sale: number) => number
    getExpiryStatus: (expiry: string) => { label: string; color: string }
    getDaysLeft: (expiry: string) => number
}

const ProductsTable: React.FC<ProductsTableProps> = ({
    lots,
    expiryFilter,
    onExpiryFilterChange,
    formatDate,
    formatPrice,
    calcDiscount,
    getExpiryStatus,
    getDaysLeft,
}) => {
    return (
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden rounded-t-lg">
            <div className="bg-[#F5F5F5] border-b border-gray-200 h-[70px] flex items-center justify-between px-5">
                <h2 className="text-[24px] font-bold text-gray-900">Danh sách sản phẩm</h2>

                <div className="relative w-[200px] h-[50px] mr-[20px]">
                    <select
                        value={expiryFilter}
                        onChange={(e) => onExpiryFilterChange(e.target.value)}
                        className="appearance-none w-full h-full bg-white border border-gray-200 rounded-lg pl-4 pr-12 text-[18px]"
                    >
                        <option>Tất cả</option>
                        <option>Còn dài hạn</option>
                        <option>Còn ngắn hạn</option>
                        <option>Sắp hết hạn</option>
                        <option>Trong ngày</option>
                        <option>Hết hạn</option>
                    </select>
                    <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
            </div>

            <div className="grid grid-cols-[90px_2.2fr_110px_140px_130px_120px_140px_150px_110px] bg-[#F5F5F5] border-b border-gray-200 px-5 h-[64px] items-center text-[15px] font-semibold text-gray-700">
                <div>Hình ảnh</div>
                <div>Thông tin sản phẩm</div>
                <div className="text-center">Số lượng</div>
                <div className="text-center">Hạn sử dụng</div>
                <div className="text-center">Giá gốc</div>
                <div className="text-center">Giảm giá</div>
                <div className="text-center">Giá bán</div>
                <div className="text-center">Trạng thái</div>
                <div className="text-center">Action</div>
            </div>

            {lots.map((lot) => (
                <ProductRow
                    key={lot.lotId}
                    lot={lot}
                    formatDate={formatDate}
                    formatPrice={formatPrice}
                    calcDiscount={calcDiscount}
                    getExpiryStatus={getExpiryStatus}
                    getDaysLeft={getDaysLeft}
                />
            ))}
        </div>
    )
}

export default ProductsTable

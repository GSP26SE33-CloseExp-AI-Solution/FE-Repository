import React from "react"
import { Eye, Pencil } from "lucide-react"
import { ProductLotUI } from "@/types/productLotUI.type"

interface ProductRowProps {
    lot: ProductLotUI
    formatDate: (date: string) => string
    formatPrice: (price: number) => string
    calcDiscount: (original: number, sale: number) => number
    getExpiryStatus: (expiry: string) => { label: string; color: string }
    getDaysLeft: (expiry: string) => number
}

const ProductRow: React.FC<ProductRowProps> = ({
    lot,
    formatDate,
    formatPrice,
    calcDiscount,
    getExpiryStatus,
    getDaysLeft,
}) => {
    const status = getExpiryStatus(lot.expiryDate)
    const daysLeft = getDaysLeft(lot.expiryDate)

    const discount =
        lot.originalPrice && lot.salePrice
            ? calcDiscount(lot.originalPrice, lot.salePrice)
            : 0

    return (
        <div className="grid grid-cols-[90px_2.2fr_110px_140px_130px_120px_140px_150px_110px] items-center h-[76px] border-b border-gray-100 px-5 text-[15px] hover:bg-gray-50 transition">
            <div>
                <img src={lot.imageUrl} className="w-14 h-14 object-cover rounded-md border" alt={lot.productName} />
            </div>

            <div className="leading-tight">
                <p className="font-semibold text-gray-900">{lot.productName}</p>
                <p className="text-gray-500 text-sm">{lot.brand}</p>
                <p className="text-gray-400 text-xs">Lô: {lot.lotCode} • {lot.unitName}</p>
            </div>

            <div className="text-center font-medium">{lot.quantity}</div>

            <div className="text-center">
                <div>{formatDate(lot.expiryDate)}</div>
                <div className="text-xs text-gray-500 mt-1">
                    {daysLeft > 0 ? `Còn ${daysLeft} ngày` : `Hết hạn ${Math.abs(daysLeft)} ngày`}
                </div>
            </div>

            <div className="text-center text-gray-400 line-through">{formatPrice(lot.originalPrice)}</div>

            <div className="text-center text-red-600 font-semibold">-{discount}%</div>

            <div className="text-center font-semibold text-green-700">{formatPrice(lot.salePrice)}</div>

            <div className="text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                    {status.label}
                </span>
            </div>

            <div className="flex justify-center gap-4">
                <button className="text-gray-500 hover:text-blue-600"><Eye size={20} /></button>
                <button className="text-gray-500 hover:text-green-600"><Pencil size={20} /></button>
            </div>
        </div>
    )
}

export default ProductRow

import React from "react"
import { Eye, Pencil, DollarSign, Rocket } from "lucide-react"
import { ProductLotUI } from "@/types/productLotUI.type"

interface ProductRowProps {
    lot: ProductLotUI
    formatDate: (date: string) => string
    formatPrice: (price: number) => string
    calcDiscount: (original: number, sale: number) => number
    getExpiryStatus: (expiry: string) => { label: string; color: string }
    getDaysLeft: (expiry: string) => number
    onConfirmPrice?: (lot: ProductLotUI) => void
    onPublish?: (lot: ProductLotUI) => void
}

const ProductRow: React.FC<ProductRowProps> = ({
    lot,
    formatDate,
    formatPrice,
    calcDiscount,
    getExpiryStatus,
    getDaysLeft,
    onConfirmPrice,
    onPublish,
}) => {
    const daysLeft = getDaysLeft(lot.expiryDate)

    const discount =
        lot.originalPrice && lot.salePrice
            ? calcDiscount(lot.originalPrice, lot.salePrice)
            : 0

    // Get product workflow status styling
    const getStatusStyle = (productStatus?: string) => {
        switch (productStatus?.toLowerCase()) {
            case "draft":
                return "bg-gray-100 text-gray-600"
            case "verified":
                return "bg-blue-100 text-blue-700"
            case "priceconfirmed":
                return "bg-amber-100 text-amber-700"
            case "published":
                return "bg-green-100 text-green-700"
            default:
                return "bg-gray-100 text-gray-600"
        }
    }

    const getStatusLabel = (productStatus?: string) => {
        switch (productStatus?.toLowerCase()) {
            case "draft":
                return "Nháp"
            case "verified":
                return "Đã xác minh"
            case "priceconfirmed":
                return "Đã định giá"
            case "published":
                return "Đang bán"
            default:
                return productStatus || "N/A"
        }
    }

    const isVerified = lot.productStatus?.toLowerCase() === "verified"
    const isPriceConfirmed = lot.productStatus?.toLowerCase() === "priceconfirmed"

    return (
        <div className="grid grid-cols-[90px_2.2fr_110px_140px_130px_120px_140px_150px_140px] items-center h-[76px] border-b border-gray-100 px-5 text-[15px] hover:bg-gray-50 transition">
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
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(lot.productStatus)}`}>
                    {getStatusLabel(lot.productStatus)}
                </span>
            </div>

            <div className="flex justify-center gap-2">
                <button
                    className="text-gray-500 hover:text-blue-600 p-1"
                    title="Xem chi tiết"
                >
                    <Eye size={18} />
                </button>
                <button
                    className="text-gray-500 hover:text-green-600 p-1"
                    title="Chỉnh sửa"
                >
                    <Pencil size={18} />
                </button>

                {/* Show Confirm Price button for Verified products */}
                {isVerified && onConfirmPrice && (
                    <button
                        onClick={() => onConfirmPrice(lot)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                        title="Xác nhận giá"
                    >
                        <DollarSign size={14} />
                        Định giá
                    </button>
                )}

                {/* Show Publish button for PriceConfirmed products */}
                {isPriceConfirmed && onPublish && (
                    <button
                        onClick={() => onPublish(lot)}
                        className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-medium rounded-lg transition-all"
                        title="Công khai bán"
                    >
                        <Rocket size={14} />
                        Công khai
                    </button>
                )}
            </div>
        </div>
    )
}

export default ProductRow

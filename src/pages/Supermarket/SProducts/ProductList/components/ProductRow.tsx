import React from "react";
import { Eye, Pencil } from "lucide-react";

export interface Product {
    id: string;
    image: string;
    name: string;
    description: string;
    category: string;
    brand: string;
    origin: string;
    unit: string;
    qty: number;
    manufactureDate: string;
    expiry: string;
    shelfLife: string;
    weight: string;
    ingredients: string;
    usage: string;
    storage: string;
    manufacturer: string;
    warning: string;
    organization: string;
    originalPrice: number;
    salePrice: number;
}

/* ===== PROPS ===== */
interface ProductRowProps {
    product: Product;
    formatDate: (date: string) => string;
    formatPrice: (price: number) => string;
    calcDiscount: (original: number, sale: number) => number;
    getExpiryStatus: (expiry: string) => {
        label: string;
        color: string;
    };
    getDaysLeft: (expiry: string) => number;
}

const ProductRow: React.FC<ProductRowProps> = ({
    product,
    formatDate,
    formatPrice,
    calcDiscount,
    getExpiryStatus,
    getDaysLeft,
}) => {
    const status = getExpiryStatus(product.expiry);
    const discount = calcDiscount(product.originalPrice, product.salePrice);

    return (
        <div className="grid grid-cols-[90px_2.2fr_110px_140px_130px_120px_140px_150px_110px] items-center h-[76px] border-b border-gray-100 px-5 text-[15px] hover:bg-gray-50 transition">
            {/* IMAGE */}
            <div>
                <img
                    src={product.image}
                    className="w-14 h-14 object-cover rounded-md border"
                />
            </div>

            {/* PRODUCT INFO */}
            <div className="leading-tight">
                <p className="font-semibold text-gray-900">
                    {product.name}
                </p>
                <p className="text-gray-500 text-sm">
                    {product.description} • {product.brand}
                </p>
                <p className="text-gray-400 text-xs">
                    {product.category} • {product.unit}
                </p>
            </div>

            {/* QTY */}
            <div className="text-center font-medium">
                {product.qty}
            </div>

            {/* EXPIRY */}
            <div className="text-center">
                <div>{formatDate(product.expiry)}</div>
                <div className="text-xs text-gray-500 mt-1">
                    Còn lại {getDaysLeft(product.expiry)} ngày
                </div>
            </div>

            {/* ORIGINAL PRICE */}
            <div className="text-center text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
            </div>

            {/* DISCOUNT */}
            <div className="text-center text-red-600 font-semibold">
                -{discount}%
            </div>

            {/* SALE PRICE */}
            <div className="text-center font-semibold text-green-700">
                {formatPrice(product.salePrice)}
            </div>

            {/* STATUS */}
            <div className="text-center">
                <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
                >
                    {status.label}
                </span>
            </div>

            {/* ACTION */}
            <div className="flex justify-center gap-4">
                <button className="text-gray-500 hover:text-blue-600">
                    <Eye size={20} />
                </button>
                <button className="text-gray-500 hover:text-green-600">
                    <Pencil size={20} />
                </button>
            </div>
        </div>
    );
};

export default ProductRow;

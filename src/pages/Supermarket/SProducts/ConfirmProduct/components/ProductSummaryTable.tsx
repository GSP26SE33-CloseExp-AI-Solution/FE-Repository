import React from "react";
import { ProductDraft } from "../../../../../mocks/fakeProducts.mock";

interface Props {
    product: ProductDraft;
    price: number;
}

const ProductSummaryTable: React.FC<Props> = ({ product, price }) => {
    const rows = Object.entries({
        "Tên sản phẩm": product.name,
        "Danh mục": product.category,
        "Thương hiệu": product.brand || "Chưa có mô tả chi tiết",
        "Xuất xứ": product.origin || "Chưa có mô tả chi tiết",
        "Số lượng": product.qty,
        "Giá bán": price.toLocaleString() + " đ",
        "Hạn sử dụng": product.expiry,
        "Mô tả": product.description || "Chưa có mô tả chi tiết",
    });

    return (
        <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">
                📋 Xác nhận thông tin sản phẩm
            </h3>

            <table className="w-full text-sm border">
                <tbody>
                    {rows.map(([label, value]) => (
                        <tr key={label} className="border-t">
                            <td className="p-2 font-medium w-1/3 bg-gray-100">
                                {label}
                            </td>
                            <td className="p-2">{value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductSummaryTable;

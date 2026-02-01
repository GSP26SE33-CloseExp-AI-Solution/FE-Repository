import { ProductDraft } from "@/types/product.type";

interface Props {
    product: ProductDraft;
}

const ProductInfoCard: React.FC<Props> = ({ product }) => {
    return (
        <div className="border rounded-xl bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-lg font-semibold">Thông tin sản phẩm</h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div><b>Tên:</b> {product.name}</div>
                <div><b>Thương hiệu:</b> {product.brand}</div>
                <div><b>Danh mục:</b> {product.category}</div>
                <div><b>Xuất xứ:</b> {product.origin}</div>
                <div><b>Số lượng tồn kho:</b> {product.storage}</div>
                <div><b>HSD:</b> {product.expiry}</div>
                <div><b>Giá gốc:</b> {product.originalPrice?.toLocaleString()} đ</div>
            </div>
        </div>
    );
};

export default ProductInfoCard;

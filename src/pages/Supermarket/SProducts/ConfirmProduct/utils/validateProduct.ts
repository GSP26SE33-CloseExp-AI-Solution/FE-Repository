import { ProductDraft } from "@/types/product.type";

export const REQUIRED_FIELDS: (keyof ProductDraft)[] = [
    "name",          // Tên sản phẩm
    "category",      // Danh mục
    "unit",          // Đơn vị
    "qty",           // Số lượng
    "originalPrice", // Giá gốc
    "salePrice",     // Giá bán
    "expiry",        // Hạn sử dụng
];

export function validateProduct(product: ProductDraft) {
    const missingFields = REQUIRED_FIELDS.filter((key) => {
        const value = product[key];

        // riêng qty & price: phải là số > 0
        if (key === "qty" || key === "originalPrice" || key === "salePrice") {
            return typeof value !== "number" || value <= 0;
        }

        return value === "" || value === null || value === undefined;
    });

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

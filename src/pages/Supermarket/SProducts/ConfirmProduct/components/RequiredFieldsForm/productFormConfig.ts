import { ProductDraft } from "../../../../../../mocks/fakeProducts.mock";

export type Field = {
    label: string;
    key: keyof ProductDraft;
    required?: boolean;
    textarea?: boolean;
    type?: "text" | "number";
};

export const sections: { title: string; fields: Field[] }[] = [
    {
        title: "Mã & nhận diện",
        fields: [
            { label: "SKU", key: "sku" },
            { label: "Barcode", key: "barcode" },
        ],
    },
    {
        title: "Thông tin cơ bản",
        fields: [
            { label: "Tên sản phẩm", key: "name", required: true },
            { label: "Mô tả", key: "description", textarea: true },
            { label: "Phân loại sản phẩm", key: "category", required: true },
            { label: "Thương hiệu", key: "brand" },
            { label: "Xuất xứ", key: "origin" },
            { label: "Đơn vị", key: "unit", required: true },
            { label: "Số lượng", key: "qty", type: "number", required: true },
        ],
    },
    {
        title: "Thành phần & bảo quản",
        fields: [
            { label: "Khối lượng", key: "weight" },
            { label: "Thành phần", key: "ingredients", textarea: true },
            { label: "Hướng dẫn sử dụng", key: "usage" },
            { label: "Hướng dẫn bảo quản", key: "storage" },
            { label: "Cảnh báo an toàn", key: "warning" },
        ],
    },
    {
        title: "Hạn sử dụng",
        fields: [
            { label: "Ngày sản xuất", key: "manufactureDate" },
            { label: "Hạn sử dụng", key: "expiry", required: true },
            { label: "Hạn dùng mô tả", key: "shelfLife" },
        ],
    },
    {
        title: "Đơn vị chịu trách nhiệm",
        fields: [
            { label: "Nhà sản xuất", key: "manufacturer" },
            { label: "Tổ chức chịu trách nhiệm", key: "organization" },
        ],
    },
    {
        title: "Giá",
        fields: [
            {
                label: "Giá gốc (₫)",
                key: "originalPrice",
                required: true,
                type: "number",
            },
            {
                label: "Giá bán (₫)",
                key: "salePrice",
                required: true,
                type: "number",
            },
        ],
    },
];
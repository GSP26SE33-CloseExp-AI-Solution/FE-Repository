import { Product } from "@/types/aiProduct.type";

export interface Field {
    key: keyof Product;
    label: string;
    required?: boolean;
    type?: "text" | "number" | "date";
}

export interface Section {
    title: string;
    fields: Field[];
}

export const sections: Section[] = [
    {
        title: "Thông tin cơ bản",
        fields: [
            { key: "name", label: "Tên sản phẩm", required: true },
            { key: "brand", label: "Thương hiệu" },
            { key: "category", label: "Danh mục", required: true },
            { key: "barcode", label: "Mã vạch", required: true },
        ],
    },
    {
        title: "Giá & hạn sử dụng",
        fields: [
            {
                key: "originalPrice",
                label: "Giá gốc",
                required: true,
                type: "number",
            },
            {
                key: "salePrice",
                label: "Giá bán đề xuất",
                type: "number",
            },
            {
                key: "expiryDate",
                label: "Hạn sử dụng",
                required: true,
                type: "date",
            },
            {
                key: "manufactureDate",
                label: "Ngày sản xuất",
                type: "date",
            },
        ],
    },
    {
        title: "Thông tin bổ sung",
        fields: [
            { key: "weightTypeName", label: "Loại khối lượng" },
            {
                key: "defaultPricePerKg",
                label: "Giá mặc định / Kg",
                type: "number",
            },
            { key: "isFreshFood", label: "Thực phẩm tươi" },
        ],
    },
];




// import { ProductDraft } from "@/types/product.type";

// export type Field = {
//     label: string;
//     key: keyof ProductDraft;
//     required?: boolean;
//     textarea?: boolean;
//     type?: "text" | "number" | "date";
// };

// export const sections: { title: string; fields: Field[] }[] = [
//     {
//         title: "Mã & nhận diện",
//         fields: [
//             { label: "SKU", key: "sku" },
//             { label: "Barcode", key: "barcode" },
//         ],
//     },
//     {
//         title: "Thông tin cơ bản",
//         fields: [
//             { label: "Tên sản phẩm", key: "name", required: true },
//             { label: "Mô tả", key: "description", textarea: true },
//             { label: "Phân loại sản phẩm", key: "category", required: true },
//             { label: "Thương hiệu", key: "brand" },
//             { label: "Xuất xứ", key: "origin" },
//             { label: "Đơn vị", key: "unit", required: true },
//             { label: "Số lượng", key: "qty", type: "number", required: true },
//         ],
//     },
//     {
//         title: "Thành phần & bảo quản",
//         fields: [
//             { label: "Khối lượng", key: "weight" },
//             { label: "Thành phần", key: "ingredients", textarea: true },
//             { label: "Hướng dẫn sử dụng", key: "usage" },
//             { label: "Hướng dẫn bảo quản", key: "storage" },
//             { label: "Cảnh báo an toàn", key: "warning" },
//         ],
//     },
//     {
//         title: "Hạn sử dụng",
//         fields: [
//             { label: "Ngày sản xuất", key: "manufactureDate", type: "date" },
//             { label: "Hạn sử dụng", key: "expiry", required: true, type: "date" },
//             { label: "Hạn dùng mô tả", key: "shelfLife" },
//         ],
//     },
//     {
//         title: "Đơn vị chịu trách nhiệm",
//         fields: [
//             { label: "Nhà sản xuất", key: "manufacturer" },
//             { label: "Tổ chức chịu trách nhiệm", key: "organization" },
//         ],
//     },
//     {
//         title: "Giá",
//         fields: [
//             {
//                 label: "Giá gốc (₫)",
//                 key: "originalPrice",
//                 required: true,
//                 type: "number",
//             },
//             {
//                 label: "Giá bán (₫)",
//                 key: "salePrice",
//                 required: true,
//                 type: "number",
//             },
//         ],
//     },
// ];
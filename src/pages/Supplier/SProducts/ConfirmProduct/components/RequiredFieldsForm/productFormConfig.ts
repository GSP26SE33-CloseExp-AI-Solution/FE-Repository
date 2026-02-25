import { ProductFormModel } from "@/types/productForm.model";

export interface Field {
    key: keyof ProductFormModel;
    label: string;
    required?: boolean;
    type?: "text" | "number" | "date" | "textarea" | "boolean" | "select";
    editable?: boolean;
    options?: { label: string; value: string }[];
    format?: "currency" | "date";
}

export interface Section {
    title: string;
    fields: Field[];
    confidenceKey?: keyof ProductFormModel;
}

export const sections: Section[] = [
    {
        title: "AI nhận diện sản phẩm",
        confidenceKey: "ocrConfidence",
        fields: [
            { key: "barcode", label: "Mã vạch", editable: true },
            { key: "name", label: "Tên sản phẩm", required: true, editable: true },
            { key: "brand", label: "Thương hiệu", required: true, editable: true },
            {
                key: "category",
                label: "Danh mục",
                required: true,
                editable: true,
                type: "select",
                options: [
                    { label: "Thực phẩm tươi", value: "Fresh Food" },
                    { label: "Thực phẩm khô", value: "Dry Food" },
                    { label: "Đồ uống", value: "Beverages" },
                    { label: "Gia vị", value: "Spices" },
                    { label: "Bánh kẹo", value: "Snacks" },
                    { label: "Đông lạnh", value: "Frozen Food" },
                    { label: "Khác", value: "Other" },
                ],
            },
            { key: "isFreshFood", label: "Thực phẩm tươi", type: "boolean", editable: true },
        ],
    },
    {
        title: "Thông tin chi tiết",
        fields: [
            { key: "ingredients", label: "Thành phần thức ăn", type: "textarea", editable: true },
            { key: "nutritionFacts", label: "Thành phần  dinh dưỡng", type: "textarea", editable: true },
        ],
    },
    {
        title: "Thông tin cần xác nhận",
        fields: [
            { key: "originalPrice", label: "Giá gốc", type: "number", required: true, editable: true, format: "currency", },
            { key: "expiryDate", label: "Hạn sử dụng", type: "date", required: true, editable: true, },
            { key: "manufactureDate", label: "Ngày sản xuất", type: "date", editable: true, },
        ],
    },
];

import { ProductFormModel } from "@/types/productForm.model";

export interface Field {
    key: keyof ProductFormModel;
    label: string;
    required?: boolean;
    type?: "text" | "number" | "date" | "textarea" | "boolean";
    editable?: boolean;
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
            { key: "category", label: "Danh mục", required: true, editable: true },
            { key: "isFreshFood", label: "Thực phẩm tươi", type: "boolean", editable: true },
        ],
    },
    {
        title: "Thông tin chi tiết",
        fields: [
            { key: "ingredients", label: "Thành phần", type: "textarea", editable: true },
            { key: "nutritionFacts", label: "Thông tin dinh dưỡng", type: "textarea", editable: true },
        ],
    },
    {
        title: "Thông tin cần xác nhận",
        fields: [
            { key: "originalPrice", label: "Giá gốc", type: "number", required: true, editable: true },
            { key: "expiryDate", label: "Hạn sử dụng", type: "date", required: true, editable: true },
            { key: "manufactureDate", label: "Ngày sản xuất", type: "date", editable: true },
        ],
    },
];

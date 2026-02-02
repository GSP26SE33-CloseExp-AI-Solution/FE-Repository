import { ProductDraft, Product } from "@/types/product.type";
import { sections } from "../components/RequiredFieldsForm/productFormConfig";

const DEFAULT_TEXT = "Chưa có mô tả chi tiết";

export function normalizeProduct(draft: ProductDraft): Product {
    const normalized: any = { ...draft };
    const toISODate = (value: any): string | null => {
        if (!value) return null;

        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    };

    // 1. Gán mặc định cho field KHÔNG bắt buộc nếu rỗng
    sections.forEach((section) => {
        section.fields.forEach((field) => {
            if (!field.required) {
                const value = normalized[field.key];

                if (
                    value === "" ||
                    value === null ||
                    value === undefined
                ) {
                    if (field.type === "date") {
                        normalized[field.key] = null;
                    }
                    else {
                        normalized[field.key] = DEFAULT_TEXT;
                    }

                }
            }
        });
    });

    // 2. Chuẩn hoá dữ liệu
    return {
        ...normalized,

        name: normalized.name.trim(),
        description: normalized.description.trim(),
        category: normalized.category.trim(),
        brand: normalized.brand.trim(),
        origin: normalized.origin.trim(),

        qty: normalized.qty ?? 0,

        originalPrice: Number(normalized.originalPrice),
        salePrice:
            normalized.salePrice !== null
                ? Number(normalized.salePrice)
                : Number(normalized.originalPrice),

        expiry: toISODate(normalized.expiry),
        manufactureDate: toISODate(normalized.manufactureDate),

        createdAt: new Date().toISOString(),
    };
}

import { Product } from "@/types/aiProduct.type";

const REQUIRED_FIELDS: (keyof Product)[] = [
    "name",
    "category",
    "barcode",
    "expiryDate",
    "originalPrice",
];

export const validateProduct = (product: Product) => {
    const missingFields = REQUIRED_FIELDS.filter((key) => {
        const value = product[key];
        return value === null || value === undefined || value === "";
    });

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
};

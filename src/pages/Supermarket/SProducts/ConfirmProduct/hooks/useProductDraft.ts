import { useState } from "react";
import { ProductDraft } from "@/mocks/fakeProducts.mock";

export const useProductDraft = (initial: ProductDraft) => {
    const [draftProduct, setDraftProduct] = useState<ProductDraft>(initial);

    const updateField = <K extends keyof ProductDraft>(
        key: K,
        value: ProductDraft[K]
    ) => {
        setDraftProduct((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return { draftProduct, setDraftProduct, updateField };
};

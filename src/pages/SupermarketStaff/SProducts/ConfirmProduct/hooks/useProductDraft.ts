import { useState, useEffect, useRef } from "react";
import { ProductDraft } from "@/types/product.type";

export const useProductDraft = (initial: ProductDraft) => {
    const [draftProduct, setDraftProduct] = useState<ProductDraft>(initial);

    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (isFirstLoad.current) {
            setDraftProduct(initial);
            isFirstLoad.current = false;
        }
    }, [initial]);

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

import axiosClient from "@/utils/axiosClient";
import { Product } from "@/types/aiProduct.type";

export const productService = {
    /* ================= OCR ================= */
    uploadOcr(payload: {
        supermarketId: string;
        createdBy: string;
        file: File;
    }) {
        const formData = new FormData();
        formData.append("supermarketId", payload.supermarketId);
        formData.append("createdBy", payload.createdBy);
        formData.append("file", payload.file);

        return axiosClient.post(
            "/Products/upload-ocr",
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
    },

    /* ================= GET BY ID ================= */
    getById(productId: string) {
        return axiosClient.get<{
            success: boolean;
            message: string;
            data: Product;
        }>(`/Products/${productId}`);
    },

    /* ================= VERIFY ================= */
    verify(productId: string, payload: any) {
        return axiosClient.post(
            `/Products/${productId}/verify`,
            payload
        );
    },

    /* ================= PRICING ================= */
    pricingSuggestion(productId: string, originalPrice: number) {
        return axiosClient.post(
            `/Products/${productId}/pricing-suggestion`,
            { originalPrice }
        );
    },

    confirmPrice(
        productId: string,
        payload: {
            finalPrice: number;
            priceFeedback?: string;
            acceptedSuggestion: boolean;
            confirmedBy: string;
        }
    ) {
        return axiosClient.post(
            `/Products/${productId}/confirm-price`,
            payload
        );
    },

    publish(productId: string, publishedBy: string) {
        return axiosClient.post(
            `/Products/${productId}/publish`,
            { publishedBy }
        );
    },
};

import axiosClient from "@/utils/axiosClient";
import {
    VerifiedProduct,
    PricingSuggestionResponse,
    ConfirmPriceRequest,
} from "@/types/verifiedProduct.type";

export const verifyProduct = async (
    productId: string,
    payload: {
        name: string;
        brand: string;
        category: string;
        barcode: string;
        originalPrice: number;
        expiryDate: string;
        manufactureDate: string;
        verifiedBy: string;
    }
) => {
    const res = await axiosClient.post(`/Products/${productId}/verify`, payload);

    return res.data;
};


export const getProductsBySupermarket = async (supermarketId: string) => {
    const res = await axiosClient.get("/Products/my-supermarket");

    return {
        items: res.data?.data?.items ?? res.data?.items ?? [],
    };
};

export const getVerifiedProducts = async (
    supermarketId: string
): Promise<VerifiedProduct[]> => {
    const res = await axiosClient.get(`/Products/by-status/${supermarketId}`, {
        params: { status: 1 },
    });

    return res.data?.data ?? res.data?.items ?? [];
};

export const getPricingSuggestion = async (
    productId: string,
    originalPrice: number
): Promise<PricingSuggestionResponse> => {
    const res = await axiosClient.post(
        `/Products/${productId}/pricing-suggestion`,
        {
            originalPrice,
        }
    );

    return res.data?.data ?? res.data;
};

export const confirmProductPrice = async (
    productId: string,
    request: ConfirmPriceRequest
): Promise<void> => {
    await axiosClient.post(`/Products/${productId}/confirm-price`, request);
};

export const publishProduct = async (
    productId: string,
    publishedBy: string
): Promise<void> => {
    await axiosClient.post(`/Products/${productId}/publish`, {
        publishedBy,
    });
};

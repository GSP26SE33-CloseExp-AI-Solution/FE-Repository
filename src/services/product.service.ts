import axiosClient from "@/utils/axiosClient";

export const productService = {
    verifyProduct: async (
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
        const res = await axiosClient.post(
            `/Products/${productId}/verify`,
            payload
        );

        return res.data;
    },
};

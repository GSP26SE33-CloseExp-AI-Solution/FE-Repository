import axiosClient from "@/utils/axiosClient";

export const productPricingService = {
    getPricingSuggestion: async (productId: string) => {
        const res = await axiosClient.get(
            `/Products/${productId}/pricing-suggestion`
        );

        return res.data;
    },
};

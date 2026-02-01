import axiosClient from "./axiosClient";
import { AiPricingResponse } from "@/types/aiPricing.types";

export const getAiPriceSuggestion = (payload: {
    category: string;
    expiryDate: string;
    originalPrice: number;
    brand: string;
}) => {
    return axiosClient.post<AiPricingResponse>(
        "/api/AI/pricing",
        payload
    );
};

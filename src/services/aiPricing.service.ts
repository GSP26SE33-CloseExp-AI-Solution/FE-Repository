import axiosClient from "../utils/axiosClient"
import { AiPricingRequest, AiPricingResponse } from "@/types/aiPricing.types"

export const getAiPriceSuggestion = async (
    payload: AiPricingRequest
): Promise<AiPricingResponse> => {
    const res = await axiosClient.post<AiPricingResponse>(
        "/AI/pricing",
        payload
    )

    return res.data
}

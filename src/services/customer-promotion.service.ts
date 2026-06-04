import axiosClient from "@/utils/axiosClient";
import type { ApiEnvelope } from "@/types/api.types";
import type {
	CustomerPromotionOption,
	PromotionValidationResult,
	ValidatePromotionPayload,
} from "@/types/promotion.type";

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data.data;

export const customerPromotionService = {
	async getAvailable(cartSubtotal: number) {
		const response = await axiosClient.get<
			ApiEnvelope<CustomerPromotionOption[]>
		>("/promotions/available", {
			params: { cartSubtotal },
		});
		return unwrap(response);
	},

	async validate(payload: ValidatePromotionPayload) {
		const response = await axiosClient.post<
			ApiEnvelope<PromotionValidationResult>
		>("/promotions/validate", payload);
		return unwrap(response);
	},
};

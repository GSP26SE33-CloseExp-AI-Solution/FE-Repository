import axios from "axios";
import axiosClient from "@/utils/axiosClient";
import type { ApiEnvelope } from "@/types/api.types";
import type {
	PromotionAnalyticsOverview,
	PromotionClient,
	PromotionItem,
	PromotionTrendPoint,
	PromotionUsageFilter,
	PromotionUsageItem,
	PromotionValidationResult,
	UpdatePromotionBasicPayload,
	UpsertPromotionPayload,
	ValidatePromotionPayload,
} from "@/types/promotion.type";
import type { PaginationResult } from "@/types/order.type";

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data.data;

const getAxiosErrorMessage = (error: unknown, fallback: string): string => {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as
			| { message?: string; errors?: string[]; error?: string }
			| undefined;
		return data?.errors?.[0] || data?.message || data?.error || fallback;
	}
	return fallback;
};

const buildQuery = (params?: Record<string, string | number | undefined>) => {
	const search = new URLSearchParams();
	if (!params) return "";
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== "") {
			search.set(key, String(value));
		}
	}
	const query = search.toString();
	return query ? `?${query}` : "";
};

export const marketingPromotionService: PromotionClient & {
	getUsages: (
		filter?: PromotionUsageFilter,
	) => Promise<PaginationResult<PromotionUsageItem>>;
	getAnalyticsOverview: (params?: {
		fromUtc?: string;
		toUtc?: string;
	}) => Promise<PromotionAnalyticsOverview>;
	getTopPromotions: (params?: {
		metric?: string;
		limit?: number;
		fromUtc?: string;
		toUtc?: string;
	}) => Promise<PromotionItem[]>;
	getPromotionTrend: (
		promotionId: string,
		params?: { fromUtc?: string; toUtc?: string },
	) => Promise<PromotionTrendPoint[]>;
	getMyUsages: (params?: {
		fromUtc?: string;
		toUtc?: string;
		pageNumber?: number;
		pageSize?: number;
	}) => Promise<PaginationResult<PromotionUsageItem>>;
	validatePromotion: (
		payload: ValidatePromotionPayload,
	) => Promise<PromotionValidationResult>;
} = {
	async getPromotions() {
		try {
			const response = await axiosClient.get<
				ApiEnvelope<PromotionItem[]>
			>("/marketing/promotions");
			return unwrap(response) ?? [];
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể tải danh sách khuyến mãi"),
			);
		}
	},

	async getPromotionById(promotionId: string) {
		try {
			const response = await axiosClient.get<ApiEnvelope<PromotionItem>>(
				`/marketing/promotions/${promotionId}`,
			);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể tải chi tiết khuyến mãi"),
			);
		}
	},

	async createPromotion(payload: UpsertPromotionPayload) {
		try {
			const response = await axiosClient.post<ApiEnvelope<PromotionItem>>(
				"/marketing/promotions",
				payload,
			);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể tạo khuyến mãi"),
			);
		}
	},

	async updatePromotion(
		promotionId: string,
		payload: UpdatePromotionBasicPayload,
	) {
		try {
			const response = await axiosClient.put<ApiEnvelope<PromotionItem>>(
				`/marketing/promotions/${promotionId}`,
				payload,
			);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể cập nhật khuyến mãi"),
			);
		}
	},

	async updatePromotionStatus(promotionId: string, status: string) {
		try {
			const response = await axiosClient.patch<ApiEnvelope<PromotionItem>>(
				`/marketing/promotions/${promotionId}/status`,
				{ status },
			);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(
					error,
					"Không thể cập nhật trạng thái khuyến mãi",
				),
			);
		}
	},

	async getUsages(filter?: PromotionUsageFilter) {
		try {
			const response = await axiosClient.get<
				ApiEnvelope<PaginationResult<PromotionUsageItem>>
			>(`/marketing/promotions/usages${buildQuery(filter)}`);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể tải lịch sử sử dụng"),
			);
		}
	},

	async getAnalyticsOverview(params?: { fromUtc?: string; toUtc?: string }) {
		try {
			const response = await axiosClient.get<
				ApiEnvelope<PromotionAnalyticsOverview>
			>(
				`/marketing/promotions/analytics/overview${buildQuery(params)}`,
			);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể tải tổng quan hiệu quả"),
			);
		}
	},

	async getTopPromotions(params?: {
		metric?: string;
		limit?: number;
		fromUtc?: string;
		toUtc?: string;
	}) {
		try {
			const response = await axiosClient.get<ApiEnvelope<PromotionItem[]>>(
				`/marketing/promotions/analytics/top${buildQuery(params)}`,
			);
			return unwrap(response) ?? [];
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể tải top khuyến mãi"),
			);
		}
	},

	async getPromotionTrend(
		promotionId: string,
		params?: { fromUtc?: string; toUtc?: string },
	) {
		try {
			const response = await axiosClient.get<
				ApiEnvelope<PromotionTrendPoint[]>
			>(
				`/marketing/promotions/${promotionId}/analytics/trend${buildQuery(params)}`,
			);
			return unwrap(response) ?? [];
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể tải xu hướng chiến dịch"),
			);
		}
	},

	async getMyUsages(params?: {
		fromUtc?: string;
		toUtc?: string;
		pageNumber?: number;
		pageSize?: number;
	}) {
		try {
			const response = await axiosClient.get<
				ApiEnvelope<PaginationResult<PromotionUsageItem>>
			>(`/marketing/promotions/my-usages${buildQuery(params)}`);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(
					error,
					"Không thể tải lượt sử dụng khuyến mãi của bạn",
				),
			);
		}
	},

	async validatePromotion(payload: ValidatePromotionPayload) {
		try {
			const response = await axiosClient.post<
				ApiEnvelope<PromotionValidationResult>
			>("/marketing/promotions/validate", payload);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể kiểm tra mã khuyến mãi"),
			);
		}
	},

	async deletePromotion(promotionId: string) {
		try {
			const response = await axiosClient.delete<ApiEnvelope<boolean>>(
				`/marketing/promotions/${promotionId}`,
			);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể xóa khuyến mãi"),
			);
		}
	},
};

import type {
	PromotionItem,
	UpdatePromotionStatusPayload,
	UpsertPromotionPayload,
} from "@/types/admin.type";

export type { PromotionItem, UpsertPromotionPayload, UpdatePromotionStatusPayload };

export type PromotionUsageItem = {
	usageId: string;
	promotionId: string;
	promotionCode: string;
	userId: string;
	orderId: string;
	discountAmount: number;
	usedAt: string;
};

export type PromotionUsageFilter = {
	fromUtc?: string;
	toUtc?: string;
	userId?: string;
	promotionId?: string;
	pageNumber?: number;
	pageSize?: number;
};

export type PromotionAnalyticsOverview = {
	totalPromotionUsages: number;
	uniqueUsers: number;
	totalDiscountAmount: number;
	grossRevenueAffected: number;
	netRevenueAffected: number;
	avgDiscountPerUsage: number;
};

export type PromotionTrendPoint = {
	date: string;
	usageCount: number;
	discountAmount: number;
	netRevenueAffected: number;
};

export type ValidatePromotionPayload = {
	promotionId?: string;
	promotionCode?: string;
	totalAmount: number;
};

export type PromotionValidationResult = {
	isValid: boolean;
	message: string;
	promotionId?: string | null;
	promotionCode?: string | null;
	discountAmount: number;
	originalAmount: number;
	finalAmount: number;
};

export type UpdatePromotionBasicPayload = {
	code?: string;
	categoryId?: string;
	name?: string;
};

export type PromotionClient = {
	getPromotions: () => Promise<PromotionItem[]>;
	getPromotionById?: (promotionId: string) => Promise<PromotionItem>;
	createPromotion: (payload: UpsertPromotionPayload) => Promise<PromotionItem>;
	updatePromotion: (
		promotionId: string,
		payload: UpdatePromotionBasicPayload,
	) => Promise<PromotionItem>;
	deletePromotion: (promotionId: string) => Promise<boolean>;
};

export type ProductPurchaseUnit = {
	unitId: string;
	name: string;
	type: string;
	symbol: string;
	conversionRate: number;
	isProductDefault: boolean;
	hasPublishedLot: boolean;
};

export type ProductPurchaseUnitsResponse = {
	success?: boolean;
	data?: ProductPurchaseUnit[];
	message?: string;
};

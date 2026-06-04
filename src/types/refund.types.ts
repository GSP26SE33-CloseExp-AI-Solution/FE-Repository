/**
 * Admin refund types — matches BE DTOs (camelCase JSON)
 */
export type RefundStatus =
	| "Pending"
	| "Approved"
	| "Rejected"
	| "Completed";

export type RefundListItem = {
	refundId: string;
	orderId: string;
	transactionId: string;
	amount: number;
	reason: string;
	status: RefundStatus;
	processedBy?: string | null;
	processedAt?: string | null;
	createdAt: string;
	refundedOrderItemIds?: string[] | null;
	orderCode?: string | null;
	customerFullName?: string | null;
	customerEmail?: string | null;
	customerPhone?: string | null;
	isFullOrderRefund?: boolean;
	items?: RefundOrderItem[];
	steps?: RefundProgressStep[];
};

export type RefundOrderItem = {
	orderItemId: string;
	productName?: string | null;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	packagingStatus: string;
	deliveryStatus?: string | null;
};

export type RefundProgressStep = {
	step: string;
	isCompleted: boolean;
	isCurrent: boolean;
	occurredAt?: string | null;
};

export type RefundListParams = {
	pageNumber?: number;
	pageSize?: number;
};

export type AdminRefundOrderSummary = {
	orderId: string;
	orderCode: string;
	customerFullName?: string | null;
	customerEmail?: string | null;
	customerPhone?: string | null;
	orderFinalAmount: number;
	totalRefundAmount: number;
	pendingRefundAmount: number;
	refundCount: number;
	primaryRefundStatus: RefundStatus;
	lastRefundAt: string;
};

export type AdminRefundOrderLineItem = {
	orderItemId: string;
	productName?: string | null;
	supermarketName?: string | null;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	packagingStatus: string;
	deliveryStatus?: string | null;
	isRefunded: boolean;
	lineRefundAmount?: number | null;
	refundStatus?: RefundStatus | null;
	refundId?: string | null;
};

export type AdminRefundOrderDetail = {
	orderId: string;
	orderCode: string;
	orderStatus: string;
	customerFullName?: string | null;
	customerEmail?: string | null;
	customerPhone?: string | null;
	totalAmount: number;
	discountAmount: number;
	deliveryFee: number;
	systemUsageFeeAmount: number;
	orderFinalAmount: number;
	totalRefundAmount: number;
	pendingRefundAmount: number;
	items: AdminRefundOrderLineItem[];
	refunds: RefundListItem[];
};

export type AdminRefundOrderListParams = {
	pageNumber?: number;
	pageSize?: number;
};

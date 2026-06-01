/**
 * Admin refund response shape
 * Matches BE RefundResponseDto (camelCase JSON)
 *
 * Endpoint:
 * - GET /api/Refunds (Admin)
 * - GET /api/Refunds/{id}
 */
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
};

/**
 * BE RefundState enum values
 * Used for status filtering/display
 */
export type RefundStatus =
	| "Pending"
	| "Approved"
	| "Rejected"
	| "Completed";

/**
 * Params for listing refunds
 * Endpoint: GET /api/Refunds
 */
export type RefundListParams = {
	pageNumber?: number;
	pageSize?: number;
};

/* =========================
   Shared
========================= */

/**
 * Generic paged result
 * dùng cho:
 * - GET /api/Orders
 * - GET /api/Orders/my-orders
 */
export type PaginationResult<T> = {
	items: T[];
	totalResult: number;
	page: number;
	pageSize: number;
};

/**
 * .NET TimeSpan DTO
 * dùng cho:
 * - GET /api/Orders/time-slots
 * - GET /api/admin/system-config/time-slots
 */
export type TimeSpanDto = {
	ticks: number;
	days: number;
	hours: number;
	milliseconds: number;
	microseconds: number;
	nanoseconds: number;
	minutes: number;
	seconds: number;
	totalDays: number;
	totalHours: number;
	totalMilliseconds: number;
	totalMicroseconds: number;
	totalNanoseconds: number;
	totalMinutes: number;
	totalSeconds: number;
};

/* =========================
   Order / Delivery enums
   bám theo BE enum-state-BE
========================= */

/**
 * dùng trong order payload / response
 * Swagger đang để deliveryType là string
 * FE hiện map về 2 mode chính này
 */
export type DeliveryMethodId = "DELIVERY" | "PICKUP";

/**
 * BE timeSlotId thực tế là uuid string
 * dùng trong:
 * - POST /api/Orders
 * - POST /api/Orders/my-orders
 * - GET /api/Orders/time-slots
 */
export type TimeSlotId = string;

/**
 * bám theo enum-state-BE: OrderState
 */
export type OrderStatusValue =
	| "Pending"
	| "Paid"
	| "ReadyToShip"
	| "DeliveredWaitConfirm"
	| "Completed"
	| "Canceled"
	| "Refunded"
	| "Failed";

/**
 * bám theo enum-state-BE: PromotionState
 */
export type PromotionStatusValue = "Draft" | "Active" | "Expired" | "Disabled";

/* =========================
   FE local checkout context
   context trước khi tạo order
========================= */

/**
 * FE lightweight supermarket info
 * dùng local cho delivery gate / checkout
 */
export type SupermarketLite = {
	supermarketId: string;
	name: string;
	address: string;
	latitude: number;
	longitude: number;
	distanceKm?: number;
};

/**
 * FE order context trước checkout
 * map dần sang payload của:
 * - POST /api/Orders/my-orders
 */
export type CustomerOrderContext = {
	deliveryMethodId?: DeliveryMethodId;

	/** saved = địa chỉ đã lưu / mặc định từ tài khoản */
	locationSource?: "gps" | "search" | "map" | "saved";
	lat?: number;
	lng?: number;
	addressText?: string;

	// FE local pickup info
	pickupPointId?: string;
	pickupPointName?: string;
	pickupPointAddress?: string;
	pickupLat?: number;
	pickupLng?: number;

	nearbySupermarkets?: SupermarketLite[];

	// meta thật dùng cho create order
	collectionId?: string;
	collectionPointId?: string;
	collectionPointName?: string;
	collectionPointAddress?: string;

	/**
	 * BE timeSlotId thật (uuid)
	 * chọn trực tiếp từ GET /api/Orders/time-slots
	 */
	timeSlotId?: TimeSlotId;

	addressId?: string;
	promotionId?: string;
	orderId?: string;
};

/**
 * FE local cart item
 * không phải raw response của carts endpoint
 */
export type CartItem = {
	lotId: string;
	productId: string;
	supermarketId: string;
	name: string;
	price: number;
	qty: number;
	imageUrl?: string;
};

/* =========================
   Query / filter helpers
========================= */

/**
 * dùng cho:
 * - GET /api/Orders
 * - GET /api/Orders/my-orders
 */
export type OrderListQuery = {
	pageNumber?: number;
	pageSize?: number;
};

/**
 * dùng cho:
 * - POST /api/Orders/collection-points/nearby
 */
export type NearbyCollectionPointPayload = {
	latitude: number;
	longitude: number;
	radiusKm: number;
};

/* =========================
   Order item payloads
========================= */

/**
 * dùng trong:
 * - POST /api/Orders
 * - POST /api/Orders/my-orders
 */
export type CreateOrderItemPayload = {
	lotId: string;
	quantity: number;
	unitPrice: number;
};

/**
 * dùng trong:
 * - PUT /api/Orders/{id}
 */
export type UpdateOrderItemPayload = {
	orderItemId?: string;
	lotId: string;
	quantity: number;
	unitPrice: number;
};

/* =========================
   Create / Update order payloads
========================= */

/**
 * Admin/general create order
 * endpoint:
 * - POST /api/Orders
 */
export type CreateOrderPayload = {
	userId: string;
	timeSlotId: string;
	collectionId?: string | null;
	deliveryType: DeliveryMethodId;
	totalAmount: number;
	status: string;
	addressId?: string | null;
	promotionId?: string | null;
	deliveryGroupId?: string | null;
	deliveryNote?: string;
	discountAmount: number;
	finalAmount: number;
	deliveryFee: number;
	systemUsageFeeAmount?: number;
	cancelDeadline?: string;
	orderItems: CreateOrderItemPayload[];
};

/**
 * Customer self-create order
 * endpoint:
 * - POST /api/Orders/my-orders
 */
export type CreateMyOrderPayload = {
	timeSlotId: string;
	collectionId?: string | null;
	deliveryType: DeliveryMethodId;
	addressId?: string | null;
	promotionId?: string | null;
	deliveryNote?: string;
	deliveryFee: number;
	systemUsageFeeAmount?: number;
	cancelDeadline?: string;
	orderItems: CreateOrderItemPayload[];
};

/**
 * customer address response
 * endpoint:
 * - GET /api/CustomerAddresses/default
 * - POST /api/CustomerAddresses
 */
export type CustomerAddress = {
	customerAddressId: string;
	userId: string;
	phone: string;
	recipientName: string;
	addressLine: string;
	latitude: number;
	longitude: number;
	isDefault: boolean;
};

/**
 * create customer address payload
 * endpoint:
 * - POST /api/CustomerAddresses
 */
export type CreateCustomerAddressPayload = {
	phone: string;
	recipientName: string;
	addressLine: string;
	latitude: number;
	longitude: number;
	isDefault: boolean;
};

/**
 * update customer address
 * endpoint:
 * - PUT /api/CustomerAddresses/{id}
 */
export type UpdateCustomerAddressPayload = {
	phone?: string;
	recipientName?: string;
	addressLine?: string;
	latitude?: number;
	longitude?: number;
};

/**
 * Update order
 * endpoint:
 * - PUT /api/Orders/{id}
 */
export type UpdateOrderPayload = {
	timeSlotId?: string;
	collectionId?: string | null;
	deliveryType?: string;
	totalAmount: number;
	status: string;
	addressId?: string | null;
	promotionId?: string | null;
	deliveryGroupId?: string | null;
	deliveryNote?: string;
	discountAmount: number;
	finalAmount: number;
	deliveryFee: number;
	systemUsageFeeAmount?: number;
	cancelDeadline?: string;
	orderItems: UpdateOrderItemPayload[];
};

/* =========================
   Order payment
========================= */

/**
 * tạo link thanh toán cho order
 * endpoint:
 * - POST /api/Orders/payment-link
 *   hoặc endpoint payment tương ứng nếu BE tách riêng
 */
export type CreatePaymentLinkPayload = {
	orderId: string;
	returnUrl: string;
	cancelUrl: string;
};

/**
 * response trả về link thanh toán
 */
export type PaymentLinkResponse = {
	checkoutUrl: string;
};

/**
 * response sau khi xác nhận thanh toán
 * dùng cho callback/verify/check payment status
 */
export type ConfirmPaymentResponse = {
	success: boolean;
	message?: string;
	errorCode?: string;
	payOsStatus?: string;
	amountPaid?: number;
	amount?: number;
};

/* =========================
   Order response models
========================= */

/**
 * line item response
 * dùng trong:
 * - GET /api/Orders
 * - GET /api/Orders/{id}
 * - GET /api/Orders/{id}/details
 * - GET /api/Orders/my-orders
 * - POST /api/Orders
 * - POST /api/Orders/my-orders
 */
export type OrderItemResponse = {
	orderItemId: string;
	orderId: string;
	lotId: string;
	quantity: number;
	unitPrice: number;
	totalPrice?: number;
	lineTotal?: number;
	productName?: string;
	expiryDate?: string;
};

/**
 * shared order detail shape
 * Swagger hiện cho:
 * - GET /api/Orders
 * - GET /api/Orders/{id}
 * - GET /api/Orders/{id}/details
 * - GET /api/Orders/my-orders
 * - POST /api/Orders
 * - POST /api/Orders/my-orders
 */
export type OrderDetails = {
	orderId: string;
	orderCode?: string;
	userId?: string;
	userName?: string;
	timeSlotId?: string;
	timeSlotDisplay?: string;
	collectionId?: string | null;
	collectionPointName?: string | null;
	deliveryType?: string;
	totalAmount: number;
	discountAmount?: number;
	finalAmount: number;
	deliveryFee?: number;
	systemUsageFeeAmount?: number;
	status?: string;
	orderDate?: string;
	addressId?: string | null;
	promotionId?: string | null;
	deliveryGroupId?: string | null;
	deliveryNote?: string;
	cancelDeadline?: string;
	createdAt?: string;
	updatedAt?: string;
	orderItems?: OrderItemResponse[];
};

/* =========================
   Order meta endpoints
========================= */

/**
 * Customer-facing time slot
 * endpoint:
 * - GET /api/Orders/time-slots
 *
 * Lưu ý:
 * - endpoint này có displayTimeRange
 * - khác với admin system-config time-slots
 */
export type OrderTimeSlot = {
	timeSlotId: string;
	startTime: TimeSpanDto;
	endTime: TimeSpanDto;
	displayTimeRange: string;
	relatedOrderCount?: number;
};

/**
 * Customer-facing collection point
 * endpoints:
 * - GET /api/Orders/collection-points
 * - POST /api/Orders/collection-points/nearby
 *
 * Lưu ý:
 * - dùng collectionPointId / address
 * - khác với admin collection point config
 */
export type OrderCollectionPoint = {
	collectionPointId: string;
	name: string;
	address: string;
	relatedOrderCount?: number;
	distanceKm?: number;
	latitude?: number;
	longitude?: number;
};

/* =========================
   Optional standalone order-item payloads
   để dành nếu sau này tách riêng service/order-item
========================= */

export type OrderItemCreatePayload = {
	orderId: string;
	lotId: string;
	quantity: number;
	unitPrice: number;
};

export type OrderItemUpdatePayload = {
	lotId: string;
	quantity: number;
	unitPrice: number;
};

/* =========================
   My Orders page
========================= */

/**
 * line item trong:
 * - GET /api/Orders/my-orders
 */
export type MyOrderLineItem = {
	orderItemId: string;
	orderId: string;
	lotId: string;
	quantity: number;
	unitPrice: number;
	totalPrice?: number;
	lineTotal?: number;
	productName?: string;
	expiryDate?: string;
};

/**
 * item trong paged my-orders response
 * endpoint:
 * - GET /api/Orders/my-orders
 */
export type MyOrderItem = {
	orderId: string;
	orderCode: string;
	userId: string;
	userName?: string;
	timeSlotId?: string;
	timeSlotDisplay?: string;
	collectionId?: string | null;
	collectionPointName?: string | null;
	deliveryType?: string;
	totalAmount: number;
	discountAmount: number;
	finalAmount: number;
	deliveryFee: number;
	systemUsageFeeAmount?: number;
	status: string;
	orderDate?: string;
	addressId?: string | null;
	promotionId?: string | null;
	deliveryGroupId?: string | null;
	deliveryNote?: string;
	cancelDeadline?: string;
	createdAt?: string;
	updatedAt?: string;
	orderItems: MyOrderLineItem[];
};

/**
 * paged result riêng cho my-orders page
 * endpoint:
 * - GET /api/Orders/my-orders
 *
 * thực chất tương đương PaginationResult<MyOrderItem>
 */
export type MyOrdersPageResult = {
	items: MyOrderItem[];
	totalResult: number;
	page: number;
	pageSize: number;
};

/* =========================
   Order status action endpoints
   helper type cho các endpoint đổi trạng thái
========================= */

/**
 * dùng cho:
 * - PUT /api/Orders/{id}/pending
 * - PUT /api/Orders/{id}/paid
 * - PUT /api/Orders/{id}/ready-to-ship
 * - PUT /api/Orders/{id}/delivered-wait-confirm
 * - PUT /api/Orders/{id}/completed
 * - PUT /api/Orders/{id}/canceled (JSON body { reason: string } bắt buộc)
 * - PUT /api/Orders/{id}/refunded
 * - PUT /api/Orders/{id}/failed
 */
export type OrderStatusAction =
	| "pending"
	| "paid"
	| "ready-to-ship"
	| "delivered-wait-confirm"
	| "completed"
	| "canceled"
	| "refunded"
	| "failed";

export type RefundDetails = {
	refundId: string;
	orderId: string;
	transactionId: string;
	amount: number;
	reason: string;
	status: string;
	processedBy?: string | null;
	processedAt?: string | null;
	createdAt: string;
};

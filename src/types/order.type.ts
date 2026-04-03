/* =========================
   Shared
========================= */
export type PaginationResult<T> = {
  items: T[];
  totalResult: number;
  page: number;
  pageSize: number;
};

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
export type DeliveryMethodId = "DELIVERY" | "PICKUP";

/** FE pickup slot choice (baseline windows map to BE timeSlotId via lookup). */
export type PickupSlotId = "SLOT_1" | "SLOT_2";

export type TimeSlotId = PickupSlotId;

export type OrderStatusValue =
  | "Pending"
  | "Paid"
  | "ReadyToShip"
  | "DeliveredWaitConfirm"
  | "Completed"
  | "Canceled"
  | "Refunded"
  | "Failed";

export type PromotionStatusValue = "Draft" | "Active" | "Expired" | "Disabled";

/* =========================
   Customer Context
   context này là context FE trước checkout
========================= */
export type SupermarketLite = {
  supermarketId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
};

export type CustomerOrderContext = {
  deliveryMethodId?: DeliveryMethodId;

  locationSource?: "gps" | "search" | "map";
  lat?: number;
  lng?: number;
  addressText?: string;

  // FE local context cho pickup
  pickupPointId?: string;
  pickupPointName?: string;
  pickupPointAddress?: string;
  pickupLat?: number;
  pickupLng?: number;

  nearbySupermarkets?: SupermarketLite[];

  // meta thật dùng cho checkout/order
  collectionId?: string;
  collectionPointId?: string;
  collectionPointName?: string;
  collectionPointAddress?: string;

  timeSlotId?: string;
  /** Khung giao hàng chọn trên checkout (map sang timeSlotId) */
  pickupSlotId?: TimeSlotId | null;
  addressId?: string;
  promotionId?: string;
  orderId?: string;
};

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
   Orders
========================= */
export type OrderItemPayload = {
  lotId: string;
  quantity: number;
  unitPrice: number;
};

export type UpdateOrderItemPayload = {
  orderItemId?: string;
  lotId: string;
  quantity: number;
  unitPrice: number;
};

/**
 * /api/Orders
 * admin/general create
 */
export type CreateOrderPayload = {
  userId: string;
  timeSlotId: string;
  collectionId?: string | null;
  deliveryType: string;
  totalAmount: number;
  status: string;
  addressId?: string | null;
  promotionId?: string | null;
  deliveryGroupId?: string | null;
  deliveryNote?: string;
  discountAmount: number;
  finalAmount: number;
  deliveryFee: number;
  cancelDeadline?: string;
  orderItems: OrderItemPayload[];
};

/**
 * /api/Orders/my-orders
 * current customer create
 */
export type CreateMyOrderPayload = {
  timeSlotId: string;
  collectionId?: string | null;
  deliveryType: DeliveryMethodId;
  addressId?: string | null;
  promotionId?: string | null;
  deliveryNote?: string;
  deliveryFee: number;
  cancelDeadline?: string;
  orderItems: OrderItemPayload[];
};

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
  cancelDeadline?: string;
  orderItems: UpdateOrderItemPayload[];
};

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

export type OrderDetails = {
  orderId: string;
  orderCode?: string;
  userId?: string;
  userName?: string;
  timeSlotId?: string;
  timeSlotDisplay?: string;
  collectionId?: string;
  collectionPointName?: string;
  deliveryType?: string;
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  deliveryFee?: number;
  status?: string;
  orderDate?: string;
  addressId?: string;
  promotionId?: string;
  deliveryGroupId?: string;
  deliveryNote?: string;
  cancelDeadline?: string;
  createdAt?: string;
  updatedAt?: string;
  orderItems?: OrderItemResponse[];
};

/* =========================
   Order Meta
========================= */
export type OrderTimeSlot = {
  timeSlotId: string;
  startTime: TimeSpanDto;
  endTime: TimeSpanDto;
  displayTimeRange: string;
  relatedOrderCount?: number;
};

export type OrderCollectionPoint = {
  collectionPointId: string;
  name: string;
  address: string;
  relatedOrderCount?: number;
};

/* =========================
   Order Items
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
   My Order Page
========================= */
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

export type MyOrdersPageResult = {
  items: MyOrderItem[];
  totalResult: number;
  page: number;
  pageSize: number;
};

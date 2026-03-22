export type ApiEnvelope<T> = {
    success: boolean
    message: string
    data: T
    errors?: string[] | null
}

/* =========================
   Shared
========================= */
export type PaginationResult<T> = {
    items: T[]
    totalResult: number
    page: number
    pageSize: number
}

export type TimeSpanDto = {
    ticks: number
    days: number
    hours: number
    milliseconds: number
    microseconds: number
    nanoseconds: number
    minutes: number
    seconds: number
    totalDays: number
    totalHours: number
    totalMilliseconds: number
    totalMicroseconds: number
    totalNanoseconds: number
    totalMinutes: number
    totalSeconds: number
}

/* =========================
   Customer Context
========================= */
export type DeliveryMethodId = "DELIVERY" | "PICKUP"

export type PickupSlotId = "SLOT_1" | "SLOT_2"

export type SupermarketLite = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
    distanceKm?: number
}

export type CustomerOrderContext = {
    deliveryMethodId?: DeliveryMethodId

    locationSource?: "gps" | "search" | "map"
    lat?: number
    lng?: number
    addressText?: string

    pickupPointId?: string
    pickupPointName?: string
    pickupPointAddress?: string
    pickupLat?: number
    pickupLng?: number

    nearbySupermarkets?: SupermarketLite[]

    pickupSlotId?: PickupSlotId
    timeSlotId?: string
    orderId?: string
}

export type CartItem = {
    lotId: string
    productId: string
    supermarketId: string
    name: string
    price: number
    qty: number
    imageUrl?: string
}

/* =========================
   Orders
========================= */
export type OrderItemPayload = {
    lotId: string
    quantity: number
    unitPrice: number
}

export type UpdateOrderItemPayload = {
    orderItemId?: string
    lotId: string
    quantity: number
    unitPrice: number
}

export type CreateOrderPayload = {
    userId: string
    timeSlotId: string
    collectionId?: string | null
    deliveryType: string
    totalAmount: number
    status: string
    addressId?: string | null
    promotionId?: string | null
    deliveryGroupId?: string | null
    deliveryNote?: string
    discountAmount: number
    finalAmount: number
    deliveryFee: number
    cancelDeadline?: string
    orderItems: OrderItemPayload[]
}

export type UpdateOrderPayload = {
    timeSlotId?: string
    collectionId?: string | null
    deliveryType?: string
    totalAmount: number
    status: string
    addressId?: string | null
    promotionId?: string | null
    deliveryGroupId?: string | null
    deliveryNote?: string
    discountAmount: number
    finalAmount: number
    deliveryFee: number
    cancelDeadline?: string
    orderItems: UpdateOrderItemPayload[]
}

export type OrderItemResponse = {
    orderItemId: string
    orderId: string
    lotId: string
    quantity: number
    unitPrice: number
    totalPrice?: number
    lineTotal?: number
    productName?: string
    expiryDate?: string
}

export type OrderDetails = {
    orderId: string
    orderCode?: string
    userId?: string
    userName?: string
    timeSlotId?: string
    timeSlotDisplay?: string
    collectionId?: string
    collectionPointName?: string
    deliveryType?: string
    totalAmount: number
    discountAmount?: number
    finalAmount: number
    deliveryFee?: number
    status?: string
    orderDate?: string
    addressId?: string
    promotionId?: string
    deliveryGroupId?: string
    deliveryNote?: string
    cancelDeadline?: string
    createdAt?: string
    updatedAt?: string
    orderItems?: OrderItemResponse[]
}

/* =========================
   Order Meta
========================= */
export type OrderTimeSlot = {
    timeSlotId: string
    startTime: TimeSpanDto
    endTime: TimeSpanDto
    displayTimeRange: string
}

export type OrderCollectionPoint = {
    pickupPointId: string
    name: string
    address: string
}

/* =========================
   Order Items
========================= */
export type OrderItemCreatePayload = {
    orderId: string
    lotId: string
    quantity: number
    unitPrice: number
}

export type OrderItemUpdatePayload = {
    lotId: string
    quantity: number
    unitPrice: number
}

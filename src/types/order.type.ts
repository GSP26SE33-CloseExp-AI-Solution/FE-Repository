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

export type OrderItemPayload = {
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

export type ApiEnvelope<T> = {
    success: boolean
    message: string
    data: T
    errors?: string[] | null
}

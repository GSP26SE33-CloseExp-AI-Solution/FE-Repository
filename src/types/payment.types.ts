import type { OrderItemPayload } from "@/types/order.type"

/**
 * Dòng item trong response POST /Orders (luồng thanh toán PayOS).
 * totalPrice thường bắt buộc từ BE (khác OrderItemResponse có totalPrice optional).
 */
export type PaymentOrderLineItem = {
    orderItemId: string
    orderId: string
    lotId: string
    quantity: number
    unitPrice: number
    totalPrice: number
    productName?: string
}

/**
 * Payload POST /Orders trước khi redirect PayOS (Vendor checkout).
 * Tách với CreateOrderPayload trong order.type khi luồng khác bắt buộc status.
 */
export type CreateOrderForPaymentPayload = {
    userId: string
    timeSlotId: string
    collectionId?: string
    deliveryType: string
    totalAmount: number
    discountAmount: number
    finalAmount: number
    deliveryFee: number
    status?: string
    addressId?: string
    promotionId?: string
    deliveryGroupId?: string
    deliveryNote?: string
    cancelDeadline?: string
    orderItems: OrderItemPayload[]
}

/** Response POST /Orders cho luồng thanh toán (lấy orderId tạo payment link). */
export type PaymentOrderResponse = {
    orderId: string
    orderCode: string
    userId: string
    timeSlotId: string
    collectionId?: string
    deliveryType: string
    totalAmount: number
    discountAmount: number
    finalAmount: number
    deliveryFee: number
    status: string
    orderDate: string
    createdAt: string
    updatedAt: string
    orderItems: PaymentOrderLineItem[]
}

export type CreatePaymentLinkPayload = {
    orderId: string
    returnUrl: string
    cancelUrl: string
}

export type PaymentLinkResponse = {
    checkoutUrl: string
}

export type ConfirmPaymentResponse = {
    success: boolean
    message?: string
    errorCode?: string
    payOsStatus?: string
    amountPaid?: number
    amount?: number
}

import axios from "axios"
import axiosClient from "@/utils/axiosClient"
import { ApiResponse } from "@/types/auth.types"

/* ─── Types matching BE DTOs ─── */

export interface CreateOrderItemPayload {
    lotId: string
    quantity: number
    unitPrice: number
}

export interface CreateOrderPayload {
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
    orderItems: CreateOrderItemPayload[]
}

export interface OrderResponse {
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
    orderItems: Array<{
        orderItemId: string
        orderId: string
        lotId: string
        quantity: number
        unitPrice: number
        totalPrice: number
        productName?: string
    }>
}

export interface CreatePaymentLinkPayload {
    orderId: string
    returnUrl: string
    cancelUrl: string
}

export interface PaymentLinkResponse {
    checkoutUrl: string
}

export interface ConfirmPaymentResponse {
    success: boolean
    message?: string
    errorCode?: string
    payOsStatus?: string
    amountPaid?: number
    amount?: number
}

/* ─── Helpers ─── */

const getAxiosErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as
            | { message?: string; errors?: string[]; error?: string }
            | undefined
        return data?.errors?.[0] || data?.message || data?.error || fallback
    }
    return fallback
}

/* ─── API calls ─── */

export const createOrder = async (
    payload: CreateOrderPayload,
): Promise<OrderResponse> => {
    try {
        const res = await axiosClient.post<ApiResponse<OrderResponse>>(
            "/Orders",
            payload,
        )
        if (!res.data?.success) {
            throw new Error(res.data?.message || "Tạo đơn hàng thất bại")
        }
        return res.data.data
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Tạo đơn hàng thất bại"))
    }
}

export const createPaymentLink = async (
    payload: CreatePaymentLinkPayload,
): Promise<PaymentLinkResponse> => {
    try {
        const res = await axiosClient.post<PaymentLinkResponse>(
            "/Payment/create-payment-link",
            payload,
        )
        return res.data
    } catch (error) {
        throw new Error(
            getAxiosErrorMessage(error, "Tạo link thanh toán thất bại"),
        )
    }
}

export const confirmPayment = async (
    orderCode: string,
): Promise<ConfirmPaymentResponse> => {
    try {
        const res = await axiosClient.post<ConfirmPaymentResponse>(
            "/Payment/confirm",
            { orderCode },
        )
        return res.data
    } catch (error) {
        throw new Error(
            getAxiosErrorMessage(error, "Xác nhận thanh toán thất bại"),
        )
    }
}

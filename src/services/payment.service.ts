import axios from "axios"
import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"

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

/**
 * Gọi POST /api/Payment/confirm. Trả 200 + success khi đã paid; 400/404 với body JSON khi chưa settled hoặc lỗi — không throw để FE có thể poll khi errorCode === PaymentNotComplete.
 */
export const confirmPayment = async (
    orderCode: string,
): Promise<ConfirmPaymentResponse> => {
    try {
        const res = await axiosClient.post<ConfirmPaymentResponse>(
            "/Payment/confirm",
            { orderCode },
            {
                validateStatus: (status) =>
                    status === 200 || status === 400 || status === 404,
            },
        )
        if (res.status === 200) {
            return { success: true }
        }
        const data = res.data as ConfirmPaymentResponse
        return {
            success: false,
            message: data?.message,
            errorCode: data?.errorCode,
            payOsStatus: data?.payOsStatus,
            amountPaid: data?.amountPaid,
            amount: data?.amount,
        }
    } catch (error) {
        throw new Error(
            getAxiosErrorMessage(error, "Xác nhận thanh toán thất bại"),
        )
    }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Gọi confirm lặp lại khi PayOS/BE trả PaymentNotComplete (race với webhook hoặc redirect sớm).
 */
export const confirmPaymentWithRetry = async (
    orderCode: string,
    options?: { maxAttempts?: number; delayMs?: number },
): Promise<ConfirmPaymentResponse> => {
    const maxAttempts = options?.maxAttempts ?? 5
    const delayMs = options?.delayMs ?? 2500
    let last: ConfirmPaymentResponse = { success: false, message: "Không xác nhận được thanh toán" }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const result = await confirmPayment(orderCode)
        if (result.success) return result

        last = result
        if (result.errorCode !== "PaymentNotComplete") return result

        if (attempt < maxAttempts - 1) await sleep(delayMs)
    }

    return last
}

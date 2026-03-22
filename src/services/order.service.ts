import axiosClient from "@/utils/axiosClient"
import type {
    ApiEnvelope,
    CreateOrderPayload,
    OrderDetails,
    PaginationResult,
    UpdateOrderPayload,
} from "@/types/order.type"

const unwrap = <T,>(response: { data: ApiEnvelope<T> }) => response.data.data

export const orderService = {
    /* =========================
       Orders
    ========================= */
    async getOrders(params?: { pageNumber?: number; pageSize?: number }) {
        const response = await axiosClient.get<ApiEnvelope<PaginationResult<OrderDetails>>>(
            "/Orders",
            { params }
        )
        return unwrap(response)
    },

    async createOrder(payload: CreateOrderPayload) {
        const response = await axiosClient.post<ApiEnvelope<OrderDetails>>(
            "/Orders",
            payload
        )
        return unwrap(response)
    },

    async getOrder(orderId: string) {
        const response = await axiosClient.get<ApiEnvelope<OrderDetails>>(
            `/Orders/${orderId}`
        )
        return unwrap(response)
    },

    async getOrderDetails(orderId: string) {
        const response = await axiosClient.get<ApiEnvelope<OrderDetails>>(
            `/Orders/${orderId}/details`
        )
        return unwrap(response)
    },

    async updateOrder(orderId: string, payload: UpdateOrderPayload) {
        await axiosClient.put(`/Orders/${orderId}`, payload)
    },

    async deleteOrder(orderId: string) {
        await axiosClient.delete(`/Orders/${orderId}`)
    },

    /* =========================
       Order Status Actions
    ========================= */
    async markPending(orderId: string) {
        await axiosClient.put(`/Orders/${orderId}/pending`)
    },

    async markPaidProcessing(orderId: string) {
        await axiosClient.put(`/Orders/${orderId}/paid-processing`)
    },

    async markReadyToShip(orderId: string) {
        await axiosClient.put(`/Orders/${orderId}/ready-to-ship`)
    },

    async markDeliveredWaitConfirm(orderId: string) {
        await axiosClient.put(`/Orders/${orderId}/delivered-wait-confirm`)
    },

    async markCompleted(orderId: string) {
        await axiosClient.put(`/Orders/${orderId}/completed`)
    },

    async markCanceled(orderId: string) {
        await axiosClient.put(`/Orders/${orderId}/canceled`)
    },

    async markRefunded(orderId: string) {
        await axiosClient.put(`/Orders/${orderId}/refunded`)
    },

    async markFailed(orderId: string) {
        await axiosClient.put(`/Orders/${orderId}/failed`)
    },
}

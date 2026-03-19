import axiosClient from "@/utils/axiosClient"
import type {
    ApiEnvelope,
    CreateOrderPayload,
    OrderDetails,
} from "@/types/order.type"

const unwrap = <T,>(response: { data: ApiEnvelope<T> }) => response.data.data

export const orderService = {
    async createOrder(payload: CreateOrderPayload) {
        const response = await axiosClient.post<ApiEnvelope<OrderDetails>>("/Orders", payload)
        return unwrap(response)
    },

    async getOrderDetails(orderId: string) {
        const response = await axiosClient.get<ApiEnvelope<OrderDetails>>(
            `/Orders/${orderId}/details`
        )
        return unwrap(response)
    },

    async markPaidProcessing(orderId: string) {
        await axiosClient.put(`/Orders/${orderId}/paid-processing`)
    },

    async markFailed(orderId: string) {
        await axiosClient.put(`/Orders/${orderId}/failed`)
    },
}

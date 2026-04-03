import axiosClient from "@/utils/axiosClient"
import type {
    PackagingActionPayload,
    PackagingOrderDetail,
    PackagingOrderSummary,
    PaginationResult,
} from "@/types/packaging.type"
import type { ApiResponse } from "@/types/api.types"

const BASE_URL = "/Packaging/orders"

export const packagingService = {
    async getPendingOrders(pageNumber = 1, pageSize = 10) {
        const response = await axiosClient.get<
            ApiResponse<PaginationResult<PackagingOrderSummary>>
        >(`${BASE_URL}/pending`, {
            params: { pageNumber, pageSize },
        })

        return response.data
    },

    async getOrderDetail(orderId: string) {
        const response = await axiosClient.get<ApiResponse<PackagingOrderDetail>>(
            `${BASE_URL}/${orderId}`
        )

        return response.data
    },

    async confirmOrder(orderId: string, payload: PackagingActionPayload) {
        const response = await axiosClient.post<ApiResponse<PackagingOrderDetail>>(
            `${BASE_URL}/${orderId}/confirm`,
            payload
        )

        return response.data
    },

    async collectOrder(orderId: string, payload: PackagingActionPayload) {
        const response = await axiosClient.post<ApiResponse<PackagingOrderDetail>>(
            `${BASE_URL}/${orderId}/collect`,
            payload
        )

        return response.data
    },

    async packageOrder(orderId: string, payload: PackagingActionPayload) {
        const response = await axiosClient.post<ApiResponse<PackagingOrderDetail>>(
            `${BASE_URL}/${orderId}/package`,
            payload
        )

        return response.data
    },
}

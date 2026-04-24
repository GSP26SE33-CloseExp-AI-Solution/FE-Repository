import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    CollectPackagingOrderPayload,
    ConfirmPackagingOrderPayload,
    FailPackagingOrderPayload,
    PackagePackagingOrderPayload,
    PackagingOrderDetail,
    PackagingOrderSummary,
    PaginationResult,
} from "@/types/packaging.type"

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

    async confirmOrder(
        orderId: string,
        payload: ConfirmPackagingOrderPayload = {}
    ) {
        const response = await axiosClient.post<ApiResponse<PackagingOrderDetail>>(
            `${BASE_URL}/${orderId}/confirm`,
            payload
        )

        return response.data
    },

    async collectOrder(
        orderId: string,
        payload: CollectPackagingOrderPayload = {}
    ) {
        const response = await axiosClient.post<ApiResponse<PackagingOrderDetail>>(
            `${BASE_URL}/${orderId}/collect`,
            payload
        )

        return response.data
    },

    async packageOrder(
        orderId: string,
        payload: PackagePackagingOrderPayload = {}
    ) {
        const response = await axiosClient.post<ApiResponse<PackagingOrderDetail>>(
            `${BASE_URL}/${orderId}/package`,
            payload
        )

        return response.data
    },

    async failPackaging(orderId: string, payload: FailPackagingOrderPayload) {
        const response = await axiosClient.post<ApiResponse<PackagingOrderDetail>>(
            `${BASE_URL}/${orderId}/fail`,
            payload
        )

        return response.data
    },
}

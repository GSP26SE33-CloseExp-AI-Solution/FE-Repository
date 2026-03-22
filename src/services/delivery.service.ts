import axiosClient from "@/utils/axiosClient"
import type {
    ApiResponse,
    AssignDeliveryPayload,
    CustomerConfirmationPayload,
    DeliveryActionPayload,
    DeliveryGroupDetail,
    DeliveryGroupListItem,
    DeliveryOrderDetail,
    DeliveryStats,
    PaginationResult,
    ConfirmDeliveryPayload,
    ReportDeliveryFailurePayload,
    DeliveryHistoryItem,
} from "@/types/admin.type"

const unwrap = <T,>(response: { data: ApiResponse<T> }) => response.data.data

export const deliveryService = {
    /* =========================
       Delivery Groups
    ========================= */
    async getGroups(params?: {
        DeliveryDate?: string
        PageNumber?: number
        PageSize?: number
        status?: string
    }) {
        const response = await axiosClient.get<
            ApiResponse<PaginationResult<DeliveryGroupListItem>>
        >("/delivery/groups", { params })
        return unwrap(response)
    },

    async getAvailableGroups(params?: { deliveryDate?: string }) {
        const response = await axiosClient.get<ApiResponse<DeliveryGroupListItem[]>>(
            "/delivery/groups/available",
            { params }
        )
        return unwrap(response)
    },

    async getMyGroups(params?: {
        status?: string
        deliveryDate?: string
        pageNumber?: number
        pageSize?: number
    }) {
        const response = await axiosClient.get<
            ApiResponse<PaginationResult<DeliveryGroupListItem>>
        >("/delivery/groups/my", { params })
        return unwrap(response)
    },

    async getGroupDetail(deliveryGroupId: string) {
        const response = await axiosClient.get<ApiResponse<DeliveryGroupDetail>>(
            `/delivery/groups/${deliveryGroupId}`
        )
        return unwrap(response)
    },

    /* =========================
       Delivery Assignment
    ========================= */
    async assignGroup(deliveryGroupId: string, payload: AssignDeliveryPayload) {
        const response = await axiosClient.post<ApiResponse<DeliveryGroupDetail>>(
            `/delivery/groups/${deliveryGroupId}/assign`,
            payload
        )
        return unwrap(response)
    },

    async updateGroupAssignment(
        deliveryGroupId: string,
        payload: AssignDeliveryPayload
    ) {
        const response = await axiosClient.put<ApiResponse<DeliveryGroupDetail>>(
            `/delivery/groups/${deliveryGroupId}/assignment`,
            payload
        )
        return unwrap(response)
    },

    /* =========================
       Delivery Group Actions
    ========================= */
    async acceptGroup(deliveryGroupId: string, payload?: DeliveryActionPayload) {
        const response = await axiosClient.post<ApiResponse<DeliveryGroupDetail>>(
            `/delivery/groups/${deliveryGroupId}/accept`,
            payload ?? {}
        )
        return unwrap(response)
    },

    async startGroup(deliveryGroupId: string, payload?: DeliveryActionPayload) {
        const response = await axiosClient.post<ApiResponse<DeliveryGroupDetail>>(
            `/delivery/groups/${deliveryGroupId}/start`,
            payload ?? {}
        )
        return unwrap(response)
    },

    async completeGroup(deliveryGroupId: string) {
        const response = await axiosClient.post<ApiResponse<DeliveryGroupDetail>>(
            `/delivery/groups/${deliveryGroupId}/complete`
        )
        return unwrap(response)
    },

    /* =========================
       Delivery Orders
    ========================= */
    async getDeliveryOrder(orderId: string) {
        const response = await axiosClient.get<ApiResponse<DeliveryOrderDetail>>(
            `/delivery/orders/${orderId}`
        )
        return unwrap(response)
    },

    async confirmDelivery(orderId: string, payload: ConfirmDeliveryPayload) {
        const response = await axiosClient.post<ApiResponse<DeliveryOrderDetail>>(
            `/delivery/orders/${orderId}/confirm-delivery`,
            payload
        )
        return unwrap(response)
    },

    async reportFailure(orderId: string, payload: ReportDeliveryFailurePayload) {
        const response = await axiosClient.post<ApiResponse<DeliveryOrderDetail>>(
            `/delivery/orders/${orderId}/report-failure`,
            payload
        )
        return unwrap(response)
    },

    async customerConfirmation(
        orderId: string,
        payload?: CustomerConfirmationPayload
    ) {
        const response = await axiosClient.post<ApiResponse<DeliveryOrderDetail>>(
            `/delivery/orders/${orderId}/customer-confirmation`,
            payload ?? {}
        )
        return unwrap(response)
    },

    /* =========================
       Delivery History / Stats
    ========================= */
    async getHistory(params?: {
        fromDate?: string
        toDate?: string
        status?: string
        pageNumber?: number
        pageSize?: number
    }) {
        const response = await axiosClient.get<
            ApiResponse<PaginationResult<DeliveryHistoryItem>>
        >("/delivery/history", { params })
        return unwrap(response)
    },

    async getStats() {
        const response = await axiosClient.get<ApiResponse<DeliveryStats>>(
            "/delivery/stats"
        )
        return unwrap(response)
    },
}

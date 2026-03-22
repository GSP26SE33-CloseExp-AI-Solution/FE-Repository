import axiosClient from "@/utils/axiosClient"
import type {
    ApiResponse,
    CreateFeedbackPayload,
    FeedbackItem,
    UpdateFeedbackPayload,
} from "@/types/admin.type"

const unwrap = <T,>(response: { data: ApiResponse<T> }) => response.data.data

export const feedbackService = {
    /* =========================
       Feedbacks
    ========================= */
    async getMyFeedbacks() {
        const response = await axiosClient.get<ApiResponse<FeedbackItem[]>>(
            "/feedback/me"
        )
        return unwrap(response)
    },

    async getAllFeedbacks() {
        const response = await axiosClient.get<ApiResponse<FeedbackItem[]>>(
            "/feedback"
        )
        return unwrap(response)
    },

    async getFeedbackById(feedbackId: string) {
        const response = await axiosClient.get<ApiResponse<FeedbackItem>>(
            `/feedback/${feedbackId}`
        )
        return unwrap(response)
    },

    async getFeedbacksByOrder(orderId: string) {
        const response = await axiosClient.get<ApiResponse<FeedbackItem[]>>(
            `/feedback/order/${orderId}`
        )
        return unwrap(response)
    },

    async createFeedback(payload: CreateFeedbackPayload) {
        const response = await axiosClient.post<ApiResponse<FeedbackItem>>(
            "/feedback",
            payload
        )
        return unwrap(response)
    },

    async updateFeedback(feedbackId: string, payload: UpdateFeedbackPayload) {
        const response = await axiosClient.put<ApiResponse<FeedbackItem>>(
            `/feedback/${feedbackId}`,
            payload
        )
        return unwrap(response)
    },

    async deleteFeedback(feedbackId: string) {
        const response = await axiosClient.delete<ApiResponse<boolean>>(
            `/feedback/${feedbackId}`
        )
        return unwrap(response)
    },
}

import axios from "axios"

import axiosClient from "@/utils/axiosClient"
import type { ApiEnvelope } from "@/types/api.types"
import type {
    CreateFeedbackPayload,
    FeedbackItem,
    UpdateFeedbackPayload,
} from "@/types/feedback.type"

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data.data

const getAxiosErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as
            | { message?: string; errors?: string[]; error?: string }
            | undefined
        return data?.errors?.[0] || data?.message || data?.error || fallback
    }

    if (error instanceof Error && error.message) {
        return error.message
    }

    return fallback
}

export const feedbackService = {
    async getMine(): Promise<FeedbackItem[]> {
        try {
            const response = await axiosClient.get<ApiEnvelope<FeedbackItem[]>>(
                "/feedback/me",
            )
            return unwrap(response) ?? []
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(error, "Không thể tải đánh giá của bạn"),
            )
        }
    },

    async getByOrderId(orderId: string): Promise<FeedbackItem[]> {
        try {
            const response = await axiosClient.get<ApiEnvelope<FeedbackItem[]>>(
                `/feedback/order/${orderId}`,
            )
            return unwrap(response) ?? []
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(
                    error,
                    "Không thể tải đánh giá theo đơn hàng",
                ),
            )
        }
    },

    async create(payload: CreateFeedbackPayload): Promise<FeedbackItem> {
        try {
            const response = await axiosClient.post<ApiEnvelope<FeedbackItem>>(
                "/feedback",
                payload,
            )
            return unwrap(response)
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(error, "Gửi đánh giá không thành công"),
            )
        }
    },

    async update(
        feedbackId: string,
        payload: UpdateFeedbackPayload,
    ): Promise<FeedbackItem> {
        try {
            const response = await axiosClient.put<ApiEnvelope<FeedbackItem>>(
                `/feedback/${feedbackId}`,
                payload,
            )
            return unwrap(response)
        } catch (error) {
            throw new Error(
                getAxiosErrorMessage(error, "Cập nhật đánh giá không thành công"),
            )
        }
    },
}

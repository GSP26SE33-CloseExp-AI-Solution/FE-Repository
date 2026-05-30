import axios from "axios"

import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    ApiNotification,
    UpdateNotificationPayload,
} from "@/types/notification.type"

const unwrap = <T,>(response: ApiResponse<T>): T => {
    if (!response.success) {
        const message =
            response.errors?.filter(Boolean).join(", ") ||
            response.message ||
            "Request failed"
        throw new Error(message)
    }
    return response.data
}

const getAxiosErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiResponse<unknown> | undefined
        return (
            data?.errors?.filter(Boolean).join(", ") ||
            data?.message ||
            fallback
        )
    }

    if (error instanceof Error && error.message) {
        return error.message
    }

    return fallback
}

export const notificationService = {
    async getMine(): Promise<ApiNotification[]> {
        const response = await axiosClient.get<ApiResponse<ApiNotification[]>>(
            "/notifications/me",
        )
        return unwrap(response.data) ?? []
    },

    async getAll(): Promise<ApiNotification[]> {
        const response = await axiosClient.get<ApiResponse<ApiNotification[]>>(
            "/notifications",
        )
        return unwrap(response.data) ?? []
    },

    async markAsRead(notificationId: string): Promise<ApiNotification> {
        const response = await axiosClient.put<ApiResponse<ApiNotification>>(
            `/notifications/${notificationId}`,
            { isRead: true } satisfies UpdateNotificationPayload,
        )
        return unwrap(response.data)
    },

    getErrorMessage(error: unknown, fallback: string) {
        return getAxiosErrorMessage(error, fallback)
    },
}

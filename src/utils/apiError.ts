import axios from "axios"
import type { ApiResponse } from "@/types/api.types"

export const getApiErrorMessage = (
    error: unknown,
    fallback = "Yêu cầu thất bại",
): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiResponse<unknown> | undefined
        return (
            data?.errors?.filter(Boolean).join(", ") ||
            data?.message ||
            fallback
        )
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallback
}

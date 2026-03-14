import axios from "axios"
import axiosClient from "@/utils/axiosClient"
import { ApiResponse } from "@/types/auth.types"
import { User, UpdateUserStatusPayload } from "@/types/user.type"

const unwrap = <T>(res: ApiResponse<T>): T => {
    if (!res?.success) {
        const msg = res?.errors?.[0] || res?.message || "Request failed"
        throw new Error(msg)
    }
    return res.data
}

const getAxiosErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as
            | { message?: string; errors?: string[]; error?: string }
            | undefined

        return data?.errors?.[0] || data?.message || data?.error || fallback
    }

    return fallback
}

export const getUsersApi = async (): Promise<User[]> => {
    try {
        const res = await axiosClient.get<ApiResponse<User[]>>("/Users")
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Không tải được danh sách tài khoản"))
    }
}

export const updateUserStatusApi = async (
    userId: string,
    payload: UpdateUserStatusPayload
): Promise<User> => {
    try {
        const res = await axiosClient.patch<ApiResponse<User>>(`/Users/${userId}/status`, payload)
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Cập nhật trạng thái tài khoản thất bại"))
    }
}

import axios from "axios"
import axiosClient from "@/utils/axiosClient"
import {
    AuthData,
    ApiResponse,
    RegisterPayload,
    VerifyOtpPayload,
    ResendOtpPayload,
} from "@/types/auth.types"

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

    if (error instanceof Error) {
        return error.message || fallback
    }

    return fallback
}

export const loginApi = async (payload: {
    email: string
    password: string
}): Promise<AuthData> => {
    try {
        const res = await axiosClient.post<ApiResponse<AuthData>>("/authen/login", payload)
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Đăng nhập thất bại"))
    }
}

export const registerApi = async (
    payload: RegisterPayload
): Promise<ApiResponse<null>> => {
    try {
        const res = await axiosClient.post<ApiResponse<null>>("/authen/register", payload)

        if (!res.data?.success) {
            const msg = res.data?.errors?.[0] || res.data?.message || "Đăng ký thất bại"
            throw new Error(msg)
        }

        return res.data
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Đăng ký thất bại"))
    }
}

export const verifyOtpApi = async (
    payload: VerifyOtpPayload
): Promise<ApiResponse<boolean>> => {
    try {
        const res = await axiosClient.post<ApiResponse<boolean>>("/authen/verify-otp", payload)

        if (!res.data?.success) {
            const msg = res.data?.errors?.[0] || res.data?.message || "Xác minh OTP thất bại"
            throw new Error(msg)
        }

        return res.data
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Xác minh OTP thất bại"))
    }
}

export const resendOtpApi = async (
    payload: ResendOtpPayload
): Promise<ApiResponse<unknown>> => {
    try {
        const res = await axiosClient.post<ApiResponse<unknown>>("/authen/resend-otp", payload)

        if (!res.data?.success) {
            const msg = res.data?.errors?.[0] || res.data?.message || "Gửi lại OTP thất bại"
            throw new Error(msg)
        }

        return res.data
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Gửi lại OTP thất bại"))
    }
}

export const refreshTokenApi = async (refreshToken: string): Promise<AuthData> => {
    try {
        const res = await axiosClient.post<ApiResponse<AuthData>>("/authen/refresh-token", { refreshToken })
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Làm mới phiên đăng nhập thất bại"))
    }
}

export const authService = {
    async logout(refreshToken: string) {
        try {
            const res = await axiosClient.post<ApiResponse<boolean>>("/authen/logout", { refreshToken })
            return res.data
        } catch (error) {
            throw new Error(getAxiosErrorMessage(error, "Đăng xuất thất bại"))
        }
    },
}

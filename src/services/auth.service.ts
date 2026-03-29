import axios from "axios"
import axiosClient from "@/utils/axiosClient"
import { authStorage } from "@/utils/authStorage"
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

        return (
            data?.errors?.[0] ||
            data?.message ||
            data?.error ||
            fallback
        )
    }

    return fallback
}

export const loginApi = async (payload: {
    email: string
    password: string
}): Promise<AuthData> => {
    try {
        const res = await axiosClient.post<ApiResponse<AuthData>>("/Auth/login", payload)
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Đăng nhập thất bại"))
    }
}

export const registerApi = async (
    payload: RegisterPayload
): Promise<ApiResponse<null>> => {
    try {
        const res = await axiosClient.post<ApiResponse<null>>("/Auth/register", payload)
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
): Promise<ApiResponse<string>> => {
    try {
        const res = await axiosClient.post<ApiResponse<string>>("/Auth/verify-otp", payload)

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
): Promise<ApiResponse<string>> => {
    try {
        const res = await axiosClient.post<ApiResponse<string>>("/Auth/resend-otp", payload)

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
        const res = await axiosClient.post<ApiResponse<AuthData>>("/Auth/refresh-token", { refreshToken })
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Làm mới phiên đăng nhập thất bại"))
    }
}

/** Giữ refresh token cũ — API chỉ trả access token mới sau khi chọn mã nhân viên. */
export const selectStaffContextApi = async (employeeCode: string): Promise<AuthData> => {
    const session = authStorage.get()
    if (!session?.refreshToken) {
        throw new Error("Chưa có phiên đăng nhập")
    }
    try {
        const res = await axiosClient.post<ApiResponse<AuthData>>(
            "/Auth/select-staff-context",
            {
                employeeCode,
            }
        )
        const data = unwrap(res.data)
        return {
            ...data,
            refreshToken: data.refreshToken || session.refreshToken,
        }
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Chọn mã nhân viên thất bại"))
    }
}

export const authService = {
    async logout(refreshToken: string) {
        try {
            const res = await axiosClient.post<ApiResponse<boolean>>("/Auth/logout", { refreshToken })
            return res.data
        } catch (error) {
            throw new Error(getAxiosErrorMessage(error, "Đăng xuất thất bại"))
        }
    },
}

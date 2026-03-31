import axios from "axios"
import axiosClient from "@/utils/axiosClient"
import type {
    AuthData,
    ApiResponse,
    RegisterPayload,
    VerifyOtpPayload,
    ResendOtpPayload,
    ForgotPasswordPayload,
    ResetPasswordPayload,
    GoogleLoginPayload,
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
        const res = await axiosClient.post<ApiResponse<AuthData>>("/auth/login", payload)
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Đăng nhập không thành công"))
    }
}

export const googleLoginApi = async (
    payload: GoogleLoginPayload
): Promise<AuthData> => {
    try {
        const res = await axiosClient.post<ApiResponse<AuthData>>(
            "/auth/google-login",
            payload
        )
        return unwrap(res.data)
    } catch (error) {
        throw new Error(
            getAxiosErrorMessage(
                error,
                "Đăng nhập Google thất bại"
            )
        )
    }
}

export const registerApi = async (
    payload: RegisterPayload
): Promise<ApiResponse<null>> => {
    try {
        const res = await axiosClient.post<ApiResponse<null>>("/auth/register", payload)

        if (!res.data?.success) {
            const msg = res.data?.errors?.[0] || res.data?.message || "Đăng ký không thành công"
            throw new Error(msg)
        }

        return res.data
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Đăng ký không thành công"))
    }
}

export const verifyOtpApi = async (
    payload: VerifyOtpPayload
): Promise<ApiResponse<boolean>> => {
    try {
        const res = await axiosClient.post<ApiResponse<boolean>>("/auth/verify-otp", payload)

        if (!res.data?.success) {
            const msg =
                res.data?.errors?.[0] || res.data?.message || "Xác minh OTP không thành công"
            throw new Error(msg)
        }

        return res.data
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Xác minh OTP không thành công"))
    }
}

export const resendOtpApi = async (
    payload: ResendOtpPayload
): Promise<ApiResponse<boolean>> => {
    try {
        const res = await axiosClient.post<ApiResponse<boolean>>("/auth/resend-otp", payload)

        if (!res.data?.success) {
            const msg = res.data?.errors?.[0] || res.data?.message || "Gửi lại OTP không thành công"
            throw new Error(msg)
        }

        return res.data
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Gửi lại OTP không thành công"))
    }
}

export const forgotPasswordApi = async (
    payload: ForgotPasswordPayload
): Promise<ApiResponse<boolean>> => {
    try {
        const res = await axiosClient.post<ApiResponse<boolean>>(
            "/auth/forgot-password",
            payload
        )

        if (!res.data?.success) {
            const msg =
                res.data?.errors?.[0] ||
                res.data?.message ||
                "Không thể gửi mã đặt lại mật khẩu"
            throw new Error(msg)
        }

        return res.data
    } catch (error) {
        throw new Error(
            getAxiosErrorMessage(error, "Không thể gửi mã đặt lại mật khẩu")
        )
    }
}

export const resetPasswordApi = async (
    payload: ResetPasswordPayload
): Promise<ApiResponse<boolean>> => {
    try {
        const res = await axiosClient.post<ApiResponse<boolean>>(
            "/auth/reset-password",
            payload
        )

        if (!res.data?.success) {
            const msg =
                res.data?.errors?.[0] ||
                res.data?.message ||
                "Đặt lại mật khẩu không thành công"
            throw new Error(msg)
        }

        return res.data
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Đặt lại mật khẩu không thành công"))
    }
}

export const refreshTokenApi = async (refreshToken: string): Promise<AuthData> => {
    try {
        const res = await axiosClient.post<ApiResponse<AuthData>>("/auth/refresh-token", {
            refreshToken,
        })
        return unwrap(res.data)
    } catch (error) {
        throw new Error(getAxiosErrorMessage(error, "Làm mới phiên đăng nhập không thành công"))
    }
}

export const logoutAllApi = async (): Promise<ApiResponse<boolean>> => {
    try {
        const res = await axiosClient.post<ApiResponse<boolean>>(
            "/auth/logout-all",
            {}
        )

        if (!res.data?.success) {
            const msg =
                res.data?.errors?.[0] ||
                res.data?.message ||
                "Đăng xuất khỏi tất cả thiết bị không thành công"
            throw new Error(msg)
        }

        return res.data
    } catch (error) {
        throw new Error(
            getAxiosErrorMessage(
                error,
                "Đăng xuất khỏi tất cả thiết bị không thành công"
            )
        )
    }
}

export const authService = {
    async logout(refreshToken: string) {
        try {
            const res = await axiosClient.post<ApiResponse<boolean>>("/auth/logout", {
                refreshToken,
            })

            if (!res.data?.success) {
                const msg = res.data?.errors?.[0] || res.data?.message || "Đăng xuất không thành công"
                throw new Error(msg)
            }

            return res.data
        } catch (error) {
            throw new Error(getAxiosErrorMessage(error, "Đăng xuất không thành công"))
        }
    },

    async logoutAll() {
        return logoutAllApi()
    },
}

import { useState } from "react"
import {
    loginApi,
    registerApi,
    verifyOtpApi,
    resendOtpApi,
    googleLoginApi,
} from "@/services/auth.service"
import type { ApiResponse } from "@/types/api.types"
import type {
    AuthData,
    RegisterPayload,
    VerifyOtpPayload,
    ResendOtpPayload,
    GoogleLoginPayload,
} from "@/types/auth.types"
import { useAuthContext } from "@/contexts/AuthContext"

export const useAuth = () => {
    const [loading, setLoading] = useState(false)
    const { user, loginSuccess, logout: contextLogout } = useAuthContext()

    const login = async (email: string, password: string): Promise<AuthData> => {
        try {
            setLoading(true)
            const session = await loginApi({ email, password })
            loginSuccess(session)
            return session
        } finally {
            setLoading(false)
        }
    }

    const googleLogin = async (payload: GoogleLoginPayload): Promise<AuthData> => {
        try {
            setLoading(true)
            const session = await googleLoginApi(payload)
            loginSuccess(session)
            return session
        } finally {
            setLoading(false)
        }
    }

    const register = async (payload: RegisterPayload): Promise<ApiResponse<null>> => {
        try {
            setLoading(true)
            return await registerApi(payload)
        } finally {
            setLoading(false)
        }
    }

    const verifyOtp = async (payload: VerifyOtpPayload): Promise<ApiResponse<boolean>> => {
        try {
            setLoading(true)
            return await verifyOtpApi(payload)
        } finally {
            setLoading(false)
        }
    }

    const resendOtp = async (payload: ResendOtpPayload): Promise<ApiResponse<boolean>> => {
        try {
            setLoading(true)
            return await resendOtpApi(payload)
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        await contextLogout()
    }

    return {
        user,
        login,
        googleLogin,
        register,
        verifyOtp,
        resendOtp,
        logout,
        loading,
    }
}

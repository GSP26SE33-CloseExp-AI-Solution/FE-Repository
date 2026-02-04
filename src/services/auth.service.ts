import axiosClient from "@/utils/axiosClient"
import { AuthData, ApiResponse } from "@/types/auth.types"

export const loginApi = async (payload: {
    email: string
    password: string
}): Promise<AuthData> => {
    const res = await axiosClient.post<ApiResponse<AuthData>>("/Auth/login", payload)

    console.log("🌐 RAW API:", res.data)

    return res.data.data
}

export const authService = {
    async logout(refreshToken: string) {
        console.log("🚪 [LOGOUT API] call")
        console.log("🔑 refreshToken:", refreshToken)

        const res = await axiosClient.post("/Auth/logout", {
            refreshToken,
        })

        console.log("✅ [LOGOUT API] response:", res.data)
        return res.data
    },
}

export const registerApi = async (payload: any): Promise<AuthData> => {
    const res = await axiosClient.post<ApiResponse<AuthData>>("/Auth/register", payload)
    return res.data.data
}

export const refreshTokenApi = async (refreshToken: string): Promise<AuthData> => {
    const res = await axiosClient.post<ApiResponse<AuthData>>("/Auth/refresh-token", {
        refreshToken,
    })
    return res.data.data
}

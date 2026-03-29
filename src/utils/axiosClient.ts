import axios from "axios"
import { authStorage } from "@/utils/authStorage"
import { refreshTokenApi } from "@/services/auth.service"
import { getRedirectByRoleSafe } from "@/utils/roleRedirect"

const axiosClient = axios.create({
    baseURL: `${process.env.REACT_APP_API_URL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
})

axiosClient.interceptors.request.use((config) => {
    const token = authStorage.getAccessToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

axiosClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config
        const reqUrl = String(originalRequest?.url ?? "").toLowerCase()

        // Tránh vòng lặp khi chính request refresh-token trả 401
        if (reqUrl.includes("refresh-token")) {
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const body = error.response?.data as
                | { errors?: string[] | null }
                | undefined
            const hadRoleChanged =
                body?.errors?.includes("role_changed") ?? false

            const refreshToken = authStorage.getRefreshToken()
            if (!refreshToken) {
                authStorage.clear()
                window.location.href = "/login"
                return Promise.reject(error)
            }

            try {
                const newSession = await refreshTokenApi(refreshToken)
                authStorage.set(newSession)

                // Đổi vai trò (vd. Vendor → SupermarketStaff): full reload để guard / sidebar đồng bộ
                if (hadRoleChanged) {
                    window.location.href = getRedirectByRoleSafe(
                        newSession.user.roleId
                    )
                    return Promise.reject(error)
                }

                originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`
                return axiosClient(originalRequest)
            } catch {
                authStorage.clear()
                window.location.href = "/login"
            }
        }

        return Promise.reject(error)
    }
)

export default axiosClient

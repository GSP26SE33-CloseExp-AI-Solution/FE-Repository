import axios from "axios"
import { authStorage } from "@/utils/authStorage"
import { refreshTokenApi } from "@/services/auth.service"

const axiosClient = axios.create({
    baseURL: "/api",
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

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const refreshToken = authStorage.getRefreshToken()
            if (!refreshToken) {
                authStorage.clear()
                window.location.href = "/login"
                return Promise.reject(error)
            }

            try {
                const newSession = await refreshTokenApi(refreshToken)
                authStorage.set(newSession)

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

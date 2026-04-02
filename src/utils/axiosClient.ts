import axios, { AxiosHeaders } from "axios"
import { authStorage } from "@/utils/authStorage"
import { refreshTokenApi } from "@/services/auth.service"

const axiosClient = axios.create({
    baseURL: `${process.env.REACT_APP_API_URL}/api`,
})

axiosClient.interceptors.request.use((config) => {
    const token = authStorage.getAccessToken()
    const headers = AxiosHeaders.from(config.headers)

    if (token) {
        headers.set("Authorization", `Bearer ${token}`)
    }

    if (config.data instanceof FormData) {
        headers.delete("Content-Type")
    } else if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
    }

    config.headers = headers
    return config
})

axiosClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
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

                const headers = AxiosHeaders.from(originalRequest.headers)
                headers.set("Authorization", `Bearer ${newSession.accessToken}`)

                if (originalRequest.data instanceof FormData) {
                    headers.delete("Content-Type")
                }

                originalRequest.headers = headers
                return axiosClient(originalRequest)
            } catch {
                authStorage.clear()
                window.location.href = "/login"
                return Promise.reject(error)
            }
        }

        return Promise.reject(error)
    }
)

export default axiosClient

import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios"
import { authStorage } from "@/utils/authStorage"
import { refreshTokenApi } from "@/services/auth.service"

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean
}

const axiosClient = axios.create({
    baseURL: `${process.env.REACT_APP_API_URL}/api`,
})

let isRedirectingToLogin = false

const redirectToLogin = () => {
    if (isRedirectingToLogin) return
    isRedirectingToLogin = true

    authStorage.clear()
    window.location.href = "/login"
}

const isRefreshTokenRequest = (url?: string) => {
    if (!url) return false
    return url.includes("/auth/refresh-token")
}

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
        const originalRequest = error.config as RetryableRequestConfig | undefined
        const status = error.response?.status
        const requestUrl = originalRequest?.url

        console.error("[axiosClient] response error:", {
            url: requestUrl,
            method: originalRequest?.method,
            status,
            data: error.response?.data,
        })

        if (!originalRequest) {
            return Promise.reject(error)
        }

        // Nếu chính request refresh-token bị 401 thì logout luôn, không retry nữa
        if (status === 401 && isRefreshTokenRequest(requestUrl)) {
            console.error(
                "[axiosClient] refresh-token request failed with 401 -> force logout",
            )
            redirectToLogin()
            return Promise.reject(error)
        }

        // Chỉ retry 1 lần cho request thường
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const refreshToken = authStorage.getRefreshToken()

            if (!refreshToken) {
                console.error(
                    "[axiosClient] no refresh token found -> clear auth and redirect",
                )
                redirectToLogin()
                return Promise.reject(error)
            }

            try {
                console.log("[axiosClient] attempting refresh token...")
                const newSession = await refreshTokenApi(refreshToken)

                console.log("[axiosClient] refresh token success:", newSession)

                authStorage.set(newSession)

                const headers = AxiosHeaders.from(originalRequest.headers)
                headers.set("Authorization", `Bearer ${newSession.accessToken}`)

                if (originalRequest.data instanceof FormData) {
                    headers.delete("Content-Type")
                } else if (!headers.has("Content-Type")) {
                    headers.set("Content-Type", "application/json")
                }

                originalRequest.headers = headers

                console.log("[axiosClient] retrying original request:", {
                    url: originalRequest.url,
                    method: originalRequest.method,
                })

                return axiosClient(originalRequest)
            } catch (refreshError: any) {
                console.error("[axiosClient] refresh token failed:", {
                    status: refreshError?.response?.status,
                    data: refreshError?.response?.data,
                })

                redirectToLogin()
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    },
)

export default axiosClient

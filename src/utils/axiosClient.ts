import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { showError } from "@/utils/toast";
import { getAccessToken, clearAuth, isTokenExpired } from "@/utils/authStorage";
import { IAuthResponse } from "@/types/auth.api.type";

// const axiosClient = axios.create({
//     baseURL: process.env.REACT_APP_API_URL,
//     timeout: 10000,
// });

const axiosClient = axios.create({
    baseURL: "/api",
    timeout: 10000,
});

// ================= REQUEST =================
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();

        if (config.url?.includes("/Auth/login") || config.url?.includes("/Auth/register")) {
            return config;
        }

        if (isTokenExpired()) {
            clearAuth();
            if (window.location.pathname !== "/login") {
                showError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
                window.location.href = "/login";
            }
            return Promise.reject(new Error("Phiên đã hết hạn"));
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    }
);

// ================= RESPONSE =================
axiosClient.interceptors.response.use(
    (response: AxiosResponse<IAuthResponse>) => {
        const res = response.data;

        if (!res.success) {
            showError(res.message || "Yêu cầu không thành công");
            return Promise.reject(new Error(res.message || "Lỗi máy chủ"));
        }

        return {
            ...response,
            data: res.data,
        };
    },
    (error: AxiosError) => {
        if (!error.response) {
            showError("Không thể kết nối tới máy chủ");
        }
        else if (error.response.status === 401) {
            clearAuth();
            if (window.location.pathname !== "/login") {
                showError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
                window.location.href = "/login";
            }
        }
        else if (error.response.status >= 500) {
            showError("Máy chủ đang gặp sự cố, vui lòng thử lại sau");
        }
        else {
            const message =
                (error.response.data as any)?.message || "Có lỗi xảy ra";
            showError(message);
        }

        return Promise.reject(error);
    }
);

export default axiosClient;

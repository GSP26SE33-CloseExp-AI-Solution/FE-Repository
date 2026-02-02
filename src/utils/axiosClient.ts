import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { showError } from "@/utils/toast";
import { getAuth, clearAuth } from "@/utils/authStorage";
import { IAuthResponse } from "@/types/auth.api.type";

const axiosClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 10000,
});

// ================= REQUEST =================
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const auth = getAuth();

        if (auth?.accessToken) {
            config.headers.Authorization = `Bearer ${auth.accessToken}`;
        }

        return config;
    }
);

// ================= RESPONSE =================
axiosClient.interceptors.response.use(
    (response) => {
        const res: IAuthResponse | any = response.data;

        if (res && res.success === false) {
            showError(res.message || "Yêu cầu không thành công");
            return Promise.reject(new Error(res.message || "API Error"));
        }

        return res.data;
    },
    (error: AxiosError) => {
        if (!error.response) {
            showError("Mất kết nối mạng hoặc máy chủ không phản hồi");
        }
        else if (error.response.status === 401) {
            showError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
            clearAuth();
            window.location.href = "/login";
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

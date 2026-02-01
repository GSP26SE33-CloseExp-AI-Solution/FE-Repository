import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAuth, clearAuth } from "@/utils/auth";
import { IAuthResponse } from "@/types/auth.type";

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
            return Promise.reject(new Error(res.message || "API Error"));
        }

        return res.data;
    },
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            clearAuth();
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default axiosClient;

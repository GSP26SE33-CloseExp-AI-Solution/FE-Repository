import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'https://api.your-backend.com', // đổi lại API thật sau này
    timeout: 10000,
});

// Request interceptor
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor
axiosClient.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
);

export default axiosClient;

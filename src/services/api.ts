import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api', // URL backend (đổi sau)
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// interceptor (để sẵn, dùng sau)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;

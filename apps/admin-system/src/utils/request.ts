import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { getToken, removeAuthStorage } from './auth';

const request = axios.create({
    baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL || '',
    timeout: 15000,
});

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

request.interceptors.response.use(
    (response) => response.data,
    (error: AxiosError<{ message?: string }>) => {
        const message = error.response?.data?.message || error.message || '请求失败';
        if (error.response?.status === 401) {
            removeAuthStorage();
            redirectToLogin();
        }
        ElMessage.error(message);
        return Promise.reject(error);
    },
);

export default request;

function redirectToLogin() {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (window.location.pathname === '/login') {
        return;
    }
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
}

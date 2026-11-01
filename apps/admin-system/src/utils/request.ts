import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { resolveFriendlyRequestMessage } from '@acquiring/shared';
import { removeAuthStorage } from './auth';
import { isPublicAuthPath } from './auth-navigation';

const request = axios.create({
    baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL || '',
    timeout: 15000,
    withCredentials: true,
});

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.headers['X-Auth-Mode'] = 'cookie';
    const csrfToken = readCsrfCookie();
    if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
});

/**
 * 读取管理后台 CSRF Cookie；畸形编码不得中断正常的请求错误处理流程。
 */
function readCsrfCookie(): string {
    const cookieName = 'VEXRA_ADMIN_CSRF=';
    const encodedValue = document.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(cookieName))
        ?.slice(cookieName.length);
    if (!encodedValue) {
        return '';
    }
    try {
        return decodeURIComponent(encodedValue);
    } catch {
        return '';
    }
}

request.interceptors.response.use(
    (response) => response.data,
    (error: AxiosError<{ message?: string }>) => {
        const locale = document.documentElement.lang || navigator.language || 'zh-CN';
        const message = resolveFriendlyRequestMessage(error, locale);
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
    if (isPublicAuthPath(window.location.pathname)) {
        return;
    }
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
}

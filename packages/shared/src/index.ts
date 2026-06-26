import axios, { type AxiosInstance } from 'axios';
export * from './brand';
export * from './paymentBrand';
export { default as PaymentLogoGroup } from './components/PaymentLogoGroup.vue';
export { default as PaymentLogoMark } from './components/PaymentLogoMark.vue';
export { default as VexraBrandLogo } from './components/VexraBrandLogo.vue';

export interface CommonResult<T> {
    code: string;
    message: string;
    data: T;
}

export interface PageQuery {
    pageNo?: number;
    pageSize?: number;
}

export interface PageResult<T> {
    total: number;
    pageNo: number;
    pageSize: number;
    pages: number;
    records: T[];
}

export interface AuthAccount {
    accountId: number;
    userId: number;
    merchantUserId?: number | null;
    appCode: string;
    loginAccount: string;
    realName: string;
    merchantId?: string | null;
    merchantAdmin?: boolean;
    status: number;
}

export interface AuthMenu {
    id: number;
    parentId: number;
    menuCode: string;
    menuName: string;
    menuType: string;
    routePath?: string;
    componentPath?: string;
    permissionCode?: string;
    icon?: string;
    redirect?: string;
    visible?: number;
    keepAlive?: number;
    externalLink?: number;
    sortNo?: number;
    children: AuthMenu[];
}

export interface AuthLoginResponse {
    accessToken?: string | null;
    tokenType: string;
    expiresIn: number;
    expireAt: string;
    account: AuthAccount;
    menus: AuthMenu[];
    roles?: string[];
    permissions: string[];
}

export interface LoginRequest {
    loginAccount: string;
    password: string;
    merchantId?: string;
    verifyCodeId?: string;
    verifyCode?: string;
}

export interface AuthVerifyCodeSendResponse {
    verifyCodeId: string;
    receiverType: 'SMS' | 'EMAIL' | 'TOTP';
    maskedReceiver: string;
    expireSeconds: number;
    devCode?: string;
}

export interface AuthSession {
    token: string;
    account: AuthAccount;
    menus: AuthMenu[];
    roles?: string[];
    permissions: string[];
}

export type SessionReader = () => AuthSession | null;
export type UnauthorizedHandler = () => void;
export type LocaleReader = () => string;
export type ErrorMessageResolver = (error: unknown) => string;

export interface IdleLogoutOptions {
    readSession: SessionReader;
    onIdle: UnauthorizedHandler;
    timeoutMs?: number;
}

const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'click', 'scroll', 'touchstart'] as const;

function createRequestId(): string {
    const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `WEB${Date.now()}${randomPart}`;
}

export function createHttpClient(
    baseURL: string,
    readSession: SessionReader,
    onUnauthorized: UnauthorizedHandler,
    readLocale?: LocaleReader,
    resolveErrorMessage?: ErrorMessageResolver,
): AxiosInstance {
    const client = axios.create({
        baseURL,
        timeout: 15000,
    });

    client.interceptors.request.use((config) => {
        const session = readSession();
        const token = session?.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['X-Request-Id'] = config.headers['X-Request-Id'] || createRequestId();
        if (session?.account) {
            config.headers['X-Operator-Id'] = String(session.account.accountId);
            config.headers['X-Operator-Name'] =
                session.account.realName || session.account.loginAccount;
            config.headers['X-Operator-Type'] = session.account.merchantId ? '2' : '1';
            if (session.account.merchantId) {
                config.headers['X-Merchant-Id'] = session.account.merchantId;
            }
        }
        const locale = readLocale?.();
        if (locale) {
            config.headers['Accept-Language'] = locale;
        }
        return config;
    });

    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                onUnauthorized();
            }
            if (resolveErrorMessage) {
                error.friendlyMessage = resolveErrorMessage(error);
            }
            return Promise.reject(error);
        },
    );

    return client;
}

export function setupIdleLogout(options: IdleLogoutOptions): () => void {
    if (typeof window === 'undefined') {
        return () => undefined;
    }
    const timeoutMs = options.timeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
    let lastActiveAt = Date.now();
    let hasActiveSession = false;
    let timer: ReturnType<typeof window.setTimeout> | undefined;

    const clearTimer = () => {
        if (timer) {
            window.clearTimeout(timer);
            timer = undefined;
        }
    };
    const schedule = () => {
        clearTimer();
        const hasSession = Boolean(options.readSession());
        if (!hasSession) {
            hasActiveSession = false;
            timer = window.setTimeout(checkIdle, 5000);
            return;
        }
        if (!hasActiveSession) {
            hasActiveSession = true;
            lastActiveAt = Date.now();
        }
        const remainingMs = Math.max(timeoutMs - (Date.now() - lastActiveAt), 0);
        timer = window.setTimeout(checkIdle, remainingMs);
    };
    const markActive = () => {
        lastActiveAt = Date.now();
        schedule();
    };
    const checkIdle = () => {
        const hasSession = Boolean(options.readSession());
        if (!hasSession) {
            schedule();
            return;
        }
        if (!hasActiveSession) {
            hasActiveSession = true;
            lastActiveAt = Date.now();
            schedule();
            return;
        }
        if (Date.now() - lastActiveAt >= timeoutMs) {
            options.onIdle();
            clearTimer();
            return;
        }
        schedule();
    };
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            checkIdle();
        }
    };

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    schedule();

    return () => {
        clearTimer();
        ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, markActive));
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
}

export function resolveFriendlyRequestMessage(
    error: unknown,
    locale: string = 'zh-CN',
): string {
    const isChinese = locale !== 'en-US';
    const defaultMessage = isChinese ? '请求暂时失败，请稍后重试。' : 'The request failed. Please try again later.';
    if (!error || typeof error !== 'object') {
        return defaultMessage;
    }
    const axiosLikeError = error as {
        code?: string;
        message?: string;
        response?: {
            status?: number;
            data?: {
                message?: string;
            };
        };
    };
    const backendMessage = axiosLikeError.response?.data?.message;
    const status = axiosLikeError.response?.status;
    const code = axiosLikeError.code;

    if (status === 401) {
        return isChinese ? '登录状态已失效，请重新登录。' : 'Your session has expired. Please sign in again.';
    }
    if (status === 403) {
        return isChinese ? '当前账号暂无权限执行此操作。' : 'Your account does not have permission to perform this action.';
    }
    if (status === 404) {
        return isChinese ? '请求的服务或页面不存在。' : 'The requested service or page could not be found.';
    }
    if (status === 502 || status === 503 || status === 504) {
        return isChinese
            ? '服务暂时不可用，可能后端服务尚未启动，请稍后再试。'
            : 'The service is temporarily unavailable. The backend may not be running yet. Please try again later.';
    }
    if (code === 'ECONNABORTED') {
        return isChinese ? '请求超时，请稍后重试。' : 'The request timed out. Please try again.';
    }
    if (!status && code === 'ERR_NETWORK') {
        return isChinese
            ? '网络连接失败，或后端服务尚未启动，请检查服务状态后重试。'
            : 'The network request failed, or the backend service may not be running. Please check the service and try again.';
    }
    if (backendMessage && !/^Request failed with status code \d+$/.test(backendMessage)) {
        return backendMessage;
    }
    return defaultMessage;
}

export function unwrapResult<T>(result: CommonResult<T>): T {
    if (result.code !== 'T200') {
        throw new Error(result.message || 'Request failed');
    }
    return result.data;
}

export function hasPermission(session: AuthSession | null, permissionCode: string): boolean {
    return Boolean(session?.permissions.includes(permissionCode));
}

export const ENABLED_STATUS_OPTIONS = [
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
] as const;

export function formatDateTime(value?: string | null): string {
    if (!value) {
        return '-';
    }
    return value.replace('T', ' ').slice(0, 19);
}

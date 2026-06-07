import axios, { type AxiosInstance } from 'axios';

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
    appCode: string;
    loginAccount: string;
    realName: string;
    merchantId?: string | null;
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
    permissions: string[];
}

export interface LoginRequest {
    loginAccount: string;
    password: string;
    merchantId?: string;
    verifyCodeId?: string;
    verifyCode?: string;
}

export interface AuthSession {
    token: string;
    account: AuthAccount;
    menus: AuthMenu[];
    permissions: string[];
}

export type SessionReader = () => AuthSession | null;
export type UnauthorizedHandler = () => void;

function createRequestId(): string {
    const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `WEB${Date.now()}${randomPart}`;
}

export function createHttpClient(
    baseURL: string,
    readSession: SessionReader,
    onUnauthorized: UnauthorizedHandler,
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
        return config;
    });

    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                onUnauthorized();
            }
            return Promise.reject(error);
        },
    );

    return client;
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

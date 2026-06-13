import { defineStore } from 'pinia';
import type { AuthAccount, AuthLoginResponse, AuthMenu, AuthSession } from '@acquiring/shared';
import {
    getUserInfoApi,
    loginApi,
    logoutApi,
    sendLoginVerifyCodeApi,
    type LoginParams,
} from '@/api/auth';
import { getToken, removeAuthStorage, setToken } from '@/utils/auth';
import { usePermissionStore } from './permission';

export interface AdminUserInfo {
    userId: number;
    username: string;
    realName: string;
    email?: string;
}

const SESSION_KEY = 'acquiring_admin_user_session';

interface UserSessionCache {
    token: string;
    account: AuthAccount | null;
    menus: AuthMenu[];
    roles: string[];
    permissions: string[];
}

function loadSession(): UserSessionCache | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as UserSessionCache) : null;
    } catch {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

function toUserInfo(account: AuthAccount | null): AdminUserInfo | null {
    if (!account) {
        return null;
    }
    return {
        userId: account.userId,
        username: account.loginAccount,
        realName: account.realName,
    };
}

const cachedSession = loadSession();

export const useUserStore = defineStore('user', {
    state: () => ({
        token: getToken() || cachedSession?.token || '',
        account: cachedSession?.account || null,
        userInfo: toUserInfo(cachedSession?.account || null),
        roles: cachedSession?.roles || ([] as string[]),
        permissions: cachedSession?.permissions || ([] as string[]),
        menus: cachedSession?.menus || ([] as AuthMenu[]),
        hydrated: false,
    }),
    getters: {
        authSession(state): AuthSession | null {
            if (!state.token || !state.account) {
                return null;
            }
            return {
                token: state.token,
                account: state.account,
                menus: state.menus,
                roles: state.roles,
                permissions: state.permissions,
            };
        },
    },
    actions: {
        async sendLoginVerifyCode(loginAccount: string) {
            return sendLoginVerifyCodeApi({ loginAccount, scene: 'LOGIN' });
        },
        async login(params: LoginParams) {
            const result = await loginApi(params);
            this.applyLoginResponse(result);
            this.persistSession();
        },
        async logout() {
            await logoutApi().catch(() => undefined);
            this.reset();
        },
        async hydrateSession() {
            if (!this.token) {
                return;
            }
            if (this.hydrated) {
                usePermissionStore().setBackendMenus(this.menus);
                return;
            }
            const result = await getUserInfoApi();
            this.applyLoginResponse(result, this.token);
            this.persistSession();
        },
        applyLoginResponse(response: AuthLoginResponse, fallbackToken?: string) {
            const token = response.accessToken || fallbackToken || this.token;
            this.token = token;
            this.account = response.account;
            this.userInfo = toUserInfo(response.account);
            this.roles = response.roles || [];
            this.permissions = response.permissions || [];
            this.menus = response.menus || [];
            this.hydrated = true;
            setToken(token);
            usePermissionStore().setBackendMenus(this.menus);
        },
        reset() {
            this.token = '';
            this.account = null;
            this.userInfo = null;
            this.roles = [];
            this.permissions = [];
            this.menus = [];
            this.hydrated = false;
            removeAuthStorage();
            usePermissionStore().clearMenus();
        },
        hasPermission(permission?: string) {
            if (!permission) {
                return true;
            }
            return this.permissions.includes(permission) || this.permissions.includes('*:*:*');
        },
        persistSession() {
            localStorage.setItem(
                SESSION_KEY,
                JSON.stringify({
                    token: this.token,
                    account: this.account,
                    menus: this.menus,
                    roles: this.roles,
                    permissions: this.permissions,
                }),
            );
        },
        hasRole(role?: string) {
            if (!role) {
                return true;
            }
            return this.roles.includes(role);
        },
    },
});

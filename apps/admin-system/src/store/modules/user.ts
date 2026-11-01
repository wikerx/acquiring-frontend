import { defineStore } from 'pinia';
import type { AuthAccount, AuthLoginResponse, AuthMenu, AuthSession } from '@acquiring/shared';
import {
    confirmMfaBindApi,
    getMfaBindInfoApi,
    getUserInfoApi,
    loginApi,
    logoutApi,
    sendLoginVerifyCodeApi,
    verifyMfaApi,
    type LoginParams,
} from '@/api/auth';
import { removeAuthStorage } from '@/utils/auth';
import { usePermissionStore } from './permission';

export interface AdminUserInfo {
    userId: number;
    username: string;
    realName: string;
    email?: string;
}

function toUserInfo(account: AuthAccount | null): AdminUserInfo | null {
    if (!account) {
        return null;
    }
    return {
        userId: account.userId,
        username: account.loginAccount,
        realName: account.realName,
        email: nullToUndefined((account as AuthAccount & { email?: string | null }).email),
    };
}

function nullToUndefined<T>(value: T | null | undefined): T | undefined {
    return value == null ? undefined : value;
}

export const useUserStore = defineStore('user', {
    state: () => ({
        account: null as AuthAccount | null,
        userInfo: null as AdminUserInfo | null,
        roles: [] as string[],
        permissions: [] as string[],
        menus: [] as AuthMenu[],
        hydrated: false,
    }),
    getters: {
        authSession(state): AuthSession | null {
            if (!state.account) {
                return null;
            }
            return {
                account: state.account,
                menus: state.menus,
                roles: state.roles,
                permissions: state.permissions,
            };
        },
    },
    actions: {
        async sendLoginVerifyCode(loginAccount?: string) {
            return sendLoginVerifyCodeApi({ loginAccount, scene: 'LOGIN' });
        },
        async login(params: LoginParams) {
            const result = await loginApi(params);
            if (result.account) {
                this.applyLoginResponse(result);
            }
            return result;
        },
        async getMfaBindInfo(loginTicket: string) {
            return getMfaBindInfoApi(loginTicket);
        },
        async confirmMfaBind(loginTicket: string, totpCode: string) {
            const result = await confirmMfaBindApi({ loginTicket, totpCode });
            this.applyFinalLoginResponse(result);
            return result;
        },
        async verifyMfa(loginTicket: string, totpCode: string) {
            const result = await verifyMfaApi({ loginTicket, totpCode });
            this.applyFinalLoginResponse(result);
            return result;
        },
        async logout() {
            await logoutApi().catch(() => undefined);
            this.reset();
        },
        async hydrateSession() {
            if (this.hydrated) {
                usePermissionStore().setBackendMenus(this.menus);
                return;
            }
            const result = await getUserInfoApi();
            this.applyLoginResponse(result);
        },
        applyLoginResponse(response: AuthLoginResponse) {
            if (!response.account) {
                return;
            }
            this.account = response.account;
            this.userInfo = toUserInfo(response.account);
            this.roles = response.roles || [];
            this.permissions = response.permissions || [];
            this.menus = response.menus || [];
            this.hydrated = true;
            usePermissionStore().setBackendMenus(this.menus);
        },
        applyFinalLoginResponse(response: AuthLoginResponse) {
            if (!response.account) {
                throw new Error('MFA verification did not return a login session');
            }
            this.applyLoginResponse(response);
        },
        reset() {
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
        hasRole(role?: string) {
            if (!role) {
                return true;
            }
            return this.roles.includes(role);
        },
    },
});

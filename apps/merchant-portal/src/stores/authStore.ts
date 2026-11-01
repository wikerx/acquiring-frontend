import { defineStore } from 'pinia';
import type { AuthLoginResponse, AuthSession } from '@acquiring/shared';
import {
    confirmMfaBind,
    getMfaBindInfo,
    verifyMfa,
} from '@/api/authApi';

const LEGACY_STORAGE_KEY = 'acquiring_merchant_session';

export const useAuthStore = defineStore('merchantAuth', {
    state: () => ({
        session: null as AuthSession | null,
        hydrated: false,
    }),
    actions: {
        setLoginResponse(response: AuthLoginResponse) {
            if (!response.account) {
                return;
            }
            this.session = {
                account: response.account,
                menus: response.menus || [],
                roles: response.roles || [],
                permissions: response.permissions || [],
            };
            this.hydrated = true;
            localStorage.removeItem(LEGACY_STORAGE_KEY);
        },
        setFinalLoginResponse(response: AuthLoginResponse) {
            if (!response.account) {
                throw new Error('MFA verification did not return a login session');
            }
            this.setLoginResponse(response);
        },
        async getMfaBindInfo(loginTicket: string) {
            return getMfaBindInfo(loginTicket);
        },
        async confirmMfaBind(loginTicket: string, totpCode: string) {
            const response = await confirmMfaBind({ loginTicket, totpCode });
            this.setFinalLoginResponse(response);
            return response;
        },
        async verifyMfa(loginTicket: string, totpCode: string) {
            const response = await verifyMfa({ loginTicket, totpCode });
            this.setFinalLoginResponse(response);
            return response;
        },
        setCurrentUserResponse(response: AuthLoginResponse) {
            if (!response.account) {
                this.clearSession();
                return;
            }
            this.session = {
                account: response.account,
                menus: response.menus || [],
                roles: response.roles || [],
                permissions: response.permissions || [],
            };
            this.hydrated = true;
            localStorage.removeItem(LEGACY_STORAGE_KEY);
        },
        markHydrated() {
            this.hydrated = true;
        },
        hasPermission(permissionCode?: string) {
            if (!permissionCode) {
                return true;
            }
            const permissions = this.session?.permissions || [];
            return permissions.includes('*:*:*') || permissions.includes(permissionCode);
        },
        clearSession() {
            this.session = null;
            this.hydrated = false;
            localStorage.removeItem(LEGACY_STORAGE_KEY);
        },
    },
});

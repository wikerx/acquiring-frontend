import { defineStore } from 'pinia';
import type { AuthLoginResponse, AuthSession } from '@acquiring/shared';
import {
    confirmMfaBind,
    getMfaBindInfo,
    verifyMfa,
} from '@/api/authApi';

const STORAGE_KEY = 'acquiring_merchant_session';

// Security note: current merchant login state is intentionally kept in localStorage for this phase.
// Do not render untrusted HTML; migrate this token to HttpOnly + Secure + SameSite Cookie in the next auth upgrade.
function loadSession(): AuthSession | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

export const useAuthStore = defineStore('merchantAuth', {
    state: () => ({
        session: loadSession() as AuthSession | null,
        hydrated: false,
    }),
    actions: {
        setLoginResponse(response: AuthLoginResponse) {
            if (!response.accessToken || !response.account) {
                return;
            }
            this.session = {
                token: response.accessToken,
                account: response.account,
                menus: response.menus || [],
                roles: response.roles || [],
                permissions: response.permissions || [],
            };
            this.hydrated = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
        },
        setFinalLoginResponse(response: AuthLoginResponse) {
            if (!response.accessToken || !response.account) {
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
            if (!this.session) {
                return;
            }
            const token = response.accessToken || this.session.token;
            if (!token) {
                this.clearSession();
                return;
            }
            const account = response.account || this.session.account;
            this.session = {
                token,
                account,
                menus: response.menus || [],
                roles: response.roles || [],
                permissions: response.permissions || [],
            };
            this.hydrated = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
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
            localStorage.removeItem(STORAGE_KEY);
        },
    },
});

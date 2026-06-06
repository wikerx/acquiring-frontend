import { defineStore } from 'pinia';
import type { AuthLoginResponse, AuthSession } from '@acquiring/shared';

const STORAGE_KEY = 'acquiring_admin_session';

function loadSession(): AuthSession | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

export const useAuthStore = defineStore('adminAuth', {
    state: () => ({
        session: loadSession() as AuthSession | null,
        hydrated: false,
    }),
    actions: {
        setLoginResponse(response: AuthLoginResponse) {
            if (!response.accessToken) {
                return;
            }
            this.session = {
                token: response.accessToken,
                account: response.account,
                menus: response.menus,
                permissions: response.permissions,
            };
            this.hydrated = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
        },
        setCurrentUserResponse(response: AuthLoginResponse) {
            if (!this.session) {
                return;
            }
            this.session = {
                token: this.session.token,
                account: response.account,
                menus: response.menus,
                permissions: response.permissions,
            };
            this.hydrated = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
        },
        hasPermission(permissionCode?: string) {
            if (!permissionCode) {
                return true;
            }
            return Boolean(this.session?.permissions.includes(permissionCode));
        },
        clearSession() {
            this.session = null;
            this.hydrated = false;
            localStorage.removeItem(STORAGE_KEY);
        },
    },
});

const TOKEN_KEY = 'acquiring_admin_token';
const SESSION_KEY = 'acquiring_admin_user_session';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function removeAuthStorage() {
    removeToken();
    localStorage.removeItem(SESSION_KEY);
}

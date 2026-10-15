const PUBLIC_AUTH_PATHS = new Set(['/login', '/forgot-password', '/account-verification']);

/** 判断当前路径是否属于不依赖登录态的认证页面。 */
export function isPublicAuthPath(path: string): boolean {
    return PUBLIC_AUTH_PATHS.has(path);
}

/** 仅允许跳转到本站非认证页的绝对相对路径，阻止协议、双斜线和反斜线绕过。 */
export function sanitizeLoginRedirect(value: unknown, fallback = '/dashboard'): string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
        return fallback;
    }
    try {
        const target = new URL(value, window.location.origin);
        if (target.origin !== window.location.origin || isPublicAuthPath(target.pathname)) {
            return fallback;
        }
        return `${target.pathname}${target.search}${target.hash}`;
    } catch {
        return fallback;
    }
}

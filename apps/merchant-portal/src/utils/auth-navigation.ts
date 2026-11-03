const PUBLIC_AUTH_PATHS = new Set(['/login', '/forgot-password', '/account-verification']);

/** 仅允许跳转到本站非认证页的绝对相对路径，阻止开放重定向。 */
export function sanitizeLoginRedirect(value: unknown, fallback: string): string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
        return fallback;
    }
    try {
        const target = new URL(value, window.location.origin);
        if (target.origin !== window.location.origin || PUBLIC_AUTH_PATHS.has(target.pathname)) {
            return fallback;
        }
        return `${target.pathname}${target.search}${target.hash}`;
    } catch {
        return fallback;
    }
}

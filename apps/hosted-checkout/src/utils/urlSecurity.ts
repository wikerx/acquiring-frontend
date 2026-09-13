/**
 * 解析商户结果页 URL。生产构建只允许 HTTPS，开发构建额外允许本机回环 HTTP。
 *
 * @param value 支付结果中的商户跳转地址
 * @returns 可用于 Form POST 的绝对 URL，非法时返回 null
 */
export function resolveMerchantPostUrl(value?: string): string | null {
    if (!value || value !== value.trim() || value.includes('\\')) {
        return null;
    }
    try {
        const url = new URL(value);
        if (!url.hostname || url.username || url.password) {
            return null;
        }
        if (url.protocol === 'https:') {
            return url.toString();
        }
        if (import.meta.env.DEV && url.protocol === 'http:' && isLoopbackHostname(url.hostname)) {
            return url.toString();
        }
        return null;
    } catch {
        return null;
    }
}

/** 仅允许显式 localhost、IPv4 127/8 和 IPv6 ::1。 */
function isLoopbackHostname(hostname: string): boolean {
    const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (normalized === 'localhost' || normalized === '::1') {
        return true;
    }
    const segments = normalized.split('.');
    return segments.length === 4
        && segments[0] === '127'
        && segments.every((segment) => /^\d{1,3}$/.test(segment) && Number(segment) <= 255);
}

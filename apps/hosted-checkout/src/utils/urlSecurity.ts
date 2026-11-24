/**
 * 解析商户结果页 URL。生产构建只允许 HTTPS，开发构建额外允许本机及 RFC1918 局域网 HTTP。
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
        if (import.meta.env.DEV && url.protocol === 'http:' && isDevelopmentHostname(url.hostname)) {
            return url.toString();
        }
        return null;
    } catch {
        return null;
    }
}

/** 开发联调允许显式回环地址和 RFC1918 IPv4；不放开公网 IP 或任意主机名。 */
function isDevelopmentHostname(hostname: string): boolean {
    const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (normalized === 'localhost' || normalized === '::1') {
        return true;
    }
    const segments = normalized.split('.');
    if (segments.length !== 4
        || !segments.every((segment) => /^\d{1,3}$/.test(segment) && Number(segment) <= 255)) {
        return false;
    }
    const octets = segments.map(Number);
    return octets[0] === 127
        || octets[0] === 10
        || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
        || (octets[0] === 192 && octets[1] === 168);
}

/** dev 联调只允许打开已登记渠道挡板签发的钱包授权页。 */
export function resolveWalletAuthorizationUrl(value?: string): string | null {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.origin === 'http://127.0.0.1:58090' && !url.username && !url.password
            && !url.search && !url.hash && /^\/simulate\/hosted-payins\/[a-f0-9-]{32,36}$/.test(url.pathname)
            ? url.href : null;
    } catch {
        return null;
    }
}

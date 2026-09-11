import type { AuthMenu } from '@acquiring/shared';

interface ExternalMenuLike {
    id?: number;
    menuCode?: string;
    menuType?: string;
    routePath?: string;
    externalLink?: number;
}

/**
 * 外链 iframe 页面统一使用固定前缀，避免把真实 URL 直接注册为前端路由。
 */
export const EXTERNAL_FRAME_ROUTE_PREFIX = '/external-frame';
const DEPRECATED_RISK_RULE_MENU_CODES = new Set(['risk_rule_issuer_country', 'risk_rule_card_bin']);
const DEPRECATED_RISK_RULE_ROUTE_PATHS = new Set(['/risk/rule/issuer-country', '/risk/rule/card-bin']);
const DEPRECATED_RISK_RULE_PERMISSION_PREFIXES = ['risk:rule:issuerCountry', 'risk:rule:cardBin'];
const EXTERNAL_FRAME_ALLOWED_ORIGINS = new Set([
    ...parseConfiguredValues(import.meta.env.VITE_ADMIN_EXTERNAL_FRAME_ALLOWED_ORIGINS)
        .map(normalizeConfiguredOrigin)
        .filter((origin): origin is string => Boolean(origin)),
    ...parseConfiguredValues(import.meta.env.VITE_ADMIN_EXTERNAL_FRAME_ALLOWED_HOSTS)
        .map(normalizeLegacyConfiguredOrigin)
        .filter((origin): origin is string => Boolean(origin)),
]);

/**
 * 判断菜单是否为外链菜单。
 *
 * @param menuType 菜单类型
 * @returns 是否为外链菜单
 */
export function isLinkMenu(menuType?: string) {
    return menuType === 'LINK';
}

/**
 * 判断是否为已废弃的内风控规则菜单。旧数据库或本地会话缓存可能仍包含历史菜单，
 * 前端展示和动态路由注册前需要统一过滤。
 *
 * @param menu 后端菜单节点
 * @returns true 表示不应展示或注册路由
 */
export function isDeprecatedRiskRuleMenu(menu: Pick<AuthMenu, 'menuCode' | 'routePath' | 'permissionCode'>) {
    const routePath = normalizeMenuPath(menu.routePath);
    const permissionCode = menu.permissionCode || '';
    return DEPRECATED_RISK_RULE_MENU_CODES.has(menu.menuCode)
        || Boolean(routePath && DEPRECATED_RISK_RULE_ROUTE_PATHS.has(routePath))
        || DEPRECATED_RISK_RULE_PERMISSION_PREFIXES.some((prefix) => permissionCode === prefix || permissionCode.startsWith(`${prefix}:`));
}

/**
 * 判断菜单是否应在新窗口打开。
 *
 * @param menu 外链菜单
 * @returns 是否为新窗口外链
 */
export function isExternalWindowMenu(menu: Pick<ExternalMenuLike, 'menuType' | 'externalLink'>) {
    return isLinkMenu(menu.menuType) && menu.externalLink === 1;
}

/**
 * 判断菜单是否应在系统内 iframe 打开。
 *
 * @param menu 外链菜单
 * @returns 是否为 iframe 外链
 */
export function isExternalFrameMenu(menu: Pick<ExternalMenuLike, 'menuType' | 'externalLink'>) {
    return isLinkMenu(menu.menuType) && menu.externalLink !== 1;
}

/**
 * 规范化后台菜单路径。
 *
 * @param path 原始路径
 * @returns 规范化后的路径
 */
export function normalizeMenuPath(path?: string): string | undefined {
    if (!path) {
        return undefined;
    }
    const normalized = path.trim();
    if (!normalized) {
        return undefined;
    }
    if (normalized.includes('\\') || normalized.startsWith('//')) {
        return undefined;
    }
    if (/^https?:\/\//i.test(normalized)) {
        return normalized;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(normalized)) {
        return undefined;
    }
    if (normalized.startsWith('/')) {
        return normalized.replace(/\/+$/, '') || '/';
    }
    return '/' + normalized.replace(/\/+$/, '');
}

/**
 * 提取可用于 iframe 或新窗口的监控地址。
 *
 * @param routePath 菜单配置中的路由地址
 * @returns 可用地址，非法地址返回 undefined
 */
export function resolveExternalUrl(routePath?: string): string | undefined {
    const normalized = normalizeMenuPath(routePath);
    if (!normalized) {
        return undefined;
    }
    if (isSafeRelativePath(normalized)) {
        return normalized;
    }
    const url = parseExternalHttpUrl(normalized);
    if (!url) {
        return undefined;
    }
    if (url.protocol === 'https:' || isDevelopmentLoopbackHttp(url)) {
        return url.toString();
    }
    return undefined;
}

/**
 * 提取可在系统 iframe 中加载的地址。外部 HTTPS 必须命中显式 Origin 白名单。
 *
 * @param routePath 菜单配置中的路由地址
 * @returns 可安全嵌入的地址，非法或未授权地址返回 undefined
 */
export function resolveExternalFrameUrl(routePath?: string): string | undefined {
    const normalized = normalizeMenuPath(routePath);
    if (!normalized) {
        return undefined;
    }
    if (isSafeRelativePath(normalized)) {
        return normalized;
    }
    const url = parseExternalHttpUrl(normalized);
    if (!url) {
        return undefined;
    }
    if (isDevelopmentLoopbackHttp(url)) {
        return url.toString();
    }
    if (url.protocol !== 'https:') {
        return undefined;
    }
    if (typeof window !== 'undefined' && url.origin === window.location.origin) {
        return url.toString();
    }
    return EXTERNAL_FRAME_ALLOWED_ORIGINS.has(url.origin)
        ? url.toString()
        : undefined;
}

/**
 * 为 iframe 外链生成稳定的内部路由地址。
 *
 * @param menu 外链菜单
 * @returns 内部承载路由
 */
export function createExternalFramePath(menu: Pick<ExternalMenuLike, 'menuCode' | 'id'>) {
    const menuToken = sanitizeMenuToken(menu.menuCode) || String(menu.id || 'monitor');
    return `${EXTERNAL_FRAME_ROUTE_PREFIX}/${menuToken}`;
}

/**
 * 根据菜单类型生成前端运行时使用的路由地址。
 *
 * @param menu 后端菜单
 * @returns 运行时路由
 */
export function resolveRuntimeMenuPath(
    menu: Pick<ExternalMenuLike, 'id' | 'menuCode' | 'menuType' | 'routePath' | 'externalLink'>,
) {
    if (isExternalFrameMenu(menu)) {
        return createExternalFramePath(menu);
    }
    if (isExternalWindowMenu(menu)) {
        return resolveExternalUrl(menu.routePath);
    }
    return normalizeMenuPath(menu.routePath);
}

/**
 * 在新窗口中打开外部控制台。
 *
 * @param url 控制台地址
 * @returns 是否成功发起打开动作
 */
export function openExternalMenu(url?: string) {
    const targetUrl = resolveExternalUrl(url);
    if (!targetUrl) {
        return false;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    return true;
}

/**
 * 将菜单编码转换为安全的路由片段。
 *
 * @param value 菜单编码
 * @returns 路由片段
 */
function sanitizeMenuToken(value?: string) {
    if (!value) {
        return '';
    }
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** 相对地址必须保持在当前站点，禁止协议相对 URL 和反斜杠浏览器兼容写法。 */
function isSafeRelativePath(value: string) {
    return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\');
}

/** 解析外部 HTTP(S) URL，并拒绝用户信息和歧义反斜杠。 */
function parseExternalHttpUrl(value: string): URL | undefined {
    if (value.includes('\\')) {
        return undefined;
    }
    try {
        const url = new URL(value);
        if (!url.hostname || url.username || url.password) {
            return undefined;
        }
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
            return undefined;
        }
        return url;
    } catch {
        return undefined;
    }
}

/** 开发构建仅放行显式回环主机上的 HTTP。 */
function isDevelopmentLoopbackHttp(url: URL) {
    return import.meta.env.DEV && url.protocol === 'http:' && isLoopbackHostname(url.hostname);
}

/** 仅识别 localhost、IPv4 127/8 和 IPv6 ::1。 */
function isLoopbackHostname(hostname: string) {
    const normalized = normalizeHostname(hostname);
    if (normalized === 'localhost' || normalized === '::1') {
        return true;
    }
    const segments = normalized.split('.');
    return segments.length === 4
        && segments[0] === '127'
        && segments.every((segment) => /^\d{1,3}$/.test(segment) && Number(segment) <= 255);
}

/** 统一 URL API 返回的 IPv6 方括号和 hostname 大小写。 */
function normalizeHostname(hostname: string) {
    return hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
}

/** 将逗号分隔配置拆分为非空值。 */
function parseConfiguredValues(value: unknown) {
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

/** 新白名单只接受精确 HTTPS Origin，不接受 userinfo、路径、查询、hash 或通配符。 */
function normalizeConfiguredOrigin(value: string): string | undefined {
    if (value.includes('\\') || value.includes('*')) {
        return undefined;
    }
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:'
            || !url.hostname
            || url.username
            || url.password
            || (url.pathname && url.pathname !== '/')
            || url.search
            || url.hash) {
            return undefined;
        }
        return url.origin;
    } catch {
        return undefined;
    }
}

/** 旧 hostname 配置仅兼容映射到默认 HTTPS 443 Origin。 */
function normalizeLegacyConfiguredOrigin(value: string): string | undefined {
    const hostname = normalizeConfiguredHostname(value);
    return hostname ? new URL(`https://${hostname}`).origin : undefined;
}

/** 旧白名单只接受单个精确 hostname，不接受协议、端口、路径或通配符。 */
function normalizeConfiguredHostname(value: string): string | undefined {
    const normalized = normalizeHostname(value);
    if (!normalized
        || normalized.includes('*')
        || normalized.includes('/')
        || normalized.includes(':')
        || !/^[a-z0-9.-]+$/.test(normalized)) {
        return undefined;
    }
    return normalized.replace(/\.$/, '');
}

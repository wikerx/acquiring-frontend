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
    if (/^https?:\/\//i.test(normalized)) {
        return normalized;
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
    if (/^https?:\/\//i.test(normalized) || normalized.startsWith('/')) {
        return normalized;
    }
    return undefined;
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

import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface SysMenu {
    menuId: number;
    parentId: number;
    menuCode: string;
    menuName: string;
    menuType: string;
    routePath?: string;
    componentPath?: string;
    permissionCode?: string;
    icon?: string;
    redirect?: string;
    visible?: number;
    keepAlive?: number;
    externalLink?: number;
    sortNo?: number;
    status?: number;
    children?: SysMenu[];
}

export interface SysMenuQuery {
    menuName?: string;
    menuType?: string;
    status?: number;
    visible?: number;
}

export interface SysMenuCreateRequest {
    parentId: number;
    menuCode: string;
    menuName: string;
    menuType: string;
    routePath?: string;
    componentPath?: string;
    permissionCode?: string;
    icon?: string;
    redirect?: string;
    visible?: number;
    keepAlive?: number;
    externalLink?: number;
    sortNo?: number;
    status?: number;
}

export interface SysMenuUpdateRequest extends Omit<SysMenuCreateRequest, 'menuCode'> {
    menuId: number;
}

export interface SysMenuStatusRequest {
    menuId: number;
    status: number;
}

export async function treeMenus(requestBody: SysMenuQuery) {
    const result = await http.post<CommonResult<SysMenu[]>>(
        '/admin/system/menus/tree',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function createMenu(requestBody: SysMenuCreateRequest) {
    const result = await http.post<CommonResult<SysMenu>>(
        '/admin/system/menus/create',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function updateMenu(requestBody: SysMenuUpdateRequest) {
    const result = await http.post<CommonResult<SysMenu>>(
        '/admin/system/menus/update',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function updateMenuStatus(requestBody: SysMenuStatusRequest) {
    const result = await http.post<CommonResult<void>>(
        '/admin/system/menus/status',
        requestBody,
    );
    return unwrapResult(result.data);
}

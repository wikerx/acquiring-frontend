import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

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

export async function treeMenus(requestBody: SysMenuQuery) {
    const result = await request.post<CommonResult<SysMenu[]>>(
        '/admin/system/menus/tree',
        requestBody,
    ) as unknown as CommonResult<SysMenu[]>;
    return unwrapResult(result);
}

import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface MerchantGrantMenu {
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
    children: MerchantGrantMenu[];
}

export interface MerchantGrantPermission {
    permissionId: number;
    menuId?: number;
    permissionCode: string;
    permissionName: string;
    permissionType: string;
    resourceMethod?: string;
    resourcePath?: string;
    status: number;
}

export interface MerchantMenuGrantResponse {
    merchantId: string;
    menus: MerchantGrantMenu[];
    permissions: MerchantGrantPermission[];
    checkedMenuIds: number[];
    checkedPermissionIds: number[];
    checkedPermissionCodes: string[];
}

export async function queryMerchantMenuGrant(merchantId: string) {
    const result = await http.get<CommonResult<MerchantMenuGrantResponse>>(`/admin/merchant-menu-grants/${encodeURIComponent(merchantId)}`);
    return unwrapResult(result.data);
}

export async function saveMerchantMenuGrant(merchantId: string, menuIds: number[], permissionIds: number[]) {
    const result = await http.post<CommonResult<void>>(`/admin/merchant-menu-grants/${encodeURIComponent(merchantId)}`, { menuIds, permissionIds });
    return unwrapResult(result.data);
}

import type {
    SysMenu,
    SysMenuCreateRequest,
    SysMenuQuery,
    SysMenuStatusRequest,
    SysMenuUpdateRequest,
} from '@/api/system/menu';
import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export type {
    SysMenu,
    SysMenuCreateRequest,
    SysMenuQuery,
    SysMenuStatusRequest,
    SysMenuUpdateRequest,
};

export async function treeMerchantMenus(requestBody: SysMenuQuery) {
    const result = await http.post<CommonResult<SysMenu[]>>('/admin/merchant/menus/tree', requestBody);
    return unwrapResult(result.data);
}

export async function createMerchantMenu(requestBody: SysMenuCreateRequest) {
    const result = await http.post<CommonResult<SysMenu>>('/admin/merchant/menus/create', requestBody);
    return unwrapResult(result.data);
}

export async function updateMerchantMenu(requestBody: SysMenuUpdateRequest) {
    const result = await http.post<CommonResult<SysMenu>>('/admin/merchant/menus/update', requestBody);
    return unwrapResult(result.data);
}

export async function updateMerchantMenuStatus(requestBody: SysMenuStatusRequest) {
    const result = await http.post<CommonResult<void>>('/admin/merchant/menus/status', requestBody);
    return unwrapResult(result.data);
}

export async function deleteMerchantMenu(menuId: number) {
    const result = await http.post<CommonResult<void>>('/admin/merchant/menus/delete', { menuId });
    return unwrapResult(result.data);
}

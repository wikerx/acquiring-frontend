import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import type { SysMenu } from '@/api/system/menu';

export interface MerchantUserQuery {
    merchantId?: string;
    merchantName?: string;
    loginAccount?: string;
    realName?: string;
    mobile?: string;
    email?: string;
    roleName?: string;
    deptName?: string;
    postName?: string;
    status?: number;
    createdStartTime?: string;
    createdEndTime?: string;
    pageNo?: number;
    pageSize?: number;
}

export interface MerchantUserRow {
    accountId: number;
    userId: number;
    merchantId: string;
    merchantName?: string;
    loginAccount: string;
    realName?: string;
    mobile?: string;
    email?: string;
    deptNames: string[];
    postNames: string[];
    roleNames: string[];
    status: number;
    merchantAdmin: boolean;
    lastLoginAt?: string;
    lastLoginIp?: string;
    createdAt?: string;
}

export interface MerchantUserDetail {
    account: MerchantUserRow;
    merchant?: {
        merchantId: string;
        merchantName?: string;
        merchantShortName?: string;
        merchantStatus?: number;
    };
    depts: Array<{ deptId: number; deptName?: string; deptCode?: string }>;
    posts: Array<{ postId: number; postName?: string; postCode?: string }>;
    roles: Array<{ roleId: number; roleCode?: string; roleName?: string; roleType?: string; status?: number }>;
    menus: SysMenu[];
    permissions: string[];
}

export async function searchMerchantUsers(params: MerchantUserQuery) {
    const result = await http.get<CommonResult<PageResult<MerchantUserRow>>>('/admin/merchant-users', { params });
    return unwrapResult(result.data);
}

export async function getMerchantUserDetail(accountId: number) {
    const result = await http.get<CommonResult<MerchantUserDetail>>(`/admin/merchant-users/${accountId}`);
    return unwrapResult(result.data);
}

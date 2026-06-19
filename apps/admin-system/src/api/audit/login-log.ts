import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface SysLoginLog {
    id: number;
    appId?: number;
    accountId?: number;
    userId?: number;
    merchantId?: string;
    loginAccount?: string;
    loginIp?: string;
    userAgent?: string;
    loginStatus?: number;
    failReason?: string;
    loginAt?: string;
}

export interface SysLoginLogQuery extends PageQuery {
    appId?: number;
    loginAccount?: string;
    loginIp?: string;
    merchantId?: string;
    loginStatus?: number;
    loginStartAt?: string;
    loginEndAt?: string;
}

export async function searchLoginLogs(requestBody: SysLoginLogQuery) {
    const result = await http.post<CommonResult<PageResult<SysLoginLog>>>(
        '/admin/system/login-logs/search',
        requestBody,
    );
    return unwrapResult(result.data);
}

import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

export interface SysOperLog {
    id: number;
    traceId?: string;
    requestId?: string;
    merchantId?: string;
    moduleName?: string;
    businessType?: number;
    requestMethod?: string;
    operatorId?: string;
    operatorName?: string;
    operUrl?: string;
    operIp?: string;
    costTime?: number;
    status?: number;
    errorCode?: string;
    errorMsg?: string;
    operatedAt?: string;
}

export interface SysOperLogQuery extends PageQuery {
    traceId?: string;
    requestId?: string;
    merchantId?: string;
    operatorId?: string;
    moduleName?: string;
    businessType?: number;
    status?: number;
    operatedStartAt?: string;
    operatedEndAt?: string;
}

export async function searchOperLogs(requestBody: SysOperLogQuery) {
    const result = await request.post<CommonResult<PageResult<SysOperLog>>>(
        '/admin/system/oper-logs/search',
        requestBody,
    ) as unknown as CommonResult<PageResult<SysOperLog>>;
    return unwrapResult(result);
}

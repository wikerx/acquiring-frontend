import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { http } from './http';

export interface SysOperLog {
    id?: number;
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

export interface OperLogQuery extends PageQuery {
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

export function searchOperLogs(request: OperLogQuery = { pageNo: 1, pageSize: 20 }) {
    return http.post<CommonResult<PageResult<SysOperLog>>>('/admin/system/oper-logs/search', request);
}

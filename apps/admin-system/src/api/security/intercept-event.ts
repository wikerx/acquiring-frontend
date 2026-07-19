import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

export interface SecurityInterceptEventQuery extends PageQuery {
    eventNo?: string;
    sourceLayer?: string;
    eventType?: string;
    riskLevel?: string;
    action?: string;
    merchantId?: string;
    clientIp?: string;
    requestPath?: string;
    traceId?: string;
    requestId?: string;
    hitRuleCode?: string;
    processStatus?: number;
    queryTimeZone?: string;
    beginTime?: string;
    endTime?: string;
}

export interface SecurityInterceptEventRow {
    id: string;
    eventNo?: string;
    eventTime?: string;
    sourceLayer?: string;
    eventType?: string;
    riskLevel?: string;
    action?: string;
    merchantId?: string;
    clientIp?: string;
    requestMethod?: string;
    requestPath?: string;
    traceId?: string;
    requestId?: string;
    userAgent?: string;
    reasonCode?: string;
    reasonMessage?: string;
    serviceName?: string;
    hitRuleCode?: string;
    headerSummary?: string;
    processStatus?: number;
    processRemark?: string;
    processedBy?: string;
    processedTime?: string;
    gmtCreate?: string;
    gmtModified?: string;
}

export interface SecurityInterceptEventMarkRequest {
    processStatus: number;
    processRemark?: string;
}

export async function searchSecurityInterceptEvents(data: SecurityInterceptEventQuery) {
    const result = await http.post<CommonResult<PageResult<SecurityInterceptEventRow>>>('/admin/security/intercept-events/search', data);
    return unwrapResult(result.data);
}

export async function exportSecurityInterceptEvents(data: SecurityInterceptEventQuery) {
    await downloadExcel('/admin/security/intercept-events/export', { data });
}

export async function getSecurityInterceptEvent(id: string) {
    const result = await http.get<CommonResult<SecurityInterceptEventRow>>(`/admin/security/intercept-events/${id}`);
    return unwrapResult(result.data);
}

export async function markSecurityInterceptEvent(id: string, data: SecurityInterceptEventMarkRequest) {
    const result = await http.put<CommonResult<SecurityInterceptEventRow>>(`/admin/security/intercept-events/${id}/mark`, data);
    return unwrapResult(result.data);
}

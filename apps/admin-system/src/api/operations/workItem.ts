import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export type WorkItemSourceType =
    | 'PAYMENT_METHOD_APPROVAL'
    | 'PAYMENT_METHOD_CONFIGURATION'
    | 'REFUND_APPROVAL'
    | 'SETTLEMENT_REVIEW'
    | 'EXCHANGE_RATE_ALERT'
    | 'MERCHANT_NOTIFICATION_FAILURE'
    | 'CHANNEL_MATCH_ABNORMAL'
    | 'CLEARING_BACKLOG'
    | 'SETTLEMENT_BACKLOG'
    | 'HIGH_RISK_EVENT';

export type WorkItemStatus = 'OPEN' | 'PROCESSING' | 'CLOSED';
export type WorkItemPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface OperationalWorkItemQuery {
    workItemNo?: string;
    keyword?: string;
    sourceType?: WorkItemSourceType | '';
    workStatus?: WorkItemStatus | '';
    priority?: WorkItemPriority | '';
    ownerAccountId?: number;
    mineOnly?: boolean;
    unassignedOnly?: boolean;
    overdueOnly?: boolean;
    detectedStartTime?: string;
    detectedEndTime?: string;
    pageNo?: number;
    pageSize?: number;
}

export interface OperationalWorkItem {
    workItemNo: string;
    sourceType: WorkItemSourceType;
    sourceKey: string;
    workStatus: WorkItemStatus;
    priority: WorkItemPriority;
    ownerAccountId?: number | null;
    ownerAccountName?: string | null;
    slaDueAt: string;
    overdue: boolean;
    firstDetectedAt: string;
    lastSyncedAt: string;
    closedAt?: string | null;
    closeReason?: string | null;
    latestRemark?: string | null;
    version: number;
    sourceStatus?: string | null;
    sourceAvailable: boolean;
    sourceManaged: boolean;
    merchantId?: string | null;
    merchantName?: string | null;
    businessNo?: string | null;
    relatedBusinessNo?: string | null;
    transactionId?: string | null;
    transactionDateTime?: string | null;
    currency?: string | null;
    amount?: string | null;
    currencyExponent?: number | null;
    rateType?: string | null;
    baseCurrency?: string | null;
    quoteCurrency?: string | null;
    alertLevel?: string | null;
    attemptCount?: number | null;
    failureStage?: string | null;
    failureCode?: string | null;
    failureReason?: string | null;
    sourceOccurredAt?: string | null;
}

export interface OperationalWorkItemMetrics {
    openCount: number;
    processingCount: number;
    overdueCount: number;
    unassignedCount: number;
    mineCount: number;
}

export interface OperationalWorkItemSearchResponse {
    page: PageResult<OperationalWorkItem>;
    metrics: OperationalWorkItemMetrics;
}

export interface OperationalWorkItemHistory {
    id: number;
    actionType: string;
    beforeStatus?: string | null;
    afterStatus: string;
    beforeOwnerAccountId?: number | null;
    beforeOwnerAccountName?: string | null;
    afterOwnerAccountId?: number | null;
    afterOwnerAccountName?: string | null;
    operatorAccountId?: number | null;
    operatorAccountName: string;
    remark?: string | null;
    operatedAt: string;
}

export interface OperationalWorkItemDetail {
    workItem: OperationalWorkItem;
    history?: OperationalWorkItemHistory[];
    historyTotal: number;
}

export interface OperationalWorkItemActionRequest {
    requestId: string;
    expectedVersion: number;
    targetAccountId?: number;
    remark?: string;
}

export interface OperationalWorkItemAssignee {
    accountId: number;
    accountName: string;
    loginAccount: string;
}

export interface OperationalWorkItemExportTaskRequest {
    requestId: string;
    query: OperationalWorkItemQuery;
}

export interface OperationalWorkItemExportTask {
    taskNo: string;
    status: string;
}

export async function searchOperationalWorkItems(data: OperationalWorkItemQuery) {
    const result = await http.post<CommonResult<OperationalWorkItemSearchResponse>>(
        '/admin/operations/work-items/search',
        data,
    );
    return unwrapResult(result.data);
}

export async function getOperationalWorkItemDetail(workItemNo: string) {
    const result = await http.get<CommonResult<OperationalWorkItemDetail>>(
        `/admin/operations/work-items/${encodeURIComponent(workItemNo)}`,
    );
    return unwrapResult(result.data);
}

export async function searchOperationalWorkItemHistory(
    workItemNo: string,
    pageNo = 1,
    pageSize = 10,
) {
    const result = await http.get<CommonResult<PageResult<OperationalWorkItemHistory>>>(
        `/admin/operations/work-items/${encodeURIComponent(workItemNo)}/history`,
        { params: { pageNo, pageSize } },
    );
    return unwrapResult(result.data);
}

export async function listOperationalWorkItemAssignees(keyword?: string) {
    const result = await http.get<CommonResult<OperationalWorkItemAssignee[]>>(
        '/admin/operations/work-items/assignees',
        { params: { keyword: keyword || undefined } },
    );
    return unwrapResult(result.data);
}

export async function claimOperationalWorkItem(
    workItemNo: string,
    data: OperationalWorkItemActionRequest,
) {
    return operate(workItemNo, 'claim', data);
}

export async function assignOperationalWorkItem(
    workItemNo: string,
    data: OperationalWorkItemActionRequest,
) {
    return operate(workItemNo, 'assign', data);
}

export async function transferOperationalWorkItem(
    workItemNo: string,
    data: OperationalWorkItemActionRequest,
) {
    return operate(workItemNo, 'transfer', data);
}

export async function completeOperationalWorkItem(
    workItemNo: string,
    data: OperationalWorkItemActionRequest,
) {
    return operate(workItemNo, 'complete', data);
}

export async function remarkOperationalWorkItem(
    workItemNo: string,
    data: OperationalWorkItemActionRequest,
) {
    return operate(workItemNo, 'remark', data);
}

export async function submitOperationalWorkItemExportTask(data: OperationalWorkItemExportTaskRequest) {
    const result = await http.post<CommonResult<OperationalWorkItemExportTask>>(
        '/admin/operations/work-items/export-task',
        data,
    );
    return unwrapResult(result.data);
}

async function operate(
    workItemNo: string,
    action: 'claim' | 'assign' | 'transfer' | 'complete' | 'remark',
    data: OperationalWorkItemActionRequest,
) {
    const result = await http.post<CommonResult<OperationalWorkItemDetail>>(
        `/admin/operations/work-items/${encodeURIComponent(workItemNo)}/${action}`,
        data,
    );
    return unwrapResult(result.data);
}

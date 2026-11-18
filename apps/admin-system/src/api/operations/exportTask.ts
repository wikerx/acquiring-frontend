import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadBlob } from '@/utils/download';

export type ExportTaskStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
export type ExportTaskType =
    | 'ADMIN_OPERATIONAL_WORK_ITEM'
    | 'ADMIN_TRANSACTION_ORDER'
    | 'ADMIN_PAYMENT_LINK'
    | 'ADMIN_TRANSACTION_OPERATION'
    | 'ADMIN_MERCHANT_NOTIFICATION'
    | 'ADMIN_REFUND'
    | 'ADMIN_SETTLEMENT_TRANSACTION'
    | 'ADMIN_SETTLEMENT_RESERVE'
    | 'ADMIN_CARD_BIN'
    | 'ADMIN_COUNTRY'
    | 'ADMIN_CURRENCY'
    | 'ADMIN_REGION_CURRENCY'
    | 'ADMIN_MCC_CODE'
    | 'ADMIN_DEPARTMENT'
    | 'ADMIN_POST'
    | 'ADMIN_DICT_TYPE'
    | 'ADMIN_DICT_DATA'
    | 'ADMIN_HOLIDAY_CALENDAR'
    | 'ADMIN_JOB_RUN_LOG'
    | 'ADMIN_CHANNEL_MATCH_ABNORMAL'
    | 'ADMIN_SETTLEMENT_REVIEW'
    | 'ADMIN_SETTLEMENT_POSTING'
    | 'ADMIN_SECURITY_INTERCEPT_EVENT'
    | 'ADMIN_FUND_ACCOUNT'
    | 'ADMIN_FUND_LEDGER'
    | 'ADMIN_FUND_RECHARGE'
    | 'ADMIN_FUND_DEDUCTION'
    | 'ADMIN_EXCHANGE_RAW_RATE'
    | 'ADMIN_EXCHANGE_BUSINESS_RATE'
    | 'ADMIN_EXCHANGE_USAGE_SNAPSHOT'
    | 'ADMIN_EXCHANGE_SOURCE'
    | 'ADMIN_EXCHANGE_RULE'
    | 'ADMIN_EXCHANGE_VOLATILITY'
    | 'ADMIN_EXCHANGE_ALERT_RULE'
    | 'ADMIN_EXCHANGE_ALERT_EVENT'
    | 'ADMIN_FEE_TEMPLATE'
    | 'ADMIN_MERCHANT_FEE'
    | 'ADMIN_FEE_REVIEW'
    | 'ADMIN_FEE_SIMULATION'
    | 'ADMIN_SYSTEM_USER'
    | 'ADMIN_SYSTEM_CONFIG'
    | 'ADMIN_MERCHANT_IP_WHITELIST'
    | 'ADMIN_RISK_CONFIG'
    | 'ADMIN_TRADE_BLACK_RECORD'
    | 'ADMIN_DATASOURCE_SNAPSHOT';

export interface ExportTaskQuery {
    taskType?: ExportTaskType | '';
    status?: ExportTaskStatus | '';
    createdStartTime?: string;
    createdEndTime?: string;
    pageNo?: number;
    pageSize?: number;
}

export interface ExportTaskSummary {
    taskNo: string;
    taskType: ExportTaskType;
    taskName: string;
    status: ExportTaskStatus;
    progressPercent: number;
    processedRows: number;
    totalRows: number;
    fileName?: string | null;
    fileSizeBytes?: number | null;
    fileSha256?: string | null;
    expiresAt?: string | null;
    failureCode?: string | null;
    failureReason?: string | null;
    retryCount: number;
    maxRetryCount: number;
    version: number;
    createTime: string;
    startedAt?: string | null;
    finishedAt?: string | null;
}

export async function searchExportTasks(data: ExportTaskQuery) {
    const result = await http.post<CommonResult<PageResult<ExportTaskSummary>>>(
        '/admin/operations/export-tasks/search',
        data,
    );
    return unwrapResult(result.data);
}

export async function getExportTaskDetail(taskNo: string) {
    const result = await http.get<CommonResult<ExportTaskSummary>>(
        `/admin/operations/export-tasks/${encodeURIComponent(taskNo)}`,
    );
    return unwrapResult(result.data);
}

export async function retryExportTask(taskNo: string, expectedVersion: number) {
    const result = await http.post<CommonResult<ExportTaskSummary>>(
        `/admin/operations/export-tasks/${encodeURIComponent(taskNo)}/retry`,
        { expectedVersion },
    );
    return unwrapResult(result.data);
}

export async function downloadExportTask(taskNo: string, fileName?: string | null) {
    await downloadBlob(
        `/admin/operations/export-tasks/${encodeURIComponent(taskNo)}/download`,
        { fileName: fileName || 'export.xlsx' },
    );
}

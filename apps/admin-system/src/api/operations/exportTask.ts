import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadBlob } from '@/utils/download';

export type ExportTaskStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
export type ExportTaskType =
    | 'ADMIN_OPERATIONAL_WORK_ITEM'
    | 'ADMIN_TRANSACTION_ORDER'
    | 'ADMIN_REFUND';

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

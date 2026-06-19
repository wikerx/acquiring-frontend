import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import type { PageResult } from '@/api/monitor/job';

export interface JobRunLogRow {
    id: number;
    runId: string;
    jobId: number;
    jobCode: string;
    jobName: string;
    handlerCode: string;
    triggerType: string;
    schedulerMode: string;
    executeMode: string;
    executorNode?: string;
    runStatus: string;
    startTime?: string;
    endTime?: string;
    durationMs?: number;
    retryIndex?: number;
    maxRetryCount?: number;
    timeoutSeconds?: number;
    paramsSnapshot?: string;
    resultMessage?: string;
    errorMessage?: string;
    traceId?: string;
    operatorId?: string;
    operatorName?: string;
    createTime?: string;
}

export interface JobRunLogQuery {
    pageNo?: number;
    pageSize?: number;
    jobId?: number;
    jobCode?: string;
    runStatus?: string;
    triggerType?: string;
    executorNode?: string;
}

export async function searchJobRunLogs(payload: JobRunLogQuery): Promise<PageResult<JobRunLogRow>> {
    const result = await http.post<CommonResult<PageResult<JobRunLogRow>>>('/admin/monitor/job-log/search', payload);
    return unwrapResult(result.data);
}

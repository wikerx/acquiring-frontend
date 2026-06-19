import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface JobTaskRow {
    id: number;
    jobCode: string;
    jobName: string;
    jobGroup: string;
    handlerCode: string;
    cronExpression?: string;
    schedulerMode: string;
    triggerMode: string;
    executeMode: string;
    routeStrategy?: string;
    misfireStrategy: string;
    timeoutSeconds: number;
    retryCount: number;
    retryIntervalSeconds: number;
    allowConcurrent: number;
    params?: string;
    status: string;
    description?: string;
    nextTriggerTime?: string;
    lastTriggerTime?: string;
    lastRunStatus?: string;
}

export interface JobTaskQuery {
    pageNo?: number;
    pageSize?: number;
    jobCode?: string;
    jobName?: string;
    jobGroup?: string;
    handlerCode?: string;
    status?: string;
}

export interface PageResult<T> {
    total: number;
    pageNo: number;
    pageSize: number;
    pages: number;
    records: T[];
}

export interface JobHandlerOption {
    handlerCode: string;
    handlerName: string;
    jobGroup: string;
    executeMode: 'SYNC' | 'ASYNC';
    description?: string;
    allowManualTrigger?: boolean;
    allowConcurrent?: boolean;
}

export interface JobTaskSaveRequest {
    jobCode: string;
    jobName: string;
    jobGroup: string;
    handlerCode: string;
    cronExpression?: string;
    schedulerMode: 'STANDALONE' | 'DISTRIBUTED';
    triggerMode: 'CRON' | 'MANUAL';
    misfireStrategy: 'IGNORE' | 'FIRE_ONCE';
    timeoutSeconds: number;
    retryCount: number;
    retryIntervalSeconds: number;
    allowConcurrent: number;
    params?: string;
    status: 'ENABLED' | 'DISABLED';
    description?: string;
}

export interface JobManualTriggerRequest {
    paramsJson?: string;
}

export async function getJobHandlers(): Promise<JobHandlerOption[]> {
    const result = await http.get<CommonResult<JobHandlerOption[]>>('/admin/monitor/job/handlers');
    return unwrapResult(result.data);
}

export async function searchJobs(payload: JobTaskQuery): Promise<PageResult<JobTaskRow>> {
    const result = await http.post<CommonResult<PageResult<JobTaskRow>>>('/admin/monitor/job/search', payload);
    return unwrapResult(result.data);
}

export async function createJob(payload: JobTaskSaveRequest): Promise<JobTaskRow> {
    const result = await http.post<CommonResult<JobTaskRow>>('/admin/monitor/job', payload);
    return unwrapResult(result.data);
}

export async function updateJob(taskId: number, payload: JobTaskSaveRequest): Promise<JobTaskRow> {
    const result = await http.put<CommonResult<JobTaskRow>>(`/admin/monitor/job/${taskId}`, payload);
    return unwrapResult(result.data);
}

export async function changeJobStatus(taskId: number, status: 'ENABLED' | 'DISABLED'): Promise<JobTaskRow> {
    const result = await http.put<CommonResult<JobTaskRow>>(`/admin/monitor/job/${taskId}/status`, null, {
        params: { status },
    });
    return unwrapResult(result.data);
}

export async function triggerJob(taskId: number, payload: JobManualTriggerRequest): Promise<string> {
    const result = await http.post<CommonResult<string>>(`/admin/monitor/job/${taskId}/trigger`, payload);
    return unwrapResult(result.data);
}

export async function deleteJob(taskId: number): Promise<void> {
    const result = await http.delete<CommonResult<void>>(`/admin/monitor/job/${taskId}`);
    return unwrapResult(result.data);
}

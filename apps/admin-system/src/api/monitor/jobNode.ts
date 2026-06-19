import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface JobNodeRow {
    id: number;
    nodeId: string;
    appName: string;
    host: string;
    port?: number;
    instanceId?: string;
    status: string;
    lastHeartbeatTime?: string;
    currentRunningCount?: number;
    maxConcurrentCount?: number;
}

export async function getJobNodes(): Promise<JobNodeRow[]> {
    const result = await http.get<CommonResult<JobNodeRow[]>>('/admin/monitor/job-node/list');
    return unwrapResult(result.data);
}

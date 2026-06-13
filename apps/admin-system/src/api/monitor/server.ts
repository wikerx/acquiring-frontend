import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

export interface ServerInfo {
    cpu?: Record<string, unknown>;
    jvm?: Record<string, unknown>;
    system?: Record<string, unknown>;
    runtime?: Record<string, unknown>;
    disk?: Record<string, unknown>;
}

export async function getServerInfo(): Promise<ServerInfo> {
    const result = await request.get<CommonResult<ServerInfo>>('/admin/monitor/server') as unknown as CommonResult<ServerInfo>;
    return unwrapResult(result);
}

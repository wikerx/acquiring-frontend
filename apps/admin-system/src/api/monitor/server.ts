import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface ServerInfo {
    cpu?: Record<string, unknown>;
    jvm?: Record<string, unknown>;
    system?: Record<string, unknown>;
    runtime?: Record<string, unknown>;
    disk?: Record<string, unknown>;
}

export async function getServerInfo(): Promise<ServerInfo> {
    const result = await http.get<CommonResult<ServerInfo>>('/admin/monitor/server');
    return unwrapResult(result.data);
}

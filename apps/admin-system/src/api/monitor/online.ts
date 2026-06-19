import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface OnlineUser {
    sessionId?: string;
    userName?: string;
    loginIp?: string;
    loginTime?: string;
    userAgent?: string;
}

export interface OnlineListResult {
    records: OnlineUser[];
    total: number;
}

export interface OnlineQuery {
    pageNo?: number;
    pageSize?: number;
    loginIp?: string;
    userName?: string;
}

export async function getOnlineUsers(params: OnlineQuery): Promise<OnlineListResult> {
    const result = await http.get<CommonResult<OnlineListResult>>('/admin/monitor/online/list', { params });
    return unwrapResult(result.data);
}

export async function forceLogout(sessionId: string) {
    const result = await http.delete<CommonResult<null>>(`/admin/monitor/online/${sessionId}`);
    return unwrapResult(result.data);
}

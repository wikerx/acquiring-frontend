import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

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
    const result = await request.get<CommonResult<OnlineListResult>>('/admin/monitor/online/list', { params }) as unknown as CommonResult<OnlineListResult>;
    return unwrapResult(result);
}

export async function forceLogout(sessionId: string) {
    const result = await request.delete<CommonResult<null>>(`/admin/monitor/online/${sessionId}`) as unknown as CommonResult<null>;
    return unwrapResult(result);
}

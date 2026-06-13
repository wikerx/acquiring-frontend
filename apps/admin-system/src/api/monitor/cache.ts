import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

export interface CacheInfoResponse {
    connected: boolean;
    message?: string;
    info?: Record<string, string>;
}

export interface CacheKeyRow {
    key: string;
    type: string;
    ttl: number;
    size: number;
    value?: unknown;
}

export interface CacheKeyQuery {
    keyPattern?: string;
    pageNo?: number;
    pageSize?: number;
}

export interface CacheKeyListResult {
    records: CacheKeyRow[];
    total: number;
    truncated?: boolean;
}

export async function getCacheInfo(): Promise<CacheInfoResponse> {
    const result = await request.get<CommonResult<CacheInfoResponse>>('/admin/monitor/cache/info') as unknown as CommonResult<CacheInfoResponse>;
    return unwrapResult(result);
}

export async function getCacheKeys(params: CacheKeyQuery): Promise<CacheKeyListResult> {
    const result = await request.get<CommonResult<CacheKeyListResult>>('/admin/monitor/cache/keys', { params }) as unknown as CommonResult<CacheKeyListResult>;
    return unwrapResult(result);
}

export async function getCacheValue(key: string): Promise<CacheKeyRow> {
    const result = await request.get<CommonResult<CacheKeyRow>>('/admin/monitor/cache/value', {
        params: { key },
    }) as unknown as CommonResult<CacheKeyRow>;
    return unwrapResult(result);
}

export async function deleteCacheKey(key: string): Promise<boolean> {
    const result = await request.delete<CommonResult<boolean>>('/admin/monitor/cache/key', {
        params: { key },
    }) as unknown as CommonResult<boolean>;
    return unwrapResult(result);
}

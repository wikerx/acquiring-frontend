import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

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
    const result = await http.get<CommonResult<CacheInfoResponse>>('/admin/monitor/cache/info');
    return unwrapResult(result.data);
}

export async function getCacheKeys(params: CacheKeyQuery): Promise<CacheKeyListResult> {
    const result = await http.get<CommonResult<CacheKeyListResult>>('/admin/monitor/cache/keys', { params });
    return unwrapResult(result.data);
}

export async function getCacheValue(key: string): Promise<CacheKeyRow> {
    const result = await http.get<CommonResult<CacheKeyRow>>('/admin/monitor/cache/value', {
        params: { key },
    });
    return unwrapResult(result.data);
}

export async function deleteCacheKey(key: string): Promise<boolean> {
    const result = await http.delete<CommonResult<boolean>>('/admin/monitor/cache/key', {
        params: { key },
    });
    return unwrapResult(result.data);
}

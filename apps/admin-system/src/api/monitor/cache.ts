import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import type { CacheMetricsResponse } from './workbench';

/** Redis 连接状态和不含凭据的 INFO 摘要。 */
export interface CacheInfoResponse {
    connected: boolean;
    message?: string;
    info?: Record<string, string>;
}

/** 受管平台配置缓存 Key 的元数据；管理端不读取 Value。 */
export interface CacheKeyRow {
    key: string;
    type: string;
    ttl: number;
    size: number;
    value?: unknown;
}

/** 受管缓存 Key 的有界 SCAN 和分页条件。 */
export interface CacheKeyQuery {
    keyPattern?: string;
    pageNo?: number;
    pageSize?: number;
}

/** 缓存 Key 分页结果；truncated 表示达到物理扫描上限。 */
export interface CacheKeyListResult {
    records: CacheKeyRow[];
    total: number;
    truncated?: boolean;
}

/** 查询 Redis 当前连接状态和 INFO 摘要。 */
export async function getCacheInfo(): Promise<CacheInfoResponse> {
    const result = await http.get<CommonResult<CacheInfoResponse>>('/admin/monitor/cache/info');
    return unwrapResult(result.data);
}

/** 查询 Redis 进程内历史指标和能力状态。 */
export async function getCacheMetrics(): Promise<CacheMetricsResponse> {
    const result = await http.get<CommonResult<CacheMetricsResponse>>('/admin/monitor/cache/metrics');
    return unwrapResult(result.data);
}

/** 使用后端受控 SCAN 查询平台配置缓存 Key 元数据。 */
export async function getCacheKeys(params: CacheKeyQuery): Promise<CacheKeyListResult> {
    const result = await http.get<CommonResult<CacheKeyListResult>>('/admin/monitor/cache/keys', { params });
    return unwrapResult(result.data);
}

/** 查询单个受管 Key 的类型、TTL 和大小，不返回缓存内容。 */
export async function getCacheValue(key: string): Promise<CacheKeyRow> {
    const result = await http.get<CommonResult<CacheKeyRow>>('/admin/monitor/cache/value', {
        params: { key },
    });
    return unwrapResult(result.data);
}

/** 删除单个受管平台配置缓存 Key。 */
export async function deleteCacheKey(key: string): Promise<boolean> {
    const result = await http.delete<CommonResult<boolean>>('/admin/monitor/cache/key', {
        params: { key },
    });
    return unwrapResult(result.data);
}

import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

export interface SysConfig {
    id: number;
    configName: string;
    configKey: string;
    configValue?: string;
    valueType?: number;
    configGroup?: string;
    systemBuiltin?: number;
    visible?: number;
    encrypted?: number;
    status?: number;
    remark?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SysConfigQuery extends PageQuery {
    configName?: string;
    configKey?: string;
    configGroup?: string;
    status?: number;
}

export type SysConfigSaveRequest = Omit<
    SysConfig,
    'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'
>;

export async function searchConfigs(requestBody: SysConfigQuery) {
    const result = await request.post<CommonResult<PageResult<SysConfig>>>(
        '/admin/system/configs/search',
        requestBody,
    ) as unknown as CommonResult<PageResult<SysConfig>>;
    return unwrapResult(result);
}

export async function saveConfig(requestBody: SysConfigSaveRequest) {
    const result = await request.post<CommonResult<SysConfig>>(
        '/admin/system/configs',
        requestBody,
    ) as unknown as CommonResult<SysConfig>;
    return unwrapResult(result);
}

export async function updateConfig(configKey: string, requestBody: SysConfigSaveRequest) {
    const result = await request.put<CommonResult<SysConfig>>(
        `/admin/system/configs/${encodeURIComponent(configKey)}`,
        requestBody,
    ) as unknown as CommonResult<SysConfig>;
    return unwrapResult(result);
}

export async function getConfig(configKey: string) {
    const result = await request.get<CommonResult<SysConfig>>(
        `/admin/system/configs/${encodeURIComponent(configKey)}`,
    ) as unknown as CommonResult<SysConfig>;
    return unwrapResult(result);
}

export async function deleteConfig(configKey: string) {
    const result = await request.delete<CommonResult<void>>(
        `/admin/system/configs/${encodeURIComponent(configKey)}`,
    ) as unknown as CommonResult<void>;
    return unwrapResult(result);
}

export async function exportConfigs(requestBody: SysConfigQuery) {
    const result = await request.post<CommonResult<PageResult<SysConfig>>>(
        '/admin/system/configs/export',
        requestBody,
    ) as unknown as CommonResult<PageResult<SysConfig>>;
    return unwrapResult(result);
}

export async function refreshConfigCache() {
    const result = await request.post<CommonResult<void>>('/admin/system/configs/refresh-cache') as unknown as CommonResult<void>;
    return unwrapResult(result);
}

import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

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
    const result = await http.post<CommonResult<PageResult<SysConfig>>>(
        '/admin/system/configs/search',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function saveConfig(requestBody: SysConfigSaveRequest) {
    const result = await http.post<CommonResult<SysConfig>>(
        '/admin/system/configs',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function updateConfig(configKey: string, requestBody: SysConfigSaveRequest) {
    const result = await http.put<CommonResult<SysConfig>>(
        `/admin/system/configs/${encodeURIComponent(configKey)}`,
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function getConfig(configKey: string) {
    const result = await http.get<CommonResult<SysConfig>>(
        `/admin/system/configs/${encodeURIComponent(configKey)}`,
    );
    return unwrapResult(result.data);
}

export async function deleteConfig(configKey: string) {
    const result = await http.delete<CommonResult<void>>(
        `/admin/system/configs/${encodeURIComponent(configKey)}`,
    );
    return unwrapResult(result.data);
}

export async function exportConfigs(requestBody: SysConfigQuery) {
    const result = await http.post<CommonResult<PageResult<SysConfig>>>(
        '/admin/system/configs/export',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function refreshConfigCache() {
    const result = await http.post<CommonResult<void>>('/admin/system/configs/refresh-cache');
    return unwrapResult(result.data);
}

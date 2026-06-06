import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { http } from './http';

export interface SysConfig {
    id?: number;
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

export function saveConfig(request: SysConfigSaveRequest) {
    return http.post<CommonResult<SysConfig>>('/admin/system/configs', request);
}

export function getConfig(configKey: string) {
    return http.get<CommonResult<SysConfig>>(`/admin/system/configs/${encodeURIComponent(configKey)}`);
}

export function searchConfigs(request: SysConfigQuery = { pageNo: 1, pageSize: 20 }) {
    return http.post<CommonResult<PageResult<SysConfig>>>('/admin/system/configs/search', request);
}

export function deleteConfig(configKey: string) {
    return http.delete<CommonResult<void>>(`/admin/system/configs/${encodeURIComponent(configKey)}`);
}

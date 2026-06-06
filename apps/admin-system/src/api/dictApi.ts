import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { http } from './http';

export interface SysDictType {
    id?: number;
    dictName: string;
    dictType: string;
    bizDomain?: string;
    systemBuiltin?: number;
    editable?: number;
    status?: number;
    remark?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SysDictData {
    id?: number;
    dictType: string;
    dictLabel: string;
    dictValue: string;
    parentValue?: string;
    locale?: string;
    dictSort?: number;
    listClass?: string;
    extraJson?: string;
    isDefault?: number;
    status?: number;
    remark?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SysDictTypeQuery extends PageQuery {
    dictName?: string;
    dictType?: string;
    bizDomain?: string;
    status?: number;
}

export interface SysDictDataQuery extends PageQuery {
    dictType?: string;
    dictLabel?: string;
    dictValue?: string;
    parentValue?: string;
    locale?: string;
    status?: number;
}

export type SysDictTypeSaveRequest = Omit<SysDictType, 'id' | 'createdAt' | 'updatedAt'>;
export type SysDictDataSaveRequest = Omit<SysDictData, 'id' | 'createdAt' | 'updatedAt'>;

export function saveDictType(request: SysDictTypeSaveRequest) {
    return http.post<CommonResult<SysDictType>>('/admin/system/dicts/types', request);
}

export function searchDictTypes(request: SysDictTypeQuery = { pageNo: 1, pageSize: 20 }) {
    return http.post<CommonResult<PageResult<SysDictType>>>(
        '/admin/system/dicts/types/search',
        request,
    );
}

export function deleteDictType(dictType: string) {
    return http.delete<CommonResult<void>>(
        `/admin/system/dicts/types/${encodeURIComponent(dictType)}`,
    );
}

export function saveDictData(request: SysDictDataSaveRequest) {
    return http.post<CommonResult<SysDictData>>('/admin/system/dicts/data', request);
}

export function searchDictData(request: SysDictDataQuery = { pageNo: 1, pageSize: 20 }) {
    return http.post<CommonResult<PageResult<SysDictData>>>('/admin/system/dicts/data/search', request);
}

export function deleteDictData(dictType: string, dictValue: string) {
    return http.delete<CommonResult<void>>(
        `/admin/system/dicts/data/${encodeURIComponent(dictType)}/${encodeURIComponent(dictValue)}`,
    );
}

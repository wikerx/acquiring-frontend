import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

export interface SysDictType {
    id: number;
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
    id: number;
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

export async function searchDictTypes(requestBody: SysDictTypeQuery) {
    const result = await request.post<CommonResult<PageResult<SysDictType>>>(
        '/admin/system/dicts/types/search',
        requestBody,
    ) as unknown as CommonResult<PageResult<SysDictType>>;
    return unwrapResult(result);
}

export async function searchDictData(requestBody: SysDictDataQuery) {
    const result = await request.post<CommonResult<PageResult<SysDictData>>>(
        '/admin/system/dicts/data/search',
        requestBody,
    ) as unknown as CommonResult<PageResult<SysDictData>>;
    return unwrapResult(result);
}

export async function createDictType(requestBody: Omit<SysDictType, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await request.post<CommonResult<SysDictType>>(
        '/admin/system/dicts/types',
        requestBody,
    ) as unknown as CommonResult<SysDictType>;
    return unwrapResult(result);
}

export async function updateDictType(dictType: string, requestBody: Omit<SysDictType, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await request.put<CommonResult<SysDictType>>(
        `/admin/system/dicts/types/${encodeURIComponent(dictType)}`,
        requestBody,
    ) as unknown as CommonResult<SysDictType>;
    return unwrapResult(result);
}

export async function deleteDictType(dictType: string) {
    const result = await request.delete<CommonResult<void>>(
        `/admin/system/dicts/types/${encodeURIComponent(dictType)}`,
    ) as unknown as CommonResult<void>;
    return unwrapResult(result);
}

export async function exportDictTypes(requestBody: SysDictTypeQuery) {
    const result = await request.post<CommonResult<PageResult<SysDictType>>>(
        '/admin/system/dicts/types/export',
        requestBody,
    ) as unknown as CommonResult<PageResult<SysDictType>>;
    return unwrapResult(result);
}

export async function refreshDictCache() {
    const result = await request.post<CommonResult<void>>('/admin/system/dicts/refresh-cache') as unknown as CommonResult<void>;
    return unwrapResult(result);
}

export async function createDictData(requestBody: Omit<SysDictData, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await request.post<CommonResult<SysDictData>>(
        '/admin/system/dicts/data',
        requestBody,
    ) as unknown as CommonResult<SysDictData>;
    return unwrapResult(result);
}

export async function updateDictData(dictType: string, dictValue: string, requestBody: Omit<SysDictData, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await request.put<CommonResult<SysDictData>>(
        `/admin/system/dicts/data/${encodeURIComponent(dictType)}/${encodeURIComponent(dictValue)}`,
        requestBody,
    ) as unknown as CommonResult<SysDictData>;
    return unwrapResult(result);
}

export async function deleteDictData(dictType: string, dictValue: string, locale?: string) {
    const result = await request.delete<CommonResult<void>>(
        `/admin/system/dicts/data/${encodeURIComponent(dictType)}/${encodeURIComponent(dictValue)}`,
        { params: { locale } },
    ) as unknown as CommonResult<void>;
    return unwrapResult(result);
}

export async function exportDictData(requestBody: SysDictDataQuery) {
    const result = await request.post<CommonResult<PageResult<SysDictData>>>(
        '/admin/system/dicts/data/export',
        requestBody,
    ) as unknown as CommonResult<PageResult<SysDictData>>;
    return unwrapResult(result);
}

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

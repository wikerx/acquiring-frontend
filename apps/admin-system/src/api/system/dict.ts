import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { i18n } from '@/i18n';
import { downloadExcel } from '@/utils/download';
import type { ExportTaskSummary } from '@/api/operations/exportTask';

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

export async function getDictDataDetail(dictType: string, dictValue: string, locale?: string) {
    const result = await http.get<CommonResult<PageResult<SysDictData>>>(
        `/admin/system/dicts/data/${encodeURIComponent(dictType)}/${encodeURIComponent(dictValue)}`,
        { params: { locale } },
    );
    return unwrapResult(result.data);
}

export async function getDictDataDetailById(id: number) {
    const result = await http.get<CommonResult<SysDictData>>(`/admin/system/dicts/data/id/${id}`);
    return unwrapResult(result.data);
}

export async function searchDictTypes(requestBody: SysDictTypeQuery) {
    const result = await http.post<CommonResult<PageResult<SysDictType>>>(
        '/admin/system/dicts/types/search',
        requestBody,
    );
    return unwrapResult(result.data);
}

const pendingDictDataQueries = new Map<string, Promise<PageResult<SysDictData>>>();

/** 相同只读查询共享在途请求，避免列表和详情组件的并发读取触发重复提交保护。 */
export function searchDictData(requestBody: SysDictDataQuery): Promise<PageResult<SysDictData>> {
    const key = JSON.stringify([String(i18n.global.locale.value), Object.entries(requestBody)
        .filter(([, value]) => value !== undefined).sort(([left], [right]) => left.localeCompare(right))]);
    const pending = pendingDictDataQueries.get(key);
    if (pending) return pending;

    const request = http.post<CommonResult<PageResult<SysDictData>>>(
        '/admin/system/dicts/data/search',
        requestBody,
    ).then((result) => unwrapResult(result.data)).finally(() => {
        // 仅合并在途读取，不缓存完成结果，配置更新和失败重试必须重新读取。
        pendingDictDataQueries.delete(key);
    });
    pendingDictDataQueries.set(key, request);
    return request;
}

export async function createDictType(requestBody: Omit<SysDictType, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await http.post<CommonResult<SysDictType>>(
        '/admin/system/dicts/types',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function updateDictType(dictType: string, requestBody: Omit<SysDictType, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await http.put<CommonResult<SysDictType>>(
        `/admin/system/dicts/types/${encodeURIComponent(dictType)}`,
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function deleteDictType(dictType: string) {
    const result = await http.delete<CommonResult<void>>(
        `/admin/system/dicts/types/${encodeURIComponent(dictType)}`,
    );
    return unwrapResult(result.data);
}

export async function exportDictTypes(requestBody: SysDictTypeQuery) {
    await downloadExcel('/admin/system/dicts/types/export', {
        method: 'post',
        data: requestBody,
    });
}

export async function submitDictTypeExportTask(data: {
    requestId: string;
    query: Omit<SysDictTypeQuery, 'pageNo' | 'pageSize'>;
}) {
    const result = await http.post<CommonResult<ExportTaskSummary>>('/admin/system/dicts/types/export-task', data);
    return unwrapResult(result.data);
}

export async function refreshDictCache() {
    const result = await http.post<CommonResult<void>>('/admin/system/dicts/refresh-cache');
    return unwrapResult(result.data);
}

export async function createDictData(requestBody: Omit<SysDictData, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await http.post<CommonResult<SysDictData>>(
        '/admin/system/dicts/data',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function updateDictData(dictType: string, dictValue: string, requestBody: Omit<SysDictData, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await http.put<CommonResult<SysDictData>>(
        `/admin/system/dicts/data/${encodeURIComponent(dictType)}/${encodeURIComponent(dictValue)}`,
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function updateDictDataById(id: number, requestBody: Omit<SysDictData, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await http.put<CommonResult<SysDictData>>(
        `/admin/system/dicts/data/id/${id}`,
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function deleteDictData(dictType: string, dictValue: string, locale?: string) {
    const result = await http.delete<CommonResult<void>>(
        `/admin/system/dicts/data/${encodeURIComponent(dictType)}/${encodeURIComponent(dictValue)}`,
        { params: { locale } },
    );
    return unwrapResult(result.data);
}

export async function deleteDictDataById(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/system/dicts/data/id/${id}`);
    return unwrapResult(result.data);
}

export async function exportDictData(requestBody: SysDictDataQuery) {
    await downloadExcel('/admin/system/dicts/data/export', {
        method: 'post',
        data: requestBody,
    });
}

export async function submitDictDataExportTask(data: {
    requestId: string;
    query: Omit<SysDictDataQuery, 'pageNo' | 'pageSize'>;
}) {
    const result = await http.post<CommonResult<ExportTaskSummary>>('/admin/system/dicts/data/export-task', data);
    return unwrapResult(result.data);
}

import type { CommonResult, PageResult, PageQuery } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface SysNotice {
    id?: number;
    noticeTitle: string;
    noticeType: string;
    noticeContent?: string;
    status?: number;
    createBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface NoticeQuery extends PageQuery {
    noticeTitle?: string;
    noticeType?: string;
    createBy?: string;
}

export async function searchNotices(params: NoticeQuery) {
    const result = await http.get<CommonResult<PageResult<SysNotice>>>(
        '/admin/system/notice/list', { params },
    );
    return unwrapResult(result.data);
}

export async function listLatestNotices(limit = 3) {
    const result = await http.get<CommonResult<SysNotice[]>>(
        '/admin/system/notice/latest', { params: { limit } },
    );
    return unwrapResult(result.data);
}

export async function getNotice(id: number) {
    const result = await http.get<CommonResult<SysNotice>>(
        `/admin/system/notice/${id}`,
    );
    return unwrapResult(result.data);
}

export async function createNotice(data: SysNotice) {
    const result = await http.post<CommonResult<SysNotice>>(
        '/admin/system/notice', data,
    );
    return unwrapResult(result.data);
}

export async function updateNotice(id: number, data: SysNotice) {
    const result = await http.put<CommonResult<SysNotice>>(
        `/admin/system/notice/${id}`, data,
    );
    return unwrapResult(result.data);
}

export async function deleteNotice(id: number | number[]) {
    if (Array.isArray(id)) {
        const result = await http.delete<CommonResult<null>>(
            '/admin/system/notice/batch', { data: { ids: id } },
        );
        return unwrapResult(result.data);
    }
    const result = await http.delete<CommonResult<null>>(
        `/admin/system/notice/${id}`,
    );
    return unwrapResult(result.data);
}

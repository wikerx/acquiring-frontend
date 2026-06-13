import type { CommonResult, PageResult, PageQuery } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

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
    const result = await request.get<CommonResult<PageResult<SysNotice>>>(
        '/admin/system/notice/list', { params },
    ) as unknown as CommonResult<PageResult<SysNotice>>;
    return unwrapResult(result);
}

export async function getNotice(id: number) {
    const result = await request.get<CommonResult<SysNotice>>(
        `/admin/system/notice/${id}`,
    ) as unknown as CommonResult<SysNotice>;
    return unwrapResult(result);
}

export async function createNotice(data: SysNotice) {
    const result = await request.post<CommonResult<SysNotice>>(
        '/admin/system/notice', data,
    ) as unknown as CommonResult<SysNotice>;
    return unwrapResult(result);
}

export async function updateNotice(id: number, data: SysNotice) {
    const result = await request.put<CommonResult<SysNotice>>(
        `/admin/system/notice/${id}`, data,
    ) as unknown as CommonResult<SysNotice>;
    return unwrapResult(result);
}

export async function deleteNotice(id: number) {
    const result = await request.delete<CommonResult<null>>(
        `/admin/system/notice/${id}`,
    ) as unknown as CommonResult<null>;
    return unwrapResult(result);
}

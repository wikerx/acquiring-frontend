import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

export interface SysPost {
    id?: number;
    postCode: string;
    postName: string;
    sortNo?: number;
    status?: number;
    remark?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PostQuery extends PageQuery {
    postCode?: string;
    postName?: string;
    status?: number;
}

export async function searchPosts(params: PostQuery) {
    const result = await request.get<CommonResult<PageResult<SysPost>>>('/admin/system/post/list', { params }) as unknown as CommonResult<PageResult<SysPost>>;
    return unwrapResult(result);
}

export async function getAllPosts(): Promise<SysPost[]> {
    const result = await request.get<CommonResult<SysPost[]>>('/admin/system/post/all') as unknown as CommonResult<SysPost[]>;
    return unwrapResult(result);
}

export async function getPost(id: number): Promise<SysPost> {
    const result = await request.get<CommonResult<SysPost>>(`/admin/system/post/${id}`) as unknown as CommonResult<SysPost>;
    return unwrapResult(result);
}

export async function createPost(data: SysPost): Promise<SysPost> {
    const result = await request.post<CommonResult<SysPost>>('/admin/system/post', data) as unknown as CommonResult<SysPost>;
    return unwrapResult(result);
}

export async function updatePost(id: number, data: SysPost): Promise<SysPost> {
    const result = await request.put<CommonResult<SysPost>>(`/admin/system/post/${id}`, data) as unknown as CommonResult<SysPost>;
    return unwrapResult(result);
}

export async function deletePost(id: number): Promise<void> {
    const result = await request.delete<CommonResult<null>>(`/admin/system/post/${id}`) as unknown as CommonResult<null>;
    return unwrapResult(result) as unknown as void;
}

export async function exportPosts(): Promise<SysPost[]> {
    const result = await request.get<CommonResult<SysPost[]>>('/admin/system/post/export') as unknown as CommonResult<SysPost[]>;
    return unwrapResult(result);
}

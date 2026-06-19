import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

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
    const result = await http.get<CommonResult<PageResult<SysPost>>>('/admin/system/post/list', { params });
    return unwrapResult(result.data);
}

export async function getAllPosts(): Promise<SysPost[]> {
    const result = await http.get<CommonResult<SysPost[]>>('/admin/system/post/all');
    return unwrapResult(result.data);
}

export async function getPost(id: number): Promise<SysPost> {
    const result = await http.get<CommonResult<SysPost>>(`/admin/system/post/${id}`);
    return unwrapResult(result.data);
}

export async function createPost(data: SysPost): Promise<SysPost> {
    const result = await http.post<CommonResult<SysPost>>('/admin/system/post', data);
    return unwrapResult(result.data);
}

export async function updatePost(id: number, data: SysPost): Promise<SysPost> {
    const result = await http.put<CommonResult<SysPost>>(`/admin/system/post/${id}`, data);
    return unwrapResult(result.data);
}

export async function deletePost(id: number): Promise<void> {
    const result = await http.delete<CommonResult<null>>(`/admin/system/post/${id}`);
    return unwrapResult(result.data) as unknown as void;
}

export async function exportPosts(): Promise<SysPost[]> {
    const result = await http.get<CommonResult<SysPost[]>>('/admin/system/post/export');
    return unwrapResult(result.data);
}

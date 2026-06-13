import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

export interface SysDept {
    id?: number;
    parentId?: number;
    deptName: string;
    sortNo?: number;
    leader?: string;
    phone?: string;
    email?: string;
    status?: number;
    createdAt?: string;
    updatedAt?: string;
    children?: SysDept[];
}

export async function getDeptTree(): Promise<SysDept[]> {
    const result = await request.get<CommonResult<SysDept[]>>('/admin/system/dept/tree') as unknown as CommonResult<SysDept[]>;
    return unwrapResult(result);
}

export async function getDept(id: number): Promise<SysDept> {
    const result = await request.get<CommonResult<SysDept>>(`/admin/system/dept/${id}`) as unknown as CommonResult<SysDept>;
    return unwrapResult(result);
}

export async function createDept(data: SysDept): Promise<SysDept> {
    const result = await request.post<CommonResult<SysDept>>('/admin/system/dept', data) as unknown as CommonResult<SysDept>;
    return unwrapResult(result);
}

export async function updateDept(id: number, data: SysDept): Promise<SysDept> {
    const result = await request.put<CommonResult<SysDept>>(`/admin/system/dept/${id}`, data) as unknown as CommonResult<SysDept>;
    return unwrapResult(result);
}

export async function deleteDept(id: number): Promise<void> {
    const result = await request.delete<CommonResult<null>>(`/admin/system/dept/${id}`) as unknown as CommonResult<null>;
    return unwrapResult(result) as unknown as void;
}

export async function exportDepts(): Promise<SysDept[]> {
    const result = await request.get<CommonResult<SysDept[]>>('/admin/system/dept/export') as unknown as CommonResult<SysDept[]>;
    return unwrapResult(result);
}

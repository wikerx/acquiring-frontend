import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

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
    const result = await http.get<CommonResult<SysDept[]>>('/admin/system/dept/tree');
    return unwrapResult(result.data);
}

export async function getDept(id: number): Promise<SysDept> {
    const result = await http.get<CommonResult<SysDept>>(`/admin/system/dept/${id}`);
    return unwrapResult(result.data);
}

export async function createDept(data: SysDept): Promise<SysDept> {
    const result = await http.post<CommonResult<SysDept>>('/admin/system/dept', data);
    return unwrapResult(result.data);
}

export async function updateDept(id: number, data: SysDept): Promise<SysDept> {
    const result = await http.put<CommonResult<SysDept>>(`/admin/system/dept/${id}`, data);
    return unwrapResult(result.data);
}

export async function deleteDept(id: number): Promise<void> {
    const result = await http.delete<CommonResult<null>>(`/admin/system/dept/${id}`);
    return unwrapResult(result.data) as unknown as void;
}

export async function exportDepts(): Promise<SysDept[]> {
    const result = await http.get<CommonResult<SysDept[]>>('/admin/system/dept/export');
    return unwrapResult(result.data);
}

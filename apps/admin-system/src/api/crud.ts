import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface PageQuery {
    pageNum?: number;
    pageSize?: number;
    [key: string]: unknown;
}

export interface PageResult<T> {
    rows: T[];
    total: number;
}

export function createCrudApi<T extends Record<string, unknown>>(baseUrl: string) {
    return {
        async page(data: PageQuery): Promise<PageResult<T>> {
            const result = await http.post<CommonResult<PageResult<T>>>(`${baseUrl}/page`, data);
            return unwrapResult(result.data);
        },
        async detail(id: string | number): Promise<T> {
            const result = await http.get<CommonResult<T>>(`${baseUrl}/${id}`);
            return unwrapResult(result.data);
        },
        async create(data: Partial<T>): Promise<T> {
            const result = await http.post<CommonResult<T>>(baseUrl, data);
            return unwrapResult(result.data);
        },
        async update(id: string | number, data: Partial<T>): Promise<T> {
            const result = await http.put<CommonResult<T>>(`${baseUrl}/${id}`, data);
            return unwrapResult(result.data);
        },
        async remove(id: string | number): Promise<void> {
            const result = await http.delete<CommonResult<void>>(`${baseUrl}/${id}`);
            return unwrapResult(result.data);
        },
    };
}

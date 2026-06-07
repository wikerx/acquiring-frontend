import request from '@/utils/request';

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
        page(data: PageQuery) {
            return request.post<PageResult<T>>(`${baseUrl}/page`, data);
        },
        detail(id: string | number) {
            return request.get<T>(`${baseUrl}/${id}`);
        },
        create(data: Partial<T>) {
            return request.post<T>(baseUrl, data);
        },
        update(id: string | number, data: Partial<T>) {
            return request.put<T>(`${baseUrl}/${id}`, data);
        },
        remove(id: string | number) {
            return request.delete<void>(`${baseUrl}/${id}`);
        },
    };
}

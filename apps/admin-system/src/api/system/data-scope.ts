import { createCrudApi, type PageQuery } from '@/api/crud';

export type DataScopePageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/system/data-scope');

export const pageDataScope = api.page;
export const getDataScope = api.detail;
export const createDataScope = api.create;
export const updateDataScope = api.update;
export const deleteDataScope = api.remove;

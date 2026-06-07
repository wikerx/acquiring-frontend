import { createCrudApi, type PageQuery } from '@/api/crud';

export type AccountPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/system/account');

export const pageAccount = api.page;
export const getAccount = api.detail;
export const createAccount = api.create;
export const updateAccount = api.update;
export const deleteAccount = api.remove;

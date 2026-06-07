import { createCrudApi, type PageQuery } from '@/api/crud';

export type LoginSessionPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/audit/login-session');

export const pageLoginSession = api.page;
export const getLoginSession = api.detail;
export const createLoginSession = api.create;
export const updateLoginSession = api.update;
export const deleteLoginSession = api.remove;

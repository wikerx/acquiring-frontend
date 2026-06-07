import { createCrudApi, type PageQuery } from '@/api/crud';

export type AppPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/system/app');

export const pageApp = api.page;
export const getApp = api.detail;
export const createApp = api.create;
export const updateApp = api.update;
export const deleteApp = api.remove;

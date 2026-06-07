import { createCrudApi, type PageQuery } from '@/api/crud';

export type PermissionPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/system/permission');

export const pagePermission = api.page;
export const getPermission = api.detail;
export const createPermission = api.create;
export const updatePermission = api.update;
export const deletePermission = api.remove;

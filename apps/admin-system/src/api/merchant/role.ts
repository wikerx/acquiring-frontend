import { createCrudApi, type PageQuery } from '@/api/crud';

export type MerchantRolePageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/merchant/role');

export const pageMerchantRole = api.page;
export const getMerchantRole = api.detail;
export const createMerchantRole = api.create;
export const updateMerchantRole = api.update;
export const deleteMerchantRole = api.remove;

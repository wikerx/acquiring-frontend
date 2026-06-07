import { createCrudApi, type PageQuery } from '@/api/crud';

export type MerchantUserPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/merchant/user');

export const pageMerchantUser = api.page;
export const getMerchantUser = api.detail;
export const createMerchantUser = api.create;
export const updateMerchantUser = api.update;
export const deleteMerchantUser = api.remove;

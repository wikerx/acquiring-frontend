import { createCrudApi, type PageQuery } from '@/api/crud';

export type MerchantInfoPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/merchant/info');

export const pageMerchantInfo = api.page;
export const getMerchantInfo = api.detail;
export const createMerchantInfo = api.create;
export const updateMerchantInfo = api.update;
export const deleteMerchantInfo = api.remove;

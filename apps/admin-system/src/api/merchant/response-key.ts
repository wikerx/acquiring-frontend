import { createCrudApi, type PageQuery } from '@/api/crud';

export type MerchantResponseKeyPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/merchant/response-key');

export const pageMerchantResponseKey = api.page;
export const getMerchantResponseKey = api.detail;
export const createMerchantResponseKey = api.create;
export const updateMerchantResponseKey = api.update;
export const deleteMerchantResponseKey = api.remove;

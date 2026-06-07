import { createCrudApi, type PageQuery } from '@/api/crud';

export type MerchantJwtKeyPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/merchant/jwt-key');

export const pageMerchantJwtKey = api.page;
export const getMerchantJwtKey = api.detail;
export const createMerchantJwtKey = api.create;
export const updateMerchantJwtKey = api.update;
export const deleteMerchantJwtKey = api.remove;

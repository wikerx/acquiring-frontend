import { createCrudApi, type PageQuery } from '@/api/crud';

export type MerchantPlatformPayloadKeyPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/merchant/platform-payload-key');

export const pageMerchantPlatformPayloadKey = api.page;
export const getMerchantPlatformPayloadKey = api.detail;
export const createMerchantPlatformPayloadKey = api.create;
export const updateMerchantPlatformPayloadKey = api.update;
export const deleteMerchantPlatformPayloadKey = api.remove;

import { createCrudApi, type PageQuery } from '@/api/crud';

export type VerifyCodePageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/system/verify-code');

export const pageVerifyCode = api.page;
export const getVerifyCode = api.detail;
export const createVerifyCode = api.create;
export const updateVerifyCode = api.update;
export const deleteVerifyCode = api.remove;

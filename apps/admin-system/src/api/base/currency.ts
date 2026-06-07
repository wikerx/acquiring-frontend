import { createCrudApi, type PageQuery } from '@/api/crud';

export type CurrencyPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/base/currency');

export const pageCurrency = api.page;
export const getCurrency = api.detail;
export const createCurrency = api.create;
export const updateCurrency = api.update;
export const deleteCurrency = api.remove;

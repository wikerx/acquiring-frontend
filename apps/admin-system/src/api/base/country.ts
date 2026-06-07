import { createCrudApi, type PageQuery } from '@/api/crud';

export type CountryPageQuery = PageQuery;
const api = createCrudApi<Record<string, unknown>>('/base/country');

export const pageCountry = api.page;
export const getCountry = api.detail;
export const createCountry = api.create;
export const updateCountry = api.update;
export const deleteCountry = api.remove;

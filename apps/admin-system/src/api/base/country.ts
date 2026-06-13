import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

export interface IsoCountry {
    id: number;
    continentCode?: string;
    continentName?: string;
    englishName: string;
    shortEnglishName?: string;
    chineseName: string;
    alpha2Code: string;
    alpha3Code: string;
    numericCode?: string;
    flagEmoji?: string;
    primaryLanguageCode?: string;
    primaryLanguageEnglish?: string;
    primaryLanguageChinese?: string;
    currencyAlpha3Code?: string;
    status?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface IsoCountryQuery {
    pageNo?: number;
    pageSize?: number;
    keyword?: string;
    continentCode?: string;
    status?: number;
}

export async function searchCountries(params: IsoCountryQuery = {}) {
    const result = await request.get<CommonResult<PageResult<IsoCountry>>>('/admin/base/countries/list', { params }) as unknown as CommonResult<PageResult<IsoCountry>>;
    return unwrapResult(result);
}

export async function getCountry(id: number) {
    const result = await request.get<CommonResult<IsoCountry>>(`/admin/base/countries/${id}`) as unknown as CommonResult<IsoCountry>;
    return unwrapResult(result);
}

export async function createCountry(data: Partial<IsoCountry>) {
    const result = await request.post<CommonResult<IsoCountry>>('/admin/base/countries', data) as unknown as CommonResult<IsoCountry>;
    return unwrapResult(result);
}

export async function updateCountry(id: number, data: Partial<IsoCountry>) {
    const result = await request.put<CommonResult<IsoCountry>>(`/admin/base/countries/${id}`, data) as unknown as CommonResult<IsoCountry>;
    return unwrapResult(result);
}

export async function changeCountryStatus(id: number, status: number) {
    const result = await request.put<CommonResult<IsoCountry>>(`/admin/base/countries/${id}/status`, { status }) as unknown as CommonResult<IsoCountry>;
    return unwrapResult(result);
}

export async function deleteCountry(id: number) {
    const result = await request.delete<CommonResult<null>>(`/admin/base/countries/${id}`) as unknown as CommonResult<null>;
    return unwrapResult(result);
}

export async function exportCountries() {
    const result = await request.get<CommonResult<IsoCountry[]>>('/admin/base/countries/export') as unknown as CommonResult<IsoCountry[]>;
    return unwrapResult(result);
}

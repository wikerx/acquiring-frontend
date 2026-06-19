import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

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
    const result = await http.get<CommonResult<PageResult<IsoCountry>>>('/admin/base/countries/list', { params });
    return unwrapResult(result.data);
}

export async function getCountry(id: number) {
    const result = await http.get<CommonResult<IsoCountry>>(`/admin/base/countries/${id}`);
    return unwrapResult(result.data);
}

export async function createCountry(data: Partial<IsoCountry>) {
    const result = await http.post<CommonResult<IsoCountry>>('/admin/base/countries', data);
    return unwrapResult(result.data);
}

export async function updateCountry(id: number, data: Partial<IsoCountry>) {
    const result = await http.put<CommonResult<IsoCountry>>(`/admin/base/countries/${id}`, data);
    return unwrapResult(result.data);
}

export async function changeCountryStatus(id: number, status: number) {
    const result = await http.put<CommonResult<IsoCountry>>(`/admin/base/countries/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function deleteCountry(id: number) {
    const result = await http.delete<CommonResult<null>>(`/admin/base/countries/${id}`);
    return unwrapResult(result.data);
}

export async function exportCountries() {
    const result = await http.get<CommonResult<IsoCountry[]>>('/admin/base/countries/export');
    return unwrapResult(result.data);
}

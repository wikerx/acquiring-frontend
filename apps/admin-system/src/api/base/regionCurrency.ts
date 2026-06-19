import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface RegionCurrencyRow {
    id: number;
    alpha2Code?: string;
    alpha3Code?: string;
    countryName: string;
    countryEnglishName?: string;
    continentCode?: string;
    continentName?: string;
    currencyAlpha3Code?: string;
    currencyName?: string;
    currencySymbol?: string;
    status?: number;
}

export interface RegionCurrencyQuery extends PageQuery {
    keyword?: string;
    continentCode?: string;
}

export async function searchRegionCurrencies(params: RegionCurrencyQuery) {
    const result = await http.get<CommonResult<PageResult<RegionCurrencyRow>>>('/admin/base/region-currencies/list', { params });
    return unwrapResult(result.data);
}

export async function updateRegionCurrency(id: number, currencyAlpha3Code: string) {
    const result = await http.put<CommonResult<null>>(`/admin/base/region-currencies/${id}`, { currencyAlpha3Code });
    return unwrapResult(result.data);
}

export async function createRegionCurrency(countryId: number, currencyAlpha3Code: string) {
    const result = await http.post<CommonResult<null>>('/admin/base/region-currencies', { countryId, currencyAlpha3Code });
    return unwrapResult(result.data);
}

export async function deleteRegionCurrency(id: number) {
    const result = await http.delete<CommonResult<null>>(`/admin/base/region-currencies/${id}`);
    return unwrapResult(result.data);
}

export async function changeRegionCurrencyStatus(id: number, status: number) {
    const result = await http.put<CommonResult<null>>(`/admin/base/region-currencies/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function exportRegionCurrencies() {
    const result = await http.get<CommonResult<RegionCurrencyRow[]>>('/admin/base/region-currencies/export');
    return unwrapResult(result.data);
}

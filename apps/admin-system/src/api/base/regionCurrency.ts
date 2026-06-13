import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

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
    const result = await request.get<CommonResult<PageResult<RegionCurrencyRow>>>('/admin/base/region-currencies/list', { params }) as unknown as CommonResult<PageResult<RegionCurrencyRow>>;
    return unwrapResult(result);
}

export async function updateRegionCurrency(id: number, currencyAlpha3Code: string) {
    const result = await request.put<CommonResult<null>>(`/admin/base/region-currencies/${id}`, { currencyAlpha3Code }) as unknown as CommonResult<null>;
    return unwrapResult(result);
}

export async function createRegionCurrency(countryId: number, currencyAlpha3Code: string) {
    const result = await request.post<CommonResult<null>>('/admin/base/region-currencies', { countryId, currencyAlpha3Code }) as unknown as CommonResult<null>;
    return unwrapResult(result);
}

export async function deleteRegionCurrency(id: number) {
    const result = await request.delete<CommonResult<null>>(`/admin/base/region-currencies/${id}`) as unknown as CommonResult<null>;
    return unwrapResult(result);
}

export async function changeRegionCurrencyStatus(id: number, status: number) {
    const result = await request.put<CommonResult<null>>(`/admin/base/region-currencies/${id}/status`, { status }) as unknown as CommonResult<null>;
    return unwrapResult(result);
}

export async function exportRegionCurrencies() {
    const result = await request.get<CommonResult<RegionCurrencyRow[]>>('/admin/base/region-currencies/export') as unknown as CommonResult<RegionCurrencyRow[]>;
    return unwrapResult(result);
}

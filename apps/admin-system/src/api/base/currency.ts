import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface IsoCurrency {
    id: number;
    alpha3Code: string;
    numericCode?: string;
    englishName: string;
    chineseName: string;
    currencySymbol?: string;
    fractionDigits?: number;
    minorUnitMultiplier?: number;
    minimumAmount?: number;
    status?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface IsoCurrencyQuery {
    pageNo?: number;
    pageSize?: number;
    keyword?: string;
    status?: number;
}

export async function searchCurrencies(params: IsoCurrencyQuery = {}) {
    const result = await http.get<CommonResult<PageResult<IsoCurrency>>>('/admin/base/currencies/list', { params });
    return unwrapResult(result.data);
}

export async function getCurrency(id: number) {
    const result = await http.get<CommonResult<IsoCurrency>>(`/admin/base/currencies/${id}`);
    return unwrapResult(result.data);
}

export async function createCurrency(data: Partial<IsoCurrency>) {
    const result = await http.post<CommonResult<IsoCurrency>>('/admin/base/currencies', data);
    return unwrapResult(result.data);
}

export async function updateCurrency(id: number, data: Partial<IsoCurrency>) {
    const result = await http.put<CommonResult<IsoCurrency>>(`/admin/base/currencies/${id}`, data);
    return unwrapResult(result.data);
}

export async function changeCurrencyStatus(id: number, status: number) {
    const result = await http.put<CommonResult<IsoCurrency>>(`/admin/base/currencies/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function deleteCurrency(id: number) {
    const result = await http.delete<CommonResult<null>>(`/admin/base/currencies/${id}`);
    return unwrapResult(result.data);
}

export async function exportCurrencies() {
    const result = await http.get<CommonResult<IsoCurrency[]>>('/admin/base/currencies/export');
    return unwrapResult(result.data);
}

import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

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
    const result = await request.get<CommonResult<PageResult<IsoCurrency>>>('/admin/base/currencies/list', { params }) as unknown as CommonResult<PageResult<IsoCurrency>>;
    return unwrapResult(result);
}

export async function getCurrency(id: number) {
    const result = await request.get<CommonResult<IsoCurrency>>(`/admin/base/currencies/${id}`) as unknown as CommonResult<IsoCurrency>;
    return unwrapResult(result);
}

export async function createCurrency(data: Partial<IsoCurrency>) {
    const result = await request.post<CommonResult<IsoCurrency>>('/admin/base/currencies', data) as unknown as CommonResult<IsoCurrency>;
    return unwrapResult(result);
}

export async function updateCurrency(id: number, data: Partial<IsoCurrency>) {
    const result = await request.put<CommonResult<IsoCurrency>>(`/admin/base/currencies/${id}`, data) as unknown as CommonResult<IsoCurrency>;
    return unwrapResult(result);
}

export async function changeCurrencyStatus(id: number, status: number) {
    const result = await request.put<CommonResult<IsoCurrency>>(`/admin/base/currencies/${id}/status`, { status }) as unknown as CommonResult<IsoCurrency>;
    return unwrapResult(result);
}

export async function deleteCurrency(id: number) {
    const result = await request.delete<CommonResult<null>>(`/admin/base/currencies/${id}`) as unknown as CommonResult<null>;
    return unwrapResult(result);
}

export async function exportCurrencies() {
    const result = await request.get<CommonResult<IsoCurrency[]>>('/admin/base/currencies/export') as unknown as CommonResult<IsoCurrency[]>;
    return unwrapResult(result);
}

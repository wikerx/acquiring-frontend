import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface IpLibraryRecord {
    id: number;
    ipType: 'IPV4' | 'IPV6';
    ipNumberStart: string;
    ipNumberEnd: string;
    ipAddressStart: string;
    ipAddressEnd: string;
    countryAlpha2: string;
    countryAlpha3: string;
    countryNumeric: string;
    countryName: string;
    stateProvince?: string;
    city?: string;
    dataVersion?: string;
    createTime?: string;
    createBy?: string;
}

export interface IpLibraryQuery {
    pageNo?: number;
    pageSize?: number;
    ipType?: 'IPV4' | 'IPV6' | '';
    ipAddress?: string;
}

export async function pageIpLibrary(data: IpLibraryQuery = {}) {
    const result = await http.post<CommonResult<PageResult<IpLibraryRecord>>>('/admin/base/ip-library/page', data);
    return unwrapResult(result.data);
}

export async function lookupIpLibrary(ipAddress: string, ipType?: 'IPV4' | 'IPV6' | '') {
    const result = await http.post<CommonResult<IpLibraryRecord | null>>('/admin/base/ip-library/lookup', {
        ipAddress,
        ipType: ipType || undefined,
    });
    return unwrapResult(result.data);
}

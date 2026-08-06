import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

export interface MerchantIpWhitelistItem {
    id?: string;
    ipType?: string;
    ipValue?: string;
    status?: number;
    approvalStatus?: number;
    approvalRemark?: string;
    submitSource?: string;
    reviewBy?: string;
    reviewTime?: string;
    remark?: string;
    updateBy?: string;
    gmtModified?: string;
}

export interface MerchantIpWhitelistRow {
    id?: string;
    merchantId: string;
    merchantName?: string;
    merchantShortName?: string;
    ipType?: string;
    ipValue?: string;
    status?: number;
    approvalStatus?: number;
    approvalRemark?: string;
    submitSource?: string;
    reviewBy?: string;
    reviewTime?: string;
    ipWhitelistEnabled?: number;
    remark?: string;
    configRemark?: string;
    createBy?: string;
    updateBy?: string;
    gmtCreate?: string;
    gmtModified?: string;
    ipWhitelists?: MerchantIpWhitelistItem[];
}

export interface MerchantIpWhitelistQuery extends PageQuery {
    merchantId?: string;
    merchantKeyword?: string;
    ipValue?: string;
    ipType?: string;
    status?: number;
    approvalStatus?: number;
    submitSource?: string;
    ipWhitelistEnabled?: number;
}

export interface MerchantIpWhitelistCreateRequest {
    merchantId: string;
    ipValues: string[];
    status?: number;
    remark?: string;
}

export interface MerchantIpWhitelistUpdateRequest {
    ipValue: string;
    status?: number;
    remark?: string;
}

export interface MerchantIpWhitelistConfigRequest {
    merchantId: string;
    ipWhitelistEnabled: number;
    remark?: string;
}

export interface MerchantIpWhitelistApprovalRequest {
    approvalStatus: 1 | 2;
    approvalRemark?: string;
    status?: number;
}

export async function searchMerchantIpWhitelists(data: MerchantIpWhitelistQuery) {
    const result = await http.post<CommonResult<PageResult<MerchantIpWhitelistRow>>>('/admin/merchant/ip-whitelist/search', data);
    return unwrapResult(result.data);
}

export async function exportMerchantIpWhitelists(data: MerchantIpWhitelistQuery) {
    await downloadExcel('/admin/merchant/ip-whitelist/export', { data });
}

export async function getMerchantIpWhitelist(id: string) {
    const result = await http.get<CommonResult<MerchantIpWhitelistRow>>(`/admin/merchant/ip-whitelist/${id}`);
    return unwrapResult(result.data);
}

export async function createMerchantIpWhitelists(data: MerchantIpWhitelistCreateRequest) {
    const result = await http.post<CommonResult<MerchantIpWhitelistRow[]>>('/admin/merchant/ip-whitelist', data);
    return unwrapResult(result.data);
}

export async function updateMerchantIpWhitelist(id: string, data: MerchantIpWhitelistUpdateRequest) {
    const result = await http.put<CommonResult<MerchantIpWhitelistRow>>(`/admin/merchant/ip-whitelist/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateMerchantIpWhitelistStatus(id: string, status: number) {
    const result = await http.put<CommonResult<MerchantIpWhitelistRow>>(`/admin/merchant/ip-whitelist/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function approveMerchantIpWhitelist(id: string, data: MerchantIpWhitelistApprovalRequest) {
    const result = await http.put<CommonResult<MerchantIpWhitelistRow>>(`/admin/merchant/ip-whitelist/${id}/approval`, data);
    return unwrapResult(result.data);
}

export async function updateMerchantIpWhitelistConfig(data: MerchantIpWhitelistConfigRequest) {
    const result = await http.put<CommonResult<MerchantIpWhitelistRow>>('/admin/merchant/ip-whitelist/config', data);
    return unwrapResult(result.data);
}

export async function deleteMerchantIpWhitelist(id: string) {
    const result = await http.delete<CommonResult<void>>(`/admin/merchant/ip-whitelist/${id}`);
    return unwrapResult(result.data);
}

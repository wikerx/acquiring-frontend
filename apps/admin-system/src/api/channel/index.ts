import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface ChannelInfo {
    id: number;
    channelCode: string;
    channelCnName: string;
    channelEnName: string;
    channelStatus: number;
    supportAcquiring: number;
    supportPayout: number;
    support3ds: number;
    defaultRequestUrl?: string;
    defaultInteractionMode?: string;
    sortOrder?: number;
    remark?: string;
    acquiringPaymentMethods?: string[];
    payoutPaymentMethods?: string[];
    createTime?: string;
    updateTime?: string;
}

export interface ChannelOption {
    id: number;
    channelCode: string;
    channelName: string;
    channelStatus: number;
    supportAcquiring: number;
    supportPayout: number;
    support3ds: number;
}

export interface ChannelCapability {
    id: number;
    channelId: number;
    channelCode: string;
    channelName: string;
    businessType: string;
    paymentMethod: string;
    transactionType?: string;
    transactionTypes?: string[];
    currencyCodes: string[];
    cardBrands: string[];
    support3ds: number;
    supportIncrementalAuthorization: number;
    capabilityStatus: number;
    sortOrder?: number;
    remark?: string;
    createTime?: string;
    updateTime?: string;
}

export interface ChannelLimitRule {
    id: number;
    channelId: number;
    channelCode: string;
    channelName: string;
    businessType: string;
    paymentMethod?: string;
    cardBrand?: string;
    limitType: string;
    limitCurrency: string;
    limitAmount: number;
    ruleStatus: number;
    remark?: string;
    createBy?: string;
    updateBy?: string;
    createTime?: string;
    updateTime?: string;
}

export interface ChannelInfoQuery extends PageQuery {
    keyword?: string;
    channelStatus?: number;
    supportAcquiring?: number;
    supportPayout?: number;
    support3ds?: number;
}

export interface ChannelCapabilityQuery extends PageQuery {
    channelId?: number;
    businessType?: string;
    paymentMethod?: string;
    transactionType?: string;
    currencyCode?: string;
    cardBrand?: string;
    capabilityStatus?: number;
}

export interface ChannelLimitQuery extends PageQuery {
    channelId?: number;
    businessType?: string;
    paymentMethod?: string;
    cardBrand?: string;
    limitType?: string;
    ruleStatus?: number;
}

export async function searchChannels(data: ChannelInfoQuery) {
    const result = await http.post<CommonResult<PageResult<ChannelInfo>>>('/admin/channel/info/search', data);
    return unwrapResult(result.data);
}

export async function listChannelOptions() {
    const result = await http.get<CommonResult<ChannelOption[]>>('/admin/channel/info/options');
    return unwrapResult(result.data);
}

export async function getChannel(id: number) {
    const result = await http.get<CommonResult<ChannelInfo>>(`/admin/channel/info/${id}`);
    return unwrapResult(result.data);
}

export async function createChannel(data: Partial<ChannelInfo>) {
    const result = await http.post<CommonResult<ChannelInfo>>('/admin/channel/info', data);
    return unwrapResult(result.data);
}

export async function updateChannel(id: number, data: Partial<ChannelInfo>) {
    const result = await http.put<CommonResult<ChannelInfo>>(`/admin/channel/info/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateChannelStatus(id: number, status: number) {
    const result = await http.put<CommonResult<ChannelInfo>>(`/admin/channel/info/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function deleteChannel(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/channel/info/${id}`);
    return unwrapResult(result.data);
}

export async function searchChannelCapabilities(data: ChannelCapabilityQuery) {
    const result = await http.post<CommonResult<PageResult<ChannelCapability>>>('/admin/channel/capabilities/search', data);
    return unwrapResult(result.data);
}

export async function getChannelCapability(id: number) {
    const result = await http.get<CommonResult<ChannelCapability>>(`/admin/channel/capabilities/${id}`);
    return unwrapResult(result.data);
}

export async function createChannelCapability(data: Partial<ChannelCapability>) {
    const result = await http.post<CommonResult<ChannelCapability>>('/admin/channel/capabilities', data);
    return unwrapResult(result.data);
}

export async function updateChannelCapability(id: number, data: Partial<ChannelCapability>) {
    const result = await http.put<CommonResult<ChannelCapability>>(`/admin/channel/capabilities/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateChannelCapabilityStatus(id: number, status: number) {
    const result = await http.put<CommonResult<ChannelCapability>>(`/admin/channel/capabilities/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function updateChannelCapabilitySupport(id: number, data: Pick<Partial<ChannelCapability>, 'support3ds' | 'supportIncrementalAuthorization'>) {
    const result = await http.put<CommonResult<ChannelCapability>>(`/admin/channel/capabilities/${id}/support`, data);
    return unwrapResult(result.data);
}

export async function deleteChannelCapability(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/channel/capabilities/${id}`);
    return unwrapResult(result.data);
}

export async function searchChannelLimits(data: ChannelLimitQuery) {
    const result = await http.post<CommonResult<PageResult<ChannelLimitRule>>>('/admin/channel/limits/search', data);
    return unwrapResult(result.data);
}

export async function getChannelLimit(id: number) {
    const result = await http.get<CommonResult<ChannelLimitRule>>(`/admin/channel/limits/${id}`);
    return unwrapResult(result.data);
}

export async function createChannelLimit(data: Partial<ChannelLimitRule>) {
    const result = await http.post<CommonResult<ChannelLimitRule>>('/admin/channel/limits', data);
    return unwrapResult(result.data);
}

export async function createChannelLimits(items: Partial<ChannelLimitRule>[]) {
    const result = await http.post<CommonResult<ChannelLimitRule[]>>('/admin/channel/limits/batch', { items });
    return unwrapResult(result.data);
}

export async function saveChannelLimitDimension(items: Partial<ChannelLimitRule>[]) {
    const result = await http.put<CommonResult<ChannelLimitRule[]>>('/admin/channel/limits/dimension', { items });
    return unwrapResult(result.data);
}

export async function updateChannelLimit(id: number, data: Partial<ChannelLimitRule>) {
    const result = await http.put<CommonResult<ChannelLimitRule>>(`/admin/channel/limits/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateChannelLimitStatus(id: number, status: number) {
    const result = await http.put<CommonResult<ChannelLimitRule>>(`/admin/channel/limits/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function deleteChannelLimit(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/channel/limits/${id}`);
    return unwrapResult(result.data);
}

import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

export interface ExchangeRateSource {
    id: number;
    sourceCode: string;
    sourceName: string;
    sourceType: string;
    requestUrl?: string;
    defaultSource: number;
    priority: number;
    timeoutSeconds: number;
    sourceStatus: number;
    lastFetchTime?: string;
    lastFetchStatus?: string;
    remark?: string;
    createTime?: string;
    updateTime?: string;
}

export interface ExchangeRawRate {
    id: number;
    sourceCode: string;
    baseCurrency: string;
    quoteCurrency: string;
    cashBuyRate?: string;
    cashSellRate?: string;
    spotBuyRate?: string;
    spotSellRate?: string;
    middleRate?: string;
    publishTime: string;
    fetchTime?: string;
    effectiveTime?: string;
    createMethod: string;
    batchNo?: string;
    rateStatus: string;
    voidReason?: string;
    createTime?: string;
    updateTime?: string;
    remark?: string;
}

export interface ExchangeRateRule {
    id: number;
    rateType: string;
    sourceCode: string;
    baseCurrency: string;
    quoteCurrency: string;
    rateField: string;
    adjustDirection: string;
    adjustMethod: string;
    adjustValue: string;
    decimalScale: number;
    roundingMode: string;
    priority: number;
    effectiveStartTime?: string;
    effectiveEndTime?: string;
    ruleStatus: number;
    remark?: string;
    createTime?: string;
    updateTime?: string;
}

export interface ExchangeBusinessRate {
    id: number;
    rateType: string;
    sourceCode: string;
    baseCurrency: string;
    quoteCurrency: string;
    rawRateId?: number;
    ruleId?: number;
    originalRate: string;
    finalRate: string;
    adjustDescription?: string;
    effectiveTime: string;
    expireTime?: string;
    generateMethod: string;
    rateStatus: string;
    remark?: string;
    createTime?: string;
    updateTime?: string;
}

export interface ExchangeRateUsageSnapshot {
    id: number;
    rateType: string;
    usageScene: string;
    businessType: string;
    businessNo: string;
    baseCurrency: string;
    quoteCurrency: string;
    usedRate: string;
    businessRateId?: number;
    rawRateId?: number;
    ruleId?: number;
    calculationDescription?: string;
    appliedTime: string;
    createTime?: string;
}

export interface SourceQuery extends PageQuery {
    keyword?: string;
    sourceType?: string;
    sourceStatus?: number;
}

export interface RawRateQuery extends PageQuery {
    sourceCode?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    rateStatus?: string;
    createMethod?: string;
    publishStartTime?: string;
    publishEndTime?: string;
    fetchStartTime?: string;
    fetchEndTime?: string;
}

export interface RuleQuery extends PageQuery {
    rateType?: string;
    sourceCode?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    adjustDirection?: string;
    adjustMethod?: string;
    ruleStatus?: number;
}

export interface BusinessRateQuery extends PageQuery {
    rateType?: string;
    sourceCode?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    rateStatus?: string;
    generateMethod?: string;
}

export interface BusinessRateSaveRequest {
    rateType: string;
    sourceCode: string;
    baseCurrency: string;
    quoteCurrency: string;
    originalRate: string;
    finalRate: string;
    effectiveTime: string;
    rateStatus?: string;
    remark?: string;
}

export interface UsageSnapshotQuery extends PageQuery {
    rateType?: string;
    usageScene?: string;
    businessType?: string;
    businessNo?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    appliedStartTime?: string;
    appliedEndTime?: string;
}

export async function searchExchangeSources(data: SourceQuery) {
    const result = await http.post<CommonResult<PageResult<ExchangeRateSource>>>('/admin/exchange/sources/search', data);
    return unwrapResult(result.data);
}

export async function exportExchangeSources(data: SourceQuery) {
    await downloadExcel('/admin/exchange/sources/export', { method: 'post', data });
}

export async function getExchangeSource(id: number) {
    const result = await http.get<CommonResult<ExchangeRateSource>>(`/admin/exchange/sources/${id}`);
    return unwrapResult(result.data);
}

export async function createExchangeSource(data: Partial<ExchangeRateSource>) {
    const result = await http.post<CommonResult<ExchangeRateSource>>('/admin/exchange/sources', data);
    return unwrapResult(result.data);
}

export async function updateExchangeSource(id: number, data: Partial<ExchangeRateSource>) {
    const result = await http.put<CommonResult<ExchangeRateSource>>(`/admin/exchange/sources/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateExchangeSourceStatus(id: number, status: number) {
    const result = await http.put<CommonResult<ExchangeRateSource>>(`/admin/exchange/sources/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function deleteExchangeSource(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/exchange/sources/${id}`);
    return unwrapResult(result.data);
}

export async function searchExchangeRawRates(data: RawRateQuery) {
    const result = await http.post<CommonResult<PageResult<ExchangeRawRate>>>('/admin/exchange/raw-rates/search', data);
    return unwrapResult(result.data);
}

export async function exportExchangeRawRates(data: RawRateQuery) {
    await downloadExcel('/admin/exchange/raw-rates/export', { method: 'post', data });
}

export async function getExchangeRawRate(id: number) {
    const result = await http.get<CommonResult<ExchangeRawRate>>(`/admin/exchange/raw-rates/${id}`);
    return unwrapResult(result.data);
}

export async function createExchangeRawRate(data: Partial<ExchangeRawRate>) {
    const result = await http.post<CommonResult<ExchangeRawRate>>('/admin/exchange/raw-rates', data);
    return unwrapResult(result.data);
}

export async function voidExchangeRawRate(id: number, voidReason: string) {
    const result = await http.put<CommonResult<ExchangeRawRate>>(`/admin/exchange/raw-rates/${id}/void`, { voidReason });
    return unwrapResult(result.data);
}

export async function searchExchangeRules(data: RuleQuery) {
    const result = await http.post<CommonResult<PageResult<ExchangeRateRule>>>('/admin/exchange/rules/search', data);
    return unwrapResult(result.data);
}

export async function exportExchangeRules(data: RuleQuery) {
    await downloadExcel('/admin/exchange/rules/export', { method: 'post', data });
}

export async function getExchangeRule(id: number) {
    const result = await http.get<CommonResult<ExchangeRateRule>>(`/admin/exchange/rules/${id}`);
    return unwrapResult(result.data);
}

export async function createExchangeRule(data: Partial<ExchangeRateRule>) {
    const result = await http.post<CommonResult<ExchangeRateRule>>('/admin/exchange/rules', data);
    return unwrapResult(result.data);
}

export async function updateExchangeRule(id: number, data: Partial<ExchangeRateRule>) {
    const result = await http.put<CommonResult<ExchangeRateRule>>(`/admin/exchange/rules/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateExchangeRuleStatus(id: number, status: number) {
    const result = await http.put<CommonResult<ExchangeRateRule>>(`/admin/exchange/rules/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function searchExchangeBusinessRates(data: BusinessRateQuery) {
    const result = await http.post<CommonResult<PageResult<ExchangeBusinessRate>>>('/admin/exchange/business-rates/search', data);
    return unwrapResult(result.data);
}

export async function getExchangeBusinessRate(id: number) {
    const result = await http.get<CommonResult<ExchangeBusinessRate>>(`/admin/exchange/business-rates/${id}`);
    return unwrapResult(result.data);
}

export async function createExchangeBusinessRate(data: BusinessRateSaveRequest) {
    const result = await http.post<CommonResult<ExchangeBusinessRate>>('/admin/exchange/business-rates', data);
    return unwrapResult(result.data);
}

export async function batchCreateExchangeBusinessRates(items: BusinessRateSaveRequest[]) {
    const result = await http.post<CommonResult<ExchangeBusinessRate[]>>('/admin/exchange/business-rates/batch', { items });
    return unwrapResult(result.data);
}

export async function generateExchangeBusinessRate(data: { rawRateId: number; ruleId: number; remark?: string }) {
    const result = await http.post<CommonResult<ExchangeBusinessRate>>('/admin/exchange/business-rates/generate', data);
    return unwrapResult(result.data);
}

export async function exportExchangeBusinessRates(data: BusinessRateQuery) {
    await downloadExcel('/admin/exchange/business-rates/export', { method: 'post', data });
}

export async function updateExchangeBusinessRateStatus(id: number, status: number) {
    const result = await http.put<CommonResult<ExchangeBusinessRate>>(`/admin/exchange/business-rates/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function searchExchangeUsageSnapshots(data: UsageSnapshotQuery) {
    const result = await http.post<CommonResult<PageResult<ExchangeRateUsageSnapshot>>>('/admin/exchange/usage-snapshots/search', data);
    return unwrapResult(result.data);
}

export async function exportExchangeUsageSnapshots(data: UsageSnapshotQuery) {
    await downloadExcel('/admin/exchange/usage-snapshots/export', { method: 'post', data });
}

export async function getExchangeUsageSnapshot(id: number) {
    const result = await http.get<CommonResult<ExchangeRateUsageSnapshot>>(`/admin/exchange/usage-snapshots/${id}`);
    return unwrapResult(result.data);
}

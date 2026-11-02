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
    updateBy?: string;
    updateTime?: string;
}

export interface ExchangeRateUsageSnapshot {
    id: number;
    usageEventId?: string;
    producerService?: string;
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
    rateSource?: string;
    sourceQuoteDirection?: string;
    rateEffectiveTime?: string;
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
    effectiveStartTime?: string;
    effectiveEndTime?: string;
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
    effectiveStartTime?: string;
    effectiveEndTime?: string;
    createStartTime?: string;
    createEndTime?: string;
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

export type ExchangeRateVolatilityType = 'TRANSACTION_RATE' | 'SETTLEMENT_RATE';

export interface ExchangeCurrencyPair {
    baseCurrency: string;
    quoteCurrency: string;
}

export interface ExchangeRateVolatilityQuery {
    rateType: ExchangeRateVolatilityType;
    currencyPairs: ExchangeCurrencyPair[];
    startTime: string;
    endTime: string;
}

export interface ExchangeRateVolatilityOverview {
    rateType: ExchangeRateVolatilityType;
    baseCurrency: string;
    quoteCurrency: string;
    latestRate: string;
    minimumRate: string;
    maximumRate: string;
    volatilityRate: string;
    sampleCount: number;
    latestEffectiveTime: string;
    alertStatus?: string;
}

export interface ExchangeRateTrendPoint {
    businessRateId: number;
    rate: string;
    sourceCode: string;
    rawRateId?: number;
    ruleId?: number;
    effectiveTime: string;
    expireTime?: string;
}

export interface ExchangeRateTrendSeries {
    rateType: ExchangeRateVolatilityType;
    baseCurrency: string;
    quoteCurrency: string;
    points: ExchangeRateTrendPoint[];
}

export interface ExchangeRateAlertRule {
    id: number;
    ruleCode: string;
    ruleName: string;
    rateType: ExchangeRateVolatilityType;
    baseCurrency: string;
    quoteCurrency: string;
    windowMinutes: number;
    triggerThreshold: string;
    recoveryThreshold: string;
    recoveryConsecutiveCount: number;
    minimumSampleCount: number;
    alertLevel: string;
    systemMandatory: number;
    ruleStatus: number;
    remark?: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
}

export interface ExchangeRateAlertRuleQuery extends PageQuery {
    keyword?: string;
    rateType?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    ruleStatus?: number;
    systemMandatory?: number;
}

export interface ExchangeRateAlertRuleSaveRequest {
    ruleName: string;
    rateType: ExchangeRateVolatilityType;
    baseCurrency: string;
    quoteCurrency: string;
    windowMinutes: number;
    triggerThreshold: string;
    recoveryThreshold: string;
    recoveryConsecutiveCount: number;
    minimumSampleCount: number;
    alertLevel: string;
    remark?: string;
}

export interface ExchangeRateAlertRuleImportError {
    rowNumber: number;
    message: string;
}

export interface ExchangeRateAlertRuleImportResult {
    totalCount: number;
    successCount: number;
    failureCount: number;
    errors: ExchangeRateAlertRuleImportError[];
}

export interface ExchangeRateAlertEvent {
    id: number;
    eventNo: string;
    ruleId: number;
    ruleCode: string;
    ruleName: string;
    rateType: ExchangeRateVolatilityType;
    baseCurrency: string;
    quoteCurrency: string;
    alertLevel: string;
    windowMinutes: number;
    triggerThreshold: string;
    recoveryThreshold: string;
    windowStartTime: string;
    windowEndTime: string;
    sampleCount: number;
    minimumRate: string;
    minimumRateSource: string;
    minimumBusinessRateId?: number;
    maximumRate: string;
    maximumRateSource: string;
    maximumBusinessRateId?: number;
    latestRate: string;
    latestRateSource: string;
    latestBusinessRateId?: number;
    volatilityRate: string;
    maximumVolatilityRate: string;
    recoveryStreak: number;
    eventStatus: string;
    firstTriggerTime: string;
    lastDetectedTime?: string;
    resolvedTime?: string;
    acknowledgedBy?: string;
    acknowledgedTime?: string;
    acknowledgeRemark?: string;
    closedBy?: string;
    closedTime?: string;
    closeRemark?: string;
    version: number;
    createTime?: string;
    updateTime?: string;
}

export interface ExchangeRateAlertEventQuery extends PageQuery {
    eventNo?: string;
    rateType?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    eventStatus?: string;
    acknowledgedBy?: string;
    triggerStartTime?: string;
    triggerEndTime?: string;
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

export async function getExchangeRateVolatilityOverview(data: ExchangeRateVolatilityQuery) {
    const result = await http.post<CommonResult<ExchangeRateVolatilityOverview[]>>('/admin/exchange/volatility/overview', data);
    return unwrapResult(result.data);
}

export async function getExchangeRateVolatilityTrend(data: ExchangeRateVolatilityQuery) {
    const result = await http.post<CommonResult<ExchangeRateTrendSeries[]>>('/admin/exchange/volatility/trend', data);
    return unwrapResult(result.data);
}

export async function exportExchangeRateVolatility(data: ExchangeRateVolatilityQuery) {
    await downloadExcel('/admin/exchange/volatility/export', { method: 'post', data });
}

export async function searchExchangeRateAlertRules(data: ExchangeRateAlertRuleQuery) {
    const result = await http.post<CommonResult<PageResult<ExchangeRateAlertRule>>>('/admin/exchange/alert-rules/search', data);
    return unwrapResult(result.data);
}

export async function getExchangeRateAlertRule(id: number) {
    const result = await http.get<CommonResult<ExchangeRateAlertRule>>(`/admin/exchange/alert-rules/${id}`);
    return unwrapResult(result.data);
}

export async function createExchangeRateAlertRule(data: ExchangeRateAlertRuleSaveRequest) {
    const result = await http.post<CommonResult<ExchangeRateAlertRule>>('/admin/exchange/alert-rules', data);
    return unwrapResult(result.data);
}

export async function updateExchangeRateAlertRule(id: number, data: ExchangeRateAlertRuleSaveRequest) {
    const result = await http.put<CommonResult<ExchangeRateAlertRule>>(`/admin/exchange/alert-rules/${id}`, data);
    return unwrapResult(result.data);
}

export async function deleteExchangeRateAlertRule(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/exchange/alert-rules/${id}`);
    return unwrapResult(result.data);
}

export async function updateExchangeRateAlertRuleStatus(id: number, enabled: boolean) {
    const action = enabled ? 'enable' : 'disable';
    const result = await http.put<CommonResult<ExchangeRateAlertRule>>(`/admin/exchange/alert-rules/${id}/${action}`);
    return unwrapResult(result.data);
}

export async function importExchangeRateAlertRules(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const result = await http.post<CommonResult<ExchangeRateAlertRuleImportResult>>('/admin/exchange/alert-rules/import', formData);
    return unwrapResult(result.data);
}

export async function exportExchangeRateAlertRules(data: ExchangeRateAlertRuleQuery) {
    await downloadExcel('/admin/exchange/alert-rules/export', { method: 'post', data });
}

export async function searchExchangeRateAlertEvents(data: ExchangeRateAlertEventQuery) {
    const result = await http.post<CommonResult<PageResult<ExchangeRateAlertEvent>>>('/admin/exchange/alert-events/search', data);
    return unwrapResult(result.data);
}

export async function getExchangeRateAlertEvent(id: number) {
    const result = await http.get<CommonResult<ExchangeRateAlertEvent>>(`/admin/exchange/alert-events/${id}`);
    return unwrapResult(result.data);
}

export async function acknowledgeExchangeRateAlertEvent(id: number, version: number, remark: string) {
    const result = await http.put<CommonResult<ExchangeRateAlertEvent>>(`/admin/exchange/alert-events/${id}/acknowledge`, { version, remark });
    return unwrapResult(result.data);
}

export async function closeExchangeRateAlertEvent(id: number, version: number, remark: string) {
    const result = await http.put<CommonResult<ExchangeRateAlertEvent>>(`/admin/exchange/alert-events/${id}/close`, { version, remark });
    return unwrapResult(result.data);
}

export async function exportExchangeRateAlertEvents(data: ExchangeRateAlertEventQuery) {
    await downloadExcel('/admin/exchange/alert-events/export', { method: 'post', data });
}

import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

export interface RiskOption {
    label: string;
    value: string;
    extra?: string;
    numericCode?: string;
    flagEmoji?: string;
    continentCode?: string;
    continentName?: string;
}

export interface RiskOptions {
    statusOptions: RiskOption[];
    merchantScopeOptions: RiskOption[];
    riskLevelOptions: RiskOption[];
    decisionActionOptions: RiskOption[];
    cardBrandOptions: RiskOption[];
    countryOptions: RiskOption[];
    currencyOptions: RiskOption[];
    limitTypeOptions: RiskOption[];
    validityTypeOptions: RiskOption[];
    sourceTypeOptions: RiskOption[];
}

export interface RiskFunctionDefinition {
    moduleType: string;
    functionCode: string;
    functionName: string;
    routePath: string;
    permissionPrefix: string;
    regionFunction: boolean;
    ruleFunction: boolean;
}

export interface RiskDashboardFunction extends RiskFunctionDefinition {
    total: number;
    enabled: number;
    disabled: number;
    enabledRate: number;
    configured: boolean;
    latestUpdateTime?: string;
    latestOperationType?: string;
    latestOperator?: string;
    latestOperationTime?: string;
}

export interface RiskDashboardResponse {
    functions: RiskDashboardFunction[];
    changeLogs: Record<string, unknown>[];
}

export interface RiskRecord {
    id: number;
    merchantScope?: string;
    merchantId?: string;
    merchantName?: string;
    ruleGroupNo?: string;
    ruleName?: string;
    sourceUrl?: string;
    sourceUrls?: string[];
    sourceHost?: string;
    matchValuePlain?: string;
    matchValueMasked?: string;
    matchValueHash?: string;
    matchValueStart?: string;
    matchValueEnd?: string;
    ipVersion?: string;
    cardBrand?: string;
    cardBrands?: string[];
    ruleType?: string;
    channelCode?: string;
    paymentMethod?: string;
    amountMatchType?: string;
    riskCondition?: string;
    triggerAction?: string;
    priority?: number;
    countryAlpha2?: string;
    countryAlpha2List?: string[];
    countryAlpha3?: string;
    countryNumeric?: string;
    riskLevel?: string;
    decisionAction?: string;
    effectiveTime?: string;
    expireTime?: string;
    validityType?: string;
    validityDays?: number;
    sourceType?: string;
    status?: number;
    remark?: string;
    createBy?: string;
    updateBy?: string;
    createTime?: string;
    updateTime?: string;
    regionMatchLevel?: string;
    matchSource?: string;
    countryName?: string;
    stateProvinceCode?: string;
    stateProvinceName?: string;
    cityCode?: string;
    cityName?: string;
    regionPathCode?: string;
    regionPathName?: string;
    matchMode?: string;
    matchValue?: string;
    limitType?: string;
    amountMin?: number;
    amountMax?: number;
    currency?: string;
    timeWindowSeconds?: number;
    thresholdCount?: number;
    elementsJson?: string;
    timeWindowValue?: number;
    timeWindowUnit?: string;
    statDimension?: string;
    successCount?: number;
}

export interface RiskListQuery extends PageQuery {
    merchantId?: string;
    ruleName?: string;
    matchValue?: string;
    countryAlpha2?: string;
    status?: number;
}

export interface RiskRuleQuery extends PageQuery {
    merchantScope?: string;
    merchantId?: string;
    ruleName?: string;
    matchValue?: string;
    sourceUrl?: string;
    sourceHost?: string;
    limitType?: string;
    ruleType?: string;
    channelCode?: string;
    paymentMethod?: string;
    cardBrand?: string;
    currency?: string;
    triggerAction?: string;
    status?: number;
}

export type RiskListSaveRequest = Partial<RiskRecord>;
export type RiskRuleSaveRequest = Partial<RiskRecord>;

export interface RiskSourceUrlBatchSaveRequest {
    merchantId?: string;
    sourceUrls?: string[];
    riskLevel?: string;
    decisionAction?: string;
    effectiveTime?: string;
    expireTime?: string;
    status?: number;
    remark?: string;
}

export interface TradeBlackQuery extends PageQuery {
    merchantId?: string;
    merchantOrderNo?: string;
    paymentOrderNo?: string;
    blackTargetType?: string;
    status?: number;
}

export interface TradeBlackSaveRequest {
    merchantId?: string;
    merchantName?: string;
    merchantOrderNo?: string;
    paymentOrderNo?: string;
    blackTargetType: string;
    blackTargetValueMasked: string;
    blackTargetHash?: string;
    sourceType?: string;
    actionType?: string;
    actionReason?: string;
    status?: number;
}

export interface EvaluationQuery extends PageQuery {
    merchantId?: string;
    merchantOrderNo?: string;
    paymentOrderNo?: string;
    decisionResult?: string;
    riskLevel?: string;
    evaluationStartTime?: string;
    evaluationEndTimeExclusive?: string;
}

export async function getRiskFunctions() {
    const result = await http.get<CommonResult<RiskFunctionDefinition[]>>('/admin/risk/functions');
    return unwrapResult(result.data);
}

export async function getRiskOptions() {
    const result = await http.get<CommonResult<RiskOptions>>('/admin/risk/options');
    return unwrapResult(result.data);
}

export async function getRiskDashboard() {
    const result = await http.get<CommonResult<RiskDashboardResponse>>('/admin/risk/dashboard');
    return unwrapResult(result.data);
}

export async function getRiskTodayEvents() {
    const result = await http.get<CommonResult<Record<string, unknown>[]>>('/admin/risk/dashboard/today-events');
    return unwrapResult(result.data);
}

export async function getRiskMerchantRanking() {
    const result = await http.get<CommonResult<Record<string, unknown>[]>>('/admin/risk/dashboard/merchant-ranking');
    return unwrapResult(result.data);
}

export async function pageRiskChanges(data: PageQuery = {}) {
    const result = await http.post<CommonResult<PageResult<Record<string, unknown>>>>('/admin/risk/changes/page', data);
    return unwrapResult(result.data);
}

export async function pageRiskList(moduleType: string, functionCode: string, data: RiskListQuery = {}) {
    const result = await http.post<CommonResult<PageResult<RiskRecord>>>(`/admin/risk/list/${moduleType}/${functionCode}/page`, data);
    return unwrapResult(result.data);
}

export async function getRiskListDetail(moduleType: string, functionCode: string, id: number) {
    const result = await http.get<CommonResult<RiskRecord>>(`/admin/risk/list/${moduleType}/${functionCode}/${id}`);
    return unwrapResult(result.data);
}

export async function getRiskListEditDetail(moduleType: string, functionCode: string, id: number) {
    const result = await http.get<CommonResult<RiskRecord>>(`/admin/risk/list/${moduleType}/${functionCode}/${id}/edit`);
    return unwrapResult(result.data);
}

export async function createRiskList(moduleType: string, functionCode: string, data: RiskListSaveRequest) {
    const result = await http.post<CommonResult<RiskRecord>>(`/admin/risk/list/${moduleType}/${functionCode}`, data);
    return unwrapResult(result.data);
}

export async function updateRiskList(moduleType: string, functionCode: string, id: number, data: RiskListSaveRequest) {
    const result = await http.put<CommonResult<RiskRecord>>(`/admin/risk/list/${moduleType}/${functionCode}/${id}`, data);
    return unwrapResult(result.data);
}

export async function createRiskRegion(data: RiskListSaveRequest) {
    const result = await http.post<CommonResult<RiskRecord>>('/admin/risk/region', data);
    return unwrapResult(result.data);
}

export async function updateRiskRegion(id: number, data: RiskListSaveRequest) {
    const result = await http.put<CommonResult<RiskRecord>>(`/admin/risk/region/${id}`, data);
    return unwrapResult(result.data);
}

export async function removeRiskRecord(moduleType: string, functionCode: string, id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/risk/${moduleType}/${functionCode}/${id}`);
    return unwrapResult(result.data);
}

export async function batchRemoveRiskRecords(moduleType: string, functionCode: string, ids: number[]) {
    const result = await http.delete<CommonResult<void>>(`/admin/risk/${moduleType}/${functionCode}/batch`, { data: { ids } });
    return unwrapResult(result.data);
}

export async function updateRiskStatus(moduleType: string, functionCode: string, id: number, status: number) {
    const result = await http.put<CommonResult<RiskRecord>>(`/admin/risk/${moduleType}/${functionCode}/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function pageRiskRules(functionCode: string, data: RiskRuleQuery = {}) {
    const result = await http.post<CommonResult<PageResult<RiskRecord>>>(`/admin/risk/rule/${functionCode}/page`, data);
    return unwrapResult(result.data);
}

export async function createRiskRule(functionCode: string, data: RiskRuleSaveRequest) {
    const result = await http.post<CommonResult<RiskRecord>>(`/admin/risk/rule/${functionCode}`, data);
    return unwrapResult(result.data);
}

export async function createRiskSourceUrls(data: RiskSourceUrlBatchSaveRequest) {
    const result = await http.post<CommonResult<RiskRecord[]>>('/admin/risk/rule/sourceUrl/batch-create', data);
    return unwrapResult(result.data);
}

export async function updateRiskRule(functionCode: string, id: number, data: RiskRuleSaveRequest) {
    const result = await http.put<CommonResult<RiskRecord>>(`/admin/risk/rule/${functionCode}/${id}`, data);
    return unwrapResult(result.data);
}

export async function exportRiskConfig(moduleType: string, functionCode: string, data: RiskListQuery | RiskRuleQuery = {}) {
    await downloadExcel(`/admin/risk/${moduleType}/${functionCode}/export`, {
        method: 'post',
        data,
    });
}

export async function downloadRiskTemplate(moduleType: string, functionCode: string) {
    await downloadExcel(`/admin/risk/${moduleType}/${functionCode}/template`, {
        method: 'get',
        fileName: `${moduleType}-${functionCode}-template.xlsx`,
    });
}

export async function importRiskConfig(moduleType: string, functionCode: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const result = await http.post<CommonResult<{ successCount: number; failureCount: number; errors: string[] }>>(
        `/admin/risk/${moduleType}/${functionCode}/import`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrapResult(result.data);
}

export async function pageTradeBlack(data: TradeBlackQuery = {}) {
    const result = await http.post<CommonResult<PageResult<Record<string, unknown>>>>('/admin/risk/trade-black/page', data);
    return unwrapResult(result.data);
}

export async function createTradeBlack(data: TradeBlackSaveRequest) {
    const result = await http.post<CommonResult<void>>('/admin/risk/trade-black', data);
    return unwrapResult(result.data);
}

export async function releaseTradeBlack(id: number, reason?: string) {
    const result = await http.put<CommonResult<void>>(`/admin/risk/trade-black/${id}/release`, null, { params: { reason } });
    return unwrapResult(result.data);
}

export async function pageEvaluations(data: EvaluationQuery = {}) {
    const result = await http.post<CommonResult<PageResult<Record<string, unknown>>>>('/admin/risk/record/evaluations/page', data);
    return unwrapResult(result.data);
}

export async function getEvaluationHits(riskRecordNo: string) {
    const result = await http.get<CommonResult<Record<string, unknown>[]>>(`/admin/risk/record/evaluations/${riskRecordNo}/hits`);
    return unwrapResult(result.data);
}

export async function getEvaluationDetails(riskRecordNo: string) {
    const result = await http.get<CommonResult<Record<string, unknown>[]>>(`/admin/risk/record/evaluations/${riskRecordNo}/details`);
    return unwrapResult(result.data);
}

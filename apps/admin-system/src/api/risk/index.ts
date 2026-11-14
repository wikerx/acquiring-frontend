import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';
import type { ExportTaskSummary } from '@/api/operations/exportTask';

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
    approvalStatus?: number;
    approvalRemark?: string;
    submitSource?: string;
    reviewBy?: string;
    reviewTime?: string;
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
    approvalStatus?: number;
    submitSource?: string;
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

export interface MerchantAccessApprovalRequest {
    approvalStatus: 1 | 2;
    approvalRemark?: string;
    status?: number;
}

export interface TradeBlackQuery extends PageQuery {
    merchantId?: string;
    merchantOrderNo?: string;
    paymentOrderNo?: string;
    blackTargetType?: string;
    status?: number;
    operator?: string;
    operationStartTime?: string;
    operationEndTimeExclusive?: string;
}

export interface TradeBlackRecord {
    id: string;
    merchant_id?: string;
    merchant_name?: string;
    merchant_order_no?: string;
    payment_order_no?: string;
    black_target_type?: string;
    black_target_value_masked?: string;
    source_type?: string;
    action_type?: string;
    action_reason?: string;
    status: number;
    operator?: string;
    create_time?: string;
    update_time?: string;
}

export type TradeBlackInputMode = 'SINGLE' | 'PASTE' | 'FILE';
export type TradeBlackIdentifierType = 'MERCHANT_ORDER_NO' | 'SYSTEM_ORDER_NO';
export type TradeBlackScopeType = 'GLOBAL' | 'MERCHANT';
export type TradeBlackActionType = 'ADD' | 'RELEASE';

export interface TradeBlackOrderReference {
    rowNo?: number;
    identifierType: TradeBlackIdentifierType;
    lookupMerchantId?: string;
    orderNo: string;
}

export interface TradeBlackPreviewRequest {
    inputMode: TradeBlackInputMode;
    scopeType: TradeBlackScopeType;
    merchantIds?: string[];
    actionType: TradeBlackActionType;
    functionCodes: string[];
    actionReason?: string;
    orders: TradeBlackOrderReference[];
}

export interface TradeBlackCandidate {
    candidateKey: string;
    rowNo?: number;
    inputOrderNo?: string;
    transactionId?: string;
    sourceMerchantId?: string;
    merchantOrderNo?: string;
    functionCode: string;
    functionName: string;
    sourceField?: string;
    sourceLabel?: string;
    maskedValue?: string;
    targetScope: TradeBlackScopeType;
    targetMerchantId?: string;
    state: 'READY' | 'ALREADY_EXISTS' | 'ALREADY_MISSING' | 'NOT_AVAILABLE';
    stateMessage?: string;
    selectable: boolean;
    selected: boolean;
}

export interface TradeBlackOrderError {
    rowNo?: number;
    orderNo?: string;
    code?: string;
    message?: string;
}

export interface TradeBlackPreviewResponse {
    orderCount: number;
    resolvedOrderCount: number;
    candidateCount: number;
    selectableCount: number;
    unavailableCount: number;
    candidates: TradeBlackCandidate[];
    orderErrors: TradeBlackOrderError[];
}

export interface TradeBlackExecuteRequest {
    requestId: string;
    workflow: TradeBlackPreviewRequest;
    selectedCandidateKeys: string[];
}

export interface TradeBlackExecuteItem {
    candidateKey?: string;
    rowNo?: number;
    orderNo?: string;
    functionCode?: string;
    functionName?: string;
    sourceField?: string;
    targetScope?: string;
    targetMerchantId?: string;
    maskedValue?: string;
    resultCode?: string;
    message?: string;
}

export interface TradeBlackExecuteResponse {
    batchNo: string;
    status: 'PROCESSING' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
    totalCount: number;
    successCount: number;
    skippedCount: number;
    failureCount: number;
    failures: TradeBlackExecuteItem[];
}

export interface EvaluationQuery extends PageQuery {
    riskRecordNo?: string;
    merchantId?: string;
    merchantOrderNo?: string;
    paymentOrderNo?: string;
    decisionResult?: string;
    riskLevel?: string;
    evaluationStartTime?: string;
    evaluationEndTimeExclusive?: string;
}

export type EvaluationDetailQuery = PageQuery;

export interface EvaluationDetail {
    id: string;
    risk_record_no: string;
    module_type?: string;
    function_code?: string;
    function_name?: string;
    rule_id?: string;
    hit_element?: string;
    hit_value_masked?: string;
    risk_level?: string;
    decision_result?: string;
    reason_code?: string;
    decision_reason?: string;
    decision_time?: string;
    time_window_seconds?: number;
    threshold_count?: number;
    elements_json?: string;
    current_count?: string;
    stage_code?: string;
    stage_name?: string;
    stage_order?: number;
    match_result?: string;
    decision_effect?: string;
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

export async function pageRiskTodayEvents(data: EvaluationQuery = {}) {
    const result = await http.post<CommonResult<PageResult<Record<string, unknown>>>>('/admin/risk/dashboard/today-events/page', data);
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

export async function approveRiskSourceUrl(id: number, data: MerchantAccessApprovalRequest) {
    const result = await http.put<CommonResult<RiskRecord>>(`/admin/risk/rule/sourceUrl/${id}/approval`, data);
    return unwrapResult(result.data);
}

export async function updateRiskRule(functionCode: string, id: number, data: RiskRuleSaveRequest) {
    const result = await http.put<CommonResult<RiskRecord>>(`/admin/risk/rule/${functionCode}/${id}`, data);
    return unwrapResult(result.data);
}

export async function submitRiskConfigExportTask(data: {
    requestId: string;
    moduleType: string;
    functionCode: string;
    query: RiskListQuery | RiskRuleQuery;
}): Promise<ExportTaskSummary> {
    const result = await http.post<CommonResult<ExportTaskSummary>>('/admin/risk/export-tasks', data);
    return unwrapResult(result.data);
}

export async function submitTradeBlackExportTask(data: {
    requestId: string;
    query: TradeBlackQuery;
}): Promise<ExportTaskSummary> {
    const result = await http.post<CommonResult<ExportTaskSummary>>('/admin/risk/trade-black/export-tasks', data);
    return unwrapResult(result.data);
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
    const result = await http.post<CommonResult<PageResult<TradeBlackRecord>>>('/admin/risk/trade-black/page', data);
    return unwrapResult(result.data);
}

export async function previewTradeBlack(data: TradeBlackPreviewRequest) {
    const result = await http.post<CommonResult<TradeBlackPreviewResponse>>('/admin/risk/trade-black/preview', data);
    return unwrapResult(result.data);
}

export async function previewTradeBlackFile(metadata: Omit<TradeBlackPreviewRequest, 'orders'>, file: File) {
    const formData = new FormData();
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('file', file);
    const result = await http.post<CommonResult<TradeBlackPreviewResponse>>('/admin/risk/trade-black/preview-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapResult(result.data);
}

export async function executeTradeBlack(data: TradeBlackExecuteRequest) {
    const result = await http.post<CommonResult<TradeBlackExecuteResponse>>('/admin/risk/trade-black/execute', data);
    return unwrapResult(result.data);
}

export async function executeTradeBlackFile(
    requestId: string,
    metadata: Omit<TradeBlackPreviewRequest, 'orders'>,
    selectedCandidateKeys: string[],
    file: File,
) {
    const formData = new FormData();
    formData.append('requestId', requestId);
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('selectedCandidateKeys', JSON.stringify(selectedCandidateKeys));
    formData.append('file', file);
    const result = await http.post<CommonResult<TradeBlackExecuteResponse>>('/admin/risk/trade-black/execute-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapResult(result.data);
}

export async function downloadTradeBlackTemplate(fallbackFileName = 'transaction-blacklist-import-template.xlsx') {
    await downloadExcel('/admin/risk/trade-black/template', {
        method: 'get',
        fileName: fallbackFileName,
    });
}

export async function downloadTradeBlackFailureReport(batchNo: string, fallbackFileName = `${batchNo}-transaction-blacklist-failures.xlsx`) {
    await downloadExcel(`/admin/risk/trade-black/batches/${encodeURIComponent(batchNo)}/failures`, {
        method: 'get',
        fileName: fallbackFileName,
    });
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

export async function pageEvaluationDetails(riskRecordNo: string, data: EvaluationDetailQuery = {}) {
    const result = await http.post<CommonResult<PageResult<EvaluationDetail>>>(
        `/admin/risk/record/evaluations/${riskRecordNo}/details/page`,
        data,
    );
    return unwrapResult(result.data);
}

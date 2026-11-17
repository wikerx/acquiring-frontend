import { loadPrivateImageBlob } from '@/utils/download';
import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface ChannelInfo {
    id: number;
    channelCode: string;
    channelCnName: string;
    logoVersion?: string | null;
    channelEnName: string;
    channelStatus: number;
    supportAcquiring: number;
    supportPayout: number;
    support3ds: number;
    defaultRequestUrl?: string;
    defaultInteractionMode?: string;
    connectTimeoutSeconds?: number;
    readTimeoutSeconds?: number;
    sortOrder?: number;
    remark?: string;
    acquiringPaymentMethods?: string[];
    payoutPaymentMethods?: string[];
    metadataSchemas?: ChannelMetadataSchema[];
    createTime?: string;
    updateTime?: string;
}

export interface ChannelMetadataSchema {
    id?: number;
    fieldKey: string;
    fieldLabel: string;
    fieldType: string;
    requiredFlag: number;
    sensitiveFlag: number;
    validationRegex?: string;
    placeholder?: string;
    defaultValue?: string;
    sortOrder?: number;
    fieldStatus: number;
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
    paymentMethods?: string[];
    transactionType?: string;
    transactionTypes?: string[];
    currencyCodes: string[];
    defaultTransactionCurrency: string;
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

export interface ChannelMidConfig {
    id: number;
    channelId: number;
    channelCode: string;
    channelName: string;
    channelMid: string;
    midName: string;
    terminalId?: string;
    businessType: string;
    paymentMethodScope: string;
    cardBrandScope?: string;
    transactionTypeScope: string;
    currencyScope: string;
    allowedCountryScope: string;
    defaultTransactionCurrency: string;
    defaultSettlementCurrency: string;
    settlementCycle: string;
    settlementCutoffTime?: string;
    settlementTimeZone: string;
    mcc?: string;
    statementDescriptor?: string;
    metadataValueJson?: string;
    midStatus: number;
    effectiveTime?: string;
    expireTime?: string;
    remark?: string;
    createTime?: string;
    updateTime?: string;
}

export interface MerchantChannelMidBinding {
    id: number;
    merchantId: string;
    channelId: number;
    channelCode: string;
    channelName: string;
    midConfigId: number;
    channelMid: string;
    midName: string;
    businessType: string;
    bindingStatus: number;
    effectiveTime?: string;
    expireTime?: string;
    remark?: string;
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

export interface ChannelMidConfigQuery extends PageQuery {
    keyword?: string;
    channelId?: number;
    channelCode?: string;
    channelMid?: string;
    businessType?: string;
    paymentMethod?: string;
    cardBrand?: string;
    midStatus?: number;
}

export interface MerchantChannelMidBindingQuery extends PageQuery {
    merchantId?: string;
    channelId?: number;
    channelCode?: string;
    businessType?: string;
    midConfigId?: number;
    bindingStatus?: number;
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

export async function searchChannelMids(data: ChannelMidConfigQuery) {
    const result = await http.post<CommonResult<PageResult<ChannelMidConfig>>>('/admin/channel/mids/search', data);
    return unwrapResult(result.data);
}

export async function getChannelMid(id: number) {
    const result = await http.get<CommonResult<ChannelMidConfig>>(`/admin/channel/mids/${id}`);
    return unwrapResult(result.data);
}

export async function createChannelMid(data: Partial<ChannelMidConfig>) {
    const result = await http.post<CommonResult<ChannelMidConfig>>('/admin/channel/mids', data);
    return unwrapResult(result.data);
}

export async function updateChannelMid(id: number, data: Partial<ChannelMidConfig>) {
    const result = await http.put<CommonResult<ChannelMidConfig>>(`/admin/channel/mids/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateChannelMidStatus(id: number, status: number) {
    const result = await http.put<CommonResult<ChannelMidConfig>>(`/admin/channel/mids/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function deleteChannelMid(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/channel/mids/${id}`);
    return unwrapResult(result.data);
}

export async function searchMerchantChannelMidBindings(data: MerchantChannelMidBindingQuery) {
    const result = await http.post<CommonResult<PageResult<MerchantChannelMidBinding>>>('/admin/channel/mid-bindings/search', data);
    return unwrapResult(result.data);
}

export async function getMerchantChannelMidBinding(id: number) {
    const result = await http.get<CommonResult<MerchantChannelMidBinding>>(`/admin/channel/mid-bindings/${id}`);
    return unwrapResult(result.data);
}

export async function createMerchantChannelMidBinding(data: Partial<MerchantChannelMidBinding>) {
    const result = await http.post<CommonResult<MerchantChannelMidBinding>>('/admin/channel/mid-bindings', data);
    return unwrapResult(result.data);
}

export async function updateMerchantChannelMidBinding(id: number, data: Partial<MerchantChannelMidBinding>) {
    const result = await http.put<CommonResult<MerchantChannelMidBinding>>(`/admin/channel/mid-bindings/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateMerchantChannelMidBindingStatus(id: number, status: number) {
    const result = await http.put<CommonResult<MerchantChannelMidBinding>>(`/admin/channel/mid-bindings/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function deleteMerchantChannelMidBinding(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/channel/mid-bindings/${id}`);
    return unwrapResult(result.data);
}

export type PaymentRouteRuleType = 'FIXED' | 'PRIORITY' | 'WEIGHT' | 'HISTORY_AFFINITY';
export type PaymentRouteScopeType = 'GLOBAL' | 'MERCHANT';
export type PaymentRouteUnavailablePolicy = 'FALLBACK' | 'REJECT';
export type PaymentRouteRuleStatus = 'DRAFT' | 'ENABLED' | 'DISABLED';

export interface PaymentRouteStrategy {
    id?: number;
    strategyType: PaymentRouteRuleType;
    historyLookbackMonths?: number;
    strategyStatus: number;
}

export interface PaymentRouteCandidate {
    id?: number;
    paymentMethod: string;
    cardBrand: string;
    channelId: number;
    channelCode?: string;
    channelName?: string;
    midConfigId: number;
    channelMid?: string;
    midName?: string;
    paymentMethodScope?: string;
    currencyScope?: string;
    defaultTransactionCurrency?: string;
    midStatus?: number;
    candidatePriority: number;
    /** 十进制字符串，避免权重在浏览器中出现浮点误差。 */
    candidateWeight?: string;
    candidateStatus: number;
}

export interface PaymentRoutePaymentScope {
    paymentMethod: string;
    cardBrand: string;
}

export interface PaymentRouteRule {
    id: number;
    ruleCode: string;
    ruleName: string;
    ruleType: PaymentRouteRuleType;
    scopeType: PaymentRouteScopeType;
    merchantId?: string;
    merchantIds: string[];
    businessType: 'ACQUIRING';
    paymentMethods: string[];
    paymentScopes: PaymentRoutePaymentScope[];
    transactionTypes: string[];
    rulePriority: number;
    unavailablePolicy: PaymentRouteUnavailablePolicy;
    ruleStatus: PaymentRouteRuleStatus;
    version: number;
    remark?: string;
    strategy: PaymentRouteStrategy;
    candidates: PaymentRouteCandidate[];
    publishedBy?: string;
    publishedTime?: string;
    disabledBy?: string;
    disabledTime?: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
}

export interface PaymentRouteRuleQuery extends PageQuery {
    keyword?: string;
    ruleType?: PaymentRouteRuleType | '';
    scopeType?: PaymentRouteScopeType | '';
    merchantId?: string;
    paymentMethods?: string[];
    paymentScopes?: PaymentRoutePaymentScope[];
    transactionTypes?: string[];
    ruleStatus?: PaymentRouteRuleStatus | '';
    unavailablePolicy?: PaymentRouteUnavailablePolicy | '';
}

export interface PaymentRouteRuleSaveRequest {
    ruleName: string;
    ruleType: PaymentRouteRuleType;
    scopeType: PaymentRouteScopeType;
    merchantId?: string;
    merchantIds: string[];
    businessType: 'ACQUIRING';
    paymentMethods?: string[];
    paymentScopes: PaymentRoutePaymentScope[];
    transactionTypes: string[];
    rulePriority: number;
    unavailablePolicy: PaymentRouteUnavailablePolicy;
    strategy: PaymentRouteStrategy;
    candidates: PaymentRouteCandidate[];
    version?: number;
    remark?: string;
    operationReason: string;
}

export interface PaymentRouteActionRequest {
    version: number;
    operationReason: string;
}

export interface MerchantRouteRuleBrief {
    id: number;
    ruleCode: string;
    ruleName: string;
    ruleType: PaymentRouteRuleType;
    rulePriority: number;
    ruleStatus: PaymentRouteRuleStatus;
}

export interface MerchantRouteConflict {
    merchantId: string;
    rules: MerchantRouteRuleBrief[];
}

export interface PaymentRouteCopyRequest extends PaymentRouteActionRequest {
    ruleName: string;
}

export interface PaymentRouteValidationIssue {
    level: 'ERROR' | 'WARNING';
    code: string;
    field: string;
    message: string;
}

export interface PaymentRouteValidationResult {
    ruleId: number;
    version: number;
    valid: boolean;
    issues: PaymentRouteValidationIssue[];
}

export interface PaymentRouteChangeLog {
    id: number;
    ruleId: number;
    ruleCode: string;
    actionType: string;
    beforeVersion?: number;
    afterVersion?: number;
    beforeSnapshotJson?: string;
    afterSnapshotJson?: string;
    operatorAccountId?: number;
    operatorName: string;
    operationReason: string;
    createTime: string;
}

export async function searchPaymentRouteRules(data: PaymentRouteRuleQuery) {
    const result = await http.post<CommonResult<PageResult<PaymentRouteRule>>>('/admin/channel/routes/search', data);
    return unwrapResult(result.data);
}

export async function getPaymentRouteRule(id: number) {
    const result = await http.get<CommonResult<PaymentRouteRule>>(`/admin/channel/routes/${id}`);
    return unwrapResult(result.data);
}

export async function getPaymentRouteMerchantConflicts(data: { merchantIds: string[]; excludeRuleId?: number }) {
    const result = await http.post<CommonResult<MerchantRouteConflict[]>>('/admin/channel/routes/merchant-conflicts', data);
    return unwrapResult(result.data);
}

export async function createPaymentRouteRule(data: PaymentRouteRuleSaveRequest) {
    const result = await http.post<CommonResult<PaymentRouteRule>>('/admin/channel/routes', data);
    return unwrapResult(result.data);
}

export async function updatePaymentRouteRule(id: number, data: PaymentRouteRuleSaveRequest) {
    const result = await http.put<CommonResult<PaymentRouteRule>>(`/admin/channel/routes/${id}`, data);
    return unwrapResult(result.data);
}

export async function copyPaymentRouteRule(id: number, data: PaymentRouteCopyRequest) {
    const result = await http.post<CommonResult<PaymentRouteRule>>(`/admin/channel/routes/${id}/copy`, data);
    return unwrapResult(result.data);
}

export async function publishPaymentRouteRule(id: number, data: PaymentRouteActionRequest) {
    const result = await http.post<CommonResult<PaymentRouteRule>>(`/admin/channel/routes/${id}/publish`, data);
    return unwrapResult(result.data);
}

export async function disablePaymentRouteRule(id: number, data: PaymentRouteActionRequest) {
    const result = await http.post<CommonResult<PaymentRouteRule>>(`/admin/channel/routes/${id}/disable`, data);
    return unwrapResult(result.data);
}

export async function deletePaymentRouteRule(id: number, data: PaymentRouteActionRequest) {
    const result = await http.delete<CommonResult<void>>(`/admin/channel/routes/${id}`, { data });
    return unwrapResult(result.data);
}

export async function validatePaymentRouteRule(id: number) {
    const result = await http.get<CommonResult<PaymentRouteValidationResult>>(`/admin/channel/routes/${id}/validation`);
    return unwrapResult(result.data);
}

export async function searchPaymentRouteChangeLogs(id: number, data: PageQuery & { actionType?: string }) {
    const result = await http.post<CommonResult<PageResult<PaymentRouteChangeLog>>>(`/admin/channel/routes/${id}/change-logs/search`, data);
    return unwrapResult(result.data);
}


export async function loadChannelLogo(id: number): Promise<Blob> {
    return loadPrivateImageBlob(`/admin/channel/info/${id}/logo`);
}
export async function saveChannelWithLogo(id: number | null, metadata: Partial<ChannelInfo>, file: File | null, removeLogo = false): Promise<ChannelInfo> {
    const data = new FormData();
    data.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    if (file) data.append('file', file);
    data.append('removeLogo', String(removeLogo));
    const response = id === null
        ? await http.post<CommonResult<ChannelInfo>>('/admin/channel/info/with-logo', data)
        : await http.put<CommonResult<ChannelInfo>>(`/admin/channel/info/${id}/with-logo`, data);
    return unwrapResult(response.data);
}

import type {
    CommonResult,
    PageQuery,
    PageResult,
    TransactionAnalyticsChannelPerformance,
    TransactionAnalyticsFailureAnalysis,
    TransactionAnalyticsMerchantPerformance,
    TransactionAnalyticsOverview,
    TransactionAnalyticsQuery,
    TransactionAnalyticsThreeDs,
} from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

export interface TransactionPageQuery extends PageQuery {
    merchantId?: string;
    merchantOrderNo?: string;
    transactionId?: string;
    transactionType?: string;
    transactionStatus?: string;
    channelCode?: string;
    paymentMethod?: string;
    paymentBrand?: string;
    cardBin?: string;
    channelOrderNo?: string;
    merchantResponseCode?: string;
    channelResponseCode?: string;
    authCode?: string;
    acquirerReferenceNo?: string;
    channelMatchStatus?: string;
    reconciliationStatus?: string;
    settlementStatus?: string;
    beginTime?: string;
    endTime?: string;
    queryTimeZone?: string;
}

export interface ChannelLogQuery extends PageQuery {
    channelCode?: string;
    transactionId?: string;
    channelOrderNo?: string;
    requestStatus?: string;
    interactionType?: string;
    beginTime?: string;
    endTime?: string;
    queryTimeZone?: string;
}

export interface ChannelCallbackQuery extends PageQuery {
    channelCode?: string;
    transactionId?: string;
    channelOrderNo?: string;
    channelTransactionId?: string;
    callbackStatus?: string;
    beginTime?: string;
    endTime?: string;
    queryTimeZone?: string;
}

export interface MerchantNotificationQuery extends PageQuery {
    merchantId?: string;
    transactionId?: string;
    notifyStatus?: string;
    beginTime?: string;
    endTime?: string;
    queryTimeZone?: string;
}

export interface MerchantNotificationRetryRequest {
    transactionId: string;
    transactionDateTime: string;
    requestId?: string;
}

export interface MerchantNotificationDetail {
    notification: TransactionRecord;
    deliveryLogs: TransactionRecord[];
}

export interface TransactionOrder {
    operationId: string;
    rootTransactionId: string;
    latestTransactionId: string;
    merchantId: string;
    merchantOrderNo: string;
    merchantOrderId: string;
    paymentMethod?: string;
    paymentBrand?: string;
    transactionType: string;
    transactionStatus: string;
    lifecycleStatus?: string;
    lifecycleStatusMessage?: string;
    processStage?: string;
    labelCurrency?: string;
    labelAmount?: number | string;
    transactionCurrency?: string;
    transactionAmount?: number | string;
    currentCurrency?: string;
    currentAmount?: number | string;
    currencyExponent?: number;
    transactionRate?: number | string;
    threeDsEnabled?: number;
    dccEnabled?: number;
    edcEnabled?: number;
    merchantResponseCode?: string;
    merchantResponseMessage?: string;
    merchantNotificationStatus?: string;
    authorizedAmount?: number | string;
    capturedAmount?: number | string;
    refundedAmount?: number | string;
    availableCaptureAmount?: number | string;
    availableRefundAmount?: number | string;
    settlementStatus?: string;
    reconciliationStatus?: string;
    accountingStatus?: string;
    channelMatchStatus?: string;
    channelCode?: string;
    channelName?: string;
    channelOrderNo?: string;
    transactionDateTime: string;
    rootTransactionDateTime: string;
    transactionTimeZone?: string;
}

export interface TransactionOperation {
    operationId: string;
    transactionId: string;
    sourceTransactionId?: string;
    merchantId: string;
    merchantOrderNo: string;
    merchantOrderId: string;
    operationSequence?: number;
    transactionType: string;
    transactionStatus: string;
    processStage?: string;
    labelCurrency?: string;
    labelAmount?: number | string;
    transactionCurrency?: string;
    transactionAmount?: number | string;
    currencyExponent?: number;
    transactionRate?: number | string;
    threeDsEnabled?: number;
    dccEnabled?: number;
    edcEnabled?: number;
    merchantResponseCode?: string;
    merchantResponseMessage?: string;
    authorizedAmount?: number | string;
    capturedAmount?: number | string;
    refundedAmount?: number | string;
    availableCaptureAmount?: number | string;
    availableRefundAmount?: number | string;
    paymentMethod?: string;
    paymentBrand?: string;
    cardBin?: string;
    cardNumberMasked?: string;
    accessType?: string;
    channelCode?: string;
    channelName?: string;
    channelOrderNo?: string;
    channelTransactionId?: string;
    channelResponseCode?: string;
    channelResponseMessage?: string;
    authCode?: string;
    acquirerReferenceNo?: string;
    settlementStatus?: string;
    reconciliationStatus?: string;
    accountingStatus?: string;
    channelMatchStatus?: string;
    transactionDateTime: string;
    rootTransactionDateTime: string;
    operationTime?: string;
}

export interface TransactionAmountSummary {
    currency?: string;
    amount?: number | string;
    currencyExponent?: number;
}

export interface TransactionPaymentMethodSummary {
    paymentMethod?: string;
    paymentBrand?: string;
    count: number;
    amountSummaries: TransactionAmountSummary[];
}

export interface TransactionOperationSummary {
    totalCount: number;
    successCount: number;
    failedCount: number;
    amountSummaries: TransactionAmountSummary[];
    successAmountSummaries: TransactionAmountSummary[];
    failedAmountSummaries: TransactionAmountSummary[];
    paymentMethodSummaries: TransactionPaymentMethodSummary[];
}

export interface TransactionOperationSearchResult {
    page: PageResult<TransactionOperation>;
    summary: TransactionOperationSummary;
}

export interface TransactionContactInfo {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    country?: string;
    state?: string;
    city?: string;
    street?: string;
    postal?: string;
}

export interface TransactionPayerInfo extends TransactionContactInfo {
    payerId?: string;
    ipAddress?: string;
    sessionId?: string;
    browserInfo?: Record<string, unknown>;
    userAgent?: string;
}

export interface TransactionDetail {
    order?: TransactionOrder;
    billingCardHolderInfo?: TransactionContactInfo;
    payerInfo?: TransactionPayerInfo;
    shippingInfo?: TransactionContactInfo;
    operations: TransactionOperation[];
    statusHistory: Record<string, unknown>[];
    flowEvents: Record<string, unknown>[];
    riskEvents: Record<string, unknown>[];
    amountChanges: Record<string, unknown>[];
    channelRequests: Record<string, unknown>[];
    channelInteractionLogs: Record<string, unknown>[];
    channelCallbacks: Record<string, unknown>[];
    channelCallbackLogs: Record<string, unknown>[];
    merchantNotifications: Record<string, unknown>[];
    merchantNotificationLogs: Record<string, unknown>[];
    merchantApiInteractionLogs?: Record<string, unknown>[];
}

export type TransactionRecord = Record<string, unknown>;

export interface TransactionActionRequest {
    merchantOrderId?: string;
    amount?: number | string;
    currency?: string;
    reason?: string;
    transactionDateTime: string;
    rootTransactionDateTime: string;
}

export interface TransactionActionResponse {
    transactionId: string;
    sourceTransactionId?: string;
    merchantOrderNo?: string;
    merchantOrderId?: string;
    transactionType?: string;
    status?: string;
    processStage?: string;
    failReasonCode?: string;
    pendingReasonCode?: string;
    amount?: number | string;
    currency?: string;
}

export interface ChannelMatchRequeryRequest {
    transactionDateTime: string;
}

export interface ChannelMatchRequeryResponse {
    scannedCount: number;
    matchedCount: number;
    pendingCount: number;
    failedCount: number;
}

export interface RefundManagementQuery extends PageQuery {
    merchantId?: string;
    refundTransactionId?: string;
    sourceTransactionId?: string;
    merchantOrderNo?: string;
    merchantOperationNo?: string;
    transactionType?: string;
    refundScope?: string;
    approvalStatus?: string;
    transactionStatus?: string;
    requestSource?: string;
    channelCode?: string;
    channelOrderNo?: string;
    acquirerReferenceNo?: string;
    paymentMethod?: string;
    paymentBrand?: string;
    labelCurrency?: string;
    transactionCurrency?: string;
    minimumTransactionAmount?: number | string;
    maximumTransactionAmount?: number | string;
    applicantId?: string;
    beginTime?: string;
    endTime?: string;
    completeBeginTime?: string;
    completeEndTime?: string;
    queryTimeZone?: string;
}

export interface RefundManagementRecord {
    refundTransactionId: string;
    operationId?: string;
    sourceTransactionId?: string;
    merchantId?: string;
    merchantOrderNo?: string;
    merchantOperationNo?: string;
    transactionType?: string;
    refundScope?: string;
    requestSource?: string;
    requestReason?: string;
    applicantType?: string;
    applicantId?: string;
    applicantName?: string;
    executionMode?: string;
    transactionStatus?: string;
    processStage?: string;
    failReasonCode?: string;
    failReasonMessage?: string;
    labelCurrency?: string;
    labelAmount?: number | string;
    transactionCurrency?: string;
    transactionAmount?: number | string;
    currencyExponent?: number;
    paymentMethod?: string;
    paymentBrand?: string;
    channelCode?: string;
    channelOrderNo?: string;
    channelTransactionId?: string;
    channelResponseCode?: string;
    acquirerReferenceNo?: string;
    channelMatchStatus?: string;
    merchantNotificationStatus?: string;
    transactionDateTime: string;
    rootTransactionDateTime?: string;
    completeTime?: string;
    approvalId?: string;
    approvalStatus?: string;
    approvalPolicyCode?: string;
    approvalOperatorId?: string;
    approvalOperatorName?: string;
    approvalTime?: string;
    approvalReason?: string;
    approvalExpireTime?: string;
    executionEventId?: string;
    approvalVersion?: number;
}

export interface RefundCurrencySummary {
    currency?: string;
    totalAmount?: number | string;
    pendingApprovalAmount?: number | string;
    successfulAmount?: number | string;
    pendingAmount?: number | string;
}

export interface RefundManagementSummary {
    totalCount: number;
    pendingApprovalCount: number;
    processingCount: number;
    successCount: number;
    failedOrRejectedCount: number;
    currencyAmounts?: RefundCurrencySummary[];
}

export interface RefundManagementSearchResponse {
    page: PageResult<RefundManagementRecord>;
    summary: RefundManagementSummary;
}

export interface RefundManagementDetail {
    refund: RefundManagementRecord;
    transactionDetail?: TransactionDetail;
}

export interface RefundApprovalDecisionRequest {
    decisionRequestId: string;
    expectedVersion: number;
    approvalReason?: string;
}

export interface RefundApprovalResult {
    approvalId: string;
    refundTransactionId: string;
    approvalStatus: string;
    approvalOperatorId?: string;
    approvalOperatorName?: string;
    approvalTime?: string;
    approvalReason?: string;
    executionEventId?: string;
    version: number;
}

export interface ChannelMatchAbnormalQuery extends PageQuery {
    eventId?: string;
    transactionId?: string;
    merchantId?: string;
    merchantOrderNo?: string;
    abnormalType?: string;
    abnormalLevel?: string;
    eventStatus?: string;
    transactionType?: string;
    platformStatus?: string;
    channelCode?: string;
    channelOrderNo?: string;
    assignedToId?: string;
    detectSource?: string;
    minimumOccurrenceCount?: number;
    beginTime?: string;
    endTime?: string;
    queryTimeZone?: string;
}

export interface ChannelMatchAbnormalRecord {
    abnormalEventId: string;
    transactionId: string;
    operationId?: string;
    abnormalType?: string;
    abnormalLevel?: string;
    eventStatus?: string;
    sourceRecordType?: string;
    sourceRecordId?: string;
    abnormalDescription?: string;
    rawReferenceJson?: string;
    firstSeenTime?: string;
    lastSeenTime?: string;
    resolvedTime?: string;
    transactionDateTime: string;
    sourceTransactionDateTime?: string;
    rootTransactionDateTime?: string;
    merchantId?: string;
    merchantOrderNo?: string;
    sourceTransactionId?: string;
    transactionType?: string;
    platformStatus?: string;
    channelCode?: string;
    channelOrderNo?: string;
    channelTransactionId?: string;
    channelStatus?: string;
    channelMatchResult?: string;
    detectSource?: string;
    platformCurrency?: string;
    platformAmount?: number | string;
    channelCurrency?: string;
    channelAmount?: number | string;
    amountDifference?: number | string;
    currencyExponent?: number;
    occurrenceCount?: number;
    assignedToId?: string;
    assignedToName?: string;
    assignedTime?: string;
    resolutionType?: string;
    resolutionReferenceId?: string;
    merchantNotifyRequired?: number;
    version: number;
    createTime?: string;
    updateTime?: string;
}

export interface ChannelMatchAbnormalSummary {
    totalCount: number;
    openCount: number;
    processingCount: number;
    resolvedCount: number;
    ignoredCount: number;
    highOrCriticalCount: number;
}

export interface ChannelMatchAbnormalSearchResponse {
    page: PageResult<ChannelMatchAbnormalRecord>;
    summary: ChannelMatchAbnormalSummary;
}

export interface ChannelMatchAbnormalDetail {
    abnormality: ChannelMatchAbnormalRecord;
    transactionDetail?: TransactionDetail;
}

export interface ChannelMatchAbnormalCaseReference {
    eventId: string;
    transactionDateTime: string;
    expectedVersion: number;
}

export interface ChannelMatchAbnormalBatchResult {
    requestedCount: number;
    acceptedCount: number;
    failedCount: number;
    failedEventIds: string[];
}

/**
 * 保留后端返回的真实交易时间，只补齐 DATETIME(3) 契约需要的毫秒位。
 * 该转换不解析交易号，也不做时区换算，避免改变季度分片路由值。
 */
function normalizeTransactionShardTime(value: string) {
    const normalized = value.trim().replace('T', ' ');
    const match = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?$/.exec(normalized);
    if (!match) {
        return value;
    }
    return `${match[1]}.${(match[2] || '').padEnd(3, '0').slice(0, 3)}`;
}

/** Spring MVC 的 ISO LocalDateTime 请求参数必须使用 T 分隔日期和时间。 */
function normalizeTransactionDateTimeParam(value: string) {
    return normalizeTransactionShardTime(value).replace(' ', 'T');
}

function normalizeTransactionActionShardTimes(data: TransactionActionRequest): TransactionActionRequest {
    return {
        ...data,
        transactionDateTime: normalizeTransactionShardTime(data.transactionDateTime),
        rootTransactionDateTime: normalizeTransactionShardTime(data.rootTransactionDateTime),
    };
}

export async function searchTransactionOrders(data: TransactionPageQuery) {
    const result = await http.post<CommonResult<PageResult<TransactionOrder>>>('/admin/transactions/orders/search', data);
    return unwrapResult(result.data);
}

export async function exportTransactionOrders(data: TransactionPageQuery) {
    await downloadExcel('/admin/transactions/orders/export', { data });
}

export async function searchTransactionOperations(data: TransactionPageQuery) {
    const result = await http.post<CommonResult<PageResult<TransactionOperation>>>('/admin/transactions/operations/search', data);
    return unwrapResult(result.data);
}

export async function exportTransactionOperations(data: TransactionPageQuery) {
    await downloadExcel('/admin/transactions/operations/export', { data });
}

export async function searchTransactionOperationsWithSummary(data: TransactionPageQuery) {
    const result = await http.post<CommonResult<TransactionOperationSearchResult>>('/admin/transactions/operations/search-with-summary', data);
    return unwrapResult(result.data);
}

/** 查询管理端首笔收单交易总览。 */
export async function getTransactionAnalyticsOverview(data: TransactionAnalyticsQuery) {
    const result = await http.post<CommonResult<TransactionAnalyticsOverview>>(
        '/admin/transactions/analytics/overview', data,
    );
    return unwrapResult(result.data);
}

/** 查询管理端商户交易表现。 */
export async function getTransactionAnalyticsMerchants(data: TransactionAnalyticsQuery) {
    const result = await http.post<CommonResult<TransactionAnalyticsMerchantPerformance>>(
        '/admin/transactions/analytics/merchants', data,
    );
    return unwrapResult(result.data);
}

/** 查询管理端失败原因、趋势和渠道分布。 */
export async function getTransactionAnalyticsFailures(data: TransactionAnalyticsQuery) {
    const result = await http.post<CommonResult<TransactionAnalyticsFailureAnalysis>>(
        '/admin/transactions/analytics/failures', data,
    );
    return unwrapResult(result.data);
}

/** 查询管理端渠道请求及最终交易表现。 */
export async function getTransactionAnalyticsChannels(data: TransactionAnalyticsQuery) {
    const result = await http.post<CommonResult<TransactionAnalyticsChannelPerformance>>(
        '/admin/transactions/analytics/channels', data,
    );
    return unwrapResult(result.data);
}

/** 查询管理端按交易去重的3DS认证表现。 */
export async function getTransactionAnalyticsThreeDs(data: TransactionAnalyticsQuery) {
    const result = await http.post<CommonResult<TransactionAnalyticsThreeDs>>(
        '/admin/transactions/analytics/three-ds', data,
    );
    return unwrapResult(result.data);
}

export async function getTransactionOrderDetail(
    transactionId: string,
    transactionDateTime: string,
    rootTransactionDateTime: string,
) {
    const result = await http.get<CommonResult<TransactionDetail>>(`/admin/transactions/orders/${transactionId}`, {
        params: {
            transactionDateTime: normalizeTransactionShardTime(transactionDateTime),
            rootTransactionDateTime: normalizeTransactionShardTime(rootTransactionDateTime),
        },
    });
    return unwrapResult(result.data);
}

export async function getTransactionOperationDetail(
    transactionId: string,
    transactionDateTime: string,
    rootTransactionDateTime: string,
) {
    const result = await http.get<CommonResult<TransactionDetail>>(`/admin/transactions/operations/${transactionId}`, {
        params: {
            transactionDateTime: normalizeTransactionShardTime(transactionDateTime),
            rootTransactionDateTime: normalizeTransactionShardTime(rootTransactionDateTime),
        },
    });
    return unwrapResult(result.data);
}

export async function refundTransactionOperation(transactionId: string, data: TransactionActionRequest) {
    const result = await http.post<CommonResult<TransactionActionResponse>>(
        `/admin/transactions/operations/${transactionId}/refund`,
        normalizeTransactionActionShardTimes(data),
    );
    return unwrapResult(result.data);
}

export async function captureTransactionOperation(transactionId: string, data: TransactionActionRequest) {
    const result = await http.post<CommonResult<TransactionActionResponse>>(
        `/admin/transactions/operations/${transactionId}/capture`,
        normalizeTransactionActionShardTimes(data),
    );
    return unwrapResult(result.data);
}

export async function voidTransactionOperation(transactionId: string, data: TransactionActionRequest) {
    const result = await http.post<CommonResult<TransactionActionResponse>>(
        `/admin/transactions/operations/${transactionId}/void`,
        normalizeTransactionActionShardTimes(data),
    );
    return unwrapResult(result.data);
}

export async function requeryTransactionChannelMatch(
    transactionId: string,
    data: ChannelMatchRequeryRequest,
) {
    const result = await http.post<CommonResult<ChannelMatchRequeryResponse>>(
        `/admin/transactions/operations/${transactionId}/channel-match/requery`,
        { transactionDateTime: normalizeTransactionShardTime(data.transactionDateTime) },
    );
    return unwrapResult(result.data);
}

export async function searchTransactionChannelLogs(data: ChannelLogQuery) {
    const result = await http.post<CommonResult<PageResult<TransactionRecord>>>('/admin/transactions/channel-logs/search', data);
    return unwrapResult(result.data);
}

export async function searchTransactionChannelCallbacks(data: ChannelCallbackQuery) {
    const result = await http.post<CommonResult<PageResult<TransactionRecord>>>('/admin/transactions/channel-callbacks/search', data);
    return unwrapResult(result.data);
}

export async function searchMerchantNotifications(data: MerchantNotificationQuery) {
    const result = await http.post<CommonResult<PageResult<TransactionRecord>>>('/admin/transactions/merchant-notifications/search', data);
    return unwrapResult(result.data);
}

export async function getMerchantNotificationDetail(notifyId: string, transactionDateTime: string) {
    const result = await http.get<CommonResult<MerchantNotificationDetail>>(
        `/admin/transactions/merchant-notifications/${notifyId}`,
        { params: { transactionDateTime: normalizeTransactionShardTime(transactionDateTime) } },
    );
    return unwrapResult(result.data);
}

export async function exportMerchantNotifications(data: MerchantNotificationQuery) {
    await downloadExcel('/admin/transactions/merchant-notifications/export', { data });
}

export async function retryMerchantNotification(data: MerchantNotificationRetryRequest) {
    const result = await http.post<CommonResult<string>>('/admin/transactions/merchant-notifications/retry', {
        ...data,
        transactionDateTime: normalizeTransactionShardTime(data.transactionDateTime),
    });
    return unwrapResult(result.data);
}

export async function searchRefundManagement(data: RefundManagementQuery) {
    const result = await http.post<CommonResult<RefundManagementSearchResponse>>('/admin/transactions/refunds/search', data);
    return unwrapResult(result.data);
}

export async function getRefundManagementDetail(transactionId: string, transactionDateTime: string) {
    const result = await http.get<CommonResult<RefundManagementDetail>>(
        `/admin/transactions/refunds/${encodeURIComponent(transactionId)}`,
        { params: { transactionDateTime: normalizeTransactionDateTimeParam(transactionDateTime) } },
    );
    return unwrapResult(result.data);
}

export async function exportRefundManagement(data: RefundManagementQuery) {
    await downloadExcel('/admin/transactions/refunds/export', { data });
}

export async function approveRefund(approvalId: string, data: RefundApprovalDecisionRequest) {
    const result = await http.post<CommonResult<RefundApprovalResult>>(
        `/admin/transactions/refund-approvals/${encodeURIComponent(approvalId)}/approve`,
        data,
    );
    return unwrapResult(result.data);
}

export async function rejectRefund(approvalId: string, data: RefundApprovalDecisionRequest) {
    const result = await http.post<CommonResult<RefundApprovalResult>>(
        `/admin/transactions/refund-approvals/${encodeURIComponent(approvalId)}/reject`,
        data,
    );
    return unwrapResult(result.data);
}

export async function searchChannelMatchAbnormalities(data: ChannelMatchAbnormalQuery) {
    const result = await http.post<CommonResult<ChannelMatchAbnormalSearchResponse>>(
        '/admin/transactions/channel-match-abnormalities/search', data,
    );
    return unwrapResult(result.data);
}

export async function getChannelMatchAbnormalityDetail(eventId: string, transactionDateTime: string) {
    const result = await http.get<CommonResult<ChannelMatchAbnormalDetail>>(
        `/admin/transactions/channel-match-abnormalities/${encodeURIComponent(eventId)}`,
        { params: { transactionDateTime: normalizeTransactionDateTimeParam(transactionDateTime) } },
    );
    return unwrapResult(result.data);
}

export async function exportChannelMatchAbnormalities(data: ChannelMatchAbnormalQuery) {
    await downloadExcel('/admin/transactions/channel-match-abnormalities/export', { data });
}

export async function claimChannelMatchAbnormality(
    eventId: string,
    data: { transactionDateTime: string; expectedVersion: number; assigneeAccountId?: string; assigneeName?: string },
) {
    const result = await http.post<CommonResult<ChannelMatchAbnormalRecord>>(
        `/admin/transactions/channel-match-abnormalities/${encodeURIComponent(eventId)}/claim`,
        { ...data, transactionDateTime: normalizeTransactionDateTimeParam(data.transactionDateTime) },
    );
    return unwrapResult(result.data);
}

export async function requeryChannelMatchAbnormality(
    eventId: string,
    data: { transactionDateTime: string; expectedVersion: number },
) {
    const result = await http.post<CommonResult<ChannelMatchAbnormalRecord>>(
        `/admin/transactions/channel-match-abnormalities/${encodeURIComponent(eventId)}/requery`,
        { ...data, transactionDateTime: normalizeTransactionDateTimeParam(data.transactionDateTime) },
    );
    return unwrapResult(result.data);
}

export async function batchRequeryChannelMatchAbnormalities(cases: ChannelMatchAbnormalCaseReference[]) {
    const result = await http.post<CommonResult<ChannelMatchAbnormalBatchResult>>(
        '/admin/transactions/channel-match-abnormalities/batch-requery',
        {
            cases: cases.map((item) => ({
                ...item,
                transactionDateTime: normalizeTransactionDateTimeParam(item.transactionDateTime),
            })),
        },
    );
    return unwrapResult(result.data);
}

export async function resolveChannelMatchAbnormality(
    eventId: string,
    data: { transactionDateTime: string; expectedVersion: number; resolutionType: string; reason: string; referenceId?: string },
) {
    const result = await http.post<CommonResult<ChannelMatchAbnormalRecord>>(
        `/admin/transactions/channel-match-abnormalities/${encodeURIComponent(eventId)}/resolve`,
        { ...data, transactionDateTime: normalizeTransactionDateTimeParam(data.transactionDateTime) },
    );
    return unwrapResult(result.data);
}

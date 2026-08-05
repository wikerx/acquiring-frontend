import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
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

export interface TransactionDetail {
    order?: TransactionOrder;
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

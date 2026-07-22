import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { downloadBlob } from '@/utils/download';
import { http } from './http';

export interface TransactionPageQuery {
    pageNo?: number;
    pageSize?: number;
    merchantOrderNo?: string;
    transactionId?: string;
    sourceTransactionId?: string;
    transactionType?: string;
    transactionStatus?: string;
    paymentMethod?: string;
    paymentBrand?: string;
    channelOrderNo?: string;
    merchantResponseCode?: string;
    channelMatchStatus?: string;
    reconciliationStatus?: string;
    settlementStatus?: string;
    beginTime?: string;
    endTime?: string;
    queryTimeZone?: string;
}

export interface TransactionOrder {
    operationId?: string;
    rootTransactionId?: string;
    latestTransactionId?: string;
    merchantId?: string;
    merchantOrderNo?: string;
    merchantOrderId?: string;
    paymentMethod?: string;
    paymentBrand?: string;
    cardBin?: string;
    cardNumberMasked?: string;
    authCode?: string;
    transactionType?: string;
    transactionStatus?: string;
    lifecycleStatus?: string;
    lifecycleStatusMessage?: string;
    processStage?: string;
    labelCurrency?: string;
    labelAmount?: number | string;
    transactionCurrency?: string;
    transactionAmount?: number | string;
    currentAmount?: number | string;
    currentCurrency?: string;
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
    settlementStatus?: string;
    reconciliationStatus?: string;
    accountingStatus?: string;
    channelMatchStatus?: string;
    channelCode?: string;
    channelOrderNo?: string;
    transactionDateTime?: string;
    transactionTimeZone?: string;
}

export interface TransactionOperation {
    operationId?: string;
    transactionId?: string;
    sourceTransactionId?: string;
    merchantId?: string;
    merchantOrderNo?: string;
    merchantOrderId?: string;
    operationSequence?: number;
    transactionType?: string;
    transactionStatus?: string;
    processStage?: string;
    labelCurrency?: string;
    labelAmount?: number | string;
    transactionCurrency?: string;
    transactionAmount?: number | string;
    currencyExponent?: number;
    transactionRate?: number | string;
    merchantResponseCode?: string;
    merchantResponseMessage?: string;
    merchantNotificationStatus?: string;
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
    channelOrderNo?: string;
    channelTransactionId?: string;
    authCode?: string;
    acquirerReferenceNo?: string;
    settlementStatus?: string;
    reconciliationStatus?: string;
    accountingStatus?: string;
    channelMatchStatus?: string;
    transactionDateTime?: string;
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
    amountSummaries?: TransactionAmountSummary[];
}

export interface TransactionOperationSummary {
    totalCount: number;
    successCount: number;
    failedCount: number;
    amountSummaries?: TransactionAmountSummary[];
    successAmountSummaries?: TransactionAmountSummary[];
    failedAmountSummaries?: TransactionAmountSummary[];
    paymentMethodSummaries?: TransactionPaymentMethodSummary[];
}

export interface TransactionOperationSearchResponse {
    page: PageResult<TransactionOperation>;
    summary?: TransactionOperationSummary;
}

export interface TransactionDetail {
    order?: TransactionOrder;
    operations?: TransactionOperation[];
    statusHistory?: Record<string, unknown>[];
    flowEvents?: Record<string, unknown>[];
    amountChanges?: Record<string, unknown>[];
    channelRequests?: Record<string, unknown>[];
    channelInteractionLogs?: Record<string, unknown>[];
    merchantNotifications?: Record<string, unknown>[];
    merchantNotificationLogs?: Record<string, unknown>[];
    merchantApiInteractionLogs?: Record<string, unknown>[];
}

export interface TransactionActionRequest {
    merchantOrderId?: string;
    amount?: number | string;
    currency?: string;
    reason?: string;
}

export interface TransactionActionResponse {
    transactionId?: string;
    sourceTransactionId?: string;
    merchantOrderNo?: string;
    merchantOrderId?: string;
    transactionType?: string;
    status?: string;
    merchantResponseCode?: string;
    merchantResponseMessage?: string;
    processStage?: string;
    failReasonCode?: string;
    pendingReasonCode?: string;
    amount?: number;
    currency?: string;
}

export const transactionApi = {
    async pageOrders(data: TransactionPageQuery) {
        const result = await http.post<CommonResult<PageResult<TransactionOrder>>>('/merchant/transactions/orders/search', data);
        return unwrapResult(result.data);
    },
    async searchOperations(data: TransactionPageQuery) {
        const result = await http.post<CommonResult<TransactionOperationSearchResponse>>('/merchant/transactions/orders/operations/search', data);
        return unwrapResult(result.data);
    },
    async detail(transactionId: string) {
        const result = await http.get<CommonResult<TransactionDetail>>(`/merchant/transactions/orders/${encodeURIComponent(transactionId)}`);
        return unwrapResult(result.data);
    },
    async refund(transactionId: string, data: TransactionActionRequest) {
        const result = await http.post<CommonResult<TransactionActionResponse>>(`/merchant/transactions/orders/${encodeURIComponent(transactionId)}/refund`, data);
        return unwrapResult(result.data);
    },
    async exportOrders(data: TransactionPageQuery) {
        await downloadBlob('/merchant/transactions/orders/export', {
            method: 'post',
            data,
            fileName: 'merchant-transactions.csv',
        });
    },
};

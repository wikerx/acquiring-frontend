/** Merchant 结算接口契约：所有查询和导出由 service-merchant 重新绑定可信 merchantId，浏览器不可上送商户身份。 */
import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadBlob } from '@/utils/download';

/** 保留数据库 DATETIME(3) 路由值，仅转换为 Spring MVC 接收的 ISO LocalDateTime。 */
function normalizeSettlementTransactionDateTimeParam(value: string) {
    const normalized = value.trim().replace('T', ' ');
    const match = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?$/.exec(normalized);
    if (!match) return value;
    return `${match[1]}.${(match[2] || '').padEnd(3, '0').slice(0, 3)}`.replace(' ', 'T');
}

export interface MerchantSettlementBatchQuery extends PageQuery {
    settlementBatchNo?: string;
    batchType?: string;
    batchStatus?: string;
    beginBusinessDate?: string;
    endBusinessDate?: string;
}

export interface MerchantSettlementBatch {
    settlementBatchNo: string;
    merchantId: string;
    merchantName?: string;
    settlementAccountId: number;
    settlementAccountNo?: string;
    businessDate: string;
    businessTimeZone: string;
    targetCurrency: string;
    targetCurrencyExponent: number;
    batchType: string;
    batchStatus: string;
    transactionCount: number;
    candidateCount: number;
    netDirection?: string;
    netAmount?: string | number;
    postedTime?: string;
    createTime: string;
}

export interface MerchantSettlementRate {
    sourceCurrency: string;
    targetCurrency: string;
    directRate: string | number;
    effectiveTime?: string;
    lockedTime?: string;
    displaySource?: string;
}

export interface MerchantSettlementSummary {
    paymentType?: string;
    paymentMethod?: string;
    transactionType?: string;
    resultItemType?: string;
    feeCategory?: string;
    direction: string;
    sourceCurrency: string;
    sourceCurrencyExponent: number;
    targetCurrency: string;
    targetCurrencyExponent: number;
    transactionCount: number;
    sourceAmount: string | number;
    targetAmount: string | number;
}

export interface MerchantSettlementBatchDetail {
    batch: MerchantSettlementBatch;
    rates: MerchantSettlementRate[];
    summaries: MerchantSettlementSummary[];
}

export interface MerchantSettlementTransactionQuery extends PageQuery {
    settlementBatchNo?: string;
    sourceTransactionId?: string;
    merchantOrderNo?: string;
    beginTransactionTime?: string;
    endTransactionTime?: string;
    paymentType?: string;
    paymentMethod?: string;
    transactionType?: string;
    feeCategory?: string;
    beginBusinessDate?: string;
    endBusinessDate?: string;
}

export interface MerchantSettlementTransaction {
    settlementBatchNo: string;
    businessDate: string;
    batchStatus: string;
    candidateId?: number;
    merchantOrderNo?: string;
    sourceTransactionId: string;
    sourceTransactionDateTime?: string;
    paymentType?: string;
    paymentMethod?: string;
    transactionType?: string;
    sourceAmount: string | number;
    sourceCurrency: string;
    sourceCurrencyExponent: number;
    componentCount: number;
    netDirection: string;
    netTargetAmount: string | number;
    targetCurrency: string;
    targetCurrencyExponent: number;
    postedTime?: string;
    createTime: string;
}

export interface MerchantSettlementTransactionItem {
    settlementResultItemNo: string;
    settlementBatchNo: string;
    businessDate: string;
    sourceTransactionId: string;
    sourceTransactionDateTime?: string;
    sourceDetailNo?: string;
    resultItemType: string;
    paymentType?: string;
    paymentMethod?: string;
    transactionType?: string;
    feeCategory?: string;
    direction: string;
    sourceAmount: string | number;
    sourceCurrency: string;
    sourceCurrencyExponent: number;
    directRate: string | number;
    targetAmount: string | number;
    targetCurrency: string;
    targetCurrencyExponent: number;
    appliedLimit?: string;
    createTime: string;
}

export interface MerchantSettlementReserveQuery extends PageQuery {
    settlementBatchNo?: string;
    reserveNo?: string;
    reserveActionNo?: string;
    sourceTransactionId?: string;
    merchantOrderNo?: string;
    reserveStatus?: string;
    actionType?: string;
    currency?: string;
    beginTransactionTime?: string;
    endTransactionTime?: string;
    beginExpectedReleaseDate?: string;
    endExpectedReleaseDate?: string;
    beginBusinessDate?: string;
    endBusinessDate?: string;
}

export interface MerchantSettlementReserveItem {
    reserveActionNo: string;
    reserveNo: string;
    settlementBatchNo?: string;
    businessDate: string;
    sourceTransactionId?: string;
    merchantOrderNo?: string;
    sourceTransactionDateTime?: string;
    actionType: string;
    direction: string;
    currency: string;
    currencyExponent: number;
    amount: string | number;
    retainedAmount: string | number;
    returnedAmount: string | number;
    releasedAmount: string | number;
    debitAdjustmentAmount: string | number;
    creditAdjustmentAmount: string | number;
    reversedAmount: string | number;
    remainingAmount: string | number;
    reserveStatus: string;
    expectedReleaseDate?: string;
    actionTime: string;
}

export interface MerchantSettlementReconciliationRecord {
    transactionId: string;
    merchantOrderNo: string;
    transactionType: string;
    reconciliationStatus: string;
    settlementStatus: string;
    accountingStatus: string;
    transactionDateTime: string;
    operationTime: string;
}

export interface MerchantClearingSummary {
    transactionId: string;
    transactionType: string;
    labelCurrency: string;
    labelAmount?: string | number;
    clearingStatus: string;
    grossLabelAmount?: string | number;
    platformFeeAmount?: string | number;
    reserveAmount?: string | number;
    settlementStatus: string;
    settlementEligibleDate?: string;
    transactionDateTime: string;
}

export interface MerchantClearingTransactionLine {
    clearingDetailNo: string;
    lineNo: number;
    itemType?: string;
    feeCategory?: string;
    itemCode?: string;
    itemName?: string;
    direction?: string;
    basisCurrency?: string;
    basisAmount?: string | number;
    amount?: string | number;
    currency?: string;
    currencyExponent?: number;
    recordStatus?: string;
}

export interface MerchantClearingReserveLine {
    reserveClearingDetailNo: string;
    lineNo: number;
    reserveActionType?: string;
    itemCode?: string;
    itemName?: string;
    direction?: string;
    reserveCurrency?: string;
    reserveCurrencyExponent?: number;
    retainedAmount?: string | number;
    returnedAmount?: string | number;
    releasedAmount?: string | number;
    adjustmentAmount?: string | number;
    remainingAmount?: string | number;
    expectedReserveReleaseDate?: string;
    recordStatus?: string;
}

export interface MerchantClearingDetail {
    summary: MerchantClearingSummary;
    transactionDetails: MerchantClearingTransactionLine[];
    reserveDetails: MerchantClearingReserveLine[];
}

export async function searchMerchantSettlementBatches(data: MerchantSettlementBatchQuery) {
    const result = await http.post<CommonResult<PageResult<MerchantSettlementBatch>>>(
        '/merchant/settlements/search', data,
    );
    return unwrapResult(result.data);
}

export async function getMerchantSettlementBatch(settlementBatchNo: string) {
    const result = await http.get<CommonResult<MerchantSettlementBatchDetail>>(
        `/merchant/settlements/${encodeURIComponent(settlementBatchNo)}`,
    );
    return unwrapResult(result.data);
}

export async function getMerchantSettlementVoucher(settlementBatchNo: string) {
    const result = await http.get<CommonResult<MerchantSettlementBatchDetail>>(
        `/merchant/settlements/${encodeURIComponent(settlementBatchNo)}/voucher`,
    );
    return unwrapResult(result.data);
}

export async function searchMerchantSettlementSummaries(
    settlementBatchNo: string,
    pageNo = 1,
    pageSize = 20,
) {
    const encodedBatchNo = encodeURIComponent(settlementBatchNo);
    const result = await http.get<CommonResult<PageResult<MerchantSettlementSummary>>>(
        `/merchant/settlements/${encodedBatchNo}/summaries`,
        { params: { pageNo, pageSize } },
    );
    return unwrapResult(result.data);
}

export async function exportMerchantSettlementSummaries(settlementBatchNo: string) {
    const encodedBatchNo = encodeURIComponent(settlementBatchNo);
    await downloadBlob(`/merchant/settlements/${encodedBatchNo}/summaries/export`, {
        method: 'post',
        fileName: `merchant-settlement-${settlementBatchNo}-summaries.xlsx`,
    });
}

export async function searchMerchantSettlementTransactions(data: MerchantSettlementTransactionQuery) {
    const result = await http.post<CommonResult<PageResult<MerchantSettlementTransaction>>>(
        '/merchant/settlements/transaction-items/search', data,
    );
    return unwrapResult(result.data);
}

export async function searchMerchantSettlementTransactionComponents(
    settlementBatchNo: string,
    transactionId: string,
    pageNo = 1,
    pageSize = 10,
) {
    const result = await http.get<CommonResult<PageResult<MerchantSettlementTransactionItem>>>(
        `/merchant/settlements/transaction-items/batches/${encodeURIComponent(settlementBatchNo)}`
            + `/transactions/${encodeURIComponent(transactionId)}`,
        { params: { pageNo, pageSize } },
    );
    return unwrapResult(result.data);
}

export async function getMerchantSettlementReconciliationRecordsByTransaction(
    transactionId: string,
    transactionDateTime: string,
) {
    const result = await http.get<CommonResult<MerchantSettlementReconciliationRecord[]>>(
        `/merchant/settlements/reconciliation-records/transactions/${encodeURIComponent(transactionId)}`,
        {
            params: {
                transactionDateTime: normalizeSettlementTransactionDateTimeParam(transactionDateTime),
            },
        },
    );
    return unwrapResult(result.data);
}

export async function getMerchantClearingDetailByTransaction(
    transactionId: string,
    transactionDateTime: string,
) {
    const result = await http.get<CommonResult<MerchantClearingDetail | null>>(
        `/merchant/settlements/clearing-records/transactions/${encodeURIComponent(transactionId)}`,
        {
            params: {
                transactionDateTime: normalizeSettlementTransactionDateTimeParam(transactionDateTime),
            },
        },
    );
    return unwrapResult(result.data);
}

export async function searchMerchantSettlementTransactionsByTransaction(
    transactionId: string,
    transactionDateTime: string,
    pageNo = 1,
    pageSize = 10,
) {
    const result = await http.get<CommonResult<PageResult<MerchantSettlementTransactionItem>>>(
        `/merchant/settlements/transaction-items/transactions/${encodeURIComponent(transactionId)}`,
        {
            params: {
                transactionDateTime: normalizeSettlementTransactionDateTimeParam(transactionDateTime),
                pageNo,
                pageSize,
            },
        },
    );
    return unwrapResult(result.data);
}

export async function searchMerchantSettlementReserves(data: MerchantSettlementReserveQuery) {
    const result = await http.post<CommonResult<PageResult<MerchantSettlementReserveItem>>>(
        '/merchant/settlements/reserve-items/search', data,
    );
    return unwrapResult(result.data);
}

export async function searchMerchantSettlementReservesByTransaction(
    transactionId: string,
    transactionDateTime: string,
    pageNo = 1,
    pageSize = 10,
) {
    const result = await http.get<CommonResult<PageResult<MerchantSettlementReserveItem>>>(
        `/merchant/settlements/reserve-items/transactions/${encodeURIComponent(transactionId)}`,
        {
            params: {
                transactionDateTime: normalizeSettlementTransactionDateTimeParam(transactionDateTime),
                pageNo,
                pageSize,
            },
        },
    );
    return unwrapResult(result.data);
}

export async function exportMerchantSettlementBatches(data: MerchantSettlementBatchQuery) {
    await downloadBlob('/merchant/settlements/export', {
        method: 'post', data, fileName: 'merchant-settlement-batches.xlsx',
    });
}

export async function exportMerchantSettlementTransactions(data: MerchantSettlementTransactionQuery) {
    await downloadBlob('/merchant/settlements/transaction-items/export', {
        method: 'post', data, fileName: 'merchant-settlement-transactions.xlsx',
    });
}

export async function exportMerchantSettlementReserves(data: MerchantSettlementReserveQuery) {
    await downloadBlob('/merchant/settlements/reserve-items/export', {
        method: 'post', data, fileName: 'merchant-settlement-reserves.xlsx',
    });
}

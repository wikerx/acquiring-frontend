/** Merchant 结算接口契约：所有查询和导出由 service-merchant 重新绑定可信 merchantId，浏览器不可上送商户身份。 */
import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadBlob } from '@/utils/download';

export interface MerchantSettlementBatchQuery extends PageQuery {
    settlementBatchNo?: string;
    batchType?: string;
    batchStatus?: string;
    beginBusinessDate?: string;
    endBusinessDate?: string;
}

export interface MerchantSettlementBatch {
    settlementBatchNo: string;
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
    paymentType?: string;
    paymentMethod?: string;
    transactionType?: string;
    feeCategory?: string;
    beginBusinessDate?: string;
    endBusinessDate?: string;
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
    sourceTransactionId?: string;
    actionType?: string;
    currency?: string;
    beginBusinessDate?: string;
    endBusinessDate?: string;
}

export interface MerchantSettlementReserveItem {
    reserveActionNo: string;
    reserveNo: string;
    settlementBatchNo?: string;
    businessDate: string;
    sourceTransactionId?: string;
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

export async function searchMerchantSettlementTransactions(data: MerchantSettlementTransactionQuery) {
    const result = await http.post<CommonResult<PageResult<MerchantSettlementTransactionItem>>>(
        '/merchant/settlements/transaction-items/search', data,
    );
    return unwrapResult(result.data);
}

export async function searchMerchantSettlementReserves(data: MerchantSettlementReserveQuery) {
    const result = await http.post<CommonResult<PageResult<MerchantSettlementReserveItem>>>(
        '/merchant/settlements/reserve-items/search', data,
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

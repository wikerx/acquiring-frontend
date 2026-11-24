import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from './http';
import { downloadBlob } from '@/utils/download';
import type { MerchantRefundQuery, TransactionPageQuery } from './transactionApi';
import type { DetailQuery } from './financeApi';
import type {
  MerchantSettlementBatchQuery,
  MerchantSettlementReserveQuery,
  MerchantSettlementTransactionQuery,
} from './settlementApi';

export type MerchantExportTaskStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
export type MerchantExportTaskType =
  | 'MERCHANT_PAYMENT_LINK'
    | 'MERCHANT_TRANSACTION_OPERATION'
  | 'MERCHANT_REFUND'
  | 'MERCHANT_SETTLEMENT_BATCH'
  | 'MERCHANT_SETTLEMENT_SUMMARY'
  | 'MERCHANT_SETTLEMENT_TRANSACTION'
  | 'MERCHANT_SETTLEMENT_RESERVE'
  | 'MERCHANT_FUND_LEDGER';

export interface MerchantExportTaskQuery {
  taskType?: MerchantExportTaskType | '';
  status?: MerchantExportTaskStatus | '';
  createdStartTime?: string;
  createdEndTime?: string;
  pageNo?: number;
  pageSize?: number;
}

export interface MerchantExportTaskSummary {
  taskNo: string;
  taskType: MerchantExportTaskType;
  settlementBatchDomain?: 'RESERVE' | 'TRANSACTION';
  taskName: string;
  status: MerchantExportTaskStatus;
  progressPercent: number;
  processedRows: number;
  totalRows: number;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  fileSha256?: string | null;
  expiresAt?: string | null;
  failureCode?: string | null;
  failureReason?: string | null;
  retryCount: number;
  maxRetryCount: number;
  version: number;
  createTime: string;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export function createExportRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function submitTransactionExport(query: TransactionPageQuery) {
  const result = await http.post<CommonResult<MerchantExportTaskSummary>>(
    '/merchant/operations/export-tasks/transaction-operations',
    { requestId: createExportRequestId(), query },
  );
  return unwrapResult(result.data);
}

export async function submitRefundExport(query: MerchantRefundQuery) {
  const result = await http.post<CommonResult<MerchantExportTaskSummary>>(
    '/merchant/operations/export-tasks/refunds',
    { requestId: createExportRequestId(), query },
  );
  return unwrapResult(result.data);
}

export async function submitSettlementBatchExport(query: MerchantSettlementBatchQuery, reserve = false) {
  const result = await http.post<CommonResult<MerchantExportTaskSummary>>(
    reserve ? '/merchant/operations/export-tasks/reserve-settlement-batches'
      : '/merchant/operations/export-tasks/settlement-batches',
    { requestId: createExportRequestId(), query },
  );
  return unwrapResult(result.data);
}

export async function submitSettlementSummaryExport(settlementBatchNo: string, reserve = false) {
  const result = await http.post<CommonResult<MerchantExportTaskSummary>>(
    reserve ? '/merchant/operations/export-tasks/reserve-settlement-summaries'
      : '/merchant/operations/export-tasks/settlement-summaries',
    { requestId: createExportRequestId(), settlementBatchNo },
  );
  return unwrapResult(result.data);
}

export async function submitSettlementTransactionExport(query: MerchantSettlementTransactionQuery) {
  const result = await http.post<CommonResult<MerchantExportTaskSummary>>(
    '/merchant/operations/export-tasks/settlement-transactions',
    { requestId: createExportRequestId(), query },
  );
  return unwrapResult(result.data);
}

export async function submitSettlementReserveExport(query: MerchantSettlementReserveQuery) {
  const result = await http.post<CommonResult<MerchantExportTaskSummary>>(
    '/merchant/operations/export-tasks/settlement-reserves',
    { requestId: createExportRequestId(), query },
  );
  return unwrapResult(result.data);
}

export async function submitFundLedgerExport(query: DetailQuery) {
  const result = await http.post<CommonResult<MerchantExportTaskSummary>>(
    '/merchant/operations/export-tasks/fund-ledgers',
    { requestId: createExportRequestId(), query },
  );
  return unwrapResult(result.data);
}

export async function searchMerchantExportTasks(data: MerchantExportTaskQuery) {
  const result = await http.post<CommonResult<PageResult<MerchantExportTaskSummary>>>(
    '/merchant/operations/export-tasks/search',
    data,
  );
  return unwrapResult(result.data);
}

export async function getMerchantExportTask(taskNo: string) {
  const result = await http.get<CommonResult<MerchantExportTaskSummary>>(
    `/merchant/operations/export-tasks/${encodeURIComponent(taskNo)}`,
  );
  return unwrapResult(result.data);
}

export async function retryMerchantExportTask(taskNo: string, expectedVersion: number) {
  const result = await http.post<CommonResult<MerchantExportTaskSummary>>(
    `/merchant/operations/export-tasks/${encodeURIComponent(taskNo)}/retry`,
    { expectedVersion },
  );
  return unwrapResult(result.data);
}

export async function downloadMerchantExportTask(taskNo: string, fileName?: string | null) {
  await downloadBlob(
    `/merchant/operations/export-tasks/${encodeURIComponent(taskNo)}/download`,
    { fileName: fileName || 'merchant-export.xlsx' },
  );
}

import type {
  PaymentApplicationItem,
  PaymentBatchDecisionItem,
  PaymentBatchDecisionResult,
  PaymentDecision,
} from '@/api/paymentMethodApi';

/** 冻结真实明细版本及逐项请求号；恢复时重发这份命令，不从刷新后的页面重建。 */
export function preparePaymentReviewBatch(
  items: PaymentApplicationItem[],
  decision: PaymentDecision,
  reason: string,
  makeRequestId: () => string,
): PaymentBatchDecisionItem[] {
  return items
    .filter((item) => item.status === 'PENDING_REVIEW')
    .map((item) => ({
      itemId: item.id,
      command: {
        requestId: makeRequestId(),
        expectedVersion: item.version,
        decision,
        reason: reason.trim() || undefined,
      },
    }));
}

/** 缺失的回执只能视为结果未明；不能用成功总数推断某个明细已经完成。 */
export function paymentReviewResults(
  items: PaymentBatchDecisionItem[],
  results: PaymentBatchDecisionResult[],
): PaymentBatchDecisionResult[] {
  const byId = new Map(results.map((result) => [result.itemId, result]));
  return items.map((item) => byId.get(item.itemId) || { itemId: item.itemId, outcome: 'UNKNOWN' });
}

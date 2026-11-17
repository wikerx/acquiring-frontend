import matchNotRequired from './assets/transaction-icons/stages/MATCH_NOT_REQUIRED.svg';
import matchPending from './assets/transaction-icons/stages/MATCH_UNMATCHED.svg';
import matchReview from './assets/transaction-icons/stages/MATCH_PENDING_REVIEW.svg';
import matchSuccess from './assets/transaction-icons/stages/MATCH_SUCCESS.svg';
import matchMismatch from './assets/transaction-icons/stages/MATCH_MISMATCH.svg';
import matchFailed from './assets/transaction-icons/stages/MATCH_FAILED.svg';
import reconPending from './assets/transaction-icons/stages/RECON_UNRECONCILED.svg';
import reconSuccess from './assets/transaction-icons/stages/RECON_RECONCILED.svg';
import reconMismatch from './assets/transaction-icons/stages/RECON_MISMATCH.svg';
import settlePending from './assets/transaction-icons/stages/SETTLE_UNSETTLED.svg';
import settleProcessing from './assets/transaction-icons/stages/SETTLE_PROCESSING.svg';
import settleSuccess from './assets/transaction-icons/stages/SETTLE_SETTLED.svg';
import settleFailed from './assets/transaction-icons/stages/SETTLE_FAILED.svg';

export type TransactionStage = 'matching' | 'reconciliation' | 'settlement';
export type TransactionStageSemantic = 'neutral' | 'pending-review' | 'success' | 'mismatch' | 'failed' | 'processing';

export interface TransactionStagePresentation {
    icon: string;
    semantic: TransactionStageSemantic;
}

/** 按业务域和真实状态码映射资源；资源名不得作为接口筛选值或状态机枚举。 */
export const TRANSACTION_STAGE_PRESENTATIONS: Record<TransactionStage, Readonly<Record<string, TransactionStagePresentation>>> = {
    matching: {
        NOT_REQUIRED: { icon: matchNotRequired, semantic: 'neutral' },
        PENDING: { icon: matchPending, semantic: 'neutral' },
        REVIEW_REQUIRED: { icon: matchReview, semantic: 'pending-review' },
        MATCHED: { icon: matchSuccess, semantic: 'success' },
        MISMATCHED: { icon: matchMismatch, semantic: 'mismatch' },
        FAILED: { icon: matchFailed, semantic: 'failed' },
    },
    reconciliation: {
        NOT_RECONCILED: { icon: reconPending, semantic: 'neutral' },
        RECONCILED: { icon: reconSuccess, semantic: 'success' },
        MISMATCHED: { icon: reconMismatch, semantic: 'mismatch' },
    },
    settlement: {
        NOT_SETTLED: { icon: settlePending, semantic: 'neutral' },
        SETTLING: { icon: settleProcessing, semantic: 'processing' },
        SETTLED: { icon: settleSuccess, semantic: 'success' },
        FAILED: { icon: settleFailed, semantic: 'failed' },
    },
};

/** 未知码保留原值展示，由组件使用中性样式，不猜测为成功、失败或其他业务域。 */
export function resolveTransactionStagePresentation(domain: TransactionStage, value?: string | null) {
    const code = (value || '').trim();
    const registry = TRANSACTION_STAGE_PRESENTATIONS[domain];
    return Object.prototype.hasOwnProperty.call(registry, code) ? registry[code] : undefined;
}

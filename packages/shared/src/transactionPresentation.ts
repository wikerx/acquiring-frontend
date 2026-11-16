import authorizationIcon from './assets/transaction-icons/types/AUTHORIZATION.svg';
import cancelIcon from './assets/transaction-icons/types/CANCEL.svg';
import captureIcon from './assets/transaction-icons/types/CAPTURE.svg';
import chargebackIcon from './assets/transaction-icons/types/CHARGEBACK.svg';
import incrementalAuthorizationIcon from './assets/transaction-icons/types/INCREMENTAL_AUTHORIZATION.svg';
import paymentIcon from './assets/transaction-icons/types/PAYMENT.svg';
import payoutIcon from './assets/transaction-icons/types/PAYOUT.svg';
import preAuthorizationIcon from './assets/transaction-icons/types/PRE_AUTHORIZATION.svg';
import preAuthCompletionIcon from './assets/transaction-icons/types/PRE_AUTH_COMPLETION.svg';
import queryIcon from './assets/transaction-icons/types/QUERY.svg';
import refundIcon from './assets/transaction-icons/types/REFUND.svg';
import representmentIcon from './assets/transaction-icons/types/REPRESENTMENT.svg';
import retrievalRequestIcon from './assets/transaction-icons/types/RETRIEVAL_REQUEST.svg';
import reversalIcon from './assets/transaction-icons/types/REVERSAL.svg';
import voidIcon from './assets/transaction-icons/types/VOID.svg';
import failedIcon from './assets/transaction-icons/statuses/FAILED.svg';
import pendingIcon from './assets/transaction-icons/statuses/PENDING.svg';
import processingIcon from './assets/transaction-icons/statuses/PROCESSING.svg';
import successIcon from './assets/transaction-icons/statuses/SUCCESS.svg';

export type TransactionTypeIconCode =
    | 'AUTHORIZATION'
    | 'CANCEL'
    | 'CAPTURE'
    | 'PAYMENT'
    | 'PAYOUT'
    | 'PRE_AUTHORIZATION'
    | 'PRE_AUTH_COMPLETION'
    | 'INCREMENTAL_AUTHORIZATION'
    | 'REFUND'
    | 'VOID'
    | 'QUERY'
    | 'REVERSAL'
    | 'CHARGEBACK'
    | 'REPRESENTMENT'
    | 'RETRIEVAL_REQUEST';

export type TransactionStatusIconCode = 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING';

export const TRANSACTION_TYPE_ICON_REGISTRY: Record<TransactionTypeIconCode, string> = {
    AUTHORIZATION: authorizationIcon,
    CANCEL: cancelIcon,
    CAPTURE: captureIcon,
    PAYMENT: paymentIcon,
    PAYOUT: payoutIcon,
    PRE_AUTHORIZATION: preAuthorizationIcon,
    PRE_AUTH_COMPLETION: preAuthCompletionIcon,
    INCREMENTAL_AUTHORIZATION: incrementalAuthorizationIcon,
    REFUND: refundIcon,
    VOID: voidIcon,
    QUERY: queryIcon,
    REVERSAL: reversalIcon,
    CHARGEBACK: chargebackIcon,
    REPRESENTMENT: representmentIcon,
    RETRIEVAL_REQUEST: retrievalRequestIcon,
};

export const TRANSACTION_STATUS_ICON_REGISTRY: Record<TransactionStatusIconCode, string> = {
    SUCCESS: successIcon,
    FAILED: failedIcon,
    PENDING: pendingIcon,
    PROCESSING: processingIcon,
};

/** 仅按后端交易类型枚举精确解析图标，未知值保留文字降级。 */
export function resolveTransactionTypeIcon(value?: string | null): string | undefined {
    return resolveIcon(value, TRANSACTION_TYPE_ICON_REGISTRY);
}

/** 仅映射 V5 已定义的四种交易结果状态，不推断其他业务状态。 */
export function resolveTransactionStatusIcon(value?: string | null): string | undefined {
    return resolveIcon(value, TRANSACTION_STATUS_ICON_REGISTRY);
}

export function normalizeTransactionStatusIconCode(value?: string | null): TransactionStatusIconCode | undefined {
    const normalized = normalizeCode(value);
    return normalized in TRANSACTION_STATUS_ICON_REGISTRY
        ? normalized as TransactionStatusIconCode
        : undefined;
}

function resolveIcon<T extends string>(value: string | null | undefined, registry: Record<T, string>) {
    const normalized = normalizeCode(value) as T;
    return registry[normalized];
}

function normalizeCode(value?: string | null) {
    return (value || '').trim().toUpperCase();
}

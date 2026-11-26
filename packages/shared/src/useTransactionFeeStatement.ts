import { shallowRef, watch } from 'vue';
import type { TransactionFeeFacts } from './transactionFeeFacts';

interface FeeStatementIdentity {
    transactionId?: string;
    transactionDateTime?: string;
    settlementBatchNo?: string;
}

/** Load a detail-scoped fee statement without letting an older drawer request overwrite a new selection. */
export function useTransactionFeeStatement(
    selection: () => FeeStatementIdentity | null,
    load: (id: string, time: string) => Promise<{ feeFacts?: TransactionFeeFacts } | null>,
) {
    const facts = shallowRef<TransactionFeeFacts | null>(null);
    watch(selection, (identity, _previous, onCleanup) => {
        let active = true;
        onCleanup(() => { active = false; });
        facts.value = null;
        if (!identity?.transactionId || !identity.transactionDateTime) return;
        void load(identity.transactionId, identity.transactionDateTime).then(detail => {
            if (!active || !detail?.feeFacts) return;
            const projection = detail.feeFacts;
            const settlement = identity.settlementBatchNo
                ? projection.settlement.filter(line => line.batchNo === identity.settlementBatchNo)
                : projection.settlement;
            if (identity.settlementBatchNo && settlement.length === 0) return;
            facts.value = { ...projection, settlement, sourceAction: null };
        }).catch(() => {
            // The existing scoped settlement or candidate details remain available.
        });
    }, { immediate: true });
    return facts;
}

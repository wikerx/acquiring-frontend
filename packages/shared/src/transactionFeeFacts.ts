import { formatDecimalAmount, roundDecimalAmount } from './amount';

export interface ClearingFeeLine {
    groupNo: string | null;
    detailNo: string;
    itemType: string;
    feeCategory: string;
    riskServiceType?: string;
    componentType: string;
    direction: string;
    currency: string;
    currencyExponent: number;
    amount: string;
    basisCurrency?: string;
    basisAmount?: string;
    percentageRate?: string;
    minimumAmountUsd?: string;
    maximumAmountUsd?: string;
    limitEvaluationStatus?: string;
    appliedLimit?: string;
}

export interface SettlementFeeLine {
    groupNo: string;
    detailNo: string;
    batchNo: string;
    batchStatus: string;
    resultRole: string;
    feeCategory: string;
    direction: string;
    sourceCurrency: string;
    sourceAmount: string;
    rate: string;
    currency: string;
    currencyExponent: number;
    unroundedAmount: string;
    amount: string;
    appliedLimit?: string;
}

export interface FeeSourceAction {
    transactionId: string;
    transactionDateTime: string;
    transactionType: string;
}

export interface TransactionFeeFacts {
    clearing: ClearingFeeLine[];
    settlement: SettlementFeeLine[];
    sourceAction?: FeeSourceAction | null;
    complete: boolean;
}

export interface FeeCurrencyAmount {
    currency: string;
    currencyExponent: number;
    amount: string;
}

export interface TransactionFeeGroup {
    key: string;
    category: string;
    riskServiceType?: string;
    reversal: boolean;
    needsRate: boolean;
    clearing: ClearingFeeLine[];
    settlement: SettlementFeeLine[];
    amounts: FeeCurrencyAmount[];
    final: SettlementFeeLine[];
}

/** Keep display precision independent of the exact decimal returned by the API. */
export function formatFeeAmount(value?: string | number | null, locale = 'zh-CN', exponent = 2,
    digits?: number, emptyText = '-') {
    if (value === null || value === undefined || String(value).trim() === '') return emptyText;
    const minimum = Number.isInteger(exponent) && exponent >= 0 ? exponent : 2;
    if (digits === undefined) return formatDecimalAmount(value, locale, minimum, 20);
    return formatDecimalAmount(roundDecimalAmount(value, digits), locale, digits, digits);
}

/** Sum only already-persisted amounts within a currency using the decimal scale. */
export function sumFeeAmounts(lines: Array<{
    currency: string; currencyExponent: number; amount: string; direction: string;
}>): FeeCurrencyAmount[] {
    const sums = new Map<string, { total: bigint; digits: number; exponent: number }>();
    for (const line of lines) {
        const match = /^(\d+)(?:\.(\d+))?$/.exec(line.amount);
        if (!match || !['DEBIT', 'CREDIT'].includes(line.direction)) continue;
        const digits = match[2]?.length || 0;
        const previous = sums.get(line.currency) || { total: 0n, digits: 0, exponent: line.currencyExponent };
        const scale = Math.max(digits, previous.digits);
        const amount = BigInt(match[1] + (match[2] || '').padEnd(scale, '0'));
        const signed = line.direction === 'CREDIT' ? -amount : amount;
        sums.set(line.currency, {
            total: previous.total * 10n ** BigInt(scale - previous.digits) + signed,
            digits: scale,
            exponent: previous.exponent,
        });
    }
    return Array.from(sums, ([currency, { total, digits, exponent }]) => {
        const sign = total < 0n ? '-' : '';
        const absolute = (total < 0n ? -total : total).toString().padStart(digits + 1, '0');
        const amount = digits ? `${sign}${absolute.slice(0, -digits)}.${absolute.slice(-digits)}` : sign + absolute;
        return { currency, currencyExponent: exponent, amount };
    });
}

/** Rejoin fee components and their posted outcome through the immutable fee group. */
export function groupTransactionFeeFacts(facts: TransactionFeeFacts): TransactionFeeGroup[] {
    const groups = new Map<string, TransactionFeeGroup>();
    function group(key: string, category: string, risk?: string, reversal = false) {
        const previous = groups.get(key);
        if (previous) return previous;
        const next: TransactionFeeGroup = {
            key, category, riskServiceType: risk, reversal,
            needsRate: false, clearing: [], settlement: [], amounts: [], final: [],
        };
        groups.set(key, next);
        return next;
    }
    for (const line of facts.clearing) {
        const current = group(line.groupNo || line.detailNo, line.feeCategory,
            line.riskServiceType, line.itemType === 'FEE_REVERSAL');
        current.clearing.push(line);
        current.needsRate ||= line.limitEvaluationStatus === 'PENDING_SETTLEMENT_RATE';
    }
    for (const line of facts.settlement) {
        group(line.groupNo, line.feeCategory).settlement.push(line);
    }
    for (const current of groups.values()) {
        current.final = current.settlement.filter(line => line.resultRole === 'FINANCIAL_COMPONENT'
            && line.batchStatus === 'POSTED');
        current.amounts = sumFeeAmounts(current.final.length ? current.final : current.clearing);
        current.needsRate ||= current.amounts.length > 1;
    }
    return [...groups.values()];
}

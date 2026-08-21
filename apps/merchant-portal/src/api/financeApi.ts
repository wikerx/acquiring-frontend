import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadBlob } from '@/utils/download';

export type DecimalValue = string | number;

export interface FeeTier {
    id: number;
    lowerBound: DecimalValue;
    upperBound?: DecimalValue | null;
    percentageRate: DecimalValue;
    fixedAmountUsd: DecimalValue;
    minimumAmountUsd?: DecimalValue | null;
    maximumAmountUsd?: DecimalValue | null;
}

export interface FeeRule {
    id: number;
    feeCategory: 'TRANSACTION_FEE' | 'REFUND_FEE' | 'RISK_FEE' | 'DISPUTE_FEE' | 'SETTLEMENT_FX_FEE';
    ruleName: string;
    transactionType: string;
    paymentType: string;
    paymentMethod: string;
    transactionTypes?: string[];
    paymentTypes?: string[];
    paymentMethods?: string[];
    riskServiceType?: 'INTERNAL' | 'EXTERNAL' | 'THREE_DS' | 'NONE';
    chargeTrigger?: 'NO_CHARGE' | 'SUCCESS' | 'SUCCESS_OR_FAILURE' | 'ON_CALL' | 'NOT_APPLICABLE';
    feeMode: string;
    percentageRate: DecimalValue;
    fixedAmountUsd: DecimalValue;
    minimumAmountUsd?: DecimalValue | null;
    maximumAmountUsd?: DecimalValue | null;
    tierMetric?: string | null;
    tierPeriod?: string | null;
    tiers: FeeTier[];
}

export interface CurrentFee {
    displayName: string;
    versionNo: number;
    effectiveTime: string;
    reserveRate: DecimalValue;
    reserveDelayDays: number;
    initialDelayUnit: string;
    initialDelayDays: number;
    regularDelayUnit: string;
    regularDelayDays: number;
    settlementFrequency: string;
    frequencyDay?: number | null;
    rules: FeeRule[];
}

export interface CurrencyBalance {
    currency: string;
    amount: DecimalValue;
}

export interface FundAccount {
    id: number;
    accountNo: string;
    settlementCurrency: string;
    availableBalance: DecimalValue;
    reserveBalance: DecimalValue;
    pendingBalances: CurrencyBalance[];
    accountStatus: string;
    reverseRestricted: number;
    creditAllowed: boolean;
    debitAllowed: boolean;
    withdrawalAllowed: boolean;
    settlementAllowed: boolean;
    reverseTransactionAllowed: boolean;
    updateTime: string;
}

export interface DetailQuery extends PageQuery {
    keyword?: string;
    balanceType?: string;
    businessType?: string;
    postedStartTime?: string;
    postedEndTime?: string;
}

export interface FundLedger {
    id: number;
    ledgerNo: string;
    balanceType: string;
    businessType: string;
    summary: string;
    businessNo?: string | null;
    transactionId?: string | null;
    currency: string;
    direction: string;
    amount: DecimalValue;
    balanceBefore: DecimalValue;
    balanceAfter: DecimalValue;
    accountSequence: number;
    operatorName: string;
    reviewerName?: string | null;
    operationReason?: string | null;
    reviewComment?: string | null;
    businessTime: string;
    postedTime: string;
}

export const financeApi = {
    async currentFee() {
        const result = await http.get<CommonResult<CurrentFee | null>>('/merchant/fees/current');
        return unwrapResult(result.data);
    },
    async fundAccount() {
        const result = await http.get<CommonResult<FundAccount>>('/merchant/fund-account');
        return unwrapResult(result.data);
    },
    async ledgers(data: DetailQuery) {
        const result = await http.post<CommonResult<PageResult<FundLedger>>>('/merchant/fund-account/ledgers/search', data);
        return unwrapResult(result.data);
    },
    async exportLedgers(data: DetailQuery) {
        await downloadBlob('/merchant/fund-account/ledgers/export', {
            method: 'post',
            data,
            fileName: 'balance-ledger.xlsx',
        });
    },
};

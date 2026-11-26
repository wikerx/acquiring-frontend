import { readFileSync } from 'node:fs';
import type { TransactionFeeFacts } from '../packages/shared/src/transactionFeeFacts';

type Fixture = { summary: Record<string, string | number | null>; feeFacts: TransactionFeeFacts };

export function transactionFeeFixtures() {
    if (process.env.FEE_QA_DATA_FILE) {
        const fixtures = Object.values(JSON.parse(readFileSync(process.env.FEE_QA_DATA_FILE, 'utf8'))) as Fixture[];
        return { original: fixtures[0], completion: fixtures[1] };
    }
    const transactionDateTime = '2026-11-24T16:09:37.328';
    const sourceAction = { transactionId: 'fee-pre-auth', transactionDateTime, transactionType: 'PRE_AUTHORIZATION' };
    const base = { clearingRevision: 1, clearingStatus: 'CLEARED', settlementStatus: 'SETTLED',
        labelCurrency: 'CAD', platformFeeAmount: null };
    const clearingLine = { groupNo: 'fee-group-1', detailNo: 'clearing-1', itemType: 'PLATFORM_FEE',
        feeCategory: 'TRANSACTION_FEE', componentType: 'PERCENTAGE', direction: 'DEBIT',
        currency: 'CAD', currencyExponent: 2, amount: '11.58000000',
        basisAmount: '503.56000000', basisCurrency: 'CAD', percentageRate: '2.30000000',
        limitEvaluationStatus: 'PENDING_SETTLEMENT_RATE' };
    const finalLine = { groupNo: 'fee-group-1', detailNo: 'clearing-1', batchNo: 'B1', batchStatus: 'POSTED',
        resultRole: 'FINANCIAL_COMPONENT', feeCategory: 'TRANSACTION_FEE', direction: 'DEBIT',
        sourceCurrency: 'USD', sourceAmount: '5.00000000', rate: '1.000000000000',
        currency: 'USD', currencyExponent: 2, amount: '5.00000000', unroundedAmount: '5.00000000000000000000',
        appliedLimit: 'MAXIMUM' };
    const original: Fixture = {
        summary: { ...base, ...sourceAction, grossLabelAmount: '0.00000000' },
        feeFacts: {
            complete: true,
            clearing: [clearingLine, {
                ...clearingLine, groupNo: 'fee-group-2', detailNo: 'clearing-2', feeCategory: 'RISK_FEE',
                riskServiceType: 'INTERNAL', componentType: 'FIXED', currency: 'USD', amount: '0.08000000',
                limitEvaluationStatus: 'NOT_REQUIRED',
            }],
            settlement: [finalLine, {
                ...finalLine, groupNo: 'fee-group-2', feeCategory: 'RISK_FEE', detailNo: 'clearing-2',
                amount: '0.08000000', unroundedAmount: '0.08000000000000000000', appliedLimit: 'NONE',
            }],
        },
    };
    const completion: Fixture = {
        summary: { ...base, transactionId: 'fee-pre-auth-completion', transactionDateTime: '2026-11-24T16:09:38.040',
            transactionType: 'PRE_AUTH_COMPLETION', grossLabelAmount: '485.44000000', reserveAmount: '48.54000000' },
        feeFacts: {
            complete: true, sourceAction,
            clearing: [{ ...clearingLine, feeCategory: 'SETTLEMENT_FX_FEE', amount: '4.85000000',
                basisAmount: '485.44000000', percentageRate: '1.00000000', limitEvaluationStatus: 'NOT_REQUIRED' }],
            settlement: [{ ...finalLine, feeCategory: 'SETTLEMENT_FX_FEE', amount: '3.61000000',
                unroundedAmount: '3.60823332200000000000', appliedLimit: 'NONE' }],
        },
    };
    return { original, completion };
}

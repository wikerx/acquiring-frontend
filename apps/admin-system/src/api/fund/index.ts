import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import type { DecimalValue } from '@/api/fee';
import { downloadExcel } from '@/utils/download';

export interface FundAccountQuery extends PageQuery {
    keyword?: string;
    accountStatus?: string;
    settlementCurrency?: string;
}

export interface FundDetailQuery extends PageQuery {
    keyword?: string;
    merchantId?: string;
    accountNo?: string;
    currency?: string;
    balanceType?: string;
    businessType?: string;
    direction?: string;
    postedStartTime?: string;
    postedEndTime?: string;
}

export interface CurrencyBalance {
    currency: string;
    amount: DecimalValue;
}

export interface FundAccount {
    id: number;
    accountNo: string;
    merchantId: string;
    merchantName?: string | null;
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
    accountVersion: number;
    createTime: string;
    updateTime: string;
}

export interface FundLedger {
    id: number;
    ledgerNo: string;
    ledgerGroupNo?: string | null;
    accountNo?: string | null;
    merchantId: string;
    merchantName?: string | null;
    balanceType: string;
    businessType: string;
    summary: string;
    businessNo?: string | null;
    transactionId?: string | null;
    settlementBatchNo?: string | null;
    feeDetailNo?: string | null;
    currency: string;
    direction: string;
    amount: DecimalValue;
    balanceBefore: DecimalValue;
    balanceAfter: DecimalValue;
    accountSequence: number;
    feeVersionId?: number | null;
    rateSnapshotId?: number | null;
    operationMode: string;
    operatorName: string;
    reviewerName?: string | null;
    operationReason?: string | null;
    reviewComment?: string | null;
    businessTime: string;
    submitTime?: string | null;
    reviewTime?: string | null;
    postedTime: string;
    requestId?: string | null;
    idempotencyKey: string;
    traceId?: string | null;
    reversalOfLedgerId?: number | null;
    rechargeDetail?: FundRecharge | null;
    deductionDetail?: FundDeduction | null;
}

export interface FundRechargeQuery extends PageQuery {
    keyword?: string;
    merchantId?: string;
    rechargeStatus?: string;
}

export interface FundRecharge {
    id: number;
    rechargeNo: string;
    accountId: number;
    accountNo: string;
    merchantId: string;
    merchantName?: string | null;
    currency: string;
    amount: DecimalValue;
    rechargeStatus: string;
    remark: string;
    submitById?: number | null;
    submitByName: string;
    submitTime: string;
    auditById?: number | null;
    auditByName?: string | null;
    auditComment?: string | null;
    auditTime?: string | null;
    recheckById?: number | null;
    recheckByName?: string | null;
    recheckComment?: string | null;
    recheckTime?: string | null;
    rejectById?: number | null;
    rejectByName?: string | null;
    rejectComment?: string | null;
    rejectTime?: string | null;
    requestId: string;
    ledgerNo?: string | null;
    postedTime?: string | null;
    createTime: string;
    updateTime: string;
}

export interface FundRechargeCreateRequest {
    accountId: number;
    amount: DecimalValue;
    requestId: string;
    remark: string;
}

export interface FundDeductionQuery extends PageQuery {
    keyword?: string;
    merchantId?: string;
    deductionCategory?: string;
    deductionStatus?: string;
}

export interface FundDeduction {
    id: number;
    deductionNo: string;
    accountId: number;
    accountNo: string;
    merchantId: string;
    merchantName?: string | null;
    currency: string;
    amount: DecimalValue;
    deductionCategory: string;
    deductionStatus: string;
    reason: string;
    submitById?: number | null;
    submitByName: string;
    submitTime: string;
    auditById?: number | null;
    auditByName?: string | null;
    auditComment?: string | null;
    auditTime?: string | null;
    recheckById?: number | null;
    recheckByName?: string | null;
    recheckComment?: string | null;
    recheckTime?: string | null;
    rejectById?: number | null;
    rejectByName?: string | null;
    rejectComment?: string | null;
    rejectTime?: string | null;
    requestId: string;
    ledgerNo?: string | null;
    postedTime?: string | null;
    createTime: string;
    updateTime: string;
}

export interface FundDeductionCreateRequest {
    accountId: number;
    deductionCategory: string;
    amount: DecimalValue;
    requestId: string;
    reason: string;
}

export interface FundAccountStatusRequest {
    accountVersion: number;
    reason: string;
}

export async function searchFundAccounts(data: FundAccountQuery) {
    const result = await http.post<CommonResult<PageResult<FundAccount>>>('/admin/fund-accounts/search', data);
    return unwrapResult(result.data);
}

export async function exportFundAccounts(data: FundAccountQuery) {
    await downloadExcel('/admin/fund-accounts/export', { data });
}

export async function getFundAccount(id: number) {
    const result = await http.get<CommonResult<FundAccount>>(`/admin/fund-accounts/${id}`);
    return unwrapResult(result.data);
}

export async function searchFundLedgers(id: number, data: FundDetailQuery) {
    const result = await http.post<CommonResult<PageResult<FundLedger>>>(`/admin/fund-accounts/${id}/ledgers/search`, data);
    return unwrapResult(result.data);
}

export async function exportFundLedgers(id: number, data: FundDetailQuery) {
    await downloadExcel(`/admin/fund-accounts/${id}/ledgers/export`, { data });
}

export async function searchAllFundLedgers(data: FundDetailQuery) {
    const result = await http.post<CommonResult<PageResult<FundLedger>>>('/admin/fund-accounts/ledgers/search', data);
    return unwrapResult(result.data);
}

export async function exportAllFundLedgers(data: FundDetailQuery) {
    await downloadExcel('/admin/fund-accounts/ledgers/export', { data });
}

async function changeFundAccountStatus(id: number, action: 'freeze' | 'unfreeze' | 'close' | 'reopen', data: FundAccountStatusRequest) {
    const result = await http.put<CommonResult<FundAccount>>(`/admin/fund-accounts/${id}/${action}`, data);
    return unwrapResult(result.data);
}

export function freezeFundAccount(id: number, data: FundAccountStatusRequest) {
    return changeFundAccountStatus(id, 'freeze', data);
}

export function unfreezeFundAccount(id: number, data: FundAccountStatusRequest) {
    return changeFundAccountStatus(id, 'unfreeze', data);
}

export function closeFundAccount(id: number, data: FundAccountStatusRequest) {
    return changeFundAccountStatus(id, 'close', data);
}

export function reopenFundAccount(id: number, data: FundAccountStatusRequest) {
    return changeFundAccountStatus(id, 'reopen', data);
}

export async function searchFundRecharges(data: FundRechargeQuery) {
    const result = await http.post<CommonResult<PageResult<FundRecharge>>>('/admin/fund-accounts/recharges/search', data);
    return unwrapResult(result.data);
}

export async function createFundRecharge(data: FundRechargeCreateRequest) {
    const result = await http.post<CommonResult<FundRecharge>>('/admin/fund-accounts/recharges', data);
    return unwrapResult(result.data);
}

export async function auditFundRecharge(id: number, comment?: string) {
    const result = await http.post<CommonResult<FundRecharge>>(`/admin/fund-accounts/recharges/${id}/audit`, { comment });
    return unwrapResult(result.data);
}

export async function recheckFundRecharge(id: number, comment?: string) {
    const result = await http.post<CommonResult<FundRecharge>>(`/admin/fund-accounts/recharges/${id}/recheck`, { comment });
    return unwrapResult(result.data);
}

export async function rejectFundRecharge(id: number, comment: string) {
    const result = await http.post<CommonResult<FundRecharge>>(`/admin/fund-accounts/recharges/${id}/reject`, { comment });
    return unwrapResult(result.data);
}

export async function exportFundRecharges(data: FundRechargeQuery) {
    await downloadExcel('/admin/fund-accounts/recharges/export', { data });
}

export async function searchFundDeductions(data: FundDeductionQuery) {
    const result = await http.post<CommonResult<PageResult<FundDeduction>>>('/admin/fund-accounts/deductions/search', data);
    return unwrapResult(result.data);
}

export async function getFundDeduction(id: number) {
    const result = await http.get<CommonResult<FundDeduction>>(`/admin/fund-accounts/deductions/${id}`);
    return unwrapResult(result.data);
}

export async function createFundDeduction(data: FundDeductionCreateRequest) {
    const result = await http.post<CommonResult<FundDeduction>>('/admin/fund-accounts/deductions', data);
    return unwrapResult(result.data);
}

export async function auditFundDeduction(id: number, comment?: string) {
    const result = await http.post<CommonResult<FundDeduction>>(`/admin/fund-accounts/deductions/${id}/audit`, { comment });
    return unwrapResult(result.data);
}

export async function recheckFundDeduction(id: number, comment?: string) {
    const result = await http.post<CommonResult<FundDeduction>>(`/admin/fund-accounts/deductions/${id}/recheck`, { comment });
    return unwrapResult(result.data);
}

export async function rejectFundDeduction(id: number, comment: string) {
    const result = await http.post<CommonResult<FundDeduction>>(`/admin/fund-accounts/deductions/${id}/reject`, { comment });
    return unwrapResult(result.data);
}

export async function exportFundDeductions(data: FundDeductionQuery) {
    await downloadExcel('/admin/fund-accounts/deductions/export', { data });
}

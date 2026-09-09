import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

export type DecimalValue = string | number;

export interface FeePlanQuery extends PageQuery {
    keyword?: string;
    status?: string;
    versionStatus?: string;
}

export interface FeeRuleTierInput {
    lowerBound: DecimalValue;
    upperBound?: DecimalValue | null;
    percentageRate: DecimalValue;
    fixedAmountUsd: DecimalValue;
    minimumAmountUsd?: DecimalValue | null;
    maximumAmountUsd?: DecimalValue | null;
    sortNo?: number;
}

export interface FeeRuleInput {
    feeCategory: 'TRANSACTION_FEE' | 'REFUND_FEE' | 'RISK_FEE' | 'DISPUTE_FEE' | 'SETTLEMENT_PROCESSING_FEE' | 'SETTLEMENT_FX_FEE';
    ruleName?: string;
    /** Compatibility scalar fields; batch arrays take precedence in the backend. */
    transactionType?: string;
    paymentType?: string;
    paymentMethod?: string;
    transactionTypes: string[];
    paymentTypes: string[];
    paymentMethods: string[];
    riskServiceType?: 'INTERNAL' | 'EXTERNAL' | 'THREE_DS' | 'NONE' | null;
    chargeTrigger?: 'NO_CHARGE' | 'SUCCESS' | 'SUCCESS_OR_FAILURE' | 'ON_CALL' | 'NOT_APPLICABLE' | null;
    feeMode: 'STANDARD' | 'TIER';
    percentageRate: DecimalValue;
    fixedAmountUsd: DecimalValue;
    minimumAmountUsd?: DecimalValue | null;
    maximumAmountUsd?: DecimalValue | null;
    tierMetric?: 'COUNT' | 'AMOUNT' | null;
    tierPeriod?: 'MONTH' | null;
    sortNo?: number;
    remark?: string;
    tiers: FeeRuleTierInput[];
}

export interface FeeVersionInput {
    reserveRate: DecimalValue;
    reserveDelayUnit: 'T' | 'D';
    reserveDelayDays: number;
    settlementCurrency?: string | null;
    initialDelayUnit: 'T' | 'D';
    initialDelayDays: number;
    regularDelayUnit: 'T' | 'D';
    regularDelayDays: number;
    settlementFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    frequencyDay?: number | null;
    changeReason: string;
    rules: FeeRuleInput[];
}

export interface FeeTemplateCreateInput extends FeeVersionInput {
    planName: string;
    remark?: string;
}

export interface MerchantFeeVersionInput extends FeeVersionInput {
    templateId?: number | null;
    planName?: string;
    remark?: string;
}

/** Copy-only template assignment payload. Template rules are always resolved by the backend. */
export interface MerchantTemplateAssignInput {
    templateId: number;
    changeReason: string;
    settlementCurrency?: string;
    planName?: string;
    remark?: string;
}

export interface FeeRuleTier extends FeeRuleTierInput {
    id: number;
}

export interface FeeRule extends Omit<FeeRuleInput,
    'ruleName' | 'transactionType' | 'paymentType' | 'paymentMethod'
    | 'transactionTypes' | 'paymentTypes' | 'paymentMethods'> {
    id: number;
    ruleName: string;
    transactionType: string;
    paymentType: string;
    paymentMethod: string;
    transactionTypes?: string[];
    paymentTypes?: string[];
    paymentMethods?: string[];
    tiers: FeeRuleTier[];
}

export interface FeeVersion {
    id: number;
    planId: number;
    versionNo: number;
    versionStatus: string;
    changeType: string;
    sourceTemplateId?: number | null;
    sourceTemplateVersionNo?: number | null;
    originType: string;
    reserveRate: DecimalValue;
    reserveDelayUnit: 'T' | 'D';
    reserveDelayDays: number;
    settlementCurrency?: string | null;
    initialDelayUnit: 'T' | 'D';
    initialDelayDays: number;
    regularDelayUnit: 'T' | 'D';
    regularDelayDays: number;
    settlementFrequency: string;
    frequencyDay?: number | null;
    changeReason: string;
    submitById?: number | null;
    submitByName: string;
    submitTime: string;
    reviewById?: number | null;
    reviewByName?: string | null;
    reviewComment?: string | null;
    reviewTime?: string | null;
    effectiveTime?: string | null;
    supersededTime?: string | null;
    rules: FeeRule[];
}

export interface FeePlanSummary {
    id?: number | null;
    planCode?: string | null;
    planName?: string | null;
    planType: string;
    merchantId?: string | null;
    merchantName?: string | null;
    settlementCurrency?: string | null;
    sourceTemplateId?: number | null;
    sourceTemplateVersionNo?: number | null;
    originType?: string | null;
    currentVersionId?: number | null;
    currentVersionNo?: number | null;
    status: string;
    remark?: string | null;
    pendingVersionId?: number | null;
    pendingVersionNo?: number | null;
    pendingVersionStatus?: string | null;
    pendingSubmitById?: number | null;
    createTime?: string | null;
    updateTime?: string | null;
}

export interface FeePlanDetail extends FeePlanSummary {
    currentVersion?: FeeVersion | null;
    versions: FeeVersion[];
}

export interface FeeReview {
    versionId: number;
    planId: number;
    planCode: string;
    planName: string;
    planType: string;
    merchantId?: string | null;
    merchantName?: string | null;
    versionNo: number;
    changeType: string;
    changeReason: string;
    submitByName: string;
    submitTime: string;
}

export interface FeeSimulationInput {
    merchantId: string;
    feeCategory: 'TRANSACTION_FEE' | 'REFUND_FEE' | 'RISK_FEE' | 'DISPUTE_FEE';
    transactionType: string;
    paymentType: string;
    paymentMethod: string;
    riskServiceType?: 'INTERNAL' | 'EXTERNAL' | 'THREE_DS' | 'NONE';
    riskServiceTypes: Array<'INTERNAL' | 'EXTERNAL' | 'THREE_DS'>;
    labelAmount: DecimalValue;
    labelCurrency: string;
    monthlyCountBefore: number;
    monthlyAmountUsdBefore: DecimalValue;
}

export interface FeeSimulationDetail {
    lineNo: number;
    itemType: 'FEE' | 'RESERVE';
    feeCategory: 'TRANSACTION_FEE' | 'REFUND_FEE' | 'RISK_FEE' | 'DISPUTE_FEE' | 'SETTLEMENT_PROCESSING_FEE' | 'SETTLEMENT_FX_FEE' | 'RESERVE';
    calculationStatus: 'CALCULATED' | 'NOT_APPLICABLE' | 'NOT_CONFIGURED';
    includedInFeeTotal: boolean;
    riskServiceType: 'INTERNAL' | 'EXTERNAL' | 'THREE_DS' | 'NONE';
    chargeTrigger: 'NO_CHARGE' | 'SUCCESS' | 'SUCCESS_OR_FAILURE' | 'ON_CALL' | 'NOT_APPLICABLE';
    ruleName?: string | null;
    feeMode?: 'STANDARD' | 'TIER' | null;
    matchedRuleId?: number | null;
    matchedTierId?: number | null;
    percentageFeeLabel?: DecimalValue | null;
    percentageFeeCurrency?: string | null;
    rawFeeUsd?: DecimalValue | null;
    finalFeeUsd?: DecimalValue | null;
    appliedLimit: string;
    formulaSnapshot?: string | null;
}

export interface FeeSimulationResult {
    simulationNo: string;
    planVersionId: number;
    matchedRuleId: number;
    matchedTierId?: number | null;
    percentageFeeLabel: DecimalValue;
    percentageFeeCurrency: string;
    rawFeeUsd: DecimalValue;
    finalFeeUsd: DecimalValue;
    labelAmountUsd: DecimalValue;
    reserveRate: DecimalValue;
    reserveAmountLabel: DecimalValue;
    reserveAmountCurrency: string;
    reserveAmountUsd: DecimalValue;
    estimatedNetSettlementUsd: DecimalValue;
    feeCurrency: 'USD';
    appliedLimit: string;
    labelToUsdRate: DecimalValue;
    settlementRateId?: number | null;
    settlementRateSource: string;
    rateEffectiveTime: string;
    rateValuationTime: string;
    formulaSnapshot: string;
    feeTotalFormulaSnapshot: string;
    netSettlementFormulaSnapshot: string;
    feeDetails: FeeSimulationDetail[];
}

export interface FeeSimulationRecordQuery extends PageQuery {
    keyword?: string;
    merchantId?: string;
    transactionType?: string;
}

export interface FeeSimulationRecord {
    id: number;
    simulationNo: string;
    planVersionId: number;
    merchantId?: string | null;
    feeCategory: string;
    transactionType: string;
    paymentType: string;
    paymentMethod: string;
    riskServiceType: 'INTERNAL' | 'EXTERNAL' | 'THREE_DS' | 'NONE';
    labelAmount: DecimalValue;
    labelCurrency: string;
    labelToUsdRate: DecimalValue;
    labelAmountUsd: DecimalValue;
    settlementRateId?: number | null;
    settlementRateSource: string;
    rateEffectiveTime?: string | null;
    rateValuationTime?: string | null;
    matchedRuleId: number;
    matchedTierId?: number | null;
    rawFeeUsd: DecimalValue;
    finalFeeUsd: DecimalValue;
    reserveRate: DecimalValue;
    reserveAmountLabel: DecimalValue;
    reserveAmountCurrency: string;
    reserveAmountUsd: DecimalValue;
    estimatedNetSettlementUsd: DecimalValue;
    formulaSnapshot: string;
    netSettlementFormulaSnapshot: string;
    detailSnapshotStatus: 'COMPLETE' | 'LEGACY_INCOMPLETE';
    riskServiceTypes: Array<'INTERNAL' | 'EXTERNAL' | 'THREE_DS'>;
    feeDetails: FeeSimulationDetail[];
    operatorName: string;
    createTime: string;
}

export async function searchFeeTemplates(data: FeePlanQuery) {
    const result = await http.post<CommonResult<PageResult<FeePlanSummary>>>('/admin/fees/templates/search', data);
    return unwrapResult(result.data);
}

export async function exportFeeTemplates(data: FeePlanQuery) {
    await downloadExcel('/admin/fees/templates/export', { data });
}

export async function getFeeTemplate(id: number) {
    const result = await http.get<CommonResult<FeePlanDetail>>(`/admin/fees/templates/${id}`);
    return unwrapResult(result.data);
}

export async function createFeeTemplate(data: FeeTemplateCreateInput) {
    const result = await http.post<CommonResult<FeePlanDetail>>('/admin/fees/templates', data);
    return unwrapResult(result.data);
}

export async function createFeeTemplateVersion(id: number, data: FeeVersionInput) {
    const result = await http.post<CommonResult<FeePlanDetail>>(`/admin/fees/templates/${id}/versions`, data);
    return unwrapResult(result.data);
}

export async function updateFeeTemplateDraft(planId: number, versionId: number, data: FeeVersionInput) {
    const result = await http.put<CommonResult<FeePlanDetail>>(
        `/admin/fees/templates/${planId}/versions/${versionId}`,
        data,
    );
    return unwrapResult(result.data);
}

export async function submitFeeTemplateVersion(versionId: number) {
    const result = await http.put<CommonResult<FeePlanDetail>>(`/admin/fees/versions/${versionId}/submit`);
    return unwrapResult(result.data);
}

export async function withdrawFeeTemplateVersion(versionId: number) {
    const result = await http.put<CommonResult<FeePlanDetail>>(`/admin/fees/versions/${versionId}/withdraw`);
    return unwrapResult(result.data);
}

export async function updateFeeTemplateStatus(id: number, enabled: boolean) {
    const result = await http.put<CommonResult<void>>(`/admin/fees/templates/${id}/status`, { enabled });
    return unwrapResult(result.data);
}

export async function archiveFeeTemplate(id: number) {
    const result = await http.put<CommonResult<void>>(`/admin/fees/templates/${id}/archive`);
    return unwrapResult(result.data);
}

export async function searchMerchantFees(data: FeePlanQuery) {
    const result = await http.post<CommonResult<PageResult<FeePlanSummary>>>('/admin/fees/merchants/search', data);
    return unwrapResult(result.data);
}

export async function exportMerchantFees(data: FeePlanQuery) {
    await downloadExcel('/admin/fees/merchants/export', { data });
}

export async function getMerchantFee(merchantId: string) {
    const result = await http.get<CommonResult<FeePlanDetail | null>>(`/admin/fees/merchants/${encodeURIComponent(merchantId)}`);
    return unwrapResult(result.data);
}

export async function assignMerchantFeeTemplate(merchantId: string, data: MerchantTemplateAssignInput) {
    const result = await http.post<CommonResult<FeePlanDetail>>(
        `/admin/fees/merchants/${encodeURIComponent(merchantId)}/template-versions`,
        data,
    );
    return unwrapResult(result.data);
}

export async function createMerchantCustomFeeVersion(merchantId: string, data: MerchantFeeVersionInput) {
    const result = await http.post<CommonResult<FeePlanDetail>>(
        `/admin/fees/merchants/${encodeURIComponent(merchantId)}/custom-versions`,
        data,
    );
    return unwrapResult(result.data);
}

export async function searchFeeReviews(data: FeePlanQuery) {
    const result = await http.post<CommonResult<PageResult<FeeReview>>>('/admin/fees/reviews/search', data);
    return unwrapResult(result.data);
}

export async function exportFeeReviews(data: FeePlanQuery) {
    await downloadExcel('/admin/fees/reviews/export', { data });
}

export async function approveFeeVersion(versionId: number, reviewComment?: string) {
    const result = await http.put<CommonResult<FeePlanDetail>>(`/admin/fees/versions/${versionId}/approve`, { reviewComment });
    return unwrapResult(result.data);
}

export async function rejectFeeVersion(versionId: number, reviewComment: string) {
    const result = await http.put<CommonResult<FeePlanDetail>>(`/admin/fees/versions/${versionId}/reject`, { reviewComment });
    return unwrapResult(result.data);
}

export async function simulateFee(data: FeeSimulationInput) {
    const result = await http.post<CommonResult<FeeSimulationResult>>('/admin/fees/simulations', data);
    return unwrapResult(result.data);
}

export async function searchSimulationRecords(data: FeeSimulationRecordQuery) {
    const result = await http.post<CommonResult<PageResult<FeeSimulationRecord>>>('/admin/fees/simulation-records/search', data);
    return unwrapResult(result.data);
}

export async function exportSimulationRecords(data: FeeSimulationRecordQuery) {
    await downloadExcel('/admin/fees/simulation-records/export', { data });
}

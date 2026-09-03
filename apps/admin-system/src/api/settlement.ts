/** Admin 结算接口契约：查询走 service-admin 本地逻辑数据源，状态命令由后端可信身份编排，前端不得直连 service-settlement。 */
import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

export interface SettlementProfileQuery extends PageQuery {
    settlementProfileNo?: string;
    merchantId?: string;
    targetCurrency?: string;
    processingMode?: string;
    profileStatus?: string;
}

export interface SettlementProfile {
    id: number;
    settlementProfileNo: string;
    merchantId: string;
    merchantName?: string;
    settlementAccountId: number;
    settlementAccountNo?: string;
    settlementAccountStatus?: string;
    targetCurrency: string;
    targetCurrencyExponent: number;
    businessTimeZone: string;
    dailyCutoffTime: string;
    processingMode: string;
    profileStatus: string;
    effectiveDate: string;
    expireDate?: string;
    version: number;
    createTime: string;
    updateTime: string;
}

export interface SettlementProfileUpdateRequest {
    processingMode: string;
    businessTimeZone: string;
    dailyCutoffTime: string;
    expectedVersion: number;
}

export interface SettlementCandidateQuery extends PageQuery {
    candidateNo?: string;
    merchantId?: string;
    sourceTransactionId?: string;
    merchantOrderNo?: string;
    beginTransactionTime?: string;
    endTransactionTime?: string;
    paymentType?: string;
    paymentMethod?: string;
    transactionType?: string;
    labelCurrency?: string;
    targetCurrency?: string;
    sourceRevision?: number;
    reserveNo?: string;
    reserveStatus?: string;
    beginExpectedReleaseDate?: string;
    endExpectedReleaseDate?: string;
    due?: boolean;
    frozen?: boolean;
    minRemainingAmount?: string;
    maxRemainingAmount?: string;
    candidateStatus?: string;
    beginEligibleDate: string;
    endEligibleDate: string;
}

export interface SettlementCandidate {
    id: number;
    candidateNo: string;
    sourceType: string;
    sourceBusinessId: string;
    sourceRevision: number;
    sourceTransactionId?: string;
    sourceTransactionDateTime?: string;
    merchantId: string;
    merchantName?: string;
    merchantOrderNo?: string;
    paymentType?: string;
    paymentMethod?: string;
    transactionType?: string;
    labelCurrency?: string;
    labelAmount?: number | string;
    labelCurrencyExponent?: number;
    grossLabelAmount?: number | string;
    platformFeeAmount?: number | string;
    reserveAmount?: number | string;
    netSettlementAmount?: number | string;
    feeEvaluationStatus?: string;
    reserveActionType?: string;
    reserveDirection?: string;
    reserveActionAmount?: number | string;
    reserveNo?: string;
    reserveStatus?: string;
    expectedReserveReleaseDate?: string;
    remainingAmount?: number | string;
    settlementProfileId: number;
    targetCurrency: string;
    targetCurrencyExponent: number;
    settlementEligibleDate: string;
    candidateStatus: string;
    settlementBatchNo?: string;
    reviewOrderNo?: string;
    shadowMode: number;
    claimedTime?: string;
    postedTime?: string;
    version: number;
    createTime: string;
    updateTime: string;
}

export interface SettlementReviewQuery extends PageQuery {
    reviewOrderNo?: string;
    merchantId?: string;
    reviewType?: string;
    reviewStatus?: string;
    beginBusinessDate: string;
    endBusinessDate: string;
}

export interface SettlementReview {
    id: number;
    reviewOrderNo: string;
    reviewType: string;
    createMode: string;
    merchantId: string;
    settlementProfileId: number;
    settlementAccountId: number;
    targetCurrency: string;
    targetCurrencyExponent: number;
    businessDate: string;
    businessTimeZone: string;
    candidateCount: number;
    projectableCandidateCount: number;
    netDirection: string;
    netAmount: number | string;
    reviewStatus: string;
    submittedByAccountId?: number;
    submittedByAccountName?: string;
    submitReason?: string;
    submittedTime?: string;
    decidedByAccountId?: number;
    decidedByAccountName?: string;
    decisionAction?: string;
    reviewComment?: string;
    decisionTime?: string;
    settlementBatchNo?: string;
    version: number;
    createTime: string;
    updateTime: string;
}

export interface SettlementReviewCandidate {
    reviewCandidateNo: string;
    candidateId: number;
    candidateNo: string;
    sourceType: string;
    sourceBusinessId: string;
    sourceRevision: number;
    sourceTransactionId?: string;
    sourceTransactionDateTime?: string;
    relationStatus: string;
    lockedTime?: string;
    consumedTime?: string;
    releasedTime?: string;
}

export interface SettlementReviewRate {
    sourceCurrency: string;
    targetCurrency: string;
    directRate: number | string;
    sourceCurrencyExponent: number;
    targetCurrencyExponent: number;
    rateSource: string;
    quoteId?: string;
    sourceQuoteDirection?: string;
    effectiveTime?: string;
    lockedTime?: string;
}

export interface SettlementSummaryLine {
    paymentType?: string;
    paymentMethod?: string;
    transactionType?: string;
    resultItemType: string;
    feeCategory?: string;
    direction: string;
    sourceCurrency: string;
    sourceCurrencyExponent: number;
    targetCurrency: string;
    targetCurrencyExponent: number;
    transactionCount: number;
    sourceAmount: number | string;
    targetAmount: number | string;
}

export interface SettlementReviewDetail {
    review: SettlementReview;
    candidates: SettlementReviewCandidate[];
    rates: SettlementReviewRate[];
    summaries: SettlementSummaryLine[];
}

export interface SettlementReviewSubmitRequest {
    requestKey: string;
    reviewType: string;
    businessDate: string;
    cutoffBeginTime: string;
    cutoffEndTime: string;
    candidates: Array<{ candidateId: number; expectedVersion: number }>;
    reason: string;
}

export interface SettlementDecisionRequest {
    requestKey: string;
    expectedVersion: number;
    comment: string;
}

export interface SettlementReviewCommandResponse {
    reviewOrderNo: string;
    reviewStatus: string;
    settlementBatchNo?: string;
    candidateCount: number;
    targetCurrency: string;
    targetCurrencyExponent: number;
    netDirection: string;
    netAmount: number | string;
    version: number;
}

export interface SettlementReversalQuery extends PageQuery {
    reversalOrderNo?: string;
    originalBatchNo?: string;
    merchantId?: string;
    reversalStatus?: string;
    beginSubmittedDate: string;
    endSubmittedDate: string;
}

export interface SettlementReversal {
    id: number;
    reversalOrderNo: string;
    originalBatchNo: string;
    reversalBatchNo?: string;
    merchantId: string;
    settlementAccountId: number;
    targetCurrency: string;
    targetCurrencyExponent: number;
    netDirection: string;
    netAmount: number | string;
    reversalStatus: string;
    submittedByAccountId?: number;
    submittedByAccountName?: string;
    submitReason?: string;
    submittedTime?: string;
    decidedByAccountId?: number;
    decidedByAccountName?: string;
    decisionAction?: string;
    decisionComment?: string;
    decisionTime?: string;
    version: number;
    createTime: string;
    updateTime: string;
}

export interface SettlementReversalDetail {
    reversal: SettlementReversal;
    sourceFingerprint?: string;
    originalBatchVersion?: number;
    originalNetResultItemId?: number;
    originalFundLedgerId?: number;
    submittedRoleSnapshot?: string;
    submitClientIp?: string;
    submitUserAgent?: string;
    decidedRoleSnapshot?: string;
    decisionClientIp?: string;
    decisionUserAgent?: string;
}

export interface SettlementReversalSubmitRequest {
    requestKey: string;
    originalBatchNo: string;
    expectedBatchVersion: number;
    reason: string;
}

export interface SettlementReversalCommandResponse {
    reversalOrderNo: string;
    reversalStatus: string;
    originalBatchNo: string;
    reversalBatchNo?: string;
    merchantId: string;
    currency: string;
    netDirection: string;
    netAmount: number | string;
    version: number;
}

export interface SettlementResultItemQuery extends PageQuery {
    settlementBatchNo?: string;
    merchantId?: string;
    sourceTransactionId?: string;
    resultItemType?: string;
    resultRole?: string;
    direction?: string;
    targetCurrency?: string;
    sourceDetailType?: 'TRANSACTION_CLEARING' | 'RESERVE_CLEARING';
    beginBusinessDate: string;
    endBusinessDate: string;
}

export interface SettlementReserveItemQuery extends PageQuery {
    settlementBatchNo?: string;
    merchantId?: string;
    reserveNo?: string;
    sourceTransactionId?: string;
    actionType?: string;
    currency?: string;
    beginBusinessDate: string;
    endBusinessDate: string;
}

export interface SettlementReserveItem {
    actionId: number;
    reserveActionNo: string;
    reserveItemId: number;
    reserveNo: string;
    settlementBatchNo?: string;
    businessDate: string;
    merchantId: string;
    accountId: number;
    sourceTransactionId?: string;
    sourceTransactionDateTime?: string;
    sourceBusinessNo?: string;
    sourceReserveDetailNo?: string;
    actionType: string;
    direction: string;
    currency: string;
    currencyExponent: number;
    amount: number | string;
    retainedAmount: number | string;
    returnedAmount: number | string;
    releasedAmount: number | string;
    debitAdjustmentAmount: number | string;
    creditAdjustmentAmount: number | string;
    reversedAmount: number | string;
    remainingAmount: number | string;
    reserveStatus: string;
    expectedReleaseDate?: string;
    actionTime: string;
}

export interface SettlementResultItem {
    id: number;
    settlementResultItemNo: string;
    settlementBatchNo: string;
    candidateId?: number;
    resultLineNo: number;
    merchantId: string;
    settlementAccountId: number;
    sourceDetailType: string;
    sourceDetailNo?: string;
    reversalOfResultItemId?: number;
    sourceTransactionId?: string;
    sourceTransactionDateTime?: string;
    feeGroupNo?: string;
    resultItemType: string;
    resultRole: string;
    paymentType?: string;
    paymentMethod?: string;
    transactionType?: string;
    feeCategory?: string;
    direction: string;
    sourceAmount: number | string;
    sourceCurrency: string;
    sourceCurrencyExponent: number;
    settlementBatchRateId: number;
    directRate: number | string;
    unroundedTargetAmount: number | string;
    targetAmount: number | string;
    targetCurrency: string;
    targetCurrencyExponent: number;
    appliedLimit: string;
    minimumTargetAmount?: number | string;
    maximumTargetAmount?: number | string;
    roundingMode: string;
    formulaSnapshot: string;
    ledgerIdempotencyKey?: string;
    businessDate: string;
    createTime: string;
}

export interface SettlementPostingQuery extends PageQuery {
    settlementBatchNo?: string;
    merchantId?: string;
    ledgerNo?: string;
    direction?: string;
    operationMode?: string;
    currency?: string;
    beginPostedTime: string;
    endPostedTime: string;
}

export interface SettlementPosting {
    id: number;
    ledgerNo: string;
    ledgerGroupNo: string;
    accountId: number;
    merchantId: string;
    businessType: string;
    summary: string;
    businessNo: string;
    settlementBatchNo: string;
    currency: string;
    currencyExponent: number;
    direction: string;
    amount: number | string;
    balanceBefore: number | string;
    balanceAfter: number | string;
    accountSequence: number;
    operationMode: string;
    operatorId?: number;
    operatorName?: string;
    reviewerId?: number;
    reviewerName?: string;
    operationReason?: string;
    reviewComment?: string;
    businessTime?: string;
    submitTime?: string;
    reviewTime?: string;
    postedTime: string;
    requestId?: string;
    idempotencyKey: string;
    reversalOfLedgerId?: number;
    createTime: string;
}

export async function searchSettlementCandidates(kind: 'transaction' | 'reserve', data: SettlementCandidateQuery) {
    const result = await http.post<CommonResult<PageResult<SettlementCandidate>>>(
        `/admin/settlement/${kind}-candidates/search`, data,
    );
    return unwrapResult(result.data);
}

export async function getSettlementCandidate(kind: 'transaction' | 'reserve', candidateNo: string) {
    const result = await http.get<CommonResult<SettlementCandidate>>(
        `/admin/settlement/${kind}-candidates/${encodeURIComponent(candidateNo)}`,
    );
    return unwrapResult(result.data);
}

export async function submitSettlementReview(kind: 'transaction' | 'reserve', data: SettlementReviewSubmitRequest) {
    const result = await http.post<CommonResult<SettlementReviewCommandResponse>>(
        `/admin/settlement/${kind}-review-orders`, data,
    );
    return unwrapResult(result.data);
}

export async function searchSettlementReviews(data: SettlementReviewQuery) {
    const result = await http.post<CommonResult<PageResult<SettlementReview>>>(
        '/admin/settlement/review-orders/search', data,
    );
    return unwrapResult(result.data);
}

export async function getSettlementReview(reviewOrderNo: string) {
    const result = await http.get<CommonResult<SettlementReviewDetail>>(
        `/admin/settlement/review-orders/${encodeURIComponent(reviewOrderNo)}`,
    );
    return unwrapResult(result.data);
}

export async function decideSettlementReview(
    reviewOrderNo: string,
    action: 'approve' | 'reject' | 'cancel',
    data: SettlementDecisionRequest,
) {
    const result = await http.post<CommonResult<SettlementReviewCommandResponse>>(
        `/admin/settlement/review-orders/${encodeURIComponent(reviewOrderNo)}/${action}`, data,
    );
    return unwrapResult(result.data);
}

export async function exportSettlementReviews(data: SettlementReviewQuery) {
    await downloadExcel('/admin/settlement/review-orders/export', { data });
}

export async function searchSettlementReversals(data: SettlementReversalQuery) {
    const result = await http.post<CommonResult<PageResult<SettlementReversal>>>(
        '/admin/settlement/reversal-orders/search', data,
    );
    return unwrapResult(result.data);
}

export async function getSettlementReversal(reversalOrderNo: string) {
    const result = await http.get<CommonResult<SettlementReversalDetail>>(
        `/admin/settlement/reversal-orders/${encodeURIComponent(reversalOrderNo)}`,
    );
    return unwrapResult(result.data);
}

export async function submitSettlementReversal(data: SettlementReversalSubmitRequest) {
    const result = await http.post<CommonResult<SettlementReversalCommandResponse>>(
        '/admin/settlement/reversal-orders', data,
    );
    return unwrapResult(result.data);
}

export async function decideSettlementReversal(
    reversalOrderNo: string,
    action: 'approve' | 'reject',
    data: SettlementDecisionRequest,
) {
    const result = await http.post<CommonResult<SettlementReversalCommandResponse>>(
        `/admin/settlement/reversal-orders/${encodeURIComponent(reversalOrderNo)}/${action}`, data,
    );
    return unwrapResult(result.data);
}

export async function searchSettlementResultItems(data: SettlementResultItemQuery) {
    const result = await http.post<CommonResult<PageResult<SettlementResultItem>>>(
        '/admin/settlement/result-items/search', data,
    );
    return unwrapResult(result.data);
}

export async function exportSettlementResultItems(data: SettlementResultItemQuery) {
    await downloadExcel('/admin/settlement/result-items/export', { data });
}

export async function searchSettlementReserveItems(data: SettlementReserveItemQuery) {
    const result = await http.post<CommonResult<PageResult<SettlementReserveItem>>>(
        '/admin/settlement/reserve-items/search', data,
    );
    return unwrapResult(result.data);
}

export async function exportSettlementReserveItems(data: SettlementReserveItemQuery) {
    await downloadExcel('/admin/settlement/reserve-items/export', { data });
}

export async function searchSettlementPostings(data: SettlementPostingQuery) {
    const result = await http.post<CommonResult<PageResult<SettlementPosting>>>(
        '/admin/settlement/postings/search', data,
    );
    return unwrapResult(result.data);
}

export async function exportSettlementPostings(data: SettlementPostingQuery) {
    await downloadExcel('/admin/settlement/postings/export', { data });
}

export async function searchSettlementProfiles(data: SettlementProfileQuery) {
    const result = await http.post<CommonResult<PageResult<SettlementProfile>>>(
        '/admin/settlement/profiles/search', data,
    );
    return unwrapResult(result.data);
}

export async function getSettlementProfile(settlementProfileNo: string) {
    const result = await http.get<CommonResult<SettlementProfile>>(
        `/admin/settlement/profiles/${encodeURIComponent(settlementProfileNo)}`,
    );
    return unwrapResult(result.data);
}

export async function updateSettlementProfile(
    settlementProfileNo: string,
    data: SettlementProfileUpdateRequest,
) {
    const result = await http.put<CommonResult<SettlementProfile>>(
        `/admin/settlement/profiles/${encodeURIComponent(settlementProfileNo)}`, data,
    );
    return unwrapResult(result.data);
}

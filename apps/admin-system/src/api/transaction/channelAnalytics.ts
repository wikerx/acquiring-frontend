import { unwrapResult, type CommonResult, type PageResult, type TransactionAnalyticsQuery } from '@acquiring/shared';
import { http } from '@/api/http';

export type ChannelAnalyticsQuery = TransactionAnalyticsQuery & { channelCode?: string };

export interface ChannelDiagnosisQuery extends ChannelAnalyticsQuery {
    channelCode: string;
    groupPaymentMethod: string;
    groupPaymentBrand: string;
}

export interface ChannelOutcome {
    totalCount: number;
    completedCount: number;
    successCount: number;
    failedCount: number;
    successRate: number | string | null;
}

export interface ChannelCohort {
    transactions: ChannelOutcome;
    requests: ChannelOutcome;
}

export interface ChannelPaymentMetric {
    channelCode: string;
    paymentMethod: string;
    paymentBrand: string;
    selected: ChannelCohort;
    comparison?: ChannelCohort | null;
}

export interface ChannelBreakdown {
    rows: ChannelPaymentMetric[];
    comparisonAvailable: boolean;
}

interface ChannelCountMetric {
    key: string;
    totalCount: number;
    percentage: number | string;
}

export interface ChannelDiagnosis {
    trend: Array<{ date: string; selected: ChannelCohort; comparison?: ChannelCohort | null }>;
    failureReasons: Array<ChannelCountMetric & { category: string }>;
    responseCodes: ChannelCountMetric[];
}

export interface ChannelFailedTransaction {
    transactionId: string;
    transactionDateTime: string;
    merchantId: string;
    merchantOrderNo: string;
    reasonCode: string;
}

const channelsPath = '/admin/transactions/analytics/channels';

export async function getChannelBreakdown(query: ChannelAnalyticsQuery) {
    const { data } = await http.post<CommonResult<ChannelBreakdown>>(`${channelsPath}/breakdown`, query);
    return unwrapResult(data);
}

export async function getChannelDiagnosis(query: ChannelDiagnosisQuery) {
    const { data } = await http.post<CommonResult<ChannelDiagnosis>>(`${channelsPath}/diagnosis`, query);
    return unwrapResult(data);
}

export async function getChannelFailedTransactions(query: ChannelDiagnosisQuery & { pageNo: number; pageSize: number; reasonCode?: string }) {
    const { data } = await http.post<CommonResult<PageResult<ChannelFailedTransaction>>>(`${channelsPath}/failures`, query);
    return unwrapResult(data);
}

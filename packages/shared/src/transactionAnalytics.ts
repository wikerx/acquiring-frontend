export interface TransactionAnalyticsQuery {
    beginTime: string;
    endTime: string;
    merchantId?: string;
    merchantIds?: string[];
    transactionType?: string;
    currency?: string;
    paymentMethod?: string;
    paymentBrand?: string;
    issuerCountry?: string;
    queryTimeZone?: string;
}

export interface TransactionAnalyticsAmountMetric {
    currency: string;
    currencyExponent?: number;
    amount: number | string;
    successCount: number;
}

export type TransactionAnalyticsComparisonDirection = 'INCREASE' | 'DECREASE' | 'FLAT' | 'NEW';

export interface TransactionAnalyticsAmountComparisonMetric {
    currency: string;
    currencyExponent?: number;
    currentAmount: number | string;
    previousAmount: number | string;
    changeAmount: number | string;
    changeRate?: number | string | null;
    changeDirection: TransactionAnalyticsComparisonDirection;
    currentSuccessCount: number;
    previousSuccessCount: number;
}

export interface TransactionAnalyticsPeriodComparison {
    periodDays: number;
    previousTotalCount: number;
    previousSuccessCount: number;
    previousFailedCount: number;
    previousPendingCount: number;
    previousProcessingCount: number;
    previousSuccessRate: number | string;
    successAmounts: TransactionAnalyticsAmountComparisonMetric[];
}

export interface TransactionAnalyticsTrendMetric {
    date: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    pendingCount: number;
    processingCount: number;
    successRate: number | string;
}

export interface TransactionAnalyticsDimensionMetric {
    key: string;
    status?: string;
    paymentMethod?: string;
    paymentBrand?: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    pendingCount?: number;
    processingCount?: number;
    successRate: number | string;
}

export interface TransactionAnalyticsOverview {
    generatedAt: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    pendingCount: number;
    processingCount: number;
    successRate: number | string;
    successAmounts: TransactionAnalyticsAmountMetric[];
    comparison?: TransactionAnalyticsPeriodComparison;
    trend: TransactionAnalyticsTrendMetric[];
    statusDistribution: TransactionAnalyticsDimensionMetric[];
    paymentMethods: TransactionAnalyticsDimensionMetric[];
    issuerCountries: TransactionAnalyticsDimensionMetric[];
}

export interface TransactionAnalyticsMerchantMetric {
    merchantId: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    inFlightCount: number;
    successRate: number | string;
    successAmounts: TransactionAnalyticsAmountMetric[];
}

export interface TransactionAnalyticsMerchantPerformance {
    generatedAt: string;
    merchantCount: number;
    merchants: TransactionAnalyticsMerchantMetric[];
}

export interface TransactionAnalyticsCountMetric {
    key: string;
    totalCount: number;
    percentage: number | string;
}

export interface TransactionAnalyticsFailureReasonMetric extends TransactionAnalyticsCountMetric {
    message: string;
    category: string;
}

export interface TransactionAnalyticsFailure {
    generatedAt: string;
    failedCount: number;
    trend: TransactionAnalyticsTrendMetric[];
    reasons: TransactionAnalyticsDimensionMetric[];
    paymentMethods: TransactionAnalyticsDimensionMetric[];
}

export interface TransactionAnalyticsFailureAnalysis {
    generatedAt: string;
    terminalCount: number;
    failedCount: number;
    affectedMerchantCount: number;
    failureRate: number | string;
    trend: TransactionAnalyticsTrendMetric[];
    categories: TransactionAnalyticsCountMetric[];
    reasons: TransactionAnalyticsFailureReasonMetric[];
    channels: TransactionAnalyticsCountMetric[];
}

export interface TransactionAnalyticsChannelMetric {
    channelCode: string;
    totalRequestCount: number;
    completedRequestCount: number;
    successfulRequestCount: number;
    failedRequestCount: number;
    timeoutRequestCount: number;
    inFlightRequestCount: number;
    requestSuccessRate: number | string;
    averageDurationMillis: number | string;
    maximumDurationMillis: number;
    transactionCount: number;
    transactionSuccessCount: number;
    transactionFailedCount: number;
    transactionSuccessRate: number | string;
}

export interface TransactionAnalyticsChannelTrendMetric {
    date: string;
    totalRequestCount: number;
    successfulRequestCount: number;
    failedRequestCount: number;
    timeoutRequestCount: number;
    inFlightRequestCount: number;
    requestSuccessRate: number | string;
}

export interface TransactionAnalyticsChannelPerformance {
    generatedAt: string;
    totalRequestCount: number;
    completedRequestCount: number;
    successfulRequestCount: number;
    failedRequestCount: number;
    timeoutRequestCount: number;
    inFlightRequestCount: number;
    requestSuccessRate: number | string;
    averageDurationMillis: number | string;
    maximumDurationMillis: number;
    channels: TransactionAnalyticsChannelMetric[];
    trend: TransactionAnalyticsChannelTrendMetric[];
    responseCodes: TransactionAnalyticsCountMetric[];
}

export interface TransactionAnalyticsThreeDsTrendMetric {
    date: string;
    totalCount: number;
    authenticatedCount: number;
    failedCount: number;
    processingCount: number;
    authenticationSuccessRate: number | string;
}

export interface TransactionAnalyticsThreeDs {
    generatedAt: string;
    eligibleCardTransactionCount: number;
    authenticationTransactionCount: number;
    authenticatedCount: number;
    failedCount: number;
    processingCount: number;
    coverageRate: number | string;
    authenticationSuccessRate: number | string;
    paymentSuccessCount: number;
    paymentFailedCount: number;
    paymentSuccessRate: number | string;
    challengeRequiredCount: number;
    challengeCompletedCount: number;
    challengeFailedCount: number;
    challengeRate: number | string;
    liabilityShiftedCount: number;
    liabilityNotShiftedCount: number;
    liabilityUnknownCount: number;
    trend: TransactionAnalyticsThreeDsTrendMetric[];
    statuses: TransactionAnalyticsCountMetric[];
    versions: TransactionAnalyticsCountMetric[];
    sources: TransactionAnalyticsCountMetric[];
    challenges: TransactionAnalyticsCountMetric[];
    liabilityShifts: TransactionAnalyticsCountMetric[];
}

export interface AnalyticsChartClick {
    name: string;
    seriesName: string;
    value?: unknown;
}

export interface TransactionAnalyticsChartLabels {
    total: string;
    success: string;
    failed: string;
    pending: string;
    processing: string;
    terminal: string;
    rate: string;
    unknown: string;
}

type AnalyticsChartOption = Record<string, unknown>;

const analyticsColors = {
    ink: '#1f2937',
    muted: '#667085',
    grid: '#e8eef7',
    blue: '#2563eb',
    success: '#16a34a',
    failed: '#dc2626',
    pending: '#d97706',
    processing: '#2563eb',
    neutral: '#6b7280',
};

const analyticsFallbackColors = ['#0f766e', '#7c3aed', '#0891b2', '#64748b', '#be185d', '#4f46e5'];

function analyticsStatusColor(status: string | undefined, fallbackIndex = 0): string {
    switch (String(status || '').trim().toUpperCase()) {
        case 'SUCCESS': return analyticsColors.success;
        case 'FAILED': return analyticsColors.failed;
        case 'PENDING': return analyticsColors.pending;
        case 'PROCESSING': return analyticsColors.processing;
        case 'TOTAL': return analyticsColors.neutral;
        default: return analyticsFallbackColors[fallbackIndex % analyticsFallbackColors.length];
    }
}

/** 将后端百分比统一转换为图表使用的有限数值。 */
export function analyticsNumber(value: number | string | null | undefined): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

/** 按币种精度展示成功金额，不在前端执行跨币种合计。 */
export function formatAnalyticsAmount(metric: TransactionAnalyticsAmountMetric, locale?: string): string {
    return `${metric.currency || 'UNKNOWN'} ${formatAnalyticsAmountValue(metric, locale)}`;
}

/** 仅格式化金额数值，供币种、金额、笔数三段式胶囊复用。 */
export function formatAnalyticsAmountValue(metric: TransactionAnalyticsAmountMetric, locale?: string): string {
    const exponent = Math.min(8, Math.max(0, metric.currencyExponent ?? 2));
    const amountText = String(metric.amount ?? '').trim();
    const decimalMatch = /^(-?)(\d+)(?:\.(\d+))?$/.exec(amountText);
    if (decimalMatch) {
        const [, sign, integerText, fractionText = ''] = decimalMatch;
        const groupedInteger = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
            .format(BigInt(`${sign}${integerText}`));
        const significantFractionLength = fractionText.replace(/0+$/, '').length;
        const displayExponent = Math.min(8, Math.max(exponent, significantFractionLength));
        if (displayExponent === 0) return groupedInteger;
        const decimalSeparator = new Intl.NumberFormat(locale).formatToParts(1.1)
            .find((part) => part.type === 'decimal')?.value ?? '.';
        return `${groupedInteger}${decimalSeparator}${fractionText.padEnd(displayExponent, '0').slice(0, displayExponent)}`;
    }
    const amount = analyticsNumber(metric.amount);
    return new Intl.NumberFormat(locale, { minimumFractionDigits: exponent, maximumFractionDigits: exponent }).format(amount);
}

export function formatAnalyticsAmounts(metrics: TransactionAnalyticsAmountMetric[], locale?: string): string {
    return metrics.length
        ? metrics.map((metric) => `${formatAnalyticsAmount(metric, locale)} · ${analyticsNumber(metric.successCount)}`).join(' / ')
        : '-';
}

export function createAnalyticsTrendOption(
    rows: TransactionAnalyticsTrendMetric[],
    labels: TransactionAnalyticsChartLabels,
): AnalyticsChartOption {
    return {
        color: [analyticsColors.success, analyticsColors.failed, analyticsColors.pending, analyticsColors.processing, analyticsColors.blue],
        aria: {
            enabled: true,
            description: `${labels.total}；${labels.success}；${labels.failed}；${labels.pending}；${labels.processing}；${labels.rate}`,
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(37, 99, 235, 0.05)' } },
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: '#dbe3ef',
            borderWidth: 1,
            padding: [10, 12],
            textStyle: { color: analyticsColors.ink, fontSize: 12 },
            extraCssText: 'box-shadow:0 8px 24px rgba(31,41,55,.10);border-radius:4px;',
            formatter: (params: Array<{ dataIndex: number; marker: string; seriesName: string; value: number }>) => {
                const first = params[0];
                const row = first ? rows[first.dataIndex] : undefined;
                if (!row) return '';
                const successCount = analyticsNumber(row.successCount);
                const failedCount = analyticsNumber(row.failedCount);
                const pendingCount = analyticsNumber(row.pendingCount);
                const processingCount = analyticsNumber(row.processingCount);
                const terminalCount = successCount + failedCount;
                const totalCount = analyticsNumber(row.totalCount);
                return [
                    `<strong style="display:block;margin-bottom:7px;color:${analyticsColors.ink}">${row.date}</strong>`,
                    `${labels.total}<b style="float:right;margin-left:28px">${totalCount}</b>`,
                    `${labels.success}<b style="float:right;color:${analyticsColors.success}">${successCount}</b>`,
                    `${labels.failed}<b style="float:right;color:${analyticsColors.failed}">${failedCount}</b>`,
                    `${labels.pending}<b style="float:right;color:${analyticsColors.pending}">${pendingCount}</b>`,
                    `${labels.processing}<b style="float:right;color:${analyticsColors.processing}">${processingCount}</b>`,
                    `${labels.terminal}<b style="float:right">${terminalCount}</b>`,
                    `${labels.rate}<b style="float:right;color:${analyticsColors.blue}">${analyticsNumber(row.successRate).toFixed(2)}%</b>`,
                ].join('<br/>');
            },
        },
        legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 7, textStyle: { color: analyticsColors.muted, fontSize: 11 } },
        grid: { top: 48, right: 50, bottom: rows.length > 14 ? 38 : 24, left: 36, containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: true,
            data: rows.map((row) => row.date.slice(5)),
            axisLine: { lineStyle: { color: '#cbd5dc' } },
            axisTick: { show: false },
            axisLabel: { color: analyticsColors.muted, hideOverlap: true },
        },
        yAxis: [
            {
                type: 'value',
                minInterval: 1,
                splitLine: { lineStyle: { color: analyticsColors.grid } },
                axisLabel: { color: analyticsColors.muted },
            },
            {
                type: 'value',
                min: 0,
                max: 100,
                splitLine: { show: false },
                axisLabel: { color: analyticsColors.muted, formatter: '{value}%' },
            },
        ],
        dataZoom: rows.length > 14 ? [{ type: 'inside', startValue: Math.max(0, rows.length - 14), endValue: rows.length - 1 }] : [],
        series: [
            {
                name: labels.success,
                type: 'bar',
                stack: 'volume',
                barMaxWidth: 24,
                itemStyle: { borderRadius: [3, 3, 0, 0] },
                data: rows.map((row) => analyticsNumber(row.successCount)),
            },
            {
                name: labels.failed,
                type: 'bar',
                stack: 'volume',
                barMaxWidth: 24,
                data: rows.map((row) => analyticsNumber(row.failedCount)),
            },
            {
                name: labels.pending,
                type: 'bar',
                stack: 'volume',
                barMaxWidth: 24,
                data: rows.map((row) => analyticsNumber(row.pendingCount)),
            },
            {
                name: labels.processing,
                type: 'bar',
                stack: 'volume',
                barMaxWidth: 24,
                itemStyle: { borderRadius: [3, 3, 0, 0] },
                data: rows.map((row) => analyticsNumber(row.processingCount)),
            },
            {
                name: labels.rate,
                type: 'line',
                yAxisIndex: 1,
                smooth: 0.2,
                symbol: 'circle',
                symbolSize: 5,
                showSymbol: rows.length <= 14,
                lineStyle: { width: 2 },
                itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
                areaStyle: { color: 'rgba(37, 99, 235, 0.08)' },
                data: rows.map((row) => analyticsNumber(row.successRate)),
                tooltip: { valueFormatter: (value: number) => `${value.toFixed(2)}%` },
            },
        ],
    };
}

export function createAnalyticsDonutOption(
    rows: TransactionAnalyticsDimensionMetric[],
    unknownLabel: string,
    totalLabel = '',
): AnalyticsChartOption {
    const total = rows.reduce((sum, row) => sum + analyticsNumber(row.totalCount), 0);
    return {
        baseOption: {
            aria: {
                enabled: true,
                description: `${totalLabel || unknownLabel}: ${total}`,
            },
            tooltip: { trigger: 'item', formatter: '{b}<br/><b>{c}</b> ({d}%)' },
            title: {
                text: new Intl.NumberFormat().format(total),
                subtext: totalLabel,
                left: '34%',
                top: '39%',
                textAlign: 'center',
                textStyle: { color: analyticsColors.ink, fontSize: 22, fontWeight: 700 },
                subtextStyle: { color: analyticsColors.muted, fontSize: 11, lineHeight: 18 },
            },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 4,
                top: 'middle',
                width: '44%',
                textStyle: { color: analyticsColors.muted },
            },
            series: [{
                type: 'pie',
                radius: ['52%', '74%'],
                center: ['34%', '52%'],
                avoidLabelOverlap: true,
                itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 3 },
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 13, fontWeight: 600, color: analyticsColors.ink } },
                data: rows.map((row, index) => ({
                    name: row.key || unknownLabel,
                    value: analyticsNumber(row.totalCount),
                    itemStyle: { color: analyticsStatusColor(row.status, index) },
                })),
            }],
        },
        media: [{
            query: { maxWidth: 520 },
            option: {
                legend: { orient: 'horizontal', left: 8, right: 8, top: 'auto', bottom: 0, width: 'auto' },
                title: { left: '50%', top: '32%' },
                series: [{ radius: ['42%', '62%'], center: ['50%', '42%'] }],
            },
        }],
    };
}

export function createAnalyticsDimensionOption(
    rows: TransactionAnalyticsDimensionMetric[],
    labels: TransactionAnalyticsChartLabels,
): AnalyticsChartOption {
    const visibleRows = [...rows]
        .sort((left, right) => analyticsNumber(right.totalCount) - analyticsNumber(left.totalCount))
        .slice(0, 10)
        .reverse();
    return {
        color: [analyticsColors.success, analyticsColors.failed],
        aria: {
            enabled: true,
            description: `${labels.total}；${labels.success}；${labels.failed}；${labels.rate}`,
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: Array<{ name: string; marker: string; seriesName: string; value: number; dataIndex: number }>) => {
                const first = params[0];
                if (!first) return '';
                const row = visibleRows[first.dataIndex];
                const details = params.map((item) => `${item.marker}${item.seriesName}: ${item.value}`).join('<br/>');
                return `<strong>${first.name}</strong><br/>${labels.total}: ${analyticsNumber(row?.totalCount)}<br/>${details}<br/>${labels.rate}: ${analyticsNumber(row?.successRate).toFixed(2)}%`;
            },
        },
        legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 7, textStyle: { color: analyticsColors.muted, fontSize: 11 } },
        grid: { top: 42, right: 18, bottom: 18, left: 16, containLabel: true },
        xAxis: {
            type: 'value',
            minInterval: 1,
            splitLine: { lineStyle: { color: analyticsColors.grid } },
            axisLabel: { color: analyticsColors.muted, formatter: compactAnalyticsAxisValue },
        },
        yAxis: {
            type: 'category',
            data: visibleRows.map((row) => row.key || labels.unknown),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: analyticsColors.ink, width: 116, overflow: 'truncate' },
        },
        series: [
            {
                name: labels.success,
                type: 'bar',
                stack: 'terminal',
                barMaxWidth: 18,
                itemStyle: { borderRadius: [3, 0, 0, 3] },
                data: visibleRows.map((row) => analyticsNumber(row.successCount)),
            },
            {
                name: labels.failed,
                type: 'bar',
                stack: 'terminal',
                barMaxWidth: 18,
                itemStyle: { borderRadius: [0, 3, 3, 0] },
                data: visibleRows.map((row) => analyticsNumber(row.failedCount)),
            },
        ],
    };
}

export function createAnalyticsFailureTrendOption(
    rows: TransactionAnalyticsTrendMetric[],
    failedLabel: string,
): AnalyticsChartOption {
    return {
        color: [analyticsColors.failed],
        aria: { enabled: true, description: failedLabel },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: Array<{ name: string; marker: string; value: number; dataIndex: number }>) => {
                const first = params[0];
                const row = first ? rows[first.dataIndex] : undefined;
                return first && row
                    ? `<strong>${row.date}</strong><br/>${first.marker}${failedLabel}: <b>${analyticsNumber(row.failedCount)}</b>`
                    : '';
            },
        },
        grid: { top: 20, right: 18, bottom: 28, left: 28, containLabel: true },
        xAxis: {
            type: 'category',
            data: rows.map((row) => row.date.slice(5)),
            axisLine: { lineStyle: { color: '#cbd5dc' } },
            axisTick: { show: false },
            axisLabel: { color: analyticsColors.muted },
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            splitLine: { lineStyle: { color: analyticsColors.grid } },
            axisLabel: { color: analyticsColors.muted },
        },
        series: [{
            name: failedLabel,
            type: 'bar',
            barMaxWidth: 26,
            itemStyle: { borderRadius: [3, 3, 0, 0] },
            data: rows.map((row) => analyticsNumber(row.failedCount)),
        }],
    };
}

export function createAnalyticsCountOption(
    rows: Array<{ key: string; totalCount: number | string }>,
    seriesLabel: string,
    unknownLabel: string,
): AnalyticsChartOption {
    const visibleRows = [...rows]
        .sort((left, right) => analyticsNumber(right.totalCount) - analyticsNumber(left.totalCount))
        .slice(0, 10)
        .reverse();
    return {
        color: [analyticsColors.failed],
        aria: { enabled: true, description: seriesLabel },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { top: 18, right: 18, bottom: 18, left: 16, containLabel: true },
        xAxis: {
            type: 'value',
            minInterval: 1,
            splitLine: { lineStyle: { color: analyticsColors.grid } },
            axisLabel: { color: analyticsColors.muted, formatter: compactAnalyticsAxisValue },
        },
        yAxis: {
            type: 'category',
            data: visibleRows.map((row) => row.key || unknownLabel),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: analyticsColors.ink, width: 150, overflow: 'truncate' },
        },
        series: [{
            name: seriesLabel,
            type: 'bar',
            barMaxWidth: 20,
            itemStyle: { borderRadius: [0, 3, 3, 0] },
            data: visibleRows.map((row) => analyticsNumber(row.totalCount)),
        }],
    };
}

export function createAnalyticsChannelTrendOption(
    rows: TransactionAnalyticsChannelTrendMetric[],
    labels: {
        success: string;
        failed: string;
        timeout: string;
        inFlight: string;
        rate: string;
    },
): AnalyticsChartOption {
    return {
        color: [analyticsColors.success, analyticsColors.failed, analyticsColors.pending, analyticsColors.processing, analyticsColors.blue],
        aria: { enabled: true, description: Object.values(labels).join('；') },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 7, textStyle: { color: analyticsColors.muted, fontSize: 11 } },
        grid: { top: 48, right: 52, bottom: rows.length > 14 ? 38 : 24, left: 34, containLabel: true },
        xAxis: {
            type: 'category',
            data: rows.map((row) => row.date.slice(5)),
            axisLine: { lineStyle: { color: '#cbd5dc' } },
            axisTick: { show: false },
            axisLabel: { color: analyticsColors.muted, hideOverlap: true },
        },
        yAxis: [
            {
                type: 'value',
                minInterval: 1,
                splitLine: { lineStyle: { color: analyticsColors.grid } },
                axisLabel: { color: analyticsColors.muted },
            },
            {
                type: 'value',
                min: 0,
                max: 100,
                splitLine: { show: false },
                axisLabel: { color: analyticsColors.muted, formatter: '{value}%' },
            },
        ],
        dataZoom: rows.length > 14 ? [{ type: 'inside', startValue: Math.max(0, rows.length - 14), endValue: rows.length - 1 }] : [],
        series: [
            {
                name: labels.success,
                type: 'bar',
                stack: 'request',
                barMaxWidth: 24,
                data: rows.map((row) => analyticsNumber(row.successfulRequestCount)),
            },
            {
                name: labels.failed,
                type: 'bar',
                stack: 'request',
                barMaxWidth: 24,
                data: rows.map((row) => analyticsNumber(row.failedRequestCount)),
            },
            {
                name: labels.timeout,
                type: 'bar',
                stack: 'request',
                barMaxWidth: 24,
                data: rows.map((row) => analyticsNumber(row.timeoutRequestCount)),
            },
            {
                name: labels.inFlight,
                type: 'bar',
                stack: 'request',
                barMaxWidth: 24,
                itemStyle: { borderRadius: [3, 3, 0, 0] },
                data: rows.map((row) => analyticsNumber(row.inFlightRequestCount)),
            },
            {
                name: labels.rate,
                type: 'line',
                yAxisIndex: 1,
                smooth: 0.2,
                symbol: 'circle',
                symbolSize: 5,
                showSymbol: rows.length <= 14,
                lineStyle: { width: 2 },
                data: rows.map((row) => analyticsNumber(row.requestSuccessRate)),
                tooltip: { valueFormatter: (value: number) => `${value.toFixed(2)}%` },
            },
        ],
    };
}

export function createAnalyticsChannelPerformanceOption(
    rows: TransactionAnalyticsChannelMetric[],
    labels: { requestRate: string; transactionRate: string },
): AnalyticsChartOption {
    const visibleRows = [...rows]
        .sort((left, right) => analyticsNumber(right.totalRequestCount) - analyticsNumber(left.totalRequestCount))
        .slice(0, 12)
        .reverse();
    return {
        color: [analyticsColors.blue, analyticsColors.success],
        aria: { enabled: true, description: `${labels.requestRate}；${labels.transactionRate}` },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 7, textStyle: { color: analyticsColors.muted, fontSize: 11 } },
        grid: { top: 42, right: 24, bottom: 18, left: 16, containLabel: true },
        xAxis: {
            type: 'value',
            min: 0,
            max: 100,
            splitLine: { lineStyle: { color: analyticsColors.grid } },
            axisLabel: { color: analyticsColors.muted, formatter: '{value}%' },
        },
        yAxis: {
            type: 'category',
            data: visibleRows.map((row) => row.channelCode),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: analyticsColors.ink, width: 140, overflow: 'truncate' },
        },
        series: [
            {
                name: labels.requestRate,
                type: 'bar',
                barMaxWidth: 12,
                data: visibleRows.map((row) => analyticsNumber(row.requestSuccessRate)),
            },
            {
                name: labels.transactionRate,
                type: 'bar',
                barMaxWidth: 12,
                itemStyle: { borderRadius: [0, 3, 3, 0] },
                data: visibleRows.map((row) => analyticsNumber(row.transactionSuccessRate)),
            },
        ],
    };
}

export function createAnalyticsThreeDsTrendOption(
    rows: TransactionAnalyticsThreeDsTrendMetric[],
    labels: { authenticated: string; failed: string; processing: string; rate: string },
): AnalyticsChartOption {
    return {
        color: [analyticsColors.success, analyticsColors.failed, analyticsColors.processing, analyticsColors.blue],
        aria: { enabled: true, description: Object.values(labels).join('；') },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 7, textStyle: { color: analyticsColors.muted, fontSize: 11 } },
        grid: { top: 48, right: 52, bottom: rows.length > 14 ? 38 : 24, left: 34, containLabel: true },
        xAxis: {
            type: 'category',
            data: rows.map((row) => row.date.slice(5)),
            axisLine: { lineStyle: { color: '#cbd5dc' } },
            axisTick: { show: false },
            axisLabel: { color: analyticsColors.muted, hideOverlap: true },
        },
        yAxis: [
            {
                type: 'value',
                minInterval: 1,
                splitLine: { lineStyle: { color: analyticsColors.grid } },
                axisLabel: { color: analyticsColors.muted },
            },
            {
                type: 'value',
                min: 0,
                max: 100,
                splitLine: { show: false },
                axisLabel: { color: analyticsColors.muted, formatter: '{value}%' },
            },
        ],
        dataZoom: rows.length > 14 ? [{ type: 'inside', startValue: Math.max(0, rows.length - 14), endValue: rows.length - 1 }] : [],
        series: [
            {
                name: labels.authenticated,
                type: 'bar',
                stack: 'authentication',
                barMaxWidth: 24,
                data: rows.map((row) => analyticsNumber(row.authenticatedCount)),
            },
            {
                name: labels.failed,
                type: 'bar',
                stack: 'authentication',
                barMaxWidth: 24,
                data: rows.map((row) => analyticsNumber(row.failedCount)),
            },
            {
                name: labels.processing,
                type: 'bar',
                stack: 'authentication',
                barMaxWidth: 24,
                itemStyle: { borderRadius: [3, 3, 0, 0] },
                data: rows.map((row) => analyticsNumber(row.processingCount)),
            },
            {
                name: labels.rate,
                type: 'line',
                yAxisIndex: 1,
                smooth: 0.2,
                symbol: 'circle',
                symbolSize: 5,
                showSymbol: rows.length <= 14,
                lineStyle: { width: 2 },
                data: rows.map((row) => analyticsNumber(row.authenticationSuccessRate)),
                tooltip: { valueFormatter: (value: number) => `${value.toFixed(2)}%` },
            },
        ],
    };
}

export function createAnalyticsMerchantOption(
    rows: TransactionAnalyticsMerchantMetric[],
    labels: TransactionAnalyticsChartLabels,
): AnalyticsChartOption {
    const visibleRows = [...rows]
        .sort((left, right) => analyticsNumber(right.totalCount) - analyticsNumber(left.totalCount))
        .slice(0, 10)
        .reverse();
    return createAnalyticsDimensionOption(
        visibleRows.map((row) => ({
            key: row.merchantId,
            totalCount: analyticsNumber(row.totalCount),
            successCount: analyticsNumber(row.successCount),
            failedCount: analyticsNumber(row.failedCount),
            successRate: row.successRate,
        })),
        labels,
    );
}

function compactAnalyticsAxisValue(value: number): string {
    const safeValue = analyticsNumber(value);
    if (Math.abs(safeValue) >= 1_000_000) return `${Number((safeValue / 1_000_000).toFixed(1))}m`;
    if (Math.abs(safeValue) >= 1_000) return `${Number((safeValue / 1_000).toFixed(1))}k`;
    return String(safeValue);
}

/**
 * 创建以本地业务时区表示的半开查询区间，结束时间滚动到当前秒。
 */
export function createTransactionAnalyticsRange(days: number, timeZone?: string): [string, string] {
    const safeDays = Math.min(31, Math.max(1, Math.trunc(days)));
    const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const end = zonedDateTimeParts(new Date(), zone);
    const beginDate = new Date(Date.UTC(end.year, end.month - 1, end.day));
    beginDate.setUTCDate(beginDate.getUTCDate() - safeDays + 1);
    const begin = `${beginDate.getUTCFullYear()}-${padDatePart(beginDate.getUTCMonth() + 1)}-${padDatePart(beginDate.getUTCDate())}`;
    return [
        `${begin}T00:00:00`,
        `${end.year}-${padDatePart(end.month)}-${padDatePart(end.day)}T${padDatePart(end.hour)}:${padDatePart(end.minute)}:${padDatePart(end.second)}`,
    ];
}

/** 将浏览器本地时间格式化为后端 LocalDateTime 接受的秒级格式。 */
export function formatLocalDateTime(value: Date): string {
    const pad = (part: number) => String(part).padStart(2, '0');
    return [
        value.getFullYear(),
        '-',
        pad(value.getMonth() + 1),
        '-',
        pad(value.getDate()),
        'T',
        pad(value.getHours()),
        ':',
        pad(value.getMinutes()),
        ':',
        pad(value.getSeconds()),
    ].join('');
}

function zonedDateTimeParts(value: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(value);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day),
        hour: Number(values.hour) % 24,
        minute: Number(values.minute),
        second: Number(values.second),
    };
}

function padDatePart(value: number) {
    return String(value).padStart(2, '0');
}

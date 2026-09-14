import type {
    MonitorCategoryDataset,
    MonitorCategorySeriesDataset,
    MonitorLoadState,
    MonitorTimeRangePreset,
    MonitorTimeRangeValue,
    MonitorTimeSeriesDataset,
    MonitorWaterfallDataset,
} from '@/components/MonitorChart';
import { formatDateTimeInTimeZone } from '@/utils/format';
import type {
    CategoryMetric,
    MetricSummary,
    RuntimeSample,
    TimeBucket,
    TimeRangeQuery,
    WaterfallStage,
} from './workbench';

/** 系统监控后端契约到统一 MonitorChart 数据集的适配器，不在页面内决定图表类型、颜色或布局。 */
type Translate = (key: string, named?: Record<string, unknown>) => string;
type EmptySeriesDefinition = Omit<MonitorTimeSeriesDataset['series'][number], 'values'>;

/** 后端监控 LocalDateTime 字段的默认解释时区。 */
export const DEFAULT_MONITOR_TIME_ZONE = 'Asia/Shanghai';

/** 创建页面默认时间范围状态，具体起止时间在发起请求时计算。 */
export function createMonitorTimeRange(
    preset: MonitorTimeRangePreset = '24h',
    timezone = DEFAULT_MONITOR_TIME_ZONE,
): MonitorTimeRangeValue {
    return { preset, timezone };
}

/** 将页面时间范围转换为后端 LocalDateTime 查询参数，并显式携带查询时区。 */
export function toMonitorTimeRangeQuery(value: MonitorTimeRangeValue): TimeRangeQuery {
    const timezone = value.timezone || DEFAULT_MONITOR_TIME_ZONE;
    const end = value.preset === 'custom' && value.end ? new Date(value.end) : new Date();
    const start = value.preset === 'custom' && value.start
        ? new Date(value.start)
        : new Date(end.getTime() - presetDuration(value.preset));
    return {
        beginTime: formatQueryDateTime(start, timezone),
        endTime: formatQueryDateTime(end, timezone),
        queryTimeZone: timezone,
    };
}

/** 根据加载、错误、响应和数据状态生成统一图表状态，刷新失败时保留陈旧数据标记。 */
export function monitorLoadState(input: {
    loading: boolean;
    error?: string;
    hasResponse: boolean;
    hasData: boolean;
    lastUpdatedAt?: string;
    emptyDescription?: string;
}): MonitorLoadState {
    if (input.loading && !input.hasResponse) return { status: 'loading' };
    if (input.error) {
        return {
            status: 'error',
            message: input.error,
            retryable: true,
            stale: input.hasResponse,
            lastUpdatedAt: input.lastUpdatedAt,
        };
    }
    if (!input.hasData) return { status: 'empty', description: input.emptyDescription };
    return { status: 'ready', lastUpdatedAt: input.lastUpdatedAt };
}

/** 按后端声明的单位格式化摘要指标。 */
export function formatMetricValue(summary: MetricSummary | undefined, locale?: string): string {
    if (!summary || summary.value === null || summary.value === undefined) return '-';
    const value = Number(summary.value);
    if (!Number.isFinite(value)) return '-';
    if (summary.unit === 'percent') return `${value.toFixed(2)}%`;
    if (summary.unit === 'milliseconds') return formatDuration(value, locale);
    if (summary.unit === 'bytes') return formatBytes(value);
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

/** 将可空数值格式化为保留两位小数的百分比。 */
export function formatPercent(value: unknown): string {
    const number = numberOrNull(value);
    if (number === null) return '-';
    return Number.isFinite(number) ? `${number.toFixed(2)}%` : '-';
}

/** 将毫秒格式化为易读的毫秒或秒文本。 */
export function formatDuration(value: unknown, locale?: string): string {
    const number = numberOrNull(value);
    if (number === null) return '-';
    if (!Number.isFinite(number)) return '-';
    if (Math.abs(number) >= 1000) {
        return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(number / 1000)} s`;
    }
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(number)} ms`;
}

/** 将可空计数格式化为本地化整数。 */
export function formatCount(value: unknown, locale?: string): string {
    const number = numberOrNull(value);
    if (number === null) return '-';
    return Number.isFinite(number) ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(number) : '-';
}

/** 将字节数格式化为 B、KB、MB、GB 或 TB。 */
export function formatBytes(value: unknown): string {
    const number = numberOrNull(value);
    if (number === null) return '-';
    if (!Number.isFinite(number) || number < 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let amount = number;
    let unit = 0;
    while (amount >= 1024 && unit < units.length - 1) {
        amount /= 1024;
        unit += 1;
    }
    return `${amount.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

/** 将 JVM 运行毫秒数格式化为天、小时和分钟。 */
export function formatUptime(value: unknown, t: Translate): string {
    const milliseconds = numberOrNull(value);
    if (milliseconds === null) return '-';
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return '-';
    const days = Math.floor(milliseconds / 86_400_000);
    const hours = Math.floor((milliseconds % 86_400_000) / 3_600_000);
    const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
    return t('monitor.workbench.value.uptime', { days, hours, minutes });
}

/** 将后端业务状态映射为 Element Plus 标签语义。 */
export function monitorTagType(value?: string): 'success' | 'warning' | 'danger' | 'primary' | 'info' {
    const status = String(value || '').toUpperCase();
    if (['HEALTHY', 'SUCCESS', 'AVAILABLE', 'RECOVERED', 'ONLINE', 'CLOSED'].includes(status)) return 'success';
    if (['WARNING', 'PENDING', 'PROCESSING', 'RETRYING', 'INIT'].includes(status)) return 'warning';
    if (['ERROR', 'CRITICAL', 'FAILED', 'TIMEOUT', 'OFFLINE'].includes(status)) return 'danger';
    if (status === 'INFO' || status === 'ACTIVE') return 'primary';
    return 'info';
}

/** 判断指定摘要指标是否存在正数值，用于空态和可用性判断。 */
export function hasPositiveMetric(summaries: MetricSummary[] | undefined, key: string): boolean {
    const value = numberOrNull(summaries?.find((item) => item.key === key)?.value);
    return value !== null && value > 0;
}

/** 适配总览 API 请求量与失败量趋势。 */
export function createOverviewApiRequestDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return timeSeries(buckets, [
        valueSeries('total', t('monitor.chart.series.total'), 'primary', 'count', buckets),
        valueSeries('failed', t('monitor.chart.series.failed'), 'error', 'count', buckets),
    ]);
}

/** 适配总览 API 平均值、P95 和 P99 延迟趋势。 */
export function createOverviewApiLatencyDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return latencyDataset(buckets, t);
}

/** 适配总览告警级别堆叠趋势。 */
export function createOverviewAlertTrendDataset(buckets: TimeBucket[], t: Translate): MonitorCategorySeriesDataset {
    return alertTrendDataset(buckets, t);
}

/** 适配 API 监控请求量趋势。 */
export function createApiRequestDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return createOverviewApiRequestDataset(buckets, t);
}

/** 根据请求总量和失败量计算 API 失败率趋势。 */
export function createApiFailureRateDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return timeSeries(buckets, [{
        key: 'failureRate',
        label: t('monitor.chart.series.failureRate'),
        semantic: 'error',
        unit: 'percent',
        values: buckets.map((bucket) => {
            const total = numberOrNull(bucket.values.total);
            const failed = numberOrNull(bucket.values.failed);
            return total !== null && failed !== null && total > 0
                ? failed * 100 / total
                : null;
        }),
    }]);
}

/** 适配 API 监控延迟趋势。 */
export function createApiLatencyDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return latencyDataset(buckets, t);
}

/** 适配 API 响应码 TopN 分类数据。 */
export function createApiResponseCodeDataset(values: CategoryMetric[]): MonitorCategoryDataset {
    return categoryDataset(values, 'error');
}

/** 适配商户调用量 TopN 分类数据。 */
export function createApiMerchantDataset(values: CategoryMetric[]): MonitorCategoryDataset {
    return categoryDataset(values, 'primary');
}

/** 适配渠道成功率趋势。 */
export function createChannelSuccessRateDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return timeSeries(buckets, [valueSeries('successRate', t('monitor.chart.series.successRate'), 'success', 'percent', buckets)]);
}

/** 适配渠道 P95 和 P99 延迟趋势。 */
export function createChannelLatencyDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return timeSeries(buckets, [
        valueSeries('p95', t('monitor.chart.series.p95'), 'primary', 'milliseconds', buckets),
        valueSeries('p99', t('monitor.chart.series.p99'), 'warning', 'milliseconds', buckets),
    ]);
}

/** 适配渠道错误原因 TopN 分类数据。 */
export function createChannelErrorDataset(values: CategoryMetric[]): MonitorCategoryDataset {
    return categoryDataset(values, 'error');
}

/** 适配支付方式成功率分组柱状数据。 */
export function createChannelPaymentMethodDataset(values: CategoryMetric[], t: Translate): MonitorCategorySeriesDataset {
    return {
        kind: 'category-series',
        categories: values.map((item) => item.label || item.key),
        series: [{
            key: 'successRate',
            label: t('monitor.chart.series.successRate'),
            semantic: 'primary',
            unit: 'percent',
            values: values.map((item) => numberOrNull(item.value)),
        }],
    };
}

/** 适配 Webhook 成功率趋势，复用统一成功率序列契约。 */
export function createWebhookSuccessRateDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return createChannelSuccessRateDataset(buckets, t);
}

/** 适配 Webhook HTTP 状态分布并按状态码赋予受控语义。 */
export function createWebhookStatusDataset(values: CategoryMetric[]): MonitorCategoryDataset {
    return {
        kind: 'category',
        values: values.map((item) => ({
            key: item.key,
            label: item.label || item.key,
            value: Number(item.value),
            semantic: webhookStatusSemantic(item.key),
        })),
    };
}

/** 适配 Webhook 重试与死信堆叠趋势。 */
export function createWebhookRetryDataset(buckets: TimeBucket[], t: Translate): MonitorCategorySeriesDataset {
    return {
        kind: 'category-series',
        categories: buckets.map((bucket) => bucket.timestamp),
        series: [
            valueSeries('retry', t('monitor.chart.series.retry'), 'warning', 'count', buckets),
            valueSeries('dlq', t('monitor.chart.series.dlq'), 'error', 'count', buckets),
        ],
    };
}

/** 适配交易链路阶段为瀑布图数据，时间单位统一为毫秒。 */
export function createTraceWaterfallDataset(stages: WaterfallStage[]): MonitorWaterfallDataset {
    return {
        kind: 'waterfall',
        stages: stages.map((stage) => ({
            key: stage.key,
            label: stage.label,
            startMs: Number(stage.startMillis),
            durationMs: Number(stage.durationMillis),
            status: waterfallStatus(stage.status),
        })),
    };
}

/** 适配告警级别堆叠趋势。 */
export function createAlertTrendDataset(buckets: TimeBucket[], t: Translate): MonitorCategorySeriesDataset {
    return alertTrendDataset(buckets, t);
}

/** 适配告警来源 TopN 分类数据。 */
export function createAlertSourceDataset(values: CategoryMetric[]): MonitorCategoryDataset {
    return categoryDataset(values, 'warning');
}

/** 创建未接入告警上下文指标时使用的空时间序列。 */
export function createEmptyAlertContextDataset(t: Translate): MonitorTimeSeriesDataset {
    return emptyTimeSeries([{ key: 'metric', label: t('monitor.chart.series.metric'), semantic: 'primary', unit: 'count' }]);
}

/** 适配安全拦截事件趋势。 */
export function createSecurityTrendDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return timeSeries(buckets, [valueSeries('intercepts', t('monitor.chart.series.intercepts'), 'error', 'count', buckets)]);
}

/** 适配安全拦截类型 TopN 分类数据。 */
export function createSecurityTypeDataset(values: CategoryMetric[]): MonitorCategoryDataset {
    return categoryDataset(values, 'error');
}

/** 适配商户安全拦截 TopN 分类数据。 */
export function createSecurityMerchantDataset(values: CategoryMetric[]): MonitorCategoryDataset {
    return categoryDataset(values, 'error');
}

/** 将 JVM 运行时样本转换为宿主机 CPU 和物理内存使用率趋势。 */
export function createRuntimeHostUsageDataset(samples: RuntimeSample[], t: Translate): MonitorTimeSeriesDataset {
    return {
        kind: 'time-series',
        timestamps: samples.map((sample) => sample.timestamp),
        series: [
            {
                key: 'cpu',
                label: t('monitor.chart.series.cpu'),
                semantic: 'primary',
                unit: 'percent',
                values: samples.map((sample) => numberOrNull(sample.systemCpuPercent)),
            },
            {
                key: 'memory',
                label: t('monitor.chart.series.memory'),
                semantic: 'secondary',
                unit: 'percent',
                values: samples.map((sample) => percentage(sample.physicalMemoryUsedBytes, sample.physicalMemoryTotalBytes)),
            },
        ],
    };
}

/** 将 JVM 运行时样本转换为堆内存字节趋势。 */
export function createRuntimeHeapDataset(samples: RuntimeSample[], t: Translate): MonitorTimeSeriesDataset {
    return {
        kind: 'time-series',
        timestamps: samples.map((sample) => sample.timestamp),
        series: [
            runtimeSeries('used', t('monitor.chart.series.used'), 'primary', samples, 'heapUsedBytes'),
            runtimeSeries('committed', t('monitor.chart.series.committed'), 'tertiary', samples, 'heapCommittedBytes'),
            runtimeSeries('max', t('monitor.chart.series.max'), 'neutral', samples, 'heapMaxBytes'),
        ],
    };
}

/** 将 JVM 累计 GC 指标转换为相邻采样区间增量。 */
export function createRuntimeGcDataset(samples: RuntimeSample[], t: Translate): MonitorCategorySeriesDataset {
    const deltas = samples.map((sample, index) => {
        if (index === 0) return { count: 0, duration: 0 };
        return {
            count: Math.max(0, Number(sample.gcCount) - Number(samples[index - 1]?.gcCount)),
            duration: Math.max(0, Number(sample.gcDurationMillis) - Number(samples[index - 1]?.gcDurationMillis)),
        };
    });
    return {
        kind: 'category-series',
        categories: samples.map((sample) => sample.timestamp),
        series: [
            { key: 'count', label: t('monitor.chart.series.gcCount'), semantic: 'secondary', unit: 'count', values: deltas.map((item) => item.count) },
            { key: 'duration', label: t('monitor.chart.series.gcDuration'), semantic: 'warning', unit: 'milliseconds', values: deltas.map((item) => item.duration) },
        ],
    };
}

/** 创建线程池历史指标未接入时的受控空数据集。 */
export function createEmptyThreadPoolDataset(t: Translate): MonitorTimeSeriesDataset {
    return emptyTimeSeries([
        { key: 'active', label: t('monitor.chart.series.active'), semantic: 'primary', unit: 'count' },
        { key: 'queue', label: t('monitor.chart.series.queue'), semantic: 'warning', unit: 'count' },
    ]);
}

/** 创建 Redis 内存历史未采样时的受控空数据集。 */
export function createEmptyRedisMemoryDataset(t: Translate): MonitorTimeSeriesDataset {
    return emptyTimeSeries([
        { key: 'used', label: t('monitor.chart.series.used'), semantic: 'primary', unit: 'bytes' },
        { key: 'max', label: t('monitor.chart.series.max'), semantic: 'neutral', unit: 'bytes' },
    ]);
}

/** 适配 Redis 已用和最大内存趋势。 */
export function createRedisMemoryDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return timeSeries(buckets, [
        valueSeries('used', t('monitor.chart.series.used'), 'primary', 'bytes', buckets),
        valueSeries('max', t('monitor.chart.series.max'), 'neutral', 'bytes', buckets),
    ]);
}

/** 创建 Redis 吞吐历史未采样时的受控空数据集。 */
export function createEmptyRedisOpsDataset(t: Translate): MonitorTimeSeriesDataset {
    return emptyTimeSeries([{ key: 'ops', label: t('monitor.chart.series.ops'), semantic: 'primary', unit: 'rate' }]);
}

/** 适配 Redis 每秒操作数趋势。 */
export function createRedisOpsDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return timeSeries(buckets, [
        valueSeries('ops', t('monitor.chart.series.ops'), 'primary', 'rate', buckets),
    ]);
}

/** 创建 Redis 命中率历史未采样时的受控空数据集。 */
export function createEmptyRedisHitRateDataset(t: Translate): MonitorTimeSeriesDataset {
    return emptyTimeSeries([{ key: 'hitRate', label: t('monitor.chart.series.hitRate'), semantic: 'success', unit: 'percent' }]);
}

/** 适配 Redis 命中率趋势。 */
export function createRedisHitRateDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return timeSeries(buckets, [
        valueSeries('hitRate', t('monitor.chart.series.hitRate'), 'success', 'percent', buckets),
    ]);
}

/** 适配 Redis Key 类型抽样分布。 */
export function createRedisKeyTypeDataset(values: CategoryMetric[]): MonitorCategoryDataset {
    return {
        kind: 'category',
        values: values.map((item) => ({
            key: item.key,
            label: item.label || item.key,
            value: Number(item.value),
        })),
    };
}

/** 创建无分类数据时使用的空数据集。 */
export function createEmptyCategoryDataset(): MonitorCategoryDataset {
    return { kind: 'category', values: [] };
}

/** 创建 Hikari 连接池历史未采样时的受控空数据集。 */
export function createEmptyDatasourcePoolDataset(t: Translate): MonitorTimeSeriesDataset {
    return emptyTimeSeries([
        { key: 'active', label: t('monitor.chart.series.active'), semantic: 'primary', unit: 'count' },
        { key: 'idle', label: t('monitor.chart.series.idle'), semantic: 'secondary', unit: 'count' },
        { key: 'pending', label: t('monitor.chart.series.pending'), semantic: 'warning', unit: 'count' },
    ]);
}

/** 适配 Hikari 活跃、空闲和等待连接趋势。 */
export function createDatasourcePoolDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return timeSeries(buckets, [
        valueSeries('active', t('monitor.chart.series.active'), 'primary', 'count', buckets),
        valueSeries('idle', t('monitor.chart.series.idle'), 'secondary', 'count', buckets),
        valueSeries('pending', t('monitor.chart.series.pending'), 'warning', 'count', buckets),
    ]);
}

/** 创建 MySQL SQL 延迟历史未采样时的受控空数据集。 */
export function createEmptyDatasourceLatencyDataset(t: Translate): MonitorTimeSeriesDataset {
    return emptyTimeSeries([
        { key: 'avg', label: t('monitor.chart.series.avg'), semantic: 'tertiary', unit: 'milliseconds' },
        { key: 'p95', label: t('monitor.chart.series.p95'), semantic: 'primary', unit: 'milliseconds' },
        { key: 'p99', label: t('monitor.chart.series.p99'), semantic: 'warning', unit: 'milliseconds' },
    ]);
}

/** 适配 MySQL 平均值、P95 和 P99 SQL 延迟趋势。 */
export function createDatasourceLatencyDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return latencyDataset(buckets, t);
}

/** 适配脱敏后的慢 SQL 指纹 TopN 分类数据。 */
export function createDatasourceSlowSqlDataset(values: CategoryMetric[]): MonitorCategoryDataset {
    return categoryDataset(values, 'warning');
}

/** 创建任务近七日结果聚合尚未接入时的受控空数据集。 */
export function createEmptyJobTrendDataset(t: Translate): MonitorCategorySeriesDataset {
    return {
        kind: 'category-series',
        categories: [],
        series: [
            { key: 'success', label: t('monitor.chart.series.success'), semantic: 'success', unit: 'count', values: [] },
            { key: 'failed', label: t('monitor.chart.series.failed'), semantic: 'error', unit: 'count', values: [] },
        ],
    };
}

/** 创建任务节点历史资源指标尚未接入时的受控空数据集。 */
export function createEmptyJobNodeDataset(t: Translate): MonitorTimeSeriesDataset {
    return emptyTimeSeries([
        { key: 'cpu', label: t('monitor.chart.series.cpu'), semantic: 'primary', unit: 'percent' },
        { key: 'memory', label: t('monitor.chart.series.memory'), semantic: 'secondary', unit: 'percent' },
    ]);
}

/** 判断时间序列或分类序列中是否至少包含一个有限数值。 */
export function hasDatasetValues(dataset: MonitorTimeSeriesDataset | MonitorCategorySeriesDataset): boolean {
    return dataset.series.some((item) => item.values.some((value) => value !== null && Number.isFinite(Number(value))));
}

function timeSeries(buckets: TimeBucket[], series: MonitorTimeSeriesDataset['series']): MonitorTimeSeriesDataset {
    return { kind: 'time-series', timestamps: buckets.map((bucket) => bucket.timestamp), series };
}

function latencyDataset(buckets: TimeBucket[], t: Translate): MonitorTimeSeriesDataset {
    return timeSeries(buckets, [
        valueSeries('avg', t('monitor.chart.series.avg'), 'tertiary', 'milliseconds', buckets),
        valueSeries('p95', t('monitor.chart.series.p95'), 'primary', 'milliseconds', buckets),
        valueSeries('p99', t('monitor.chart.series.p99'), 'warning', 'milliseconds', buckets),
    ]);
}

function alertTrendDataset(buckets: TimeBucket[], t: Translate): MonitorCategorySeriesDataset {
    return {
        kind: 'category-series',
        categories: buckets.map((bucket) => bucket.timestamp),
        series: [
            valueSeries('warning', t('monitor.chart.series.warning'), 'warning', 'count', buckets),
            valueSeries('error', t('monitor.chart.series.error'), 'error', 'count', buckets),
            valueSeries('critical', t('monitor.chart.series.critical'), 'critical', 'count', buckets),
        ],
    };
}

function valueSeries(
    key: string,
    label: string,
    semantic: MonitorTimeSeriesDataset['series'][number]['semantic'],
    unit: MonitorTimeSeriesDataset['series'][number]['unit'],
    buckets: TimeBucket[],
): MonitorTimeSeriesDataset['series'][number] {
    return { key, label, semantic, unit, values: buckets.map((bucket) => numberOrNull(bucket.values[key])) };
}

function categoryDataset(values: CategoryMetric[], semantic: 'primary' | 'warning' | 'error'): MonitorCategoryDataset {
    return {
        kind: 'category',
        values: values.map((item) => ({
            key: item.key,
            label: item.label || item.key,
            value: Number(item.value),
            semantic,
        })),
    };
}

function emptyTimeSeries(series: EmptySeriesDefinition[]): MonitorTimeSeriesDataset {
    return { kind: 'time-series', timestamps: [], series: series.map((item) => ({ ...item, values: [] })) };
}

function runtimeSeries(
    key: string,
    label: string,
    semantic: 'primary' | 'tertiary' | 'neutral',
    samples: RuntimeSample[],
    field: 'heapUsedBytes' | 'heapCommittedBytes' | 'heapMaxBytes',
): MonitorTimeSeriesDataset['series'][number] {
    return { key, label, semantic, unit: 'bytes', values: samples.map((sample) => numberOrNull(sample[field])) };
}

function numberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function percentage(value: unknown, total: unknown): number | null {
    if (value === null || value === undefined || value === ''
        || total === null || total === undefined || total === '') return null;
    const numerator = Number(value);
    const denominator = Number(total);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
    return numerator * 100 / denominator;
}

function waterfallStatus(value: string): 'normal' | 'warning' | 'error' {
    const status = String(value || '').toUpperCase();
    if (['ERROR', 'FAILED', 'CRITICAL'].includes(status)) return 'error';
    if (['WARNING', 'TIMEOUT'].includes(status)) return 'warning';
    return 'normal';
}

function webhookStatusSemantic(value: string): 'success' | 'warning' | 'error' {
    const status = String(value || '').toUpperCase();
    if (/^2\d\d$/.test(status)) return 'success';
    if (status === '429') return 'warning';
    return 'error';
}

function presetDuration(preset: MonitorTimeRangePreset): number {
    if (preset === '1h') return 60 * 60 * 1000;
    if (preset === '6h') return 6 * 60 * 60 * 1000;
    if (preset === '7d') return 7 * 24 * 60 * 60 * 1000;
    return 24 * 60 * 60 * 1000;
}

function formatQueryDateTime(value: Date, timezone: string): string | undefined {
    if (Number.isNaN(value.getTime())) return undefined;
    return formatDateTimeInTimeZone(value, timezone).replace(' ', 'T');
}

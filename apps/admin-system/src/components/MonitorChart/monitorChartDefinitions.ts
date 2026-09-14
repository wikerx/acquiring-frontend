import type {
    MonitorChartDefinition,
    MonitorChartDefinitionId,
    MonitorSeriesDefinition,
    MonitorUnit,
} from './monitorTypes';

/** 系统监控图表类型、序列单位和语义色的集中注册表，页面只允许按 ID 引用。 */
const s = (
    key: string,
    semantic: MonitorSeriesDefinition['semantic'],
    unit: MonitorUnit,
    extra: Partial<MonitorSeriesDefinition> = {},
): MonitorSeriesDefinition => ({ key, semantic, unit, ...extra });

const chart = (
    id: MonitorChartDefinitionId,
    definition: Omit<MonitorChartDefinition, 'id' | 'titleKey' | 'subtitleKey'>,
): MonitorChartDefinition => {
    const i18nKey = id.replaceAll('.', '_');
    return {
        id,
        titleKey: `monitor.chart.definitions.${i18nKey}.title`,
        subtitleKey: `monitor.chart.definitions.${i18nKey}.subtitle`,
        ...definition,
    };
};

const definitions = [
    chart('overview.apiRequests', { kind: 'line', size: 'standard', series: [s('total', 'primary', 'count'), s('failed', 'error', 'count')] }),
    chart('overview.apiLatency', { kind: 'line', size: 'standard', series: [s('avg', 'tertiary', 'milliseconds'), s('p95', 'primary', 'milliseconds'), s('p99', 'warning', 'milliseconds')] }),
    chart('overview.alertTrend', { kind: 'stacked-bar', size: 'standard', categoryAxis: 'time', series: [s('warning', 'warning', 'count'), s('error', 'error', 'count'), s('critical', 'critical', 'count')] }),
    chart('service.hostUsage', { kind: 'line', size: 'standard', series: [s('cpu', 'primary', 'percent'), s('memory', 'secondary', 'percent')] }),
    chart('service.jvmHeap', { kind: 'line', size: 'standard', series: [s('used', 'primary', 'bytes'), s('committed', 'tertiary', 'bytes'), s('max', 'neutral', 'bytes', { dashed: true })] }),
    chart('service.gc', { kind: 'bar-line', size: 'standard', categoryAxis: 'time', series: [s('count', 'secondary', 'count', { renderer: 'bar' }), s('duration', 'warning', 'milliseconds', { renderer: 'line', axisIndex: 1 })] }),
    chart('service.threadPool', { kind: 'line', size: 'standard', series: [s('active', 'primary', 'count'), s('queue', 'warning', 'count')] }),
    chart('api.requestTrend', { kind: 'line', size: 'standard', series: [s('total', 'primary', 'count'), s('failed', 'error', 'count')] }),
    chart('api.failureRate', { kind: 'line', size: 'compact', series: [s('failureRate', 'error', 'percent')], tightPercentRange: false }),
    chart('api.latency', { kind: 'line', size: 'standard', series: [s('avg', 'tertiary', 'milliseconds'), s('p95', 'primary', 'milliseconds'), s('p99', 'warning', 'milliseconds')] }),
    chart('api.httpErrorTop', { kind: 'top-n', size: 'compact', maxItems: 10, categorySemantics: ['error'] }),
    chart('api.merchantTop', { kind: 'top-n', size: 'compact', maxItems: 10, categorySemantics: ['primary'] }),
    chart('trace.waterfall', { kind: 'waterfall', size: 'large' }),
    chart('channel.successRate', { kind: 'line', size: 'standard', series: [s('successRate', 'success', 'percent')], tightPercentRange: true }),
    chart('channel.latency', { kind: 'line', size: 'standard', series: [s('p95', 'primary', 'milliseconds'), s('p99', 'warning', 'milliseconds')] }),
    chart('channel.errorTop', { kind: 'top-n', size: 'compact', maxItems: 10, categorySemantics: ['error'] }),
    chart('channel.paymentMethodRate', { kind: 'grouped-bar', size: 'compact', series: [s('successRate', 'primary', 'percent')] }),
    chart('webhook.successRate', { kind: 'line', size: 'standard', series: [s('successRate', 'success', 'percent')], tightPercentRange: true }),
    chart('webhook.httpStatus', { kind: 'bar', size: 'compact', categorySemantics: ['success', 'warning', 'error'] }),
    chart('webhook.retryTrend', { kind: 'stacked-bar', size: 'compact', categoryAxis: 'time', series: [s('retry', 'warning', 'count'), s('dlq', 'error', 'count')] }),
    chart('redis.memory', { kind: 'line', size: 'standard', series: [s('used', 'primary', 'bytes', { area: true }), s('max', 'neutral', 'bytes', { dashed: true })] }),
    chart('redis.ops', { kind: 'line', size: 'compact', series: [s('ops', 'primary', 'rate')] }),
    chart('redis.hitRate', { kind: 'line', size: 'compact', series: [s('hitRate', 'success', 'percent')], tightPercentRange: true }),
    chart('redis.keyTypes', { kind: 'donut', size: 'compact', maxItems: 5 }),
    chart('datasource.pool', { kind: 'line', size: 'standard', series: [s('active', 'primary', 'count'), s('idle', 'secondary', 'count'), s('pending', 'warning', 'count')] }),
    chart('datasource.sqlLatency', { kind: 'line', size: 'standard', series: [s('avg', 'tertiary', 'milliseconds'), s('p95', 'primary', 'milliseconds'), s('p99', 'warning', 'milliseconds')] }),
    chart('datasource.slowSqlTop', { kind: 'top-n', size: 'compact', maxItems: 10, categorySemantics: ['warning'] }),
    chart('job.resultTrend', { kind: 'stacked-bar', size: 'standard', categoryAxis: 'time', series: [s('success', 'success', 'count'), s('failed', 'error', 'count')] }),
    chart('jobNode.resourceDetail', { kind: 'line', size: 'standard', series: [s('cpu', 'primary', 'percent'), s('memory', 'secondary', 'percent')] }),
    chart('alert.trend', { kind: 'stacked-bar', size: 'standard', categoryAxis: 'time', series: [s('warning', 'warning', 'count'), s('error', 'error', 'count'), s('critical', 'critical', 'count')] }),
    chart('alert.sourceTop', { kind: 'top-n', size: 'compact', maxItems: 10, categorySemantics: ['warning'] }),
    chart('alert.contextMetric', { kind: 'line', size: 'standard', series: [s('metric', 'primary', 'count')] }),
    chart('security.interceptTrend', { kind: 'line', size: 'standard', series: [s('intercepts', 'error', 'count')] }),
    chart('security.typeTop', { kind: 'top-n', size: 'compact', maxItems: 10, categorySemantics: ['error'] }),
    chart('security.merchantTop', { kind: 'top-n', size: 'compact', maxItems: 10, categorySemantics: ['error'] }),
    chart('rocketmq.consumerLag', { kind: 'line', size: 'standard', series: [s('lag', 'warning', 'count')] }),
    chart('rocketmq.tps', { kind: 'line', size: 'compact', series: [s('produce', 'primary', 'rate'), s('consume', 'secondary', 'rate')] }),
    chart('nacos.instanceTrend', { kind: 'line', size: 'compact', series: [s('healthy', 'success', 'count'), s('unhealthy', 'error', 'count')] }),
] satisfies MonitorChartDefinition[];

/** 冻结后的图表定义索引，防止页面运行时随机修改规范。 */
export const monitorChartDefinitions = Object.freeze(Object.fromEntries(
    definitions.map((definition) => [definition.id, Object.freeze(definition)]),
)) as Readonly<Record<MonitorChartDefinitionId, MonitorChartDefinition>>;

/** 按稳定 ID 获取受控图表定义。 */
export function getMonitorChartDefinition(id: MonitorChartDefinitionId): MonitorChartDefinition {
    return monitorChartDefinitions[id];
}

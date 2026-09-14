import type { MonitorSemantic } from './monitorChartTokens';

/** 系统监控图表、数据集、加载状态和页面布局的公共类型契约。 */
export const monitorChartDefinitionIds = [
    'overview.apiRequests',
    'overview.apiLatency',
    'overview.alertTrend',
    'service.hostUsage',
    'service.jvmHeap',
    'service.gc',
    'service.threadPool',
    'api.requestTrend',
    'api.failureRate',
    'api.latency',
    'api.httpErrorTop',
    'api.merchantTop',
    'trace.waterfall',
    'channel.successRate',
    'channel.latency',
    'channel.errorTop',
    'channel.paymentMethodRate',
    'webhook.successRate',
    'webhook.httpStatus',
    'webhook.retryTrend',
    'redis.memory',
    'redis.ops',
    'redis.hitRate',
    'redis.keyTypes',
    'datasource.pool',
    'datasource.sqlLatency',
    'datasource.slowSqlTop',
    'job.resultTrend',
    'jobNode.resourceDetail',
    'alert.trend',
    'alert.sourceTop',
    'alert.contextMetric',
    'security.interceptTrend',
    'security.typeTop',
    'security.merchantTop',
    'rocketmq.consumerLag',
    'rocketmq.tps',
    'nacos.instanceTrend',
] as const;

/** 集中注册的图表定义标识，页面只能引用此联合类型内的稳定 ID。 */
export type MonitorChartDefinitionId = typeof monitorChartDefinitionIds[number];
/** 图表数值单位，统一驱动坐标轴和提示框格式。 */
export type MonitorUnit = 'count' | 'percent' | 'milliseconds' | 'bytes' | 'rate';
/** 监控图表固定高度等级，避免页面自行声明不一致尺寸。 */
export type MonitorChartSize = 'large' | 'standard' | 'compact';
/** 统一封装允许使用的图表类型集合。 */
export type MonitorChartKind =
    | 'line'
    | 'bar'
    | 'stacked-bar'
    | 'grouped-bar'
    | 'bar-line'
    | 'top-n'
    | 'donut'
    | 'waterfall'
    | 'sparkline';

/** 一条带语义色和单位的数值序列，null 表示该时间点没有可用样本。 */
export interface MonitorValueSeries {
    key: string;
    label: string;
    semantic: MonitorSemantic;
    unit: MonitorUnit;
    values: Array<number | null>;
}

/** 连续时间趋势数据集，timestamps 与每条 series.values 必须等长。 */
export interface MonitorTimeSeriesDataset {
    kind: 'time-series';
    timestamps: string[];
    series: MonitorValueSeries[];
}

/** 离散分类上的多序列数据集，用于分组柱状图和堆叠柱状图。 */
export interface MonitorCategorySeriesDataset {
    kind: 'category-series';
    categories: string[];
    series: MonitorValueSeries[];
}

/** 单个分类聚合值，可显式覆盖集中定义的默认语义色。 */
export interface MonitorCategoryValue {
    key: string;
    label: string;
    value: number;
    semantic?: MonitorSemantic;
}

/** 单序列分类数据集，用于 TopN、柱状图和环形图。 */
export interface MonitorCategoryDataset {
    kind: 'category';
    values: MonitorCategoryValue[];
}

/** 链路瀑布图中的单个阶段，时间均为相对整条链路的毫秒值。 */
export interface MonitorWaterfallStage {
    key: string;
    label: string;
    startMs: number;
    durationMs: number;
    status: 'normal' | 'warning' | 'error';
}

/** 交易链路瀑布图数据集。 */
export interface MonitorWaterfallDataset {
    kind: 'waterfall';
    stages: MonitorWaterfallStage[];
}

/** 所有统一图表渲染器接受的数据集联合类型。 */
export type MonitorChartDataset =
    | MonitorTimeSeriesDataset
    | MonitorCategorySeriesDataset
    | MonitorCategoryDataset
    | MonitorWaterfallDataset;

/** 图表阈值线定义，key 与具体业务指标序列对应。 */
export interface MonitorThreshold {
    key: string;
    label: string;
    value: number;
    semantic: 'warning' | 'error';
    unit: MonitorUnit;
}

/** 图表加载状态，支持保留旧数据的刷新失败状态。 */
export type MonitorLoadState =
    | { status: 'loading' }
    | { status: 'ready'; stale?: boolean; lastUpdatedAt?: string }
    | { status: 'empty'; description?: string }
    | { status: 'error'; message?: string; retryable: boolean; stale?: boolean; lastUpdatedAt?: string };

/** 监控时间范围预设；custom 必须同时提供有效起止时间。 */
export type MonitorTimeRangePreset = '1h' | '6h' | '24h' | '7d' | 'custom';

/** 页面选择的查询区间和解释时间值所需的 IANA 时区。 */
export interface MonitorTimeRangeValue {
    preset: MonitorTimeRangePreset;
    start?: string;
    end?: string;
    timezone: string;
}

/** 统一图表点击事件，页面据此执行筛选或下钻，不读取 ECharts 私有结构。 */
export interface MonitorChartClickEvent {
    definitionId: MonitorChartDefinitionId;
    seriesKey: string;
    dimensionKey?: string;
    timestamp?: string;
    value: number;
}

/** 图表定义中的单条序列规范，集中决定颜色、单位和渲染方式。 */
export interface MonitorSeriesDefinition {
    key: string;
    semantic: MonitorSemantic;
    unit: MonitorUnit;
    renderer?: 'line' | 'bar';
    axisIndex?: 0 | 1;
    dashed?: boolean;
    area?: boolean;
}

/** 受治理的图表定义，页面不得覆盖类型、尺寸、颜色或基础布局。 */
export interface MonitorChartDefinition {
    id: MonitorChartDefinitionId;
    kind: MonitorChartKind;
    size: MonitorChartSize;
    titleKey: string;
    subtitleKey: string;
    series?: readonly MonitorSeriesDefinition[];
    maxItems?: number;
    tightPercentRange?: boolean;
    categorySemantics?: readonly MonitorSemantic[];
    categoryAxis?: 'label' | 'time';
}

/** 集中注册的监控页面定义 ID，控制页面可用布局和图表顺序。 */
export const monitorPageDefinitionIds = [
    'overview',
    'api',
    'channel',
    'service-detail',
    'webhook',
    'redis',
    'datasource',
    'job',
    'job-node-detail',
    'alert',
    'security-intercept',
    'rocketmq',
    'nacos',
    'trace',
] as const;

/** 集中注册的监控页面定义标识。 */
export type MonitorPageDefinitionId = typeof monitorPageDefinitionIds[number];
/** 页面图表区允许使用的固定布局类型。 */
export type MonitorPageLayout = 'overview' | 'analysis' | 'detail' | 'single';

/** 页面对应的固定图表顺序和响应式布局。 */
export interface MonitorPageDefinition {
    id: MonitorPageDefinitionId;
    layout: MonitorPageLayout;
    charts: readonly MonitorChartDefinitionId[];
}

/** 基础设施依赖状态列表项，用于展示健康、告警、错误或未知状态。 */
export interface MonitorStatusItem {
    key: string;
    label: string;
    status: 'healthy' | 'warning' | 'error' | 'unknown';
    value?: string;
    description?: string;
}

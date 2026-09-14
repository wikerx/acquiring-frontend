import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

/** 系统监控工作台的前端请求与响应契约，字段与 service-admin MonitorWorkbenchDTOs 保持一致。 */
export interface PageResult<T> {
    total: number;
    pageNo: number;
    pageSize: number;
    pages: number;
    records: T[];
}

/** 所有趋势查询共用的时间范围和分页参数；时间值按 queryTimeZone 解释。 */
export interface TimeRangeQuery {
    beginTime?: string;
    endTime?: string;
    queryTimeZone?: string;
    pageNo?: number;
    pageSize?: number;
}

/** API 聚合查询条件，筛选维度与后台审计事件字段保持一致。 */
export interface ApiMonitorQuery extends TimeRangeQuery {
    serviceName?: string;
    apiOperation?: string;
    apiPath?: string;
    merchantId?: string;
    responseCode?: string;
    result?: string;
}

/** 支付渠道健康查询条件，不在前端推断渠道或支付方式枚举。 */
export interface ChannelMonitorQuery extends TimeRangeQuery {
    channelCode?: string;
    requestScene?: string;
    currency?: string;
    status?: string;
    errorCode?: string;
    paymentMethod?: string;
}

/** 商户 Webhook 投递查询条件，支持按业务标识、状态和 HTTP 结果定位任务。 */
export interface WebhookMonitorQuery extends TimeRangeQuery {
    merchantId?: string;
    transactionId?: string;
    eventType?: string;
    notifyStatus?: string;
    httpStatus?: number;
}

/** 单笔交易链路定位条件，任一业务标识均由后端执行跨表查询。 */
export interface TraceSearchQuery extends TimeRangeQuery {
    transactionId?: string;
    merchantOrderNo?: string;
    channelOrderNo?: string;
    traceId?: string;
}

/** 已脱敏结构化日志查询条件，关键字只匹配后端允许暴露的审计摘要。 */
export interface LogSearchQuery extends TimeRangeQuery {
    traceId?: string;
    transactionId?: string;
    merchantId?: string;
    merchantOrderNo?: string;
    channelOrderNo?: string;
    serviceName?: string;
    level?: string;
    keyword?: string;
}

/** 告警工作台查询条件，用于筛选来源、级别、处置状态和负责人。 */
export interface AlertQuery extends TimeRangeQuery {
    sourceType?: string;
    level?: string;
    status?: string;
    ownerAccountId?: string;
    keyword?: string;
}

/** 告警人工处置请求；version 用于阻止并发操作覆盖较新的状态。 */
export interface AlertActionRequest {
    version: number;
    remark?: string;
}

/** 可空监控指标摘要；null 表示无样本或能力不可用，不能展示为零。 */
export interface MetricSummary {
    key: string;
    label?: string;
    value: number | null;
    unit?: string;
    status?: string;
    description?: string;
}

/** 统一趋势时间桶，values 中的 null 保留后端缺失语义。 */
export interface TimeBucket {
    timestamp: string;
    values: Record<string, number | null>;
}

/** 分类聚合值，用于 TopN、分布和离散维度图表。 */
export interface CategoryMetric {
    key: string;
    label: string;
    value: number;
}

/** 可选监控提供方能力状态，页面必须展示不可用原因而非伪造空指标。 */
export interface ProviderCapability {
    provider: string;
    status: 'AVAILABLE' | 'NOT_CONFIGURED' | string;
    reason?: string;
}

/** 总览页关键依赖状态，描述服务实际可用性及其运维提示。 */
export interface DependencyStatus {
    key: string;
    label: string;
    status: string;
    value?: string;
    description?: string;
}

/** 告警聚合记录，sourceType 与 sourceId 共同标识受版本保护的告警源。 */
export interface AlertItem {
    sourceType: string;
    sourceId: string;
    level: string;
    serviceName?: string;
    moduleName?: string;
    title: string;
    content?: string;
    occurrenceCount: number;
    firstOccurredAt?: string;
    lastOccurredAt?: string;
    recoveredAt?: string;
    status: string;
    ownerAccountId?: string;
    ownerName?: string;
    handleRemark?: string;
    version: number;
}

/** 系统监控总览响应，组合核心指标、趋势、依赖状态和最新告警。 */
export interface OverviewResponse {
    summaries: MetricSummary[];
    apiTrend: TimeBucket[];
    apiLatencyTrend: TimeBucket[];
    alertTrend: TimeBucket[];
    dependencies: DependencyStatus[];
    latestAlerts: AlertItem[];
    generatedAt?: string;
}

/** 注册中心中的单个服务实例快照，不承诺存在外部指标提供方数据。 */
export interface ServiceInstanceItem {
    serviceName: string;
    instanceId?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    status: string;
    metadata?: Record<string, string>;
}

/** 服务发现汇总及实例列表，metricsCapability 说明外部指标接入状态。 */
export interface ServiceInventoryResponse {
    serviceCount: number;
    instanceCount: number;
    healthyInstanceCount: number;
    unhealthyInstanceCount: number;
    instances: ServiceInstanceItem[];
    metricsCapability?: ProviderCapability;
}

/** Admin JVM 单次运行时采样，无法从当前平台读取的宿主机指标保持 null。 */
export interface RuntimeSample {
    timestamp: string;
    processCpuPercent: number | null;
    systemCpuPercent: number | null;
    systemLoadAverage: number | null;
    physicalMemoryUsedBytes: number | null;
    physicalMemoryTotalBytes: number | null;
    heapUsedBytes: number;
    heapCommittedBytes: number;
    heapMaxBytes: number | null;
    nonHeapUsedBytes: number;
    threadCount: number;
    peakThreadCount: number;
    daemonThreadCount: number;
    loadedClassCount: number;
    gcCount: number;
    gcDurationMillis: number;
    diskTotalBytes: number | null;
    diskUsedBytes: number | null;
    uptimeMillis: number;
}

/** Admin JVM 当前值和七天进程内历史；重启服务后历史会重新积累。 */
export interface RuntimeResponse {
    current?: RuntimeSample;
    samples: RuntimeSample[];
    threadPools: Array<Record<string, unknown>>;
    threadPoolCapability?: ProviderCapability;
    generatedAt?: string;
}

/** 数据源连接池和 SQL 监控指标；能力字段解释数据缺失原因。 */
export interface DataSourceMetricsResponse {
    poolTrend: TimeBucket[];
    latencyTrend: TimeBucket[];
    slowSqlTop: CategoryMetric[];
    poolMetricsCapability?: ProviderCapability;
    sqlMetricsCapability?: ProviderCapability;
    generatedAt?: string;
}

/** Redis 运行指标和有界 Key 类型分布；不包含缓存 Value 或敏感连接参数。 */
export interface CacheMetricsResponse {
    memoryTrend: TimeBucket[];
    opsTrend: TimeBucket[];
    hitRateTrend: TimeBucket[];
    keyTypeDistribution: CategoryMetric[];
    historyCapability?: ProviderCapability;
    keyTypeCapability?: ProviderCapability;
    generatedAt?: string;
}

/** 单个 API 维度的数据库聚合结果，延迟和成功率在无样本时保持 null。 */
export interface ApiAggregateItem {
    apiKey: string;
    apiOperation?: string;
    apiPath?: string;
    requestCount: number;
    failedCount: number;
    successRate: number | null;
    averageMillis: number | null;
    p95Millis: number | null;
    p99Millis: number | null;
    latestResponseCode?: string;
    latestFailureTime?: string;
}

/** API 监控响应，包含全量数据库聚合趋势、TopN 和分页明细。 */
export interface ApiMonitorResponse {
    summaries: MetricSummary[];
    requestTrend: TimeBucket[];
    latencyTrend: TimeBucket[];
    responseCodeTop: CategoryMetric[];
    merchantTop: CategoryMetric[];
    page: PageResult<ApiAggregateItem>;
    httpMetricCapability?: ProviderCapability;
}

/** 单个渠道维度的健康聚合，用于展示失败连续性和延迟分位数。 */
export interface ChannelAggregateItem {
    channelCode: string;
    status: string;
    requestCount: number;
    successCount: number;
    timeoutCount: number;
    successRate: number | null;
    averageMillis: number | null;
    p95Millis: number | null;
    p99Millis: number | null;
    continuousFailureCount: number;
    latestError?: string;
    latestFailureTime?: string;
}

/** 渠道监控响应，组合趋势、失败原因、支付方式成功率和分页结果。 */
export interface ChannelMonitorResponse {
    summaries: MetricSummary[];
    successRateTrend: TimeBucket[];
    latencyTrend: TimeBucket[];
    errorTop: CategoryMetric[];
    paymentMethodRate: CategoryMetric[];
    page: PageResult<ChannelAggregateItem>;
}

/** 单条商户通知任务摘要，错误文本由后端脱敏和限长后返回。 */
export interface WebhookItem {
    eventId: string;
    merchantId?: string;
    transactionId?: string;
    transactionDateTime?: string;
    eventType?: string;
    httpStatus?: number;
    attemptCount?: number;
    lastDurationMillis?: number;
    status?: string;
    nextRetryTime?: string;
    lastError?: string;
    lastAttemptTime?: string;
}

/** Webhook 监控响应，保留成功率、重试和 HTTP 状态的真实空值语义。 */
export interface WebhookMonitorResponse {
    summaries: MetricSummary[];
    successRateTrend: TimeBucket[];
    retryTrend: TimeBucket[];
    httpStatusDistribution: CategoryMetric[];
    page: PageResult<WebhookItem>;
}

/** 交易链路业务摘要，金额和状态仅用于定位与诊断，不参与前端计算。 */
export interface TraceSummary {
    transactionId?: string;
    rootTransactionId?: string;
    operationId?: string;
    merchantId?: string;
    merchantOrderNo?: string;
    transactionType?: string;
    transactionStatus?: string;
    currency?: string;
    amount?: number;
    paymentMethod?: string;
    channelCode?: string;
    channelOrderNo?: string;
    createTime?: string;
    completeTime?: string;
    totalDurationMillis?: number;
}

/** 单个结构化链路事件，错误信息来自后端允许暴露的脱敏上下文。 */
export interface TraceEvent {
    eventId: string;
    transactionId?: string;
    traceId?: string;
    serviceName?: string;
    eventType?: string;
    eventName?: string;
    result?: string;
    startTime?: string;
    endTime?: string;
    durationMillis?: number;
    errorCode?: string;
    errorMessage?: string;
    businessRemark?: string;
}

/** 链路瀑布图阶段，起点和耗时均以整条交易链路的毫秒偏移表示。 */
export interface WaterfallStage {
    key: string;
    label: string;
    startMillis: number;
    durationMillis: number;
    status: string;
}

/** 单笔交易链路响应，apmCapability 说明是否已接入外部 APM 上下文。 */
export interface TraceResponse {
    summary?: TraceSummary;
    events: TraceEvent[];
    waterfall: WaterfallStage[];
    apmCapability?: ProviderCapability;
}

/** 可供管理端展示的脱敏结构化日志条目，不包含原始请求体或凭据。 */
export interface StructuredLogItem {
    id: string;
    timestamp?: string;
    level?: string;
    serviceName?: string;
    eventType?: string;
    message?: string;
    traceId?: string;
    transactionId?: string;
    merchantId?: string;
    referenceId?: string;
}

/** 结构化日志分页结果和可选上下文提供方状态。 */
export interface LogSearchResponse {
    page: PageResult<StructuredLogItem>;
    contextCapability?: ProviderCapability;
}

/** 告警处置历史，记录状态变化、操作者和非敏感备注。 */
export interface AlertHistoryItem {
    id: number;
    action: string;
    fromStatus?: string;
    toStatus?: string;
    operatorAccountId?: string;
    operatorName?: string;
    remark?: string;
    operatedAt?: string;
}

/** 告警中心聚合趋势、来源分布和分页记录。 */
export interface AlertSearchResponse {
    summaries: MetricSummary[];
    trend: TimeBucket[];
    sourceTop: CategoryMetric[];
    page: PageResult<AlertItem>;
}

/** 告警详情及其处置历史，sourceMetrics 仅包含后端允许暴露的诊断指标。 */
export interface AlertDetailResponse {
    alert: AlertItem;
    history: AlertHistoryItem[];
    sourceMetrics: Record<string, unknown>;
    contextMetricCapability?: ProviderCapability;
}

/** 安全拦截事件统计，用于展示趋势、类型和商户 TopN。 */
export interface SecurityStatisticsResponse {
    summaries: MetricSummary[];
    trend: TimeBucket[];
    typeTop: CategoryMetric[];
    merchantTop: CategoryMetric[];
}

/** 查询服务、API、告警和依赖健康总览。 */
export async function getMonitorOverview(payload: TimeRangeQuery): Promise<OverviewResponse> {
    const result = await http.post<CommonResult<OverviewResponse>>('/admin/monitor/workbench/overview', payload);
    return unwrapResult(result.data);
}

/** 查询注册中心服务实例清单和能力状态。 */
export async function getMonitorServices(): Promise<ServiceInventoryResponse> {
    const result = await http.get<CommonResult<ServiceInventoryResponse>>('/admin/monitor/workbench/services');
    return unwrapResult(result.data);
}

/** 查询当前 Admin JVM 运行时历史采样。 */
export async function getMonitorRuntime(payload: TimeRangeQuery): Promise<RuntimeResponse> {
    const result = await http.post<CommonResult<RuntimeResponse>>('/admin/monitor/workbench/runtime', payload);
    return unwrapResult(result.data);
}

/** 查询全部可选监控提供方的配置与可用状态。 */
export async function getMonitorCapabilities(): Promise<ProviderCapability[]> {
    const result = await http.get<CommonResult<ProviderCapability[]>>('/admin/monitor/workbench/capabilities');
    return unwrapResult(result.data);
}

/** 按时间和业务维度检索 API 聚合指标。 */
export async function searchMonitorApis(payload: ApiMonitorQuery): Promise<ApiMonitorResponse> {
    const result = await http.post<CommonResult<ApiMonitorResponse>>('/admin/monitor/workbench/apis/search', payload);
    return unwrapResult(result.data);
}

/** 按交易或链路标识检索脱敏后的结构化处理链路。 */
export async function searchMonitorTrace(payload: TraceSearchQuery): Promise<TraceResponse> {
    const result = await http.post<CommonResult<TraceResponse>>('/admin/monitor/workbench/traces/search', payload);
    return unwrapResult(result.data);
}

/** 按时间和渠道维度检索渠道健康指标。 */
export async function searchMonitorChannels(payload: ChannelMonitorQuery): Promise<ChannelMonitorResponse> {
    const result = await http.post<CommonResult<ChannelMonitorResponse>>('/admin/monitor/workbench/channels/search', payload);
    return unwrapResult(result.data);
}

/** 按时间、商户和状态检索通知投递指标。 */
export async function searchMonitorWebhooks(payload: WebhookMonitorQuery): Promise<WebhookMonitorResponse> {
    const result = await http.post<CommonResult<WebhookMonitorResponse>>('/admin/monitor/workbench/webhooks/search', payload);
    return unwrapResult(result.data);
}

/** 检索由业务事实表生成并脱敏后的结构化日志。 */
export async function searchMonitorLogs(payload: LogSearchQuery): Promise<LogSearchResponse> {
    const result = await http.post<CommonResult<LogSearchResponse>>('/admin/monitor/workbench/logs/search', payload);
    return unwrapResult(result.data);
}

/** 检索统一告警统计和分页明细。 */
export async function searchMonitorAlerts(payload: AlertQuery): Promise<AlertSearchResponse> {
    const result = await http.post<CommonResult<AlertSearchResponse>>('/admin/monitor/workbench/alerts/search', payload);
    return unwrapResult(result.data);
}

/** 查询单个来源告警及其人工处理历史。 */
export async function getMonitorAlertDetail(sourceType: string, sourceId: string): Promise<AlertDetailResponse> {
    const result = await http.get<CommonResult<AlertDetailResponse>>(
        `/admin/monitor/workbench/alerts/${encodeURIComponent(sourceType)}/${encodeURIComponent(sourceId)}`,
    );
    return unwrapResult(result.data);
}

/** 使用版本号乐观锁接手告警。 */
export async function takeOverMonitorAlert(sourceType: string, sourceId: string, payload: AlertActionRequest): Promise<AlertDetailResponse> {
    const result = await http.put<CommonResult<AlertDetailResponse>>(
        `/admin/monitor/workbench/alerts/${encodeURIComponent(sourceType)}/${encodeURIComponent(sourceId)}/take-over`,
        payload,
    );
    return unwrapResult(result.data);
}

/** 使用版本号乐观锁将告警标记为处理中。 */
export async function markMonitorAlertProcessing(sourceType: string, sourceId: string, payload: AlertActionRequest): Promise<AlertDetailResponse> {
    const result = await http.put<CommonResult<AlertDetailResponse>>(
        `/admin/monitor/workbench/alerts/${encodeURIComponent(sourceType)}/${encodeURIComponent(sourceId)}/processing`,
        payload,
    );
    return unwrapResult(result.data);
}

/** 使用版本号乐观锁关闭告警。 */
export async function closeMonitorAlert(sourceType: string, sourceId: string, payload: AlertActionRequest): Promise<AlertDetailResponse> {
    const result = await http.put<CommonResult<AlertDetailResponse>>(
        `/admin/monitor/workbench/alerts/${encodeURIComponent(sourceType)}/${encodeURIComponent(sourceId)}/close`,
        payload,
    );
    return unwrapResult(result.data);
}

/** 查询安全拦截趋势、类型和商户聚合统计。 */
export async function getSecurityMonitorStatistics(payload: TimeRangeQuery): Promise<SecurityStatisticsResponse> {
    const result = await http.post<CommonResult<SecurityStatisticsResponse>>('/admin/monitor/workbench/security/statistics', payload);
    return unwrapResult(result.data);
}

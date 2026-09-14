import type { MonitorPageDefinition, MonitorPageDefinitionId } from './monitorTypes';

/** 系统监控页面布局和图表顺序的集中定义，页面不得自行调整组合。 */
const definitions = [
    { id: 'overview', layout: 'overview', charts: ['overview.apiRequests', 'overview.apiLatency', 'overview.alertTrend'] },
    { id: 'api', layout: 'analysis', charts: ['api.requestTrend', 'api.failureRate', 'api.latency', 'api.httpErrorTop', 'api.merchantTop'] },
    { id: 'channel', layout: 'analysis', charts: ['channel.successRate', 'channel.latency', 'channel.errorTop', 'channel.paymentMethodRate'] },
    { id: 'service-detail', layout: 'detail', charts: ['service.hostUsage', 'service.jvmHeap', 'service.gc', 'service.threadPool'] },
    { id: 'webhook', layout: 'analysis', charts: ['webhook.successRate', 'webhook.httpStatus', 'webhook.retryTrend'] },
    { id: 'redis', layout: 'analysis', charts: ['redis.memory', 'redis.ops', 'redis.hitRate', 'redis.keyTypes'] },
    { id: 'datasource', layout: 'analysis', charts: ['datasource.pool', 'datasource.sqlLatency', 'datasource.slowSqlTop'] },
    { id: 'job', layout: 'single', charts: ['job.resultTrend'] },
    { id: 'job-node-detail', layout: 'detail', charts: ['jobNode.resourceDetail'] },
    { id: 'alert', layout: 'analysis', charts: ['alert.trend', 'alert.sourceTop', 'alert.contextMetric'] },
    { id: 'security-intercept', layout: 'analysis', charts: ['security.interceptTrend', 'security.typeTop', 'security.merchantTop'] },
    { id: 'rocketmq', layout: 'analysis', charts: ['rocketmq.consumerLag', 'rocketmq.tps'] },
    { id: 'nacos', layout: 'single', charts: ['nacos.instanceTrend'] },
    { id: 'trace', layout: 'single', charts: ['trace.waterfall'] },
] as const satisfies readonly MonitorPageDefinition[];

/** 冻结后的页面图表布局索引。 */
export const monitorPageDefinitions = Object.freeze(Object.fromEntries(
    definitions.map((definition) => [definition.id, Object.freeze(definition)]),
)) as unknown as Readonly<Record<MonitorPageDefinitionId, MonitorPageDefinition>>;

/** 按稳定页面 ID 获取受控布局定义。 */
export function getMonitorPageDefinition(id: MonitorPageDefinitionId): MonitorPageDefinition {
    return monitorPageDefinitions[id];
}

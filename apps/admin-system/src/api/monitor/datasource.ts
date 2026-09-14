import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';
import type { DataSourceMetricsResponse } from './workbench';

/** 数据源监控页顶部汇总，反映当前 Admin JVM 的路由、分组、健康和分表规模。 */
export interface DataSourceMonitorOverview {
    activeProfile?: string;
    primaryDataSource?: string;
    strictMode?: boolean;
    routingStrategyClassName?: string;
    registeredDataSourceCount?: number;
    registeredGroupCount?: number;
    healthyDataSourceCount?: number;
    shardingTableCount?: number;
}

/** 动态数据源分组摘要，用于解释负载均衡策略及其成员关系。 */
export interface DataSourceMonitorGroupItem {
    groupName: string;
    strategyClassName?: string;
    memberCount?: number;
    memberKeys?: string[];
}

/** 单个运行时数据源快照；连接信息已由后端脱敏，连接池指标允许因能力不足而为空。 */
export interface DataSourceMonitorDataSourceItem {
    dataSourceKey: string;
    groupName?: string;
    role?: string;
    dataSourceClassName?: string;
    poolName?: string;
    jdbcUrl?: string;
    databaseName?: string;
    running?: boolean;
    reachable?: boolean;
    reachabilityMessage?: string;
    activeConnections?: number;
    idleConnections?: number;
    totalConnections?: number;
    threadsAwaitingConnection?: number;
    maximumPoolSize?: number;
    minimumIdle?: number;
    connectionTimeoutMs?: number;
    idleTimeoutMs?: number;
    maxLifetimeMs?: number;
    relatedShardingTables?: string[];
}

/** 数据源页可选的外部 Druid 控制台入口，不包含控制台认证信息。 */
export interface DataSourceMonitorConsoleAccess {
    provider?: string;
    status?: 'CONFIGURED' | 'NOT_CONFIGURED' | 'MISCONFIGURED' | string;
    url?: string;
    reason?: string;
    localPoolTypes?: string[];
}

/** 单条季度分表规则的只读治理摘要，物理表范围以服务端注册结果为准。 */
export interface DataSourceMonitorShardingRuleItem {
    ruleKey: string;
    logicalTable?: string;
    enabled?: boolean;
    templateTable?: string;
    idColumn?: string;
    shardingColumn?: string;
    actualDataSource?: string;
    actualTargetType?: string;
    actualTargetMembers?: string[];
    description?: string;
    startYear?: number;
    startQuarter?: number;
    endYear?: number;
    endQuarter?: number;
    tableNameFormat?: string;
    currentPhysicalTable?: string;
    nextPhysicalTable?: string;
    currentQuarterAutoIncrementStart?: number;
    currentQuarterAutoIncrementMax?: number;
    physicalTableCount?: number;
    firstPhysicalTable?: string;
    lastPhysicalTable?: string;
    physicalTables?: string[];
}

/** 数据源页面关联的分表治理快照，声明 DDL 数据源和允许执行的结构操作。 */
export interface DataSourceMonitorShardingSnapshot {
    strategy?: string;
    databaseTimezone?: string;
    shardingColumn?: string;
    ddlDataSource?: string;
    allowCreateFromTemplateTable?: boolean;
    allowAlterExistingTable?: boolean;
    setAutoIncrementStartValue?: boolean;
    tables?: DataSourceMonitorShardingRuleItem[];
}

/** 数据源监控完整响应，组合运行时连接池、Druid 外部入口和分表治理信息。 */
export interface DataSourceMonitorResponse {
    overview?: DataSourceMonitorOverview;
    warnings?: string[];
    groups?: DataSourceMonitorGroupItem[];
    dataSources?: DataSourceMonitorDataSourceItem[];
    consoleAccess?: DataSourceMonitorConsoleAccess;
    sharding?: DataSourceMonitorShardingSnapshot;
}

/**
 * 查询管理后台数据源监控快照。
 */
export async function getDatasourceSnapshot(): Promise<DataSourceMonitorResponse> {
    const result = await http.get<CommonResult<DataSourceMonitorResponse>>('/admin/monitor/datasource');
    return unwrapResult(result.data);
}

/**
 * 查询连接池趋势、SQL 延迟分位数和慢 SQL 指纹。
 */
export async function getDatasourceMetrics(): Promise<DataSourceMetricsResponse> {
    const result = await http.get<CommonResult<DataSourceMetricsResponse>>('/admin/monitor/datasource/metrics');
    return unwrapResult(result.data);
}

/**
 * 导出管理后台数据源监控快照。
 */
export async function exportDatasourceSnapshot() {
    await downloadExcel('/admin/monitor/datasource/export', {
        method: 'get',
    });
}

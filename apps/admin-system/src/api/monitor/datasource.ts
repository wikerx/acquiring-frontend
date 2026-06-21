import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

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

export interface DataSourceMonitorGroupItem {
    groupName: string;
    strategyClassName?: string;
    memberCount?: number;
    memberKeys?: string[];
}

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

export interface DataSourceMonitorResponse {
    overview?: DataSourceMonitorOverview;
    warnings?: string[];
    groups?: DataSourceMonitorGroupItem[];
    dataSources?: DataSourceMonitorDataSourceItem[];
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
 * 导出管理后台数据源监控快照。
 */
export async function exportDatasourceSnapshot() {
    await downloadExcel('/admin/monitor/datasource/export', {
        method: 'get',
        fileName: 'datasource-monitor.xlsx',
    });
}

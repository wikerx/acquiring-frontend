import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import type { PageResult } from '@/api/monitor/job';

export interface ShardingRuleRow {
    ruleKey: string;
    logicalTable?: string;
    templateTable?: string;
    enabled?: boolean;
    idColumn?: string;
    shardingColumn?: string;
    actualDataSource?: string;
    description?: string;
    startYear?: number;
    startQuarter?: number;
    endYear?: number;
    endQuarter?: number;
    tableNameFormat?: string;
    currentPhysicalTable?: string;
    nextPhysicalTable?: string;
    physicalTableCount?: number;
    physicalTables?: string[];
}

export interface ShardingPhysicalTableRow {
    id: number;
    logicalTable?: string;
    templateTable?: string;
    physicalTable?: string;
    shardingColumn?: string;
    strategy?: string;
    year?: number;
    quarter?: number;
    quarterSuffix?: string;
    dataSource?: string;
    tableStatus?: string;
    autoCreated?: number;
    autoIncrementStart?: number;
    autoIncrementCurrent?: number;
    autoIncrementMax?: number;
    schemaCheckStatus?: string;
    lastCheckTime?: string;
    createdTime?: string;
    errorMessage?: string;
    createTime?: string;
    updateTime?: string;
}

export interface ShardingPhysicalTableQuery {
    pageNo?: number;
    pageSize?: number;
    logicalTable?: string;
    physicalTable?: string;
    year?: number;
    quarter?: number;
    tableStatus?: string;
    schemaCheckStatus?: string;
}

export interface ShardingTableCreateLogRow {
    id: number;
    batchNo?: string;
    triggerType?: string;
    dryRun?: number;
    targetQuarters?: string;
    plannedCount?: number;
    createdCount?: number;
    skippedCount?: number;
    failedCount?: number;
    schemaMismatchCount?: number;
    runStatus?: string;
    resultSummary?: string;
    errorMessage?: string;
    startTime?: string;
    endTime?: string;
    durationMs?: number;
    operatorId?: string;
    operatorName?: string;
    createTime?: string;
}

export interface ShardingTableCreateLogQuery {
    pageNo?: number;
    pageSize?: number;
    batchNo?: string;
    triggerType?: string;
    dryRun?: number;
    runStatus?: string;
}

export interface ShardingTableCreateRequest {
    includeCurrentQuarter?: boolean;
    includeNextQuarter?: boolean;
    logicalTables?: string[];
    compareSchemaIfExists?: boolean;
}

export interface ShardingTablePreCreateTableResult {
    logicalTable?: string;
    templateTable?: string;
    physicalTable?: string;
    targetQuarter?: string;
    status?: string;
    schemaCheckStatus?: string;
    autoIncrementStart?: number;
    autoIncrementCurrent?: number;
    autoIncrementMax?: number;
    message?: string;
}

export interface ShardingTablePreCreateResult {
    dryRun?: boolean;
    timezone?: string;
    strategy?: string;
    currentQuarter?: string;
    targetQuarters?: string[];
    createdTables?: string[];
    skippedTables?: string[];
    failedTables?: string[];
    schemaMismatchTables?: string[];
    warnings?: string[];
    tableResults?: ShardingTablePreCreateTableResult[];
}

export interface ShardingIdRule {
    mode?: string;
    prefixFormat?: string;
    sequenceWidth?: number;
    startSequence?: number;
    maxSequence?: number;
    currentQuarter?: string;
    currentQuarterStartValue?: number;
    currentQuarterMaxValue?: number;
}

export async function listShardingRules(): Promise<ShardingRuleRow[]> {
    const result = await http.get<CommonResult<ShardingRuleRow[]>>('/admin/monitor/sharding/rules');
    return unwrapResult(result.data);
}

export async function getShardingRule(logicalTable: string): Promise<ShardingRuleRow> {
    const result = await http.get<CommonResult<ShardingRuleRow>>(`/admin/monitor/sharding/rules/${encodeURIComponent(logicalTable)}`);
    return unwrapResult(result.data);
}

export async function searchShardingPhysicalTables(payload: ShardingPhysicalTableQuery): Promise<PageResult<ShardingPhysicalTableRow>> {
    const result = await http.post<CommonResult<PageResult<ShardingPhysicalTableRow>>>('/admin/monitor/sharding/physical-tables/search', payload);
    return unwrapResult(result.data);
}

export async function getShardingPhysicalTable(id: number): Promise<ShardingPhysicalTableRow> {
    const result = await http.get<CommonResult<ShardingPhysicalTableRow>>(`/admin/monitor/sharding/physical-tables/${id}`);
    return unwrapResult(result.data);
}

export async function refreshShardingPhysicalTables(payload: ShardingTableCreateRequest): Promise<ShardingTablePreCreateResult> {
    const result = await http.post<CommonResult<ShardingTablePreCreateResult>>('/admin/monitor/sharding/physical-tables/refresh', payload);
    return unwrapResult(result.data);
}

export async function checkShardingPhysicalTableSchema(payload: ShardingTableCreateRequest): Promise<ShardingTablePreCreateResult> {
    const result = await http.post<CommonResult<ShardingTablePreCreateResult>>('/admin/monitor/sharding/physical-tables/check-schema', payload);
    return unwrapResult(result.data);
}

export async function searchShardingCreateLogs(payload: ShardingTableCreateLogQuery): Promise<PageResult<ShardingTableCreateLogRow>> {
    const result = await http.post<CommonResult<PageResult<ShardingTableCreateLogRow>>>('/admin/monitor/sharding/table-create/logs/search', payload);
    return unwrapResult(result.data);
}

export async function getShardingCreateLog(id: number): Promise<ShardingTableCreateLogRow> {
    const result = await http.get<CommonResult<ShardingTableCreateLogRow>>(`/admin/monitor/sharding/table-create/logs/${id}`);
    return unwrapResult(result.data);
}

export async function dryRunShardingTableCreate(payload: ShardingTableCreateRequest): Promise<ShardingTablePreCreateResult> {
    const result = await http.post<CommonResult<ShardingTablePreCreateResult>>('/admin/monitor/sharding/table-create/dry-run', payload);
    return unwrapResult(result.data);
}

export async function executeShardingTableCreate(payload: ShardingTableCreateRequest): Promise<ShardingTablePreCreateResult> {
    const result = await http.post<CommonResult<ShardingTablePreCreateResult>>('/admin/monitor/sharding/table-create/execute', payload);
    return unwrapResult(result.data);
}

export async function getShardingIdRule(): Promise<ShardingIdRule> {
    const result = await http.get<CommonResult<ShardingIdRule>>('/admin/monitor/sharding/id-rule');
    return unwrapResult(result.data);
}

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const adminRoot = fileURLToPath(new URL('..', import.meta.url));
const srcRoot = path.join(adminRoot, 'src');
const monitorComponentRoot = path.join(srcRoot, 'components', 'MonitorChart');
const governedRoots = [
    path.join(srcRoot, 'views', 'monitor'),
    path.join(srcRoot, 'views', 'channel', 'health'),
    path.join(srcRoot, 'views', 'webhook'),
    path.join(srcRoot, 'views', 'alert'),
    path.join(srcRoot, 'views', 'security', 'intercept-event'),
].filter(existsSync);

const semanticColors = ['#246BFD', '#36A3FF', '#78B8FF', '#22A06B', '#F59E0B', '#E5484D', '#C62828', '#8A97A8'];
const linkableChartIds = new Set([
    'api.httpErrorTop',
    'api.merchantTop',
    'trace.waterfall',
    'channel.errorTop',
    'channel.paymentMethodRate',
    'webhook.httpStatus',
    'alert.sourceTop',
    'security.typeTop',
    'security.merchantTop',
]);
const unifiedTimeRangePages = [
    path.join(srcRoot, 'views', 'monitor', 'overview', 'index.vue'),
    path.join(srcRoot, 'views', 'monitor', 'server', 'index.vue'),
    path.join(srcRoot, 'views', 'monitor', 'api', 'index.vue'),
    path.join(srcRoot, 'views', 'monitor', 'trace', 'index.vue'),
    path.join(srcRoot, 'views', 'monitor', 'channel', 'index.vue'),
    path.join(srcRoot, 'views', 'monitor', 'webhook', 'index.vue'),
    path.join(srcRoot, 'views', 'monitor', 'log', 'index.vue'),
    path.join(srcRoot, 'views', 'monitor', 'alert', 'index.vue'),
    path.join(srcRoot, 'views', 'security', 'intercept-event', 'index.vue'),
];
const expectedChartIds = [
    'overview.apiRequests', 'overview.apiLatency', 'overview.alertTrend', 'service.hostUsage',
    'service.jvmHeap', 'service.gc', 'service.threadPool', 'api.requestTrend', 'api.failureRate',
    'api.latency', 'api.httpErrorTop', 'api.merchantTop', 'trace.waterfall', 'channel.successRate',
    'channel.latency', 'channel.errorTop', 'channel.paymentMethodRate', 'webhook.successRate',
    'webhook.httpStatus', 'webhook.retryTrend', 'redis.memory', 'redis.ops', 'redis.hitRate',
    'redis.keyTypes', 'datasource.pool', 'datasource.sqlLatency', 'datasource.slowSqlTop',
    'job.resultTrend', 'jobNode.resourceDetail', 'alert.trend', 'alert.sourceTop',
    'alert.contextMetric', 'security.interceptTrend', 'security.typeTop', 'security.merchantTop',
    'rocketmq.consumerLag', 'rocketmq.tps', 'nacos.instanceTrend',
];

const violations = [];
const sourceFiles = listFiles(srcRoot).filter((file) => /\.(?:ts|vue)$/.test(file));
for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8');
    const relative = path.relative(adminRoot, file);
    if (/from\s+['"]echarts(?:\/[^'"]*)?['"]/.test(source)) {
        violations.push(`${relative}: direct ECharts imports are forbidden in admin-system`);
    }
    if (file.startsWith(path.join(srcRoot, 'views')) && /MonitorChart\/internal/.test(source)) {
        violations.push(`${relative}: monitoring internal renderers cannot be imported by views`);
    }
}

for (const root of governedRoots) {
    for (const file of listFiles(root).filter((candidate) => /\.(?:ts|vue)$/.test(candidate))) {
        const source = readFileSync(file, 'utf8');
        const relative = path.relative(adminRoot, file);
        const rules = [
            [/\bAnalyticsChart\b/, 'low-level AnalyticsChart usage'],
            [/\b(?:series|xAxis|yAxis|grid|legend)\s*:/, 'page-local ECharts option declarations'],
            [/\btype\s*:\s*['"](?:line|bar|pie)['"]/, 'page-local chart type declarations'],
        ];
        for (const [pattern, label] of rules) {
            if (pattern.test(source)) violations.push(`${relative}: ${label} are forbidden`);
        }
        for (const color of semanticColors) {
            if (source.toUpperCase().includes(color.toUpperCase())) {
                violations.push(`${relative}: monitor semantic color ${color} must come from the controlled token module`);
            }
        }
    }
}

for (const file of unifiedTimeRangePages) {
    if (!existsSync(file)) {
        violations.push(`${path.relative(adminRoot, file)}: unified monitoring time-range page is missing`);
        continue;
    }
    const source = readFileSync(file, 'utf8');
    const relative = path.relative(adminRoot, file);
    if (!/<MonitorTimeRangeSelector\b/.test(source)) {
        violations.push(`${relative}: time-bound monitoring pages must use MonitorTimeRangeSelector`);
    }
    if (/\bTransactionTimeRangeFilter\b/.test(source)) {
        violations.push(`${relative}: transaction-specific time controls are forbidden on monitoring pages`);
    }
}

const definitionSource = readFileSync(path.join(monitorComponentRoot, 'monitorChartDefinitions.ts'), 'utf8');
const typeSource = readFileSync(path.join(monitorComponentRoot, 'monitorTypes.ts'), 'utf8');
const pageSource = readFileSync(path.join(monitorComponentRoot, 'monitorPageDefinitions.ts'), 'utf8');
const tokenSource = readFileSync(path.join(monitorComponentRoot, 'monitorChartTokens.ts'), 'utf8');
const publicEntrySource = readFileSync(path.join(monitorComponentRoot, 'index.ts'), 'utf8');
const adapterSource = readFileSync(path.join(srcRoot, 'api', 'monitor', 'workbenchAdapters.ts'), 'utf8');
const pageDefinitions = parsePageDefinitions(pageSource);
const chartOwners = new Map();
const pageUsages = new Map();
const providerOnlyPages = new Set(['rocketmq', 'nacos']);

for (const id of expectedChartIds) {
    assert.equal(typeSource.includes(`'${id}'`), true, `Missing chart ID type: ${id}`);
    assert.equal(definitionSource.includes(`chart('${id}'`), true, `Missing chart definition: ${id}`);
}
assert.equal((definitionSource.match(/chart\('/g) || []).length, expectedChartIds.length, 'Unexpected duplicate or extra chart definitions');
for (const [pageId, definition] of pageDefinitions) {
    for (const chartId of definition.charts) {
        if (!expectedChartIds.includes(chartId)) {
            violations.push(`monitorPageDefinitions.ts: page ${pageId} references unknown chart ${chartId}`);
            continue;
        }
        const existingOwner = chartOwners.get(chartId);
        if (existingOwner) {
            violations.push(`monitorPageDefinitions.ts: chart ${chartId} is assigned to both ${existingOwner} and ${pageId}`);
        } else {
            chartOwners.set(chartId, pageId);
        }
    }
}
for (const id of expectedChartIds) {
    if (!chartOwners.has(id)) {
        violations.push(`monitorPageDefinitions.ts: chart ${id} is not assigned to a controlled page`);
    }
}

for (const file of listFiles(path.join(srcRoot, 'views')).filter((candidate) => candidate.endsWith('.vue'))) {
    validateViewChartStructure(file, pageDefinitions, pageUsages, violations);
}
for (const pageId of pageDefinitions.keys()) {
    if (!providerOnlyPages.has(pageId) && !pageUsages.has(pageId)) {
        violations.push(`monitorPageDefinitions.ts: controlled page ${pageId} has no MonitorChartGrid usage`);
    }
}

assert.match(definitionSource, /redis\.keyTypes'.*maxItems:\s*5/s, 'Redis donut must be limited to five categories');
assert.match(definitionSource, /service\.gc'.*categoryAxis:\s*'time'/, 'Runtime GC must use the controlled time category axis');
for (const id of expectedChartIds.filter((item) => item.endsWith('Top') || item.endsWith('Top10'))) {
    assert.equal(definitionSource.includes(`chart('${id}'`), true);
}
for (const color of semanticColors) {
    assert.equal(tokenSource.toUpperCase().includes(color.toUpperCase()), true, `Missing controlled semantic color ${color}`);
}
for (const component of ['MonitorChartPanel', 'MonitorChartGrid', 'MonitorTimeRangeSelector', 'MonitorStatusGrid']) {
    assert.match(publicEntrySource, new RegExp(`export \\{ default as ${component} \\}`), `Missing public monitor component ${component}`);
}
assert.doesNotMatch(
    publicEntrySource,
    /monitorChartDefinitions|monitorPageDefinitions|monitorFormatters|monitorOptions|internal\//,
    'Monitor chart registries, formatters, option builders and renderers must remain internal',
);
assert.match(
    adapterSource,
    /hasDatasetValues[\s\S]*value\s*!==\s*null\s*&&\s*Number\.isFinite\(Number\(value\)\)/,
    'Zero is a valid monitoring value; only null or non-numeric values may be treated as missing',
);

if (violations.length) {
    throw new Error(`Monitor chart governance violations:\n${violations.map((item) => `- ${item}`).join('\n')}`);
}

console.log(
    `Monitor chart governance: ${expectedChartIds.length} chart definitions, `
    + `${pageDefinitions.size} page definitions and ${pageUsages.size} implemented page assignments verified.`,
);

function parsePageDefinitions(source) {
    const definitions = new Map();
    const pattern = /\{\s*id:\s*'([^']+)'\s*,\s*layout:\s*'([^']+)'\s*,\s*charts:\s*\[([^\]]*)]\s*}/g;
    for (const match of source.matchAll(pattern)) {
        const [, id, layout, chartSource] = match;
        const charts = [...chartSource.matchAll(/'([^']+)'/g)].map((item) => item[1]);
        if (definitions.has(id)) {
            violations.push(`monitorPageDefinitions.ts: duplicate page definition ${id}`);
        }
        definitions.set(id, { id, layout, charts });
    }
    assert.ok(definitions.size > 0, 'No literal monitor page definitions could be parsed');
    return definitions;
}

function validateViewChartStructure(file, pageDefinitions, pageUsages, violations) {
    const relative = path.relative(adminRoot, file);
    const source = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    const tags = source.match(/<\/?MonitorChart(?:Grid|Panel)\b[^>]*>/g) || [];
    let activeGrid = null;

    for (const tag of tags) {
        const closing = tag.startsWith('</');
        const isGrid = /^<\/?MonitorChartGrid\b/.test(tag);
        if (isGrid && !closing) {
            if (activeGrid) {
                violations.push(`${relative}: nested MonitorChartGrid is forbidden`);
                continue;
            }
            const pageId = literalAttribute(tag, 'page-definition-id');
            if (!pageId) {
                violations.push(`${relative}: MonitorChartGrid requires a literal page-definition-id`);
            }
            activeGrid = { pageId, panels: [] };
            continue;
        }
        if (isGrid && closing) {
            if (!activeGrid) {
                violations.push(`${relative}: MonitorChartGrid closing tag has no matching opening tag`);
                continue;
            }
            validateGridAssignment(relative, activeGrid, pageDefinitions, pageUsages, violations);
            activeGrid = null;
            continue;
        }
        if (closing) continue;

        const chartId = literalAttribute(tag, 'definition-id');
        if (!chartId) {
            violations.push(`${relative}: MonitorChartPanel requires a literal definition-id`);
            continue;
        }
        if (!expectedChartIds.includes(chartId)) {
            violations.push(`${relative}: unknown MonitorChartPanel definition-id ${chartId}`);
        }
        if (linkableChartIds.has(chartId) && !/\s@item-click\s*=/.test(tag)) {
            violations.push(`${relative}: linkable chart ${chartId} must filter or select its list/detail target`);
        }
        if (!activeGrid) {
            violations.push(`${relative}: MonitorChartPanel ${chartId} must be nested inside MonitorChartGrid`);
            continue;
        }
        if (activeGrid.panels.includes(chartId)) {
            violations.push(`${relative}: duplicate MonitorChartPanel ${chartId} in page ${activeGrid.pageId}`);
        }
        activeGrid.panels.push(chartId);
    }

    if (activeGrid) {
        violations.push(`${relative}: MonitorChartGrid for ${activeGrid.pageId || 'unknown page'} is not closed`);
    }
}

function validateGridAssignment(relative, grid, pageDefinitions, pageUsages, violations) {
    const definition = pageDefinitions.get(grid.pageId);
    if (!definition) {
        violations.push(`${relative}: unknown MonitorChartGrid page-definition-id ${grid.pageId || '(missing)'}`);
        return;
    }
    const existingUsage = pageUsages.get(grid.pageId);
    if (existingUsage) {
        violations.push(`${relative}: page ${grid.pageId} already has a MonitorChartGrid in ${existingUsage}`);
    } else {
        pageUsages.set(grid.pageId, relative);
    }

    const expected = new Set(definition.charts);
    const actual = new Set(grid.panels);
    for (const chartId of actual) {
        if (!expected.has(chartId)) {
            const owner = chartOwners.get(chartId);
            violations.push(`${relative}: chart ${chartId} belongs to page ${owner || 'unknown'}, not ${grid.pageId}`);
        }
    }
    const missing = definition.charts.filter((chartId) => !actual.has(chartId));
    const extra = grid.panels.filter((chartId) => !expected.has(chartId));
    if (missing.length || extra.length) {
        violations.push(
            `${relative}: page ${grid.pageId} chart set mismatch; `
            + `missing=[${missing.join(', ')}], extra=[${extra.join(', ')}]`,
        );
    }
}

function literalAttribute(tag, attribute) {
    const match = new RegExp(`\\s${attribute}\\s*=\\s*(["'])([^"']+)\\1`).exec(tag);
    return match?.[2] || null;
}

function listFiles(root) {
    if (!existsSync(root)) return [];
    const files = [];
    for (const name of readdirSync(root)) {
        const candidate = path.join(root, name);
        if (statSync(candidate).isDirectory()) files.push(...listFiles(candidate));
        else files.push(candidate);
    }
    return files;
}

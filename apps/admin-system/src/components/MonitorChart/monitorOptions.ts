import {
    escapeMonitorHtml,
    formatMonitorAxisValue,
    formatMonitorTimeLabel,
    formatMonitorTooltipTime,
    formatMonitorTooltipValue,
} from './monitorFormatters';
import { monitorChartTokens, monitorSemanticColor } from './monitorChartTokens';
import type {
    MonitorCategoryDataset,
    MonitorCategorySeriesDataset,
    MonitorChartDataset,
    MonitorChartDefinition,
    MonitorThreshold,
    MonitorTimeRangeValue,
    MonitorTimeSeriesDataset,
    MonitorUnit,
    MonitorValueSeries,
    MonitorWaterfallDataset,
} from './monitorTypes';

/** 统一 MonitorChart 数据集到 ECharts option 的唯一转换入口。 */
export type MonitorChartOption = Record<string, unknown>;

interface MonitorOptionContext {
    locale?: string;
    timeRange?: MonitorTimeRangeValue;
    thresholds?: MonitorThreshold[];
    otherLabel: string;
}

/** 按受控图表定义生成 ECharts option，页面不得自行覆盖类型、颜色和基础布局。 */
export function createMonitorChartOption(
    definition: MonitorChartDefinition,
    dataset: MonitorChartDataset,
    context: MonitorOptionContext,
): MonitorChartOption {
    switch (definition.kind) {
        case 'line':
            return buildLineOption(definition, dataset as MonitorTimeSeriesDataset, context);
        case 'bar':
            return dataset.kind === 'category'
                ? buildCategoryBarOption(definition, dataset, context)
                : buildSeriesBarOption(definition, dataset as MonitorCategorySeriesDataset, context, false);
        case 'stacked-bar':
            return buildSeriesBarOption(definition, dataset as MonitorCategorySeriesDataset, context, true);
        case 'grouped-bar':
            return buildSeriesBarOption(definition, dataset as MonitorCategorySeriesDataset, context, false);
        case 'bar-line':
            return buildBarLineOption(definition, dataset as MonitorCategorySeriesDataset, context);
        case 'top-n':
            return buildTopNOption(definition, dataset as MonitorCategoryDataset, context);
        case 'donut':
            return buildDonutOption(definition, dataset as MonitorCategoryDataset, context);
        case 'waterfall':
            return buildWaterfallOption(dataset as MonitorWaterfallDataset, context);
        case 'sparkline':
            return buildSparklineOption(definition, dataset as MonitorTimeSeriesDataset);
    }
}

/** 校验数据集类型、序列键、单位和语义色是否符合集中图表定义。 */
export function validateMonitorDataset(definition: MonitorChartDefinition, dataset: MonitorChartDataset): string[] {
    const errors: string[] = [];
    const expectedKind = expectedDatasetKind(definition.kind);
    if (!expectedKind.includes(dataset.kind)) {
        return [`${definition.id} expects ${expectedKind.join(' or ')}, received ${dataset.kind}`];
    }
    if (dataset.kind === 'time-series' || dataset.kind === 'category-series') {
        const categories = dataset.kind === 'time-series' ? dataset.timestamps : dataset.categories;
        const expectedSeries = definition.series || [];
        const actualKeys = dataset.series.map((series) => series.key);
        for (const expected of expectedSeries) {
            const actual = dataset.series.find((series) => series.key === expected.key);
            if (!actual) {
                errors.push(`Missing series ${expected.key}`);
                continue;
            }
            if (actual.semantic !== expected.semantic) errors.push(`Series ${expected.key} must use semantic ${expected.semantic}`);
            if (actual.unit !== expected.unit) errors.push(`Series ${expected.key} must use unit ${expected.unit}`);
            if (actual.values.length !== categories.length) errors.push(`Series ${expected.key} length must match categories`);
        }
        for (const key of actualKeys) {
            if (!expectedSeries.some((series) => series.key === key)) errors.push(`Unexpected series ${key}`);
        }
    }
    if (dataset.kind === 'category' && definition.categorySemantics?.length) {
        for (const item of dataset.values) {
            if (item.semantic && !definition.categorySemantics.includes(item.semantic)) {
                errors.push(`Category ${item.key} cannot use semantic ${item.semantic}`);
            }
        }
    }
    return errors;
}

function buildLineOption(
    definition: MonitorChartDefinition,
    dataset: MonitorTimeSeriesDataset,
    context: MonitorOptionContext,
): MonitorChartOption {
    const primaryUnit = dataset.series[0]?.unit || 'count';
    const series = dataset.series.map((item) => {
        const seriesDefinition = definition.series?.find((candidate) => candidate.key === item.key);
        return {
            name: item.label,
            type: 'line',
            yAxisIndex: seriesDefinition?.axisIndex || 0,
            smooth: 0.12,
            showSymbol: false,
            symbol: 'circle',
            symbolSize: 6,
            connectNulls: false,
            lineStyle: {
                width: 2,
                type: seriesDefinition?.dashed ? 'dashed' : 'solid',
                color: monitorSemanticColor(item.semantic),
            },
            itemStyle: { color: monitorSemanticColor(item.semantic), borderColor: '#FFFFFF', borderWidth: 2 },
            areaStyle: seriesDefinition?.area ? { color: withOpacity(monitorSemanticColor(item.semantic), 0.08) } : undefined,
            data: item.values,
            markLine: buildThresholdMarkLine(item.unit, context.thresholds),
        };
    });
    return {
        color: dataset.series.map((item) => monitorSemanticColor(item.semantic)),
        aria: { enabled: true, description: dataset.series.map((item) => item.label).join(', ') },
        tooltip: buildAxisTooltip(dataset.timestamps, dataset.series, context, true),
        legend: buildLegend(dataset.series.length),
        grid: buildGrid(dataset.series.length > 1),
        xAxis: buildCategoryAxis(dataset.timestamps, (value) => formatMonitorTimeLabel(value, context.timeRange, context.locale)),
        yAxis: buildYAxis(primaryUnit, definition.tightPercentRange, context.locale),
        series,
    };
}

function buildSeriesBarOption(
    definition: MonitorChartDefinition,
    dataset: MonitorCategorySeriesDataset,
    context: MonitorOptionContext,
    stacked: boolean,
): MonitorChartOption {
    const unit = dataset.series[0]?.unit || 'count';
    return {
        color: dataset.series.map((item) => monitorSemanticColor(item.semantic)),
        aria: { enabled: true, description: dataset.series.map((item) => item.label).join(', ') },
        tooltip: buildAxisTooltip(dataset.categories, dataset.series, context, definition.categoryAxis === 'time'),
        legend: buildLegend(dataset.series.length),
        grid: buildGrid(dataset.series.length > 1),
        xAxis: buildCategoryAxis(dataset.categories, categoryAxisFormatter(definition, context)),
        yAxis: buildYAxis(unit, definition.tightPercentRange, context.locale),
        series: dataset.series.map((item, index) => ({
            name: item.label,
            type: 'bar',
            stack: stacked ? 'monitor-total' : undefined,
            barMaxWidth: dataset.series.length > 1 ? 22 : 28,
            itemStyle: {
                color: monitorSemanticColor(item.semantic),
                borderRadius: stacked && index < dataset.series.length - 1 ? 0 : [3, 3, 0, 0],
            },
            data: item.values,
            markLine: index === 0 ? buildThresholdMarkLine(item.unit, context.thresholds) : undefined,
        })),
    };
}

function buildCategoryBarOption(
    definition: MonitorChartDefinition,
    dataset: MonitorCategoryDataset,
    context: MonitorOptionContext,
): MonitorChartOption {
    const values = dataset.values.slice(0, definition.maxItems || dataset.values.length);
    return {
        aria: { enabled: true, description: values.map((item) => `${item.label}: ${item.value}`).join(', ') },
        tooltip: {
            ...baseTooltip(),
            trigger: 'item',
            formatter: (params: { name: string; value: number; dataIndex: number }) => {
                const item = values[params.dataIndex];
                return tooltipCard(escapeMonitorHtml(item?.label || params.name), [
                    [escapeMonitorHtml(item?.label || params.name), formatMonitorTooltipValue(Number(params.value), 'count', context.locale)],
                ]);
            },
        },
        grid: buildGrid(false),
        xAxis: buildCategoryAxis(values.map((item) => item.label)),
        yAxis: buildYAxis('count', false, context.locale),
        series: [{
            type: 'bar',
            barMaxWidth: 30,
            data: values.map((item, index) => ({
                value: item.value,
                itemStyle: {
                    color: monitorSemanticColor(item.semantic || definition.categorySemantics?.[index % (definition.categorySemantics.length || 1)] || 'primary'),
                    borderRadius: [3, 3, 0, 0],
                },
            })),
        }],
    };
}

function buildBarLineOption(
    definition: MonitorChartDefinition,
    dataset: MonitorCategorySeriesDataset,
    context: MonitorOptionContext,
): MonitorChartOption {
    const axisUnits = definition.series?.reduce<MonitorUnit[]>((units, item) => {
        if (!units.includes(item.unit)) units.push(item.unit);
        return units;
    }, []) || ['count'];
    return {
        color: dataset.series.map((item) => monitorSemanticColor(item.semantic)),
        aria: { enabled: true, description: dataset.series.map((item) => item.label).join(', ') },
        tooltip: buildAxisTooltip(dataset.categories, dataset.series, context, definition.categoryAxis === 'time'),
        legend: buildLegend(true),
        grid: buildGrid(true),
        xAxis: buildCategoryAxis(dataset.categories, categoryAxisFormatter(definition, context)),
        yAxis: axisUnits.map((unit, index) => ({
            ...buildYAxis(unit, false, context.locale),
            position: index === 0 ? 'left' : 'right',
            splitLine: index === 0 ? { lineStyle: { color: monitorChartTokens.surface.grid } } : { show: false },
        })),
        series: dataset.series.map((item) => {
            const seriesDefinition = definition.series?.find((candidate) => candidate.key === item.key);
            const isBar = seriesDefinition?.renderer === 'bar';
            return {
                name: item.label,
                type: isBar ? 'bar' : 'line',
                yAxisIndex: seriesDefinition?.axisIndex || 0,
                barMaxWidth: isBar ? 24 : undefined,
                smooth: isBar ? undefined : 0.12,
                showSymbol: isBar ? undefined : false,
                lineStyle: isBar ? undefined : { width: 2, color: monitorSemanticColor(item.semantic) },
                itemStyle: { color: monitorSemanticColor(item.semantic), borderRadius: isBar ? [3, 3, 0, 0] : undefined },
                data: item.values,
            };
        }),
    };
}

function buildTopNOption(
    definition: MonitorChartDefinition,
    dataset: MonitorCategoryDataset,
    context: MonitorOptionContext,
): MonitorChartOption {
    const values = [...dataset.values]
        .sort((left, right) => right.value - left.value)
        .slice(0, definition.maxItems || 10)
        .reverse();
    const semantic = definition.categorySemantics?.[0] || 'primary';
    return {
        color: [monitorSemanticColor(semantic)],
        aria: { enabled: true, description: values.map((item) => `${item.label}: ${item.value}`).join(', ') },
        tooltip: {
            ...baseTooltip(),
            trigger: 'axis',
            axisPointer: { type: 'shadow', shadowStyle: { color: withOpacity(monitorSemanticColor(semantic), 0.05) } },
            formatter: (params: Array<{ dataIndex: number; value: number }>) => {
                const first = params[0];
                const item = first ? values[first.dataIndex] : undefined;
                return item ? tooltipCard(escapeMonitorHtml(item.label), [[escapeMonitorHtml(item.label), formatMonitorTooltipValue(item.value, 'count', context.locale)]]) : '';
            },
        },
        grid: { top: 12, right: 28, bottom: 18, left: 20, containLabel: true },
        xAxis: buildYAxis('count', false, context.locale),
        yAxis: {
            type: 'category',
            data: values.map((item) => item.label),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: monitorChartTokens.text.title, width: 180, overflow: 'truncate', fontSize: 12 },
        },
        series: [{
            type: 'bar',
            barMaxWidth: 20,
            itemStyle: { color: monitorSemanticColor(semantic), borderRadius: [0, 3, 3, 0] },
            data: values.map((item) => item.value),
        }],
    };
}

function buildDonutOption(
    definition: MonitorChartDefinition,
    dataset: MonitorCategoryDataset,
    context: MonitorOptionContext,
): MonitorChartOption {
    const values = aggregateDonutValues(dataset.values, definition.maxItems || 5, context.otherLabel);
    const total = values.reduce((sum, item) => sum + item.value, 0);
    return {
        color: monitorChartTokens.category,
        aria: { enabled: true, description: values.map((item) => `${item.label}: ${item.value}`).join(', ') },
        tooltip: {
            ...baseTooltip(),
            trigger: 'item',
            formatter: (params: { name: string; value: number; percent: number }) => tooltipCard(
                escapeMonitorHtml(params.name),
                [
                    [context.otherLabel, formatMonitorTooltipValue(Number(params.value), 'count', context.locale)],
                    ['%', `${Number(params.percent).toFixed(2)}%`],
                ],
            ),
        },
        title: {
            text: new Intl.NumberFormat(context.locale).format(total),
            left: 'center',
            top: '35%',
            textAlign: 'center',
            textStyle: { color: monitorChartTokens.text.title, fontSize: 20, fontWeight: 600 },
        },
        legend: {
            type: 'scroll',
            orient: 'horizontal',
            left: 12,
            right: 12,
            bottom: 0,
            itemWidth: 10,
            itemHeight: 8,
            textStyle: { color: monitorChartTokens.text.axis, fontSize: 11 },
        },
        series: [{
            type: 'pie',
            radius: ['48%', '70%'],
            center: ['50%', '42%'],
            avoidLabelOverlap: true,
            label: { show: false },
            itemStyle: { borderColor: '#FFFFFF', borderWidth: 3, borderRadius: 3 },
            data: values.map((item) => ({ name: item.label, value: item.value })),
        }],
    };
}

function buildWaterfallOption(dataset: MonitorWaterfallDataset, context: MonitorOptionContext): MonitorChartOption {
    const stages = [...dataset.stages].reverse();
    return {
        aria: { enabled: true, description: stages.map((stage) => `${stage.label}: ${stage.durationMs}ms`).join(', ') },
        tooltip: {
            ...baseTooltip(),
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: Array<{ dataIndex: number }>) => {
                const item = params[0] ? stages[params[0].dataIndex] : undefined;
                return item ? tooltipCard(escapeMonitorHtml(item.label), [[escapeMonitorHtml(item.label), formatMonitorTooltipValue(item.durationMs, 'milliseconds', context.locale)]]) : '';
            },
        },
        grid: { top: 12, right: 30, bottom: 20, left: 18, containLabel: true },
        xAxis: buildYAxis('milliseconds', false, context.locale),
        yAxis: {
            type: 'category',
            data: stages.map((stage) => stage.label),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: monitorChartTokens.text.title, width: 150, overflow: 'truncate' },
        },
        series: [
            {
                type: 'bar',
                stack: 'waterfall',
                silent: true,
                itemStyle: { color: 'transparent' },
                emphasis: { itemStyle: { color: 'transparent' } },
                data: stages.map((stage) => stage.startMs),
            },
            {
                type: 'bar',
                stack: 'waterfall',
                barMaxWidth: 18,
                data: stages.map((stage) => ({
                    value: stage.durationMs,
                    itemStyle: {
                        color: monitorSemanticColor(stage.status === 'normal' ? 'primary' : stage.status),
                        borderRadius: 3,
                    },
                })),
            },
        ],
    };
}

function buildSparklineOption(definition: MonitorChartDefinition, dataset: MonitorTimeSeriesDataset): MonitorChartOption {
    const item = dataset.series[0];
    const semantic = item?.semantic || definition.series?.[0]?.semantic || 'primary';
    return {
        animation: false,
        grid: { top: 3, right: 2, bottom: 3, left: 2 },
        xAxis: { type: 'category', show: false, data: dataset.timestamps },
        yAxis: { type: 'value', show: false, scale: true },
        series: [{
            type: 'line',
            data: item?.values || [],
            showSymbol: false,
            smooth: 0.1,
            silent: true,
            lineStyle: { width: 1.5, color: monitorSemanticColor(semantic) },
            areaStyle: { color: withOpacity(monitorSemanticColor(semantic), 0.06) },
        }],
    };
}

function buildAxisTooltip(
    labels: string[],
    series: MonitorValueSeries[],
    context: MonitorOptionContext,
    labelsAreTime: boolean,
): Record<string, unknown> {
    return {
        ...baseTooltip(),
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: monitorChartTokens.surface.border } },
        formatter: (params: Array<{ dataIndex: number; marker: string; seriesName: string; value: number | null }>) => {
            const first = params[0];
            if (!first) return '';
            const label = labels[first.dataIndex] || '';
            const title = labelsAreTime
                ? formatMonitorTooltipTime(label, context.timeRange, context.locale)
                : label;
            const rows = params.map((param, index) => [
                `${param.marker}${escapeMonitorHtml(param.seriesName)}`,
                formatMonitorTooltipValue(param.value === null ? null : Number(param.value), series[index]?.unit || 'count', context.locale),
            ] as [string, string]);
            return tooltipCard(escapeMonitorHtml(title), rows);
        },
    };
}

function categoryAxisFormatter(
    definition: MonitorChartDefinition,
    context: MonitorOptionContext,
): ((value: string) => string) | undefined {
    return definition.categoryAxis === 'time'
        ? (value) => formatMonitorTimeLabel(value, context.timeRange, context.locale)
        : undefined;
}

function buildLegend(show: boolean | number): Record<string, unknown> {
    return {
        show: Boolean(show),
        top: 0,
        right: 0,
        itemWidth: 10,
        itemHeight: 7,
        textStyle: { color: monitorChartTokens.text.axis, fontSize: 11 },
    };
}

function buildGrid(withLegend: boolean): Record<string, unknown> {
    return { top: withLegend ? 38 : 14, right: 22, bottom: 24, left: 20, containLabel: true };
}

function buildCategoryAxis(data: string[], formatter?: (value: string) => string): Record<string, unknown> {
    return {
        type: 'category',
        boundaryGap: true,
        data,
        axisLine: { lineStyle: { color: monitorChartTokens.surface.border } },
        axisTick: { show: false },
        axisLabel: { color: monitorChartTokens.text.axis, hideOverlap: true, formatter },
    };
}

function buildYAxis(unit: MonitorUnit, tightPercentRange: boolean | undefined, locale?: string): Record<string, unknown> {
    return {
        type: 'value',
        min: unit === 'percent' && tightPercentRange ? 90 : 0,
        max: unit === 'percent' ? 100 : undefined,
        minInterval: unit === 'count' ? 1 : undefined,
        splitLine: { lineStyle: { color: monitorChartTokens.surface.grid } },
        axisLabel: { color: monitorChartTokens.text.axis, formatter: (value: number) => formatMonitorAxisValue(value, unit, locale) },
    };
}

function buildThresholdMarkLine(unit: MonitorUnit, thresholds?: MonitorThreshold[]): Record<string, unknown> | undefined {
    const applicable = (thresholds || []).filter((threshold) => threshold.unit === unit);
    if (!applicable.length) return undefined;
    return {
        silent: true,
        symbol: 'none',
        label: { position: 'insideEndTop', color: monitorChartTokens.text.axis, fontSize: 11 },
        data: applicable.map((threshold) => ({
            name: threshold.label,
            yAxis: threshold.value,
            lineStyle: { type: 'dashed', width: 1, color: monitorSemanticColor(threshold.semantic) },
            label: { formatter: threshold.label },
        })),
    };
}

function baseTooltip(): Record<string, unknown> {
    return {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: monitorChartTokens.surface.border,
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: monitorChartTokens.text.title, fontSize: 12 },
        extraCssText: 'box-shadow:0 8px 24px rgba(31,41,55,.10);border-radius:6px;',
    };
}

function tooltipCard(title: string, rows: Array<[string, string]>): string {
    const body = rows.map(([label, value]) => `<div style="display:flex;justify-content:space-between;gap:28px;line-height:22px"><span>${label}</span><b style="font-variant-numeric:tabular-nums">${escapeMonitorHtml(value)}</b></div>`).join('');
    return `<strong style="display:block;margin-bottom:6px;color:${monitorChartTokens.text.title}">${title}</strong>${body}`;
}

function aggregateDonutValues(values: MonitorCategoryDataset['values'], maxItems: number, otherLabel: string) {
    const sorted = [...values].sort((left, right) => right.value - left.value);
    if (sorted.length <= maxItems) return sorted;
    const visible = sorted.slice(0, Math.max(1, maxItems - 1));
    const otherValue = sorted.slice(Math.max(1, maxItems - 1)).reduce((sum, item) => sum + item.value, 0);
    return [...visible, { key: '__other__', label: otherLabel, value: otherValue }];
}

function expectedDatasetKind(kind: MonitorChartDefinition['kind']): MonitorChartDataset['kind'][] {
    if (kind === 'line' || kind === 'sparkline') return ['time-series'];
    if (kind === 'bar') return ['category', 'category-series'];
    if (kind === 'stacked-bar' || kind === 'grouped-bar' || kind === 'bar-line') return ['category-series'];
    if (kind === 'top-n' || kind === 'donut') return ['category'];
    return ['waterfall'];
}

function withOpacity(hex: string, opacity: number): string {
    const value = hex.replace('#', '');
    const red = Number.parseInt(value.slice(0, 2), 16);
    const green = Number.parseInt(value.slice(2, 4), 16);
    const blue = Number.parseInt(value.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

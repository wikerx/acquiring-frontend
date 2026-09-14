<template>
    <MonitorChartCard
        :title="title"
        :subtitle="subtitle"
        :size="definition.size"
        :state="effectiveState"
        :data-monitor-chart-definition="definitionId"
        @retry="emit('retry')"
    >
        <template v-if="timeRange" #actions>
            <MonitorTimeRangeSelector
                :model-value="timeRange"
                compact
                @update:model-value="emit('timeRangeChange', $event)"
            />
        </template>

        <component
            :is="renderer"
            v-if="showChart"
            :definition="definition"
            :dataset="dataset"
            :thresholds="thresholds"
            :time-range="timeRange"
            :aria-label="ariaLabel || title"
            @chart-click="handleChartClick"
        />
    </MonitorChartCard>
</template>

<script setup lang="ts">
/** 统一处理图表定义校验、加载空态、错误态和点击事件映射的监控面板。 */
import { computed } from 'vue';
import type { Component } from 'vue';
import type { AnalyticsChartClick } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import MonitorTimeRangeSelector from './MonitorTimeRangeSelector.vue';
import { getMonitorChartDefinition } from './monitorChartDefinitions';
import { validateMonitorDataset } from './monitorOptions';
import type {
    MonitorCategoryDataset,
    MonitorChartClickEvent,
    MonitorChartDataset,
    MonitorChartDefinitionId,
    MonitorLoadState,
    MonitorThreshold,
    MonitorTimeRangeValue,
} from './monitorTypes';
import MonitorBarChart from './internal/MonitorBarChart.vue';
import MonitorChartCard from './internal/MonitorChartCard.vue';
import MonitorDonutChart from './internal/MonitorDonutChart.vue';
import MonitorLineChart from './internal/MonitorLineChart.vue';
import MonitorSparkline from './internal/MonitorSparkline.vue';
import MonitorStackedBarChart from './internal/MonitorStackedBarChart.vue';
import MonitorTopNChart from './internal/MonitorTopNChart.vue';
import MonitorWaterfall from './internal/MonitorWaterfall.vue';

const props = withDefaults(defineProps<{
    definitionId: MonitorChartDefinitionId;
    dataset: MonitorChartDataset;
    state: MonitorLoadState;
    timeRange?: MonitorTimeRangeValue;
    thresholds?: MonitorThreshold[];
    ariaLabel?: string;
}>(), {
    thresholds: () => [],
    ariaLabel: '',
});

const emit = defineEmits<{
    retry: [];
    itemClick: [event: MonitorChartClickEvent];
    timeRangeChange: [value: MonitorTimeRangeValue];
}>();

const { t } = useI18n();
const definition = computed(() => getMonitorChartDefinition(props.definitionId));
const title = computed(() => t(definition.value.titleKey));
const subtitle = computed(() => t(definition.value.subtitleKey));
const validationErrors = computed(() => validateMonitorDataset(definition.value, props.dataset));
const effectiveState = computed<MonitorLoadState>(() => {
    if (!validationErrors.value.length) return props.state;
    return {
        status: 'error',
        retryable: false,
        message: import.meta.env.DEV
            ? validationErrors.value.join('; ')
            : t('monitor.chart.invalidDataset'),
    };
});
const showChart = computed(() => effectiveState.value.status === 'ready'
    || (effectiveState.value.status === 'error' && effectiveState.value.stale));

const rendererByKind: Record<string, Component> = {
    line: MonitorLineChart,
    bar: MonitorBarChart,
    'stacked-bar': MonitorStackedBarChart,
    'grouped-bar': MonitorBarChart,
    'bar-line': MonitorBarChart,
    'top-n': MonitorTopNChart,
    donut: MonitorDonutChart,
    waterfall: MonitorWaterfall,
    sparkline: MonitorSparkline,
};
const renderer = computed(() => rendererByKind[definition.value.kind]);

function handleChartClick(payload: AnalyticsChartClick) {
    const value = Array.isArray(payload.value) ? Number(payload.value.at(-1)) : Number(payload.value);
    if (!Number.isFinite(value)) return;

    const series = 'series' in props.dataset
        ? props.dataset.series.find((item) => item.label === payload.seriesName)
        : undefined;
    const event: MonitorChartClickEvent = {
        definitionId: props.definitionId,
        seriesKey: series?.key || payload.seriesName,
        value,
    };

    if (props.dataset.kind === 'time-series' && payload.dataIndex !== undefined) {
        event.timestamp = props.dataset.timestamps[payload.dataIndex];
    } else if (props.dataset.kind === 'category-series' && payload.dataIndex !== undefined) {
        event.dimensionKey = props.dataset.categories[payload.dataIndex];
    } else if (props.dataset.kind === 'category') {
        event.dimensionKey = findCategoryKey(props.dataset, payload);
    } else if (props.dataset.kind === 'waterfall') {
        event.dimensionKey = props.dataset.stages.find((stage) => stage.label === payload.name)?.key;
    }
    emit('itemClick', event);
}

function findCategoryKey(dataset: MonitorCategoryDataset, payload: AnalyticsChartClick): string | undefined {
    return dataset.values.find((item) => item.label === payload.name)?.key;
}
</script>

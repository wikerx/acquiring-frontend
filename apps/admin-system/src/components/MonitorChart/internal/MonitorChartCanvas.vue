<template>
    <AnalyticsChart
        :option="option"
        :aria-label="ariaLabel"
        height="100%"
        @chart-click="emit('chartClick', $event)"
    />
</template>

<script setup lang="ts">
/** 复用共享 AnalyticsChart 的底层画布，并统一透传加载状态和点击事件。 */
import { computed } from 'vue';
import { AnalyticsChart, type AnalyticsChartClick } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { createMonitorChartOption } from '../monitorOptions';
import type {
    MonitorChartDataset,
    MonitorChartDefinition,
    MonitorThreshold,
    MonitorTimeRangeValue,
} from '../monitorTypes';

const props = defineProps<{
    definition: MonitorChartDefinition;
    dataset: MonitorChartDataset;
    thresholds?: MonitorThreshold[];
    timeRange?: MonitorTimeRangeValue;
    ariaLabel: string;
}>();

const emit = defineEmits<{
    chartClick: [payload: AnalyticsChartClick];
}>();

const { locale, t } = useI18n();
const option = computed(() => createMonitorChartOption(props.definition, props.dataset, {
    locale: String(locale.value || 'zh-CN'),
    timeRange: props.timeRange,
    thresholds: props.thresholds,
    otherLabel: t('monitor.chart.other'),
}));
</script>

<template>
    <MonitorChartCanvas v-bind="$props" @chart-click="$emit('chartClick', $event)" />
</template>

<script setup lang="ts">
/** MonitorChart 内部链路瀑布图渲染适配层，页面不得直接使用。 */
import type { AnalyticsChartClick } from '@acquiring/shared';
import MonitorChartCanvas from './MonitorChartCanvas.vue';
import type { MonitorChartDataset, MonitorChartDefinition, MonitorThreshold, MonitorTimeRangeValue } from '../monitorTypes';

defineProps<{
    definition: MonitorChartDefinition;
    dataset: MonitorChartDataset;
    thresholds?: MonitorThreshold[];
    timeRange?: MonitorTimeRangeValue;
    ariaLabel: string;
}>();

defineEmits<{ chartClick: [payload: AnalyticsChartClick] }>();
</script>

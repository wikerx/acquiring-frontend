<template>
    <div class="analytics-chart" :style="{ height }" :aria-label="ariaLabel">
        <div ref="chartHost" class="analytics-chart__canvas" />
        <div v-if="empty && !loading" class="analytics-chart__empty">
            <span class="analytics-chart__empty-mark" aria-hidden="true" />
            <span>{{ emptyText }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
    AriaComponent,
    DataZoomComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
    TimelineComponent,
    TooltipComponent,
} from 'echarts/components';
import { init, use, type ECharts, type EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

use([
    AriaComponent,
    BarChart,
    CanvasRenderer,
    DataZoomComponent,
    GridComponent,
    LegendComponent,
    LineChart,
    PieChart,
    TitleComponent,
    TimelineComponent,
    TooltipComponent,
]);

const props = withDefaults(defineProps<{
    option: EChartsCoreOption;
    loading?: boolean;
    empty?: boolean;
    emptyText?: string;
    height?: string;
    ariaLabel?: string;
}>(), {
    loading: false,
    empty: false,
    emptyText: 'No data',
    height: '320px',
    ariaLabel: 'Analytics chart',
});

const emit = defineEmits<{
    chartClick: [payload: { name: string; seriesName: string; value?: unknown }];
}>();

const chartHost = ref<HTMLDivElement>();
const reducedMotion = computed(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
let chart: ECharts | undefined;
let resizeObserver: ResizeObserver | undefined;

/**
 * 共享统计图主组件负责 ECharts 实例生命周期、响应式尺寸、加载和空状态，业务页面仅提供图表配置。
 */
function renderChart() {
    if (!chartHost.value) return;
    if (!chart) {
        chart = init(chartHost.value, undefined, { renderer: 'canvas' });
        chart.on('click', (params) => emit('chartClick', {
            name: String(params.name ?? ''),
            seriesName: String(params.seriesName ?? ''),
            value: params.value,
        }));
    }
    chart.setOption({ animation: !reducedMotion.value, ...props.option }, { notMerge: true });
    if (props.loading) chart.showLoading({ text: '', color: '#2563eb', maskColor: 'rgba(255,255,255,0.72)' });
    else chart.hideLoading();
}

onMounted(async () => {
    await nextTick();
    renderChart();
    resizeObserver = new ResizeObserver(() => chart?.resize());
    if (chartHost.value) resizeObserver.observe(chartHost.value);
});

watch(() => props.option, renderChart, { deep: true });
watch(() => props.loading, renderChart);

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    chart?.dispose();
    chart = undefined;
});
</script>

<style scoped>
.analytics-chart {
    position: relative;
    width: 100%;
    min-width: 0;
}

.analytics-chart__canvas {
    width: 100%;
    height: 100%;
}

.analytics-chart__empty {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 10px;
    color: #94a3b8;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.82);
}

.analytics-chart__empty-mark {
    display: block;
    width: 52px;
    height: 28px;
    border-right: 1px solid #dbe3ef;
    border-bottom: 1px solid #dbe3ef;
    border-left: 1px solid #dbe3ef;
    background:
        linear-gradient(135deg, transparent 42%, #cbd5e1 43%, #cbd5e1 47%, transparent 48%) 0 12px / 18px 12px repeat-x;
}
</style>

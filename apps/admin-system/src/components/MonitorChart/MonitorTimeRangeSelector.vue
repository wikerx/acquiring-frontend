<template>
    <div class="monitor-time-range" :class="{ 'is-compact': compact }">
        <el-radio-group v-model="selectedPreset" size="small" :disabled="disabled" @change="handlePresetChange">
            <el-radio-button v-for="preset in presets" :key="preset" :value="preset">
                {{ t(`monitor.chart.timeRange.${preset}`) }}
            </el-radio-button>
        </el-radio-group>
        <el-date-picker
            v-if="selectedPreset === 'custom'"
            v-model="customRange"
            type="datetimerange"
            size="small"
            :disabled="disabled"
            :start-placeholder="t('monitor.chart.timeRange.start')"
            :end-placeholder="t('monitor.chart.timeRange.end')"
            :range-separator="t('monitor.chart.timeRange.to')"
            @change="handleCustomChange"
        />
    </div>
</template>

<script setup lang="ts">
/** 统一监控时间范围选择器，支持预设区间和自定义绝对时间。 */
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MonitorTimeRangePreset, MonitorTimeRangeValue } from './monitorTypes';

const props = withDefaults(defineProps<{
    modelValue: MonitorTimeRangeValue;
    compact?: boolean;
    disabled?: boolean;
}>(), {
    compact: false,
    disabled: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: MonitorTimeRangeValue] }>();
const { t } = useI18n();
const presets: MonitorTimeRangePreset[] = ['1h', '6h', '24h', '7d', 'custom'];
const selectedPreset = ref<MonitorTimeRangePreset>(props.modelValue.preset);
const customRange = ref<[Date, Date] | undefined>(parseCustomRange(props.modelValue));

watch(() => props.modelValue, (value) => {
    selectedPreset.value = value.preset;
    customRange.value = parseCustomRange(value);
}, { deep: true });

function handlePresetChange(value: string | number | boolean | undefined) {
    const preset = String(value) as MonitorTimeRangePreset;
    if (preset === 'custom') {
        handleCustomChange(customRange.value);
        return;
    }
    emit('update:modelValue', { preset, timezone: props.modelValue.timezone });
}

function handleCustomChange(value: [Date, Date] | undefined) {
    if (!value?.[0] || !value?.[1]) return;
    emit('update:modelValue', {
        preset: 'custom',
        start: value[0].toISOString(),
        end: value[1].toISOString(),
        timezone: props.modelValue.timezone,
    });
}

function parseCustomRange(value: MonitorTimeRangeValue): [Date, Date] | undefined {
    if (!value.start || !value.end) return undefined;
    const start = new Date(value.start);
    const end = new Date(value.end);
    return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? undefined : [start, end];
}
</script>

<style scoped>
.monitor-time-range { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; }
.monitor-time-range.is-compact :deep(.el-radio-button__inner) { padding: 5px 8px; font-size: 11px; }
.monitor-time-range.is-compact :deep(.el-date-editor) { width: 310px; }

@media (max-width: 960px) {
    .monitor-time-range { justify-content: flex-start; }
}
</style>

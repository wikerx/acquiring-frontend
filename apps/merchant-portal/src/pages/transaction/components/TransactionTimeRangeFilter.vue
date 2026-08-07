<template>
    <div class="transaction-time-range-filter">
        <el-radio-group v-model="activePreset" size="small" class="transaction-time-range-filter__quick" @change="handlePresetChange">
            <template v-if="quickOptions?.length">
                <el-radio-button v-for="item in quickOptions" :key="item.value" :value="item.value">{{ item.label }}</el-radio-button>
            </template>
            <template v-else>
                <el-radio-button value="today">{{ t('transaction.time.today') }}</el-radio-button>
                <el-radio-button value="week">{{ t('transaction.time.thisWeek') }}</el-radio-button>
                <el-radio-button value="month">{{ t('transaction.time.thisMonth') }}</el-radio-button>
            </template>
        </el-radio-group>
        <el-select
            :model-value="timeZone"
            class="transaction-time-range-filter__timezone"
            :placeholder="t('common.pleaseSelect')"
            filterable
            @change="handleTimeZoneChange"
        >
            <el-option v-for="item in timezoneOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-date-picker
            :model-value="modelValue"
            class="transaction-time-range-filter__picker"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            :default-time="rangeDefaultTimes"
            unlink-panels
            editable
            :range-separator="t('common.to')"
            :start-placeholder="t('transaction.order.beginTime')"
            :end-placeholder="t('transaction.order.endTime')"
            @focus="handlePickerFocus"
            @update:model-value="handleDateRangeChange"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { createTransactionAnalyticsRange } from '@acquiring/shared';
import type { SelectOption } from '../shared';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE, resolveTransactionPresetRange } from '../shared';

const props = defineProps<{
    modelValue: string[];
    timeZone: string;
    timezoneOptions: SelectOption[];
    defaultPreset?: string;
    preset?: string;
    quickOptions?: Array<{ value: string; label: string; days: number }>;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string[]];
    'update:timeZone': [value: string];
    'update:preset': [value: string];
}>();

const { t } = useI18n();
const activePreset = ref(props.preset || props.defaultPreset || '');
const rangeDefaultTimes: [Date, Date] = [
    new Date(2000, 0, 1, 0, 0, 0),
    new Date(2000, 0, 1, 23, 59, 59),
];

watch(() => props.preset, (value) => {
    if (value !== undefined && value !== activePreset.value) {
        activePreset.value = value || '';
    }
});

watch(() => props.modelValue, (value) => {
    if (!value?.length) {
        activePreset.value = '';
        emit('update:preset', '');
    }
});

function handlePresetChange(value: string | number | boolean | undefined) {
    const preset = String(value || '');
    if (!preset) return;
    emit('update:preset', preset);
    const rollingOption = props.quickOptions?.find((item) => item.value === preset);
    emit('update:modelValue', rollingOption
        ? createTransactionAnalyticsRange(rollingOption.days, props.timeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE)
        : resolveTransactionPresetRange(preset, props.timeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
}

function handleTimeZoneChange(value: string) {
    const nextTimeZone = value || DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    emit('update:timeZone', nextTimeZone);
    if (activePreset.value) {
        const rollingOption = props.quickOptions?.find((item) => item.value === activePreset.value);
        emit('update:modelValue', rollingOption
            ? createTransactionAnalyticsRange(rollingOption.days, nextTimeZone)
            : resolveTransactionPresetRange(activePreset.value, nextTimeZone));
    }
}

function handleDateRangeChange(value: string[] | null) {
    activePreset.value = '';
    emit('update:preset', '');
    emit('update:modelValue', Array.isArray(value) ? value : []);
}

function handlePickerFocus() {
    activePreset.value = '';
    emit('update:preset', '');
}

</script>

<style scoped>
.transaction-time-range-filter {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    max-width: 760px;
}

.transaction-time-range-filter__quick {
    display: inline-flex;
    flex-wrap: nowrap;
    flex: 0 0 auto;
    min-width: 0;
    white-space: nowrap;
}

.transaction-time-range-filter__quick :deep(.el-radio-button) {
    flex: 0 0 auto;
}

.transaction-time-range-filter__timezone {
    flex: 1 1 190px;
    width: 190px;
    min-width: min(180px, 100%);
    max-width: 244px;
}

.transaction-time-range-filter__picker {
    flex: 1 1 340px;
    width: 340px;
    min-width: min(320px, 100%);
    max-width: 420px;
}

.transaction-time-range-filter :deep(.el-date-editor.transaction-time-range-filter__picker) {
    flex: 1 1 340px;
    width: 340px;
    min-width: min(320px, 100%);
    max-width: 420px;
}

.transaction-time-range-filter :deep(.el-radio-button__inner) {
    min-width: 48px;
    height: 32px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
}

.transaction-time-range-filter :deep(.el-select__wrapper),
.transaction-time-range-filter :deep(.el-date-editor) {
    min-height: 32px;
    height: 32px;
    border-radius: 6px;
    box-shadow: 0 0 0 1px #dfe7f1 inset;
}

.transaction-time-range-filter :deep(.el-range-input),
.transaction-time-range-filter :deep(.el-select__placeholder) {
    color: #344054;
    font-size: 12px;
}

@media (max-width: 980px) {
    .transaction-time-range-filter {
        align-items: stretch;
        max-width: 100%;
    }

    .transaction-time-range-filter__picker,
    .transaction-time-range-filter :deep(.el-date-editor.transaction-time-range-filter__picker) {
        max-width: none;
    }

    .transaction-time-range-filter :deep(.el-date-editor.transaction-time-range-filter__picker) {
        width: 100%;
    }

    .transaction-time-range-filter__quick :deep(.el-radio-button__inner) {
        min-width: 0;
        padding-right: 10px;
        padding-left: 10px;
    }
}

@media (max-width: 560px) {
    .transaction-time-range-filter__quick {
        flex-basis: 100%;
    }

    .transaction-time-range-filter__quick :deep(.el-radio-button) {
        flex: 1 1 0;
    }

    .transaction-time-range-filter__quick :deep(.el-radio-button__inner) {
        width: 100%;
    }

    .transaction-time-range-filter__timezone,
    .transaction-time-range-filter__picker,
    .transaction-time-range-filter :deep(.el-date-editor.transaction-time-range-filter__picker) {
        flex-basis: 100%;
        width: 100%;
        max-width: none;
    }
}
</style>

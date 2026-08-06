<template>
    <div class="transaction-time-range-filter">
        <el-radio-group v-model="activePreset" size="small" class="transaction-time-range-filter__quick" @change="handlePresetChange">
            <el-radio-button value="today">{{ t('transaction.time.today') }}</el-radio-button>
            <el-radio-button value="week">{{ t('transaction.time.thisWeek') }}</el-radio-button>
            <el-radio-button value="month">{{ t('transaction.time.thisMonth') }}</el-radio-button>
        </el-radio-group>
        <el-select
            :model-value="timeZone"
            class="transaction-time-range-filter__timezone"
            :placeholder="t('common.pleaseSelect')"
            filterable
            @change="handleTimeZoneChange"
        >
            <el-option v-for="item in timezoneOptions" :key="item.value" :label="timezoneLabel(item)" :value="item.value" />
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
            :start-placeholder="t('common.startTime')"
            :end-placeholder="t('common.endTime')"
            @focus="handlePickerFocus"
            @update:model-value="handleDateRangeChange"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SelectOption } from '@/views/channel/shared';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE, resolveTransactionPresetRange } from '../shared';

const props = defineProps<{
    modelValue: string[];
    timeZone: string;
    timezoneOptions: SelectOption[];
    defaultPreset?: string;
    preset?: string;
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

watch(() => props.defaultPreset, (value) => {
    if (props.preset === undefined && value && props.modelValue?.length) {
        activePreset.value = value;
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
    if (!preset) {
        return;
    }
    emit('update:preset', preset);
    emit('update:modelValue', resolveTransactionPresetRange(preset, props.timeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
}

function handleTimeZoneChange(value: string) {
    const nextTimeZone = value || DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    emit('update:timeZone', nextTimeZone);
    if (activePreset.value) {
        emit('update:modelValue', resolveTransactionPresetRange(activePreset.value, nextTimeZone));
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

function timezoneLabel(option: SelectOption) {
    if (option.value === DEFAULT_TRANSACTION_QUERY_TIME_ZONE) {
        return t('transaction.time.defaultTimezoneLabel', option.label);
    }
    if (option.value === 'UTC') {
        return t('transaction.time.utcTimezoneLabel', option.label);
    }
    return option.label;
}

</script>

<style scoped>
.transaction-time-range-filter {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
}

.transaction-time-range-filter__quick {
    flex: 0 0 auto;
}

.transaction-time-range-filter__timezone {
    width: 244px;
}

.transaction-time-range-filter__picker {
    width: 460px;
}

@media (max-width: 1200px) {
    .transaction-time-range-filter {
        align-items: flex-start;
        flex-direction: column;
    }

    .transaction-time-range-filter__timezone,
    .transaction-time-range-filter__picker {
        width: min(430px, 100%);
    }
}
</style>

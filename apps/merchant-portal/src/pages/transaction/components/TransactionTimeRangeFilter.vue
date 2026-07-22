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
            <el-option v-for="item in timezoneOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-date-picker
            :model-value="modelValue"
            class="transaction-time-range-filter__picker"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            :range-separator="t('common.to')"
            :start-placeholder="t('transaction.order.beginTime')"
            :end-placeholder="t('transaction.order.endTime')"
            @update:model-value="handleDateRangeChange"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SelectOption } from '../shared';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE } from '../shared';
import { formatDateTimeInTimeZone } from '@/utils/format';

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
    emit('update:modelValue', resolvePresetRange(preset, props.timeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
}

function handleTimeZoneChange(value: string) {
    const nextTimeZone = value || DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    emit('update:timeZone', nextTimeZone);
    if (activePreset.value) {
        emit('update:modelValue', resolvePresetRange(activePreset.value, nextTimeZone));
    }
}

function handleDateRangeChange(value: string[] | null) {
    activePreset.value = '';
    emit('update:preset', '');
    emit('update:modelValue', Array.isArray(value) ? value : []);
}

function resolvePresetRange(preset: string, timeZone: string) {
    const now = resolveZonedNow(timeZone);
    const end = `${now.date}T${now.time}`;
    if (preset === 'week') {
        return [`${startOfWeek(now)}T00:00:00`, end];
    }
    if (preset === 'month') {
        return [`${now.year}-${pad(now.month)}-01T00:00:00`, end];
    }
    return [`${now.date}T00:00:00`, end];
}

function resolveZonedNow(timeZone: string) {
    const text = formatDateTimeInTimeZone(new Date(), timeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    const [date, time] = text.split(' ');
    const [year, month, day] = date.split('-').map(Number);
    return { date, time, year, month, day };
}

function startOfWeek(now: { year: number; month: number; day: number }) {
    const date = new Date(now.year, now.month - 1, now.day);
    const mondayOffset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - mondayOffset);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(value: number) {
    return String(value).padStart(2, '0');
}
</script>

<style scoped>
.transaction-time-range-filter {
    display: inline-grid;
    grid-template-columns: max-content 190px 340px;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 688px;
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
    min-width: 0;
    width: 100%;
}

.transaction-time-range-filter__picker {
    min-width: 0;
    width: 100%;
}

.transaction-time-range-filter :deep(.el-date-editor.transaction-time-range-filter__picker) {
    width: 100%;
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
        grid-template-columns: max-content minmax(160px, 1fr);
        max-width: 100%;
    }

    .transaction-time-range-filter__timezone,
    .transaction-time-range-filter__picker {
        min-width: 0;
        width: 100%;
    }

    .transaction-time-range-filter__picker {
        grid-column: 1 / -1;
    }

    .transaction-time-range-filter__quick :deep(.el-radio-button__inner) {
        min-width: 0;
        padding-right: 10px;
        padding-left: 10px;
    }
}

@media (max-width: 560px) {
    .transaction-time-range-filter {
        grid-template-columns: 1fr;
    }

    .transaction-time-range-filter__quick {
        justify-self: stretch;
    }

    .transaction-time-range-filter__quick :deep(.el-radio-button) {
        flex: 1 1 0;
    }

    .transaction-time-range-filter__quick :deep(.el-radio-button__inner) {
        width: 100%;
    }

    .transaction-time-range-filter__picker {
        grid-column: auto;
    }
}
</style>

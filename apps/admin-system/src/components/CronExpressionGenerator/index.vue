<template>
    <el-dialog
        v-model="visible"
        :title="t('monitor.job.cronGenerator.title')"
        width="980px"
        append-to-body
        destroy-on-close
        class="cron-generator-dialog"
    >
        <div class="cron-generator">
            <el-tabs v-model="activeField" class="cron-generator-tabs">
                <el-tab-pane v-for="field in fields" :key="field.key" :name="field.key" :label="field.label">
                    <div class="cron-rule-panel">
                        <el-radio-group v-model="state[field.key].mode" class="cron-rule-group">
                            <div class="cron-rule-row">
                                <el-radio value="wildcard">{{ field.label }}{{ t('monitor.job.cronGenerator.wildcard') }}</el-radio>
                            </div>
                            <div class="cron-rule-row">
                                <el-radio value="range">{{ t('monitor.job.cronGenerator.rangePrefix') }}</el-radio>
                                <div class="cron-rule-controls">
                                    <el-input-number v-model="state[field.key].rangeStart" :min="field.min" :max="field.max" size="small" />
                                    <span>{{ t('monitor.job.cronGenerator.to') }}</span>
                                    <el-input-number v-model="state[field.key].rangeEnd" :min="field.min" :max="field.max" size="small" />
                                    <span>{{ field.unit }}</span>
                                </div>
                            </div>
                            <div class="cron-rule-row">
                                <el-radio value="interval">{{ t('monitor.job.cronGenerator.from') }}</el-radio>
                                <div class="cron-rule-controls">
                                    <el-input-number v-model="state[field.key].intervalStart" :min="field.min" :max="field.max" size="small" />
                                    <span>{{ field.unit }}{{ t('monitor.job.cronGenerator.startEvery') }}</span>
                                    <el-input-number v-model="state[field.key].intervalStep" :min="1" :max="field.max" size="small" />
                                    <span>{{ field.unit }}{{ t('monitor.job.cronGenerator.once') }}</span>
                                </div>
                            </div>
                            <div class="cron-rule-row">
                                <el-radio value="specific">{{ t('monitor.job.cronGenerator.specific') }}</el-radio>
                                <div class="cron-rule-controls">
                                    <el-select
                                        v-model="state[field.key].specificValues"
                                        multiple
                                        filterable
                                        collapse-tags
                                        collapse-tags-tooltip
                                        size="small"
                                        class="cron-specific-select"
                                        :placeholder="t('common.pleaseSelect')"
                                    >
                                        <el-option
                                            v-for="option in field.options"
                                            :key="option.value"
                                            :label="option.label"
                                            :value="option.value"
                                        />
                                    </el-select>
                                </div>
                            </div>
                        </el-radio-group>
                    </div>
                </el-tab-pane>
            </el-tabs>

            <el-alert
                v-if="previewWarning"
                :title="previewWarning"
                type="warning"
                :closable="false"
                show-icon
                class="cron-preview-warning"
            />

            <div class="cron-summary">
                <div class="cron-summary-fields">
                    <div v-for="field in fields" :key="field.key" class="cron-summary-cell">
                        <span class="cron-summary-label">{{ field.label }}</span>
                        <el-input :model-value="segments[field.key]" readonly size="small" />
                    </div>
                </div>
                <div class="cron-expression-box">
                    <span class="cron-summary-label">{{ t('monitor.job.cronGenerator.expression') }}</span>
                    <el-input :model-value="cronExpression" readonly size="small" />
                </div>
            </div>

            <div class="cron-next-times">
                <div class="cron-next-title">{{ t('monitor.job.cronGenerator.nextTimes') }}</div>
                <ul v-if="nextTimes.length > 0">
                    <li v-for="time in nextTimes" :key="time">{{ time }}</li>
                </ul>
                <el-empty v-else :description="t('monitor.job.cronGenerator.noPreview')" :image-size="60" />
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer cron-generator-footer">
                <el-button type="primary" @click="confirm">{{ t('common.confirm') }}</el-button>
                <el-button type="warning" @click="reset">{{ t('common.reset') }}</el-button>
                <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatDateTime } from '@/utils/format';

type FieldKey = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'week' | 'year';
type RuleMode = 'wildcard' | 'range' | 'interval' | 'specific';

interface FieldConfig {
    key: FieldKey;
    label: string;
    unit: string;
    min: number;
    max: number;
    defaultMode?: RuleMode;
    defaultSegment?: string;
    options: Array<{ label: string; value: number }>;
}

interface FieldState {
    mode: RuleMode;
    rangeStart: number;
    rangeEnd: number;
    intervalStart: number;
    intervalStep: number;
    specificValues: number[];
}

const props = defineProps<{
    modelValue: boolean;
    expression?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    confirm: [expression: string];
}>();

const { t } = useI18n();

const visible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
});

const fields = computed<FieldConfig[]>(() => [
    buildField('second', t('monitor.job.cronGenerator.second'), t('monitor.job.cronGenerator.secondUnit'), 0, 59, 'interval', '0/15'),
    buildField('minute', t('monitor.job.cronGenerator.minute'), t('monitor.job.cronGenerator.minuteUnit'), 0, 59),
    buildField('hour', t('monitor.job.cronGenerator.hour'), t('monitor.job.cronGenerator.hourUnit'), 0, 23),
    buildField('day', t('monitor.job.cronGenerator.day'), t('monitor.job.cronGenerator.dayUnit'), 1, 31),
    buildField('month', t('monitor.job.cronGenerator.month'), t('monitor.job.cronGenerator.monthUnit'), 1, 12),
    buildField('week', t('monitor.job.cronGenerator.week'), t('monitor.job.cronGenerator.weekUnit'), 1, 7, 'wildcard', '?'),
    buildField('year', t('monitor.job.cronGenerator.year'), t('monitor.job.cronGenerator.yearUnit'), new Date().getFullYear(), new Date().getFullYear() + 10, 'wildcard', ''),
]);

const activeField = ref<FieldKey>('second');
const state = reactive<Record<FieldKey, FieldState>>({
    second: defaultFieldState('interval', 0, 59, 0, 15),
    minute: defaultFieldState('wildcard', 0, 59, 0, 1),
    hour: defaultFieldState('wildcard', 0, 23, 0, 1),
    day: defaultFieldState('wildcard', 1, 31, 1, 1),
    month: defaultFieldState('wildcard', 1, 12, 1, 1),
    week: defaultFieldState('wildcard', 1, 7, 1, 1),
    year: defaultFieldState('wildcard', new Date().getFullYear(), new Date().getFullYear() + 10, new Date().getFullYear(), 1),
});

const previewWarning = ref('');

const segments = computed<Record<FieldKey, string>>(() => {
    const result = {} as Record<FieldKey, string>;
    for (const field of fields.value) {
        result[field.key] = buildSegment(field);
    }
    if (result.day !== '*' && result.week !== '?') {
        result.week = '?';
    }
    return result;
});

const cronExpression = computed(() => {
    const base = [
        segments.value.second,
        segments.value.minute,
        segments.value.hour,
        segments.value.day,
        segments.value.month,
        segments.value.week,
    ];
    if (segments.value.year) {
        base.push(segments.value.year);
    }
    return base.join(' ');
});

const nextTimes = computed(() => calculateNextTimes(cronExpression.value));

watch(
    () => props.modelValue,
    (opened) => {
        if (opened) {
            applyExpression(props.expression || '');
        }
    },
);

function buildField(
    key: FieldKey,
    label: string,
    unit: string,
    min: number,
    max: number,
    defaultMode: RuleMode = 'wildcard',
    defaultSegment = '*',
): FieldConfig {
    const options = Array.from({ length: max - min + 1 }, (_, index) => {
        const value = min + index;
        return { label: String(value), value };
    });
    return { key, label, unit, min, max, defaultMode, defaultSegment, options };
}

function defaultFieldState(mode: RuleMode, rangeStart: number, rangeEnd: number, intervalStart: number, intervalStep: number): FieldState {
    return {
        mode,
        rangeStart,
        rangeEnd,
        intervalStart,
        intervalStep,
        specificValues: [],
    };
}

function buildSegment(field: FieldConfig): string {
    const fieldState = state[field.key];
    if (field.key === 'week' && fieldState.mode === 'wildcard') {
        return '?';
    }
    if (field.key === 'year' && fieldState.mode === 'wildcard') {
        return '';
    }
    if (fieldState.mode === 'range') {
        return `${clamp(fieldState.rangeStart, field.min, field.max)}-${clamp(fieldState.rangeEnd, field.min, field.max)}`;
    }
    if (fieldState.mode === 'interval') {
        return `${clamp(fieldState.intervalStart, field.min, field.max)}/${Math.max(1, fieldState.intervalStep)}`;
    }
    if (fieldState.mode === 'specific') {
        const values = [...new Set(fieldState.specificValues)]
            .filter((value) => value >= field.min && value <= field.max)
            .sort((a, b) => a - b);
        return values.length > 0 ? values.join(',') : field.defaultSegment || '*';
    }
    return field.defaultSegment || '*';
}

function applyExpression(expression: string) {
    reset();
    const parts = expression.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 6 || parts.length > 7) {
        return;
    }
    fields.value.forEach((field, index) => parseSegment(field, parts[index] || field.defaultSegment || '*'));
}

function parseSegment(field: FieldConfig, segment: string) {
    const fieldState = state[field.key];
    if (!segment || segment === '*' || segment === '?') {
        fieldState.mode = 'wildcard';
        return;
    }
    if (segment.includes('/')) {
        const [start, step] = segment.split('/');
        fieldState.mode = 'interval';
        fieldState.intervalStart = Number(start || field.min);
        fieldState.intervalStep = Number(step || 1);
        return;
    }
    if (segment.includes('-')) {
        const [start, end] = segment.split('-');
        fieldState.mode = 'range';
        fieldState.rangeStart = Number(start || field.min);
        fieldState.rangeEnd = Number(end || field.max);
        return;
    }
    if (/^\d+(,\d+)*$/.test(segment)) {
        fieldState.mode = 'specific';
        fieldState.specificValues = segment.split(',').map((value) => Number(value));
    }
}

function reset() {
    state.second = defaultFieldState('interval', 0, 59, 0, 15);
    state.minute = defaultFieldState('wildcard', 0, 59, 0, 1);
    state.hour = defaultFieldState('wildcard', 0, 23, 0, 1);
    state.day = defaultFieldState('wildcard', 1, 31, 1, 1);
    state.month = defaultFieldState('wildcard', 1, 12, 1, 1);
    state.week = defaultFieldState('wildcard', 1, 7, 1, 1);
    state.year = defaultFieldState('wildcard', new Date().getFullYear(), new Date().getFullYear() + 10, new Date().getFullYear(), 1);
    previewWarning.value = '';
}

function confirm() {
    emit('confirm', cronExpression.value);
    visible.value = false;
}

function calculateNextTimes(expression: string): string[] {
    previewWarning.value = '';
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 6 || parts.length > 7) {
        previewWarning.value = t('monitor.job.cronGenerator.previewUnsupported');
        return [];
    }
    const [second, minute, hour, day, month, week, year] = parts;
    const now = new Date();
    const maxScanSeconds = 366 * 24 * 60 * 60;
    const result: string[] = [];
    const cursor = new Date(now.getTime() + 1000);
    for (let index = 0; index < maxScanSeconds && result.length < 5; index += 1) {
        if (matches(cursor, { second, minute, hour, day, month, week, year })) {
            result.push(formatDateTime(cursor));
        }
        cursor.setSeconds(cursor.getSeconds() + 1);
    }
    if (result.length === 0) {
        previewWarning.value = t('monitor.job.cronGenerator.previewUnsupported');
    }
    return result;
}

function matches(date: Date, segmentMap: Record<string, string | undefined>) {
    const cronWeek = date.getDay() === 0 ? 7 : date.getDay();
    return matchSegment(date.getSeconds(), segmentMap.second, 0, 59)
        && matchSegment(date.getMinutes(), segmentMap.minute, 0, 59)
        && matchSegment(date.getHours(), segmentMap.hour, 0, 23)
        && matchSegment(date.getDate(), segmentMap.day, 1, 31)
        && matchSegment(date.getMonth() + 1, segmentMap.month, 1, 12)
        && matchSegment(cronWeek, segmentMap.week, 1, 7)
        && matchSegment(date.getFullYear(), segmentMap.year || '*', 1970, 2099);
}

function matchSegment(value: number, segment = '*', min: number, max: number): boolean {
    if (!segment || segment === '*' || segment === '?') {
        return true;
    }
    if (segment.includes(',')) {
        return segment.split(',').some((part) => matchSegment(value, part, min, max));
    }
    if (segment.includes('/')) {
        const [startText, stepText] = segment.split('/');
        const start = startText === '*' || !startText ? min : Number(startText);
        const step = Number(stepText);
        return Number.isFinite(start) && Number.isFinite(step) && step > 0 && value >= start && (value - start) % step === 0;
    }
    if (segment.includes('-')) {
        const [start, end] = segment.split('-').map((item) => Number(item));
        return Number.isFinite(start) && Number.isFinite(end) && value >= start && value <= end;
    }
    const exact = Number(segment);
    return Number.isFinite(exact) && exact >= min && exact <= max && value === exact;
}

function clamp(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.min(Math.max(value, min), max);
}

</script>

<style scoped>
.cron-generator-dialog :deep(.el-dialog__body) {
    padding-top: 12px;
}

.cron-generator {
    overflow: visible;
}

.cron-generator-tabs {
    overflow: visible;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-light);
}

.cron-generator-tabs :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 18px;
    overflow: visible;
}

.cron-generator-tabs :deep(.el-tabs__nav-wrap),
.cron-generator-tabs :deep(.el-tabs__nav-scroll) {
    overflow: visible;
}

.cron-generator-tabs :deep(.el-tabs__nav-wrap::after) {
    bottom: 0;
}

.cron-generator-tabs :deep(.el-tabs__item) {
    height: 44px;
    line-height: 44px;
    padding: 0 20px;
}

.cron-generator-tabs :deep(.el-tabs__active-bar) {
    bottom: 0;
}

.cron-rule-panel {
    min-height: 236px;
    padding: 24px;
}

.cron-rule-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
}

.cron-rule-row {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 34px;
    width: 100%;
    color: var(--el-text-color-regular);
}

.cron-rule-row :deep(.el-radio) {
    display: inline-flex;
    align-items: center;
    flex: 0 0 132px;
    height: 32px;
    margin-right: 0;
}

.cron-rule-row :deep(.el-radio__label) {
    line-height: 32px;
}

.cron-rule-controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    min-height: 32px;
}

.cron-rule-controls :deep(.el-input-number) {
    width: 112px;
}

.cron-rule-controls :deep(.el-input__wrapper),
.cron-summary :deep(.el-input__wrapper) {
    min-height: 32px;
}

.cron-specific-select {
    width: 400px;
    max-width: 100%;
}

.cron-preview-warning {
    margin-top: 16px;
}

.cron-summary {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    margin-top: 16px;
    padding: 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
}

.cron-summary-fields {
    display: grid;
    grid-template-columns: repeat(7, 68px);
    gap: 8px;
    flex: 0 0 auto;
}

.cron-summary-cell,
.cron-expression-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.cron-summary-label {
    color: var(--el-text-color-regular);
    font-size: 13px;
    font-weight: 600;
}

.cron-expression-box {
    flex: 1;
    min-width: 260px;
}

.cron-next-times {
    margin-top: 14px;
    padding: 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
    min-height: 128px;
}

.cron-next-title {
    margin-bottom: 12px;
    color: var(--el-text-color-regular);
    font-weight: 600;
}

.cron-next-times ul {
    margin: 0;
    padding-left: 20px;
}

.cron-next-times li {
    line-height: 28px;
}

.cron-next-times :deep(.el-empty) {
    padding: 6px 0 0;
}

.cron-generator-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.cron-generator-footer :deep(.el-button + .el-button) {
    margin-left: 0;
}

@media (max-width: 768px) {
    .cron-summary {
        align-items: stretch;
        flex-direction: column;
    }

    .cron-summary-fields {
        grid-template-columns: repeat(3, 1fr);
        width: 100%;
    }

    .cron-rule-row {
        align-items: flex-start;
        flex-direction: column;
    }

    .cron-rule-row :deep(.el-radio) {
        flex-basis: auto;
    }

    .cron-expression-box {
        min-width: 100%;
    }
}
</style>

<template>
    <div class="app-container holiday-calendar-page">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="68px">
            <el-form-item :label="$t('holidayCalendar.year')">
                <el-select v-model="query.year" filterable>
                    <el-option v-for="year in yearOptions" :key="year" :label="`${year}`" :value="year" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('holidayCalendar.month')">
                <el-select v-model="query.month">
                    <el-option v-for="month in 12" :key="month" :label="$t('holidayCalendar.monthValue', { month })" :value="month" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="loadMonth">{{ $t('common.search') }}</el-button>
                <el-button :icon="RefreshLeft" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button v-hasPermi="'system:calendar:initialize'" type="primary" plain :icon="Calendar" size="small" @click="initializeYear">
                    {{ $t('holidayCalendar.initializeYear') }}
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button v-hasPermi="'system:calendar:edit'" type="primary" plain :icon="EditPen" size="small" :disabled="!calendar.year" @click="openBatchEditor">
                    {{ $t('holidayCalendar.batchSet') }}
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button v-hasPermi="'system:calendar:confirm'" type="success" plain :icon="CircleCheck" size="small" :disabled="!calendar.year" @click="confirmYear">
                    {{ $t('holidayCalendar.confirmYear') }}
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button v-hasPermi="'system:calendar:export'" type="warning" plain :icon="Download" size="small" :disabled="!calendar.year" @click="exportYear">
                    {{ $t('common.export') }}
                </el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadMonth" />
            </el-col>
        </el-row>

        <section v-loading="loading" class="calendar-panel">
            <header class="calendar-summary">
                <div class="calendar-title">
                    <strong>{{ query.year }} / {{ String(query.month).padStart(2, '0') }}</strong>
                    <span>{{ $t('holidayCalendar.chinaMainland') }} · Asia/Shanghai</span>
                </div>
                <div class="calendar-metrics">
                    <span>{{ $t('holidayCalendar.workdayCount') }} <b>{{ monthStats.workdays }}</b></span>
                    <span>{{ $t('holidayCalendar.holidayCount') }} <b>{{ monthStats.holidays }}</b></span>
                    <span>{{ $t('holidayCalendar.adjustedCount') }} <b>{{ monthStats.adjusted }}</b></span>
                </div>
                <el-tag :type="calendar.year?.yearStatus === 'ACTIVE' ? 'success' : 'warning'">
                    {{ calendar.year ? yearStatusText(calendar.year.yearStatus) : $t('holidayCalendar.notInitialized') }}
                </el-tag>
            </header>

            <div class="calendar-weekdays">
                <span v-for="item in weekdayLabels" :key="item">{{ item }}</span>
            </div>
            <div v-if="calendar.days.length" class="calendar-grid">
                <div v-for="blank in leadingBlanks" :key="`blank-${blank}`" class="calendar-cell is-blank" />
                <button
                    v-for="day in calendar.days"
                    :key="day.calendarDate"
                    type="button"
                    :class="dayCellClass(day)"
                    :disabled="!canEdit"
                    @click="openDayEditor(day)"
                >
                    <span class="calendar-cell__day">{{ dayNumber(day.calendarDate) }}</span>
                    <el-tag v-if="day.adjustedWorkday" size="small" type="success" effect="plain">{{ $t('holidayCalendar.adjustedWorkdayShort') }}</el-tag>
                    <el-tag v-else-if="day.statutoryHoliday" size="small" type="danger" effect="plain">{{ $t('holidayCalendar.statutoryShort') }}</el-tag>
                    <span class="calendar-cell__name">{{ day.holidayName || dayTypeText(day.dayType) }}</span>
                    <small v-if="day.remark" :title="day.remark">{{ day.remark }}</small>
                </button>
            </div>
            <el-empty v-else :description="$t('holidayCalendar.initializeHint')" />

            <footer class="calendar-legend">
                <span><i class="legend-dot is-workday" />{{ $t('holidayCalendar.workday') }}</span>
                <span><i class="legend-dot is-holiday" />{{ $t('holidayCalendar.holiday') }}</span>
                <span><i class="legend-dot is-adjusted" />{{ $t('holidayCalendar.adjustedWorkday') }}</span>
                <span v-if="calendar.year?.confirmedTime" class="calendar-confirmation">
                    {{ $t('holidayCalendar.confirmedBy', { operator: calendar.year.confirmedBy || '-', time: formatDateTime(calendar.year.confirmedTime) }) }}
                </span>
            </footer>
        </section>

        <el-dialog v-model="editorVisible" :title="$t('holidayCalendar.editDayTitle')" width="560px" append-to-body destroy-on-close>
            <el-form ref="editorFormRef" :model="editorForm" :rules="editorRules" label-width="104px" class="dialog-form">
                <el-form-item :label="$t('holidayCalendar.calendarDate')">
                    <el-input :model-value="editorForm.calendarDate" disabled />
                </el-form-item>
                <el-form-item :label="$t('holidayCalendar.dayType')" prop="dayType">
                    <el-segmented v-model="editorForm.dayType" :options="dayTypeOptions" @change="syncDayFlags" />
                </el-form-item>
                <el-form-item :label="$t('holidayCalendar.holidayName')" prop="holidayName">
                    <el-input v-model.trim="editorForm.holidayName" maxlength="128" :placeholder="$t('holidayCalendar.holidayNamePlaceholder')" />
                </el-form-item>
                <el-form-item :label="$t('holidayCalendar.dayAttributes')">
                    <el-checkbox v-model="editorForm.statutoryHoliday" :disabled="editorForm.dayType !== 'HOLIDAY'">{{ $t('holidayCalendar.statutoryHoliday') }}</el-checkbox>
                    <el-checkbox v-model="editorForm.adjustedWorkday" :disabled="editorForm.dayType !== 'WORKDAY'">{{ $t('holidayCalendar.adjustedWorkday') }}</el-checkbox>
                </el-form-item>
                <el-form-item :label="$t('common.remark')">
                    <el-input v-model.trim="editorForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="saving" @click="saveDay">{{ $t('common.save') }}</el-button>
                    <el-button @click="editorVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="batchEditorVisible" :title="$t('holidayCalendar.batchSetTitle')" width="680px" append-to-body destroy-on-close>
            <el-form ref="batchFormRef" :model="batchForm" :rules="batchRules" label-width="112px" class="dialog-form">
                <el-form-item :label="$t('holidayCalendar.selectionMode')" prop="dateMode">
                    <el-segmented v-model="batchForm.dateMode" :options="batchDateModeOptions" @change="syncBatchDateMode" />
                </el-form-item>
                <el-form-item v-if="batchForm.dateMode === 'RANGE'" :label="$t('holidayCalendar.dateRange')" prop="dateRange">
                    <el-date-picker
                        v-model="batchForm.dateRange"
                        type="daterange"
                        unlink-panels
                        :disabled-date="disableDateOutsideSelectedYear"
                        :range-separator="$t('common.to')"
                        :start-placeholder="$t('holidayCalendar.startDate')"
                        :end-placeholder="$t('holidayCalendar.endDate')"
                        value-format="YYYY-MM-DD"
                        format="YYYY-MM-DD"
                    />
                </el-form-item>
                <el-form-item v-else :label="$t('holidayCalendar.multipleDates')" prop="selectedDates">
                    <el-date-picker
                        v-model="batchForm.selectedDates"
                        type="dates"
                        :disabled-date="disableDateOutsideSelectedYear"
                        :placeholder="$t('holidayCalendar.multipleDatesPlaceholder')"
                        value-format="YYYY-MM-DD"
                        format="YYYY-MM-DD"
                    />
                </el-form-item>
                <el-form-item :label="$t('holidayCalendar.dayType')" prop="dayType">
                    <el-segmented v-model="batchForm.dayType" :options="dayTypeOptions" @change="syncBatchDayFlags" />
                </el-form-item>
                <el-form-item :label="$t('holidayCalendar.holidayName')" prop="holidayName">
                    <el-input v-model.trim="batchForm.holidayName" maxlength="128" :placeholder="$t('holidayCalendar.holidayNamePlaceholder')" />
                </el-form-item>
                <el-form-item :label="$t('holidayCalendar.dayAttributes')">
                    <el-checkbox v-model="batchForm.statutoryHoliday" :disabled="batchForm.dayType !== 'HOLIDAY'">{{ $t('holidayCalendar.statutoryHoliday') }}</el-checkbox>
                    <el-checkbox v-model="batchForm.adjustedWorkday" :disabled="batchForm.dayType !== 'WORKDAY'">{{ $t('holidayCalendar.adjustedWorkday') }}</el-checkbox>
                </el-form-item>
                <el-form-item :label="$t('common.remark')">
                    <el-input v-model.trim="batchForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
                </el-form-item>
                <el-form-item v-if="batchPreviewDates.length" :label="$t('holidayCalendar.preview')">
                    <div class="batch-preview">
                        <div class="batch-preview__summary">
                            <strong>{{ $t('holidayCalendar.selectedDays', { count: batchPreviewDates.length }) }}</strong>
                            <span>{{ batchDateModeText }}</span>
                        </div>
                        <div class="batch-preview__dates">
                            <el-tag
                                v-for="date in visibleBatchPreviewDates"
                                :key="date"
                                effect="plain"
                                :closable="batchForm.dateMode === 'MULTIPLE'"
                                @close="removeBatchDate(date)"
                            >
                                {{ date }}
                            </el-tag>
                            <el-tag v-if="batchPreviewDates.length > visibleBatchPreviewDates.length" type="info" effect="plain">
                                {{ $t('holidayCalendar.moreDays', { count: batchPreviewDates.length - visibleBatchPreviewDates.length }) }}
                            </el-tag>
                        </div>
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="batchSaving" @click="saveBatchDays">{{ $t('common.save') }}</el-button>
                    <el-button @click="batchEditorVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { Calendar, CircleCheck, Download, EditPen, RefreshLeft, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { useI18n } from 'vue-i18n';
import {
    confirmHolidayCalendarYear,
    exportHolidayCalendarYear,
    getHolidayCalendarMonth,
    initializeHolidayCalendarYear,
    saveHolidayCalendarDays,
    type HolidayCalendarDay,
    type HolidayCalendarMonth,
} from '@/api/system/holiday-calendar';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { useUserStore } from '@/store/modules/user';
import { formatDateTime } from '@/utils/format';

type BatchDateMode = 'RANGE' | 'MULTIPLE';

const now = new Date();
const { t } = useI18n();
const userStore = useUserStore();
const canEdit = userStore.hasPermission('system:calendar:edit');
const showSearch = ref(true);
const loading = ref(false);
const saving = ref(false);
const query = reactive({ year: now.getFullYear(), month: now.getMonth() + 1 });
const calendar = ref<HolidayCalendarMonth>({ year: null, days: [] });
const editorVisible = ref(false);
const editorFormRef = ref<FormInstance>();
const editorForm = reactive({
    calendarDate: '',
    dayType: 'WORKDAY' as 'WORKDAY' | 'HOLIDAY',
    holidayName: '',
    statutoryHoliday: false,
    adjustedWorkday: false,
    remark: '',
});
const editorRules: FormRules = {
    dayType: [{ required: true, message: t('holidayCalendar.dayTypeRequired'), trigger: 'change' }],
};
const batchEditorVisible = ref(false);
const batchSaving = ref(false);
const batchFormRef = ref<FormInstance>();
const batchForm = reactive({
    dateMode: 'RANGE' as BatchDateMode,
    dateRange: [] as string[],
    selectedDates: [] as string[],
    dayType: 'HOLIDAY' as 'WORKDAY' | 'HOLIDAY',
    holidayName: '',
    statutoryHoliday: false,
    adjustedWorkday: false,
    remark: '',
});
const batchRules: FormRules = {
    dateRange: [{ required: true, message: t('holidayCalendar.dateRangeRequired'), trigger: 'change' }],
    selectedDates: [{ required: true, message: t('holidayCalendar.dateSelectionRequired'), trigger: 'change' }],
    dayType: [{ required: true, message: t('holidayCalendar.dayTypeRequired'), trigger: 'change' }],
};
const yearOptions = Array.from({ length: 11 }, (_, index) => now.getFullYear() - 3 + index);
const weekdayLabels = computed(() => [
    t('holidayCalendar.weekday.monday'),
    t('holidayCalendar.weekday.tuesday'),
    t('holidayCalendar.weekday.wednesday'),
    t('holidayCalendar.weekday.thursday'),
    t('holidayCalendar.weekday.friday'),
    t('holidayCalendar.weekday.saturday'),
    t('holidayCalendar.weekday.sunday'),
]);
const dayTypeOptions = computed(() => [
    { label: t('holidayCalendar.workday'), value: 'WORKDAY' },
    { label: t('holidayCalendar.holiday'), value: 'HOLIDAY' },
]);
const batchDateModeOptions = computed(() => [
    { label: t('holidayCalendar.continuousRange'), value: 'RANGE' },
    { label: t('holidayCalendar.multipleDates'), value: 'MULTIPLE' },
]);
const leadingBlanks = computed(() => {
    if (!calendar.value.days.length) return 0;
    const first = calendar.value.days[0]?.dayOfWeek || 1;
    return Math.max(first - 1, 0);
});
const monthStats = computed(() => calendar.value.days.reduce((result, day) => {
    if (day.dayType === 'WORKDAY') result.workdays += 1;
    else result.holidays += 1;
    if (day.adjustedWorkday) result.adjusted += 1;
    return result;
}, { workdays: 0, holidays: 0, adjusted: 0 }));
const batchPreviewDates = computed(() => batchForm.dateMode === 'RANGE'
    ? expandDateRange(batchForm.dateRange)
    : normalizeSelectedDates(batchForm.selectedDates));
const visibleBatchPreviewDates = computed(() => batchPreviewDates.value.slice(0, 14));
const batchDateModeText = computed(() => batchForm.dateMode === 'RANGE'
    ? t('holidayCalendar.continuousRange')
    : t('holidayCalendar.multipleDates'));

onMounted(loadMonth);

/** Load one month from the cached global China mainland settlement calendar. */
async function loadMonth() {
    loading.value = true;
    try {
        calendar.value = await getHolidayCalendarMonth(query.year, query.month);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function resetQuery() {
    query.year = now.getFullYear();
    query.month = now.getMonth() + 1;
    loadMonth();
}

async function initializeYear() {
    try {
        await ElMessageBox.confirm(
            t('holidayCalendar.initializeConfirm', { year: query.year }),
            t('holidayCalendar.initializeYear'),
            { type: 'warning' },
        );
        await initializeHolidayCalendarYear(query.year);
        ElMessage.success(t('holidayCalendar.initialized'));
        await loadMonth();
    } catch (error) {
        if (error === 'cancel' || error === 'close') return;
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    }
}

async function confirmYear() {
    try {
        await ElMessageBox.confirm(
            t('holidayCalendar.confirmPrompt', { year: query.year }),
            t('holidayCalendar.confirmYear'),
            { type: 'warning' },
        );
        await confirmHolidayCalendarYear(query.year);
        ElMessage.success(t('holidayCalendar.confirmed'));
        await loadMonth();
    } catch (error) {
        if (error === 'cancel' || error === 'close') return;
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    }
}

async function exportYear() {
    try {
        await exportHolidayCalendarYear(query.year);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.exportFailed'));
    }
}

function openDayEditor(day: HolidayCalendarDay) {
    if (!canEdit) return;
    Object.assign(editorForm, {
        calendarDate: day.calendarDate,
        dayType: day.dayType,
        holidayName: day.holidayName || '',
        statutoryHoliday: day.statutoryHoliday,
        adjustedWorkday: day.adjustedWorkday,
        remark: day.remark || '',
    });
    editorVisible.value = true;
    nextTick(() => editorFormRef.value?.clearValidate());
}

function syncDayFlags(value: string | number | boolean) {
    if (value === 'WORKDAY') editorForm.statutoryHoliday = false;
    if (value === 'HOLIDAY') editorForm.adjustedWorkday = false;
}

/** Open the batch editor for a continuous range or arbitrary dates in the initialized year. */
function openBatchEditor() {
    if (!canEdit || !calendar.value.year) return;
    Object.assign(batchForm, {
        dateMode: 'RANGE',
        dateRange: [],
        selectedDates: [],
        dayType: 'HOLIDAY',
        holidayName: '',
        statutoryHoliday: false,
        adjustedWorkday: false,
        remark: '',
    });
    batchEditorVisible.value = true;
    nextTick(() => batchFormRef.value?.clearValidate());
}

/** Keep a batch within the selected China mainland calendar year. */
function disableDateOutsideSelectedYear(date: Date) {
    return date.getFullYear() !== query.year;
}

/** Clear the inactive selection to ensure one batch has a single, unambiguous date source. */
function syncBatchDateMode() {
    batchForm.dateRange = [];
    batchForm.selectedDates = [];
    nextTick(() => batchFormRef.value?.clearValidate(['dateRange', 'selectedDates']));
}

function syncBatchDayFlags(value: string | number | boolean) {
    if (value === 'WORKDAY') batchForm.statutoryHoliday = false;
    if (value === 'HOLIDAY') batchForm.adjustedWorkday = false;
}

/** Save every selected date through the existing batch API after same-year validation. */
async function saveBatchDays() {
    const valid = await batchFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    const dates = batchPreviewDates.value;
    if (!dates.length || dates.some((date) => Number(date.slice(0, 4)) !== query.year)) {
        ElMessage.error(t('holidayCalendar.sameYearRequired'));
        return;
    }
    batchSaving.value = true;
    try {
        await saveHolidayCalendarDays(dates.map((calendarDate) => ({
            calendarDate,
            dayType: batchForm.dayType,
            holidayName: batchForm.holidayName || undefined,
            statutoryHoliday: batchForm.statutoryHoliday,
            adjustedWorkday: batchForm.adjustedWorkday,
            remark: batchForm.remark || undefined,
        })));
        ElMessage.success(t('holidayCalendar.batchSaved', { count: dates.length }));
        batchEditorVisible.value = false;
        await loadMonth();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    } finally {
        batchSaving.value = false;
    }
}

/** Normalize arbitrary selections so preview and persistence are deterministic. */
function normalizeSelectedDates(values: string[]) {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.filter((value) => parseLocalDate(value) !== null))].sort();
}

function removeBatchDate(date: string) {
    batchForm.selectedDates = batchForm.selectedDates.filter((value) => value !== date);
}

/** Expand an ISO local-date range without applying browser timezone conversion. */
function expandDateRange(range: string[]) {
    if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) return [];
    const start = parseLocalDate(range[0]);
    const end = parseLocalDate(range[1]);
    if (!start || !end || end.getTime() < start.getTime()) return [];
    const dates: string[] = [];
    const cursor = new Date(start.getTime());
    while (cursor.getTime() <= end.getTime()) {
        dates.push(formatLocalDate(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
}

function parseLocalDate(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatLocalDate(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function saveDay() {
    const valid = await editorFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    saving.value = true;
    try {
        await saveHolidayCalendarDays([{
            calendarDate: editorForm.calendarDate,
            dayType: editorForm.dayType,
            holidayName: editorForm.holidayName || undefined,
            statutoryHoliday: editorForm.statutoryHoliday,
            adjustedWorkday: editorForm.adjustedWorkday,
            remark: editorForm.remark || undefined,
        }]);
        ElMessage.success(t('common.saveSuccess'));
        editorVisible.value = false;
        await loadMonth();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    } finally {
        saving.value = false;
    }
}

function dayCellClass(day: HolidayCalendarDay) {
    return {
        'calendar-cell': true,
        'is-holiday': day.dayType === 'HOLIDAY',
        'is-adjusted': day.adjustedWorkday,
        'is-statutory': day.statutoryHoliday,
    };
}

function dayNumber(value: string) {
    return Number(value.slice(-2));
}

function dayTypeText(value: string) {
    return value === 'WORKDAY' ? t('holidayCalendar.workday') : t('holidayCalendar.holiday');
}

function yearStatusText(value: string) {
    return value === 'ACTIVE' ? t('holidayCalendar.active') : t('holidayCalendar.draft');
}
</script>

<style scoped>
.search-form :deep(.el-select) { width: 180px; }
.calendar-panel { overflow: hidden; border: 1px solid #dfe6ee; border-radius: 6px; background: #fff; }
.calendar-summary { display: grid; grid-template-columns: minmax(180px, 1fr) auto auto; align-items: center; gap: 24px; padding: 16px 18px; border-bottom: 1px solid #e6ebf1; background: #f8fafc; }
.calendar-title strong { display: block; color: #17243a; font-size: 20px; letter-spacing: 0; }
.calendar-title span { display: block; margin-top: 4px; color: #7a8494; font-size: 12px; }
.calendar-metrics { display: flex; align-items: center; gap: 18px; color: #667085; font-size: 12px; }
.calendar-metrics b { margin-left: 4px; color: #17243a; font-size: 15px; }
.calendar-weekdays,
.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.calendar-weekdays { border-bottom: 1px solid #e6ebf1; background: #fff; }
.calendar-weekdays span { padding: 10px; color: #667085; font-size: 12px; font-weight: 600; text-align: center; }
.calendar-cell { position: relative; min-height: 112px; padding: 11px; overflow: hidden; border: 0; border-right: 1px solid #edf0f4; border-bottom: 1px solid #edf0f4; background: #fff; color: #344054; font: inherit; text-align: left; cursor: pointer; }
.calendar-cell:nth-child(7n) { border-right: 0; }
.calendar-cell:not(:disabled):hover { z-index: 1; box-shadow: inset 0 0 0 2px var(--el-color-primary); }
.calendar-cell:disabled { cursor: default; }
.calendar-cell.is-blank { background: #fafbfc; }
.calendar-cell.is-holiday { background: #fff8f7; }
.calendar-cell.is-adjusted { background: #f3faf7; }
.calendar-cell__day { display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px; color: #17243a; font-size: 14px; font-weight: 700; }
.calendar-cell .el-tag { position: absolute; top: 10px; right: 9px; }
.calendar-cell__name { display: block; margin-top: 8px; overflow: hidden; font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.calendar-cell small { display: block; margin-top: 7px; overflow: hidden; color: #98a2b3; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.calendar-legend { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; min-height: 48px; padding: 10px 16px; color: #667085; font-size: 12px; }
.calendar-legend > span { display: inline-flex; align-items: center; gap: 6px; }
.legend-dot { width: 9px; height: 9px; border: 1px solid #d0d5dd; border-radius: 50%; background: #fff; }
.legend-dot.is-holiday { border-color: #f2b8b5; background: #fff0ef; }
.legend-dot.is-adjusted { border-color: #98d3bc; background: #e9f7f0; }
.calendar-confirmation { margin-left: auto; }
.dialog-form { padding: 4px 20px 0; }
.dialog-form :deep(.el-segmented) { width: 100%; }
.dialog-form :deep(.el-date-editor) { width: 100%; }
.batch-preview { width: 100%; overflow: hidden; border: 1px solid #dfe6ee; border-radius: 6px; background: #f8fafc; }
.batch-preview__summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #e6ebf1; }
.batch-preview__summary strong { color: #17243a; font-size: 13px; }
.batch-preview__summary span { color: #697586; font-size: 12px; }
.batch-preview__dates { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 12px; }
@media (max-width: 900px) {
    .calendar-summary { grid-template-columns: 1fr auto; }
    .calendar-metrics { grid-column: 1 / -1; grid-row: 2; }
    .calendar-cell { min-height: 96px; padding: 8px; }
}
@media (max-width: 640px) {
    .calendar-metrics { gap: 10px; }
    .calendar-weekdays span { padding: 8px 2px; font-size: 10px; }
    .calendar-cell { min-height: 72px; padding: 5px; }
    .calendar-cell__name,
    .calendar-cell small,
    .calendar-cell .el-tag { display: none; }
}
</style>

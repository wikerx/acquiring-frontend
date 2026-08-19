<template>
    <div class="app-container channel-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('channel.alert.eventCode')">
                <el-input v-model.trim="query.eventCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('channel.alert.ruleName')">
                <el-input v-model.trim="query.ruleName" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('channel.common.channel')">
                <el-select v-model="query.channelId" :placeholder="t('channel.common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.alert.ruleType')">
                <el-select v-model="query.ruleType" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in ruleTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.alert.alertLevel')">
                <el-select v-model="query.alertLevel" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in alertLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.alert.eventStatus')">
                <el-select v-model="query.eventStatus" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in eventStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.alert.triggerTime')">
                <el-date-picker v-model="triggerRange" type="datetimerange" :default-time="FULL_DAY_RANGE_DEFAULT_TIMES" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" :range-separator="t('common.to')" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ t('channel.common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ t('channel.common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="success" plain :icon="CircleCheck" size="small" :disabled="selectedRows.length !== 1" @click="openAcknowledge(selectedRows[0])" v-hasPermi="'channel:alert-event:acknowledge'">{{ t('channel.alert.acknowledge') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'channel:alert-event:remove'">{{ t('channel.common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="channel-alert-event" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="eventCode" :label="t('channel.alert.eventCode')" min-width="170" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="ruleName" :label="t('channel.alert.ruleName')" min-width="170" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.common.channel')" min-width="170" align="center" :show-overflow-tooltip="true"><template #default="{ row }">{{ channelDisplayText(row) }}</template></el-table-column>
            <el-table-column :label="t('channel.alert.ruleType')" min-width="140" align="center"><template #default="{ row }">{{ optionLabel(ruleTypeOptions, row.ruleType) }}</template></el-table-column>
            <el-table-column :label="t('channel.alert.alertLevel')" width="120" align="center"><template #default="{ row }"><el-tag size="small" :type="alertLevelType(row.alertLevel)">{{ optionLabel(alertLevelOptions, row.alertLevel) }}</el-tag></template></el-table-column>
            <el-table-column :label="t('channel.alert.triggerValue')" min-width="120" align="center"><template #default="{ row }">{{ triggerValueText(row) }}</template></el-table-column>
            <el-table-column :label="t('channel.alert.eventStatus')" width="110" align="center"><template #default="{ row }"><el-tag size="small" :type="eventStatusType(row.eventStatus)">{{ optionLabel(eventStatusOptions, row.eventStatus) }}</el-tag></template></el-table-column>
            <el-table-column :label="t('channel.alert.notifyStatus')" width="110" align="center"><template #default="{ row }"><el-tag size="small" :type="notifyStatusType(row.notifyStatus)">{{ optionLabel(notifyStatusOptions, row.notifyStatus) }}</el-tag></template></el-table-column>
            <el-table-column :label="t('channel.alert.triggerTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.triggerTime" /></template></el-table-column>
            <el-table-column :label="t('channel.common.operation')" width="210" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'channel:alert-event:detail'">{{ t('channel.common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="CircleCheck" :disabled="row.eventStatus === 'ACKNOWLEDGED'" @click="openAcknowledge(row)" v-hasPermi="'channel:alert-event:acknowledge'">{{ t('channel.alert.acknowledge') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'channel:alert-event:remove'">{{ t('channel.common.delete') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('channel.alert.eventDetailTitle')" size="full">
            <div v-if="detailRow" class="alert-event-detail">
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item :label="t('channel.alert.eventCode')">{{ detailRow.eventCode }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.ruleCode')">{{ detailRow.ruleCode }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.ruleName')">{{ detailRow.ruleName }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.common.channel')">{{ channelDisplayText(detailRow) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.common.businessType')">{{ optionLabel(businessOptions, detailRow.businessType) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.capability.paymentScope')">{{ scopeText(detailRow.paymentMethod, detailRow.cardBrand) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.ruleType')">{{ optionLabel(ruleTypeOptions, detailRow.ruleType) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.alertLevel')"><el-tag size="small" :type="alertLevelType(detailRow.alertLevel)">{{ optionLabel(alertLevelOptions, detailRow.alertLevel) }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.eventStatus')"><el-tag size="small" :type="eventStatusType(detailRow.eventStatus)">{{ optionLabel(eventStatusOptions, detailRow.eventStatus) }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.notifyStatus')"><el-tag size="small" :type="notifyStatusType(detailRow.notifyStatus)">{{ optionLabel(notifyStatusOptions, detailRow.notifyStatus) }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.windowRange')"><BaseDateTime :value="detailRow.windowStartTime" /> - <BaseDateTime :value="detailRow.windowEndTime" /></el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.triggerTime')"><BaseDateTime :value="detailRow.triggerTime" /></el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.sampleCount')">{{ detailRow.sampleCount ?? 0 }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.failureSuccessCount')">{{ detailRow.failureCount ?? 0 }} / {{ detailRow.successCount ?? 0 }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.successRate')">{{ rateText(detailRow.successRate) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.errorRate')">{{ rateText(detailRow.errorRate) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.maxContinuousFailureCount')">{{ detailRow.maxContinuousFailureCount ?? '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.averageLatencyMillis')">{{ detailRow.averageLatencyMillis ?? '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.triggerValue')">{{ triggerValueText(detailRow) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.acknowledgedBy')">{{ detailRow.acknowledgedBy || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.acknowledgedTime')"><BaseDateTime :value="detailRow.acknowledgedTime" /></el-descriptions-item>
                    <el-descriptions-item :label="t('channel.common.remark')" :span="2">{{ detailRow.remark || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('channel.alert.thresholdSnapshot')" :span="2"><pre class="alert-code-block">{{ prettyJson(detailRow.thresholdSnapshot) }}</pre></el-descriptions-item>
                </el-descriptions>

                <section class="notify-log-section" v-hasPermi="'channel:alert-notify-log:list'">
                    <div class="notify-log-section__header">
                        <strong>{{ t('channel.alert.notifyLogs') }}</strong>
                        <el-button size="small" :icon="Refresh" @click="loadNotifyLogs">{{ t('channel.common.search') }}</el-button>
                    </div>
                    <StandardTable table-key="channel-alert-notify-log" v-loading="notifyLogLoading" :data="notifyLogRows" row-key="id" size="small">
                        <el-table-column prop="notifyType" :label="t('channel.alert.notifyType')" width="90" align="center">
                            <template #default="{ row }">{{ row.notifyType === 'EMAIL' ? t('channel.alert.email') : row.notifyType }}</template>
                        </el-table-column>
                        <el-table-column :label="t('channel.alert.notifyStatus')" width="110" align="center"><template #default="{ row }"><el-tag size="small" :type="notifyStatusType(row.notifyStatus)">{{ optionLabel(notifyStatusOptions, row.notifyStatus) }}</el-tag></template></el-table-column>
                        <el-table-column prop="emailRecipients" :label="t('channel.alert.emailRecipients')" min-width="220" align="center" :show-overflow-tooltip="true" />
                        <el-table-column prop="emailCc" :label="t('channel.alert.emailCc')" min-width="160" align="center" :show-overflow-tooltip="true" />
                        <el-table-column :label="t('channel.alert.sendStartTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.sendStartTime" /></template></el-table-column>
                        <el-table-column :label="t('channel.alert.sendEndTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.sendEndTime" /></template></el-table-column>
                        <el-table-column prop="failReason" :label="t('channel.alert.failReason')" min-width="220" align="center" :show-overflow-tooltip="true" />
                    </StandardTable>
                </section>
            </div>
        </CommonDetailDrawer>

        <el-dialog :title="t('channel.alert.acknowledgeTitle')" v-model="ackVisible" width="520px" append-to-body destroy-on-close>
            <el-form label-width="88px" size="small">
                <el-form-item :label="t('channel.common.remark')"><el-input v-model="ackRemark" type="textarea" maxlength="500" show-word-limit /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitAcknowledge">{{ t('channel.common.confirm') }}</el-button>
                    <el-button @click="ackVisible = false">{{ t('channel.common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { FULL_DAY_RANGE_DEFAULT_TIMES } from '@acquiring/shared';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CircleCheck, Delete, Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    acknowledgeChannelAlertEvent,
    deleteChannelAlertEvent,
    getChannelAlertEvent,
    searchChannelAlertEvents,
    searchChannelAlertNotifyLogs,
    type ChannelAlertEvent,
    type ChannelAlertNotifyLog,
} from '@/api/channel-alert';
import { channelDisplayText, channelOptionLabel, loadChannelOptions, loadDictOptions, optionLabel, showChannelError, type SelectOption } from '../shared';
import type { ChannelOption } from '@/api/channel';
import { useUserStore } from '@/store/modules/user';

const { locale, t } = useI18n();
const userStore = useUserStore();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ChannelAlertEvent[]>([]);
const selectedRows = ref<ChannelAlertEvent[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const channelOptions = ref<ChannelOption[]>([]);
const businessOptions = ref<SelectOption[]>([]);
const acquiringPaymentOptions = ref<SelectOption[]>([]);
const payoutPaymentOptions = ref<SelectOption[]>([]);
const cardBrandOptions = ref<SelectOption[]>([]);
const ruleTypeOptions = ref<SelectOption[]>([]);
const alertLevelOptions = ref<SelectOption[]>([]);
const eventStatusOptions = ref<SelectOption[]>([]);
const notifyStatusOptions = ref<SelectOption[]>([]);
const triggerRange = ref<string[]>([]);
const detailVisible = ref(false);
const detailRow = ref<ChannelAlertEvent | null>(null);
const notifyLogLoading = ref(false);
const notifyLogRows = ref<ChannelAlertNotifyLog[]>([]);
const ackVisible = ref(false);
const ackRow = ref<ChannelAlertEvent | null>(null);
const ackRemark = ref('');

const query = reactive({
    eventCode: '',
    ruleName: '',
    channelId: undefined as number | undefined,
    ruleType: '',
    alertLevel: '',
    eventStatus: '',
});

onMounted(async () => {
    await Promise.all([loadOptions(), loadData()]);
});

watch(locale, () => loadOptions());

async function loadOptions() {
    const lang = String(locale.value || 'zh-CN');
    const [channels, business, acquiringPayments, payoutPayments, cardBrands, ruleTypes, alertLevels, eventStatuses, notifyStatuses] = await Promise.all([
        loadChannelOptions(),
        loadDictOptions('channel_business_type', lang),
        loadDictOptions('acquiring_payment_method', lang),
        loadDictOptions('payout_payment_method', lang),
        loadDictOptions('card_brand', lang),
        loadDictOptions('channel_alert_rule_type', lang),
        loadDictOptions('channel_alert_level', lang),
        loadDictOptions('channel_alert_event_status', lang),
        loadDictOptions('channel_alert_notify_status', lang),
    ]);
    channelOptions.value = channels;
    businessOptions.value = business;
    acquiringPaymentOptions.value = acquiringPayments;
    payoutPaymentOptions.value = payoutPayments;
    cardBrandOptions.value = cardBrands;
    ruleTypeOptions.value = ruleTypes;
    alertLevelOptions.value = alertLevels;
    eventStatusOptions.value = eventStatuses;
    notifyStatusOptions.value = notifyStatuses;
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchChannelAlertEvents({
            pageNo: page.value,
            pageSize: pageSize.value,
            eventCode: query.eventCode || undefined,
            ruleName: query.ruleName || undefined,
            channelId: query.channelId,
            ruleType: query.ruleType || undefined,
            alertLevel: query.alertLevel || undefined,
            eventStatus: query.eventStatus || undefined,
            triggerStartTime: triggerRange.value?.[0],
            triggerEndTime: triggerRange.value?.[1],
        });
        rows.value = result.records;
        total.value = result.total;
        selectedRows.value = [];
    } catch (error) {
        await showChannelError(error, t('common.loadFailed'), t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    Object.assign(query, { eventCode: '', ruleName: '', channelId: undefined, ruleType: '', alertLevel: '', eventStatus: '' });
    triggerRange.value = [];
    handleSearch();
}

async function openDetail(row: ChannelAlertEvent) {
    detailRow.value = await getChannelAlertEvent(row.id);
    detailVisible.value = true;
    if (userStore.hasPermission('channel:alert-notify-log:list')) {
        await loadNotifyLogs();
    }
}

async function loadNotifyLogs() {
    if (!detailRow.value) {
        notifyLogRows.value = [];
        return;
    }
    notifyLogLoading.value = true;
    try {
        const result = await searchChannelAlertNotifyLogs({ pageNo: 1, pageSize: 50, eventId: detailRow.value.id });
        notifyLogRows.value = result.records;
    } catch (error) {
        await showChannelError(error, t('common.loadFailed'), t('common.loadFailed'));
    } finally {
        notifyLogLoading.value = false;
    }
}

function openAcknowledge(row: ChannelAlertEvent) {
    ackRow.value = row;
    ackRemark.value = row.remark || '';
    ackVisible.value = true;
}

async function submitAcknowledge() {
    if (!ackRow.value) {
        return;
    }
    try {
        await acknowledgeChannelAlertEvent(ackRow.value.id, ackRemark.value || undefined);
    } catch (error) {
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.operationSuccess'));
    ackVisible.value = false;
    if (detailRow.value?.id === ackRow.value.id) {
        detailRow.value = await getChannelAlertEvent(ackRow.value.id);
    }
    loadData();
}

async function handleDelete(target?: ChannelAlertEvent | ChannelAlertEvent[]) {
    const targets = Array.isArray(target) ? target : (target ? [target] : []);
    if (!targets.length) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('channel.alert.eventDeleteConfirm', { name: targets.map((item) => item.eventCode).join('、') }), t('channel.common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        await Promise.all(targets.map((item) => deleteChannelAlertEvent(item.id)));
    } catch (error) {
        await showChannelError(error, t('common.deleteFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.deleteSuccess'));
    loadData();
}

function scopeText(paymentMethod?: string, cardBrand?: string) {
    const paymentOptions = [...acquiringPaymentOptions.value, ...payoutPaymentOptions.value];
    const payment = !paymentMethod || paymentMethod === 'ALL' ? t('channel.common.all') : optionLabel(paymentOptions, paymentMethod);
    const card = !cardBrand || cardBrand === 'ALL' ? '' : ` / ${optionLabel(cardBrandOptions.value, cardBrand)}`;
    return `${payment}${card}`;
}

function triggerValueText(row: ChannelAlertEvent) {
    if (row.triggerValueCount !== undefined && row.triggerValueCount !== null) {
        return `${row.triggerValueCount} ${t('channel.alert.countUnit')}`;
    }
    if (row.triggerValueRate !== undefined && row.triggerValueRate !== null) {
        return `${row.triggerValueRate}%`;
    }
    if (row.triggerValueMillis !== undefined && row.triggerValueMillis !== null) {
        return `${row.triggerValueMillis} ms`;
    }
    return '-';
}

function rateText(value?: number) {
    return value === undefined || value === null ? '-' : `${value}%`;
}

function alertLevelType(value?: string) {
    if (value === 'L1_WARNING') {
        return 'warning';
    }
    if (value === 'L2_DEGRADED' || value === 'L3_CIRCUIT_BREAK') {
        return 'danger';
    }
    return 'info';
}

function eventStatusType(value?: string) {
    if (value === 'ACKNOWLEDGED' || value === 'RESOLVED') {
        return 'success';
    }
    if (value === 'OPEN') {
        return 'warning';
    }
    return 'info';
}

function notifyStatusType(value?: string) {
    if (value === 'SENT') {
        return 'success';
    }
    if (value === 'FAILED') {
        return 'danger';
    }
    if (value === 'PENDING') {
        return 'warning';
    }
    return 'info';
}

function prettyJson(value?: string) {
    if (!value) {
        return '-';
    }
    try {
        return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        return value;
    }
}
</script>

<style scoped>
.alert-event-detail {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.notify-log-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.notify-log-section__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.alert-code-block {
    margin: 0;
    max-height: 220px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    line-height: 1.6;
}
</style>

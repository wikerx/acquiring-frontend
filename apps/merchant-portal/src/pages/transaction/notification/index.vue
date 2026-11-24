<template>
    <div class="page system-page merchant-redesigned-page merchant-notification-page">
        <section class="merchant-list-card merchant-search-card merchant-notification-filter">
            <el-form v-show="showSearch" :model="query" inline size="small" class="search-form notification-search-form">
                <div class="search-form__fields">
                    <el-form-item :label="t('transaction.notification.merchantOrderNo')">
                        <el-input v-model.trim="query.merchantOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="applyQuery" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.notification.transactionId')">
                        <el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="applyQuery" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.notification.notifyStatus')">
                        <el-select v-model="query.notifyStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                            <el-option v-for="status in statusOptions" :key="status" :label="statusText(status)" :value="status" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.notification.timeRange')" class="notification-time-form-item">
                        <TransactionTimeRangeFilter
                            v-model="dateRange"
                            v-model:time-zone="query.queryTimeZone"
                            v-model:preset="quickPreset"
                            :timezone-options="timezoneOptions"
                            default-preset="today"
                        />
                    </el-form-item>
                    <el-form-item class="merchant-search-actions">
                        <el-button type="primary" :icon="Search" @click="applyQuery">{{ t('common.search') }}</el-button>
                        <el-button :icon="RefreshLeft" @click="resetQuery">{{ t('common.reset') }}</el-button>
                    </el-form-item>
                </div>
            </el-form>
        </section>

        <section class="merchant-list-card merchant-table-card merchant-notification-table-card">
            <div class="merchant-table-head">
                <div class="merchant-table-head__actions" />
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </div>
            <StandardTable
                table-key="merchant-transaction-notification-v2"
                v-loading="loading"
                :data="rows"
                row-key="notifyId"
                size="small"
            >
                <el-table-column :label="t('transaction.notification.notifyId')" min-width="226" fixed="left">
                    <template #default="{ row }">
                        <div class="notification-identity">
                            <button
                                v-if="canDetail"
                                class="notification-identity__link"
                                type="button"
                                @click="openDetail(row)"
                            >
                                {{ row.notifyId || '-' }}
                            </button>
                            <code v-else>{{ row.notifyId || '-' }}</code>
                            <el-tooltip :content="t('transaction.notification.copyField', { field: t('transaction.notification.notifyId') })" placement="top">
                                <el-button
                                    v-if="row.notifyId"
                                    class="notification-copy-button"
                                    text
                                    circle
                                    size="small"
                                    :icon="CopyDocument"
                                    :aria-label="t('transaction.notification.copyField', { field: t('transaction.notification.notifyId') })"
                                    @click.stop="copyText(row.notifyId)"
                                />
                            </el-tooltip>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.notification.transactionId')" min-width="226">
                    <template #default="{ row }">
                        <div class="notification-identity">
                            <button
                                v-if="canOpenTransaction && row.transactionId"
                                class="notification-identity__link"
                                type="button"
                                :title="t('transaction.notification.openTransaction')"
                                @click="openTransaction(row)"
                            >
                                {{ row.transactionId }}
                            </button>
                            <code v-else>{{ row.transactionId || '-' }}</code>
                            <el-tooltip :content="t('transaction.notification.copyField', { field: t('transaction.notification.transactionId') })" placement="top">
                                <el-button
                                    v-if="row.transactionId"
                                    class="notification-copy-button"
                                    text
                                    circle
                                    size="small"
                                    :icon="CopyDocument"
                                    :aria-label="t('transaction.notification.copyField', { field: t('transaction.notification.transactionId') })"
                                    @click.stop="copyText(row.transactionId)"
                                />
                            </el-tooltip>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.notification.merchantOrderNo')" min-width="204">
                    <template #default="{ row }">
                        <div class="notification-identity">
                            <code>{{ row.merchantOrderNo || '-' }}</code>
                            <el-tooltip :content="t('transaction.notification.copyField', { field: t('transaction.notification.merchantOrderNo') })" placement="top">
                                <el-button
                                    v-if="row.merchantOrderNo"
                                    class="notification-copy-button"
                                    text
                                    circle
                                    size="small"
                                    :icon="CopyDocument"
                                    :aria-label="t('transaction.notification.copyField', { field: t('transaction.notification.merchantOrderNo') })"
                                    @click.stop="copyText(row.merchantOrderNo)"
                                />
                            </el-tooltip>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.notification.notifyType')" min-width="150" align="center">
                    <template #default="{ row }">{{ notifyTypeText(row.notifyType) }}</template>
                </el-table-column>
                <el-table-column :label="t('transaction.notification.eventType')" min-width="150" align="center">
                    <template #default="{ row }">{{ eventTypeText(row.eventType) }}</template>
                </el-table-column>
                <el-table-column :label="t('transaction.notification.notifyStatus')" width="116" align="center">
                    <template #default="{ row }">
                        <el-tag size="small" :type="statusTag(row.notifyStatus)">{{ statusText(row.notifyStatus) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.notification.attemptProgress')" width="112" align="center">
                    <template #default="{ row }">{{ row.lastAttemptNo || 0 }}</template>
                </el-table-column>
                <el-table-column :label="t('transaction.notification.nextRetryTime')" min-width="178" align="center">
                    <template #default="{ row }">
                        <BaseDateTime :value="row.nextRetryTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" />
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.notification.transactionTime')" min-width="178" align="center">
                    <template #default="{ row }">
                        <BaseDateTime :value="row.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" />
                    </template>
                </el-table-column>
                <el-table-column
                    v-if="canDetail || canRetry"
                    :label="t('common.operation')"
                    width="172"
                    fixed="right"
                    align="center"
                >
                    <template #default="{ row }">
                        <TableRowActions
                            :actions="rowActions(row)"
                            :more-label="t('common.more')"
                            @select="handleRowAction($event, row)"
                        />
                    </template>
                </el-table-column>
            </StandardTable>

            <div class="pagination-container" v-show="total > 0">
                <el-pagination
                    v-model:current-page="page"
                    v-model:page-size="pageSize"
                    :total="total"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
                    @size-change="loadData"
                    @current-change="loadData"
                />
            </div>
        </section>

        <el-drawer
            v-model="detailVisible"
            :title="t('transaction.notification.detailTitle')"
            size="min(1280px, 96vw)"
            class="merchant-notification-detail-drawer"
            destroy-on-close
            append-to-body
        >
            <template #header>
                <div class="notification-drawer-header">
                    <div>
                        <strong>{{ t('transaction.notification.detailTitle') }}</strong>
                        <span v-if="detail?.notification?.notifyId">{{ detail.notification.notifyId }}</span>
                    </div>
                    <el-tooltip
                        v-if="canRetry && detail?.notification && !manualRetryEligible(detail.notification)"
                        :content="t('transaction.notification.resendUnavailable')"
                        placement="bottom"
                    >
                        <span>
                            <el-button size="small" :icon="RefreshRight" disabled>
                                {{ t('transaction.notification.resend') }}
                            </el-button>
                        </span>
                    </el-tooltip>
                    <el-button
                        v-else-if="canRetry && detail?.notification"
                        type="primary"
                        plain
                        size="small"
                        :icon="RefreshRight"
                        :loading="retryingNotifyId === detail.notification.notifyId"
                        @click="retryNotification(detail.notification)"
                    >
                        {{ t('transaction.notification.resend') }}
                    </el-button>
                </div>
            </template>

            <div v-loading="detailLoading" class="merchant-notification-detail">
                <template v-if="detail?.notification">
                    <section class="notification-detail-hero">
                        <div class="notification-detail-hero__identity">
                            <span>{{ t('transaction.notification.merchantOrderNo') }}</span>
                            <strong>{{ detail.notification.merchantOrderNo || '-' }}</strong>
                            <div class="notification-detail-hero__meta">
                                <button
                                    v-if="canOpenTransaction && detail.notification.transactionId"
                                    type="button"
                                    @click="openTransaction(detail.notification)"
                                >
                                    {{ detail.notification.transactionId }}
                                </button>
                                <code v-else>{{ detail.notification.transactionId || '-' }}</code>
                                <el-button
                                    v-if="detail.notification.transactionId"
                                    text
                                    circle
                                    size="small"
                                    :icon="CopyDocument"
                                    :aria-label="t('transaction.notification.copyField', { field: t('transaction.notification.transactionId') })"
                                    @click="copyText(detail.notification.transactionId)"
                                />
                            </div>
                        </div>
                        <div class="notification-detail-hero__status">
                            <span>{{ t('transaction.notification.notifyStatus') }}</span>
                            <el-tag :type="statusTag(detail.notification.notifyStatus)" effect="light" size="large">
                                {{ statusText(detail.notification.notifyStatus) }}
                            </el-tag>
                        </div>
                    </section>

                    <section class="notification-detail-section">
                        <h3>{{ t('transaction.notification.deliveryOverview') }}</h3>
                        <dl class="notification-detail-metrics">
                            <div>
                                <dt>{{ t('transaction.notification.notifyType') }}</dt>
                                <dd>{{ notifyTypeText(detail.notification.notifyType) }}</dd>
                            </div>
                            <div>
                                <dt>{{ t('transaction.notification.eventType') }}</dt>
                                <dd>{{ eventTypeText(detail.notification.eventType) }}</dd>
                            </div>
                            <div>
                                <dt>{{ t('transaction.notification.attemptProgress') }}</dt>
                                <dd>{{ detail.notification.lastAttemptNo || 0 }}</dd>
                            </div>
                            <div>
                                <dt>{{ t('transaction.notification.successTime') }}</dt>
                                <dd>
                                    <BaseDateTime :value="detail.notification.successTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" />
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section class="notification-detail-section">
                        <h3>{{ t('transaction.notification.taskSnapshot') }}</h3>
                        <dl class="notification-detail-grid">
                            <div>
                                <dt>{{ t('transaction.notification.notifyId') }}</dt>
                                <dd class="notification-detail-copy-value">
                                    <code>{{ detail.notification.notifyId || '-' }}</code>
                                    <el-button
                                        v-if="detail.notification.notifyId"
                                        text
                                        circle
                                        size="small"
                                        :icon="CopyDocument"
                                        :aria-label="t('transaction.notification.copyField', { field: t('transaction.notification.notifyId') })"
                                        @click="copyText(detail.notification.notifyId)"
                                    />
                                </dd>
                            </div>
                            <div>
                                <dt>{{ t('transaction.notification.transactionId') }}</dt>
                                <dd class="notification-detail-copy-value">
                                    <button
                                        v-if="canOpenTransaction && detail.notification.transactionId"
                                        type="button"
                                        @click="openTransaction(detail.notification)"
                                    >
                                        {{ detail.notification.transactionId }}
                                    </button>
                                    <code v-else>{{ detail.notification.transactionId || '-' }}</code>
                                    <el-button
                                        v-if="detail.notification.transactionId"
                                        text
                                        circle
                                        size="small"
                                        :icon="CopyDocument"
                                        :aria-label="t('transaction.notification.copyField', { field: t('transaction.notification.transactionId') })"
                                        @click="copyText(detail.notification.transactionId)"
                                    />
                                </dd>
                            </div>
                            <div>
                                <dt>{{ t('transaction.notification.merchantOrderNo') }}</dt>
                                <dd class="notification-detail-copy-value">
                                    <code>{{ detail.notification.merchantOrderNo || '-' }}</code>
                                    <el-button
                                        v-if="detail.notification.merchantOrderNo"
                                        text
                                        circle
                                        size="small"
                                        :icon="CopyDocument"
                                        :aria-label="t('transaction.notification.copyField', { field: t('transaction.notification.merchantOrderNo') })"
                                        @click="copyText(detail.notification.merchantOrderNo)"
                                    />
                                </dd>
                            </div>
                            <div>
                                <dt>{{ t('transaction.notification.signType') }}</dt>
                                <dd>{{ detail.notification.signType || '-' }}</dd>
                            </div>
                            <div>
                                <dt>{{ t('transaction.notification.createdTime') }}</dt>
                                <dd>
                                    <BaseDateTime :value="detail.notification.createTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" />
                                </dd>
                            </div>
                            <div>
                                <dt>{{ t('transaction.notification.updatedTime') }}</dt>
                                <dd>
                                    <BaseDateTime :value="detail.notification.updateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" />
                                </dd>
                            </div>
                            <div class="notification-detail-grid__wide">
                                <dt>{{ t('transaction.notification.targetUrl') }}</dt>
                                <dd class="notification-detail-copy-value">
                                    <code>{{ detail.notification.targetUrlMasked || '-' }}</code>
                                    <el-button
                                        v-if="detail.notification.targetUrlMasked"
                                        text
                                        circle
                                        size="small"
                                        :icon="CopyDocument"
                                        :aria-label="t('transaction.notification.copyField', { field: t('transaction.notification.targetUrl') })"
                                        @click="copyText(detail.notification.targetUrlMasked)"
                                    />
                                </dd>
                            </div>
                            <div class="notification-detail-grid__wide">
                                <dt>{{ t('transaction.notification.failureReason') }}</dt>
                                <dd>{{ failureText(detail.notification.failureCode) }}</dd>
                            </div>
                        </dl>
                    </section>

                    <section class="notification-detail-section">
                        <h3>{{ t('transaction.notification.payload') }}</h3>
                        <JsonPanel :title="t('transaction.notification.payload')" :value="detail.notification.payloadJsonMasked" />
                    </section>

                    <section v-loading="deliveryLogsLoading" class="notification-detail-section">
                        <div class="notification-detail-section__head">
                            <h3>{{ t('transaction.notification.deliveryAttempts') }}</h3>
                            <el-tag type="info" effect="plain">{{ deliveryLogTotal }}</el-tag>
                        </div>
                        <el-empty v-if="!deliveryLogs.length" :description="t('transaction.notification.noDeliveryAttempts')" :image-size="72" />
                        <el-collapse v-else class="notification-attempts" accordion>
                            <el-collapse-item
                                v-for="log in deliveryLogs"
                                :key="log.notifyLogId || log.attemptNo"
                                :name="log.notifyLogId || log.attemptNo"
                            >
                                <template #title>
                                    <div class="notification-attempt__title">
                                        <strong>{{ t('transaction.notification.attemptTitle', { attempt: log.attemptNo || '-' }) }}</strong>
                                        <el-tag size="small" :type="log.success ? 'success' : 'danger'">
                                            {{ log.success ? statusText('SUCCESS') : statusText('FAILED') }}
                                        </el-tag>
                                        <span>{{ deliveryModeText(log.deliveryMode) }}</span>
                                        <span>HTTP {{ log.httpStatus || '-' }}</span>
                                        <span>{{ durationText(log.durationMillis) }}</span>
                                    </div>
                                </template>
                                <dl class="notification-attempt__grid">
                                    <div>
                                        <dt>{{ t('transaction.notification.deliveryMode') }}</dt>
                                        <dd>{{ deliveryModeText(log.deliveryMode) }}</dd>
                                    </div>
                                    <div>
                                        <dt>{{ t('transaction.notification.httpMethod') }}</dt>
                                        <dd>{{ log.httpMethod || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt>{{ t('transaction.notification.httpStatus') }}</dt>
                                        <dd>{{ log.httpStatus || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt>{{ t('transaction.notification.duration') }}</dt>
                                        <dd>{{ durationText(log.durationMillis) }}</dd>
                                    </div>
                                    <div>
                                        <dt>{{ t('transaction.notification.notifyTime') }}</dt>
                                        <dd>
                                            <BaseDateTime :value="log.notifyTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{{ t('transaction.notification.responseTime') }}</dt>
                                        <dd>
                                            <BaseDateTime :value="log.responseTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" />
                                        </dd>
                                    </div>
                                    <div class="notification-attempt__grid-wide">
                                        <dt>{{ t('transaction.notification.failureReason') }}</dt>
                                        <dd>{{ failureText(log.failureCode) }}</dd>
                                    </div>
                                </dl>
                                <div class="notification-attempt__payloads">
                                    <JsonPanel :title="t('transaction.notification.requestHeaders')" :value="log.requestHeaderJsonMasked" />
                                    <JsonPanel :title="t('transaction.notification.requestBody')" :value="log.requestBodyJsonMasked" />
                                    <JsonPanel :title="t('transaction.notification.responseBody')" :value="log.responseBodyJsonMasked" />
                                </div>
                            </el-collapse-item>
                        </el-collapse>
                        <div class="pagination-container" v-show="deliveryLogTotal > 0">
                            <el-pagination
                                v-model:current-page="deliveryLogPage"
                                v-model:page-size="deliveryLogPageSize"
                                :total="deliveryLogTotal"
                                :page-sizes="[10, 20, 50, 100]"
                                layout="total, sizes, prev, pager, next, jumper"
                                background
                                @size-change="handleDeliveryLogSizeChange"
                                @current-change="loadDeliveryLogs"
                            />
                        </div>
                    </section>
                </template>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { MerchantMessageBox } from '@/utils/feedback';
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue';
import { CopyDocument, RefreshLeft, RefreshRight, Search, View } from '@element-plus/icons-vue';
import { TableRowActions, type TableRowAction } from '@acquiring/shared';
import { ElButton, ElMessage, ElTooltip } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    transactionApi,
    type MerchantNotificationDeliveryLog,
    type MerchantNotificationDetailResponse,
    type MerchantNotificationQuery,
    type MerchantNotificationRecord,
} from '@/api/transactionApi';
import { hasPermission } from '@/utils/permission';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    defaultTransactionTodayRange,
    ensureTransactionTimezoneOptions,
    resolveTransactionQueryRange,
    splitDateRange,
} from '../shared';

const { t, te } = useI18n();
const router = useRouter();
const statusOptions = ['INIT', 'PROCESSING', 'FAILED', 'SUCCESS', 'CLOSED'];
const showSearch = ref(true);
const loading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const retryingNotifyId = ref('');
const rows = ref<MerchantNotificationRecord[]>([]);
const detail = ref<MerchantNotificationDetailResponse | null>(null);
const deliveryLogs = ref<MerchantNotificationDeliveryLog[]>([]);
const deliveryLogsLoading = ref(false);
const deliveryLogPage = ref(1);
const deliveryLogPageSize = ref(10);
const deliveryLogTotal = ref(0);
const detailNotifyId = ref('');
const detailTransactionDateTime = ref('');
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const dateRange = ref<string[]>(defaultTransactionTodayRange());
const quickPreset = ref('today');
const timezoneOptions = ref(ensureTransactionTimezoneOptions([]));
const query = reactive({
    merchantOrderNo: '',
    transactionId: '',
    notifyStatus: '',
    queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});
const canDetail = computed(() => hasPermission('merchant:transaction:notification:detail'));
const canRetry = computed(() => hasPermission('merchant:transaction:notification:retry'));
const canOpenTransaction = computed(() =>
    hasPermission('merchant:transaction:order:list')
    && hasPermission('merchant:transaction:order:detail'));

const JsonPanel = defineComponent({
    name: 'MerchantNotificationJsonPanel',
    props: {
        title: { type: String, required: true },
        value: { type: String, default: '' },
    },
    setup(props) {
        return () => h('section', { class: 'merchant-notification-json' }, [
            h('div', { class: 'merchant-notification-json__head' }, [
                h('strong', props.title),
                props.value
                    ? h(ElTooltip, { content: t('common.copy'), placement: 'top' }, {
                        default: () => h(ElButton, {
                            text: true,
                            circle: true,
                            icon: CopyDocument,
                            'aria-label': t('transaction.notification.copyField', { field: props.title }),
                            onClick: () => copyText(props.value),
                        }),
                    })
                    : null,
            ]),
            h('pre', formatJson(props.value)),
        ]);
    },
});

onMounted(loadData);

async function loadData() {
    loading.value = true;
    try {
        const result = await transactionApi.searchNotifications(buildQuery(page.value, pageSize.value));
        rows.value = result.records || [];
        total.value = result.total || 0;
    } catch (error: any) {
        rows.value = [];
        total.value = 0;
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.notification.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function buildQuery(pageNo?: number, currentPageSize?: number): MerchantNotificationQuery {
    dateRange.value = resolveTransactionQueryRange(dateRange.value, quickPreset.value, query.queryTimeZone);
    return {
        pageNo,
        pageSize: currentPageSize,
        merchantOrderNo: query.merchantOrderNo || undefined,
        transactionId: query.transactionId || undefined,
        notifyStatus: query.notifyStatus || undefined,
        queryTimeZone: query.queryTimeZone,
        ...splitDateRange(dateRange.value),
    };
}

function applyQuery() {
    page.value = 1;
    void loadData();
}

function resetQuery() {
    query.merchantOrderNo = '';
    query.transactionId = '';
    query.notifyStatus = '';
    query.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    quickPreset.value = 'today';
    dateRange.value = defaultTransactionTodayRange();
    applyQuery();
}

async function openDetail(row: MerchantNotificationRecord) {
    if (!canDetail.value) return;
    detailVisible.value = true;
    detail.value = null;
    deliveryLogs.value = [];
    deliveryLogTotal.value = 0;
    deliveryLogPage.value = 1;
    detailNotifyId.value = row.notifyId;
    detailTransactionDateTime.value = row.transactionDateTime;
    detailLoading.value = true;
    try {
        const [notificationDetail] = await Promise.all([
            transactionApi.notificationDetail(row.notifyId, row.transactionDateTime),
            loadDeliveryLogs(),
        ]);
        detail.value = notificationDetail;
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.notification.detailLoadFailed'));
    } finally {
        detailLoading.value = false;
    }
}

async function loadDeliveryLogs() {
    if (!detailNotifyId.value || !detailTransactionDateTime.value) return;
    deliveryLogsLoading.value = true;
    try {
        const result = await transactionApi.notificationDeliveryLogs(
            detailNotifyId.value,
            detailTransactionDateTime.value,
            deliveryLogPage.value,
            deliveryLogPageSize.value,
        );
        deliveryLogs.value = result.records || [];
        deliveryLogTotal.value = result.total || 0;
    } catch (error: any) {
        deliveryLogs.value = [];
        deliveryLogTotal.value = 0;
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.notification.detailLoadFailed'));
    } finally {
        deliveryLogsLoading.value = false;
    }
}

function handleDeliveryLogSizeChange() {
    deliveryLogPage.value = 1;
    void loadDeliveryLogs();
}

function openTransaction(row: MerchantNotificationRecord) {
    if (!canOpenTransaction.value || !row.transactionId || !row.transactionDateTime) return;
    void router.push({
        path: '/transaction/order',
        query: {
            transactionId: row.transactionId,
            transactionDateTime: row.transactionDateTime,
            transactionTimeZone: 'Asia/Shanghai',
        },
    });
}

function rowActions(row: MerchantNotificationRecord): TableRowAction[] {
    const actions: TableRowAction[] = [];
    if (canDetail.value) {
        actions.push({
            key: 'detail',
            label: t('common.detail'),
            icon: View,
        });
    }
    if (canRetry.value) {
        const eligible = manualRetryEligible(row);
        actions.push({
            key: 'retry',
            label: t('transaction.notification.resend'),
            icon: RefreshRight,
            disabled: !eligible,
            disabledReason: eligible ? undefined : t('transaction.notification.resendUnavailable'),
            loading: retryingNotifyId.value === row.notifyId,
        });
    }
    return actions;
}

function handleRowAction(action: string, row: MerchantNotificationRecord) {
    if (action === 'detail') {
        void openDetail(row);
    } else if (action === 'retry') {
        void retryNotification(row);
    }
}

function manualRetryEligible(row: MerchantNotificationRecord) {
    return row.notifyStatus === 'SUCCESS'
        || row.notifyStatus === 'CLOSED'
        || (row.notifyStatus === 'FAILED' && !row.nextRetryTime);
}

async function retryNotification(row: MerchantNotificationRecord) {
    if (!canRetry.value || retryingNotifyId.value || !manualRetryEligible(row)) return;
    try {
        await MerchantMessageBox.confirm(
            t('transaction.notification.resendConfirm', { notifyId: row.notifyId }),
            t('transaction.notification.resendTitle'),
            {
                type: 'warning',
                confirmButtonText: t('common.confirm'),
                cancelButtonText: t('common.cancel'),
            },
        );
    } catch {
        return;
    }
    retryingNotifyId.value = row.notifyId;
    try {
        await transactionApi.retryNotification({
            notifyId: row.notifyId,
            transactionDateTime: row.transactionDateTime,
            requestId: createRequestId(),
        });
        ElMessage.success(t('transaction.notification.resendAccepted'));
        await loadData();
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.notification.resendFailed'));
    } finally {
        retryingNotifyId.value = '';
    }
}

async function copyText(value?: string) {
    if (!value) return;
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        ElMessage.success(t('common.copySuccess'));
    } catch {
        ElMessage.error(t('common.copyFailed'));
    }
}

function createRequestId() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function statusText(value?: string) {
    return value ? t(`transaction.notification.status.${value}`, value) : '-';
}

function statusTag(value?: string) {
    if (value === 'SUCCESS') return 'success';
    if (value === 'FAILED') return 'danger';
    if (value === 'INIT' || value === 'PROCESSING') return 'warning';
    return 'info';
}

function notifyTypeText(value?: string) {
    if (!value) return '-';
    const key = `transaction.notification.type.${value}`;
    return te(key) ? t(key) : t('transaction.notification.type.TRANSACTION_RESULT');
}

function eventTypeText(value?: string) {
    if (!value) return '-';
    const key = `transaction.notification.triggerSceneValue.${value}`;
    return te(key)
        ? t(key)
        : t('transaction.notification.triggerSceneValue.DEFAULT');
}

function failureText(value?: string) {
    return value ? t(`transaction.notification.failure.${value}`, value) : '-';
}

function deliveryModeText(value?: string) {
    return value ? t(`transaction.notification.deliveryModeValue.${value}`, value) : '-';
}

function durationText(value?: number) {
    return value == null ? '-' : t('transaction.notification.durationValue', { value });
}

function formatJson(value?: string) {
    if (!value) return '-';
    try {
        return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        return value;
    }
}
</script>

<style scoped>
.merchant-notification-page {
    --notification-accent: #1d75d8;
    --notification-border: #dfe7f1;
    --notification-soft-line: #edf2f7;
    gap: 10px;
}

.merchant-notification-filter {
    padding: 12px 16px;
}

.merchant-notification-table-card {
    overflow: hidden;
}

.merchant-notification-table-card :deep(.el-table td.el-table__cell) {
    color: #344054;
    font-size: 12px;
}

.notification-identity {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-width: 0;
}

.notification-identity code,
.notification-identity__link {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.notification-identity__link,
.notification-detail-hero__meta button,
.notification-detail-copy-value button:not(.el-button) {
    padding: 0;
    border: 0;
    background: transparent;
    color: #2563eb;
    cursor: pointer;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}

.notification-identity__link:hover,
.notification-detail-hero__meta button:hover,
.notification-detail-copy-value button:not(.el-button):hover {
    color: #1d4ed8;
    text-decoration: underline;
}

.notification-copy-button {
    flex: 0 0 24px;
    width: 24px;
    height: 24px;
    color: #64748b;
}

.merchant-notification-detail-drawer :deep(.el-drawer__header) {
    padding: 15px 24px 13px;
    margin-bottom: 0;
    border-bottom: 1px solid var(--notification-soft-line);
}

.merchant-notification-detail-drawer :deep(.el-drawer__body) {
    padding: 0 24px 24px;
}

.notification-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
}

.notification-drawer-header > div {
    display: grid;
    min-width: 0;
    gap: 2px;
}

.notification-drawer-header strong {
    color: #172033;
    font-size: 17px;
    font-weight: 600;
    line-height: 24px;
}

.notification-drawer-header span {
    overflow: hidden;
    color: #667085;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.merchant-notification-detail {
    min-height: 220px;
}

.notification-detail-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 24px;
    padding: 18px 0;
    border-bottom: 1px solid #e8edf3;
}

.notification-detail-hero__identity,
.notification-detail-hero__status {
    display: grid;
    min-width: 0;
    gap: 7px;
}

.notification-detail-hero__identity > span,
.notification-detail-hero__status > span,
.notification-detail-grid dt,
.notification-detail-metrics dt,
.notification-attempt__grid dt {
    color: #64748b;
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
}

.notification-detail-hero__identity > strong {
    overflow: hidden;
    color: #172033;
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.notification-detail-hero__meta {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
}

.notification-detail-hero__meta button:not(.el-button),
.notification-detail-hero__meta code {
    overflow: hidden;
    font-size: 12px;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.notification-detail-hero__status {
    justify-items: end;
}

.notification-detail-section {
    min-width: 0;
    padding: 16px 0;
    border-bottom: 1px solid #e8edf3;
}

.notification-detail-section:last-child {
    padding-bottom: 0;
    border-bottom: 0;
}

.notification-detail-section h3 {
    margin: 0 0 12px;
    color: #27364b;
    font-size: 15px;
    font-weight: 600;
    line-height: 22px;
}

.notification-detail-section__head {
    display: flex;
    align-items: center;
    gap: 8px;
}

.notification-detail-section__head h3 {
    margin: 0;
}

.notification-detail-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0;
    overflow: hidden;
    border: 1px solid #e5eaf1;
    border-radius: 6px;
    background: #f8fafc;
}

.notification-detail-metrics > div {
    min-width: 0;
    padding: 11px 14px;
    border-right: 1px solid #e5eaf1;
}

.notification-detail-metrics > div:last-child {
    border-right: 0;
}

.notification-detail-metrics dd {
    margin: 5px 0 0;
    overflow: hidden;
    color: #263244;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.notification-detail-grid,
.notification-attempt__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 0;
    border-top: 1px solid #e8edf3;
}

.notification-detail-grid > div,
.notification-attempt__grid > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-width: 0;
    padding: 11px 14px;
    border-bottom: 1px solid #e8edf3;
}

.notification-detail-grid > div:nth-child(odd):not(.notification-detail-grid__wide),
.notification-attempt__grid > div:nth-child(odd):not(.notification-attempt__grid-wide) {
    border-right: 1px solid #e8edf3;
}

.notification-detail-grid__wide,
.notification-attempt__grid-wide {
    grid-column: 1 / -1;
}

.notification-detail-grid dd,
.notification-attempt__grid dd {
    flex: 1;
    min-width: 0;
    margin: 0;
    color: #1f2937;
    font-size: 13px;
    line-height: 20px;
    overflow-wrap: anywhere;
    text-align: right;
}

.notification-detail-copy-value {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
}

.notification-detail-copy-value code,
.notification-detail-copy-value button:not(.el-button) {
    min-width: 0;
    overflow: hidden;
    font-size: 12px;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.merchant-notification-json {
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #f8fafc;
}

.merchant-notification-json__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 38px;
    padding: 0 10px 0 14px;
    border-bottom: 1px solid #e2e8f0;
    color: #344054;
    font-size: 12px;
}

.merchant-notification-json pre {
    max-height: 300px;
    margin: 0;
    overflow: auto;
    padding: 12px 14px;
    color: #1f2937;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    line-height: 1.6;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}

.notification-attempts {
    margin-top: 12px;
}

.notification-attempt__title {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    color: #475467;
}

.notification-attempt__title strong {
    color: #27364b;
    font-size: 13px;
}

.notification-attempt__payloads {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 12px;
}

.notification-attempt__payloads > :last-child {
    grid-column: 1 / -1;
}

@media (max-width: 760px) {
    .merchant-notification-page {
        gap: 12px;
    }

    .merchant-notification-table-card :deep(.el-table-fixed-column--left),
    .merchant-notification-table-card :deep(.el-table-fixed-column--right) {
        position: static !important;
        right: auto !important;
        left: auto !important;
    }

    .notification-drawer-header {
        align-items: flex-start;
    }

    .merchant-notification-detail-drawer :deep(.el-drawer__header) {
        padding: 14px 16px 12px;
    }

    .merchant-notification-detail-drawer :deep(.el-drawer__body) {
        padding: 0 16px 20px;
    }

    .notification-detail-hero,
    .notification-detail-metrics,
    .notification-detail-grid,
    .notification-attempt__grid,
    .notification-attempt__payloads {
        grid-template-columns: 1fr;
    }

    .notification-detail-hero {
        align-items: start;
        gap: 18px;
    }

    .notification-detail-hero__identity > strong {
        white-space: normal;
        overflow-wrap: anywhere;
    }

    .notification-detail-hero__status {
        justify-items: start;
    }

    .notification-detail-metrics > div {
        border-right: 0;
        border-bottom: 1px solid #e5eaf1;
    }

    .notification-detail-metrics > div:last-child {
        border-bottom: 0;
    }

    .notification-detail-grid__wide,
    .notification-attempt__grid-wide,
    .notification-attempt__payloads > :last-child {
        grid-column: auto;
    }

    .notification-detail-grid > div:nth-child(odd):not(.notification-detail-grid__wide),
    .notification-attempt__grid > div:nth-child(odd):not(.notification-attempt__grid-wide) {
        border-right: 0;
    }

    .notification-attempt__title {
        flex-wrap: wrap;
        gap: 6px 10px;
    }

    .pagination-container {
        justify-content: flex-start;
        overflow-x: auto;
    }
}
</style>

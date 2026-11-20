<template>
    <div class="app-container operational-work-item-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('operations.workItem.searchTitle')"
            :description="t('operations.workItem.searchDescription')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            :show-header="false"
            inline-time
            label-width="104px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('operations.workItem.keyword')">
                <el-input
                    v-model.trim="query.keyword"
                    :placeholder="t('operations.workItem.keywordPlaceholder')"
                    clearable
                    @keyup.enter="handleSearch"
                />
            </el-form-item>
            <el-form-item :label="t('operations.workItem.sourceType')">
                <el-select v-model="query.sourceType" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in sourceOptions" :key="item" :label="sourceText(item)" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('operations.workItem.workStatus')">
                <el-select v-model="query.workStatus" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in statusOptions" :key="item" :label="statusText(item)" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('operations.workItem.priority')">
                <el-select v-model="query.priority" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in priorityOptions" :key="item" :label="priorityText(item)" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('operations.workItem.workItemNo')">
                <el-input v-model.trim="query.workItemNo" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('operations.workItem.owner')">
                <el-select
                    v-model="query.ownerAccountId"
                    filterable
                    remote remote-show-suffix
                    clearable
                    :remote-method="searchAssignees"
                    :loading="assigneeLoading"
                    :placeholder="t('operations.workItem.ownerPlaceholder')"
                >
                    <el-option
                        v-for="item in assignees"
                        :key="item.accountId"
                        :label="assigneeLabel(item)"
                        :value="item.accountId"
                    />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('operations.workItem.detectedTime')" class="transaction-time-form-item">
                <el-date-picker
                    v-model="detectedRange"
                    class="operational-work-item-page__detected-time"
                    type="datetimerange"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    format="YYYY-MM-DD HH:mm:ss"
                    :start-placeholder="t('common.startTime')"
                    :end-placeholder="t('common.endTime')"
                    range-separator="-"
                    clearable
                />
            </el-form-item>
            <el-form-item :label="t('operations.workItem.queueScope')" class="operational-work-item-page__scope">
                <el-checkbox v-model="query.mineOnly" @change="handleQueueScopeChange('mineOnly')">
                    {{ t('operations.workItem.mineOnly') }}
                </el-checkbox>
                <el-checkbox v-model="query.unassignedOnly" @change="handleQueueScopeChange('unassignedOnly')">
                    {{ t('operations.workItem.unassignedOnly') }}
                </el-checkbox>
                <el-checkbox v-model="query.overdueOnly">{{ t('operations.workItem.overdueOnly') }}</el-checkbox>
            </el-form-item>
        </TransactionSearchPanel>

        <section class="operational-work-item-page__table-shell">
            <div class="operational-work-item-page__table-toolbar">
                <div class="operational-work-item-page__table-tools">
                    <el-button
                        v-hasPermi="'operations:work-item:export'"
                        type="warning"
                        plain
                        size="small"
                        :icon="Download"
                        :loading="exporting"
                        @click="handleExport"
                    >
                        {{ t('common.export') }}
                    </el-button>
                    <span class="operational-work-item-page__toolbar-divider" aria-hidden="true"></span>
                    <strong class="operational-work-item-page__result-count">
                        {{ t('operations.workItem.resultCount', { count: total }) }}
                    </strong>
                    <span class="operational-work-item-page__toolbar-divider" aria-hidden="true"></span>
                    <div class="operational-work-item-page__metrics" :aria-label="t('operations.workItem.metricsTitle')">
                        <button
                            v-for="item in metricItems"
                            :key="item.key"
                            type="button"
                            :aria-pressed="isMetricActive(item.key)"
                            :class="[
                                'operational-work-item-page__metric',
                                `is-${item.tone}`,
                                { 'is-active': isMetricActive(item.key) },
                            ]"
                            @click="applyMetricFilter(item.key)"
                        >
                            <i aria-hidden="true"></i>
                            <span>{{ item.label }}</span>
                            <strong>{{ item.value }}</strong>
                        </button>
                    </div>
                    <span class="operational-work-item-page__toolbar-divider" aria-hidden="true"></span>
                    <div class="operational-work-item-page__priority-legend" :aria-label="t('operations.workItem.priorityLegend')">
                        <span>{{ t('operations.workItem.priorityLegend') }}</span>
                        <span v-for="item in priorityOptions" :key="item" :class="`is-${item.toLowerCase()}`">
                            <i aria-hidden="true"></i>{{ priorityText(item) }}
                        </span>
                    </div>
                </div>
                <RightToolbar
                    class="operational-work-item-page__toolbar"
                    @toggle-search="showSearch = !showSearch"
                    @refresh="loadData"
                />
            </div>

            <StandardTable
                v-loading="loading"
                table-key="admin-operational-work-items"
                :data="rows"
                row-key="workItemNo"
                size="small"
            >
                <el-table-column :label="t('operations.workItem.workItemNo')" min-width="208" fixed="left" align="center">
                    <template #default="{ row }">
                        <CopyableText :value="row.workItemNo" :label="t('operations.workItem.workItemNo')" />
                    </template>
                </el-table-column>
                <el-table-column :label="t('operations.workItem.sourceType')" min-width="164" align="center">
                    <template #default="{ row }">
                        <el-tag
                            size="small"
                            effect="light"
                            :type="sourceTagType(row.sourceType)"
                            :class="['operational-work-item-page__source-tag', `is-${row.sourceType.toLowerCase()}`]"
                        >
                            {{ sourceText(row.sourceType) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column :label="t('operations.workItem.businessNo')" min-width="190" align="left" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span class="operational-work-item-page__business-no">{{ row.businessNo || row.sourceKey || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('operations.workItem.merchant')" min-width="176" align="left" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span>{{ merchantText(row) }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('operations.workItem.workStatus')" width="112" align="center">
                    <template #default="{ row }">
                        <el-tag size="small" effect="light" :type="statusTagType(row.workStatus)">
                            {{ statusText(row.workStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column :label="t('operations.workItem.priority')" width="104" align="center">
                    <template #default="{ row }">
                        <span :class="['operational-work-item-page__priority', `is-${row.priority.toLowerCase()}`]">
                            <i></i>{{ priorityText(row.priority) }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('operations.workItem.owner')" min-width="136" align="center">
                    <template #default="{ row }">
                        <span :class="{ 'is-unassigned': !row.ownerAccountId }">
                            {{ row.ownerAccountName || t('operations.workItem.unassigned') }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('operations.workItem.amount')" min-width="132" align="right">
                    <template #default="{ row }">
                        <CurrencyAmountDisplay
                            v-if="row.amount !== null && row.amount !== undefined"
                            class="operational-work-item-page__amount"
                            :amount="row.amount"
                            :currency="row.currency || undefined"
                            :exponent="row.currencyExponent ?? undefined"
                            :locale="String(locale)"
                            size="xs"
                            align="end"
                        />
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('operations.workItem.slaDueAt')" min-width="210" align="left">
                    <template #default="{ row }">
                        <div :class="['operational-work-item-page__sla', slaStateClass(row)]">
                            <BaseDateTime :value="row.slaDueAt" />
                            <span><i aria-hidden="true"></i>{{ slaStateText(row) }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column :label="t('operations.workItem.firstDetectedAt')" min-width="172" align="center">
                    <template #default="{ row }"><BaseDateTime :value="row.firstDetectedAt" /></template>
                </el-table-column>
                <el-table-column :label="t('common.operation')" width="210" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button
                            v-if="canDetail"
                            link
                            type="primary"
                            size="small"
                            :icon="View"
                            @click="openDetail(row)"
                        >
                            {{ t('common.detail') }}
                        </el-button>
                        <el-button
                            v-if="row.sourceManaged && canOpenSource(row)"
                            link
                            type="primary"
                            size="small"
                            :icon="Link"
                            @click="openSource(row)"
                        >
                            {{ t('operations.workItem.handleSource') }}
                        </el-button>
                        <el-dropdown v-if="hasRowActions(row)" trigger="click" @command="handleRowAction($event, row)">
                            <el-button link type="primary" size="small">
                                {{ t('common.more') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item v-if="!row.sourceManaged && canClaim && row.workStatus !== 'CLOSED' && !row.ownerAccountId" command="claim" :icon="User">
                                        {{ t('operations.workItem.claim') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item v-if="!row.sourceManaged && canAssign && row.workStatus !== 'CLOSED' && !row.ownerAccountId" command="assign" :icon="UserFilled">
                                        {{ t('operations.workItem.assign') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item v-if="!row.sourceManaged && canTransfer && row.workStatus !== 'CLOSED' && row.ownerAccountId" command="transfer" :icon="Promotion">
                                        {{ t('operations.workItem.transfer') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item v-if="!row.sourceManaged && !isPaymentMethodSource(row) && canComplete && row.workStatus !== 'CLOSED'" command="complete" :icon="CircleCheck">
                                        {{ t('operations.workItem.complete') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item v-if="canRemark" command="remark" :icon="EditPen">
                                        {{ t('operations.workItem.addRemark') }}
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </template>
                </el-table-column>
            </StandardTable>

            <div v-show="total > 0" class="pagination-container operational-work-item-page__pagination">
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

        <CommonDetailDrawer
            v-model:visible="detailVisible"
            :title="t('operations.workItem.detailTitle')"
            size="xl"
            :loading="detailLoading"
        >
            <template v-if="detail?.workItem">
                <div class="operational-work-item-page__detail-head">
                    <div>
                        <span>{{ t('operations.workItem.workItemNo') }}</span>
                        <CopyableText :value="detail.workItem.workItemNo" :label="t('operations.workItem.workItemNo')" />
                    </div>
                    <div class="operational-work-item-page__detail-tags">
                        <el-tag :type="statusTagType(detail.workItem.workStatus)">{{ statusText(detail.workItem.workStatus) }}</el-tag>
                        <el-tag effect="plain" :type="priorityTagType(detail.workItem.priority)">{{ priorityText(detail.workItem.priority) }}</el-tag>
                        <el-tag v-if="detail.workItem.overdue" type="danger" effect="dark">{{ t('operations.workItem.overdue') }}</el-tag>
                    </div>
                </div>

                <section class="operational-work-item-page__detail-section">
                    <h3>{{ t('operations.workItem.operationalInfo') }}</h3>
                    <el-descriptions class="operational-work-item-page__descriptions" :column="2" border size="small">
                        <el-descriptions-item :label="t('operations.workItem.sourceType')">{{ sourceText(detail.workItem.sourceType) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('operations.workItem.owner')">{{ detail.workItem.ownerAccountName || t('operations.workItem.unassigned') }}</el-descriptions-item>
                        <el-descriptions-item :label="t('operations.workItem.firstDetectedAt')"><BaseDateTime :value="detail.workItem.firstDetectedAt" /></el-descriptions-item>
                        <el-descriptions-item :label="t('operations.workItem.slaDueAt')"><BaseDateTime :value="detail.workItem.slaDueAt" /></el-descriptions-item>
                        <el-descriptions-item :label="t('operations.workItem.lastSyncedAt')"><BaseDateTime :value="detail.workItem.lastSyncedAt" /></el-descriptions-item>
                        <el-descriptions-item :label="t('operations.workItem.version')">{{ detail.workItem.version }}</el-descriptions-item>
                        <el-descriptions-item :label="t('operations.workItem.latestRemark')" :span="2">{{ detail.workItem.latestRemark || '-' }}</el-descriptions-item>
                    </el-descriptions>
                </section>

                <section class="operational-work-item-page__detail-section">
                    <div class="operational-work-item-page__section-head">
                        <h3>{{ t('operations.workItem.sourceInfo') }}</h3>
                        <el-button
                            v-if="detail.workItem.sourceAvailable && canOpenSource(detail.workItem)"
                            type="primary"
                            link
                            :icon="Link"
                            @click="openSource(detail.workItem)"
                        >
                            {{ detail.workItem.sourceManaged
                                ? t('operations.workItem.handleSource')
                                : t('operations.workItem.openSource') }}
                        </el-button>
                    </div>
                    <el-descriptions class="operational-work-item-page__descriptions" :column="2" border size="small">
                        <el-descriptions-item :label="t('operations.workItem.sourceStatus')">{{ detail.workItem.sourceStatus || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('operations.workItem.businessNo')"><CopyableText :value="detail.workItem.businessNo || detail.workItem.sourceKey" /></el-descriptions-item>
                        <el-descriptions-item :label="t(isPaymentMethodSource(detail.workItem) ? 'paymentMethod.itemKey' : 'operations.workItem.relatedBusinessNo')"><CopyableText :value="detail.workItem.relatedBusinessNo" /></el-descriptions-item>
                        <el-descriptions-item :label="t('operations.workItem.transactionId')"><CopyableText :value="detail.workItem.transactionId" /></el-descriptions-item>
                        <el-descriptions-item :label="t('operations.workItem.merchant')">{{ merchantText(detail.workItem) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('operations.workItem.amount')">
                            <CurrencyAmountDisplay
                                v-if="detail.workItem.amount !== null && detail.workItem.amount !== undefined"
                                :amount="detail.workItem.amount"
                                :currency="detail.workItem.currency || undefined"
                                :exponent="detail.workItem.currencyExponent ?? undefined"
                                :locale="String(locale)"
                                size="xs"
                            />
                            <span v-else>-</span>
                        </el-descriptions-item>
                        <el-descriptions-item v-if="detail.workItem.rateType" :label="t('operations.workItem.currencyPair')"><CurrencyPairDisplay :base-currency="detail.workItem.baseCurrency" :quote-currency="detail.workItem.quoteCurrency" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item v-if="detail.workItem.rateType" :label="t('operations.workItem.rateType')">{{ detail.workItem.rateType }}</el-descriptions-item>
                        <el-descriptions-item v-if="detail.workItem.attemptCount !== null && detail.workItem.attemptCount !== undefined" :label="attemptCountLabel(detail.workItem)">{{ detail.workItem.attemptCount }}</el-descriptions-item>
                        <el-descriptions-item v-if="detail.workItem.alertLevel" :label="alertLevelLabel(detail.workItem)">{{ detail.workItem.alertLevel }}</el-descriptions-item>
                        <el-descriptions-item v-if="detail.workItem.failureStage" :label="t('operations.workItem.failureStage')">{{ detail.workItem.failureStage }}</el-descriptions-item>
                        <el-descriptions-item v-if="detail.workItem.failureCode" :label="t('operations.workItem.failureCode')"><CopyableText :value="detail.workItem.failureCode" /></el-descriptions-item>
                        <el-descriptions-item v-if="detail.workItem.failureReason" :label="t('operations.workItem.failureReason')" :span="2">{{ detail.workItem.failureReason }}</el-descriptions-item>
                    </el-descriptions>
                </section>

                <section v-loading="historyLoading" class="operational-work-item-page__detail-section operational-work-item-page__history-section">
                    <h3>{{ t('operations.workItem.historyTitle') }}</h3>
                    <div v-if="historyError" class="operational-work-item-page__history-error">
                        <el-alert :title="historyError" type="error" :closable="false" show-icon />
                        <el-button :icon="Refresh" @click="loadHistory(true)">{{ t('operations.workItem.historyRetry') }}</el-button>
                    </div>
                    <el-empty v-else-if="!historyRecords.length && !historyLoading" :description="t('common.noData')" :image-size="72" />
                    <el-timeline v-else class="operational-work-item-page__timeline">
                        <el-timeline-item
                            v-for="item in historyRecords"
                            :key="item.id"
                            :timestamp="formatDateTime(item.operatedAt)"
                            placement="top"
                            :type="historyTimelineType(item.actionType)"
                        >
                            <div class="operational-work-item-page__history-head">
                                <strong>{{ historyActionText(item.actionType) }}</strong>
                                <span>{{ item.operatorAccountName || 'SYSTEM' }}</span>
                            </div>
                            <p v-if="ownerChangeText(item)">{{ ownerChangeText(item) }}</p>
                            <p v-if="item.remark">{{ item.remark }}</p>
                        </el-timeline-item>
                    </el-timeline>
                    <el-pagination
                        v-if="!historyError && historyTotal > 0"
                        v-model:current-page="historyPage"
                        v-model:page-size="historyPageSize"
                        class="operational-work-item-page__history-pagination"
                        :total="historyTotal"
                        :page-sizes="[10, 20, 50, 100]"
                        layout="total, sizes, prev, pager, next"
                        background
                        @current-change="loadHistory"
                        @size-change="handleHistoryPageSizeChange"
                    />
                </section>
            </template>
            <template #footer>
                <div class="dialog-footer operational-work-item-page__drawer-footer">
                    <el-button
                        v-if="detail?.workItem && !detail.workItem.sourceManaged && canClaim && detail.workItem.workStatus !== 'CLOSED' && !detail.workItem.ownerAccountId"
                        type="primary"
                        :icon="User"
                        :loading="actionLoading"
                        @click="claimItem(detail.workItem)"
                    >
                        {{ t('operations.workItem.claim') }}
                    </el-button>
                    <el-button
                        v-if="detail?.workItem && canRemark"
                        :icon="EditPen"
                        @click="openActionDialog('remark', detail.workItem)"
                    >
                        {{ t('operations.workItem.addRemark') }}
                    </el-button>
                    <el-button
                        v-if="detail?.workItem && !detail.workItem.sourceManaged && !isPaymentMethodSource(detail.workItem) && canComplete && detail.workItem.workStatus !== 'CLOSED'"
                        type="success"
                        :icon="CircleCheck"
                        @click="openActionDialog('complete', detail.workItem)"
                    >
                        {{ t('operations.workItem.complete') }}
                    </el-button>
                    <el-button @click="detailVisible = false">{{ t('common.close') }}</el-button>
                </div>
            </template>
        </CommonDetailDrawer>

        <el-dialog v-model="actionVisible" :title="actionDialogTitle" width="540px" destroy-on-close>
            <el-form label-position="top">
                <el-form-item v-if="actionType === 'assign' || actionType === 'transfer'" :label="t('operations.workItem.targetOwner')" required>
                    <el-select
                        v-model="actionTargetAccountId"
                        filterable
                        remote remote-show-suffix
                        :remote-method="searchAssignees"
                        :loading="assigneeLoading"
                        :placeholder="t('operations.workItem.ownerPlaceholder')"
                        class="operational-work-item-page__dialog-select"
                    >
                        <el-option
                            v-for="item in assignees"
                            :key="item.accountId"
                            :label="assigneeLabel(item)"
                            :value="item.accountId"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item
                    :label="actionType === 'complete' ? t('operations.workItem.completionRemark') : t('operations.workItem.remark')"
                    :required="actionType === 'remark' || actionType === 'complete'"
                >
                    <el-input
                        v-model.trim="actionRemark"
                        type="textarea"
                        :rows="4"
                        maxlength="1000"
                        show-word-limit
                        :placeholder="actionType === 'complete'
                            ? t('operations.workItem.completionRemarkPlaceholder')
                            : t('operations.workItem.remarkPlaceholder')"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionLoading" @click="submitAction">{{ t('common.confirm') }}</el-button>
                    <el-button @click="actionVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ArrowDown, CircleCheck, Download, EditPen, Link, Promotion, Refresh, User, UserFilled, View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { CurrencyAmountDisplay } from '@acquiring/shared';
import {
    assignOperationalWorkItem,
    claimOperationalWorkItem,
    completeOperationalWorkItem,
    submitOperationalWorkItemExportTask,
    getOperationalWorkItemDetail,
    listOperationalWorkItemAssignees,
    remarkOperationalWorkItem,
    searchOperationalWorkItemHistory,
    searchOperationalWorkItems,
    transferOperationalWorkItem,
    type OperationalWorkItem,
    type OperationalWorkItemAssignee,
    type OperationalWorkItemDetail,
    type OperationalWorkItemHistory,
    type OperationalWorkItemMetrics,
    type OperationalWorkItemQuery,
    type WorkItemPriority,
    type WorkItemSourceType,
    type WorkItemStatus,
} from '@/api/operations/workItem';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import { formatDateTime } from '@/utils/format';
import CopyableText from '@/views/transaction/components/CopyableText.vue';
import TransactionSearchPanel from '@/views/transaction/components/TransactionSearchPanel.vue';
import { defaultTodayFullDayRange } from '@/views/transaction/shared';
import CurrencyPairDisplay from '@/views/exchange/CurrencyPairDisplay.vue';

type ActionType = 'assign' | 'transfer' | 'complete' | 'remark';
type MetricKey = keyof OperationalWorkItemMetrics;

const { locale, t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const sourceOptions: WorkItemSourceType[] = [
    'PAYMENT_METHOD_APPROVAL',
    'PAYMENT_METHOD_CONFIGURATION',
    'REFUND_APPROVAL',
    'SETTLEMENT_REVIEW',
    'EXCHANGE_RATE_ALERT',
    'MERCHANT_NOTIFICATION_FAILURE',
    'CHANNEL_MATCH_ABNORMAL',
    'CLEARING_BACKLOG',
    'SETTLEMENT_BACKLOG',
    'HIGH_RISK_EVENT',
];
const statusOptions: WorkItemStatus[] = ['OPEN', 'PROCESSING', 'CLOSED'];
const priorityOptions: WorkItemPriority[] = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'];
const emptyMetrics = (): OperationalWorkItemMetrics => ({ openCount: 0, processingCount: 0, overdueCount: 0, unassignedCount: 0, mineCount: 0 });

const showSearch = ref(true);
const loading = ref(false);
const exporting = ref(false);
const detailLoading = ref(false);
const historyLoading = ref(false);
const historyError = ref('');
const historyRecords = ref<OperationalWorkItemHistory[]>([]);
const historyTotal = ref(0);
const historyPage = ref(1);
const historyPageSize = ref(10);
let historyRequestSequence = 0;
const actionLoading = ref(false);
const assigneeLoading = ref(false);
const rows = ref<OperationalWorkItem[]>([]);
const metrics = ref<OperationalWorkItemMetrics>(emptyMetrics());
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const detectedRange = ref<string[]>(defaultTodayFullDayRange());
const assignees = ref<OperationalWorkItemAssignee[]>([]);
const detailVisible = ref(false);
const detail = ref<OperationalWorkItemDetail | null>(null);
const actionVisible = ref(false);
const actionType = ref<ActionType>('remark');
const actionItem = ref<OperationalWorkItem | null>(null);
const actionTargetAccountId = ref<number>();
const actionRemark = ref('');
const query = reactive<OperationalWorkItemQuery>({
    workItemNo: '', keyword: '', sourceType: '', workStatus: '', priority: '',
    ownerAccountId: undefined, mineOnly: false, unassignedOnly: false, overdueOnly: false,
});

const canDetail = userStore.hasPermission('operations:work-item:detail');
const canClaim = userStore.hasPermission('operations:work-item:claim');
const canAssign = userStore.hasPermission('operations:work-item:assign');
const canTransfer = userStore.hasPermission('operations:work-item:transfer');
const canComplete = userStore.hasPermission('operations:work-item:complete');
const canRemark = userStore.hasPermission('operations:work-item:remark');

const metricItems = computed(() => [
    { key: 'openCount' as MetricKey, label: t('operations.workItem.metrics.open'), value: metrics.value.openCount, tone: 'warning' },
    { key: 'processingCount' as MetricKey, label: t('operations.workItem.metrics.processing'), value: metrics.value.processingCount, tone: 'primary' },
    { key: 'overdueCount' as MetricKey, label: t('operations.workItem.metrics.overdue'), value: metrics.value.overdueCount, tone: 'danger' },
    { key: 'unassignedCount' as MetricKey, label: t('operations.workItem.metrics.unassigned'), value: metrics.value.unassignedCount, tone: 'warning' },
    { key: 'mineCount' as MetricKey, label: t('operations.workItem.metrics.mine'), value: metrics.value.mineCount, tone: 'success' },
]);

const actionDialogTitle = computed(() => t(`operations.workItem.actionTitle.${actionType.value}`));

onMounted(async () => {
    await Promise.all([loadData(), searchAssignees('')]);
});

function buildQuery(includePage = true): OperationalWorkItemQuery {
    return {
        ...query,
        workItemNo: query.workItemNo || undefined,
        keyword: query.keyword || undefined,
        sourceType: query.sourceType || undefined,
        workStatus: query.workStatus || undefined,
        priority: query.priority || undefined,
        detectedStartTime: detectedRange.value?.[0] || undefined,
        detectedEndTime: detectedRange.value?.[1] || undefined,
        pageNo: includePage ? page.value : 1,
        pageSize: includePage ? pageSize.value : 100,
    };
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchOperationalWorkItems(buildQuery());
        rows.value = result.page.records;
        total.value = result.page.total;
        metrics.value = result.metrics || emptyMetrics();
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    void loadData();
}

function handleReset() {
    Object.assign(query, {
        workItemNo: '', keyword: '', sourceType: '', workStatus: '', priority: '',
        ownerAccountId: undefined, mineOnly: false, unassignedOnly: false, overdueOnly: false,
    });
    detectedRange.value = defaultTodayFullDayRange();
    handleSearch();
}

function handleQueueScopeChange(key: 'mineOnly' | 'unassignedOnly') {
    if (key === 'mineOnly' && query.mineOnly) query.unassignedOnly = false;
    if (key === 'unassignedOnly' && query.unassignedOnly) query.mineOnly = false;
}

function isMetricActive(key: MetricKey) {
    if (key === 'openCount') return query.workStatus === 'OPEN';
    if (key === 'processingCount') return query.workStatus === 'PROCESSING';
    if (key === 'overdueCount') return query.overdueOnly;
    if (key === 'unassignedCount') return query.unassignedOnly;
    return query.mineOnly;
}

function applyMetricFilter(key: MetricKey) {
    if (key === 'openCount') query.workStatus = query.workStatus === 'OPEN' ? '' : 'OPEN';
    if (key === 'processingCount') query.workStatus = query.workStatus === 'PROCESSING' ? '' : 'PROCESSING';
    if (key === 'overdueCount') query.overdueOnly = !query.overdueOnly;
    if (key === 'unassignedCount') {
        query.unassignedOnly = !query.unassignedOnly;
        if (query.unassignedOnly) query.mineOnly = false;
    }
    if (key === 'mineCount') {
        query.mineOnly = !query.mineOnly;
        if (query.mineOnly) query.unassignedOnly = false;
    }
    handleSearch();
}

async function handleExport() {
    exporting.value = true;
    try {
        const task = await submitOperationalWorkItemExportTask({
            requestId: createExportRequestId(),
            query: buildQuery(false),
        });
        await ElMessageBox.confirm(
            t('operations.workItem.exportSubmitted', { taskNo: task.taskNo }),
            t('operations.workItem.exportSubmittedTitle'),
            {
                confirmButtonText: t('operations.workItem.openDownloadCenter'),
                cancelButtonText: t('common.close'),
                type: 'success',
            },
        ).then(() => router.push('/operations/export-tasks')).catch(() => undefined);
    } finally {
        exporting.value = false;
    }
}

function createExportRequestId() {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return `work-item-export-${globalThis.crypto.randomUUID()}`;
    }
    return `work-item-export-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function searchAssignees(keyword: string) {
    assigneeLoading.value = true;
    try {
        assignees.value = await listOperationalWorkItemAssignees(keyword);
    } finally {
        assigneeLoading.value = false;
    }
}

async function openDetail(item: OperationalWorkItem) {
    const workItemNo = item.workItemNo;
    resetHistory();
    detailVisible.value = true;
    detailLoading.value = true;
    try {
        detail.value = await getOperationalWorkItemDetail(workItemNo);
        await loadHistory();
    } finally {
        detailLoading.value = false;
    }
}

function resetHistory() {
    historyRequestSequence += 1;
    historyLoading.value = false;
    historyError.value = '';
    historyRecords.value = [];
    historyTotal.value = 0;
    historyPage.value = 1;
}

async function loadHistory(force = false) {
    const workItemNo = detail.value?.workItem.workItemNo;
    if (!workItemNo || (historyLoading.value && !force)) return;
    const requestSequence = ++historyRequestSequence;
    historyLoading.value = true;
    historyError.value = '';
    try {
        const result = await searchOperationalWorkItemHistory(
            workItemNo,
            historyPage.value,
            historyPageSize.value,
        );
        if (requestSequence !== historyRequestSequence
            || workItemNo !== detail.value?.workItem.workItemNo) return;
        historyRecords.value = result.records || [];
        historyTotal.value = result.total || 0;
    } catch (error: unknown) {
        if (requestSequence !== historyRequestSequence) return;
        const record = error as { friendlyMessage?: string; message?: string } | null;
        historyRecords.value = [];
        historyTotal.value = 0;
        historyError.value = record?.friendlyMessage
            || record?.message
            || t('operations.workItem.historyLoadFailed');
    } finally {
        if (requestSequence === historyRequestSequence) historyLoading.value = false;
    }
}

function handleHistoryPageSizeChange() {
    historyPage.value = 1;
    void loadHistory();
}

function handleRowAction(command: string, item: OperationalWorkItem) {
    if (command === 'claim') {
        void claimItem(item);
        return;
    }
    openActionDialog(command as ActionType, item);
}

async function claimItem(item: OperationalWorkItem) {
    await ElMessageBox.confirm(
        t('operations.workItem.claimConfirm', { workItemNo: item.workItemNo }),
        t('operations.workItem.claim'),
        { type: 'warning' },
    );
    actionLoading.value = true;
    try {
        const result = await claimOperationalWorkItem(item.workItemNo, commandPayload(item));
        detail.value = result;
        await loadHistory(true);
        ElMessage.success(t('operations.workItem.actionSuccess'));
        await loadData();
    } finally {
        actionLoading.value = false;
    }
}

function isPaymentMethodSource(item: OperationalWorkItem) {
    return item.sourceType === 'PAYMENT_METHOD_APPROVAL' || item.sourceType === 'PAYMENT_METHOD_CONFIGURATION';
}

function openActionDialog(type: ActionType, item: OperationalWorkItem) {
    if (type === 'complete' && isPaymentMethodSource(item)) return;
    actionType.value = type;
    actionItem.value = item;
    actionTargetAccountId.value = undefined;
    actionRemark.value = '';
    actionVisible.value = true;
    void searchAssignees('');
}

async function submitAction() {
    const item = actionItem.value;
    if (!item || (actionType.value === 'complete' && isPaymentMethodSource(item))) return;
    const requiresTargetOwner = actionType.value === 'assign' || actionType.value === 'transfer';
    const requiresRemark = actionType.value === 'remark' || actionType.value === 'complete';
    if (requiresTargetOwner && !actionTargetAccountId.value) {
        ElMessage.warning(t('operations.workItem.ownerRequired'));
        return;
    }
    if (requiresRemark && !actionRemark.value) {
        ElMessage.warning(t(actionType.value === 'complete'
            ? 'operations.workItem.completionRemarkRequired'
            : 'operations.workItem.remarkRequired'));
        return;
    }
    actionLoading.value = true;
    try {
        const payload = commandPayload(item, actionTargetAccountId.value, actionRemark.value);
        let result: OperationalWorkItemDetail;
        if (actionType.value === 'assign') {
            result = await assignOperationalWorkItem(item.workItemNo, payload);
        } else if (actionType.value === 'transfer') {
            result = await transferOperationalWorkItem(item.workItemNo, payload);
        } else if (actionType.value === 'complete') {
            result = await completeOperationalWorkItem(item.workItemNo, payload);
        } else {
            result = await remarkOperationalWorkItem(item.workItemNo, payload);
        }
        actionVisible.value = false;
        detail.value = result;
        if (detailVisible.value && detail.value.workItem.workItemNo !== item.workItemNo) {
            detailVisible.value = false;
        } else if (detailVisible.value) {
            await loadHistory(true);
        }
        ElMessage.success(t('operations.workItem.actionSuccess'));
        await loadData();
    } finally {
        actionLoading.value = false;
    }
}

function commandPayload(item: OperationalWorkItem, targetAccountId?: number, remark?: string) {
    return {
        requestId: globalThis.crypto.randomUUID(),
        expectedVersion: item.version,
        targetAccountId,
        remark: remark || undefined,
    };
}

function hasRowActions(item: OperationalWorkItem) {
    return canRemark
        || !item.sourceManaged && !isPaymentMethodSource(item) && canComplete && item.workStatus !== 'CLOSED'
        || !item.sourceManaged && canClaim && item.workStatus !== 'CLOSED' && !item.ownerAccountId
        || !item.sourceManaged && canAssign && item.workStatus !== 'CLOSED' && !item.ownerAccountId
        || !item.sourceManaged && canTransfer && item.workStatus !== 'CLOSED' && Boolean(item.ownerAccountId);
}

function openSource(item: OperationalWorkItem) {
    const routes: Record<WorkItemSourceType, { path: string; query: Record<string, string> }> = {
        PAYMENT_METHOD_APPROVAL: { path: '/merchant/payment-methods', query: { merchantId: item.merchantId || '', applicationNo: item.businessNo || '' } },
        PAYMENT_METHOD_CONFIGURATION: { path: '/merchant/payment-methods', query: { merchantId: item.merchantId || '' } },
        REFUND_APPROVAL: { path: '/transaction/refund', query: { refundTransactionId: item.businessNo || '', sourceOccurredAt: item.sourceOccurredAt || '' } },
        SETTLEMENT_REVIEW: { path: '/settlement/review-orders', query: { reviewOrderNo: item.businessNo || item.sourceKey } },
        EXCHANGE_RATE_ALERT: { path: '/exchange/alert-event', query: { eventNo: item.businessNo || item.sourceKey, sourceOccurredAt: item.sourceOccurredAt || '' } },
        MERCHANT_NOTIFICATION_FAILURE: { path: '/transaction/merchant-notification', query: { transactionId: item.transactionId || '', sourceOccurredAt: item.sourceOccurredAt || '' } },
        CHANNEL_MATCH_ABNORMAL: { path: '/transaction/channel-match-abnormal', query: { eventId: item.sourceKey, transactionDateTime: item.transactionDateTime || '' } },
        CLEARING_BACKLOG: {
            path: '/transaction/clearing',
            query: {
                transactionId: item.transactionId || '',
                transactionDateTime: item.transactionDateTime || '',
                clearingStatus: item.sourceStatus || '',
            },
        },
        SETTLEMENT_BACKLOG: {
            path: '/settlement/batches',
            query: { settlementBatchNo: item.businessNo || item.sourceKey },
        },
        HIGH_RISK_EVENT: {
            path: '/risk/record/evaluation',
            query: { riskRecordNo: item.businessNo || item.sourceKey },
        },
    };
    if (!canOpenSource(item)) return;
    const channelRouteIncomplete = item.sourceType === 'CHANNEL_MATCH_ABNORMAL' && !item.transactionDateTime;
    const clearingRouteIncomplete = item.sourceType === 'CLEARING_BACKLOG'
        && (!item.transactionId || !item.transactionDateTime);
    if (channelRouteIncomplete || clearingRouteIncomplete) {
        ElMessage.warning(t('operations.workItem.sourceOpenUnavailable'));
        return;
    }
    const target = routes[item.sourceType];
    void router.push({ path: target.path, query: Object.fromEntries(Object.entries(target.query).filter(([, value]) => value)) });
}

function canOpenSource(item: OperationalWorkItem) {
    const permissions: Record<WorkItemSourceType, string> = {
        PAYMENT_METHOD_APPROVAL: 'merchant:payment-method:view',
        PAYMENT_METHOD_CONFIGURATION: 'merchant:payment-method:view',
        REFUND_APPROVAL: 'transaction:refund:detail',
        SETTLEMENT_REVIEW: 'settlement:review-order:detail',
        EXCHANGE_RATE_ALERT: 'exchange:alert-event:query',
        MERCHANT_NOTIFICATION_FAILURE: 'transaction:merchant-notification:detail',
        CHANNEL_MATCH_ABNORMAL: 'transaction:match-abnormal:detail',
        CLEARING_BACKLOG: 'clearing:record:detail',
        SETTLEMENT_BACKLOG: 'settlement:batch:detail',
        HIGH_RISK_EVENT: 'risk:record:evaluation:list',
    };
    return item.sourceAvailable && userStore.hasPermission(permissions[item.sourceType]);
}

function sourceText(value: WorkItemSourceType) { return t(`operations.workItem.source.${value}`); }
function statusText(value: WorkItemStatus | string) { return t(`operations.workItem.status.${value}`, value); }
function priorityText(value: WorkItemPriority) { return t(`operations.workItem.priorityValue.${value}`); }
function historyActionText(value: string) { return t(`operations.workItem.historyAction.${value}`, value); }
function assigneeLabel(item: OperationalWorkItemAssignee) { return `${item.accountName} (${item.loginAccount})`; }
function merchantText(item: OperationalWorkItem) { return [item.merchantName, item.merchantId].filter(Boolean).join(' / ') || '-'; }
function attemptCountLabel(item: OperationalWorkItem) {
    if (item.sourceType === 'HIGH_RISK_EVENT') return t('operations.workItem.riskHitCount');
    return ['CLEARING_BACKLOG', 'SETTLEMENT_BACKLOG'].includes(item.sourceType)
        ? t('operations.workItem.retryCount')
        : t('operations.workItem.attemptCount');
}
function alertLevelLabel(item: OperationalWorkItem) {
    return item.sourceType === 'HIGH_RISK_EVENT'
        ? t('operations.workItem.riskLevel')
        : t('operations.workItem.alertLevel');
}

/**
 * SLA 状态使用完整到期时间作为主信息，并以分钟粒度补充运营人员可快速识别的相对时长。
 */
function slaStateText(item: OperationalWorkItem) {
    if (item.workStatus === 'CLOSED') {
        return t('operations.workItem.slaStopped');
    }
    const dueAt = new Date(item.slaDueAt).getTime();
    if (!Number.isFinite(dueAt)) {
        return item.overdue ? t('operations.workItem.overdue') : '-';
    }
    const now = Date.now();
    const duration = formatSlaDuration(Math.abs(dueAt - now));
    return item.overdue || dueAt <= now
        ? t('operations.workItem.overdueDuration', { duration })
        : t('operations.workItem.remainingDuration', { duration });
}

function slaStateClass(item: OperationalWorkItem) {
    if (item.workStatus === 'CLOSED') return 'is-completed';
    return item.overdue ? 'is-overdue' : 'is-pending';
}

function formatSlaDuration(durationMs: number) {
    const totalMinutes = Math.max(1, Math.floor(durationMs / 60_000));
    const days = Math.floor(totalMinutes / 1_440);
    const hours = Math.floor((totalMinutes % 1_440) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) {
        return t('operations.workItem.durationDaysHours', { days, hours });
    }
    if (hours > 0) {
        return t('operations.workItem.durationHoursMinutes', { hours, minutes });
    }
    return t('operations.workItem.durationMinutes', { minutes });
}

function statusTagType(value: WorkItemStatus) {
    if (value === 'OPEN') return 'warning';
    if (value === 'PROCESSING') return 'primary';
    return 'success';
}

function sourceTagType(value: WorkItemSourceType) {
    if (value === 'PAYMENT_METHOD_APPROVAL') return 'primary';
    if (value === 'PAYMENT_METHOD_CONFIGURATION') return 'warning';
    if (value === 'REFUND_APPROVAL') return 'danger';
    if (value === 'SETTLEMENT_REVIEW') return 'success';
    if (value === 'EXCHANGE_RATE_ALERT') return 'warning';
    if (value === 'CHANNEL_MATCH_ABNORMAL') return 'danger';
    if (value === 'CLEARING_BACKLOG') return 'warning';
    if (value === 'SETTLEMENT_BACKLOG') return 'danger';
    if (value === 'HIGH_RISK_EVENT') return 'danger';
    return 'info';
}

function priorityTagType(value: WorkItemPriority) {
    if (value === 'CRITICAL') return 'danger';
    if (value === 'HIGH') return 'warning';
    if (value === 'LOW') return 'info';
    return 'primary';
}

function historyTimelineType(value: string) {
    if (value === 'AUTO_CLOSE' || value === 'COMPLETE') return 'success';
    if (value === 'REOPEN' || value === 'SOURCE_SYNC') return 'warning';
    if (value === 'CREATE') return 'primary';
    return 'info';
}

function ownerChangeText(item: OperationalWorkItemHistory) {
    if (item.beforeOwnerAccountName === item.afterOwnerAccountName) return '';
    return t('operations.workItem.ownerChanged', {
        before: item.beforeOwnerAccountName || t('operations.workItem.unassigned'),
        after: item.afterOwnerAccountName || t('operations.workItem.unassigned'),
    });
}
</script>

<style scoped>
.operational-work-item-page__table-shell {
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    background: var(--el-bg-color);
}

.operational-work-item-page__table-toolbar,
.operational-work-item-page__table-tools,
.operational-work-item-page__metrics,
.operational-work-item-page__priority-legend {
    display: flex;
    align-items: center;
}

.operational-work-item-page__table-toolbar {
    min-height: 54px;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 8px 14px;
}

.operational-work-item-page__table-tools {
    min-width: 0;
    flex: 1 1 auto;
    flex-wrap: wrap;
    gap: 10px;
}

.operational-work-item-page__toolbar-divider {
    width: 1px;
    height: 20px;
    background: var(--el-border-color);
}

.operational-work-item-page__result-count {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.operational-work-item-page__metrics {
    flex-wrap: wrap;
    gap: 2px 12px;
}

.operational-work-item-page__metric {
    --work-item-metric-color: var(--el-text-color-primary);

    display: flex;
    align-items: center;
    gap: 5px;
    border: 0;
    border-radius: 3px;
    padding: 4px 5px;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    line-height: 20px;
}

.operational-work-item-page__metric:hover { background: var(--el-fill-color-light); }
.operational-work-item-page__metric:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 1px; }
.operational-work-item-page__metric.is-active {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
}
.operational-work-item-page__metric i,
.operational-work-item-page__priority-legend i {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--work-item-metric-color);
}
.operational-work-item-page__metric span { font-size: 12px; white-space: nowrap; }
.operational-work-item-page__metric strong {
    color: var(--work-item-metric-color);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
}
.operational-work-item-page__metric.is-danger {
    --work-item-metric-color: var(--el-color-danger);
}
.operational-work-item-page__metric.is-warning {
    --work-item-metric-color: var(--el-color-warning-dark-2);
}
.operational-work-item-page__metric.is-primary {
    --work-item-metric-color: var(--el-color-primary);
}
.operational-work-item-page__metric.is-success {
    --work-item-metric-color: var(--el-color-success-dark-2);
}

.operational-work-item-page__priority-legend {
    flex-wrap: wrap;
    gap: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.operational-work-item-page__priority-legend > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
}

.operational-work-item-page__priority-legend > span:first-child {
    margin-right: 2px;
}
.operational-work-item-page__priority-legend .is-critical { --work-item-metric-color: var(--el-color-danger); }
.operational-work-item-page__priority-legend .is-high { --work-item-metric-color: var(--el-color-warning); }
.operational-work-item-page__priority-legend .is-normal { --work-item-metric-color: var(--el-color-primary); }
.operational-work-item-page__priority-legend .is-low { --work-item-metric-color: var(--el-color-success); }
.operational-work-item-page__priority-legend i { background: var(--work-item-metric-color); }

.operational-work-item-page__toolbar {
    flex: 0 0 auto;
}

.operational-work-item-page__table-shell :deep(.standard-table-wrapper .el-table) {
    --el-table-border-color: var(--el-border-color-lighter);
    border-width: 0;
}

.operational-work-item-page__table-shell :deep(.standard-table-wrapper .el-table__header th.el-table__cell) {
    height: 46px;
    background: var(--el-fill-color-extra-light);
    color: var(--el-text-color-primary);
    font-weight: 600;
}

.operational-work-item-page__table-shell :deep(.standard-table-wrapper .el-table__row td.el-table__cell) {
    height: 54px;
}

.operational-work-item-page__pagination {
    margin: 0;
    border-top: 1px solid var(--el-border-color-lighter);
    padding: 12px 14px;
}
.operational-work-item-page__scope { flex: 0 1 492px; }
.operational-work-item-page__scope :deep(.el-form-item__content) { flex-wrap: wrap; gap: 4px; }
.operational-work-item-page__scope :deep(.el-checkbox) { margin-right: 8px; }
.operational-work-item-page :deep(.transaction-search__grid) { align-items: center; }
.operational-work-item-page :deep(.transaction-search .transaction-time-form-item) {
    flex: 0 1 492px;
}

.operational-work-item-page :deep(.transaction-search .transaction-time-form-item .el-form-item__content),
.operational-work-item-page :deep(.transaction-search .operational-work-item-page__detected-time.el-date-editor) {
    width: var(--admin-datetime-range-width);
    max-width: 100%;
    flex: 0 1 var(--admin-datetime-range-width);
}

.operational-work-item-page__sla {
    display: grid;
    justify-items: start;
    gap: 3px;
}

.operational-work-item-page__source-tag {
    max-width: 100%;
    white-space: nowrap;
}

.operational-work-item-page__business-no {
    color: var(--el-text-color-regular);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
}

.operational-work-item-page__priority {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 4px;
    padding: 3px 8px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 600;
}
.operational-work-item-page__priority i { width: 7px; height: 7px; border-radius: 50%; background: var(--el-color-primary); }
.operational-work-item-page__priority.is-critical { background: var(--el-color-danger-light-9); color: var(--el-color-danger); }
.operational-work-item-page__priority.is-critical i { background: var(--el-color-danger); }
.operational-work-item-page__priority.is-high { background: var(--el-color-warning-light-9); color: var(--el-color-warning-dark-2); }
.operational-work-item-page__priority.is-high i { background: var(--el-color-warning); }
.operational-work-item-page__priority.is-low { background: var(--el-color-success-light-9); color: var(--el-color-success-dark-2); }
.operational-work-item-page__priority.is-low i { background: var(--el-color-success); }
.operational-work-item-page__amount { color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; font-weight: 600; }
.operational-work-item-page__sla > span:last-child {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
}
.operational-work-item-page__sla > span:last-child i { width: 7px; height: 7px; border-radius: 50%; background: currentcolor; }
.operational-work-item-page__sla.is-overdue { color: var(--el-color-danger); }
.operational-work-item-page__sla.is-pending { color: var(--el-color-warning-dark-2); }
.operational-work-item-page__sla.is-completed { color: var(--el-color-success-dark-2); }
.is-unassigned { color: var(--el-text-color-placeholder); }

.operational-work-item-page__detail-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding-bottom: 16px;
}

.operational-work-item-page__detail-head > div:first-child { display: grid; gap: 5px; }
.operational-work-item-page__detail-head > div:first-child > span { color: var(--el-text-color-secondary); font-size: 12px; }
.operational-work-item-page__detail-tags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.operational-work-item-page__detail-section + .operational-work-item-page__detail-section { margin-top: 24px; }
.operational-work-item-page__detail-section h3 { margin: 0 0 10px; color: var(--el-text-color-primary); font-size: 14px; font-weight: 700; }
.operational-work-item-page__section-head { display: flex; align-items: center; justify-content: space-between; }
.operational-work-item-page__descriptions :deep(.el-descriptions__table) { width: 100%; table-layout: fixed; }
.operational-work-item-page__descriptions :deep(.el-descriptions__label.el-descriptions__cell) {
    width: 144px;
    min-width: 144px;
}
.operational-work-item-page__descriptions :deep(.el-descriptions__content.el-descriptions__cell) {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
}
.operational-work-item-page__timeline { padding: 8px 6px 0; }
.operational-work-item-page__history-section { min-height: 160px; }
.operational-work-item-page__history-error { display: flex; align-items: center; gap: 12px; }
.operational-work-item-page__history-error :deep(.el-alert) { flex: 1; }
.operational-work-item-page__history-pagination { display: flex; justify-content: flex-end; margin-top: 14px; }
.operational-work-item-page__history-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.operational-work-item-page__history-head span { color: var(--el-text-color-secondary); font-size: 12px; }
.operational-work-item-page__timeline p { margin: 6px 0 0; color: var(--el-text-color-regular); line-height: 1.6; }
.operational-work-item-page__drawer-footer { display: flex; justify-content: flex-end; gap: 8px; }
.operational-work-item-page__dialog-select { width: 100%; }

@media (max-width: 1100px) {
    .operational-work-item-page__table-toolbar { align-items: flex-start; }
    .operational-work-item-page__priority-legend { display: none; }
}

@media (max-width: 640px) {
    .operational-work-item-page__table-toolbar { align-items: stretch; flex-direction: column; }
    .operational-work-item-page__toolbar { align-self: flex-end; }
    .operational-work-item-page__toolbar-divider { display: none; }
    .operational-work-item-page__metrics { width: 100%; order: 3; }
    .operational-work-item-page__detail-head { align-items: flex-start; flex-direction: column; }
    .operational-work-item-page__history-error { align-items: stretch; flex-direction: column; }
    .operational-work-item-page__history-pagination { justify-content: flex-start; overflow-x: auto; padding-bottom: 4px; }
    .operational-work-item-page__scope,
    .operational-work-item-page :deep(.transaction-search .transaction-time-form-item),
    .operational-work-item-page :deep(.transaction-search .transaction-time-form-item .el-form-item__content),
    .operational-work-item-page :deep(.transaction-search .operational-work-item-page__detected-time.el-date-editor) {
        width: 100%;
        flex-basis: 100%;
    }
}
</style>

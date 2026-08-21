<template>
    <div class="app-container">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="86px">
            <el-form-item :label="$t('feeAccount.merchant')">
                <MerchantRemoteSelect v-model="query.keyword" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('common.status')">
                <el-select v-model="query.accountStatus" clearable :placeholder="$t('feeAccount.allStatuses')">
                    <el-option v-for="item in accountStatuses" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('feeAccount.settlementCurrency')">
                <CurrencySelect v-model="query.settlementCurrency" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="RefreshLeft" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button v-hasPermi="'fund:account:export'" type="warning" plain :icon="Download" size="small" @click="handleExport">
                    {{ $t('common.export') }}
                </el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadAccounts" />
            </el-col>
        </el-row>

        <StandardTable v-loading="loading" table-key="admin-fund-account-list" :data="rows" row-key="id" size="small">
            <el-table-column prop="accountNo" :label="$t('feeAccount.accountNo')" min-width="190" fixed="left" align="center" show-overflow-tooltip />
            <el-table-column prop="merchantId" :label="$t('feeAccount.merchantId')" min-width="145" align="center" show-overflow-tooltip />
            <el-table-column prop="merchantName" :label="$t('feeAccount.merchantName')" min-width="170" align="center" show-overflow-tooltip />
            <el-table-column prop="settlementCurrency" :label="$t('feeAccount.settlementCurrency')" width="105" align="center" />
            <el-table-column :label="$t('feeAccount.availableBalance')" min-width="155" align="right">
                <template #default="{ row }"><BaseAmount :value="row.availableBalance" :currency="row.settlementCurrency" currency-display="code" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.status')" width="130" align="center">
                <template #default="{ row }"><el-tag :type="accountStatusType(row.accountStatus)">{{ accountStatusText(row.accountStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="$t('feeAccount.negativeReverseRestriction')" min-width="145" align="center">
                <template #default="{ row }"><el-tag :type="row.reverseRestricted ? 'danger' : 'success'">{{ row.reverseRestricted ? $t('feeAccount.restricted') : $t('feeAccount.normal') }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="$t('common.updateTime')" min-width="170" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="300" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button v-hasPermi="'fund:account:detail'" link type="primary" :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                    <el-button v-hasPermi="'fund:recharge:add'" link type="primary" :icon="CreditCard" @click="openRecharge(row)">{{ $t('feeAccount.recharge') }}</el-button>
                    <el-button v-if="row.accountStatus !== 'CLOSED'" v-hasPermi="'fund:deduction:add'" link type="danger" :icon="Remove" @click="openDeduction(row)">{{ $t('feeAccount.deduction') }}</el-button>
                    <el-dropdown v-if="hasStatusAction(row)" trigger="click" @command="(command: string | number | object) => openStatusAction(command, row)">
                        <el-button link type="primary" :icon="MoreFilled">{{ $t('feeAccount.accountActions') }}</el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-if="row.accountStatus === 'NORMAL' && canFreeze" command="freeze" :icon="Lock">{{ $t('feeAccount.freezeAccount') }}</el-dropdown-item>
                                <el-dropdown-item v-if="row.accountStatus === 'FROZEN' && canUnfreeze" command="unfreeze" :icon="Unlock">{{ $t('feeAccount.unfreezeAccount') }}</el-dropdown-item>
                                <el-dropdown-item v-if="['NORMAL', 'FROZEN'].includes(row.accountStatus) && canClose" command="close" :icon="CircleClose">{{ $t('feeAccount.closeAccount') }}</el-dropdown-item>
                                <el-dropdown-item v-if="row.accountStatus === 'CLOSED' && canReopen" command="reopen" :icon="RefreshRight">{{ $t('feeAccount.reopenAccount') }}</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-show="total > 0" class="pagination-container">
            <el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadAccounts" @size-change="handleSearch" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="`${detail?.merchantName || detail?.merchantId || ''} ${$t('feeAccount.accountDetail')}`" size="full">
            <div v-if="detail" class="account-detail">
                <el-descriptions :column="3" border size="small">
                    <el-descriptions-item :label="$t('feeAccount.accountNo')">{{ detail.accountNo }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('feeAccount.merchantId')">{{ detail.merchantId }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('feeAccount.merchantName')">{{ detail.merchantName || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('feeAccount.settlementCurrency')">{{ detail.settlementCurrency }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('common.status')"><el-tag :type="accountStatusType(detail.accountStatus)">{{ accountStatusText(detail.accountStatus) }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="$t('feeAccount.negativeReverseRestriction')"><el-tag :type="detail.reverseRestricted ? 'danger' : 'success'">{{ detail.reverseRestricted ? $t('feeAccount.restricted') : $t('feeAccount.normal') }}</el-tag></el-descriptions-item>
                </el-descriptions>

                <div class="account-capabilities">
                    <span>{{ $t('feeAccount.accountCapabilities') }}</span>
                    <el-tag :type="detail.creditAllowed ? 'success' : 'info'">{{ $t('feeAccount.creditCapability') }} · {{ capabilityText(detail.creditAllowed) }}</el-tag>
                    <el-tag :type="detail.withdrawalAllowed ? 'success' : 'danger'">{{ $t('feeAccount.withdrawalCapability') }} · {{ capabilityText(detail.withdrawalAllowed) }}</el-tag>
                    <el-tag :type="detail.settlementAllowed ? 'success' : 'danger'">{{ $t('feeAccount.settlementCapability') }} · {{ capabilityText(detail.settlementAllowed) }}</el-tag>
                    <el-tag :type="detail.reverseTransactionAllowed ? 'success' : 'danger'">{{ $t('feeAccount.reverseCapability') }} · {{ capabilityText(detail.reverseTransactionAllowed) }}</el-tag>
                </div>

                <section class="account-balance-band">
                    <article class="balance-primary">
                        <span>{{ $t('feeAccount.availableBalance') }}</span>
                        <strong :class="{ negative: Number(detail.availableBalance) < 0 }"><BaseAmount :value="detail.availableBalance" :currency="detail.settlementCurrency" currency-display="code" /></strong>
                        <small>{{ $t('feeAccount.availableBalanceHint') }}</small>
                    </article>
                    <article class="balance-pending">
                        <span>{{ $t('feeAccount.pendingBalance') }}</span>
                        <div v-if="detail.pendingBalances?.length" class="balance-values">
                            <strong v-for="item in detail.pendingBalances" :key="item.currency"><BaseAmount :value="item.amount" :currency="item.currency" currency-display="code" /></strong>
                        </div>
                        <strong v-else>-</strong>
                        <small>{{ $t('feeAccount.pendingBalanceHint') }}</small>
                    </article>
                    <article class="balance-reserve">
                        <span>{{ $t('feeAccount.reserveBalance') }}</span>
                        <strong><BaseAmount :value="detail.reserveBalance" :currency="detail.settlementCurrency" currency-display="code" /></strong>
                        <small>{{ $t('feeAccount.reserveBalanceHint') }}</small>
                    </article>
                </section>

                <section v-if="canViewLedgers" class="ledger-section">
                    <el-form :model="detailQuery" inline size="small" class="search-form ledger-query" label-width="74px">
                        <el-form-item :label="$t('common.keyword')">
                            <el-input v-model="detailQuery.keyword" clearable :placeholder="$t('feeAccount.ledgerSearchPlaceholder')" @keyup.enter="handleLedgerSearch" />
                        </el-form-item>
                        <el-form-item :label="$t('feeAccount.businessType')">
                            <el-select v-model="detailQuery.businessType" clearable filterable :placeholder="$t('common.pleaseSelect')">
                                <el-option v-for="item in businessTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="$t('feeAccount.direction')">
                            <el-select v-model="detailQuery.direction" clearable :placeholder="$t('common.pleaseSelect')">
                                <el-option v-for="item in directionOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="$t('feeAccount.postedTime')">
                            <el-date-picker v-model="detailPostedRange" class="posted-range" type="datetimerange" :default-time="FULL_DAY_RANGE_DEFAULT_TIMES" :range-separator="$t('common.to')" :start-placeholder="$t('common.startTime')" :end-placeholder="$t('common.endTime')" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :icon="Search" size="small" @click="handleLedgerSearch">{{ $t('common.search') }}</el-button>
                            <el-button :icon="RefreshLeft" size="small" @click="resetLedgerSearch">{{ $t('common.reset') }}</el-button>
                        </el-form-item>
                    </el-form>
                    <el-row :gutter="10" class="mb8">
                        <el-col :span="1.5">
                            <el-button v-hasPermi="'fund:ledger:export'" type="warning" plain :icon="Download" size="small" @click="handleLedgerExport">{{ $t('common.export') }}</el-button>
                        </el-col>
                        <el-col class="ledger-heading">{{ $t('feeAccount.balanceLedger') }}</el-col>
                    </el-row>
                    <StandardTable v-loading="detailLoading" table-key="admin-fund-ledger-detail" :data="ledgers" row-key="id" size="small">
                        <el-table-column prop="ledgerNo" :label="$t('feeAccount.ledgerNo')" min-width="190" fixed="left" align="center" show-overflow-tooltip />
                        <el-table-column prop="summary" :label="$t('feeAccount.summary')" min-width="190" align="center" show-overflow-tooltip />
                        <el-table-column :label="$t('feeAccount.businessType')" min-width="140" align="center"><template #default="{ row }">{{ dictLabel(businessTypeOptions, row.businessType) }}</template></el-table-column>
                        <el-table-column :label="$t('feeAccount.direction')" width="88" align="center">
                            <template #default="{ row }"><el-tag :type="row.direction === 'CREDIT' ? 'success' : 'danger'">{{ dictLabel(directionOptions, row.direction) }}</el-tag></template>
                        </el-table-column>
                        <el-table-column :label="$t('feeAccount.occurredAmount')" min-width="150" align="right">
                            <template #default="{ row }"><BaseAmount :value="row.amount" :currency="row.currency" currency-display="code" /></template>
                        </el-table-column>
                        <el-table-column :label="$t('feeAccount.balanceBefore')" min-width="150" align="right">
                            <template #default="{ row }"><BaseAmount :value="row.balanceBefore" :currency="row.currency" currency-display="code" /></template>
                        </el-table-column>
                        <el-table-column :label="$t('feeAccount.balanceAfter')" min-width="150" align="right">
                            <template #default="{ row }"><BaseAmount :value="row.balanceAfter" :currency="row.currency" currency-display="code" /></template>
                        </el-table-column>
                        <el-table-column prop="operatorName" :label="$t('feeAccount.operator')" width="115" align="center" />
                        <el-table-column prop="reviewerName" :label="$t('feeAccount.reviewer')" width="115" align="center" />
                        <el-table-column :label="$t('feeAccount.postedTime')" min-width="170" align="center">
                            <template #default="{ row }"><BaseDateTime :value="row.postedTime" /></template>
                        </el-table-column>
                        <el-table-column :label="$t('common.operation')" width="82" fixed="right" align="center">
                            <template #default="{ row }"><el-button link type="primary" :icon="View" @click="openLedgerDetail(row)">{{ $t('common.detail') }}</el-button></template>
                        </el-table-column>
                    </StandardTable>
                    <div v-show="detailTotal > 0" class="pagination-container">
                        <el-pagination v-model:current-page="detailQuery.pageNo" v-model:page-size="detailQuery.pageSize" :total="detailTotal" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadLedgers" @size-change="handleLedgerSearch" />
                    </div>
                </section>
                <el-empty v-else :description="$t('feeAccount.noDetailPermission')" />
            </div>
        </CommonDetailDrawer>

        <CommonDetailDrawer v-model:visible="ledgerDetailVisible" :title="$t('feeAccount.ledgerDetailTitle')" size="lg">
            <FundLedgerDetail
                v-if="selectedLedger"
                :ledger="selectedLedger"
                :business-type-label="dictLabel(businessTypeOptions, selectedLedger.businessType)"
            />
        </CommonDetailDrawer>

        <el-dialog v-model="statusActionVisible" :title="statusActionTitle" width="520px" append-to-body destroy-on-close>
            <el-alert :title="$t(`feeAccount.${statusActionMode}AccountNotice`)" type="warning" :closable="false" show-icon />
            <el-form ref="statusActionFormRef" :model="statusActionForm" :rules="statusActionRules" label-width="92px" class="dialog-form status-action-form">
                <el-form-item :label="$t('feeAccount.accountNo')">{{ statusActionTarget?.accountNo || '-' }}</el-form-item>
                <el-form-item :label="$t('feeAccount.statusReason')" prop="reason">
                    <el-input v-model.trim="statusActionForm.reason" type="textarea" :rows="4" maxlength="500" show-word-limit :placeholder="$t('feeAccount.statusReasonPlaceholder')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button :type="statusActionMode === 'close' ? 'danger' : 'primary'" :loading="statusSubmitting" @click="submitStatusAction">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="statusActionVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { FULL_DAY_RANGE_DEFAULT_TIMES } from '@acquiring/shared';
import { CircleClose, CreditCard, Download, Lock, MoreFilled, RefreshLeft, RefreshRight, Remove, Search, Unlock, View } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
    closeFundAccount,
    exportFundAccounts,
    exportFundLedgers,
    freezeFundAccount,
    getFundAccount,
    reopenFundAccount,
    searchFundAccounts,
    searchFundLedgers,
    unfreezeFundAccount,
    type FundAccount,
    type FundAccountQuery,
    type FundDetailQuery,
    type FundLedger,
} from '@/api/fund';
import BaseAmount from '@/components/BaseAmount/index.vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import CurrencySelect from '@/views/exchange/CurrencySelect.vue';
import FundLedgerDetail from '@/views/fund/components/FundLedgerDetail.vue';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import { defaultTodayFullDayRange } from '@/views/transaction/shared';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';

type StatusActionMode = 'freeze' | 'unfreeze' | 'close' | 'reopen';

const { locale, t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const canViewLedgers = userStore.hasPermission('fund:ledger:list');
const canFreeze = userStore.hasPermission('fund:account:freeze');
const canUnfreeze = userStore.hasPermission('fund:account:unfreeze');
const canClose = userStore.hasPermission('fund:account:close');
const canReopen = userStore.hasPermission('fund:account:reopen');
const accountStatuses = ['NORMAL', 'FROZEN', 'CLOSED'].map((value) => ({
    label: t(`feeAccount.status.${value}`),
    value,
}));

const loading = ref(false);
const detailLoading = ref(false);
const showSearch = ref(true);
const rows = ref<FundAccount[]>([]);
const total = ref(0);
const query = ref<FundAccountQuery>({ pageNo: 1, pageSize: 10 });
const detailVisible = ref(false);
const detail = ref<FundAccount | null>(null);
const detailQuery = ref<FundDetailQuery>({ pageNo: 1, pageSize: 10 });
const detailPostedRange = ref<string[]>(defaultTodayFullDayRange());
const detailTotal = ref(0);
const ledgers = ref<FundLedger[]>([]);
const ledgerDetailVisible = ref(false);
const selectedLedger = ref<FundLedger | null>(null);
const businessTypeOptions = ref<SelectOption[]>([]);
const directionOptions = ref<SelectOption[]>([]);
const statusActionVisible = ref(false);
const statusSubmitting = ref(false);
const statusActionFormRef = ref<FormInstance>();
const statusActionMode = ref<StatusActionMode>('freeze');
const statusActionTarget = ref<FundAccount | null>(null);
const statusActionForm = reactive({ reason: '' });
const statusActionTitle = computed(() => t(`feeAccount.${statusActionMode.value}Account`));
const statusActionRules: FormRules = {
    reason: [{ required: true, message: t('feeAccount.statusReasonRequired'), trigger: 'blur' }],
};

onMounted(async () => {
    const merchantId = typeof route.query.merchantId === 'string' ? route.query.merchantId.trim() : '';
    if (merchantId) query.value.keyword = merchantId;
    await loadDictionaries();
    await loadAccounts();
});

/** 加载余额流水业务类型和方向字典，字典故障不阻塞账户查询。 */
async function loadDictionaries() {
    const currentLocale = String(locale.value || 'zh-CN');
    const [businessTypes, directions] = await Promise.all([
        loadDictOptions('fund_ledger_business_type', currentLocale).catch(() => []),
        loadDictOptions('fund_direction', currentLocale).catch(() => []),
    ]);
    businessTypeOptions.value = businessTypes;
    directionOptions.value = directions;
}

/** Load fund accounts under the current filter. */
async function loadAccounts() {
    loading.value = true;
    try {
        const result = await searchFundAccounts({
            ...query.value,
            settlementCurrency: query.value.settlementCurrency?.toUpperCase(),
        });
        rows.value = result.records || [];
        total.value = result.total || 0;
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    query.value.pageNo = 1;
    loadAccounts();
}

function handleReset() {
    query.value = { pageNo: 1, pageSize: query.value.pageSize || 10 };
    loadAccounts();
}

async function handleExport() {
    try {
        await exportFundAccounts(query.value);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

/** Open the account summary and its immutable available-balance ledger. */
async function openDetail(row: FundAccount) {
    try {
        detail.value = await getFundAccount(row.id);
        detailVisible.value = true;
        detailQuery.value = { pageNo: 1, pageSize: 10 };
        detailPostedRange.value = defaultTodayFullDayRange();
        if (canViewLedgers) await loadLedgers();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

function openRecharge(row: FundAccount) {
    router.push({ path: '/fund/recharge', query: { accountId: String(row.id), merchantId: row.merchantId } });
}

function openDeduction(row: FundAccount) {
    router.push({ path: '/fund/deduction', query: { accountId: String(row.id), merchantId: row.merchantId } });
}

function handleLedgerSearch() {
    detailQuery.value.pageNo = 1;
    loadLedgers();
}

function resetLedgerSearch() {
    detailQuery.value = { pageNo: 1, pageSize: detailQuery.value.pageSize || 10 };
    detailPostedRange.value = defaultTodayFullDayRange();
    loadLedgers();
}

async function loadLedgers() {
    if (!detail.value || !canViewLedgers) return;
    detailLoading.value = true;
    try {
        const result = await searchFundLedgers(detail.value.id, {
            ...detailQuery.value,
            postedStartTime: detailPostedRange.value[0] || undefined,
            postedEndTime: detailPostedRange.value[1] || undefined,
        });
        ledgers.value = result.records || [];
        detailTotal.value = result.total || 0;
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        detailLoading.value = false;
    }
}

async function handleLedgerExport() {
    if (!detail.value) return;
    try {
        await exportFundLedgers(detail.value.id, {
            ...detailQuery.value,
            postedStartTime: detailPostedRange.value[0] || undefined,
            postedEndTime: detailPostedRange.value[1] || undefined,
        });
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

/** Open the immutable ledger audit snapshot already returned by the list API. */
function openLedgerDetail(row: FundLedger) {
    selectedLedger.value = row;
    ledgerDetailVisible.value = true;
}

function accountStatusText(value: string) {
    return value ? t(`feeAccount.status.${value}`) : '-';
}

function accountStatusType(value: string) {
    if (value === 'NORMAL') return 'success';
    if (value === 'FROZEN') return 'warning';
    return 'danger';
}

function capabilityText(allowed?: boolean) {
    return allowed ? t('feeAccount.allowed') : t('feeAccount.prohibited');
}

function dictLabel(options: SelectOption[], value?: string) {
    if (!value) return '-';
    return options.find((item) => item.value === value)?.label || value;
}

function hasStatusAction(row: FundAccount) {
    return (row.accountStatus === 'NORMAL' && (canFreeze || canClose))
        || (row.accountStatus === 'FROZEN' && (canUnfreeze || canClose))
        || (row.accountStatus === 'CLOSED' && canReopen);
}

/** 打开账户状态操作窗口，提交时仍使用列表读取到的账户版本进行并发保护。 */
function openStatusAction(command: string | number | object, row: FundAccount) {
    const mode = String(command) as StatusActionMode;
    if (!['freeze', 'unfreeze', 'close', 'reopen'].includes(mode)) return;
    statusActionMode.value = mode;
    statusActionTarget.value = row;
    statusActionForm.reason = '';
    statusActionVisible.value = true;
    nextTick(() => statusActionFormRef.value?.clearValidate());
}

/** 提交带账户行版本的人工状态变更，成功后同步刷新列表和已打开详情。 */
async function submitStatusAction() {
    const valid = await statusActionFormRef.value?.validate().catch(() => false);
    if (!valid || !statusActionTarget.value) return;
    statusSubmitting.value = true;
    const target = statusActionTarget.value;
    const request = { accountVersion: target.accountVersion, reason: statusActionForm.reason };
    try {
        const handlers = {
            freeze: freezeFundAccount,
            unfreeze: unfreezeFundAccount,
            close: closeFundAccount,
            reopen: reopenFundAccount,
        };
        const updated = await handlers[statusActionMode.value](target.id, request);
        rows.value = rows.value.map((item) => item.id === updated.id ? { ...item, ...updated } : item);
        if (detail.value?.id === updated.id) detail.value = updated;
        statusActionVisible.value = false;
        ElMessage.success(t('common.saveSuccess'));
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    } finally {
        statusSubmitting.value = false;
    }
}
</script>

<style scoped>
.search-form :deep(.el-select),
.search-form :deep(.el-input) { width: 220px; }
.search-form :deep(.posted-range) { width: 372px; }
.account-detail { display: grid; gap: 16px; min-width: 0; }
.account-capabilities { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 11px 14px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; }
.account-capabilities > span { margin-right: 4px; color: #475467; font-size: 13px; font-weight: 600; }
.account-balance-band { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow: hidden; border: 1px solid #dfe6ee; border-radius: 6px; background: #fff; }
.account-balance-band article { min-height: 116px; padding: 18px; border-right: 1px solid #e7ebf0; }
.account-balance-band article:last-child { border-right: 0; }
.account-balance-band article.balance-primary { border-top: 3px solid #16a085; background: #f4fbf8; }
.account-balance-band article.balance-pending { border-top: 3px solid #3b82c4; background: #f7fbff; }
.account-balance-band article.balance-reserve { border-top: 3px solid #d49b2f; background: #fffbf2; }
.account-balance-band span,
.account-balance-band small { display: block; color: #778196; font-size: 12px; }
.account-balance-band strong { display: block; margin-top: 9px; color: #17243a; font-size: 20px; letter-spacing: 0; }
.account-balance-band strong.negative { color: #c2413b; }
.account-balance-band small { margin-top: 8px; color: #98a2b3; }
.balance-values { display: grid; gap: 3px; }
.ledger-section { min-width: 0; padding-top: 2px; }
.ledger-query { padding-top: 14px; border-top: 1px solid #e5e7eb; }
.ledger-heading { display: flex; align-items: center; justify-content: flex-end; color: #667085; font-size: 13px; }
.dialog-form { padding: 4px 20px 0; }
.status-action-form { margin-top: 18px; }
@media (max-width: 800px) {
    .account-balance-band { grid-template-columns: 1fr; }
    .account-balance-band article { border-right: 0; border-bottom: 1px solid #e7ebf0; }
    .account-balance-band article:last-child { border-bottom: 0; }
}
</style>

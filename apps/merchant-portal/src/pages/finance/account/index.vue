<template>
    <div class="page system-page merchant-redesigned-page merchant-account-page">
        <el-alert v-if="account && Number(account.availableBalance) < 0" :title="$t('finance.negativeAlert')" type="error" :closable="false" show-icon />

        <div v-if="account" class="account-state-bar">
            <div><span>{{ $t('finance.accountNo') }}</span><strong>{{ account.accountNo }}</strong></div>
            <el-tag :type="accountStatusType(account.accountStatus)">{{ accountStatusText(account.accountStatus) }}</el-tag>
            <el-tag :type="account.reverseRestricted ? 'danger' : 'success'">{{ account.reverseRestricted ? $t('finance.reverseRestricted') : $t('finance.reverseNormal') }}</el-tag>
        </div>

        <section v-loading="accountLoading" class="balance-band">
            <article class="balance-primary">
                <span>{{ $t('finance.availableBalance') }}</span>
                <strong :class="{ negative: Number(account?.availableBalance) < 0 }">{{ money(account?.availableBalance, account?.settlementCurrency) }}</strong>
                <small>{{ $t('finance.availableBalanceHint') }}</small>
            </article>
            <article class="pending-balance balance-pending">
                <span>{{ $t('finance.pendingBalance') }}</span>
                <div v-if="account?.pendingBalances?.length">
                    <strong v-for="item in account.pendingBalances" :key="item.currency">{{ money(item.amount, item.currency) }}</strong>
                </div>
                <strong v-else>-</strong>
                <small>{{ $t('finance.pendingHint') }}</small>
            </article>
            <article class="balance-reserve">
                <span>{{ $t('finance.reserveBalance') }}</span>
                <strong>{{ money(account?.reserveBalance, account?.settlementCurrency) }}</strong>
                <small>{{ $t('finance.reserveHint') }}</small>
            </article>
        </section>

        <section v-if="canViewLedgers" class="merchant-list-card merchant-search-card">
            <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" @submit.prevent>
                <el-form-item :label="$t('common.keyword')">
                    <el-input v-model="query.keyword" clearable :placeholder="$t('finance.ledgerSearch')" @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="$t('finance.businessType')">
                    <el-select v-model="query.businessType" clearable filterable :placeholder="$t('common.pleaseSelect')">
                        <el-option v-for="item in businessTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('finance.postedTime')">
                    <el-date-picker v-model="postedRange" class="posted-range" type="datetimerange" :default-time="FULL_DAY_RANGE_DEFAULT_TIMES" :range-separator="$t('common.to')" :start-placeholder="$t('common.startTime')" :end-placeholder="$t('common.endTime')" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" />
                </el-form-item>
                <el-form-item class="merchant-search-actions">
                    <el-button :icon="Search" type="primary" @click="handleSearch">{{ $t('common.search') }}</el-button>
                    <el-button :icon="RefreshLeft" @click="handleReset">{{ $t('common.reset') }}</el-button>
                </el-form-item>
            </el-form>
        </section>

        <section v-if="canViewLedgers" class="merchant-list-card merchant-table-card">
            <div class="merchant-table-head finance-table-head">
                <div class="merchant-table-head__actions">
                    <el-button v-if="canExportLedgers" type="warning" plain size="small" :icon="Download" :loading="exporting" @click="handleExport">
                        {{ $t('common.export') }}
                    </el-button>
                </div>
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadLedgers" />
            </div>

            <StandardTable v-loading="detailLoading" table-key="merchant-fund-ledger-list" :data="ledgers" row-key="id" size="small">
                <el-table-column prop="ledgerNo" :label="$t('finance.ledgerNo')" min-width="190" fixed="left" align="center" show-overflow-tooltip />
                <el-table-column prop="summary" :label="$t('finance.summary')" min-width="200" align="center" show-overflow-tooltip />
                <el-table-column :label="$t('finance.businessType')" min-width="140" align="center"><template #default="{ row }">{{ dictLabel(businessTypeOptions, row.businessType) }}</template></el-table-column>
                <el-table-column :label="$t('finance.direction')" width="90" align="center">
                    <template #default="{ row }"><el-tag :type="row.direction === 'CREDIT' ? 'success' : 'danger'">{{ dictLabel(directionOptions, row.direction) }}</el-tag></template>
                </el-table-column>
                <el-table-column :label="$t('finance.amount')" min-width="140" align="right">
                    <template #default="{ row }">{{ money(row.amount, row.currency) }}</template>
                </el-table-column>
                <el-table-column :label="$t('finance.balanceBefore')" min-width="140" align="right">
                    <template #default="{ row }">{{ money(row.balanceBefore, row.currency) }}</template>
                </el-table-column>
                <el-table-column :label="$t('finance.balanceAfter')" min-width="140" align="right">
                    <template #default="{ row }">{{ money(row.balanceAfter, row.currency) }}</template>
                </el-table-column>
                <el-table-column prop="operatorName" :label="$t('finance.operator')" width="120" align="center" />
                <el-table-column prop="reviewerName" :label="$t('finance.reviewer')" width="120" align="center" />
                <el-table-column :label="$t('finance.postedTime')" min-width="170" align="center">
                    <template #default="{ row }"><BaseDateTime :value="row.postedTime" /></template>
                </el-table-column>
                <el-table-column :label="$t('common.operation')" width="84" fixed="right" align="center">
                    <template #default="{ row }"><el-button link type="primary" :icon="View" @click="openLedgerDetail(row)">{{ $t('common.detail') }}</el-button></template>
                </el-table-column>
            </StandardTable>

            <div v-show="total > 0" class="pagination-container">
                <el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadLedgers" @size-change="handleSearch" />
            </div>
        </section>
        <el-empty v-else :description="$t('finance.noDetailPermission')" />

        <el-drawer v-model="ledgerDetailVisible" :title="$t('finance.ledgerDetail')" size="min(760px, 96vw)" append-to-body destroy-on-close class="ledger-detail-drawer">
            <div v-if="selectedLedger" class="ledger-detail">
                <section class="ledger-summary-band">
                    <div>
                        <span>{{ $t('finance.ledgerNo') }}</span>
                        <strong>{{ selectedLedger.ledgerNo }}</strong>
                    </div>
                    <el-tag
                        class="ledger-direction-tag"
                        :class="selectedLedger.direction === 'CREDIT' ? 'is-credit' : 'is-debit'"
                        :type="selectedLedger.direction === 'CREDIT' ? 'success' : 'danger'"
                        effect="light"
                    >
                        {{ selectedLedger.direction === 'CREDIT' ? $t('finance.credit') : $t('finance.debit') }}
                    </el-tag>
                </section>
                <section class="ledger-amount-flow" :class="selectedLedger.direction === 'CREDIT' ? 'is-credit' : 'is-debit'">
                    <div class="ledger-amount-flow__item">
                        <span>{{ $t('finance.balanceBefore') }}</span>
                        <strong>{{ money(selectedLedger.balanceBefore, selectedLedger.currency) }}</strong>
                    </div>
                    <div class="ledger-amount-flow__item ledger-amount-flow__change">
                        <span>{{ $t('finance.occurredAmount') }}</span>
                        <strong>{{ money(selectedLedger.amount, selectedLedger.currency) }}</strong>
                    </div>
                    <div class="ledger-amount-flow__item">
                        <span>{{ $t('finance.balanceAfter') }}</span>
                        <strong>{{ money(selectedLedger.balanceAfter, selectedLedger.currency) }}</strong>
                    </div>
                </section>
                <section class="ledger-info-band is-business">
                    <h3>{{ $t('finance.ledgerBusinessInfo') }}</h3>
                    <el-descriptions :column="2" size="small">
                        <el-descriptions-item :label="$t('finance.accountSequence')">{{ selectedLedger.accountSequence }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('finance.balanceType')">{{ selectedLedger.balanceType }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('finance.businessType')">{{ dictLabel(businessTypeOptions, selectedLedger.businessType) }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('finance.summary')" :span="2">{{ selectedLedger.summary || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('finance.operationReason')" :span="2">{{ selectedLedger.operationReason || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('finance.businessNo')">{{ selectedLedger.businessNo || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('finance.transactionId')">{{ selectedLedger.transactionId || '-' }}</el-descriptions-item>
                    </el-descriptions>
                </section>
                <section class="ledger-info-band is-operation">
                    <h3>{{ $t('finance.ledgerAuditInfo') }}</h3>
                    <el-descriptions :column="2" size="small">
                        <el-descriptions-item :label="$t('finance.operator')">{{ selectedLedger.operatorName || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('finance.reviewer')">{{ selectedLedger.reviewerName || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('finance.reviewComment')" :span="2">{{ selectedLedger.reviewComment || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('finance.businessTime')"><BaseDateTime :value="selectedLedger.businessTime" /></el-descriptions-item>
                        <el-descriptions-item :label="$t('finance.postedTime')"><BaseDateTime :value="selectedLedger.postedTime" /></el-descriptions-item>
                    </el-descriptions>
                </section>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { formatDecimalAmount, FULL_DAY_RANGE_DEFAULT_TIMES } from '@acquiring/shared';
import { Download, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { financeApi, type DetailQuery, type FundAccount, type FundLedger } from '@/api/financeApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { hasPermission } from '@/utils/permission';
import {
    defaultTodayFullDayRange,
    loadTransactionDictOptions,
    type TransactionDictOption,
} from '@/pages/transaction/shared';

const { locale, t } = useI18n();
const canViewLedgers = hasPermission('merchant:fund:ledger:view');
const canExportLedgers = hasPermission('merchant:fund:ledger:export');
const accountLoading = ref(false);
const detailLoading = ref(false);
const exporting = ref(false);
const showSearch = ref(true);
const account = ref<FundAccount | null>(null);
const query = ref<DetailQuery>({ pageNo: 1, pageSize: 10 });
const postedRange = ref<string[]>(defaultTodayFullDayRange());
const total = ref(0);
const ledgers = ref<FundLedger[]>([]);
const ledgerDetailVisible = ref(false);
const selectedLedger = ref<FundLedger | null>(null);
const businessTypeOptions = ref<TransactionDictOption[]>([]);
const directionOptions = ref<TransactionDictOption[]>([]);

onMounted(async () => {
    await loadDictionaries();
    await Promise.all([loadAccount(), canViewLedgers ? loadLedgers() : Promise.resolve()]);
});

/** Load localized ledger dictionaries through the merchant system dictionary API. */
async function loadDictionaries() {
    const currentLocale = String(locale.value || 'zh-CN');
    const [businessTypes, directions] = await Promise.all([
        loadTransactionDictOptions('fund_ledger_business_type', currentLocale).catch(() => []),
        loadTransactionDictOptions('fund_direction', currentLocale).catch(() => []),
    ]);
    businessTypeOptions.value = businessTypes;
    directionOptions.value = directions;
}

async function loadAccount() {
    accountLoading.value = true;
    try {
        account.value = await financeApi.fundAccount();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        accountLoading.value = false;
    }
}

async function loadLedgers() {
    if (!canViewLedgers) return;
    detailLoading.value = true;
    try {
        const result = await financeApi.ledgers({
            ...query.value,
            postedStartTime: postedRange.value[0] || undefined,
            postedEndTime: postedRange.value[1] || undefined,
        });
        total.value = result.total || 0;
        ledgers.value = result.records || [];
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        detailLoading.value = false;
    }
}

function handleSearch() {
    query.value.pageNo = 1;
    loadLedgers();
}

function handleReset() {
    query.value = { pageNo: 1, pageSize: query.value.pageSize || 10 };
    postedRange.value = defaultTodayFullDayRange();
    loadLedgers();
}

async function handleExport() {
    exporting.value = true;
    try {
        await financeApi.exportLedgers({
            ...query.value,
            postedStartTime: postedRange.value[0] || undefined,
            postedEndTime: postedRange.value[1] || undefined,
        });
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        exporting.value = false;
    }
}

/** Show the read-only ledger audit snapshot returned by the merchant API. */
function openLedgerDetail(row: FundLedger) {
    selectedLedger.value = row;
    ledgerDetailVisible.value = true;
}

function money(value?: string | number | null, currency?: string) {
    if (value === undefined || value === null || value === '') return '-';
    const amount = formatDecimalAmount(value, String(locale.value || 'zh-CN'));
    return `${String(currency || '').toUpperCase()} ${amount}`.trim();
}

function dictLabel(options: TransactionDictOption[], value?: string) {
    if (!value) return '-';
    return options.find((item) => item.value === value)?.label || value;
}

function accountStatusText(value?: string) {
    return value ? t(`finance.accountStatus.${value}`) : '-';
}

function accountStatusType(value?: string) {
    if (value === 'NORMAL') return 'success';
    if (value === 'FROZEN') return 'warning';
    return 'danger';
}
</script>

<style scoped>
.merchant-account-page,
.ledger-detail-drawer { --account-ink: #17243a; --account-muted: #697586; --account-credit: #15803d; --account-credit-soft: #f0fdf4; --account-debit: #c2413b; --account-debit-soft: #fef2f2; }
.account-state-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; min-height: 58px; padding: 10px 16px; border: 1px solid #dbe4ec; border-bottom: 0; border-radius: 6px 6px 0 0; background: #f8fafc; }
.account-state-bar > div { margin-right: auto; min-width: 0; }
.account-state-bar > div > span { display: block; color: var(--account-muted); font-size: 11px; }
.account-state-bar strong { display: block; margin-top: 2px; overflow: hidden; color: var(--account-ink); font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.balance-band { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow: hidden; border: 1px solid #dbe4ec; border-radius: 6px; background: #fff; }
.account-state-bar + .balance-band { border-radius: 0 0 6px 6px; }
.balance-band article { min-height: 118px; padding: 18px; border-right: 1px solid #e8edf2; }
.balance-band article:last-child { border-right: 0; }
.balance-band article.balance-primary { border-top: 3px solid #159a78; background: #f4fbf8; }
.balance-band article.balance-pending { border-top: 3px solid #3b82c4; background: #f7fbff; }
.balance-band article.balance-reserve { border-top: 3px solid #d49b2f; background: #fffbf2; }
.balance-band span,
.balance-band small { display: block; color: var(--account-muted); font-size: 12px; }
.balance-band strong { display: block; margin-top: 9px; color: var(--account-ink); font-size: 20px; letter-spacing: 0; }
.balance-band strong.negative { color: #c2413b; }
.balance-band small { margin-top: 7px; color: #98a2b3; }
.pending-balance > div { display: grid; gap: 3px; }
.pending-balance > div strong { font-size: 17px; }
.finance-table-head { min-height: 52px; }
.search-form :deep(.el-input),
.search-form :deep(.el-select) { width: 240px; }
.search-form :deep(.posted-range) { width: 372px; }
.ledger-detail-drawer :deep(.el-drawer__header) { min-height: 60px; margin-bottom: 0; padding: 17px 24px; border-bottom: 1px solid #e8edf3; }
.ledger-detail-drawer :deep(.el-drawer__title) { color: var(--account-ink); font-size: 17px; font-weight: 650; }
.ledger-detail-drawer :deep(.el-drawer__body) { padding: 20px 24px 28px; }
.ledger-detail { display: grid; gap: 16px; min-width: 0; }
.ledger-summary-band { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 16px 18px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; }
.ledger-summary-band > div { min-width: 0; }
.ledger-summary-band > div > span,
.ledger-amount-flow span { display: block; color: var(--account-muted); font-size: 12px; font-weight: 500; line-height: 18px; }
.ledger-summary-band strong { display: block; margin-top: 4px; overflow-wrap: anywhere; color: var(--account-ink); font-size: 17px; font-weight: 650; line-height: 24px; }
.ledger-direction-tag { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; min-width: 64px; height: 28px; border-radius: 4px; font-size: 13px; font-weight: 650; letter-spacing: 0; }
.ledger-direction-tag :deep(.el-tag__content) { display: inline-flex; align-items: center; justify-content: center; width: 100%; }
.ledger-direction-tag.is-credit { border-color: #bbdfc6; color: var(--account-credit); background: var(--account-credit-soft); }
.ledger-direction-tag.is-debit { border-color: #f2c3c0; color: var(--account-debit); background: var(--account-debit-soft); }
.ledger-amount-flow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow: hidden; border: 1px solid #dfe6ee; border-radius: 6px; background: #fff; }
.ledger-amount-flow__item { min-width: 0; padding: 16px 18px; border-right: 1px solid #e5eaf1; background: #f8fafc; }
.ledger-amount-flow__item:last-child { border-right: 0; }
.ledger-amount-flow strong { display: block; margin-top: 7px; overflow: hidden; color: var(--account-ink); font-size: 17px; font-variant-numeric: tabular-nums; font-weight: 650; line-height: 24px; text-overflow: ellipsis; white-space: nowrap; }
.ledger-amount-flow__change { position: relative; background: #f7fbff; box-shadow: inset 0 3px 0 var(--merchant-action-primary); }
.ledger-amount-flow.is-credit .ledger-amount-flow__change { background: var(--account-credit-soft); box-shadow: inset 0 3px 0 var(--account-credit); }
.ledger-amount-flow.is-credit .ledger-amount-flow__change strong { color: var(--account-credit); }
.ledger-amount-flow.is-debit .ledger-amount-flow__change { background: var(--account-debit-soft); box-shadow: inset 0 3px 0 var(--account-debit); }
.ledger-amount-flow.is-debit .ledger-amount-flow__change strong { color: var(--account-debit); }
.ledger-info-band { padding: 14px 16px 8px; border-left: 3px solid #94a3b8; border-radius: 4px; background: #f8fafc; }
.ledger-info-band.is-business { border-left-color: #3b82c4; background: #f5faff; }
.ledger-info-band.is-operation { border-left-color: #1f9d78; background: #f3faf7; }
.ledger-info-band h3 { margin: 0 0 10px; color: #344054; font-size: 13px; font-weight: 700; line-height: 20px; }
.ledger-info-band :deep(.el-descriptions__body) { background: transparent; }
.ledger-info-band :deep(.el-descriptions__table) { table-layout: fixed; }
.ledger-info-band :deep(.el-descriptions__cell) { padding-bottom: 9px; }
.ledger-info-band :deep(.el-descriptions__label) { color: #526071; font-weight: 600; }
.ledger-info-band :deep(.el-descriptions__content) { color: #263244; overflow-wrap: anywhere; }
@media (max-width: 900px) {
    .balance-band { grid-template-columns: 1fr; }
    .balance-band article { border-right: 0; border-bottom: 1px solid #e8edf2; }
    .balance-band article:last-child { border-bottom: 0; }
}
@media (max-width: 620px) {
    .ledger-detail-drawer :deep(.el-drawer__header) { padding: 16px 18px; }
    .ledger-detail-drawer :deep(.el-drawer__body) { padding: 18px; }
    .ledger-summary-band { align-items: flex-start; gap: 14px; padding: 14px; }
    .ledger-summary-band strong { font-size: 14px; line-height: 22px; }
    .ledger-amount-flow { grid-template-columns: 1fr; }
    .ledger-amount-flow__item { border-right: 0; border-bottom: 1px solid #e8edf2; }
    .ledger-amount-flow__item:last-child { border-bottom: 0; }
}
</style>

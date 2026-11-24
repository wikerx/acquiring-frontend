<!-- Merchant 交易结算主页面：每次查询和导出由后端重新绑定当前 merchantId，仅展示已入账或已冲正批次。 -->
<template>
    <div class="page system-page merchant-redesigned-page settlement-page">
        <section v-if="canList || canExport" class="merchant-list-card merchant-search-card">
            <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" @submit.prevent>
                <el-form-item :label="t('settlement.batchNo')"><el-input v-model.trim="query.settlementBatchNo" clearable @keyup.enter="handleSearch" /></el-form-item>
                <el-form-item :label="t('settlement.batchType')"><el-select v-model="query.batchType" clearable><el-option v-for="value in batchTypes" :key="value" :label="enumText('batchType', value)" :value="value" /></el-select></el-form-item>
                <el-form-item :label="t('common.status')"><el-select v-model="query.batchStatus" clearable><el-option v-for="value in batchStatuses" :key="value" :label="enumText('batchStatus', value)" :value="value" /></el-select></el-form-item>
                <el-form-item :label="t('settlement.businessDate')"><el-date-picker v-model="businessDateRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /></el-form-item>
                <el-form-item class="merchant-search-actions"><el-button v-if="canList" type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button></el-form-item>
            </el-form>
        </section>

        <section v-if="canList || canExport" class="merchant-list-card merchant-table-card">
            <div class="merchant-table-head">
                <div class="merchant-table-head__actions"><el-button v-if="canExport" type="warning" plain size="small" :icon="Download" :loading="exporting" @click="handleExport">{{ t('common.export') }}</el-button></div>
                <RightToolbar v-if="canList" @toggle-search="showSearch = !showSearch" @refresh="loadBatches" />
            </div>
            <StandardTable v-if="canList" v-loading="loading" :table-key="props.reserveOnly ? 'merchant-reserve-settlement-batch-list' : 'merchant-settlement-batch-list'" :data="rows" row-key="settlementBatchNo" size="small">
                <el-table-column prop="settlementBatchNo" :label="t('settlement.batchNo')" min-width="220" fixed="left" align="center" show-overflow-tooltip />
                <el-table-column prop="businessDate" :label="t('settlement.businessDate')" width="122" align="center" />
                <el-table-column :label="t('settlement.batchType')" min-width="148" align="center"><template #default="{ row }"><el-tag effect="plain">{{ enumText('batchType', row.batchType) }}</el-tag></template></el-table-column>
                <el-table-column :label="t('common.status')" min-width="130" align="center"><template #default="{ row }"><el-tag :type="statusType(row.batchStatus)" effect="plain">{{ enumText('batchStatus', row.batchStatus) }}</el-tag></template></el-table-column>
                <el-table-column prop="transactionCount" :label="t('settlement.transactionCount')" width="100" align="center" />
                <el-table-column prop="candidateCount" :label="t('settlement.settlementItemCount')" width="112" align="center" />
                <el-table-column :label="t('settlement.netAmount')" min-width="190" align="right"><template #default="{ row }"><CurrencyAmountDisplay :amount="row.netAmount" :currency="row.targetCurrency" :exponent="row.targetCurrencyExponent" :locale="String(locale)" align="end" emphasized /></template></el-table-column>
                <el-table-column :label="t('settlement.netDirection')" width="106" align="center"><template #default="{ row }"><DirectionTag :direction="row.netDirection" :label="enumText('direction', row.netDirection)" /></template></el-table-column>
                <el-table-column :label="t('settlement.postedTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.postedTime" :source-time-zone="row.businessTimeZone" /></template></el-table-column>
                <el-table-column v-if="showOperationColumn" :label="t('common.operation')" width="144" fixed="right" align="center">
                    <template #default="{ row }">
                        <TableRowActions :actions="settlementRowActions()" :more-label="t('common.more')" @select="handleSettlementRowAction($event, row)" />
                    </template>
                </el-table-column>
            </StandardTable>
            <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadBatches" @size-change="handleSearch" /></div>
        </section>

        <el-drawer v-model="detailVisible" :title="t('settlement.batchDetail')" size="min(1480px, 96vw)" append-to-body destroy-on-close class="settlement-detail-drawer">
            <div v-loading="detailLoading || summaryLoading || voucherLoading" class="settlement-detail">
                <template v-if="activeBatch">
                    <div class="settlement-detail__identity"><strong>{{ activeBatch.settlementBatchNo }}</strong><el-tag :type="statusType(activeBatch.batchStatus)" effect="plain">{{ enumText('batchStatus', activeBatch.batchStatus) }}</el-tag></div>
                    <el-tabs v-model="detailTab" class="settlement-detail__tabs settlement-navigation-tabs" @tab-change="handleDetailTabChange">
                        <el-tab-pane v-if="canDetail" name="overview" lazy>
                            <template #label><span class="settlement-tab-label"><el-icon><Document /></el-icon>{{ t('settlement.overview') }}</span></template>
                            <template v-if="detail">
                            <el-descriptions :column="3" border size="small">
                                <el-descriptions-item :label="t('settlement.businessDate')">{{ detail.batch.businessDate }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.businessTimeZone')">{{ detail.batch.businessTimeZone }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.batchType')">{{ enumText('batchType', detail.batch.batchType) }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.settlementCurrency')"><CurrencyDisplay :currency="detail.batch.targetCurrency" :locale="documentLocale" size="xs" /></el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.transactionCount')">{{ detail.batch.transactionCount }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.settlementItemCount')">{{ detail.batch.candidateCount }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.netAmount')"><CurrencyAmountDisplay :amount="detail.batch.netAmount" :currency="detail.batch.targetCurrency" :exponent="detail.batch.targetCurrencyExponent" :locale="String(locale)" emphasized /></el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.createdTime')"><BaseDateTime :value="detail.batch.createTime" :source-time-zone="detail.batch.businessTimeZone" /></el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.postedTime')"><BaseDateTime :value="detail.batch.postedTime" :source-time-zone="detail.batch.businessTimeZone" /></el-descriptions-item>
                            </el-descriptions>
                            <section class="settlement-detail__section"><h3>{{ t('settlement.rateMatrix') }}</h3><el-table v-if="detail.rates.length" :data="detail.rates" border size="small" max-height="320">
                                <el-table-column :label="t('settlement.sourceCurrency')" width="110" align="center"><template #default="{ row }"><CurrencyDisplay :currency="row.sourceCurrency" :locale="documentLocale" size="xs" /></template></el-table-column><el-table-column :label="t('settlement.settlementCurrency')" width="110" align="center"><template #default="{ row }"><CurrencyDisplay :currency="row.targetCurrency" :locale="documentLocale" size="xs" /></template></el-table-column>
                                <el-table-column :label="t('settlement.directRate')" min-width="180" align="right"><template #default="{ row }">{{ rate(row.directRate) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.rateSource')" min-width="160" align="center" show-overflow-tooltip><template #default="{ row }">{{ enumText('rateSource', row.displaySource) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.effectiveTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.effectiveTime" :source-time-zone="detail.batch.businessTimeZone" /></template></el-table-column>
                                <el-table-column :label="t('settlement.lockedTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.lockedTime" :source-time-zone="detail.batch.businessTimeZone" /></template></el-table-column>
                            </el-table><el-empty v-else :description="t('settlement.rateMatrixEmpty')" :image-size="64" /></section>
                            </template>
                            <el-empty v-else-if="!detailLoading" :description="t('settlement.detailEmpty')" />
                        </el-tab-pane>
                        <el-tab-pane v-if="canViewSummaries" name="summaries" lazy>
                            <template #label><span class="settlement-tab-label"><el-icon><DataAnalysis /></el-icon>{{ t('settlement.summary') }}</span></template>
                            <div class="settlement-detail__tab-head">
                                <div><strong>{{ t('settlement.summary') }}</strong><span>{{ t('settlement.summaryHint') }}</span></div>
                                <el-button v-if="canExportSummaries" type="warning" plain :icon="Download" :loading="summaryExporting" @click="exportSummaries()">{{ t('common.export') }}</el-button>
                            </div>
                            <el-table v-if="summaryRows.length || summaryLoading" v-loading="summaryLoading" :data="summaryRows" border size="small">
                                <el-table-column :label="t('settlement.paymentMethod')" min-width="240" align="center"><template #default="{ row }"><PaymentMethodDisplay :payment-types="dimensionItems('paymentType', row.paymentType)" :payment-methods="dimensionItems('paymentMethod', row.paymentMethod)" /></template></el-table-column>
                                <el-table-column :label="t('settlement.transactionType')" min-width="160" align="center"><template #default="{ row }"><TransactionTypeDisplay class="settlement-type-label" :value="row.transactionType" :label="enumText('transactionType', row.transactionType)" /></template></el-table-column>
                                <el-table-column :label="t('settlement.resultItemType')" min-width="160" align="center"><template #default="{ row }">{{ enumText('resultItemType', row.resultItemType) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.feeCategory')" min-width="150" align="center"><template #default="{ row }">{{ enumText('feeCategory', row.feeCategory) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.direction')" width="96" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('direction', row.direction)" /></template></el-table-column>
                                <el-table-column :label="t('settlement.sourceAmount')" min-width="180" align="right"><template #default="{ row }"><CurrencyAmountDisplay :amount="row.sourceAmount" :currency="row.sourceCurrency" :exponent="row.sourceCurrencyExponent" :locale="String(locale)" align="end" /></template></el-table-column>
                                <el-table-column :label="t('settlement.targetAmount')" min-width="180" align="right"><template #default="{ row }"><CurrencyAmountDisplay :amount="row.targetAmount" :currency="row.targetCurrency" :exponent="row.targetCurrencyExponent" :locale="String(locale)" align="end" /></template></el-table-column>
                                <el-table-column prop="transactionCount" :label="t('settlement.transactionCount')" width="100" align="center" />
                            </el-table>
                            <el-empty v-else-if="summaryLoaded" :description="t('settlement.summaryEmpty')" :image-size="72" />
                            <div v-show="summaryTotal > 0" class="pagination-container"><el-pagination v-model:current-page="summaryPage" v-model:page-size="summaryPageSize" :total="summaryTotal" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadSummaries" @size-change="resetSummaryPage" /></div>
                        </el-tab-pane>
                        <el-tab-pane v-if="canVoucherPreview" name="voucher" lazy>
                            <template #label><span class="settlement-tab-label"><el-icon><Tickets /></el-icon>{{ t('settlement.voucher') }}</span></template>
                            <div v-if="voucherDocument" class="settlement-voucher-panel">
                                <div class="settlement-voucher-toolbar">
                                    <span>{{ t('settlement.voucherSnapshotNotice') }}</span>
                                    <el-button v-if="canVoucherDownload" type="primary" :icon="Download" :loading="voucherDownloading" @click="downloadVoucher()">{{ t('settlement.downloadVoucher') }}</el-button>
                                </div>
                                <SettlementVoucher :document="voucherDocument" />
                            </div>
                            <el-empty v-else-if="!voucherLoading" :description="t('settlement.voucherEmpty')" />
                        </el-tab-pane>
                        <el-tab-pane v-if="activeBatch && supportsTransactionItems()" name="transactions" lazy>
                            <template #label><span class="settlement-tab-label"><el-icon><Memo /></el-icon>{{ t('settlement.transactionItems') }}</span></template>
                            <div class="settlement-detail__toolbar settlement-detail__toolbar--wrap"><el-input v-model.trim="transactionQuery.merchantOrderNo" clearable :placeholder="t('settlement.merchantOrderNo')" @keyup.enter="searchTransactions" /><el-input v-model.trim="transactionQuery.sourceTransactionId" clearable :placeholder="t('settlement.transactionId')" @keyup.enter="searchTransactions" /><el-date-picker v-model="transactionTimeRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss" clearable :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /><el-button type="primary" :icon="Search" @click="searchTransactions">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="resetTransactions">{{ t('common.reset') }}</el-button><el-button v-if="canExportTransactions" type="warning" plain :icon="Download" :loading="transactionExporting" @click="exportTransactions">{{ t('common.export') }}</el-button></div>
                            <el-table v-loading="transactionLoading" :data="transactionRows" border size="small">
                                <el-table-column prop="sourceTransactionId" :label="t('settlement.transactionId')" min-width="205" fixed="left" align="center"><template #default="{ row }"><el-button link type="primary" @click="openTransaction(row)">{{ row.sourceTransactionId }}</el-button></template></el-table-column>
                                <el-table-column prop="merchantOrderNo" :label="t('settlement.merchantOrderNo')" min-width="190" align="center" show-overflow-tooltip />
                                <el-table-column :label="t('settlement.paymentMethod')" min-width="220" align="center"><template #default="{ row }"><PaymentMethodDisplay :payment-types="dimensionItems('paymentType', row.paymentType)" :payment-methods="dimensionItems('paymentMethod', row.paymentMethod)" /></template></el-table-column>
                                <el-table-column :label="t('settlement.transactionType')" min-width="160" align="center"><template #default="{ row }"><TransactionTypeDisplay class="settlement-type-label" :value="row.transactionType" :label="enumText('transactionType', row.transactionType)" /></template></el-table-column>
                                <el-table-column :label="t('settlement.sourceAmount')" min-width="175" align="right"><template #default="{ row }"><CurrencyAmountDisplay :amount="row.sourceAmount" :currency="row.sourceCurrency" :exponent="row.sourceCurrencyExponent" :locale="String(locale)" align="end" /></template></el-table-column>
                                <el-table-column :label="t('settlement.netAmount')" min-width="210" align="right"><template #default="{ row }"><div class="settlement-net-amount"><DirectionTag :direction="row.netDirection" :label="enumText('direction', row.netDirection)" /><CurrencyAmountDisplay :amount="row.netTargetAmount" :currency="row.targetCurrency" :exponent="row.targetCurrencyExponent" :locale="String(locale)" align="end" emphasized /></div></template></el-table-column>
                                <el-table-column :label="t('settlement.componentCount')" width="112" align="center"><template #default="{ row }"><el-button v-if="canViewTransactionComponent" link type="primary" @click="openComponents(row)">{{ row.componentCount }}</el-button><span v-else>{{ row.componentCount }}</span></template></el-table-column>
                                <el-table-column :label="t('settlement.transactionTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.sourceTransactionDateTime" :source-time-zone="activeBatch.businessTimeZone" /></template></el-table-column>
                            </el-table>
                            <el-empty v-if="!transactionLoading && !transactionRows.length" :description="t('settlement.transactionItemsEmpty')" :image-size="64" />
                            <div v-show="transactionTotal > 0" class="pagination-container"><el-pagination v-model:current-page="transactionQuery.pageNo" v-model:page-size="transactionQuery.pageSize" :total="transactionTotal" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" background @current-change="loadTransactions" @size-change="searchTransactions" /></div>
                        </el-tab-pane>
                        <el-tab-pane v-if="canViewReserves" name="reserves" lazy>
                            <template #label><span class="settlement-tab-label"><el-icon><Lock /></el-icon>{{ t('settlement.reserveItems') }}</span></template>
                            <div class="settlement-detail__toolbar settlement-detail__toolbar--wrap">
                                <el-input v-model.trim="reserveQuery.reserveActionNo" clearable :placeholder="t('settlement.reserveActionNo')" @keyup.enter="searchReserves" />
                                <el-input v-model.trim="reserveQuery.reserveNo" clearable :placeholder="t('settlement.reserveNo')" @keyup.enter="searchReserves" />
                                <el-input v-model.trim="reserveQuery.merchantOrderNo" clearable :placeholder="t('settlement.merchantOrderNo')" @keyup.enter="searchReserves" />
                                <el-input v-model.trim="reserveQuery.sourceTransactionId" clearable :placeholder="t('settlement.transactionId')" @keyup.enter="searchReserves" />
                                <el-select v-model="reserveQuery.reserveStatus" clearable :placeholder="t('settlement.reserveStatusLabel')"><el-option v-for="value in reserveStatuses" :key="value" :label="enumText('reserveStatus', value)" :value="value" /></el-select>
                                <el-select v-model="reserveQuery.actionType" clearable :placeholder="t('settlement.actionTypeLabel')"><el-option v-for="value in reserveActionTypes" :key="value" :label="enumText('actionType', value)" :value="value" /></el-select>
                                <el-input v-model.trim="reserveQuery.currency" clearable maxlength="3" :placeholder="t('settlement.currency')" />
                                <el-date-picker v-model="reserveTransactionTimeRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss" clearable :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" />
                                <el-date-picker v-model="reserveExpectedReleaseDateRange" type="daterange" value-format="YYYY-MM-DD" clearable :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" />
                                <el-button type="primary" :icon="Search" @click="searchReserves">{{ t('common.search') }}</el-button>
                                <el-button :icon="RefreshLeft" @click="resetReserves">{{ t('common.reset') }}</el-button>
                                <el-button v-if="canExportReserves" type="warning" plain :icon="Download" :loading="reserveExporting" @click="exportReserves">{{ t('common.export') }}</el-button>
                            </div>
                            <el-table v-loading="reserveLoading" :data="reserveRows" border size="small">
                                <el-table-column prop="reserveActionNo" :label="t('settlement.reserveActionNo')" min-width="220" fixed="left" align="center" show-overflow-tooltip />
                                <el-table-column prop="reserveNo" :label="t('settlement.reserveNo')" min-width="190" align="center"><template #default="{ row }"><el-button v-if="canViewReserveItem" link type="primary" @click="openReserve(row)">{{ row.reserveNo }}</el-button><span v-else>{{ row.reserveNo }}</span></template></el-table-column>
                                <el-table-column :label="t('settlement.actionTypeLabel')" min-width="140" align="center"><template #default="{ row }">{{ enumText('actionType', row.actionType) }}</template></el-table-column>
                                <el-table-column prop="merchantOrderNo" :label="t('settlement.merchantOrderNo')" min-width="190" align="center" show-overflow-tooltip />
                                <el-table-column prop="sourceTransactionId" :label="t('settlement.transactionId')" min-width="205" align="center"><template #default="{ row }"><el-button v-if="row.sourceTransactionId" link type="primary" @click="openReserveTransaction(row)">{{ row.sourceTransactionId }}</el-button><span v-else>-</span></template></el-table-column>
                                <el-table-column :label="t('settlement.direction')" width="96" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('direction', row.direction)" /></template></el-table-column>
                                <el-table-column :label="t('settlement.amount')" min-width="175" align="right"><template #default="{ row }"><CurrencyAmountDisplay :amount="row.amount" :currency="row.currency" :exponent="row.currencyExponent" :locale="String(locale)" align="end" /></template></el-table-column>
                                <el-table-column :label="t('settlement.remainingAmount')" min-width="180" align="right"><template #default="{ row }"><CurrencyAmountDisplay :amount="row.remainingAmount" :currency="row.currency" :exponent="row.currencyExponent" :locale="String(locale)" align="end" emphasized /></template></el-table-column>
                                <el-table-column :label="t('settlement.reserveStatusLabel')" min-width="130" align="center"><template #default="{ row }">{{ enumText('reserveStatus', row.reserveStatus) }}</template></el-table-column>
                                <el-table-column prop="expectedReleaseDate" :label="t('settlement.expectedReleaseDate')" width="138" align="center" />
                                <el-table-column :label="t('settlement.actionTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.actionTime" :source-time-zone="activeBatch.businessTimeZone" /></template></el-table-column>
                            </el-table>
                            <el-empty v-if="!reserveLoading && !reserveRows.length" :description="t('settlement.reserveItemsEmpty')" :image-size="64" />
                            <div v-show="reserveTotal > 0" class="pagination-container"><el-pagination v-model:current-page="reserveQuery.pageNo" v-model:page-size="reserveQuery.pageSize" :total="reserveTotal" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" background @current-change="loadReserves" @size-change="searchReserves" /></div>
                        </el-tab-pane>
                    </el-tabs>
                </template>
                <el-empty v-else-if="!detailLoading && !summaryLoading && !voucherLoading" :description="t('settlement.detailEmpty')" />
            </div>
        </el-drawer>

        <SettlementTransactionComponents
            v-if="canViewTransactionComponent"
            v-model="componentVisible"
            :transaction="selectedTransaction"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { DataAnalysis, Document, Download, Lock, Memo, RefreshLeft, Search, Tickets, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
    CurrencyAmountDisplay,
    CurrencyDisplay,
    DirectionTag,
    downloadSettlementVoucherPdf,
    formatExchangeRate,
    formatSettlementVoucherAmount,
    formatSettlementVoucherRate,
    PaymentMethodDisplay,
    SettlementVoucher,
    TableRowActions,
    TransactionTypeDisplay,
    type TableRowAction,
    type SettlementVoucherDocument,
    type SettlementVoucherStatusTone,
} from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
    submitSettlementBatchExport,
    submitSettlementReserveExport,
    submitSettlementSummaryExport,
    submitSettlementTransactionExport,
} from '@/api/exportTaskApi';
import {
    getMerchantSettlementBatch, getMerchantSettlementVoucher,
    searchMerchantSettlementBatches, searchMerchantSettlementReserves, searchMerchantSettlementSummaries,
    searchMerchantSettlementTransactions,
    type MerchantSettlementBatch, type MerchantSettlementBatchDetail,
    type MerchantSettlementReserveItem, type MerchantSettlementReserveQuery, type MerchantSettlementSummary,
    type MerchantSettlementBatchQuery, type MerchantSettlementTransaction,
    type MerchantSettlementTransactionQuery,
} from '@/api/settlementApi';
import { systemApi } from '@/api/systemApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    fallbackCardBrandOptions,
    fallbackPaymentMethodOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    mergeTransactionDictOptions,
    type TransactionDictOption,
} from '@/pages/transaction/shared';
import { formatDateTimeFromSourceTimeZone } from '@/utils/format';
import { hasPermission } from '@/utils/permission';
import { defaultSettlementDateRange } from './dateRange';
import SettlementTransactionComponents from './SettlementTransactionComponents.vue';

const props = defineProps<{ reserveOnly?: boolean }>();
const { locale, t, te } = useI18n();
const documentLocale = computed<'zh-CN' | 'en-US'>(() => (
    String(locale.value).toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
));
const route = useRoute();
const router = useRouter();
const batchTypes = props.reserveOnly ? ['RESERVE_RELEASE', 'ADJUSTMENT', 'REVERSAL'] : ['REGULAR', 'REVERSAL'];
const batchPermission = props.reserveOnly ? 'merchant:settlement:reserve-batch' : 'merchant:settlement:batch';
const canList = hasPermission(`${batchPermission}:list`);
const batchStatuses = ['POSTED', 'REVERSED'];
const reserveActionTypes = ['HOLD','RETURN','RELEASE','ADJUSTMENT','REVERSAL_HOLD','REVERSAL_RETURN','REVERSAL_RELEASE','REVERSAL_ADJUSTMENT'];
const reserveStatuses = ['HELD','PARTIALLY_RETURNED','RELEASABLE','FROZEN','RETURNED','RELEASED','DEDUCTED','ADJUSTED','REVERSED'];
const canDetail = hasPermission(`${batchPermission}:detail`);
const canExport = hasPermission(`${batchPermission}:export`);
const canViewSummaries = hasPermission(`${batchPermission}:summary:list`);
const canExportSummaries = hasPermission(`${batchPermission}:summary:export`);
const canVoucherDownload = hasPermission(`${batchPermission}:voucher-download`);
const canVoucherPreview = hasPermission(`${batchPermission}:voucher:view`);
const canViewReserveItem = hasPermission('merchant:settlement:reserve-item:detail');
const canViewTransactionComponent = hasPermission('merchant:settlement:transaction-item:detail');
const canViewTransactions = hasPermission('merchant:settlement:transaction-item:list');
const canExportTransactions = hasPermission('merchant:settlement:transaction-item:export');
const canViewReserves = hasPermission('merchant:settlement:reserve-item:list');
const canExportReserves = hasPermission('merchant:settlement:reserve-item:export');
const showOperationColumn = canDetail || canViewSummaries || canExportSummaries || canVoucherPreview || canVoucherDownload || canViewTransactions || canViewReserves;
const showSearch = ref(true), loading = ref(false), exporting = ref(false);
const rows = ref<MerchantSettlementBatch[]>([]), total = ref(0);
const query = reactive<MerchantSettlementBatchQuery>({ pageNo: 1, pageSize: 10 });
const businessDateRange = ref<[string,string]>(defaultSettlementDateRange());
const detailVisible = ref(false), detailLoading = ref(false);
const detailTab = ref<'overview' | 'summaries' | 'voucher' | 'transactions' | 'reserves'>('overview');
const detail = ref<MerchantSettlementBatchDetail | null>(null);
const selectedBatch = ref<MerchantSettlementBatch | null>(null);
const summaryLoading = ref(false), summaryExporting = ref(false), summaryLoaded = ref(false);
const summaryRows = ref<MerchantSettlementSummary[]>([]), summaryTotal = ref(0);
const summaryPage = ref(1), summaryPageSize = ref(10);
const voucherDetail = ref<MerchantSettlementBatchDetail | null>(null);
const voucherDocument = ref<SettlementVoucherDocument | null>(null);
const voucherLoading = ref(false), voucherDownloading = ref(false);
const activeBatch = computed(() => voucherDetail.value?.batch || detail.value?.batch || selectedBatch.value);
const transactionLoading = ref(false), transactionExporting = ref(false), transactionTotal = ref(0);
const transactionRows = ref<MerchantSettlementTransaction[]>([]);
const transactionQuery = reactive<MerchantSettlementTransactionQuery>({ pageNo: 1, pageSize: 10 });
const transactionTimeRange = ref<[string,string] | []>([]);
const reserveLoading = ref(false), reserveExporting = ref(false), reserveTotal = ref(0);
const reserveRows = ref<MerchantSettlementReserveItem[]>([]);
const reserveQuery = reactive<MerchantSettlementReserveQuery>({ pageNo: 1, pageSize: 10 });
const reserveTransactionTimeRange = ref<[string,string] | []>([]);
const reserveExpectedReleaseDateRange = ref<[string,string] | []>([]);
const componentVisible = ref(false);
const selectedTransaction = ref<MerchantSettlementTransaction | null>(null);
const paymentTypeOptions = ref<TransactionDictOption[]>(fallbackPaymentMethodOptions(t));
const paymentMethodOptions = ref<TransactionDictOption[]>(fallbackCardBrandOptions());
const transactionTypeOptions = ref<TransactionDictOption[]>(fallbackTransactionTypeOptions(t));

onMounted(async () => {
    if (!canList) return;
    const linkedBatchNo = !route.query.reserveNo && !route.query.reserveActionNo && !route.query.sourceTransactionId
        && route.query.view !== 'details' && typeof route.query.settlementBatchNo === 'string'
        ? route.query.settlementBatchNo.trim() : '';
    if (linkedBatchNo) {
        query.settlementBatchNo = linkedBatchNo;
        const linkedBusinessDate = businessDateFromBusinessNo(linkedBatchNo);
        if (linkedBusinessDate) businessDateRange.value = [linkedBusinessDate, linkedBusinessDate];
    }
    await Promise.all([
        loadDimensionDictionaries(),
        systemApi.loadCurrencyPresentations().catch(() => []),
    ]);
    await loadBatches();
    if (linkedBatchNo && showOperationColumn) {
        const linkedRow = rows.value.find((row) => row.settlementBatchNo === linkedBatchNo);
        if (linkedRow) {
            if (canDetail) await openDetail(linkedRow);
            else if (canViewSummaries) await openSummary(linkedRow);
            else if (canVoucherPreview) await openVoucher(linkedRow);
            else if (supportsTransactionItems()) await openTransactions(linkedRow);
            else if (canViewReserves) await openReserves(linkedRow);
        }
    }
});

watch(locale, () => void loadDimensionDictionaries());

function supportsTransactionItems() {
    return canViewTransactions && !props.reserveOnly;
}

function settlementRowActions(): TableRowAction[] {
    return [
        { key: 'detail', label: t('common.detail'), icon: View, visible: canDetail },
        { key: 'summary', label: t('settlement.summary'), icon: DataAnalysis, visible: canViewSummaries },
        { key: 'summaryExport', label: t('settlement.summaryExport'), icon: Download,
            visible: canExportSummaries && !canViewSummaries },
        { key: 'voucher', label: t('settlement.voucher'), icon: Document, visible: canVoucherPreview },
        { key: 'downloadVoucher', label: t('settlement.downloadVoucher'), icon: Download,
            visible: canVoucherDownload && !canVoucherPreview },
        { key: 'transactions', label: t('settlement.transactionItems'), icon: Memo, visible: supportsTransactionItems() },
        { key: 'reserves', label: t('settlement.reserveItems'), icon: Lock, visible: canViewReserves },
    ];
}

function handleSettlementRowAction(action: string, row: MerchantSettlementBatch) {
    if (action === 'detail') void openDetail(row);
    else if (action === 'summary') void openSummary(row);
    else if (action === 'summaryExport') void exportSummaries(row.settlementBatchNo);
    else if (action === 'voucher') void openVoucher(row);
    else if (action === 'downloadVoucher') void downloadVoucher(row.settlementBatchNo);
    else if (action === 'transactions') void openTransactions(row);
    else if (action === 'reserves') void openReserves(row);
}

function batchRequest(): MerchantSettlementBatchQuery {
    return {
        ...query,
        beginBusinessDate: businessDateRange.value[0],
        endBusinessDate: businessDateRange.value[1],
    };
}
async function loadBatches() { if (!canList) return; loading.value = true; try { const result = await searchMerchantSettlementBatches(batchRequest(), props.reserveOnly); rows.value = result.records || []; total.value = result.total || 0; } catch (error) { showError(error); } finally { loading.value = false; } }
function handleSearch() { query.pageNo = 1; loadBatches(); }
function handleReset() { Object.assign(query, { settlementBatchNo: undefined, batchType: undefined, batchStatus: undefined, pageNo: 1 }); businessDateRange.value = defaultSettlementDateRange(); loadBatches(); }
async function handleExport() {
    exporting.value = true;
    try {
        const task = await submitSettlementBatchExport(batchRequest(), props.reserveOnly);
        ElMessage.success(t('exportTask.submitted', { taskNo: task.taskNo }));
    } catch (error) {
        showError(error);
    } finally {
        exporting.value = false;
    }
}
async function openDetail(row: MerchantSettlementBatch) {
    detailVisible.value = true;
    detailLoading.value = true;
    detailTab.value = 'overview';
    selectedBatch.value = row;
    detail.value = null;
    voucherDetail.value = null;
    voucherDocument.value = null;
    resetDetailRows(row.settlementBatchNo);
    try {
        detail.value = await getMerchantSettlementBatch(row.settlementBatchNo, props.reserveOnly);
    } catch (error) {
        showError(error);
    } finally {
        detailLoading.value = false;
    }
}

async function openSummary(row: MerchantSettlementBatch) {
    detailVisible.value = true;
    detailTab.value = 'summaries';
    selectedBatch.value = row;
    detail.value = null;
    voucherDetail.value = null;
    voucherDocument.value = null;
    resetDetailRows(row.settlementBatchNo);
    await loadSummaries();
}

async function openVoucher(row: MerchantSettlementBatch) {
    detailVisible.value = true;
    detailTab.value = 'voucher';
    selectedBatch.value = row;
    detail.value = null;
    voucherDetail.value = null;
    voucherDocument.value = null;
    resetDetailRows(row.settlementBatchNo);
    await loadVoucher(row.settlementBatchNo);
}

async function openTransactions(row: MerchantSettlementBatch) {
    detailVisible.value = true;
    detailTab.value = 'transactions';
    selectedBatch.value = row;
    detail.value = null;
    voucherDetail.value = null;
    voucherDocument.value = null;
    resetDetailRows(row.settlementBatchNo);
    await loadTransactions();
}

async function openReserves(row: MerchantSettlementBatch) {
    detailVisible.value = true;
    detailTab.value = 'reserves';
    selectedBatch.value = row;
    detail.value = null;
    voucherDetail.value = null;
    voucherDocument.value = null;
    resetDetailRows(row.settlementBatchNo);
    await loadReserves();
}

function resetDetailRows(settlementBatchNo: string) {
    summaryRows.value = [];
    summaryTotal.value = 0;
    summaryPage.value = 1;
    summaryLoaded.value = false;
    transactionRows.value = [];
    transactionTotal.value = 0;
    reserveRows.value = [];
    reserveTotal.value = 0;
    transactionTimeRange.value = [];
    reserveTransactionTimeRange.value = [];
    reserveExpectedReleaseDateRange.value = [];
    Object.assign(transactionQuery, { settlementBatchNo, sourceTransactionId: undefined, merchantOrderNo: undefined, pageNo: 1 });
    Object.assign(reserveQuery, { settlementBatchNo, reserveNo: undefined, reserveActionNo: undefined, sourceTransactionId: undefined, merchantOrderNo: undefined, reserveStatus: undefined, actionType: undefined, currency: undefined, pageNo: 1 });
    componentVisible.value = false;
    selectedTransaction.value = null;
}

function handleDetailTabChange(name: string | number) {
    if (name === 'overview' && !detail.value && activeBatch.value?.settlementBatchNo) {
        void loadDetail(activeBatch.value.settlementBatchNo);
    }
    if (name === 'summaries' && !summaryLoaded.value) loadSummaries();
    if (name === 'voucher' && !voucherDocument.value && activeBatch.value?.settlementBatchNo) {
        void loadVoucher(activeBatch.value.settlementBatchNo);
    }
    if (name === 'transactions' && !transactionLoading.value && !transactionRows.value.length) loadTransactions();
    if (name === 'reserves' && !reserveLoading.value && !reserveRows.value.length) loadReserves();
}

async function loadDetail(settlementBatchNo: string) {
    if (!canDetail || detailLoading.value) return;
    detailLoading.value = true;
    try {
        detail.value = await getMerchantSettlementBatch(settlementBatchNo, props.reserveOnly);
    } catch (error) {
        showError(error);
    } finally {
        detailLoading.value = false;
    }
}

async function loadSummaries() {
    const settlementBatchNo = activeBatch.value?.settlementBatchNo;
    if (!settlementBatchNo || summaryLoading.value) return;
    summaryLoading.value = true;
    try {
        const result = await searchMerchantSettlementSummaries(
            settlementBatchNo, summaryPage.value, summaryPageSize.value, props.reserveOnly,
        );
        summaryRows.value = result.records || [];
        summaryTotal.value = result.total || 0;
        summaryLoaded.value = true;
    } catch (error) {
        showError(error);
    } finally {
        summaryLoading.value = false;
    }
}

function resetSummaryPage() {
    summaryPage.value = 1;
    loadSummaries();
}

async function exportSummaries(batchNo?: string) {
    const settlementBatchNo = batchNo || activeBatch.value?.settlementBatchNo;
    if (!canExportSummaries || !settlementBatchNo || summaryExporting.value) return;
    summaryExporting.value = true;
    try {
        const task = await submitSettlementSummaryExport(settlementBatchNo, props.reserveOnly);
        ElMessage.success(t('exportTask.submitted', { taskNo: task.taskNo }));
    } catch (error) {
        showError(error);
    } finally {
        summaryExporting.value = false;
    }
}

async function loadVoucher(settlementBatchNo: string) {
    if (!canVoucherPreview || voucherLoading.value) return;
    voucherLoading.value = true;
    try {
        const result = await getMerchantSettlementVoucher(settlementBatchNo, props.reserveOnly, true);
        voucherDetail.value = result;
        voucherDocument.value = buildSettlementVoucher(result);
    } catch (error) {
        showError(error);
    } finally {
        voucherLoading.value = false;
    }
}

async function downloadVoucher(batchNo?: string) {
    const settlementBatchNo = batchNo || activeBatch.value?.settlementBatchNo;
    if (!canVoucherDownload || !settlementBatchNo || voucherDownloading.value) return;
    voucherDownloading.value = true;
    try {
        const result = await getMerchantSettlementVoucher(settlementBatchNo, props.reserveOnly);
        await downloadSettlementVoucherPdf(buildSettlementVoucher(result));
    } catch (error) {
        showError(error);
    } finally {
        voucherDownloading.value = false;
    }
}
function transactionRequest(): MerchantSettlementTransactionQuery { return { ...transactionQuery, beginTransactionTime: transactionTimeRange.value[0] || undefined, endTransactionTime: transactionTimeRange.value[1] || undefined }; }
async function loadTransactions() { if (!transactionQuery.settlementBatchNo) return; transactionLoading.value = true; try { const result = await searchMerchantSettlementTransactions(transactionRequest()); transactionRows.value = result.records || []; transactionTotal.value = result.total || 0; } catch (error) { showError(error); } finally { transactionLoading.value = false; } }
function searchTransactions() { transactionQuery.pageNo = 1; loadTransactions(); }
function resetTransactions() { Object.assign(transactionQuery, { sourceTransactionId: undefined, merchantOrderNo: undefined, pageNo: 1 }); transactionTimeRange.value = []; loadTransactions(); }
async function exportTransactions() {
    transactionExporting.value = true;
    try {
        const task = await submitSettlementTransactionExport(transactionRequest());
        ElMessage.success(t('exportTask.submitted', { taskNo: task.taskNo }));
    } catch (error) {
        showError(error);
    } finally {
        transactionExporting.value = false;
    }
}
function reserveRequest(): MerchantSettlementReserveQuery { return { ...reserveQuery, currency: reserveQuery.currency?.toUpperCase() || undefined, beginTransactionTime: reserveTransactionTimeRange.value[0] || undefined, endTransactionTime: reserveTransactionTimeRange.value[1] || undefined, beginExpectedReleaseDate: reserveExpectedReleaseDateRange.value[0] || undefined, endExpectedReleaseDate: reserveExpectedReleaseDateRange.value[1] || undefined }; }
async function loadReserves() { if (!reserveQuery.settlementBatchNo) return; reserveLoading.value = true; try { const result = await searchMerchantSettlementReserves(reserveRequest()); reserveRows.value = result.records || []; reserveTotal.value = result.total || 0; } catch (error) { showError(error); } finally { reserveLoading.value = false; } }
function searchReserves() { reserveQuery.pageNo = 1; loadReserves(); }
function resetReserves() { Object.assign(reserveQuery, { reserveNo: undefined, reserveActionNo: undefined, sourceTransactionId: undefined, merchantOrderNo: undefined, reserveStatus: undefined, actionType: undefined, currency: undefined, pageNo: 1 }); reserveTransactionTimeRange.value = []; reserveExpectedReleaseDateRange.value = []; loadReserves(); }
async function exportReserves() {
    reserveExporting.value = true;
    try {
        const task = await submitSettlementReserveExport(reserveRequest());
        ElMessage.success(t('exportTask.submitted', { taskNo: task.taskNo }));
    } catch (error) {
        showError(error);
    } finally {
        reserveExporting.value = false;
    }
}
function openComponents(row: MerchantSettlementTransaction) {
    if (!canViewTransactionComponent) return;
    selectedTransaction.value = row;
    componentVisible.value = true;
}
function openTransaction(row: MerchantSettlementTransaction) {
    router.push({
        path: '/transaction/order',
        query: {
            transactionId: row.sourceTransactionId,
            transactionDateTime: row.sourceTransactionDateTime,
            transactionTimeZone: activeBatch.value?.businessTimeZone || 'Asia/Shanghai',
        },
    });
}
function openReserveTransaction(row: MerchantSettlementReserveItem) {
    router.push({ path: '/transaction/order', query: { transactionId: row.sourceTransactionId, transactionDateTime: row.sourceTransactionDateTime, transactionTimeZone: activeBatch.value?.businessTimeZone || 'Asia/Shanghai' } });
}
function openReserve(row: MerchantSettlementReserveItem) {
    if (!canViewReserveItem) return;
    detailVisible.value = false;
    void router.push({
        path: '/finance/reserves',
        query: { settlementBatchNo: row.settlementBatchNo, reserveNo: row.reserveNo, reserveActionNo: row.reserveActionNo },
    });
}
async function loadDimensionDictionaries() {
    const fallbackPaymentTypes = fallbackPaymentMethodOptions(t);
    const fallbackPaymentMethods = fallbackCardBrandOptions();
    const fallbackTransactionTypes = fallbackTransactionTypeOptions(t);
    paymentTypeOptions.value = fallbackPaymentTypes;
    paymentMethodOptions.value = fallbackPaymentMethods;
    transactionTypeOptions.value = fallbackTransactionTypes;
    const language = String(locale.value || 'zh-CN');
    const [paymentTypes, paymentMethods, transactionTypes] = await Promise.all([
        loadTransactionDictOptions('acquiring_payment_method', language).catch(() => []),
        loadTransactionDictOptions('card_brand', language).catch(() => []),
        loadTransactionDictOptions('transaction_type', language).catch(() => []),
    ]);
    paymentTypeOptions.value = mergeTransactionDictOptions(paymentTypes, fallbackPaymentTypes);
    paymentMethodOptions.value = mergeTransactionDictOptions(paymentMethods, fallbackPaymentMethods);
    transactionTypeOptions.value = mergeTransactionDictOptions(transactionTypes, fallbackTransactionTypes);
}
function enumText(group: string, value?: string) {
    if (!value) return '-';
    const options = group === 'paymentType' ? paymentTypeOptions.value
        : group === 'paymentMethod' ? paymentMethodOptions.value
            : group === 'transactionType' ? transactionTypeOptions.value : [];
    const option = options.find((item) => item.value === value);
    if (option) return option.label;
    const key = `settlement.${group}Value.${value}`;
    return te(key) ? t(key) : value;
}
function dimensionItems(group: string, value?: string) { return value ? [{ value, label: enumText(group, value) }] : []; }
function buildSettlementVoucher(value: MerchantSettlementBatchDetail): SettlementVoucherDocument {
    const batch = value.batch;
    const voucherLocale = documentLocale.value;
    return {
        system: 'merchant',
        locale: voucherLocale,
        title: batch.batchType === 'RESERVE_RELEASE' || batch.batchType === 'ADJUSTMENT'
            ? t('settlement.reserveVoucherTitle')
            : batch.batchType === 'REVERSAL'
                ? t('settlement.reversalVoucherTitle')
                : t('settlement.transactionVoucherTitle'),
        subtitle: t('settlement.formalVoucherSubtitle'),
        referenceLabel: t('settlement.batchNo'),
        referenceNo: batch.settlementBatchNo,
        statusLabel: enumText('batchStatus', batch.batchStatus),
        statusTone: batchVoucherTone(batch.batchStatus),
        netAmountLabel: t('settlement.netAmount'),
        netCurrency: batch.targetCurrency || '',
        netAmount: formatSettlementVoucherAmount(
            batch.netAmount,
            voucherLocale,
            batch.targetCurrencyExponent,
        ),
        fieldGroups: [
            {
                title: t('settlement.voucherMerchantSection'),
                fields: [
                    { label: t('settlement.merchantNo'), value: batch.merchantId || '-' },
                    { label: t('settlement.merchantName'), value: batch.merchantName || '-' },
                    { label: t('settlement.settlementAccount'), value: settlementAccountText(batch) },
                ],
            },
            {
                title: t('settlement.voucherSettlementSection'),
                fields: [
                    { label: t('settlement.batchType'), value: enumText('batchType', batch.batchType) },
                    { label: t('settlement.businessDate'), value: batch.businessDate || '-' },
                    { label: t('settlement.businessTimeZone'), value: batch.businessTimeZone || '-' },
                    {
                        label: t('settlement.settlementCurrency'),
                        value: { cellType: 'currency', currency: batch.targetCurrency, showName: true },
                    },
                ],
            },
            {
                title: t('settlement.voucherStatisticsSection'),
                fields: [
                    { label: t('settlement.transactionCount'), value: String(batch.transactionCount ?? 0) },
                    { label: t('settlement.settlementItemCount'), value: String(batch.candidateCount ?? 0) },
                    { label: t('settlement.postedTime'), value: voucherTime(batch.postedTime, batch.businessTimeZone) },
                ],
            },
        ],
        rates: {
            title: t('settlement.rateMatrix'),
            emptyText: t('settlement.rateMatrixEmpty'),
            columns: [
                { key: 'sourceCurrency', label: t('settlement.sourceCurrency'), width: 18, kind: 'currency' },
                { key: 'targetCurrency', label: t('settlement.settlementCurrency'), width: 18, kind: 'currency' },
                { key: 'directRate', label: t('settlement.directRate'), align: 'right', width: 27 },
                { key: 'rateSource', label: t('settlement.rateSource'), width: 37 },
            ],
            rows: (value.rates || []).map((row) => ({
                sourceCurrency: { cellType: 'currency', currency: row.sourceCurrency, showName: true },
                targetCurrency: { cellType: 'currency', currency: row.targetCurrency, showName: true },
                directRate: formatSettlementVoucherRate(row.directRate, voucherLocale),
                rateSource: enumText('rateSource', row.displaySource),
            })),
        },
        summaries: {
            title: t('settlement.summary'),
            emptyText: t('settlement.summaryEmpty'),
            columns: [
                { key: 'payment', label: t('settlement.paymentMethod'), width: 21, kind: 'payment' },
                { key: 'transactionType', label: t('settlement.transactionType'), width: 13 },
                { key: 'resultItemType', label: t('settlement.resultItemType'), width: 17 },
                { key: 'direction', label: t('settlement.direction'), width: 10, kind: 'direction' },
                { key: 'sourceAmount', label: t('settlement.sourceAmount'), align: 'right', width: 19, kind: 'money' },
                { key: 'targetAmount', label: t('settlement.targetAmount'), align: 'right', width: 20, kind: 'money' },
            ],
            rows: (value.summaries || []).map((row) => ({
                payment: {
                    cellType: 'payment',
                    paymentType: row.paymentType,
                    paymentMethod: row.paymentMethod,
                    paymentTypeLabel: enumText('paymentType', row.paymentType),
                    paymentMethodLabel: enumText('paymentMethod', row.paymentMethod),
                },
                transactionType: enumText('transactionType', row.transactionType),
                resultItemType: summaryItemText(row.resultItemType, row.feeCategory),
                direction: {
                    cellType: 'direction',
                    direction: row.direction,
                    label: enumText('direction', row.direction),
                },
                sourceAmount: {
                    cellType: 'money',
                    currency: row.sourceCurrency,
                    amount: formatSettlementVoucherAmount(row.sourceAmount, voucherLocale, row.sourceCurrencyExponent),
                },
                targetAmount: {
                    cellType: 'money',
                    currency: row.targetCurrency,
                    amount: formatSettlementVoucherAmount(row.targetAmount, voucherLocale, row.targetCurrencyExponent),
                },
            })),
        },
        noticeTitle: t('settlement.voucherNoticeTitle'),
        notice: batch.batchStatus === 'REVERSED'
            ? t('settlement.voucherNoticeReversed')
            : t('settlement.voucherNoticePosted'),
        generatedAtLabel: t('settlement.voucherGeneratedAt'),
        generatedAt: voucherTime(new Date(), batch.businessTimeZone),
        footer: t('settlement.voucherFooter'),
        fileName: `Vexra-${batch.settlementBatchNo}.pdf`,
    };
}
function settlementAccountText(batch: MerchantSettlementBatch) {
    return batch.settlementAccountNo || t('settlement.settlementAccountUnavailable');
}
function summaryItemText(resultItemType?: string, feeCategory?: string) {
    if (feeCategory && feeCategory !== 'NONE') return enumText('feeCategory', feeCategory);
    return enumText('resultItemType', resultItemType);
}
function voucherTime(value?: string | number | Date, businessTimeZone?: string) {
    return formatDateTimeFromSourceTimeZone(value, businessTimeZone, businessTimeZone);
}
function batchVoucherTone(status?: string): SettlementVoucherStatusTone {
    return status === 'POSTED' ? 'success' : status === 'REVERSED' ? 'info' : 'warning';
}
function rate(value?: string | number | null) { return formatExchangeRate(value, String(locale.value)); }
function statusType(value?: string) { if (value === 'POSTED') return 'success'; if (['FAILED_RETRYABLE','MANUAL_REVIEW'].includes(value || '')) return 'danger'; if (['CANCELLED','REVERSED'].includes(value || '')) return 'info'; return 'warning'; }
function businessDateFromBusinessNo(value?: string) { const match = /^[A-Z]{2}(\d{4})(\d{2})(\d{2})-/.exec(value || ''); return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined; }
function showError(error: unknown, fallbackKey = 'common.loadFailed') { ElMessage.error((error as { friendlyMessage?: string })?.friendlyMessage || (error instanceof Error ? error.message : t(fallbackKey))); }
</script>

<style scoped>
.settlement-type-label :deep(.transaction-type-display__text) { white-space: normal; word-break: normal; }
.settlement-detail__identity { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 0 14px; border-left: 3px solid #287d8e; background: #f6f9fb; }
.settlement-detail__identity strong { overflow-wrap: anywhere; color: #1d2939; }
.settlement-detail__tabs { margin-top: 14px; }
.settlement-detail__tab-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.settlement-detail__tab-head > div { display: grid; gap: 4px; }
.settlement-detail__tab-head strong { color: #1d2939; font-size: 14px; }
.settlement-detail__tab-head span { color: #667085; font-size: 12px; line-height: 1.5; }
.settlement-detail__section { margin-top: 22px; }
.settlement-detail__section h3 { margin: 0 0 10px; color: #344054; font-size: 14px; }
.settlement-detail__toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.settlement-detail__toolbar :deep(.el-input) { width: min(340px, 50vw); }
.settlement-detail__toolbar--wrap { flex-wrap: wrap; }
.settlement-detail__toolbar--wrap :deep(.el-input), .settlement-detail__toolbar--wrap :deep(.el-select) { width: 210px; }
.settlement-detail__toolbar--wrap :deep(.el-date-editor) { width: 340px; }
.settlement-detail :deep(.payment-method-display) { flex-wrap: nowrap; }
.settlement-detail :deep(.el-descriptions__content) { text-align: center; }
.settlement-net-amount { display: inline-flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; white-space: nowrap; }
.settlement-net-amount strong { margin-left: auto; }
.settlement-voucher-panel { display: grid; gap: 14px; }
.settlement-voucher-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 10px 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; background: var(--el-fill-color-lighter); }
.settlement-voucher-toolbar span { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
@media (max-width: 720px) { .settlement-detail__tab-head, .settlement-detail__toolbar, .settlement-voucher-toolbar { align-items: stretch; flex-direction: column; } .settlement-detail__toolbar :deep(.el-input), .settlement-detail__toolbar--wrap :deep(.el-select), .settlement-detail__toolbar--wrap :deep(.el-date-editor) { width: 100%; } }
</style>

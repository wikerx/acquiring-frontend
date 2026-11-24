<template>
  <section class="transaction-finance-detail">
    <h3 class="transaction-finance-detail__title">{{ t('transaction.order.financeTitle') }}</h3>
    <el-tabs
      v-model="activeTab"
      class="transaction-finance-detail__tabs settlement-navigation-tabs"
    >
      <el-tab-pane v-if="canViewClearing" name="clearing">
        <template #label
          ><span class="settlement-tab-label"
            ><el-icon><DataAnalysis /></el-icon>{{ t('transaction.order.clearingDetails') }}</span
          ></template
        >
        <div v-loading="clearingLoading" class="transaction-finance-detail__panel">
          <div v-if="clearingError" class="transaction-finance-detail__error">
            <el-alert
              type="error"
              :closable="false"
              show-icon
              :title="t('transaction.order.financeLoadFailed')"
            />
            <el-button :icon="Refresh" @click="loadClearing(true)">{{
              t('common.refresh')
            }}</el-button>
          </div>
          <template v-else-if="clearingDetail?.summary">
            <div class="transaction-finance-detail__summary">
              <div>
                <span>{{ t('transaction.order.clearingStatus') }}</span>
                <div
                  class="transaction-finance-detail__status"
                  :class="`is-${clearingStatusPresentation.tone}`"
                >
                  <el-icon><component :is="clearingStatusPresentation.icon" /></el-icon>
                  <span>{{ clearingStatusText(clearingDetail.summary.clearingStatus) }}</span>
                </div>
              </div>
              <div>
                <span>{{ t('transaction.order.transactionType') }}</span>
                <TransactionTypeDisplay
                  :value="clearingDetail.summary.transactionType"
                  :label="tagText(transactionTypeOptions, clearingDetail.summary.transactionType)"
                  align="start"
                />
              </div>
              <div>
                <span>{{ t('transaction.order.settlementStatus') }}</span>
                <strong><TransactionStageStatusDisplay domain="settlement" :value="clearingDetail.summary.settlementStatus" :label="statusText(clearingDetail.summary.settlementStatus)" /></strong>
              </div>
              <div class="is-money">
                <span>{{ t('transaction.order.transactionLabelAmount') }}</span>
                <CurrencyAmountDisplay :amount="clearingDetail.summary.labelAmount" :currency="clearingDetail.summary.labelCurrency" :locale="String(locale)" emphasized />
              </div>
              <div class="is-money">
                <span>{{ t('transaction.order.grossAmount') }}</span>
                <CurrencyAmountDisplay :amount="clearingDetail.summary.grossLabelAmount" :currency="clearingDetail.summary.labelCurrency" :locale="String(locale)" emphasized />
              </div>
              <div class="is-money">
                <span>{{ t('transaction.order.platformFee') }}</span>
                <CurrencyAmountDisplay :amount="clearingDetail.summary.platformFeeAmount" :currency="clearingDetail.summary.labelCurrency" :locale="String(locale)" emphasized />
              </div>
              <div class="is-money">
                <span>{{ t('transaction.order.reserveAmount') }}</span>
                <CurrencyAmountDisplay :amount="clearingDetail.summary.reserveAmount" :currency="clearingDetail.summary.labelCurrency" :locale="String(locale)" emphasized />
              </div>
              <div>
                <span>{{ t('transaction.order.settlementEligibleDate') }}</span>
                <strong>{{ clearingDetail.summary.settlementEligibleDate || '-' }}</strong>
              </div>
              <div>
                <span>{{ t('settlement.transactionTime') }}</span>
                <strong
                  ><BaseDateTime
                    :value="clearingDetail.summary.transactionDateTime"
                    source-time-zone="Asia/Shanghai"
                    :display-time-zone="displayTimeZone"
                /></strong>
              </div>
            </div>

            <section class="transaction-finance-detail__section">
              <div class="transaction-finance-detail__heading">
                <strong>{{ t('transaction.order.transactionClearingItems') }}</strong>
                <el-tag size="small" effect="plain">{{ clearingTransactionTotal }}</el-tag>
              </div>
              <div v-if="clearingTransactionError" class="transaction-finance-detail__error">
                <el-alert type="error" :closable="false" show-icon :title="t('transaction.order.clearingTransactionLoadFailed')" />
                <el-button :icon="Refresh" @click="loadClearingTransactions">{{ t('common.refresh') }}</el-button>
              </div>
              <el-table
                v-else
                v-loading="clearingTransactionLoading"
                :data="clearingTransactionRows"
                row-key="clearingDetailNo"
                border
                stripe
                size="small"
                class="transaction-finance-detail__table"
              >
                <el-table-column
                  prop="lineNo"
                  :label="t('transaction.order.lineNo')"
                  width="72"
                  align="center"
                />
                <el-table-column
                  :label="t('transaction.order.clearingItem')"
                  min-width="176"
                  align="left"
                >
                  <template #default="{ row }">{{
                    clearingItemText(row.itemName, row.itemCode, row.itemType)
                  }}</template>
                </el-table-column>
                <el-table-column :label="t('settlement.feeCategory')" min-width="136" align="left">
                  <template #default="{ row }">{{
                    enumText('feeCategory', row.feeCategory)
                  }}</template>
                </el-table-column>
                <el-table-column :label="t('settlement.direction')" width="92" align="center">
                  <template #default="{ row }"
                    ><DirectionTag
                      :direction="row.direction"
                      :label="enumText('direction', row.direction)"
                  /></template>
                </el-table-column>
                <el-table-column
                  :label="t('transaction.order.calculationBasis')"
                  min-width="142"
                  align="right"
                >
                  <template #default="{ row }"><CurrencyAmountDisplay :amount="row.basisAmount" :currency="row.basisCurrency" :locale="String(locale)" align="end" /></template>
                </el-table-column>
                <el-table-column
                  :label="t('transaction.order.clearingAmount')"
                  min-width="142"
                  align="right"
                >
                  <template #default="{ row }"><CurrencyAmountDisplay :amount="row.amount" :currency="row.currency" :exponent="row.currencyExponent" :locale="String(locale)" align="end" emphasized /></template>
                </el-table-column>
                <el-table-column
                  :label="t('transaction.order.recordStatus')"
                  width="112"
                  align="center"
                >
                  <template #default="{ row }">{{ recordStatusText(row.recordStatus) }}</template>
                </el-table-column>
              </el-table>
              <div v-if="clearingTransactionTotal > 0" class="transaction-finance-detail__pagination">
                <el-pagination
                  v-model:current-page="clearingTransactionPage"
                  v-model:page-size="clearingTransactionPageSize"
                  :total="clearingTransactionTotal"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next"
                  background
                  @current-change="loadClearingTransactions"
                  @size-change="resetClearingTransactionPage"
                />
              </div>
            </section>

            <section class="transaction-finance-detail__section">
              <div class="transaction-finance-detail__heading">
                <strong>{{ t('transaction.order.reserveClearingItems') }}</strong>
                <el-tag size="small" type="warning" effect="plain">{{ clearingReserveTotal }}</el-tag>
              </div>
              <div v-if="clearingReserveError" class="transaction-finance-detail__error">
                <el-alert type="error" :closable="false" show-icon :title="t('transaction.order.clearingReserveLoadFailed')" />
                <el-button :icon="Refresh" @click="loadClearingReserves">{{ t('common.refresh') }}</el-button>
              </div>
              <el-table
                v-else
                v-loading="clearingReserveLoading"
                :data="clearingReserveRows"
                row-key="reserveClearingDetailNo"
                border
                stripe
                size="small"
                class="transaction-finance-detail__table"
              >
                <el-table-column
                  prop="lineNo"
                  :label="t('transaction.order.lineNo')"
                  width="72"
                  align="center"
                />
                <el-table-column
                  :label="t('settlement.actionTypeLabel')"
                  min-width="136"
                  align="center"
                >
                  <template #default="{ row }">{{
                    enumText('actionType', row.reserveActionType)
                  }}</template>
                </el-table-column>
                <el-table-column
                  :label="t('settlement.retainedAmount')"
                  min-width="138"
                  align="right"
                >
                  <template #default="{ row }"><CurrencyAmountDisplay :amount="row.retainedAmount" :currency="row.reserveCurrency" :exponent="row.reserveCurrencyExponent" :locale="String(locale)" align="end" /></template>
                </el-table-column>
                <el-table-column
                  :label="t('settlement.returnedAmount')"
                  min-width="138"
                  align="right"
                >
                  <template #default="{ row }"><CurrencyAmountDisplay :amount="row.returnedAmount" :currency="row.reserveCurrency" :exponent="row.reserveCurrencyExponent" :locale="String(locale)" align="end" /></template>
                </el-table-column>
                <el-table-column
                  :label="t('settlement.releasedAmount')"
                  min-width="138"
                  align="right"
                >
                  <template #default="{ row }"><CurrencyAmountDisplay :amount="row.releasedAmount" :currency="row.reserveCurrency" :exponent="row.reserveCurrencyExponent" :locale="String(locale)" align="end" /></template>
                </el-table-column>
                <el-table-column
                  :label="t('settlement.remainingAmount')"
                  min-width="148"
                  align="right"
                >
                  <template #default="{ row }"><CurrencyAmountDisplay :amount="row.remainingAmount" :currency="row.reserveCurrency" :exponent="row.reserveCurrencyExponent" :locale="String(locale)" align="end" emphasized /></template>
                </el-table-column>
                <el-table-column
                  prop="expectedReserveReleaseDate"
                  :label="t('settlement.expectedReleaseDate')"
                  width="138"
                  align="center"
                />
                <el-table-column
                  :label="t('transaction.order.recordStatus')"
                  width="112"
                  align="center"
                >
                  <template #default="{ row }">{{ recordStatusText(row.recordStatus) }}</template>
                </el-table-column>
              </el-table>
              <div v-if="clearingReserveTotal > 0" class="transaction-finance-detail__pagination">
                <el-pagination
                  v-model:current-page="clearingReservePage"
                  v-model:page-size="clearingReservePageSize"
                  :total="clearingReserveTotal"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next"
                  background
                  @current-change="loadClearingReserves"
                  @size-change="resetClearingReservePage"
                />
              </div>
            </section>
          </template>
          <el-empty
            v-else-if="clearingLoaded && !clearingLoading"
            :description="t('transaction.order.clearingEmpty')"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane v-if="canViewReconciliation" name="reconciliation">
        <template #label
          ><span class="settlement-tab-label"
            ><el-icon><Collection /></el-icon
            >{{ t('transaction.order.reconciliationDetails') }}</span
          ></template
        >
        <div v-loading="reconciliationLoading" class="transaction-finance-detail__panel">
          <div v-if="reconciliationError" class="transaction-finance-detail__error">
            <el-alert
              type="error"
              :closable="false"
              show-icon
              :title="t('transaction.order.financeLoadFailed')"
            />
            <el-button :icon="Refresh" @click="loadReconciliation(true)">{{
              t('common.refresh')
            }}</el-button>
          </div>
          <template v-else-if="reconciliationRows.length">
            <el-table
              :data="reconciliationRows"
              row-key="transactionId"
              border
              stripe
              size="small"
              class="transaction-finance-detail__table"
            >
              <el-table-column
                prop="transactionId"
                :label="t('settlement.transactionId')"
                min-width="220"
                fixed="left"
                align="left"
                show-overflow-tooltip
              />
              <el-table-column
                prop="merchantOrderNo"
                :label="t('transaction.order.merchantOrderNo')"
                min-width="190"
                align="left"
                show-overflow-tooltip
              />
              <el-table-column
                :label="t('transaction.order.transactionType')"
                min-width="126"
                align="center"
              >
                <template #default="{ row }">
                  <TransactionTypeDisplay
                    :value="row.transactionType"
                    :label="tagText(transactionTypeOptions, row.transactionType)"
                  />
                </template>
              </el-table-column>
              <el-table-column
                :label="t('transaction.order.reconciliationStatus')"
                min-width="126"
                align="center"
              >
                <template #default="{ row }">
                  <TransactionStageStatusDisplay domain="reconciliation" :value="row.reconciliationStatus" :label="statusText(row.reconciliationStatus)" />
                </template>
              </el-table-column>
              <el-table-column
                :label="t('transaction.order.settlementStatus')"
                min-width="126"
                align="center"
              >
                <template #default="{ row }">
                  <TransactionStageStatusDisplay domain="settlement" :value="row.settlementStatus" :label="statusText(row.settlementStatus)" />
                </template>
              </el-table-column>
              <el-table-column
                :label="t('transaction.order.accountingStatus')"
                min-width="126"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag
                    size="small"
                    :type="processingStatusType(row.accountingStatus)"
                    effect="plain"
                    >{{ statusText(row.accountingStatus) }}</el-tag
                  >
                </template>
              </el-table-column>
              <el-table-column
                :label="t('settlement.transactionTime')"
                min-width="174"
                align="center"
              >
                <template #default="{ row }">
                  <BaseDateTime
                    :value="row.transactionDateTime"
                    source-time-zone="Asia/Shanghai"
                    :display-time-zone="displayTimeZone"
                  />
                </template>
              </el-table-column>
              <el-table-column
                :label="t('transaction.order.operationTime')"
                min-width="174"
                align="center"
              >
                <template #default="{ row }">
                  <BaseDateTime
                    :value="row.operationTime"
                    source-time-zone="Asia/Shanghai"
                    :display-time-zone="displayTimeZone"
                  />
                </template>
              </el-table-column>
            </el-table>
          </template>
          <el-empty
            v-else-if="reconciliationLoaded && !reconciliationLoading"
            :description="t('transaction.order.reconciliationEmpty')"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane v-if="canViewSettlement" name="settlement">
        <template #label
          ><span class="settlement-tab-label"
            ><el-icon><Memo /></el-icon>{{ t('settlement.transactionItems') }}</span
          ></template
        >
        <div v-loading="settlementLoading" class="transaction-finance-detail__panel">
          <div v-if="settlementError" class="transaction-finance-detail__error">
            <el-alert
              type="error"
              :closable="false"
              show-icon
              :title="t('transaction.order.financeLoadFailed')"
            />
            <el-button :icon="Refresh" @click="loadSettlement(true)">{{
              t('common.refresh')
            }}</el-button>
          </div>
          <template v-else-if="settlementRows.length">
            <el-table
              :data="settlementRows"
              row-key="settlementResultItemNo"
              border
              stripe
              size="small"
              class="transaction-finance-detail__table"
            >
              <el-table-column
                :label="t('transaction.order.settlementItem')"
                min-width="156"
                align="left"
              >
                <template #default="{ row }">
                  <strong class="transaction-finance-detail__item">{{
                    settlementItemText(row)
                  }}</strong>
                </template>
              </el-table-column>
              <el-table-column :label="t('settlement.direction')" width="92" align="center">
                <template #default="{ row }">
                  <DirectionTag
                    :direction="row.direction"
                    :label="enumText('direction', row.direction)"
                  />
                </template>
              </el-table-column>
              <el-table-column :label="t('settlement.sourceAmount')" min-width="138" align="right">
                <template #default="{ row }"><CurrencyAmountDisplay :amount="row.sourceAmount" :currency="row.sourceCurrency" :exponent="row.sourceCurrencyExponent" :locale="String(locale)" align="end" /></template>
              </el-table-column>
              <el-table-column :label="t('settlement.targetAmount')" min-width="148" align="right">
                <template #default="{ row }"><CurrencyAmountDisplay :amount="row.targetAmount" :currency="row.targetCurrency" :exponent="row.targetCurrencyExponent" :locale="String(locale)" align="end" emphasized /></template>
              </el-table-column>
              <el-table-column :label="t('settlement.batchNo')" min-width="205" align="left">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openBatch(row.settlementBatchNo)">{{
                    row.settlementBatchNo
                  }}</el-button>
                </template>
              </el-table-column>
              <el-table-column
                prop="businessDate"
                :label="t('settlement.businessDate')"
                width="118"
                align="center"
              />
            </el-table>
            <div v-show="settlementTotal > 0" class="transaction-finance-detail__pagination">
              <el-pagination
                v-model:current-page="settlementPage"
                v-model:page-size="settlementPageSize"
                :total="settlementTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next"
                background
                @current-change="handleSettlementPageChange"
                @size-change="resetSettlementPage"
              />
            </div>
          </template>
          <el-empty
            v-else-if="settlementLoaded && !settlementLoading"
            :description="t('transaction.order.settlementEmpty')"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane v-if="canViewReserve" name="reserve">
        <template #label
          ><span class="settlement-tab-label"
            ><el-icon><Lock /></el-icon>{{ t('settlement.reserveItems') }}</span
          ></template
        >
        <div v-loading="reserveLoading" class="transaction-finance-detail__panel">
          <div v-if="reserveError" class="transaction-finance-detail__error">
            <el-alert
              type="error"
              :closable="false"
              show-icon
              :title="t('transaction.order.financeLoadFailed')"
            />
            <el-button :icon="Refresh" @click="loadReserve(true)">{{
              t('common.refresh')
            }}</el-button>
          </div>
          <template v-else-if="reserveRows.length">
            <el-table
              :data="reserveRows"
              row-key="reserveActionNo"
              border
              stripe
              size="small"
              class="transaction-finance-detail__table"
            >
              <el-table-column
                :label="t('settlement.actionTypeLabel')"
                min-width="126"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag effect="plain">{{ enumText('actionType', row.actionType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="reserveActionNo"
                :label="t('settlement.reserveActionNo')"
                min-width="210"
                align="left"
                show-overflow-tooltip
              />
              <el-table-column :label="t('settlement.amount')" min-width="138" align="right">
                <template #default="{ row }"><CurrencyAmountDisplay :amount="row.amount" :currency="row.currency" :exponent="row.currencyExponent" :locale="String(locale)" align="end" /></template>
              </el-table-column>
              <el-table-column
                :label="t('settlement.remainingAmount')"
                min-width="148"
                align="right"
              >
                <template #default="{ row }"><CurrencyAmountDisplay :amount="row.remainingAmount" :currency="row.currency" :exponent="row.currencyExponent" :locale="String(locale)" align="end" emphasized /></template>
              </el-table-column>
              <el-table-column
                :label="t('settlement.reserveStatusLabel')"
                min-width="126"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag :type="reserveStatusType(row.reserveStatus)" effect="plain">{{
                    enumText('reserveStatus', row.reserveStatus)
                  }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="t('settlement.reserveNo')" min-width="190" align="left">
                <template #default="{ row }">
                  <el-button v-if="canOpenReserveItem" link type="primary" @click="openReserve(row)">{{
                    row.reserveNo
                  }}</el-button><span v-else>{{ row.reserveNo }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="t('settlement.batchNo')" min-width="205" align="left">
                <template #default="{ row }">
                  <el-button
                    v-if="row.settlementBatchNo"
                    link
                    type="primary"
                    @click="openBatch(row.settlementBatchNo)"
                    >{{ row.settlementBatchNo }}</el-button
                  >
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="expectedReleaseDate"
                :label="t('settlement.expectedReleaseDate')"
                width="138"
                align="center"
              />
              <el-table-column :label="t('settlement.actionTime')" min-width="174" align="center">
                <template #default="{ row }">
                  <BaseDateTime
                    :value="row.actionTime"
                    source-time-zone="Asia/Shanghai"
                    :display-time-zone="displayTimeZone"
                  />
                </template>
              </el-table-column>
            </el-table>
            <div v-show="reserveTotal > 0" class="transaction-finance-detail__pagination">
              <el-pagination
                v-model:current-page="reservePage"
                v-model:page-size="reservePageSize"
                :total="reserveTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next"
                background
                @current-change="handleReservePageChange"
                @size-change="resetReservePage"
              />
            </div>
          </template>
          <el-empty
            v-else-if="reserveLoaded && !reserveLoading"
            :description="t('transaction.order.reserveEmpty')"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<script setup lang="ts">
  import { hasPermission } from '@/utils/permission';
  import { computed, ref, watch } from 'vue';
  import {
    CircleCheck,
    CircleClose,
    Clock,
    Collection,
    DataAnalysis,
    Lock,
    Memo,
    Minus,
    Refresh,
  } from '@element-plus/icons-vue';
  import { TransactionStageStatusDisplay, CurrencyAmountDisplay, DirectionTag, TransactionTypeDisplay } from '@acquiring/shared';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import {
    getMerchantClearingDetailByTransaction,
    getMerchantSettlementReconciliationRecordsByTransaction,
    searchMerchantClearingReserveLinesByTransaction,
    searchMerchantClearingTransactionLinesByTransaction,
    searchMerchantSettlementReservesByTransaction,
    searchMerchantSettlementTransactionsByTransaction,
    type MerchantClearingDetail,
    type MerchantClearingReserveLine,
    type MerchantClearingTransactionLine,
    type MerchantSettlementReconciliationRecord,
    type MerchantSettlementReserveItem,
    type MerchantSettlementTransactionItem,
  } from '@/api/settlementApi';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import { tagText, type TransactionDictOption } from '../shared';

  const props = defineProps<{
    transactionId: string;
    transactionDateTime: string;
    displayTimeZone?: string;
    canViewClearing: boolean;
    canViewReconciliation: boolean;
    canViewSettlement: boolean;
    canViewReserve: boolean;
    transactionTypeOptions: TransactionDictOption[];
  }>();

  const { locale, t, te } = useI18n();
  const router = useRouter();
  const activeTab = ref<'clearing' | 'reconciliation' | 'settlement' | 'reserve'>('clearing');
  const clearingLoading = ref(false);
  const clearingLoaded = ref(false);
  const clearingError = ref(false);
  const clearingDetail = ref<MerchantClearingDetail | null>(null);
  const clearingTransactionLoading = ref(false);
  const clearingTransactionError = ref(false);
  const clearingTransactionRows = ref<MerchantClearingTransactionLine[]>([]);
  const clearingTransactionTotal = ref(0);
  const clearingTransactionPage = ref(1);
  const clearingTransactionPageSize = ref(10);
  const clearingReserveLoading = ref(false);
  const clearingReserveError = ref(false);
  const clearingReserveRows = ref<MerchantClearingReserveLine[]>([]);
  const clearingReserveTotal = ref(0);
  const clearingReservePage = ref(1);
  const clearingReservePageSize = ref(10);
  const reconciliationLoading = ref(false);
  const reconciliationLoaded = ref(false);
  const reconciliationError = ref(false);
  const reconciliationRows = ref<MerchantSettlementReconciliationRecord[]>([]);
  const settlementLoading = ref(false);
  const settlementLoaded = ref(false);
  const settlementError = ref(false);
  const settlementRows = ref<MerchantSettlementTransactionItem[]>([]);
  const settlementTotal = ref(0);
  const settlementPage = ref(1);
  const settlementPageSize = ref(10);
  const reserveLoading = ref(false);
  const reserveLoaded = ref(false);
  const reserveError = ref(false);
  const reserveRows = ref<MerchantSettlementReserveItem[]>([]);
  const reserveTotal = ref(0);
  const reservePage = ref(1);
  const reservePageSize = ref(10);
  const identityKey = computed(() => `${props.transactionId}|${props.transactionDateTime}`);
  const clearingStatusPresentation = computed(() => {
    const status = String(clearingDetail.value?.summary?.clearingStatus || '').toUpperCase();
    if (status === 'CLEARED') return { tone: 'success', icon: CircleCheck };
    if (status === 'FAILED') return { tone: 'danger', icon: CircleClose };
    if (['PENDING', 'PROCESSING', 'WAITING_SOURCE', 'MANUAL_REVIEW'].includes(status)) {
      return { tone: 'warning', icon: Clock };
    }
    return { tone: 'neutral', icon: Minus };
  });
  let stateVersion = 0;
  let clearingTransactionRequestId = 0;
  let clearingReserveRequestId = 0;

  watch(
    [
      identityKey,
      () => props.canViewClearing,
      () => props.canViewReconciliation,
      () => props.canViewSettlement,
      () => props.canViewReserve,
    ],
    () => {
      resetState();
      ensureActiveTabLoaded();
    },
    { immediate: true },
  );

  watch(activeTab, ensureActiveTabLoaded);

  function resetState() {
    stateVersion += 1;
    clearingTransactionRequestId += 1;
    clearingReserveRequestId += 1;
    activeTab.value = props.canViewClearing
      ? 'clearing'
      : props.canViewReconciliation
        ? 'reconciliation'
        : props.canViewSettlement
          ? 'settlement'
          : 'reserve';
    clearingLoading.value = false;
    clearingLoaded.value = false;
    clearingError.value = false;
    clearingDetail.value = null;
    clearingTransactionLoading.value = false;
    clearingTransactionError.value = false;
    clearingTransactionRows.value = [];
    clearingTransactionTotal.value = 0;
    clearingTransactionPage.value = 1;
    clearingReserveLoading.value = false;
    clearingReserveError.value = false;
    clearingReserveRows.value = [];
    clearingReserveTotal.value = 0;
    clearingReservePage.value = 1;
    reconciliationLoading.value = false;
    reconciliationLoaded.value = false;
    reconciliationError.value = false;
    reconciliationRows.value = [];
    settlementLoading.value = false;
    settlementLoaded.value = false;
    settlementError.value = false;
    settlementRows.value = [];
    settlementTotal.value = 0;
    settlementPage.value = 1;
    reserveLoading.value = false;
    reserveLoaded.value = false;
    reserveError.value = false;
    reserveRows.value = [];
    reserveTotal.value = 0;
    reservePage.value = 1;
  }

  function ensureActiveTabLoaded() {
    if (!props.transactionId || !props.transactionDateTime) return;
    if (activeTab.value === 'clearing') void loadClearing();
    if (activeTab.value === 'reconciliation') void loadReconciliation();
    if (activeTab.value === 'settlement') void loadSettlement();
    if (activeTab.value === 'reserve') void loadReserve();
  }

  async function loadClearing(force = false) {
    if (!props.canViewClearing || clearingLoading.value || (clearingLoaded.value && !force)) return;
    const requestVersion = stateVersion;
    clearingLoading.value = true;
    clearingError.value = false;
    try {
      const result = await getMerchantClearingDetailByTransaction(
        props.transactionId,
        props.transactionDateTime,
      );
      if (requestVersion !== stateVersion) return;
      clearingDetail.value = result;
      clearingLoaded.value = true;
      if (result?.summary) {
        void Promise.all([loadClearingTransactions(), loadClearingReserves()]);
      }
    } catch {
      if (requestVersion !== stateVersion) return;
      clearingDetail.value = null;
      clearingLoaded.value = true;
      clearingError.value = true;
    } finally {
      if (requestVersion === stateVersion) clearingLoading.value = false;
    }
  }

  async function loadClearingTransactions() {
    if (!props.canViewClearing) return;
    const requestVersion = stateVersion;
    const requestId = ++clearingTransactionRequestId;
    clearingTransactionLoading.value = true;
    clearingTransactionError.value = false;
    try {
      const result = await searchMerchantClearingTransactionLinesByTransaction(
        props.transactionId,
        props.transactionDateTime,
        clearingTransactionPage.value,
        clearingTransactionPageSize.value,
      );
      if (requestVersion !== stateVersion || requestId !== clearingTransactionRequestId) return;
      clearingTransactionRows.value = result.records || [];
      clearingTransactionTotal.value = result.total || 0;
    } catch {
      if (requestVersion !== stateVersion || requestId !== clearingTransactionRequestId) return;
      clearingTransactionRows.value = [];
      clearingTransactionTotal.value = 0;
      clearingTransactionError.value = true;
    } finally {
      if (requestVersion === stateVersion && requestId === clearingTransactionRequestId) {
        clearingTransactionLoading.value = false;
      }
    }
  }

  async function loadClearingReserves() {
    if (!props.canViewClearing) return;
    const requestVersion = stateVersion;
    const requestId = ++clearingReserveRequestId;
    clearingReserveLoading.value = true;
    clearingReserveError.value = false;
    try {
      const result = await searchMerchantClearingReserveLinesByTransaction(
        props.transactionId,
        props.transactionDateTime,
        clearingReservePage.value,
        clearingReservePageSize.value,
      );
      if (requestVersion !== stateVersion || requestId !== clearingReserveRequestId) return;
      clearingReserveRows.value = result.records || [];
      clearingReserveTotal.value = result.total || 0;
    } catch {
      if (requestVersion !== stateVersion || requestId !== clearingReserveRequestId) return;
      clearingReserveRows.value = [];
      clearingReserveTotal.value = 0;
      clearingReserveError.value = true;
    } finally {
      if (requestVersion === stateVersion && requestId === clearingReserveRequestId) {
        clearingReserveLoading.value = false;
      }
    }
  }

  function resetClearingTransactionPage() {
    clearingTransactionPage.value = 1;
    void loadClearingTransactions();
  }

  function resetClearingReservePage() {
    clearingReservePage.value = 1;
    void loadClearingReserves();
  }

  async function loadReconciliation(force = false) {
    if (
      !props.canViewReconciliation ||
      reconciliationLoading.value ||
      (reconciliationLoaded.value && !force)
    )
      return;
    const requestVersion = stateVersion;
    reconciliationLoading.value = true;
    reconciliationError.value = false;
    try {
      const result = await getMerchantSettlementReconciliationRecordsByTransaction(
        props.transactionId,
        props.transactionDateTime,
      );
      if (requestVersion !== stateVersion) return;
      reconciliationRows.value = result || [];
      reconciliationLoaded.value = true;
    } catch {
      if (requestVersion !== stateVersion) return;
      reconciliationRows.value = [];
      reconciliationLoaded.value = true;
      reconciliationError.value = true;
    } finally {
      if (requestVersion === stateVersion) reconciliationLoading.value = false;
    }
  }

  async function loadSettlement(force = false) {
    if (!props.canViewSettlement || settlementLoading.value || (settlementLoaded.value && !force))
      return;
    const requestVersion = stateVersion;
    settlementLoading.value = true;
    settlementError.value = false;
    try {
      const result = await searchMerchantSettlementTransactionsByTransaction(
        props.transactionId,
        props.transactionDateTime,
        settlementPage.value,
        settlementPageSize.value,
      );
      if (requestVersion !== stateVersion) return;
      settlementRows.value = result.records || [];
      settlementTotal.value = result.total || 0;
      settlementLoaded.value = true;
    } catch {
      if (requestVersion !== stateVersion) return;
      settlementRows.value = [];
      settlementTotal.value = 0;
      settlementLoaded.value = true;
      settlementError.value = true;
    } finally {
      if (requestVersion === stateVersion) settlementLoading.value = false;
    }
  }

  async function loadReserve(force = false) {
    if (!props.canViewReserve || reserveLoading.value || (reserveLoaded.value && !force)) return;
    const requestVersion = stateVersion;
    reserveLoading.value = true;
    reserveError.value = false;
    try {
      const result = await searchMerchantSettlementReservesByTransaction(
        props.transactionId,
        props.transactionDateTime,
        reservePage.value,
        reservePageSize.value,
      );
      if (requestVersion !== stateVersion) return;
      reserveRows.value = result.records || [];
      reserveTotal.value = result.total || 0;
      reserveLoaded.value = true;
    } catch {
      if (requestVersion !== stateVersion) return;
      reserveRows.value = [];
      reserveTotal.value = 0;
      reserveLoaded.value = true;
      reserveError.value = true;
    } finally {
      if (requestVersion === stateVersion) reserveLoading.value = false;
    }
  }

  function resetSettlementPage() {
    settlementPage.value = 1;
    void loadSettlement(true);
  }

  function handleSettlementPageChange() {
    void loadSettlement(true);
  }

  function resetReservePage() {
    reservePage.value = 1;
    void loadReserve(true);
  }

  function handleReservePageChange() {
    void loadReserve(true);
  }

  function settlementItemText(row: MerchantSettlementTransactionItem) {
    if (row.feeCategory && row.feeCategory !== 'NONE')
      return enumText('feeCategory', row.feeCategory);
    return enumText('resultItemType', row.resultItemType);
  }

  function clearingItemText(itemName?: string, itemCode?: string, itemType?: string) {
    return itemName || itemCode || itemType || '-';
  }

  function clearingStatusText(value?: string) {
    if (!value) return '-';
    const key = `transaction.order.clearingStatusValue.${value}`;
    return te(key) ? t(key) : value;
  }

  function recordStatusText(value?: string) {
    if (!value) return '-';
    const key = `transaction.order.recordStatusValue.${value}`;
    return te(key) ? t(key) : value;
  }

  function enumText(group: string, value?: string) {
    if (!value) return '-';
    const key = `settlement.${group}Value.${value}`;
    return te(key) ? t(key) : value;
  }

  function statusText(value?: string) {
    if (!value) return '-';
    const key = `transaction.genericStatus.${value}`;
    return te(key) ? t(key) : value;
  }

  function processingStatusType(value?: string) {
    if (
      [
        'SUCCESS',
        'MATCHED',
        'RECONCILED',
        'SETTLED',
        'ACCOUNTED',
        'CLEARED',
        'NOT_REQUIRED',
      ].includes(value || '')
    ) {
      return 'success';
    }
    if (['FAILED', 'MISMATCHED', 'MANUAL_REVIEW'].includes(value || '')) return 'danger';
    if (
      [
        'PENDING',
        'NOT_CLEARED',
        'WAITING_SOURCE',
        'NOT_RECONCILED',
        'NOT_SETTLED',
        'NOT_ACCOUNTED',
        'SETTLING',
      ].includes(value || '')
    ) {
      return 'warning';
    }
    if (value === 'PROCESSING') return 'primary';
    return 'info';
  }

  function reserveStatusType(value?: string) {
    if (value === 'RELEASED' || value === 'RETURNED') return 'success';
    if (value === 'HELD' || value === 'PARTIALLY_RETURNED' || value === 'RELEASABLE')
      return 'warning';
    if (value === 'FROZEN') return 'danger';
    if (value === 'REVERSED') return 'info';
    return 'primary';
  }

  const canOpenReserveItem = hasPermission('merchant:settlement:reserve-item:detail');

  function openBatch(settlementBatchNo: string) {
    void router.push({ path: '/finance/settlements', query: { settlementBatchNo } });
  }

  function openReserve(row: MerchantSettlementReserveItem) {
    if (!canOpenReserveItem) return;
    void router.push({
      path: '/finance/reserves',
      query: { settlementBatchNo: row.settlementBatchNo, reserveNo: row.reserveNo, reserveActionNo: row.reserveActionNo },
    });
  }
</script>

<style scoped>
  .transaction-finance-detail {
    min-width: 0;
  }
  .transaction-finance-detail__title {
    margin: 0 0 8px;
    color: #344054;
    font-size: 14px;
  }
  .transaction-finance-detail__tabs {
    min-width: 0;
  }
  .transaction-finance-detail__panel {
    min-height: 180px;
  }
  .transaction-finance-detail__summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-bottom: 16px;
    overflow: hidden;
    border: 1px solid #dce4ec;
    border-radius: 4px;
    background: #fff;
  }
  .transaction-finance-detail__summary > div {
    display: grid;
    grid-template-columns: 118px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-width: 0;
    min-height: 48px;
    padding: 8px 12px;
    border-right: 1px solid #e4e9ef;
    border-bottom: 1px solid #e4e9ef;
    text-align: left;
  }
  .transaction-finance-detail__summary > div:nth-child(3n) {
    border-right: 0;
  }
  .transaction-finance-detail__summary > div:nth-last-child(-n + 3) {
    border-bottom: 0;
  }
  .transaction-finance-detail__summary > div.is-money {
    text-align: left;
  }
  .transaction-finance-detail__summary > div > span:first-child {
    color: #667085;
    font-size: 12px;
  }
  .transaction-finance-detail__summary > div > strong {
    min-width: 0;
    justify-self: start;
    overflow-wrap: anywhere;
    color: #344054;
    font-size: 13px;
    text-align: left;
  }
  .transaction-finance-detail__summary > div > :not(:first-child) {
    justify-self: start;
  }
  .transaction-finance-detail__status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    min-height: 22px;
    margin-left: 0;
    border: 1px solid #d0d5dd;
    border-radius: 4px;
    padding: 1px 7px;
    background: #f8fafc;
    color: #667085;
    font-size: 12px;
    font-weight: 600;
    line-height: 18px;
  }
  .transaction-finance-detail__status .el-icon {
    margin-right: 4px;
    font-size: 13px;
  }
  .transaction-finance-detail__status.is-success {
    border-color: #b7dfae;
    background: #f0f9eb;
    color: #529b2e;
  }
  .transaction-finance-detail__status.is-danger {
    border-color: #fab6b6;
    background: #fef0f0;
    color: #c45656;
  }
  .transaction-finance-detail__status.is-warning {
    border-color: #f3d19e;
    background: #fdf6ec;
    color: #b88230;
  }
  .transaction-finance-detail__section {
    margin-top: 18px;
  }
  .transaction-finance-detail__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
    margin-bottom: 8px;
    color: #344054;
    font-size: 13px;
  }
  .transaction-finance-detail__table {
    width: 100%;
  }
  .transaction-finance-detail__table :deep(.el-table__header th.el-table__cell) {
    background: #f6f8fa;
    color: #475467;
    font-weight: 600;
  }
  .transaction-finance-detail__table :deep(.el-table__cell) {
    padding: 7px 0;
  }
  .transaction-finance-detail__item {
    color: #344054;
    font-weight: 600;
  }
  .transaction-finance-detail__error {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .transaction-finance-detail__error :deep(.el-alert) {
    flex: 1;
  }
  .transaction-finance-detail__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
    overflow-x: auto;
  }
  @media (max-width: 720px) {
    .transaction-finance-detail__summary {
      grid-template-columns: 1fr;
    }
    .transaction-finance-detail__summary > div {
      border-right: 0;
    }
    .transaction-finance-detail__summary > div:nth-last-child(-n + 3) {
      border-bottom: 1px solid #e4e9ef;
    }
    .transaction-finance-detail__summary > div:last-child {
      border-bottom: 0;
    }
    .transaction-finance-detail__error {
      align-items: stretch;
      flex-direction: column;
    }
    .transaction-finance-detail__pagination {
      justify-content: flex-start;
    }
  }
</style>

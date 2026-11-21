<template>
  <div class="page system-page merchant-redesigned-page merchant-transaction-page">
    <section class="merchant-list-card merchant-search-card transaction-filter-card">
      <el-form
        v-show="showSearch"
        :model="query"
        inline
        size="small"
        class="search-form transaction-search-form"
      >
        <div class="transaction-search-form__fields">
          <el-form-item :label="t('transaction.order.merchantOrderNo')">
            <el-input
              v-model.trim="query.merchantOrderNo"
              :placeholder="t('transaction.order.merchantOrderNoPlaceholder')"
              clearable
              @keyup.enter="applyQuery"
            />
          </el-form-item>
          <el-form-item :label="t('transaction.order.transactionId')">
            <el-input
              v-model.trim="query.transactionId"
              :placeholder="t('transaction.order.transactionIdPlaceholder')"
              clearable
              @keyup.enter="applyQuery"
            />
          </el-form-item>
          <el-form-item :label="t('transaction.order.transactionType')">
            <el-select
              v-model="query.transactionType"
              :placeholder="t('common.pleaseSelect')"
              clearable
              filterable
            >
              <template #prefix>
                <TransactionTypeDisplay
                  v-if="query.transactionType"
                  :value="query.transactionType"
                  icon-only
                />
              </template>
              <el-option
                v-for="item in activeTransactionTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <TransactionTypeDisplay :value="item.value" :label="item.label" align="start" />
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="t('transaction.order.status')">
            <el-select
              v-model="query.transactionStatus"
              :placeholder="t('common.pleaseSelect')"
              clearable
              filterable
            >
              <template #prefix>
                <TransactionStatusDisplay
                  v-if="query.transactionStatus"
                  :value="query.transactionStatus"
                  icon-only
                />
              </template>
              <el-option
                v-for="item in activeTransactionStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <TransactionStatusDisplay :value="item.value" :label="item.label" align="start" />
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="t('transaction.order.paymentMethod')">
            <el-select
              v-model="paymentQueryValue"
              :placeholder="t('common.pleaseSelect')"
              clearable
              filterable
            >
              <template #prefix>
                <PaymentLogoGroup
                  v-if="selectedPaymentQueryOption?.logoKeys.length"
                  :keys="selectedPaymentQueryOption.logoKeys"
                  size="sm"
                  :wrap="false"
                />
              </template>
              <el-option
                v-for="item in paymentQueryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <div class="transaction-brand-option">
                  <PaymentLogoGroup
                    v-if="item.logoKeys.length"
                    :keys="item.logoKeys"
                    size="sm"
                    :wrap="false"
                    class="transaction-brand-option__logo"
                  />
                  <span>{{ item.label }}</span>
                  <small>{{ item.displayCode }}</small>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="t('transaction.order.settlementStatus')">
            <TransactionStageStatusSelect v-model="query.settlementStatus" domain="settlement" :options="settlementStatusOptions" :placeholder="t('common.pleaseSelect')" />
          </el-form-item>
          <el-form-item
            :label="t('transaction.order.timeRange')"
            class="transaction-time-form-item"
          >
            <TransactionTimeRangeFilter
              v-model="dateRange"
              v-model:time-zone="query.queryTimeZone"
              v-model:preset="quickPreset"
              :timezone-options="timezoneOptions"
              default-preset="today"
            />
          </el-form-item>
          <el-form-item class="merchant-search-actions transaction-search-actions">
            <el-button type="primary" :icon="Search" @click="applyQuery">{{
              t('common.search')
            }}</el-button>
            <el-button :icon="RefreshLeft" @click="resetQuery">{{ t('common.reset') }}</el-button>
          </el-form-item>
        </div>
      </el-form>
    </section>

    <section class="transaction-result-strip">
      <div class="transaction-result-strip__summary">
        <article
          v-for="item in resultRows"
          :key="item.key"
          :class="['transaction-result-row', `transaction-result-row--${item.tone}`]"
        >
          <div class="transaction-result-row__label">
            <span>{{ item.label }}</span>
          </div>
          <div v-if="item.kind === 'metric'" class="transaction-result-row__content">
            <span
              v-if="item.countText"
              class="transaction-result-pill transaction-result-pill--count"
              >{{ item.countText }}</span
            >
            <span
              v-if="item.rateText"
              :class="[
                'transaction-result-pill',
                'transaction-result-pill--rate',
                `is-${item.rateTone}`,
              ]"
              >{{ item.rateText }}</span
            >
            <span
              v-for="amountItem in item.amounts"
              :key="amountItem.key"
              class="transaction-money-pill"
            >
              <span class="transaction-money-pill__currency">{{ amountItem.currency }}</span>
              <b>{{ amountItem.amount }}</b>
            </span>
          </div>
          <div v-else class="transaction-result-row__content">
            <template v-if="paymentSummaryItems.length">
              <span
                v-for="method in paymentSummaryItems"
                :key="method.key"
                class="transaction-method-pill"
                :title="method.title"
              >
                <PaymentLogoGroup
                  v-if="method.logoKeys.length"
                  :keys="method.logoKeys"
                  size="sm"
                  align="start"
                  fallback="text"
                  class="transaction-method-pill__logos"
                />
                <span v-else class="transaction-method-pill__text">{{ method.label }}</span>
                <span class="transaction-method-pill__count">{{ method.countText }}</span>
                <span
                  v-for="amount in method.amounts"
                  :key="amount.key"
                  class="transaction-money-pill transaction-money-pill--method"
                >
                  <span class="transaction-money-pill__currency">{{ amount.currency }}</span>
                  <b>{{ amount.amount }}</b>
                </span>
              </span>
            </template>
            <span v-else class="transaction-result-muted">{{
              t('transaction.order.noPaymentSummary')
            }}</span>
          </div>
        </article>
      </div>
    </section>

    <section class="merchant-list-card merchant-table-card transaction-table-card">
      <div class="merchant-table-head transaction-table-head">
        <div class="merchant-table-head__actions">
          <el-button
            v-if="canExport"
            type="warning"
            plain
            size="small"
            :icon="Download"
            :loading="exporting"
            @click="handleExport"
          >
            {{ t('transaction.order.export') }}
          </el-button>
        </div>
        <RightToolbar
          class="transaction-table-toolbar"
          @toggle-search="showSearch = !showSearch"
          @refresh="loadData"
        />
      </div>
      <StandardTable
        table-key="merchant-transaction-order-v3"
        v-loading="loading"
        :data="rows"
        row-key="transactionId"
        size="small"
      >
        <el-table-column
          :label="t('transaction.order.merchantOrderNo')"
          prop="merchantOrderNo"
          min-width="190"
          fixed="left"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <button
              class="transaction-copy-link"
              type="button"
              :disabled="!row.merchantOrderNo"
              @click="copyOrderNo(row.merchantOrderNo)"
            >
              {{ row.merchantOrderNo || '-' }}
            </button>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('transaction.order.systemOrderNo')"
          min-width="210"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <button
              class="transaction-copy-link"
              type="button"
              :disabled="systemOrderNo(row) === '-'"
              @click="copyOrderNo(systemOrderNo(row))"
            >
              {{ systemOrderNo(row) }}
            </button>
          </template>
        </el-table-column>
        <el-table-column :label="t('transaction.order.transactionAmount')" min-width="170" align="right">
          <template #default="{ row }">
            <CurrencyAmountDisplay
              :amount="row.labelAmount"
              :currency="row.labelCurrency"
              :exponent="row.currencyExponent"
              :locale="String(locale)"
              align="end"
              emphasized
            />
          </template>
        </el-table-column>
        <el-table-column
          :label="t('transaction.order.transactionType')"
          min-width="168"
          align="center"
        >
          <template #default="{ row }">
            <TransactionTypeDisplay
              :value="row.transactionType"
              :label="tagText(transactionTypeOptions, row.transactionType)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('transaction.order.status')" min-width="142" align="center">
          <template #default="{ row }">
            <el-tooltip :content="lifecycleText(row)" placement="top">
              <TransactionStatusDisplay
                :value="row.transactionStatus"
                :label="tagText(transactionStatusOptions, row.transactionStatus)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="t('transaction.order.response')" min-width="128" align="center">
          <template #default="{ row }">
            <el-tooltip
              :content="responseTooltip(row.merchantResponseCode, row.merchantResponseMessage)"
              placement="top"
            >
              <el-tag size="small" effect="plain">{{ row.merchantResponseCode || '-' }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="t('transaction.order.payment')" min-width="132" align="center">
          <template #default="{ row }">
            <div class="transaction-payment-logo-cell">
              <PaymentLogoGroup
                v-if="assetPaymentLogos(row).length"
                :keys="assetPaymentLogos(row)"
                size="sm"
                align="center"
                fallback="hide"
                class="transaction-payment-cell__logos"
              />
              <span v-else>-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('transaction.order.cardBin')"
          prop="cardBin"
          min-width="132"
          align="center"
        >
          <template #default="{ row }">
            <span class="transaction-card-bin">{{ formatTransactionCardDisplay(row.cardNumberMasked, row.cardBin) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('transaction.order.authCode')"
          prop="authCode"
          min-width="108"
          align="center"
        >
          <template #default="{ row }">
            <span class="transaction-auth-code">{{ row.authCode || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('transaction.order.threeDs')"
          prop="threeDsEnabled"
          min-width="92"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="plain"
              class="transaction-capability-tag transaction-capability-tag--three-ds"
              :class="{ 'is-enabled': row.threeDsEnabled === 1 }"
            >
              {{ row.threeDsEnabled === 1 ? t('common.yes') : t('common.no') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('transaction.order.settlementStatus')"
          min-width="126"
          align="center"
        >
          <template #default="{ row }">
            <TransactionStageStatusDisplay domain="settlement" :value="row.settlementStatus" :label="tagText(settlementStatusOptions, row.settlementStatus)" />
          </template>
        </el-table-column>
        <el-table-column
          :label="t('transaction.order.transactionTime')"
          min-width="178"
          align="center"
        >
          <template #default="{ row }">
            <BaseDateTime
              :value="row.transactionDateTime"
              source-time-zone="Asia/Shanghai"
              :display-time-zone="query.queryTimeZone"
            />
          </template>
        </el-table-column>
        <el-table-column
          v-if="showOperationColumn"
          :label="t('common.operation')"
          width="138"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <TableRowActions
              :actions="transactionRowActions(row)"
              :more-label="t('common.more')"
              :max-direct-actions="canDetail ? 1 : 0"
              @select="handleTransactionRowAction($event, row)"
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
      :title="t('transaction.order.detailTitle')"
      size="min(1380px, 97vw)"
      class="transaction-detail-drawer"
      destroy-on-close
    >
      <el-skeleton v-if="detailLoading" :rows="8" animated />
      <template v-else-if="detail">
        <div class="transaction-detail-shell">
          <section class="transaction-detail-hero">
            <div class="transaction-detail-hero__identity">
              <span class="transaction-detail-eyebrow">{{
                t('transaction.order.merchantOrderNo')
              }}</span>
              <strong>{{ detailSummaryRecord?.merchantOrderNo || '-' }}</strong>
              <div class="transaction-detail-hero__meta">
                <LegacyPaymentLogoGroup
                  v-if="assetPaymentLogos(detailSummaryRecord).length"
                  :keys="assetPaymentLogos(detailSummaryRecord)"
                  size="sm"
                  align="start"
                  fallback="hide"
                />
                <TransactionTypeDisplay
                  :value="detailSummaryRecord?.transactionType"
                  :label="tagText(transactionTypeOptions, detailSummaryRecord?.transactionType)"
                  align="start"
                />
                <span class="transaction-detail-hero__separator" aria-hidden="true"></span>
                <BaseDateTime
                  :value="detailSummaryRecord?.transactionDateTime"
                  source-time-zone="Asia/Shanghai"
                  :display-time-zone="query.queryTimeZone"
                />
              </div>
            </div>
            <div class="transaction-detail-hero__result">
              <span class="transaction-detail-eyebrow">{{ t('transaction.order.amount') }}</span>
              <CurrencyAmountDisplay
                :amount="orderDisplayAmount(detailSummaryRecord)"
                :currency="defaultCurrency(detailSummaryRecord)"
                :exponent="detailSummaryRecord?.currencyExponent"
                :locale="String(locale)"
                size="lg"
                align="end"
                emphasized
              />
              <el-tag
                class="transaction-detail-status-tag transaction-detail-status-tag--hero"
                :type="statusTag(detailSummaryRecord?.transactionStatus, transactionStatusOptions)"
                effect="light"
                round
              >
                {{ tagText(transactionStatusOptions, detailSummaryRecord?.transactionStatus) }}
              </el-tag>
            </div>
          </section>

          <section class="transaction-detail-section">
            <h3 class="transaction-drawer-title">{{ t('transaction.order.fundsOverview') }}</h3>
            <dl class="transaction-detail-metrics">
              <div>
                <dt>{{ t('transaction.order.authorizedAmount') }}</dt>
                <dd>
                  <CurrencyAmountDisplay :amount="detailSummaryRecord?.authorizedAmount" :currency="defaultCurrency(detailSummaryRecord)" :exponent="detailSummaryRecord?.currencyExponent" :locale="String(locale)" emphasized />
                </dd>
              </div>
              <div>
                <dt>{{ t('transaction.order.capturedAmount') }}</dt>
                <dd>
                  <CurrencyAmountDisplay :amount="detailSummaryRecord?.capturedAmount" :currency="defaultCurrency(detailSummaryRecord)" :exponent="detailSummaryRecord?.currencyExponent" :locale="String(locale)" emphasized />
                </dd>
              </div>
              <div>
                <dt>{{ t('transaction.order.refundedAmount') }}</dt>
                <dd>
                  <CurrencyAmountDisplay :amount="detailSummaryRecord?.refundedAmount" :currency="defaultCurrency(detailSummaryRecord)" :exponent="detailSummaryRecord?.currencyExponent" :locale="String(locale)" emphasized />
                </dd>
              </div>
              <div>
                <dt>{{ t('transaction.order.availableRefund') }}</dt>
                <dd>
                  <CurrencyAmountDisplay :amount="detailSummaryRecord?.availableRefundAmount" :currency="defaultCurrency(detailSummaryRecord)" :exponent="detailSummaryRecord?.currencyExponent" :locale="String(locale)" emphasized />
                </dd>
              </div>
            </dl>
          </section>

          <section class="transaction-detail-section">
            <h3 class="transaction-drawer-title">
              {{ t('transaction.order.transactionInformation') }}
            </h3>
            <dl class="transaction-detail-grid">
              <div>
                <dt>{{ t('transaction.order.systemOrderNo') }}</dt>
                <dd class="transaction-detail-code">
                  {{ detailSummaryRecord ? systemOrderNo(detailSummaryRecord) : '-' }}
                </dd>
              </div>
              <div>
                <dt>{{ t('transaction.order.transactionType') }}</dt>
                <dd>
                  <TransactionTypeDisplay
                    :value="detailSummaryRecord?.transactionType"
                    :label="tagText(transactionTypeOptions, detailSummaryRecord?.transactionType)"
                    align="start"
                  />
                </dd>
              </div>
              <div>
                <dt>{{ t('transaction.order.payment') }}</dt>
                <dd>
                  <span class="transaction-detail-payment">
                    <LegacyPaymentLogoGroup
                      v-if="assetPaymentLogos(detailSummaryRecord).length"
                      :keys="assetPaymentLogos(detailSummaryRecord)"
                      size="sm"
                      align="start"
                      fallback="hide"
                    />
                    <span v-else>-</span>
                  </span>
                </dd>
              </div>
              <div>
                <dt>{{ t('transaction.order.cardBin') }}</dt>
                <dd class="transaction-detail-code">{{ formatTransactionCardDisplay(detailSummaryRecord?.cardNumberMasked, detailSummaryRecord?.cardBin) }}</dd>
              </div>
              <div>
                <dt>{{ t('transaction.order.authCode') }}</dt>
                <dd class="transaction-detail-code">{{ detailSummaryRecord?.authCode || '-' }}</dd>
              </div>
              <div>
                <dt>{{ t('transaction.order.threeDs') }}</dt>
                <dd>
                  <el-tag
                    size="small"
                    effect="plain"
                    class="transaction-capability-tag transaction-capability-tag--three-ds"
                    :class="{ 'is-enabled': detailSummaryRecord?.threeDsEnabled === 1 }"
                    >{{
                      detailSummaryRecord?.threeDsEnabled === 1 ? t('common.yes') : t('common.no')
                    }}</el-tag
                  >
                </dd>
              </div>
              <div>
                <dt>{{ t('transaction.order.response') }}</dt>
                <dd>
                  {{
                    responseTooltip(
                      detailSummaryRecord?.merchantResponseCode,
                      detailSummaryRecord?.merchantResponseMessage,
                    )
                  }}
                </dd>
              </div>
              <div>
                <dt>{{ t('transaction.order.settlementStatus') }}</dt>
                <dd>
                  <TransactionStageStatusDisplay domain="settlement" :value="detailSummaryRecord?.settlementStatus" :label="tagText(settlementStatusOptions, detailSummaryRecord?.settlementStatus)" />
                </dd>
              </div>
            </dl>
          </section>

          <MerchantTransactionFinanceDetail
            v-if="
              detailOperation &&
              (canViewClearingDetails ||
                canViewReconciliationDetails ||
                canViewSettlementDetails ||
                canViewReserveDetails)
            "
            class="transaction-detail-section"
            :transaction-id="detailOperation.transactionId || ''"
            :transaction-date-time="detailOperation.transactionDateTime"
            :display-time-zone="query.queryTimeZone"
            :can-view-clearing="canViewClearingDetails"
            :can-view-reconciliation="canViewReconciliationDetails"
            :can-view-settlement="canViewSettlementDetails"
            :can-view-reserve="canViewReserveDetails"
            :transaction-type-options="transactionTypeOptions"
          />

          <section class="transaction-detail-section transaction-timeline-panel">
            <h3 class="transaction-drawer-title">{{ t('transaction.order.operationTimeline') }}</h3>
            <el-empty
              v-if="!(detail.operations || []).length"
              :description="t('transaction.order.noTimeline')"
            />
            <el-timeline v-else>
              <el-timeline-item
                v-for="item in detail.operations || []"
                :key="item.transactionId"
                :timestamp="operationTimestamp(item)"
                :type="statusTag(item.transactionStatus, transactionStatusOptions) || 'primary'"
              >
                <div class="transaction-timeline-item">
                  <div class="transaction-timeline-item__head">
                    <TransactionTypeDisplay
                      :value="item.transactionType"
                      :label="tagText(transactionTypeOptions, item.transactionType)"
                      align="start"
                    />
                    <TransactionStatusDisplay
                      class="transaction-timeline-item__status"
                      :value="item.transactionStatus"
                      :label="tagText(transactionStatusOptions, item.transactionStatus)"
                    />
                    <CurrencyAmountDisplay class="transaction-timeline-item__amount" :amount="item.labelAmount" :currency="item.labelCurrency" :exponent="item.currencyExponent" :locale="String(locale)" size="xs" emphasized />
                  </div>
                  <code>{{ item.transactionId || '-' }}</code>
                  <small>{{
                    responseTooltip(item.merchantResponseCode, item.merchantResponseMessage)
                  }}</small>
                </div>
              </el-timeline-item>
            </el-timeline>
          </section>
        </div>
      </template>
    </el-drawer>

    <el-dialog
      v-model="refundVisible"
      :close-on-click-modal="!refundSaving"
      :close-on-press-escape="!refundSaving"
      :show-close="!refundSaving"
      :title="t('transaction.order.refundTitle')"
      width="min(760px, calc(100vw - 32px))"
      class="transaction-action-dialog"
      destroy-on-close
    >
      <el-alert class="transaction-action-intro" type="info" show-icon :closable="false" :title="t('refundForm.tip')" />
      <section v-if="activeActionRow" class="transaction-action-section">
        <h3>{{ t('refundForm.sourceInfo') }}</h3>
        <TransactionActionSourceSummary
          :type="activeActionRow.transactionType"
          :type-label="tagText(transactionTypeOptions, activeActionRow.transactionType)"
          :status="activeActionRow.transactionStatus"
          :status-label="tagText(transactionStatusOptions, activeActionRow.transactionStatus)"
          :amount="fullLabelAmount(activeActionRow)"
          :currency="labelCurrency(activeActionRow)"
          :exponent="activeActionRow.currencyExponent"
          :locale="String(locale)"
          :amount-label="t('refundForm.sourceAmount')" :hint="t('refundForm.sourceHint')" :t="t"
        >
          <template #merchant-order><button type="button" class="transaction-action-source-copy" :aria-label="t('refundForm.copyReference', { label: t('refundForm.merchantOrderNo') })" :disabled="!activeActionRow.merchantOrderNo" @click="copyOrderNo(activeActionRow.merchantOrderNo)"><span>{{ activeActionRow.merchantOrderNo || '-' }}</span><el-icon><CopyDocument /></el-icon></button></template>
          <template #transaction-id><button type="button" class="transaction-action-source-copy" :aria-label="t('refundForm.copyReference', { label: t('refundForm.transactionId') })" :disabled="!activeActionRow.transactionId" @click="copyOrderNo(activeActionRow.transactionId)"><span>{{ activeActionRow.transactionId || '-' }}</span><el-icon><CopyDocument /></el-icon></button></template>
          <template #transaction-time><BaseDateTime :value="activeActionRow.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
        </TransactionActionSourceSummary>
      </section>
      <section v-if="activeActionRow" class="transaction-action-section">
        <h3>{{ t('transaction.order.refundInfo') }}</h3>
        <RefundFields
          ref="refundFieldsRef"
          :model="refundForm"
          :context="refundContext"
          :loading="refundLoading"
          :submitting="refundSaving"
          :t="t"
          :locale="locale"
          @update:model="Object.assign(refundForm, $event)"
        />
      </section>
      <template #footer>
        <div class="dialog-footer">
          <el-button
            type="primary"
            size="small"
            :loading="refundSaving"
            :disabled="
              refundLoading ||
              !refundContext ||
              !isPositiveDecimalAmount(refundContext.availableRefundAmount)
            "
            @click="submitRefund"
            >{{ t('transaction.order.refund') }}</el-button
          >
          <el-button size="small" :disabled="refundSaving" @click="refundVisible = false">{{
            t('common.cancel')
          }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="captureVisible"
      :title="captureDialogTitle"
      width="min(760px, calc(100vw - 32px))"
      class="transaction-action-dialog"
      destroy-on-close
    >
      <el-alert
        class="transaction-action-intro"
        type="info"
        show-icon
        :closable="false"
        :title="captureDialogTip"
      />
      <section v-if="activeActionRow" class="transaction-action-section">
        <h3>{{ t('transaction.order.originalInfo') }}</h3>
        <TransactionActionSourceSummary
          :type="activeActionRow.transactionType"
          :type-label="tagText(transactionTypeOptions, activeActionRow.transactionType)"
          :status="activeActionRow.transactionStatus"
          :status-label="tagText(transactionStatusOptions, activeActionRow.transactionStatus)"
          :amount="fullLabelAmount(activeActionRow)"
          :amount-label="t('transaction.order.authorizedAmount')"
          :currency="labelCurrency(activeActionRow)"
          :exponent="activeActionRow.currencyExponent"
          :locale="String(locale)"
          :t="t"
        >
          <template #merchant-order>{{ activeActionRow.merchantOrderNo || '-' }}</template>
          <template #transaction-id>{{ activeActionRow.transactionId || '-' }}</template>
          <template #transaction-time><BaseDateTime :value="activeActionRow.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
        </TransactionActionSourceSummary>
      </section>
      <section v-if="activeActionRow" class="transaction-action-section">
        <h3>{{ captureDialogInfo }}</h3>
        <div class="transaction-action-amount-card">
          <span class="transaction-action-amount-card__label">{{ t('transaction.order.availableCapture') }}</span>
          <CurrencyAmountDisplay :amount="captureAmount" :currency="labelCurrency(activeActionRow)" :exponent="activeActionRow.currencyExponent" :locale="String(locale)" size="md" emphasized />
        </div>
        <ConsoleActionFields ref="captureFieldsRef" :model="captureForm" scope="capture" :maximum="captureAmount" :currency="labelCurrency(activeActionRow)" :exponent="activeActionRow.currencyExponent" :submitting="actionSaving" :t="t" @update:model="Object.assign(captureForm, $event)" />
      </section>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" size="small" :loading="actionSaving" @click="submitCapture">{{
            captureDialogAction
          }}</el-button>
          <el-button size="small" @click="captureVisible = false">{{
            t('common.cancel')
          }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="voidVisible"
      :title="t('transaction.order.voidTitle')"
      width="min(760px, calc(100vw - 32px))"
      class="transaction-action-dialog"
      destroy-on-close
    >
      <el-alert
        class="transaction-action-intro"
        type="info"
        show-icon
        :closable="false"
        :title="t('transaction.order.voidTip')"
      />
      <section v-if="activeActionRow" class="transaction-action-section">
        <h3>{{ t('transaction.order.originalInfo') }}</h3>
        <TransactionActionSourceSummary
          :type="activeActionRow.transactionType"
          :type-label="tagText(transactionTypeOptions, activeActionRow.transactionType)"
          :status="activeActionRow.transactionStatus"
          :status-label="tagText(transactionStatusOptions, activeActionRow.transactionStatus)"
          :amount="fullLabelAmount(activeActionRow)"
          :amount-label="t('transaction.order.authorizedAmount')"
          :currency="labelCurrency(activeActionRow)"
          :exponent="activeActionRow.currencyExponent"
          :locale="String(locale)"
          :t="t"
        >
          <template #merchant-order>{{ activeActionRow.merchantOrderNo || '-' }}</template>
          <template #transaction-id>{{ activeActionRow.transactionId || '-' }}</template>
          <template #transaction-time><BaseDateTime :value="activeActionRow.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
        </TransactionActionSourceSummary>
      </section>
      <section v-if="activeActionRow" class="transaction-action-section">
        <h3>{{ t('transaction.order.voidInfo') }}</h3>
        <div class="transaction-action-amount-card transaction-action-amount-card--warning">
          <div class="transaction-action-amount-card__label">
            <span>{{ t('transaction.order.voidAmount') }}</span>
            <small>{{ t('transaction.order.fullVoidOnly') }}</small>
          </div>
          <CurrencyAmountDisplay :amount="fullLabelAmount(activeActionRow)" :currency="labelCurrency(activeActionRow)" :exponent="activeActionRow.currencyExponent" :locale="String(locale)" size="md" emphasized />
        </div>
        <ConsoleActionFields ref="voidFieldsRef" :model="voidForm" scope="void" :maximum="captureAmount" :currency="labelCurrency(activeActionRow)" :exponent="activeActionRow.currencyExponent" :submitting="actionSaving" :t="t" @update:model="Object.assign(voidForm, $event)" />
        <el-alert
          class="transaction-action-bottom-alert"
          type="info"
          show-icon
          :closable="false"
          :title="t('transaction.order.voidSuccessHint')"
        />
      </section>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" size="small" :loading="actionSaving" @click="submitVoid">{{
            t('transaction.order.void')
          }}</el-button>
          <el-button size="small" @click="voidVisible = false">{{ t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue';
  import { ElMessage } from 'element-plus';
  import {
    CircleClose,
    CopyDocument,
    Download,
    Promotion,
    RefreshLeft,
    Search,
    View,
  } from '@element-plus/icons-vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute } from 'vue-router';
  import { TransactionStageStatusDisplay, TransactionStageStatusSelect,
    CurrencyAmountDisplay,
    formatTransactionCardDisplay,
    RefundFields, TransactionActionSourceSummary, ConsoleActionFields, refundProgressKey, useTransactionRefresh,
    type RefundContext,
    getPaymentLogos,
    PaymentLogoGroup,
    type PaymentLogoKey,
    isPositiveDecimalAmount,
    normalizeDecimalAmount,
    safeErrorType,
    TableRowActions,
    type TableRowAction,
    TransactionStatusDisplay,
    TransactionTypeDisplay,
    userFacingErrorMessage,
  } from '@acquiring/shared';
  import { LegacyPaymentLogoGroup } from '@acquiring/shared/legacy';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import RightToolbar from '@/components/RightToolbar/index.vue';
  import StandardTable from '@/components/StandardTable/StandardTable.vue';
  import { submitTransactionExport } from '@/api/exportTaskApi';
  import {
    transactionApi,
    type TransactionAmountSummary,
    type TransactionDetail,
    type TransactionOperation,
    type TransactionOrder,
    type TransactionPageQuery,
    type TransactionPaymentMethodSummary,
  } from '@/api/transactionApi';
  import { useAuthStore } from '@/stores/authStore';
  import { hasPermission } from '@/utils/permission';
  import { formatDateTimeFromSourceTimeZone } from '@/utils/format';
  import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
  import MerchantTransactionFinanceDetail from '../components/MerchantTransactionFinanceDetail.vue';
  import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    defaultTransactionTodayRange,
    ensureTransactionTimezoneOptions,
    fallbackCardBrandOptions,
    fallbackPaymentMethodOptions,
    fallbackStatusOptions,
    fallbackTransactionStatusOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    mergeTransactionDictOptions,
    moneyText,
    resolveTransactionQueryRange,
    responseTooltip,
    splitDateRange,
    statusTagType,
    tagText,
    transactionPaymentLogoKeys,
    type TransactionDictOption,
  } from '../shared';

  type MerchantTransactionOrderQuery = Omit<
    TransactionPageQuery,
    'pageNo' | 'pageSize' | 'queryTimeZone'
  > & {
    queryTimeZone: string;
  };

  const { t, locale } = useI18n();
  const route = useRoute();
  const auth = useAuthStore();
  const loading = ref(false);
  const exporting = ref(false);
  const detailLoading = ref(false);
  const detailVisible = ref(false);
  const refundVisible = ref(false);
  const refundLoading = ref(false);
  const refundContext = ref<RefundContext | null>(null);
  const refundFieldsRef = ref<InstanceType<typeof RefundFields>>();
  const captureVisible = ref(false);
  const voidVisible = ref(false);
  const refundSaving = ref(false);
  const actionSaving = ref(false);
  const showSearch = ref(true);
  const rows = ref<TransactionOperation[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(10);
  const detail = ref<TransactionDetail>();
  const detailOperation = ref<TransactionOperation | null>(null);
  const focusedDetailOperation = computed<TransactionOperation | null>(() => {
    const transactionId = detailOperation.value?.transactionId;
    if (!transactionId) return detailOperation.value;
    return (
      detail.value?.operations?.find((item) => item.transactionId === transactionId) ||
      detailOperation.value
    );
  });
  const detailSummaryRecord = computed<TransactionOrder | TransactionOperation | null>(() =>
    focusedDetailOperation.value || detail.value?.order || null,
  );
  const summary = ref<Awaited<ReturnType<typeof transactionApi.searchOperations>>['summary']>();
  const activeActionRow = ref<TransactionOperation | null>(null);
  const refundForm = reactive({
    amount: null as string | null | undefined,
    currency: '',
    mode: 'PARTIAL',
    reason: '',
    description: '',
  });
  const captureForm = reactive({ amount: null as string | null, mode: 'PARTIAL', reason: '', description: '' });
  const captureFieldsRef = ref<InstanceType<typeof ConsoleActionFields>>();
  const voidFieldsRef = ref<InstanceType<typeof ConsoleActionFields>>();
  const voidForm = reactive({ reason: '', description: '' });
  const initialQueryTimeZone = merchantDefaultTimeZone();
  const query = reactive<MerchantTransactionOrderQuery>({ queryTimeZone: initialQueryTimeZone });
  const dateRange = ref<string[]>(defaultTransactionTodayRange(initialQueryTimeZone));
  const quickPreset = ref('today');
  const transactionTypeOptions = ref<TransactionDictOption[]>(fallbackTransactionTypeOptions(t));
  const transactionStatusOptions = ref<TransactionDictOption[]>(
    fallbackTransactionStatusOptions(t),
  );
  const activeTransactionTypeOptions = ref<TransactionDictOption[]>([]);
  const activeTransactionStatusOptions = ref<TransactionDictOption[]>([]);
  const paymentMethodOptions = ref<TransactionDictOption[]>(fallbackPaymentMethodOptions(t));
  const cardBrandOptions = ref<TransactionDictOption[]>(fallbackCardBrandOptions());
  const activePaymentMethodOptions = ref<TransactionDictOption[]>([]);
  const activeCardBrandOptions = ref<TransactionDictOption[]>([]);
  const settlementStatusOptions = ref<TransactionDictOption[]>(
    fallbackStatusOptions(t, 'settlement'),
  );
  const timezoneOptions = ref(ensureTransactionTimezoneOptions([]));
  const canDetail = computed(() => hasPermission('merchant:transaction:order:detail'));
  const canExport = computed(() => hasPermission('merchant:transaction:order:export'));
  const canRefund = computed(() => hasPermission('merchant:transaction:order:refund'));
  const canCapture = computed(() => hasPermission('merchant:transaction:order:capture'));
  const canVoid = computed(() => hasPermission('merchant:transaction:order:void'));
  const showOperationColumn = computed(
    () => canDetail.value || canRefund.value || canCapture.value || canVoid.value,
  );
  const canViewClearingDetails = computed(() => hasPermission('merchant:clearing:record:detail'));
  const canViewReconciliationDetails = computed(() =>
    hasPermission('merchant:reconciliation:record:detail'),
  );
  const canViewSettlementDetails = computed(() =>
    hasPermission('merchant:settlement:transaction-item:transaction-detail'),
  );
  const canViewReserveDetails = computed(() =>
    hasPermission('merchant:settlement:reserve-item:transaction-detail'),
  );

  function transactionRowActions(row: TransactionOperation): TableRowAction[] {
    const refundEnabled = canRefundRow(row);
    const captureEnabled = canCaptureRow(row);
    const voidEnabled = canVoidRow(row);
    return [
      { key: 'detail', label: t('common.detail'), icon: View, visible: canDetail.value },
      {
        key: 'refund',
        label: t('transaction.order.refund'),
        icon: RefreshLeft,
        visible: canRefund.value && refundEnabled,
        disabledReason: refundEnabled
          ? t('transaction.order.refundEnabledTip')
          : t('transaction.order.refundDisabled'),
      },
      {
        key: 'capture',
        label: captureActionText(row),
        icon: Promotion,
        visible: canCapture.value && captureEnabled,

      },
      {
        key: 'void',
        label: t('transaction.order.void'),
        icon: CircleClose,
        visible: canVoid.value && voidEnabled,
        disabledReason: voidEnabled
          ? t('transaction.order.voidEnabledTip')
          : t('transaction.order.voidDisabled'),
      },
    ];
  }

  function handleTransactionRowAction(action: string, row: TransactionOperation) {
    if (action === 'detail') void openDetail(row);
    else if (action === 'refund') void openRefund(row);
    else if (action === 'capture') openCapture(row);
    else if (action === 'void') openVoid(row);
  }

  const resultRows = computed(() => {
    const totalCount = Number(summary.value?.totalCount || total.value || 0);
    const successCount = Number(summary.value?.successCount || 0);
    const failedCount = Number(summary.value?.failedCount || 0);
    return [
      {
        key: 'total',
        kind: 'metric' as const,
        label: t('transaction.order.queryResult'),
        tone: 'total',
        countText: countText(totalCount),
        amounts: amountPills(summary.value?.amountSummaries || []),
      },
      {
        key: 'success',
        kind: 'metric' as const,
        label: t('transaction.order.successTransactions'),
        tone: 'success',
        countText: countText(successCount),
        rateText: ratioText(successCount, totalCount),
        rateTone: rateTone(successCount, totalCount),
        amounts: amountPills(summary.value?.successAmountSummaries || []),
      },
      {
        key: 'paymentMethod',
        kind: 'payment' as const,
        label: t('transaction.order.paymentMethodSummary'),
        tone: 'method',
        countText: '',
        rateText: '',
        rateTone: 'primary',
        amounts: [],
      },
      {
        key: 'failed',
        kind: 'metric' as const,
        label: t('transaction.order.failedTransactions'),
        tone: 'danger',
        countText: countText(failedCount),
        rateText: ratioText(failedCount, totalCount),
        rateTone: rateTone(failedCount, totalCount, true),
        amounts: amountPills(summary.value?.failedAmountSummaries || []),
      },
    ];
  });
  const paymentSummaryItems = computed(() =>
    (summary.value?.paymentMethodSummaries || []).map((item: TransactionPaymentMethodSummary) => {
      const label = paymentSummaryLabel(item);
      const amounts = amountPills(item.amountSummaries || [], false);
      return {
        key: `${item.paymentMethod || '-'}-${item.paymentBrand || '-'}`,
        label,
        logoKeys: paymentLogos(item),
        countText: countText(item.count || 0),
        title:
          `${label} ${countText(item.count || 0)} ${amounts.map((amount) => `${amount.currency} ${amount.amount}`).join(' ')}`.trim(),
        amounts,
      };
    }),
  );
  const captureAmount = computed(() =>
    labelAmountFor(
      activeActionRow.value,
      activeActionRow.value?.availableCaptureAmount ?? activeActionRow.value?.labelAmount,
    ),
  );
  const isPreAuthCompletion = computed(
    () => activeActionRow.value?.transactionType === 'PRE_AUTHORIZATION',
  );
  const captureDialogAction = computed(() =>
    t(`transaction.order.${isPreAuthCompletion.value ? 'preAuthCompletion' : 'capture'}`),
  );
  const captureDialogTitle = computed(() =>
    t(`transaction.order.${isPreAuthCompletion.value ? 'preAuthCompletionTitle' : 'captureTitle'}`),
  );
  const captureDialogTip = computed(() => t(`transactionAction.${isPreAuthCompletion.value ? 'completionHint' : 'captureHint'}`));
  const captureDialogInfo = computed(() =>
    t(`transaction.order.${isPreAuthCompletion.value ? 'preAuthCompletionInfo' : 'captureInfo'}`),
  );


  interface PaymentQueryOption {
    value: string;
    label: string;
    displayCode: string;
    paymentMethod: string;
    paymentBrand: string;
    logoKeys: PaymentLogoKey[];
  }

  const paymentQueryOptions = computed<PaymentQueryOption[]>(() =>
    activePaymentMethodOptions.value.flatMap((method) => {
      if (method.value !== 'BANK_CARD') {
        return [
          {
            value: method.value,
            label: method.label,
            displayCode: method.value,
            paymentMethod: method.value,
            paymentBrand: '',
            logoKeys: transactionPaymentLogoKeys(method.value, '', method),
          },
        ];
      }
      return activeCardBrandOptions.value.map((brand) => ({
        value: `BANK_CARD:${brand.value}`,
        label: brand.label,
        displayCode: brand.value,
        paymentMethod: 'BANK_CARD',
        paymentBrand: brand.value,
        logoKeys: transactionPaymentLogoKeys('BANK_CARD', brand.value, method, brand),
      }));
    }),
  );
  const paymentQueryValue = computed({
    get: () =>
      query.paymentMethod === 'BANK_CARD' && query.paymentBrand
        ? `BANK_CARD:${query.paymentBrand}`
        : query.paymentMethod || '',
    set: (value: string) => {
      const selected = paymentQueryOptions.value.find((item) => item.value === value);
      query.paymentMethod = selected?.paymentMethod || '';
      query.paymentBrand = selected?.paymentBrand || '';
    },
  });
  const selectedPaymentQueryOption = computed(() =>
    paymentQueryOptions.value.find((item) => item.value === paymentQueryValue.value),
  );

  onMounted(async () => {
    const linkedTransactionId =
      typeof route.query.transactionId === 'string' ? route.query.transactionId.trim() : '';
    if (linkedTransactionId) query.transactionId = linkedTransactionId;
    const linkedTransactionDateTime =
      typeof route.query.transactionDateTime === 'string'
        ? route.query.transactionDateTime.trim()
        : '';
    const linkedTransactionTimeZone =
      typeof route.query.transactionTimeZone === 'string'
        ? route.query.transactionTimeZone.trim()
        : 'Asia/Shanghai';
    if (linkedTransactionDateTime) {
      const displayDateTime = formatDateTimeFromSourceTimeZone(
        linkedTransactionDateTime,
        linkedTransactionTimeZone,
        query.queryTimeZone,
      );
      const linkedDate = /^\d{4}-\d{2}-\d{2}/.exec(displayDateTime)?.[0];
      if (linkedDate) {
        quickPreset.value = '';
        dateRange.value = [`${linkedDate}T00:00:00`, `${linkedDate}T23:59:59`];
      }
    }
    await loadDictionaries();
    await loadData();
    if (linkedTransactionId && canDetail.value) {
      const linkedRow = rows.value.find((row) => row.transactionId === linkedTransactionId);
      if (linkedRow) await openDetail(linkedRow);
    }
  });

  useTransactionRefresh(async () => {
    await loadData();
    const current = detailOperation.value;
    if (detailVisible.value && current?.transactionId && current.transactionDateTime && current.rootTransactionDateTime) {
        const latest = await transactionApi.detail(current.transactionId, current.transactionDateTime, current.rootTransactionDateTime);
        if (detailVisible.value && detailOperation.value?.transactionId === current.transactionId) detail.value = latest;
    }
}, () => !loading.value && !captureVisible.value && !voidVisible.value && !refundVisible.value);

  watch(locale, () => void loadDictionaries());

  async function loadDictionaries() {
    const fallbackTypes = fallbackTransactionTypeOptions(t);
    const fallbackStatuses = fallbackTransactionStatusOptions(t);
    const fallbackPaymentMethods = fallbackPaymentMethodOptions(t);
    const fallbackCardBrands = fallbackCardBrandOptions();
    const fallbackSettlements = fallbackStatusOptions(t, 'settlement');
    transactionTypeOptions.value = fallbackTypes;
    transactionStatusOptions.value = fallbackStatuses;
    activeTransactionTypeOptions.value = [];
    activeTransactionStatusOptions.value = [];
    paymentMethodOptions.value = fallbackPaymentMethods;
    cardBrandOptions.value = fallbackCardBrands;
    activePaymentMethodOptions.value = [];
    activeCardBrandOptions.value = [];
    settlementStatusOptions.value = fallbackSettlements;
    timezoneOptions.value = ensureTransactionTimezoneOptions([]);
    try {
      const [types, statuses, methods, brands, settlements, timezones] = await Promise.all([
        loadTransactionDictOptions('transaction_type', String(locale.value || 'zh-CN')).catch(
          () => [],
        ),
        loadTransactionDictOptions('transaction_status', String(locale.value || 'zh-CN')).catch(
          () => [],
        ),
        loadTransactionDictOptions(
          'acquiring_payment_method',
          String(locale.value || 'zh-CN'),
        ).catch(() => []),
        loadTransactionDictOptions('card_brand', String(locale.value || 'zh-CN')).catch(() => []),
        loadTransactionDictOptions('settlement_status', String(locale.value || 'zh-CN')).catch(
          () => [],
        ),
        loadTransactionDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []),
      ]);
      activeTransactionTypeOptions.value = mergeTransactionDictOptions(types, []);
      activeTransactionStatusOptions.value = mergeTransactionDictOptions(statuses, []);
      activePaymentMethodOptions.value = mergeTransactionDictOptions(methods, []);
      activeCardBrandOptions.value = mergeTransactionDictOptions(brands, []);
      transactionTypeOptions.value = mergeTransactionDictOptions(
        activeTransactionTypeOptions.value,
        fallbackTypes,
      );
      transactionStatusOptions.value = mergeTransactionDictOptions(
        activeTransactionStatusOptions.value,
        fallbackStatuses,
      );
      paymentMethodOptions.value = mergeTransactionDictOptions(
        activePaymentMethodOptions.value,
        fallbackPaymentMethods,
      );
      cardBrandOptions.value = mergeTransactionDictOptions(
        activeCardBrandOptions.value,
        fallbackCardBrands,
      );
      settlementStatusOptions.value = mergeTransactionDictOptions(settlements, fallbackSettlements);
      timezoneOptions.value = ensureTransactionTimezoneOptions(timezones);
    } catch (error) {
      console.warn('[merchant-portal] transaction dictionaries unavailable', safeErrorType(error));
    }
  }

  let dataVersion = 0;
  async function loadData() {
    const version = ++dataVersion;
    loading.value = true;
    try {
      const payload = buildQueryPayload();
      const operationSearch = await transactionApi.searchOperations(payload);
      if (version !== dataVersion) return;
      rows.value = operationSearch.page?.records || [];
      total.value = operationSearch.page?.total || 0;
      summary.value = operationSearch.summary;
    } catch (error: unknown) {
      if (version !== dataVersion) return;
      rows.value = [];
      total.value = 0;
      summary.value = undefined;
      ElMessage.error(userFacingErrorMessage(error, t('transaction.order.loadFailed')));
    } finally {
      if (version === dataVersion) loading.value = false;
    }
  }

  function applyQuery() {
    page.value = 1;
    loadData();
  }

  function resetQuery() {
    Object.keys(query).forEach((key) => delete (query as Record<string, unknown>)[key]);
    const defaultTimeZone = merchantDefaultTimeZone();
    query.queryTimeZone = defaultTimeZone;
    quickPreset.value = 'today';
    dateRange.value = defaultTransactionTodayRange(defaultTimeZone);
    applyQuery();
  }

  async function handleExport() {
    exporting.value = true;
    try {
      const task = await submitTransactionExport(buildQueryPayload());
      ElMessage.success(t('exportTask.submitted', { taskNo: task.taskNo }));
    } catch (error: unknown) {
      ElMessage.error(userFacingErrorMessage(error, t('transaction.order.exportFailed')));
    } finally {
      exporting.value = false;
    }
  }

  async function openDetail(row: TransactionOperation) {
    const transactionId = row.transactionId;
    const transactionDateTime = row.transactionDateTime;
    const rootTransactionDateTime = row.rootTransactionDateTime;
    if (!transactionId || !transactionDateTime || !rootTransactionDateTime) return;
    detailOperation.value = row;
    detailVisible.value = true;
    detailLoading.value = true;
    try {
      detail.value = await transactionApi.detail(
        transactionId,
        transactionDateTime,
        rootTransactionDateTime,
      );
    } catch (error: unknown) {
      detail.value = undefined;
      detailOperation.value = null;
      ElMessage.error(userFacingErrorMessage(error, t('transaction.order.detailFailed')));
    } finally {
      detailLoading.value = false;
    }
  }

  async function openRefund(row: TransactionOperation) {
    if (refundLoading.value || refundSaving.value) return;
    activeActionRow.value = row;
    refundForm.amount = null;
    refundForm.currency = labelCurrency(row);
    refundForm.mode = 'PARTIAL';
    refundForm.reason = '';
    refundForm.description = '';
    refundContext.value = null;
    refundLoading.value = true;
    refundVisible.value = true;
    try {
      refundContext.value = await transactionApi.refundContext(row.transactionId!, {
        transactionDateTime: row.transactionDateTime!,
        rootTransactionDateTime: row.rootTransactionDateTime!,
      });
      refundForm.currency = refundContext.value.currency;
    } catch {
      ElMessage.error(t('refundForm.contextFailed'));
    } finally {
      refundLoading.value = false;
    }
  }

  function openCapture(row: TransactionOperation) {
    activeActionRow.value = row;
    captureForm.amount = normalizeDecimalAmount(row.availableCaptureAmount ?? 0);
    captureForm.mode = 'PARTIAL';
    captureForm.reason = '';
    captureForm.description = '';
    captureVisible.value = true;
  }

  function openVoid(row: TransactionOperation) {
    activeActionRow.value = row;
    voidForm.reason = '';
    voidForm.description = '';
    voidVisible.value = true;
  }

  async function submitRefund() {
    if (!activeActionRow.value || refundSaving.value || refundLoading.value) return;
    if (!(await refundFieldsRef.value?.validate()) || refundSaving.value) return;
    if (refundForm.amount == null) return;
    const transactionId = activeActionRow.value.transactionId;
    if (!transactionId) return;
    refundSaving.value = true;
    try {
      const result = await transactionApi.refund(transactionId, {
        amount: refundForm.amount,
        currency: refundForm.currency || labelCurrency(activeActionRow.value),
        reason: [t(`refundForm.reasons.${refundForm.reason}`), refundForm.description.trim()]
          .filter(Boolean)
          .join(' - '),
        reasonCode: refundForm.reason,
        refundDescription: refundForm.description.trim(),
        transactionDateTime: activeActionRow.value.transactionDateTime!,
        rootTransactionDateTime: activeActionRow.value.rootTransactionDateTime!,
      });
      ElMessage({ type: result.status === 'SUCCESS' ? 'success' : result.status === 'FAILED' ? 'error' : 'info', message: t(`transactionAction.stages.${refundProgressKey(result)}`) });
      refundVisible.value = false;
      await loadData();
    } catch (error: unknown) {
      ElMessage.error(userFacingErrorMessage(error, t('transaction.order.refundFailed')));
    } finally {
      refundSaving.value = false;
    }
  }

  async function submitCapture() {
    if (!activeActionRow.value?.transactionId) return;
    if (actionSaving.value || !(await captureFieldsRef.value?.validate()) || actionSaving.value) return;
    actionSaving.value = true;
    try {
      const action =
        activeActionRow.value.transactionType === 'PRE_AUTHORIZATION'
          ? transactionApi.preAuthCompletion
          : transactionApi.capture;
      const result = await action(activeActionRow.value.transactionId, {
        reasonCode: captureForm.reason,
              operationDescription: captureForm.description.trim(),
              amount: captureForm.amount!,
              currency: labelCurrency(activeActionRow.value),
        transactionDateTime: activeActionRow.value.transactionDateTime!,
        rootTransactionDateTime: activeActionRow.value.rootTransactionDateTime!,
      });
      if (result.status !== 'SUCCESS') ElMessage({ type: result.status === 'FAILED' ? 'error' : 'info', message: t(result.status === 'FAILED' ? 'transactionAction.requestFailed' : 'transactionAction.stages.unknown') });
      else ElMessage.success(
        t(
          `transaction.order.${
            activeActionRow.value.transactionType === 'PRE_AUTHORIZATION'
              ? 'preAuthCompletionSuccess'
              : 'captureSuccess'
          }`,
        ),
      );
      captureVisible.value = false;
      await loadData();
    } catch (error: unknown) {
      ElMessage.error(
        userFacingErrorMessage(
          error,
          t(
            `transaction.order.${
              activeActionRow.value.transactionType === 'PRE_AUTHORIZATION'
                ? 'preAuthCompletionFailed'
                : 'captureFailed'
            }`,
          ),
        ),
      );
    } finally {
      actionSaving.value = false;
    }
  }

  async function submitVoid() {
    if (!activeActionRow.value?.transactionId) return;
    if (actionSaving.value || !(await voidFieldsRef.value?.validate()) || actionSaving.value) return;
    actionSaving.value = true;
    try {
      const result = await transactionApi.voidPayment(activeActionRow.value.transactionId, {
        reasonCode: voidForm.reason,
              operationDescription: voidForm.description.trim(),
        transactionDateTime: activeActionRow.value.transactionDateTime!,
        rootTransactionDateTime: activeActionRow.value.rootTransactionDateTime!,
      });
      if (result.status === 'SUCCESS') ElMessage.success(t('transaction.order.voidSuccess'));
      else ElMessage({ type: result.status === 'FAILED' ? 'error' : 'info', message: t(result.status === 'FAILED' ? 'transactionAction.requestFailed' : 'transactionAction.stages.unknown') });
      voidVisible.value = false;
      await loadData();
    } catch (error: unknown) {
      ElMessage.error(userFacingErrorMessage(error, t('transaction.order.voidFailed')));
    } finally {
      actionSaving.value = false;
    }
  }

  function buildQueryPayload() {
    const payload: TransactionPageQuery = {
      ...query,
      pageNo: page.value,
      pageSize: pageSize.value,
      queryTimeZone: query.queryTimeZone || merchantDefaultTimeZone(),
      ...splitDateRange(currentDateRange()),
    };
    return payload;
  }

  function currentDateRange() {
    dateRange.value = resolveTransactionQueryRange(
      dateRange.value,
      quickPreset.value,
      query.queryTimeZone,
    );
    return dateRange.value;
  }

  function merchantDefaultTimeZone() {
    return auth.session?.account?.timezone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
  }

  function defaultCurrency(row?: TransactionOrder | TransactionOperation | null) {
    return row?.labelCurrency || '';
  }

  function orderDisplayAmount(row?: TransactionOrder | TransactionOperation | null) {
    const currentAmount = row && !isTransactionOperation(row) ? row.currentAmount : undefined;
    return currentAmount ?? row?.labelAmount;
  }

  function fullLabelAmount(row: TransactionOperation) {
    return ['AUTHORIZATION', 'PRE_AUTHORIZATION'].includes(row.transactionType || '')
      ? row.authorizedAmount ?? row.labelAmount ?? '0' : row.labelAmount ?? '0';
  }

  function labelCurrency(row?: TransactionOrder | TransactionOperation | null) {
    return row?.labelCurrency || '';
  }

  function statusTag(status?: string, options: TransactionDictOption[] = []) {
    return statusTagType(status, options);
  }

  function lifecycleText(row?: TransactionOperation | null) {
    const value = row?.transactionStatus;
    return tagText(transactionStatusOptions.value, value);
  }

  function canRefundRow(row: TransactionOperation) {
    return row.availableActions?.includes('REFUND') === true;
  }

  function canCaptureRow(row: TransactionOperation) {
    return row.availableActions?.includes(row.transactionType === 'PRE_AUTHORIZATION' ? 'PRE_AUTH_COMPLETION' : 'CAPTURE') === true;
  }

  function captureActionText(row: TransactionOperation) {
    return t(
      `transaction.order.${row.transactionType === 'PRE_AUTHORIZATION' ? 'preAuthCompletion' : 'capture'}`,
    );
  }

  function canVoidRow(row: TransactionOperation) {
    return row.availableActions?.includes('VOID') === true;
  }

  function labelAmountFor(
    row?: TransactionOperation | null,
    labelAmount?: number | string | null,
  ) {
    if (!row) {
      return '0';
    }
    return labelAmount ?? row.labelAmount ?? '0';
  }

  function operationTimestamp(item: TransactionOperation) {
    return formatDateTimeFromSourceTimeZone(
      item.operationTime || item.transactionDateTime,
      'Asia/Shanghai',
      query.queryTimeZone,
    );
  }

  function countText(count: number | string) {
    return t('transaction.order.countUnit', { count: Number(count || 0).toLocaleString() });
  }

  function ratioText(count: number, totalCount: number) {
    const ratio = totalCount > 0 ? (count / totalCount) * 100 : 0;
    return `${t('transaction.order.ratio')} ${ratio.toFixed(2)}%`;
  }

  function rateTone(count: number, totalCount: number, reverse = false) {
    const ratio = totalCount > 0 ? (count / totalCount) * 100 : 0;
    if (reverse) {
      if (ratio >= 30) return 'danger';
      if (ratio >= 10) return 'warning';
      return 'success';
    }
    if (ratio >= 80) return 'success';
    if (ratio >= 60) return 'primary';
    if (ratio >= 40) return 'warning';
    return 'danger';
  }

  function amountPills(amountSummaries: TransactionAmountSummary[], limit = true) {
    const visibleAmounts = limit ? amountSummaries.slice(0, 4) : amountSummaries;
    return visibleAmounts.map((item) => ({
      key: item.currency || '-',
      currency: item.currency || '-',
      amount: moneyText(item.amount ?? 0, undefined, item.currencyExponent),
    }));
  }

  function paymentSummaryLabel(item: TransactionPaymentMethodSummary) {
    const method = tagText(paymentMethodOptions.value, item.paymentMethod);
    const brand = tagText(cardBrandOptions.value, item.paymentBrand);
    return brand && brand !== '-' ? brand : method;
  }

  function systemOrderNo(row?: TransactionOrder | TransactionOperation | null) {
    if (!row) {
      return '-';
    }
    if (isTransactionOperation(row)) {
      return row.transactionId || '-';
    }
    return row.latestTransactionId || row.rootTransactionId || '-';
  }

  function isTransactionOperation(
    row: TransactionOrder | TransactionOperation,
  ): row is TransactionOperation {
    return Object.prototype.hasOwnProperty.call(row, 'transactionId');
  }

  async function copyOrderNo(value?: string) {
    if (!value || value === '-') {
      return;
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        legacyCopyText(value);
      }
      ElMessage.success(t('common.copySuccess'));
    } catch {
      ElMessage.error(t('common.copyFailed'));
    }
  }

  function legacyCopyText(value: string) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  function paymentLogos(
    row?: Pick<
      TransactionOrder | TransactionOperation | TransactionPaymentMethodSummary,
      'paymentMethod' | 'paymentBrand'
    > | null,
  ): PaymentLogoKey[] {
    const paymentOption = paymentMethodOptions.value.find(
      (item) => item.value === row?.paymentMethod,
    );
    const brandOption = cardBrandOptions.value.find((item) => item.value === row?.paymentBrand);
    return transactionPaymentLogoKeys(
      row?.paymentMethod,
      row?.paymentBrand,
      paymentOption,
      brandOption,
    );
  }

  function assetPaymentLogos(
    row?: Pick<
      TransactionOrder | TransactionOperation | TransactionPaymentMethodSummary,
      'paymentMethod' | 'paymentBrand'
    > | null,
  ): PaymentLogoKey[] {
    return paymentLogos(row).filter((key) => Boolean(getPaymentLogos([key])[0]?.asset));
  }
</script>

<style scoped>
  .merchant-transaction-page {
    --transaction-accent: #1d75d8;
    --transaction-accent-soft: #eaf3ff;
    --transaction-green: #0d9488;
    --transaction-red: #ef4444;
    --transaction-amber: #f59e0b;
    --transaction-control-height: 32px;
    --transaction-border: #dfe7f1;
    --transaction-soft-line: #edf2f7;
    --transaction-table-text: #344054;
    gap: 10px;
  }

  .transaction-timeline-item span,
  .transaction-timeline-item small {
    color: #667085;
    font-size: 12px;
  }

  .transaction-result-strip {
    padding: 0;
    overflow: hidden;
  }

  .transaction-result-strip__summary {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(360px, 1fr);
    border: 1px solid var(--transaction-border);
    border-radius: 6px;
    background: #ffffff;
    box-shadow: var(--merchant-card-shadow-soft);
    overflow: hidden;
  }

  .transaction-result-row,
  .transaction-timeline-item {
    display: grid;
    min-width: 0;
  }

  .transaction-result-row {
    grid-template-columns: minmax(128px, 0.25fr) minmax(0, 1fr);
    min-height: 34px;
    border-right: 1px solid var(--transaction-soft-line);
    border-bottom: 1px solid var(--transaction-soft-line);
  }

  .transaction-result-row:nth-child(2n) {
    border-right: 0;
  }

  .transaction-result-row:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  .transaction-result-row__label {
    display: flex;
    align-items: center;
    min-width: 0;
    border-right: 1px solid #e8eef7;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .transaction-result-row__label span {
    display: block;
    width: 100%;
    min-width: 0;
    border-left: 3px solid #2563eb;
    padding: 6px 9px 6px 10px;
    overflow: hidden;
    color: #334155;
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .transaction-result-row--success .transaction-result-row__label {
    background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%);
  }

  .transaction-result-row--success .transaction-result-row__label span {
    border-left-color: #22c55e;
  }

  .transaction-result-row--danger .transaction-result-row__label {
    background: linear-gradient(180deg, #fff7ed 0%, #fff1f2 100%);
  }

  .transaction-result-row--danger .transaction-result-row__label span {
    border-left-color: #f97316;
  }

  .transaction-result-row--method .transaction-result-row__label {
    background: linear-gradient(180deg, #f0f9ff 0%, #eff6ff 100%);
  }

  .transaction-result-row--method .transaction-result-row__label span {
    border-left-color: #0ea5e9;
  }

  .transaction-result-row__content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px 6px;
    min-width: 0;
    padding: 5px 10px;
  }

  .transaction-result-pill,
  .transaction-money-pill,
  .transaction-method-pill {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    height: 22px;
    border-radius: 4px;
    white-space: nowrap;
  }

  .transaction-result-pill {
    border: 1px solid rgba(37, 99, 235, 0.22);
    padding: 0 7px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .transaction-result-row--success .transaction-result-pill--count {
    border-color: rgba(22, 163, 74, 0.24);
    background: #f0fdf4;
    color: #16a34a;
  }

  .transaction-result-row--danger .transaction-result-pill--count {
    border-color: rgba(249, 115, 22, 0.28);
    background: #fff7ed;
    color: #ef4444;
  }

  .transaction-result-pill--rate {
    border-color: rgba(100, 116, 139, 0.2);
    background: rgba(255, 255, 255, 0.72);
    color: #475569;
    font-size: 11px;
  }

  .transaction-result-pill--rate.is-success {
    border-color: rgba(22, 163, 74, 0.22);
    background: rgba(240, 253, 244, 0.82);
    color: #15803d;
  }

  .transaction-result-pill--rate.is-danger {
    border-color: rgba(239, 68, 68, 0.22);
    background: rgba(254, 242, 242, 0.82);
    color: #dc2626;
  }

  .transaction-result-pill--rate.is-warning {
    border-color: rgba(245, 158, 11, 0.28);
    background: rgba(255, 251, 235, 0.86);
    color: #b45309;
  }

  .transaction-result-pill--rate.is-primary {
    border-color: rgba(37, 99, 235, 0.24);
    background: rgba(239, 246, 255, 0.84);
    color: #2563eb;
  }

  .transaction-money-pill {
    overflow: hidden;
    border: 1px solid #dbeafe;
    background: #f8fbff;
  }

  .transaction-money-pill__currency {
    align-self: stretch;
    display: inline-flex;
    align-items: center;
    border-right: 1px solid #dbeafe;
    padding: 0 5px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 10px;
    font-weight: 600;
  }

  .transaction-money-pill b {
    padding: 0 6px;
    color: #1f2937;
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .transaction-method-pill {
    flex-wrap: wrap;
    gap: 5px;
    height: auto;
    min-height: 24px;
    border: 1px solid #edf2f7;
    padding: 1px 5px;
    background: #ffffff;
  }

  .transaction-method-pill__logos {
    min-width: 28px;
    max-width: 44px;
  }

  .transaction-method-pill__logos :deep(.payment-logo-mark) {
    --payment-logo-height: 14px;
  }

  .transaction-method-pill__text,
  .transaction-method-pill__count,
  .transaction-result-muted {
    color: #64748b;
    font-size: 11px;
  }

  .transaction-method-pill__text {
    color: #334155;
    font-weight: 600;
  }

  .transaction-method-pill__count {
    color: #1f2937;
  }

  .transaction-money-pill--method {
    height: 20px;
  }

  .transaction-filter-card {
    padding: 12px 16px;
  }

  .transaction-search-form {
    display: grid;
    width: 100%;
  }

  .transaction-search-form__fields {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 10px 18px;
    width: 100%;
  }

  .transaction-search-form__fields :deep(.el-form-item),
  .transaction-time-form-item {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    flex: 0 1 320px;
    align-items: center;
    gap: 8px;
    margin: 0;
    min-width: 0;
  }

  .transaction-search-form__fields :deep(.el-form-item.transaction-time-form-item) {
    flex: 1 1 780px;
    max-width: 100%;
  }

  .transaction-search-form :deep(.el-form-item__label) {
    justify-content: flex-end;
    width: 92px;
    padding-right: 0;
  }

  .transaction-search-form :deep(.el-form-item__content) {
    width: 100%;
    min-width: 0;
    margin-left: 0 !important;
  }

  .transaction-search-form :deep(.el-input),
  .transaction-search-form :deep(.el-select) {
    width: var(--merchant-search-control-width);
    max-width: 100%;
  }

  .transaction-time-form-item :deep(.transaction-time-range-filter__timezone),
  .transaction-time-form-item :deep(.transaction-time-range-filter__picker),
  .transaction-time-form-item :deep(.el-date-editor) {
    width: 100%;
  }

  .transaction-brand-select__prefix :deep(.payment-logo-group),
  .transaction-brand-option__logo :deep(.payment-logo-group),
  .transaction-payment-cell__logos :deep(.payment-logo-group),
  .transaction-detail-payment :deep(.payment-logo-group) {
    gap: 4px;
  }

  .transaction-brand-select__prefix :deep(.payment-logo-mark),
  .transaction-brand-option__logo :deep(.payment-logo-mark),
  .transaction-payment-cell__logos :deep(.payment-logo-mark) {
    --payment-logo-height: 16px;
  }

  .transaction-brand-option {
    display: grid;
    grid-template-columns: 66px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .transaction-brand-option span {
    min-width: 0;
    overflow: hidden;
    color: #1f2937;
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .transaction-brand-option small {
    color: #94a3b8;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 11px;
  }

  .transaction-time-form-item :deep(.el-form-item__content) {
    width: 100%;
  }

  .transaction-search-form__fields :deep(.el-form-item.transaction-search-actions) {
    display: block;
    flex: 1 1 160px;
    align-self: end;
    margin-left: auto;
    min-width: 160px;
    width: auto;
  }

  .transaction-search-actions :deep(.el-form-item__content) {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    margin-left: 0 !important;
  }

  .transaction-table-card {
    overflow: hidden;
  }

  .transaction-table-head {
    display: flex;
  }

  .transaction-table-toolbar {
    flex: 0 0 auto;
  }

  .transaction-table-card :deep(.el-table td.el-table__cell) {
    color: var(--transaction-table-text);
    font-size: 12px;
    font-weight: 400;
  }

  .transaction-timeline-item strong {
    color: var(--merchant-ink);
    font-weight: 500;
  }

  .transaction-money-text,
  .transaction-rate-text,
  .transaction-card-bin,
  .transaction-auth-code {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    white-space: nowrap;
  }

  .transaction-copy-link {
    display: inline-block;
    max-width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: #2563eb;
    cursor: pointer;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .transaction-copy-link:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }

  .transaction-copy-link:disabled {
    color: #94a3b8;
    cursor: default;
    text-decoration: none;
  }

  .transaction-money-text {
    color: #0f766e;
    font-weight: 400;
  }

  .transaction-money-text--label {
    color: #475569;
  }

  .transaction-rate-text,
  .transaction-card-bin,
  .transaction-auth-code {
    color: #334155;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
    font-weight: 400;
  }

  .transaction-payment-logo-cell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 22px;
    min-width: 54px;
  }

  .transaction-payment-cell__logos {
    min-height: 18px;
  }

  .transaction-capability-tag {
    --capability-color: #64748b;
    --capability-border: #cbd5e1;
    --capability-background: #f8fafc;
    gap: 6px;
    justify-content: center;
    min-width: 66px;
    height: 24px;
    border-color: var(--capability-border) !important;
    border-radius: 3px;
    background: var(--capability-background) !important;
    color: var(--capability-color) !important;
    font-weight: 700;
    letter-spacing: 0;
  }

  .transaction-capability-tag::before {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    content: '';
    opacity: 0.55;
  }

  .transaction-capability-tag--three-ds {
    --capability-color: #397a73;
    --capability-border: #b4d7d1;
    --capability-background: #f3faf8;
  }
  .transaction-capability-tag--dcc {
    --capability-color: #5270a6;
    --capability-border: #c5d3ea;
    --capability-background: #f5f8fd;
  }
  .transaction-capability-tag--edc {
    --capability-color: #92703b;
    --capability-border: #dfcfac;
    --capability-background: #fcfaf4;
  }
  .transaction-capability-tag--three-ds.is-enabled {
    --capability-color: #0f766e;
    --capability-border: #5eead4;
    --capability-background: #ecfdf5;
  }
  .transaction-capability-tag--dcc.is-enabled {
    --capability-color: #1d4ed8;
    --capability-border: #93c5fd;
    --capability-background: #eff6ff;
  }
  .transaction-capability-tag--edc.is-enabled {
    --capability-color: #b45309;
    --capability-border: #fcd34d;
    --capability-background: #fffbeb;
  }

  .transaction-capability-tag.is-enabled::before {
    opacity: 1;
    box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 18%, transparent);
  }

  .transaction-detail-status-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    height: 24px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 650;
    letter-spacing: 0;
  }

  .transaction-detail-status-tag :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .transaction-detail-status-tag--hero {
    min-width: 68px;
    height: 26px;
    border-radius: 13px;
  }

  .transaction-drawer-title {
    margin: 0 0 10px;
    color: var(--merchant-ink);
    font-size: 14px;
    font-weight: 600;
    line-height: 22px;
    letter-spacing: 0;
  }

  .transaction-detail-drawer :deep(.el-drawer__header) {
    padding: 16px 24px 13px;
    margin-bottom: 0;
    border-bottom: 1px solid #edf2f7;
  }

  .transaction-detail-drawer :deep(.el-drawer__title) {
    color: var(--merchant-ink);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0;
  }

  .transaction-detail-drawer :deep(.el-drawer__body) {
    padding: 0 24px 24px;
  }

  .transaction-detail-shell {
    display: grid;
    min-width: 0;
  }

  .transaction-detail-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 24px;
    padding: 18px 0;
    border-bottom: 1px solid #e8edf3;
  }

  .transaction-detail-hero__identity,
  .transaction-detail-hero__result {
    display: grid;
    min-width: 0;
    gap: 7px;
  }

  .transaction-detail-hero__identity > strong {
    overflow: hidden;
    color: #172033;
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .transaction-detail-eyebrow,
  .transaction-detail-grid dt,
  .transaction-detail-metrics dt {
    color: #64748b;
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
  }

  .transaction-detail-hero__meta {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 10px;
    color: #64748b;
    font-size: 12px;
    line-height: 20px;
  }

  .transaction-detail-hero__separator {
    width: 1px;
    height: 12px;
    background: #d8e0ea;
  }

  .transaction-detail-hero__result {
    justify-items: end;
  }

  .transaction-detail-hero__result > strong {
    color: #172033;
    font-size: 24px;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    line-height: 32px;
  }

  .transaction-detail-section {
    min-width: 0;
    padding: 16px 0;
    border-bottom: 1px solid #e8edf3;
  }

  .transaction-detail-section:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .transaction-detail-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0;
    overflow: hidden;
    border: 1px solid #e5eaf1;
    border-radius: 6px;
    background: #f8fafc;
  }

  .transaction-detail-metrics > div {
    min-width: 0;
    padding: 11px 14px;
    border-right: 1px solid #e5eaf1;
  }

  .transaction-detail-metrics > div:last-child {
    border-right: 0;
  }

  .transaction-detail-metrics dd {
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

  .transaction-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 0;
    border-top: 1px solid #e8edf3;
  }

  .transaction-detail-grid > div {
    display: grid;
    grid-template-columns: 118px minmax(0, 1fr);
    align-items: center;
    gap: 16px;
    min-width: 0;
    padding: 11px 14px;
    border-bottom: 1px solid #e8edf3;
  }

  .transaction-detail-grid dd {
    min-width: 0;
    margin: 0;
    color: #1f2937;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.45;
    overflow-wrap: anywhere;
    text-align: left;
  }

  .transaction-detail-code,
  .transaction-timeline-item code {
    color: #334155;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
  }

  .transaction-detail-payment {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .transaction-timeline-panel {
    padding-right: 2px;
    padding-left: 2px;
  }

  .transaction-timeline-panel :deep(.el-timeline) {
    padding: 2px 0 0 5px;
  }

  .transaction-timeline-panel :deep(.el-timeline-item__timestamp) {
    color: #94a3b8;
    font-size: 12px;
  }

  .transaction-timeline-item {
    gap: 6px;
    padding: 0 0 6px;
  }

  .transaction-timeline-item__head {
    display: grid;
    grid-template-columns: minmax(64px, auto) 64px minmax(100px, 1fr);
    align-items: center;
    min-width: 0;
    gap: 8px;
  }

  .transaction-timeline-item__head strong {
    color: #263244;
    font-size: 13px;
    font-weight: 600;
  }

  .transaction-timeline-item__amount {
    justify-self: end;
    color: #263244;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    white-space: nowrap;
  }

  .transaction-timeline-item code {
    overflow-wrap: anywhere;
  }

  @media (min-width: 1680px) {
    .transaction-search-form__fields {
      gap: 10px 18px;
    }
  }

  @media (max-width: 1180px) {
    .transaction-result-strip__summary {
      grid-template-columns: minmax(0, 3fr) minmax(340px, 2fr);
    }

    .transaction-search-form__fields :deep(.el-form-item.transaction-search-actions) {
      flex-basis: 100%;
    }

    .transaction-time-form-item {
      flex-basis: 100%;
      min-width: 0;
    }
  }

  @media (max-width: 760px) {
    .merchant-transaction-page {
      gap: 12px;
    }

    .transaction-detail-hero,
    .transaction-detail-grid,
    .transaction-detail-metrics {
      grid-template-columns: 1fr;
    }

    .transaction-detail-drawer :deep(.el-drawer__header) {
      padding: 16px 18px 13px;
    }

    .transaction-detail-drawer :deep(.el-drawer__body) {
      padding: 0 18px 22px;
    }

    .transaction-detail-hero {
      align-items: start;
      gap: 18px;
      padding: 20px 0;
    }

    .transaction-detail-hero__identity > strong {
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .transaction-detail-hero__meta {
      flex-wrap: wrap;
    }

    .transaction-detail-hero__result {
      justify-items: start;
    }

    .transaction-detail-metrics > div {
      border-right: 0;
      border-bottom: 1px solid #e5eaf1;
    }

    .transaction-detail-metrics > div:last-child {
      border-bottom: 0;
    }

    .transaction-detail-grid > div {
      border-right: 0;
    }

    .transaction-timeline-item__head {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .transaction-timeline-item__status {
      grid-column: 2;
      grid-row: 1;
    }

    .transaction-timeline-item__amount {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .transaction-search-form {
      padding-bottom: 0;
    }

    .transaction-result-strip__summary,
    .transaction-result-row {
      grid-template-columns: 1fr;
    }

    .transaction-result-row,
    .transaction-result-row:nth-child(2n) {
      border-right: 0;
    }

    .transaction-result-row:nth-last-child(-n + 2) {
      border-bottom: 1px solid var(--transaction-soft-line);
    }

    .transaction-result-row:last-child {
      border-bottom: 0;
    }

    .transaction-result-row__label {
      border-right: 0;
    }

    .transaction-search-form__fields :deep(.el-form-item),
    .transaction-time-form-item {
      display: grid;
      grid-template-columns: 1fr;
      flex-basis: 100%;
      gap: 6px;
      width: 100%;
    }

    .transaction-search-form :deep(.el-form-item__label) {
      justify-content: flex-start;
      width: 100%;
      min-height: auto;
      padding: 0;
      line-height: 18px;
      text-align: left;
    }

    .transaction-search-form :deep(.el-form-item__content) {
      width: 100%;
      margin-left: 0 !important;
    }

    .transaction-search-actions :deep(.el-form-item__content) {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      justify-content: stretch;
    }

    .transaction-search-form__fields :deep(.el-form-item.transaction-search-actions) {
      flex-basis: 100%;
      min-width: 0;
    }

    .transaction-search-actions :deep(.el-button) {
      width: 100%;
    }

    .pagination-container {
      justify-content: flex-start;
      overflow-x: auto;
    }
  }
</style>

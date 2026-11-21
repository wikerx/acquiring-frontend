<template>
    <div class="app-container transaction-page transaction-operation-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.search.title')"
            :description="t('transaction.search.description')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            inline-time
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.merchantId')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantOrderNo')">
                <el-input v-model.trim="query.merchantOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionId')">
                <el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.channelOrderNo')">
                <el-input v-model.trim="query.channelOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionType')">
                <el-select v-model="query.transactionType" :placeholder="t('common.pleaseSelect')" clearable>
                    <template #prefix><TransactionTypeDisplay v-if="query.transactionType" :value="query.transactionType" icon-only /></template>
                    <el-option v-for="item in activeTypeOptions" :key="item.value" :label="item.label" :value="item.value"><TransactionTypeDisplay :value="item.value" :label="item.label" align="start" /></el-option>
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionStatus')">
                <el-select v-model="query.transactionStatus" :placeholder="t('common.pleaseSelect')" clearable>
                    <template #prefix><TransactionStatusDisplay v-if="query.transactionStatus" :value="query.transactionStatus" icon-only /></template>
                    <el-option v-for="item in activeStatusOptions" :key="item.value" :label="item.label" :value="item.value"><TransactionStatusDisplay :value="item.value" :label="item.label" align="start" /></el-option>
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.fields.channelCode')">
                <el-select v-model="query.channelCode" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in channelOptions" :key="item.channelCode" :label="item.channelName ? `${item.channelCode} / ${item.channelName}` : item.channelCode" :value="item.channelCode" />
                </el-select>
            </el-form-item>
            <template #advanced>
                <el-form-item :label="t('transaction.fields.paymentMethod')">
                    <el-select v-model="paymentQueryValue" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <template #prefix><PaymentLogoGroup v-if="selectedPaymentQueryOption?.logoKeys.length" :keys="selectedPaymentQueryOption.logoKeys" size="sm" :wrap="false" /></template>
                        <el-option v-for="item in paymentQueryOptions" :key="item.value" :label="item.label" :value="item.value">
                            <div class="transaction-brand-option">
                                <PaymentLogoGroup v-if="item.logoKeys.length" :keys="item.logoKeys" size="sm" :wrap="false" class="transaction-brand-option__logo" />
                                <span>{{ item.label }}</span>
                                <small>{{ item.displayCode }}</small>
                            </div>
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.cardBin')">
                    <el-input v-model.trim="query.cardBin" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.merchantResponseCode')">
                    <el-input v-model.trim="query.merchantResponseCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.channelResponseCode')">
                    <el-input v-model.trim="query.channelResponseCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.authCode')">
                    <el-input v-model.trim="query.authCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.acquirerReferenceNo')">
                    <el-input v-model.trim="query.acquirerReferenceNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.channelMatchStatus')">
                    <TransactionStageStatusSelect v-model="query.channelMatchStatus" domain="matching" :options="channelMatchStatusOptions" :placeholder="t('common.pleaseSelect')" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.reconciliationStatus')">
                    <TransactionStageStatusSelect v-model="query.reconciliationStatus" domain="reconciliation" :options="reconciliationStatusOptions" :placeholder="t('common.pleaseSelect')" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.settlementStatus')">
                    <TransactionStageStatusSelect v-model="query.settlementStatus" domain="settlement" :options="settlementStatusOptions" :placeholder="t('common.pleaseSelect')" />
                </el-form-item>
            </template>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter v-model="dateRange" v-model:time-zone="query.queryTimeZone" v-model:preset="quickPreset" :timezone-options="timezoneOptions" default-preset="today" />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar
            class="transaction-operation-summary"
            :items="summaryItems"
            @toggle-search="showSearch = !showSearch"
            @refresh="loadData"
        />

        <el-row class="mb8 transaction-table-toolbar">
            <el-col :span="1.5">
                <el-button type="warning" plain :icon="Download" size="small" :loading="exporting" @click="handleExport" v-hasPermi="'transaction:operation:export'">
                    {{ t('common.export') }}
                </el-button>
            </el-col>
        </el-row>

        <StandardTable table-key="transaction-operation-v2" v-loading="loading" :data="rows" row-key="transactionId" size="small" class="transaction-page__table">
            <el-table-column :label="t('transaction.fields.transactionId')" min-width="214" fixed="left" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantId')" min-width="130" align="center">
                <template #default="{ row }">
                    <div v-if="row.merchantId" class="transaction-page__merchant-cell">
                        <button class="transaction-page__link" type="button" @click="openMerchant(row.merchantId)">{{ row.merchantId }}</button>
                        <CopyableText :value="row.merchantId" :label="t('transaction.fields.merchantId')" icon-only />
                    </div>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantOrderNo')" min-width="190" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionType')" width="176" align="center">
                <template #default="{ row }"><TransactionTypeDisplay :value="row.transactionType" :label="tagText(typeOptions, row.transactionType)" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.labelAmount')" width="176" align="center">
                <template #default="{ row }"><CurrencyAmountDisplay :amount="row.labelAmount" :currency="row.labelCurrency" :exponent="row.labelCurrencyExponent" :locale="String(locale)" align="center" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionAmount')" width="176" align="center">
                <template #default="{ row }"><CurrencyAmountDisplay :amount="row.transactionAmount" :currency="row.transactionCurrency" :exponent="row.currencyExponent" :locale="String(locale)" align="center" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionRate')" width="128" align="center">
                <template #default="{ row }"><span class="transaction-page__money-cell">{{ rateText(row.transactionRate) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionStatus')" width="136" align="center">
                <template #default="{ row }"><TransactionStatusDisplay :value="row.transactionStatus" :label="tagText(statusOptions, row.transactionStatus)" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelMatchStatus')" width="128" align="center">
                <template #default="{ row }"><TransactionStageStatusDisplay domain="matching" :value="row.channelMatchStatus" :label="tagText(channelMatchStatusOptions, row.channelMatchStatus)" /></template>
            </el-table-column>
            <el-table-column prop="threeDsEnabled" :label="t('transaction.fields.threeDs')" width="92" align="center">
                <template #default="{ row }"><el-tag size="small" effect="plain" class="transaction-capability-tag transaction-capability-tag--three-ds" :class="{ 'is-enabled': row.threeDsEnabled === 1 }">{{ t(row.threeDsEnabled === 1 ? 'common.yes' : 'common.no') }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="dccEnabled" :label="t('transaction.fields.dcc')" width="100" align="center">
                <template #default="{ row }"><el-tag size="small" effect="plain" class="transaction-capability-tag transaction-capability-tag--dcc" :class="{ 'is-enabled': row.dccEnabled === 1 }">{{ t(row.dccEnabled === 1 ? 'transaction.capability.enabled' : 'transaction.capability.disabled') }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="edcEnabled" :label="t('transaction.fields.edc')" width="100" align="center">
                <template #default="{ row }"><el-tag size="small" effect="plain" class="transaction-capability-tag transaction-capability-tag--edc" :class="{ 'is-enabled': row.edcEnabled === 1 }">{{ t(row.edcEnabled === 1 ? 'transaction.capability.enabled' : 'transaction.capability.disabled') }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.reconciliationStatus')" width="128" align="center">
                <template #default="{ row }"><TransactionStageStatusDisplay domain="reconciliation" :value="row.reconciliationStatus" :label="tagText(reconciliationStatusOptions, row.reconciliationStatus)" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.settlementStatus')" width="128" align="center">
                <template #default="{ row }"><TransactionStageStatusDisplay domain="settlement" :value="row.settlementStatus" :label="tagText(settlementStatusOptions, row.settlementStatus)" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantNotificationStatus')" width="138" align="center">
                <template #default="{ row }">
                    <el-tag v-if="row.merchantNotificationStatus" size="small" :type="statusOptionTagType(row.merchantNotificationStatus)">
                        {{ tagText(merchantNotificationStatusOptions, row.merchantNotificationStatus) }}
                    </el-tag>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantResponseCode')" width="128" align="center">
                <template #default="{ row }">
                    <el-tooltip :content="responseTooltip(row.openApiResultCode || row.merchantResponseCode, row.internalResultMessage)" placement="top">
                        <el-tag size="small" effect="plain">{{ row.openApiResultCode || row.merchantResponseCode || '-' }}</el-tag>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column prop="channelCode" :label="t('transaction.fields.channelCode')" width="116" align="center"><template #default="{ row }"><ChannelIdentity :record="row" :fallback="row.channelCode || '-'" scope="OPERATION" /></template></el-table-column>
            <el-table-column :label="t('transaction.fields.paymentMethodCardBrand')" width="138" align="center">
                <template #default="{ row }">
                    <PaymentLogoGroup v-if="paymentLogos(row).length" :keys="paymentLogos(row)" size="sm" align="center" />
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.cardBin')" width="132" align="center">
                <template #default="{ row }">{{ cardDisplayText(row.cardNumberMasked, row.cardBin) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelOrderNo')" min-width="204" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.channelOrderNo" :label="t('transaction.fields.channelOrderNo')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelResponseCode')" width="128" align="center">
                <template #default="{ row }">
                    <el-tooltip :content="responseTooltip(row.channelResponseCode, row.channelResponseMessage)" placement="top">
                        <span>{{ row.channelResponseCode || '-' }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.accessType')" width="128" align="center">
                <template #default="{ row }">{{ accessTypeText(t, row.accessType) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionDateTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.authCode')" width="118" align="center">
                <template #default="{ row }">
                    <CopyableText :value="row.authCode" :label="t('transaction.fields.authCode')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.acquirerReferenceNo')" min-width="190" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.acquirerReferenceNo" :label="t('transaction.fields.acquirerReferenceNo')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="138" fixed="right" align="center">
                <template #default="{ row }">
                    <TableRowActions
                        :actions="transactionRowActions(row)"
                        :more-label="t('common.more')"
                        :max-direct-actions="userStore.hasPermission('transaction:operation:detail') ? 1 : 0"
                        @select="handleTransactionRowAction($event, row)"
                    />
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <TransactionDetailDrawer
            v-model:visible="detailVisible"
            :title="t('transaction.detail.title')"
            :detail="detail"
            detail-scope="operations"
            :focus-transaction-id="selectedDetailTransactionId"
            :display-time-zone="query.queryTimeZone"
            :loading="detailLoading"
        />
        <TransactionMerchantDrawer v-model:visible="merchantVisible" :merchant-id="selectedMerchantId" />

        <el-dialog v-model="refundVisible" :close-on-click-modal="!actionSubmitting" :close-on-press-escape="!actionSubmitting" :show-close="!actionSubmitting" :title="t('transaction.actions.refundTitle')" width="min(760px, calc(100vw - 32px))" append-to-body class="transaction-action-dialog refund-action-dialog" destroy-on-close>
            <el-alert class="refund-dialog-intro" type="info" show-icon :closable="false" :title="t('refundForm.tip')" />
            <section v-if="selectedOperation" class="refund-dialog-section">
                <h3>{{ t('refundForm.sourceInfo') }}</h3>
                <RefundSourceSummary :type="selectedOperation.transactionType" :type-label="tagText(typeOptions, selectedOperation.transactionType)" :status="selectedOperation.transactionStatus" :status-label="optionText(statusOptions, selectedOperation.transactionStatus)" :amount="fullLabelAmount(selectedOperation)" :currency="labelCurrency(selectedOperation)" :exponent="selectedOperation.labelCurrencyExponent" :locale="String(locale)" :t="t">
                    <template #merchant-order><CopyableText :value="selectedOperation.merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" wrap /></template>
                    <template #transaction-id><CopyableText :value="selectedOperation.transactionId" :label="t('transaction.fields.transactionId')" wrap /></template>
                    <template #transaction-time><BaseDateTime :value="selectedOperation.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
                </RefundSourceSummary>
            </section>
            <section v-if="selectedOperation" class="refund-dialog-section">
                <h3>{{ t('transaction.actions.refundInfo') }}</h3>
                <RefundFields ref="refundFieldsRef" :model="refundForm" :context="refundContext" :loading="refundLoading" :submitting="actionSubmitting" :t="t" :locale="locale" @update:model="Object.assign(refundForm, $event)" />
            </section>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionSubmitting" :disabled="refundLoading || !refundContext || !isPositiveDecimalAmount(refundContext.availableRefundAmount)" @click="submitRefund">{{ t('transaction.actions.refund') }}</el-button>
                    <el-button :disabled="actionSubmitting" @click="refundVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="captureVisible" :title="captureDialogTitle" width="min(620px, 92vw)" append-to-body class="transaction-action-dialog" destroy-on-close>
            <el-alert class="transaction-action-alert" type="info" show-icon :closable="false" :title="captureDialogTip" />
            <section v-if="selectedOperation" class="transaction-action-section">
                <h3>{{ t('transaction.actions.originalInfo') }}</h3>
                <dl class="transaction-action-detail-grid">
                    <div>
                        <dt>{{ t('transaction.fields.merchantOrderNo') }}</dt>
                        <dd><CopyableText :value="selectedOperation.merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" /></dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.fields.transactionId') }}</dt>
                        <dd><CopyableText :value="selectedOperation.transactionId" :label="t('transaction.fields.transactionId')" /></dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.fields.transactionStatus') }}</dt>
                        <dd><TransactionStatusDisplay :value="selectedOperation.transactionStatus" :label="optionText(statusOptions, selectedOperation.transactionStatus)" align="start" /></dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.fields.authorizedAmount') }}</dt>
                        <dd class="transaction-action-money"><CurrencyAmountDisplay :amount="fullLabelAmount(selectedOperation)" :currency="labelCurrency(selectedOperation)" :exponent="selectedOperation.labelCurrencyExponent" :locale="String(locale)" emphasized /></dd>
                    </div>
                </dl>
            </section>
            <section v-if="selectedOperation" class="transaction-action-section">
                <h3>{{ captureDialogInfo }}</h3>
                <div class="transaction-action-amount-card">
                    <span>{{ t('transaction.fields.availableCaptureAmount') }}</span>
                    <CurrencyAmountDisplay :amount="availableCaptureLabelAmount(selectedOperation)" :currency="labelCurrency(selectedOperation)" :exponent="selectedOperation.labelCurrencyExponent" :locale="String(locale)" size="md" emphasized />
                    <em>{{ captureFullAmountText }}</em>
                </div>
                <ConsoleActionFields ref="captureFieldsRef" :model="captureForm" scope="capture" :maximum="availableCaptureLabelAmount(selectedOperation)" :currency="labelCurrency(selectedOperation)" :exponent="selectedOperation.labelCurrencyExponent" :submitting="actionSubmitting" :t="t" @update:model="Object.assign(captureForm, $event)" />
                <el-alert class="transaction-action-bottom-alert" type="info" show-icon :closable="false" :title="captureSuccessHint" />
            </section>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionSubmitting" @click="submitCapture">{{ captureDialogAction }}</el-button>
                    <el-button @click="captureVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="voidVisible" :title="t('transaction.actions.voidTitle')" width="min(620px, 92vw)" append-to-body class="transaction-action-dialog" destroy-on-close>
            <el-alert class="transaction-action-alert" type="info" show-icon :closable="false" :title="t('transaction.actions.voidTip')" />
            <section v-if="selectedOperation" class="transaction-action-section">
                <h3>{{ t('transaction.actions.originalInfo') }}</h3>
                <dl class="transaction-action-detail-grid">
                    <div>
                        <dt>{{ t('transaction.fields.merchantOrderNo') }}</dt>
                        <dd><CopyableText :value="selectedOperation.merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" /></dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.fields.transactionId') }}</dt>
                        <dd><CopyableText :value="selectedOperation.transactionId" :label="t('transaction.fields.transactionId')" /></dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.fields.transactionStatus') }}</dt>
                        <dd><TransactionStatusDisplay :value="selectedOperation.transactionStatus" :label="optionText(statusOptions, selectedOperation.transactionStatus)" align="start" /></dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.fields.authorizedAmount') }}</dt>
                        <dd class="transaction-action-money"><CurrencyAmountDisplay :amount="fullLabelAmount(selectedOperation)" :currency="labelCurrency(selectedOperation)" :exponent="selectedOperation.labelCurrencyExponent" :locale="String(locale)" emphasized /></dd>
                    </div>
                </dl>
            </section>
            <section v-if="selectedOperation" class="transaction-action-section">
                <h3>{{ t('transaction.actions.voidInfo') }}</h3>
                <div class="transaction-action-amount-card transaction-action-amount-card--warning">
                    <span>{{ t('transaction.actions.voidAmount') }}</span>
                    <CurrencyAmountDisplay :amount="fullLabelAmount(selectedOperation)" :currency="labelCurrency(selectedOperation)" :exponent="selectedOperation.labelCurrencyExponent" :locale="String(locale)" size="md" emphasized />
                    <em>{{ t('transaction.actions.fullVoidOnly') }}</em>
                </div>
                <ConsoleActionFields ref="voidFieldsRef" :model="voidForm" scope="void" :maximum="availableCaptureLabelAmount(selectedOperation)" :currency="labelCurrency(selectedOperation)" :exponent="selectedOperation.labelCurrencyExponent" :submitting="actionSubmitting" :t="t" @update:model="Object.assign(voidForm, $event)" />
                <el-alert class="transaction-action-bottom-alert" type="info" show-icon :closable="false" :title="t('transaction.actions.voidWarning')" />
            </section>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionSubmitting" @click="submitVoid">{{ t('transaction.actions.void') }}</el-button>
                    <el-button @click="voidVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import ChannelIdentity from '@/views/channel/components/ChannelIdentity.vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CircleClose, Download, Promotion, RefreshLeft, RefreshRight, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { TransactionStageStatusDisplay, TransactionStageStatusSelect, CurrencyAmountDisplay, RefundFields, RefundSourceSummary, ConsoleActionFields, refundProgressKey, useTransactionRefresh, type RefundContext, PaymentLogoGroup, type PaymentLogoKey, TableRowActions, type TableRowAction, TransactionStatusDisplay, TransactionTypeDisplay, isPositiveDecimalAmount, normalizeDecimalAmount, safeErrorType, userFacingErrorMessage } from '@acquiring/shared';
import { useRoute, useRouter } from 'vue-router';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import {
    captureTransactionOperation,
    submitTransactionOperationExportTask,
    getTransactionOperationDetail,
    getRefundContext,
    preAuthCompletionTransactionOperation,
    refundTransactionOperation,
    requeryTransactionChannelMatch,
    retryMerchantNotification,
    searchTransactionOperationsWithSummary,
    voidTransactionOperation,
    type TransactionAmountSummary,
    type TransactionDetail,
    type TransactionOperation,
    type TransactionOperationSummary,
    type TransactionPageQuery,
    type TransactionPaymentMethodSummary,
} from '@/api/transaction';
import type { ChannelOption } from '@/api/channel';
import { cardLogoKeys, loadChannelOptions, loadDictOptions, paymentLogoKeys, type SelectOption } from '@/views/channel/shared';
import { formatDateTimeFromSourceTimeZone } from '@/utils/format';
import CopyableText from '../components/CopyableText.vue';
import MerchantRemoteSelect from '../components/MerchantRemoteSelect.vue';
import TransactionDetailDrawer from '../components/TransactionDetailDrawer.vue';
import TransactionMerchantDrawer from '../components/TransactionMerchantDrawer.vue';
import TransactionResultBar from '../components/TransactionResultBar.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    accessTypeText,
    cardDisplayText,
    defaultTransactionTodayRange,
    ensureTransactionTimezoneOptions,
    fallbackCardBrandOptions,
    fallbackPaymentMethodOptions,
    fallbackTransactionStatusOptions,
    fallbackTransactionStatusScopeOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    mergeTransactionDictOptions,
    moneyText,
    openTransactionDetail,
    optionText,
    rateText,
    resolveTransactionQueryRange,
    responseTooltip,
    splitDateRange,
    statusOptionTagType,
    tagText,
    transactionPaymentLogoKeys,
    type TransactionDictOption,
} from '../shared';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

function transactionRowActions(row: TransactionOperation): TableRowAction[] {
    return [
        { key: 'detail', label: t('common.detail'), icon: View,
            visible: userStore.hasPermission('transaction:operation:detail') },
        { key: 'retryCallback', label: t('transaction.actions.retryCallback'), icon: RefreshRight, type: 'warning',
            visible: userStore.hasPermission('transaction:merchant-notification:retry'),
            disabled: !canRetryCallback(row), loading: retryingTransactionId.value === row.transactionId,
            disabledReason: t(`transaction.actions.${canRetryCallback(row) ? 'retryCallbackTip' : 'retryCallbackDisabled'}`) },
        { key: 'channelMatch', label: t('transaction.actions.channelMatch'), icon: RefreshRight,
            visible: userStore.hasPermission('transaction:match-abnormal:requery'),
            disabled: !canRequeryChannelMatch(row), loading: matchingTransactionId.value === row.transactionId,
            disabledReason: t(`transaction.actions.${canRequeryChannelMatch(row) ? 'channelMatchTip' : 'channelMatchDisabled'}`) },
        { key: 'refund', label: t('transaction.actions.refund'), icon: RefreshLeft,
            visible: userStore.hasPermission('transaction:operation:refund') && canRefund(row),
            disabledReason: t(`transaction.actions.${canRefund(row) ? 'refundTip' : 'refundDisabled'}`) },
        { key: 'capture', label: captureActionText(row), icon: Promotion,
            visible: userStore.hasPermission('transaction:operation:capture') && canCapture(row), },
        { key: 'void', label: t('transaction.actions.void'), icon: CircleClose,
            visible: userStore.hasPermission('transaction:operation:void') && canVoid(row),
            disabledReason: t(`transaction.actions.${canVoid(row) ? 'voidTip' : 'voidDisabled'}`) },
    ];
}

function handleTransactionRowAction(key: string, row: TransactionOperation) {
    const action = transactionRowActions(row).find((item) => item.key === key);
    if (!action || action.visible === false || action.disabled || action.loading) return;
    if (key === 'detail') void openDetail(row);
    else if (key === 'retryCallback') void handleRetryCallback(row);
    else if (key === 'channelMatch') void handleChannelMatch(row);
    else if (key === 'refund') void openRefundDialog(row);
    else if (key === 'capture') void openCaptureDialog(row);
    else if (key === 'void') void openVoidDialog(row);
}
const showSearch = ref(true);
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
const merchantVisible = ref(false);
const actionSubmitting = ref(false);
const retryingTransactionId = ref('');
const matchingTransactionId = ref('');
const rows = ref<TransactionOperation[]>([]);
const operationSummary = ref<TransactionOperationSummary | null>(null);
const detail = ref<TransactionDetail | null>(null);
const selectedOperation = ref<TransactionOperation | null>(null);
const selectedDetailTransactionId = ref('');
const selectedMerchantId = ref('');
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const dateRange = ref<string[]>(defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const quickPreset = ref('today');
const query = reactive({
    merchantId: '',
    merchantOrderNo: '',
    transactionId: '',
    transactionType: '',
    transactionStatus: '',
    channelCode: '',
    paymentMethod: '',
    paymentBrand: '',
    cardBin: '',
    channelOrderNo: '',
    merchantResponseCode: '',
    channelResponseCode: '',
    authCode: '',
    acquirerReferenceNo: '',
    channelMatchStatus: '',
    reconciliationStatus: '',
    settlementStatus: '',
    queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});
const typeOptions = ref<TransactionDictOption[]>(fallbackTransactionTypeOptions(t));
const statusOptions = ref<TransactionDictOption[]>(fallbackTransactionStatusOptions(t));
const activeTypeOptions = ref<TransactionDictOption[]>([]);
const activeStatusOptions = ref<TransactionDictOption[]>([]);
const channelOptions = ref<ChannelOption[]>([]);
const paymentMethodOptions = ref<SelectOption[]>(fallbackPaymentMethodOptions(t));
const cardBrandOptions = ref<SelectOption[]>(fallbackCardBrandOptions());
const activePaymentMethodOptions = ref<SelectOption[]>([]);
const activeCardBrandOptions = ref<SelectOption[]>([]);
const channelMatchStatusOptions = ref<TransactionDictOption[]>(fallbackTransactionStatusScopeOptions(t, 'channelMatch'));
const reconciliationStatusOptions = ref<TransactionDictOption[]>(fallbackTransactionStatusScopeOptions(t, 'reconciliation'));
const settlementStatusOptions = ref<TransactionDictOption[]>(fallbackTransactionStatusScopeOptions(t, 'settlement'));
const merchantNotificationStatusOptions = ref<TransactionDictOption[]>(fallbackTransactionStatusScopeOptions(t, 'merchantNotification'));
const timezoneOptions = ref<SelectOption[]>([]);

interface PaymentQueryOption {
    value: string;
    label: string;
    displayCode: string;
    paymentMethod: string;
    paymentBrand: string;
    logoKeys: PaymentLogoKey[];
}

const paymentQueryOptions = computed<PaymentQueryOption[]>(() => activePaymentMethodOptions.value.flatMap((method) => {
    if (method.value !== 'BANK_CARD') {
        return [{
            value: method.value,
            label: method.label,
            displayCode: method.value,
            paymentMethod: method.value,
            paymentBrand: '',
            logoKeys: paymentLogoKeys(method.value, method),
        }];
    }
    return activeCardBrandOptions.value.map((brand) => ({
        value: `BANK_CARD:${brand.value}`,
        label: brand.label,
        displayCode: brand.value,
        paymentMethod: 'BANK_CARD',
        paymentBrand: brand.value,
        logoKeys: cardLogoKeys(brand.value, brand),
    }));
}));
const paymentQueryValue = computed({
    get: () => query.paymentMethod === 'BANK_CARD' && query.paymentBrand
        ? `BANK_CARD:${query.paymentBrand}`
        : query.paymentMethod,
    set: (value: string) => {
        const selected = paymentQueryOptions.value.find((item) => item.value === value);
        query.paymentMethod = selected?.paymentMethod || '';
        query.paymentBrand = selected?.paymentBrand || '';
    },
});
const selectedPaymentQueryOption = computed(() => paymentQueryOptions.value.find(
    (item) => item.value === paymentQueryValue.value,
));
const refundForm = reactive({
    amount: null as string | null | undefined,
    currency: '',
    mode: 'PARTIAL',
    reason: '',
    description: '',
});
const captureForm = reactive({
    amount: null as string | null, mode: 'PARTIAL',
    reason: '',
    description: '',
});

const isPreAuthCompletion = computed(() => selectedOperation.value?.transactionType === 'PRE_AUTHORIZATION');
const captureDialogAction = computed(() => t(`transaction.actions.${isPreAuthCompletion.value ? 'preAuthCompletion' : 'capture'}`));
const captureDialogTitle = computed(() => t(`transaction.actions.${isPreAuthCompletion.value ? 'preAuthCompletionTitle' : 'captureTitle'}`));
const captureDialogTip = computed(() => t(`transactionAction.${isPreAuthCompletion.value ? 'completionHint' : 'captureHint'}`));
const captureDialogInfo = computed(() => t(`transaction.actions.${isPreAuthCompletion.value ? 'preAuthCompletionInfo' : 'captureInfo'}`));

const captureFullAmountText = computed(() => t(`transactionAction.${isPreAuthCompletion.value ? 'completionHint' : 'captureHint'}`));
const captureSuccessHint = computed(() => t(`transactionAction.${isPreAuthCompletion.value ? 'completionHint' : 'captureHint'}`));
const captureFieldsRef = ref<InstanceType<typeof ConsoleActionFields>>();
const voidFieldsRef = ref<InstanceType<typeof ConsoleActionFields>>();
const voidForm = reactive({
    reason: '',
    description: '',
});

const emptySummary = (): TransactionOperationSummary => ({
    totalCount: 0,
    successCount: 0,
    failedCount: 0,
    amountSummaries: [],
    successAmountSummaries: [],
    failedAmountSummaries: [],
    paymentMethodSummaries: [],
});

const summary = computed(() => operationSummary.value || emptySummary());

const successRateText = computed(() => {
    if (!summary.value.totalCount) {
        return '0.00%';
    }
    return `${((summary.value.successCount / summary.value.totalCount) * 100).toFixed(2)}%`;
});

const failedRateText = computed(() => {
    if (!summary.value.totalCount) {
        return '0.00%';
    }
    return `${((summary.value.failedCount / summary.value.totalCount) * 100).toFixed(2)}%`;
});

function rateTone(rate: number) {
    if (rate < 60) {
        return 'danger' as const;
    }
    if (rate < 70) {
        return 'warning' as const;
    }
    if (rate < 80) {
        return 'primary' as const;
    }
    return 'success' as const;
}

const successRateTone = computed(() => {
    if (!summary.value.totalCount) {
        return 'danger' as const;
    }
    return rateTone((summary.value.successCount / summary.value.totalCount) * 100);
});

const failedRateTone = computed(() => {
    if (!summary.value.totalCount) {
        return 'danger' as const;
    }
    return rateTone((summary.value.failedCount / summary.value.totalCount) * 100);
});

const summaryItems = computed(() => [
    {
        key: 'total',
        label: t('transaction.summary.total'),
        value: t('transaction.summary.countUnit', { count: total.value.toLocaleString() }),
        description: '',
        details: amountSummaryDetails(summary.value.amountSummaries),
    },
    {
        key: 'success',
        label: t('transaction.summary.success'),
        value: t('transaction.summary.countUnit', { count: summary.value.successCount.toLocaleString() }),
        description: '',
        tone: 'success' as const,
        badge: {
            text: `${t('transaction.summary.ratio')} ${successRateText.value}`,
            tone: successRateTone.value,
        },
        details: amountSummaryDetails(summary.value.successAmountSummaries),
    },
    {
        key: 'paymentMethod',
        label: t('transaction.summary.paymentMethod'),
        value: '',
        description: '',
        tone: 'balance' as const,
        details: paymentMethodSummaryDetails(),
    },
    {
        key: 'failed',
        label: t('transaction.summary.failed'),
        value: t('transaction.summary.countUnit', { count: summary.value.failedCount.toLocaleString() }),
        description: '',
        tone: 'danger' as const,
        badge: {
            text: `${t('transaction.summary.ratio')} ${failedRateText.value}`,
            tone: failedRateTone.value,
        },
        details: amountSummaryDetails(summary.value.failedAmountSummaries),
    },
]);

onMounted(async () => {
    const linkedTransactionId = typeof route.query.transactionId === 'string'
        ? route.query.transactionId.trim() : '';
    if (linkedTransactionId) query.transactionId = linkedTransactionId;
    const linkedTransactionDateTime = typeof route.query.transactionDateTime === 'string'
        ? route.query.transactionDateTime.trim() : '';
    const linkedTransactionTimeZone = typeof route.query.transactionTimeZone === 'string'
        ? route.query.transactionTimeZone.trim() : DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    if (linkedTransactionDateTime) {
        const displayDateTime = formatDateTimeFromSourceTimeZone(
            linkedTransactionDateTime, linkedTransactionTimeZone, query.queryTimeZone,
        );
        const linkedDate = /^\d{4}-\d{2}-\d{2}/.exec(displayDateTime)?.[0];
        if (linkedDate) {
            quickPreset.value = '';
            dateRange.value = [`${linkedDate}T00:00:00`, `${linkedDate}T23:59:59`];
        }
    }
    await loadDictionaries();
    await loadData();
    if (linkedTransactionId && userStore.hasPermission('transaction:operation:detail')) {
        const linkedRow = rows.value.find((row) => row.transactionId === linkedTransactionId);
        if (linkedRow) openDetail(linkedRow);
    }
});

useTransactionRefresh(async () => {
    await loadData();
    const current = detail.value?.operations.find(item => item.transactionId === selectedDetailTransactionId.value);
    if (detailVisible.value && current?.transactionDateTime && current.rootTransactionDateTime) {
        const latest = await getTransactionOperationDetail(current.transactionId, current.transactionDateTime, current.rootTransactionDateTime);
        if (detailVisible.value && selectedDetailTransactionId.value === current.transactionId) detail.value = latest;
    }
}, () => !loading.value && !captureVisible.value && !voidVisible.value && !refundVisible.value);

watch(locale, () => void loadDictionaries());

async function loadDictionaries() {
    const fallbackTypes = fallbackTransactionTypeOptions(t);
    const fallbackStatuses = fallbackTransactionStatusOptions(t);
    const fallbackPaymentMethods = fallbackPaymentMethodOptions(t);
    const fallbackCardBrands = fallbackCardBrandOptions();
    const fallbackChannelMatches = fallbackTransactionStatusScopeOptions(t, 'channelMatch');
    const fallbackReconciliations = fallbackTransactionStatusScopeOptions(t, 'reconciliation');
    const fallbackSettlements = fallbackTransactionStatusScopeOptions(t, 'settlement');
    const fallbackMerchantNotifications = fallbackTransactionStatusScopeOptions(t, 'merchantNotification');
    typeOptions.value = fallbackTypes;
    statusOptions.value = fallbackStatuses;
    activeTypeOptions.value = [];
    activeStatusOptions.value = [];
    channelOptions.value = [];
    paymentMethodOptions.value = fallbackPaymentMethods;
    cardBrandOptions.value = fallbackCardBrands;
    activePaymentMethodOptions.value = [];
    activeCardBrandOptions.value = [];
    channelMatchStatusOptions.value = fallbackChannelMatches;
    reconciliationStatusOptions.value = fallbackReconciliations;
    settlementStatusOptions.value = fallbackSettlements;
    merchantNotificationStatusOptions.value = fallbackMerchantNotifications;
    try {
        const [types, statuses, channels, paymentMethods, cardBrands, channelMatches, reconciliations, settlements, merchantNotificationStatuses, timezones] = await Promise.all([
            loadFilterOptions('transaction_type', () => loadTransactionDictOptions('transaction_type', String(locale.value || 'zh-CN'))),
            loadFilterOptions('transaction_status', () => loadTransactionDictOptions('transaction_status', String(locale.value || 'zh-CN'))),
            loadChannelOptions().catch((error) => {
                console.warn('[admin-system] transaction channel options unavailable', safeErrorType(error));
                return [];
            }),
            loadFilterOptions('acquiring_payment_method', () => loadDictOptions('acquiring_payment_method', String(locale.value || 'zh-CN'))),
            loadFilterOptions('card_brand', () => loadDictOptions('card_brand', String(locale.value || 'zh-CN'))),
            loadTransactionDictOptions('channel_match_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('reconciliation_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('settlement_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('merchant_notification_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []),
        ]);
        activeTypeOptions.value = mergeTransactionDictOptions(types, []);
        activeStatusOptions.value = mergeTransactionDictOptions(statuses, []);
        typeOptions.value = mergeTransactionDictOptions(activeTypeOptions.value, fallbackTypes);
        statusOptions.value = mergeTransactionDictOptions(activeStatusOptions.value, fallbackStatuses);
        channelOptions.value = channels;
        activePaymentMethodOptions.value = mergeTransactionDictOptions(paymentMethods, []);
        activeCardBrandOptions.value = mergeTransactionDictOptions(cardBrands, []);
        paymentMethodOptions.value = mergeTransactionDictOptions(activePaymentMethodOptions.value, fallbackPaymentMethods);
        cardBrandOptions.value = mergeTransactionDictOptions(activeCardBrandOptions.value, fallbackCardBrands);
        channelMatchStatusOptions.value = mergeTransactionDictOptions(channelMatches, fallbackChannelMatches);
        reconciliationStatusOptions.value = mergeTransactionDictOptions(reconciliations, fallbackReconciliations);
        settlementStatusOptions.value = mergeTransactionDictOptions(settlements, fallbackSettlements);
        merchantNotificationStatusOptions.value = mergeTransactionDictOptions(
            merchantNotificationStatuses,
            fallbackMerchantNotifications,
        );
        timezoneOptions.value = ensureTransactionTimezoneOptions(timezones);
    } catch (error) {
        console.warn('[admin-system] transaction dictionaries unavailable', safeErrorType(error));
        timezoneOptions.value = ensureTransactionTimezoneOptions([]);
    }
}

async function loadFilterOptions<T extends SelectOption>(
    dictType: string,
    loader: () => Promise<T[]>,
): Promise<T[]> {
    try {
        return await loader();
    } catch (error) {
        console.warn(`[admin-system] active dictionary unavailable: ${dictType}`, safeErrorType(error));
        return [];
    }
}

let dataVersion = 0;
async function loadData() {
  const version = ++dataVersion;
    loading.value = true;
    try {
        const result = await searchTransactionOperationsWithSummary(buildQuery(page.value, pageSize.value));
    if (version !== dataVersion) return;
        rows.value = result.page.records;
        total.value = result.page.total;
        operationSummary.value = result.summary || emptySummary();
    } finally {
        if (version === dataVersion) loading.value = false;
    }
}

async function handleExport() {
    exporting.value = true;
    try {
        const task = await submitTransactionOperationExportTask({
            requestId: createExportRequestId('transaction-operation'),
            query: buildQuery(),
        });
        await ElMessageBox.confirm(
            t('operations.exportTask.submitted', { taskNo: task.taskNo }),
            t('operations.exportTask.submittedTitle'),
            {
                confirmButtonText: t('operations.exportTask.openDownloadCenter'),
                cancelButtonText: t('common.close'),
                type: 'success',
            },
        ).then(() => router.push('/operations/export-tasks')).catch(() => undefined);
    } catch (error: unknown) {
        ElMessage.error(userFacingErrorMessage(error, t('common.exportFailed')));
    } finally {
        exporting.value = false;
    }
}

function createExportRequestId(prefix: string) {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return `${prefix}-export-${globalThis.crypto.randomUUID()}`;
    }
    return `${prefix}-export-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildQuery(pageNo?: number, currentPageSize?: number): TransactionPageQuery {
    const range = splitDateRange(currentDateRange());
    return {
        pageNo,
        pageSize: currentPageSize,
        merchantId: query.merchantId || undefined,
        merchantOrderNo: query.merchantOrderNo || undefined,
        transactionId: query.transactionId || undefined,
        transactionType: query.transactionType || undefined,
        transactionStatus: query.transactionStatus || undefined,
        channelCode: query.channelCode || undefined,
        paymentMethod: query.paymentMethod || undefined,
        paymentBrand: query.paymentBrand || undefined,
        cardBin: query.cardBin || undefined,
        channelOrderNo: query.channelOrderNo || undefined,
        merchantResponseCode: query.merchantResponseCode || undefined,
        channelResponseCode: query.channelResponseCode || undefined,
        authCode: query.authCode || undefined,
        acquirerReferenceNo: query.acquirerReferenceNo || undefined,
        channelMatchStatus: query.channelMatchStatus || undefined,
        reconciliationStatus: query.reconciliationStatus || undefined,
        settlementStatus: query.settlementStatus || undefined,
        queryTimeZone: query.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
        ...range,
    };
}

function currentDateRange() {
    dateRange.value = resolveTransactionQueryRange(dateRange.value, quickPreset.value, query.queryTimeZone);
    return dateRange.value;
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function handleReset() {
    query.merchantId = '';
    query.merchantOrderNo = '';
    query.transactionId = '';
    query.transactionType = '';
    query.transactionStatus = '';
    query.channelCode = '';
    query.paymentMethod = '';
    query.paymentBrand = '';
    query.cardBin = '';
    query.channelOrderNo = '';
    query.merchantResponseCode = '';
    query.channelResponseCode = '';
    query.authCode = '';
    query.acquirerReferenceNo = '';
    query.channelMatchStatus = '';
    query.reconciliationStatus = '';
    query.settlementStatus = '';
    query.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    quickPreset.value = 'today';
    dateRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    handleSearch();
}

function openDetail(row: TransactionOperation) {
    const transactionId = row.transactionId;
    const transactionDateTime = row.transactionDateTime;
    const rootTransactionDateTime = row.rootTransactionDateTime;
    if (!transactionId || !transactionDateTime || !rootTransactionDateTime) return;
    selectedDetailTransactionId.value = transactionId;
    openTransactionDetail(transactionId, transactionDateTime, rootTransactionDateTime,
        detailLoading, detailVisible, detail, getTransactionOperationDetail, t('common.loadFailed'));
}

function openMerchant(merchantId: string) {
    selectedMerchantId.value = merchantId;
    merchantVisible.value = true;
}

function paymentLogos(row: TransactionOperation): PaymentLogoKey[] {
    return transactionPaymentLogoKeys(row.paymentMethod, row.paymentBrand);
}

/** 类型决定操作是否适用，状态和可用金额再决定适用操作是否可执行。 */

function canRefund(row: TransactionOperation) {
    return row.availableActions?.includes('REFUND') === true;
}

function amountSummaryDetails(amountSummaries: TransactionAmountSummary[]) {
    if (!amountSummaries.length) {
        return [];
    }
    return amountSummaries.slice(0, 4).map((item) => ({
        key: item.currency || '-',
        value: amountSummaryText(item),
        description: '',
        amountMeta: {
            currency: item.currency || '-',
            amountText: amountText(item.amount ?? 0, item.currencyExponent),
        },
    }));
}

function paymentMethodSummaryDetails() {
    const details = summary.value.paymentMethodSummaries.map((item) => {
        const logoKeys = transactionPaymentLogoKeys(item.paymentMethod, item.paymentBrand);
        const formattedCount = Number(item.count || 0).toLocaleString();
        return {
            key: paymentSummaryKey(item),
            label: '',
            value: `${t('transaction.summary.countUnit', { count: formattedCount })} ${amountSummaryInlineText(item.amountSummaries)}`,
            description: `${paymentSummaryLabel(item)} ${t('transaction.summary.countUnit', { count: formattedCount })} ${amountSummaryInlineText(item.amountSummaries)}`,
            logoKeys,
            logoPlaceholder: !logoKeys.length,
            countText: t('transaction.summary.countUnit', { count: formattedCount }),
            amountMetas: item.amountSummaries.map((amount) => ({
                currency: amount.currency || '-',
                amountText: amountText(amount.amount ?? 0, amount.currencyExponent),
            })),
        };
    });
    if (!details.length) {
        return [];
    }
    return details;
}

function amountSummaryInlineText(amountSummaries: TransactionAmountSummary[]) {
    const text = amountSummaries
        .map((item) => amountSummaryText(item))
        .join('    ');
    return text || '-';
}

function amountSummaryText(item: TransactionAmountSummary) {
    return moneyText(item.amount ?? 0, item.currency || '-', item.currencyExponent);
}

function amountText(amount?: number | string | null, currencyExponent?: number | null) {
    const text = moneyText(amount ?? 0, undefined, currencyExponent);
    return text || '-';
}

function paymentSummaryKey(item: TransactionPaymentMethodSummary) {
    return item.paymentMethod === 'BANK_CARD'
        ? `${item.paymentMethod || '-'}:${item.paymentBrand || '-'}`
        : item.paymentMethod || '-';
}

function paymentSummaryLabel(item: TransactionPaymentMethodSummary) {
    if (item.paymentMethod === 'BANK_CARD') {
        return tagText(cardBrandOptions.value, item.paymentBrand);
    }
    return tagText(paymentMethodOptions.value, item.paymentMethod);
}

function canVoid(row: TransactionOperation) {
    return row.availableActions?.includes('VOID') === true;
}

function canRetryCallback(row: TransactionOperation) {
    return ['SUCCESS', 'FAILED'].includes(row.transactionStatus)
        && Boolean(row.transactionId && row.transactionDateTime);
}

function canRequeryChannelMatch(row: TransactionOperation) {
    return ['PENDING', 'REVIEW_REQUIRED', 'MISMATCHED', 'FAILED'].includes(row.channelMatchStatus || '')
        && Boolean(row.transactionId && row.transactionDateTime);
}

async function handleChannelMatch(row: TransactionOperation) {
    if (!canRequeryChannelMatch(row)) {
        return;
    }
    try {
        await ElMessageBox.confirm(
            t('transaction.actions.channelMatchConfirm', { transactionId: row.transactionId }),
            t('transaction.actions.channelMatchTitle'),
            {
                confirmButtonText: t('common.confirm'),
                cancelButtonText: t('common.cancel'),
                type: 'warning',
            },
        );
    } catch {
        return;
    }
    matchingTransactionId.value = row.transactionId;
    try {
        const result = await requeryTransactionChannelMatch(row.transactionId, {
            transactionDateTime: row.transactionDateTime,
        });
        if (result.matchedCount > 0) {
            ElMessage.success(t('transaction.actions.channelMatchSuccess'));
        } else if (result.failedCount > 0) {
            ElMessage.warning(t('transaction.actions.channelMatchFailed'));
        } else {
            ElMessage.warning(t('transaction.actions.channelMatchPending'));
        }
        await loadData();
    } finally {
        matchingTransactionId.value = '';
    }
}

async function handleRetryCallback(row: TransactionOperation) {
    if (!canRetryCallback(row)) {
        return;
    }
    try {
        await ElMessageBox.confirm(
            t('transaction.actions.retryCallbackConfirm', { transactionId: row.transactionId }),
            t('transaction.actions.retryCallbackTitle'),
            {
                confirmButtonText: t('common.confirm'),
                cancelButtonText: t('common.cancel'),
                type: 'warning',
            },
        );
    } catch {
        return;
    }
    retryingTransactionId.value = row.transactionId;
    try {
        const eventId = await retryMerchantNotification({
            transactionId: row.transactionId,
            transactionDateTime: row.transactionDateTime,
        });
        ElMessage.success(t('transaction.actions.retryCallbackAccepted', { eventId }));
    } finally {
        retryingTransactionId.value = '';
    }
}

function canCapture(row: TransactionOperation) {
    return row.availableActions?.includes(row.transactionType === 'PRE_AUTHORIZATION' ? 'PRE_AUTH_COMPLETION' : 'CAPTURE') === true;
}

function captureActionText(row: TransactionOperation) {
    return t(`transaction.actions.${row.transactionType === 'PRE_AUTHORIZATION' ? 'preAuthCompletion' : 'capture'}`);
}

async function openRefundDialog(row: TransactionOperation) {
    if (refundLoading.value || actionSubmitting.value) return;
    selectedOperation.value = row;
    refundForm.amount = null;
    refundForm.currency = labelCurrency(row);
    refundForm.mode = 'PARTIAL';
    refundForm.reason = '';
    refundForm.description = '';
    refundContext.value = null;
    refundLoading.value = true;
    refundVisible.value = true;
    try {
        refundContext.value = await getRefundContext(row.transactionId!, {
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

function openCaptureDialog(row: TransactionOperation) {
    selectedOperation.value = row;
    captureForm.amount = normalizeDecimalAmount(availableCaptureLabelAmount(row));
    captureForm.mode = 'PARTIAL';
    captureForm.reason = '';
    captureForm.description = '';
    captureVisible.value = true;
}

function openVoidDialog(row: TransactionOperation) {
    selectedOperation.value = row;
    voidForm.reason = '';
    voidForm.description = '';
    voidVisible.value = true;
}

async function submitRefund() {
    if (!selectedOperation.value || actionSubmitting.value || refundLoading.value) return;
    if (!(await refundFieldsRef.value?.validate()) || actionSubmitting.value) return;
    const refundAmount = refundForm.amount;
    if (refundAmount == null) return;
    actionSubmitting.value = true;
    try {
        const result = await refundTransactionOperation(selectedOperation.value.transactionId, {
            amount: refundAmount,
            currency: refundForm.currency || labelCurrency(selectedOperation.value),
            reason: [t(`refundForm.reasons.${refundForm.reason}`), refundForm.description.trim()].filter(Boolean).join(' - '),
            reasonCode: refundForm.reason,
            refundDescription: refundForm.description.trim(),
            transactionDateTime: selectedOperation.value.transactionDateTime!,
            rootTransactionDateTime: selectedOperation.value.rootTransactionDateTime!,
        });
        ElMessage({ type: result.status === 'SUCCESS' ? 'success' : result.status === 'FAILED' ? 'error' : 'info', message: t(`transactionAction.stages.${refundProgressKey(result)}`) });
        refundVisible.value = false;
        await refreshAfterAction(selectedOperation.value);
    } catch (error: unknown) {
        ElMessage.error(userFacingErrorMessage(error, t('transaction.actions.refundFailed')));
    } finally {
        actionSubmitting.value = false;
    }
}

async function submitCapture() {
    if (!selectedOperation.value) {
        return;
    }
    if (actionSubmitting.value || !(await captureFieldsRef.value?.validate()) || actionSubmitting.value) return;
    actionSubmitting.value = true;
    try {
        const action = selectedOperation.value.transactionType === 'PRE_AUTHORIZATION'
            ? preAuthCompletionTransactionOperation
            : captureTransactionOperation;
        const result = await action(selectedOperation.value.transactionId, {
            reasonCode: captureForm.reason,
            operationDescription: captureForm.description.trim(),
            amount: captureForm.amount!,
            currency: labelCurrency(selectedOperation.value),
            transactionDateTime: selectedOperation.value.transactionDateTime!,
            rootTransactionDateTime: selectedOperation.value.rootTransactionDateTime!,
        });
        const successKey = selectedOperation.value.transactionType === 'PRE_AUTHORIZATION'
            ? 'preAuthCompletionSuccess'
            : 'captureSuccess';
        if (result.status === 'SUCCESS') ElMessage.success(t(`transaction.actions.${successKey}`, { transactionId: result.transactionId }));
        else ElMessage({ type: result.status === 'FAILED' ? 'error' : 'info', message: t(result.status === 'FAILED' ? 'transactionAction.requestFailed' : 'transactionAction.stages.unknown') });
        captureVisible.value = false;
        await refreshAfterAction(selectedOperation.value);
    } finally {
        actionSubmitting.value = false;
    }
}

async function submitVoid() {
    if (!selectedOperation.value) {
        return;
    }
    if (actionSubmitting.value || !(await voidFieldsRef.value?.validate()) || actionSubmitting.value) return;
    actionSubmitting.value = true;
    try {
        const result = await voidTransactionOperation(selectedOperation.value.transactionId, {
            reasonCode: voidForm.reason,
            operationDescription: voidForm.description.trim(),
            transactionDateTime: selectedOperation.value.transactionDateTime!,
            rootTransactionDateTime: selectedOperation.value.rootTransactionDateTime!,
        });
        if (result.status === 'SUCCESS') ElMessage.success(t('transaction.actions.voidSuccess', { transactionId: result.transactionId }));
        else ElMessage({ type: result.status === 'FAILED' ? 'error' : 'info', message: t(result.status === 'FAILED' ? 'transactionAction.requestFailed' : 'transactionAction.stages.unknown') });
        voidVisible.value = false;
        await refreshAfterAction(selectedOperation.value);
    } finally {
        actionSubmitting.value = false;
    }
}

function labelCurrency(row?: TransactionOperation | null) {
    return row?.labelCurrency || row?.transactionCurrency || '';
}

function fullLabelAmount(row: TransactionOperation) {
    return ['AUTHORIZATION', 'PRE_AUTHORIZATION'].includes(row.transactionType)
        ? row.labelAuthorizedAmount ?? row.labelAmount ?? row.transactionAmount ?? '0'
        : row.labelAmount ?? row.transactionAmount ?? '0';
}

function availableCaptureLabelAmount(row: TransactionOperation) {
    return row.labelAvailableCaptureAmount ?? (row.labelCurrency === row.transactionCurrency ? row.availableCaptureAmount : null) ?? '0';
}

async function refreshAfterAction(row: TransactionOperation) {
    await loadData();
    if (detailVisible.value) {
        openDetail(row);
    }
}

</script>

<style scoped>
.transaction-page__link {
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--el-color-primary);
    font-weight: 500;
    cursor: pointer;
}

.transaction-page__merchant-cell {
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.transaction-page__table {
    border-radius: 6px;
    overflow: hidden;
}

.transaction-page__table :deep(.el-table__header-wrapper th) {
    height: 34px;
    background: #f7f9fc;
    color: #364152;
    font-size: 12px;
    font-weight: 700;
}

.transaction-page__table :deep(.el-table__cell) {
    padding: 6px 0;
}

.transaction-page__table :deep(.el-table__body tr:nth-child(even) td.el-table__cell) {
    background: #fbfcfe;
}

.transaction-page__table :deep(.el-table__body tr:hover > td.el-table__cell) {
    background: #f3f7ff;
}

.transaction-page__table :deep(.cell) {
    line-height: 20px;
}

.transaction-page__table :deep(.el-tag) {
    min-width: 54px;
    justify-content: center;
    border-radius: 4px;
}

.transaction-capability-tag {
    --capability-color: #64748b;
    --capability-border: #cbd5e1;
    --capability-background: #f8fafc;
    gap: 6px;
    min-width: 66px !important;
    height: 24px;
    border-color: var(--capability-border) !important;
    border-radius: 3px !important;
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

.transaction-capability-tag--three-ds { --capability-color: #397a73; --capability-border: #b4d7d1; --capability-background: #f3faf8; }
.transaction-capability-tag--dcc { --capability-color: #5270a6; --capability-border: #c5d3ea; --capability-background: #f5f8fd; }
.transaction-capability-tag--edc { --capability-color: #92703b; --capability-border: #dfcfac; --capability-background: #fcfaf4; }
.transaction-capability-tag--three-ds.is-enabled { --capability-color: #0f766e; --capability-border: #5eead4; --capability-background: #ecfdf5; }
.transaction-capability-tag--dcc.is-enabled { --capability-color: #1d4ed8; --capability-border: #93c5fd; --capability-background: #eff6ff; }
.transaction-capability-tag--edc.is-enabled { --capability-color: #b45309; --capability-border: #fcd34d; --capability-background: #fffbeb; }

.transaction-capability-tag.is-enabled::before {
    opacity: 1;
    box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 18%, transparent);
}

.transaction-page__table :deep(.payment-logo-group) {
    justify-content: center;
}

.transaction-brand-select__prefix :deep(.payment-logo-mark),
.transaction-brand-option__logo :deep(.payment-logo-mark) {
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
    overflow: hidden;
    min-width: 0;
    color: #1f2937;
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-brand-option small {
    color: #94a3b8;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 11px;
}

.transaction-page__table :deep(.base-date-time),
.transaction-page__table :deep(.copyable-text),
.transaction-page__table :deep(.el-button) {
    font-size: 12px;
}

.transaction-page__money-cell {
    display: inline-flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    width: 100%;
    color: var(--el-text-color-primary);
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.transaction-page__money-cell :deep(.currency),
.transaction-page__money-currency {
    color: var(--el-text-color-secondary);
    font-size: 11px;
}

.transaction-action-dialog :deep(.el-dialog) {
    border-radius: 8px;
}

.transaction-action-dialog :deep(.el-dialog__header) {
    padding: 20px 24px 12px;
    margin-right: 0;
    border-bottom: 1px solid #edf2f7;
}

.transaction-action-dialog :deep(.el-dialog__title) {
    color: #1f2937;
    font-size: 18px;
    font-weight: 700;
}

.transaction-action-dialog :deep(.el-dialog__body) {
    padding: 18px 24px 8px;
}

.transaction-action-alert,
.transaction-action-bottom-alert {
    border-radius: 6px;
}

.transaction-action-alert {
    margin-bottom: 14px;
}

.transaction-action-bottom-alert {
    margin-top: 14px;
}

.transaction-action-alert :deep(.el-alert__title),
.transaction-action-bottom-alert :deep(.el-alert__title) {
    font-size: 13px;
    line-height: 1.55;
}

.transaction-action-section {
    display: grid;
    gap: 12px;
    margin-bottom: 14px;
}

.transaction-action-section h3 {
    margin: 0;
    color: #1f2937;
    font-size: 14px;
    font-weight: 700;
}

.transaction-action-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1px;
    padding: 1px;
    margin: 0;
    border: 1px solid #e4ebf3;
    border-radius: 8px;
    background: #e4ebf3;
    overflow: hidden;
}

.transaction-action-detail-grid div {
    display: grid;
    gap: 6px;
    min-width: 0;
    padding: 11px 13px;
    background: #ffffff;
}

.transaction-action-detail-grid dt {
    color: #667085;
    font-size: 12px;
    font-weight: 700;
}

.transaction-action-detail-grid dd {
    min-width: 0;
    margin: 0;
    color: #1f2937;
    font-size: 13px;
    line-height: 1.45;
    overflow-wrap: anywhere;
}

.transaction-action-money {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.transaction-action-amount-card {
    display: grid;
    gap: 5px;
    padding: 12px 14px;
    border: 1px solid #f6d9b3;
    border-radius: 6px;
    background: #fff7ed;
}

.transaction-action-amount-card--warning {
    border-color: #f1c087;
}

.transaction-action-amount-card span,
.transaction-action-amount-card em {
    color: #667085;
    font-size: 12px;
    font-style: normal;
}

.transaction-action-amount-card strong {
    color: #1f2937;
    font-size: 20px;
    line-height: 1.2;
}

.transaction-action-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 14px;
}

.transaction-action-form :deep(.el-form-item) {
    margin-bottom: 0;
}

.transaction-action-form :deep(.el-form-item__label) {
    padding-bottom: 5px;
    color: #344054;
    font-size: 12px;
    font-weight: 700;
    line-height: 16px;
}

.transaction-action-form :deep(.el-input),
.transaction-action-form :deep(.el-input-number),
.transaction-action-form :deep(.el-select),
.transaction-action-form :deep(.el-textarea) {
    width: 100%;
}

.transaction-action-amount-control {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    width: 100%;
}

.transaction-action-amount-control > span {
    display: inline-flex;
    align-items: center;
    min-width: 58px;
    padding: 0 14px;
    border: 1px solid var(--el-border-color);
    border-left: 0;
    border-radius: 0 6px 6px 0;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    font-size: 13px;
}

.transaction-action-amount-control :deep(.el-input__wrapper) {
    border-radius: 6px 0 0 6px;
}

.transaction-action-form :deep(.el-input__wrapper),
.transaction-action-form :deep(.el-select__wrapper),
.transaction-action-form :deep(.el-textarea__inner) {
    border-radius: 6px;
}

.transaction-action-form__wide {
    grid-column: 1 / -1;
}

.transaction-action-error {
    width: 100%;
    margin-top: 6px;
    color: var(--el-color-danger);
    font-size: 12px;
    line-height: 18px;
}

/* 支付方式汇总的信息密度更高，桌面端为左侧保留更多横向空间。 */
.transaction-operation-summary :deep(.transaction-result-bar__summary) {
    grid-template-columns: minmax(0, 2fr) minmax(360px, 1fr);
}

@media (max-width: 1440px) {
    .transaction-operation-summary :deep(.transaction-result-bar__summary) {
        grid-template-columns: minmax(0, 3fr) minmax(340px, 2fr);
    }
}

@media (max-width: 980px) {
    .transaction-operation-summary :deep(.transaction-result-bar__summary) {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 640px) {
    .transaction-action-detail-grid,
    .transaction-action-form {
        grid-template-columns: 1fr;
    }
}
</style>

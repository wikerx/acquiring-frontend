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
                    <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionStatus')">
                <el-select v-model="query.transactionStatus" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.fields.channelCode')">
                <el-select v-model="query.channelCode" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in channelOptions" :key="item.channelCode" :label="item.channelName ? `${item.channelCode} / ${item.channelName}` : item.channelCode" :value="item.channelCode" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.fields.paymentMethod')">
                <el-select v-model="query.paymentMethod" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <template #advanced>
                <el-form-item :label="t('transaction.fields.cardBrand')">
                    <el-select v-model="query.paymentBrand" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <el-option v-for="item in cardBrandOptions" :key="item.value" :label="item.label" :value="item.value" />
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
                    <el-select v-model="query.channelMatchStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <el-option v-for="item in channelMatchStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.reconciliationStatus')">
                    <el-select v-model="query.reconciliationStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <el-option v-for="item in reconciliationStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.settlementStatus')">
                    <el-select v-model="query.settlementStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <el-option v-for="item in settlementStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
            </template>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter v-model="dateRange" v-model:time-zone="query.queryTimeZone" v-model:preset="quickPreset" :timezone-options="timezoneOptions" default-preset="today" />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar :items="summaryItems" @toggle-search="showSearch = !showSearch" @refresh="loadData" />

        <el-row class="mb8 transaction-table-toolbar">
            <el-col :span="1.5">
                <el-button type="warning" plain :icon="Download" size="small" :loading="exporting" @click="handleExport" v-hasPermi="'transaction:operation:export'">
                    {{ t('common.export') }}
                </el-button>
            </el-col>
        </el-row>

        <StandardTable table-key="transaction-operation" v-loading="loading" :data="rows" row-key="transactionId" size="small" class="transaction-page__table">
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
            <el-table-column :label="t('transaction.fields.transactionType')" width="144" align="center">
                <template #default="{ row }"><el-tag size="small" effect="plain">{{ tagText(typeOptions, row.transactionType) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.labelAmount')" width="150" align="center">
                <template #default="{ row }"><span class="transaction-page__money-cell">{{ moneyText(row.labelAmount, row.labelCurrency, row.currencyExponent) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionAmount')" width="150" align="center">
                <template #default="{ row }"><span class="transaction-page__money-cell">{{ moneyText(row.transactionAmount, row.transactionCurrency, row.currencyExponent) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionRate')" width="128" align="center">
                <template #default="{ row }"><span class="transaction-page__money-cell">{{ rateText(row.transactionRate) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionStatus')" width="118" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusTagType(row.transactionStatus, statusOptions)">{{ tagText(statusOptions, row.transactionStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelMatchStatus')" width="128" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusOptionTagType(row.channelMatchStatus)">{{ tagText(channelMatchStatusOptions, row.channelMatchStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.reconciliationStatus')" width="128" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusOptionTagType(row.reconciliationStatus)">{{ tagText(reconciliationStatusOptions, row.reconciliationStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.settlementStatus')" width="128" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusOptionTagType(row.settlementStatus)">{{ tagText(settlementStatusOptions, row.settlementStatus) }}</el-tag></template>
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
                    <el-tooltip :content="responseTooltip(row.merchantResponseCode, row.merchantResponseMessage)" placement="top">
                        <el-tag size="small" effect="plain">{{ row.merchantResponseCode || '-' }}</el-tag>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column prop="channelCode" :label="t('transaction.fields.channelCode')" width="116" align="center" />
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
            <el-table-column :label="t('common.operation')" width="260" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row.transactionId)" v-hasPermi="'transaction:operation:detail'">{{ t('common.detail') }}</el-button>
                    <el-tooltip :content="canRefund(row) ? t('transaction.actions.refundTip') : t('transaction.actions.refundDisabled')" placement="top">
                        <span><el-button size="small" type="primary" link :disabled="!canRefund(row)" @click="openRefundDialog(row)" v-hasPermi="'transaction:operation:refund'">{{ t('transaction.actions.refund') }}</el-button></span>
                    </el-tooltip>
                    <el-tooltip :content="canCapture(row) ? t('transaction.actions.captureTip') : t('transaction.actions.captureDisabled')" placement="top">
                        <span><el-button size="small" type="primary" link :disabled="!canCapture(row)" @click="openCaptureDialog(row)" v-hasPermi="'transaction:operation:capture'">{{ t('transaction.actions.capture') }}</el-button></span>
                    </el-tooltip>
                    <el-tooltip :content="canVoid(row) ? t('transaction.actions.voidTip') : t('transaction.actions.voidDisabled')" placement="top">
                        <span><el-button size="small" type="primary" link :disabled="!canVoid(row)" @click="openVoidDialog(row)" v-hasPermi="'transaction:operation:void'">{{ t('transaction.actions.void') }}</el-button></span>
                    </el-tooltip>
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
            :focus-transaction-id="selectedDetailTransactionId"
            :display-time-zone="query.queryTimeZone"
            :loading="detailLoading"
        />
        <TransactionMerchantDrawer v-model:visible="merchantVisible" :merchant-id="selectedMerchantId" />

        <el-dialog v-model="refundVisible" :title="t('transaction.actions.refundTitle')" width="min(620px, 92vw)" append-to-body class="transaction-action-dialog" destroy-on-close>
            <el-alert class="transaction-action-alert" type="info" show-icon :closable="false" :title="t('transaction.actions.refundTip')" />
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
                        <dd><el-tag size="small" :type="statusTagType(selectedOperation.transactionStatus, statusOptions)" effect="light">{{ optionText(statusOptions, selectedOperation.transactionStatus) }}</el-tag></dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.fields.transactionAmount') }}</dt>
                        <dd class="transaction-action-money">{{ labelMoneyText(selectedOperation, fullLabelAmount(selectedOperation)) }}</dd>
                    </div>
                </dl>
            </section>
            <section v-if="selectedOperation" class="transaction-action-section">
                <h3>{{ t('transaction.actions.refundInfo') }}</h3>
                <el-form :model="refundForm" label-position="top" class="transaction-action-form">
                    <el-form-item :label="t('transaction.actions.refundMode')">
                        <el-radio-group v-model="refundForm.mode" @change="handleRefundModeChange">
                            <el-radio value="PARTIAL">{{ t('transaction.actions.partialRefund') }}</el-radio>
                            <el-radio value="FULL">{{ t('transaction.actions.fullRefund') }} ({{ labelMoneyText(selectedOperation, availableRefundLabelAmount(selectedOperation)) }})</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item :label="t('transaction.actions.refundAmount')" required>
                        <el-input v-model.trim="refundForm.amount" :disabled="refundForm.mode === 'FULL'" :placeholder="t('transaction.actions.amountPlaceholder')" clearable @blur="normalizeRefundAmount">
                            <template #append>{{ refundForm.currency || labelCurrency(selectedOperation) || '-' }}</template>
                        </el-input>
                        <div v-if="refundAmountError" class="transaction-action-error">{{ refundAmountError }}</div>
                    </el-form-item>
                    <el-form-item :label="t('transaction.actions.reason')">
                        <el-select v-model="refundForm.reason" :placeholder="t('common.pleaseSelect')" filterable>
                            <el-option v-for="item in refundReasonOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.actions.description')" class="transaction-action-form__wide">
                        <el-input v-model.trim="refundForm.description" type="textarea" :rows="3" maxlength="200" show-word-limit :placeholder="t('transaction.actions.descriptionPlaceholder')" />
                    </el-form-item>
                </el-form>
                <el-alert class="transaction-action-bottom-alert" type="warning" show-icon :closable="false" :title="t('transaction.actions.refundLimitWarning', { amount: labelMoneyText(selectedOperation, availableRefundLabelAmount(selectedOperation)) })" />
            </section>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionSubmitting" :disabled="Boolean(refundAmountError)" @click="submitRefund">{{ t('transaction.actions.refund') }}</el-button>
                    <el-button @click="refundVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="captureVisible" :title="t('transaction.actions.captureTitle')" width="min(620px, 92vw)" append-to-body class="transaction-action-dialog" destroy-on-close>
            <el-alert class="transaction-action-alert" type="info" show-icon :closable="false" :title="t('transaction.actions.captureTip')" />
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
                        <dd><el-tag size="small" :type="statusTagType(selectedOperation.transactionStatus, statusOptions)" effect="light">{{ optionText(statusOptions, selectedOperation.transactionStatus) }}</el-tag></dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.fields.authorizedAmount') }}</dt>
                        <dd class="transaction-action-money">{{ labelMoneyText(selectedOperation, fullLabelAmount(selectedOperation)) }}</dd>
                    </div>
                </dl>
            </section>
            <section v-if="selectedOperation" class="transaction-action-section">
                <h3>{{ t('transaction.actions.captureInfo') }}</h3>
                <div class="transaction-action-amount-card">
                    <span>{{ t('transaction.fields.availableCaptureAmount') }}</span>
                    <strong>{{ labelMoneyText(selectedOperation, availableCaptureLabelAmount(selectedOperation)) }}</strong>
                    <em>{{ t('transaction.actions.fullCaptureOnly') }}</em>
                </div>
                <el-form :model="captureForm" label-position="top" class="transaction-action-form">
                    <el-form-item :label="t('transaction.actions.captureAmount')">
                        <el-input :model-value="amountInputText(selectedOperation, availableCaptureLabelAmount(selectedOperation))" disabled>
                            <template #append>{{ labelCurrency(selectedOperation) || '-' }}</template>
                        </el-input>
                    </el-form-item>
                    <el-form-item :label="t('transaction.actions.reason')">
                        <el-select v-model="captureForm.reason" :placeholder="t('common.pleaseSelect')" filterable>
                            <el-option v-for="item in captureReasonOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.actions.description')" class="transaction-action-form__wide">
                        <el-input v-model.trim="captureForm.description" type="textarea" :rows="3" maxlength="200" show-word-limit :placeholder="t('transaction.actions.descriptionPlaceholder')" />
                    </el-form-item>
                </el-form>
                <el-alert class="transaction-action-bottom-alert" type="info" show-icon :closable="false" :title="t('transaction.actions.captureSuccessHint')" />
            </section>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionSubmitting" @click="submitCapture">{{ t('transaction.actions.capture') }}</el-button>
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
                        <dd><el-tag size="small" :type="statusTagType(selectedOperation.transactionStatus, statusOptions)" effect="light">{{ optionText(statusOptions, selectedOperation.transactionStatus) }}</el-tag></dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.fields.authorizedAmount') }}</dt>
                        <dd class="transaction-action-money">{{ labelMoneyText(selectedOperation, fullLabelAmount(selectedOperation)) }}</dd>
                    </div>
                </dl>
            </section>
            <section v-if="selectedOperation" class="transaction-action-section">
                <h3>{{ t('transaction.actions.voidInfo') }}</h3>
                <div class="transaction-action-amount-card transaction-action-amount-card--warning">
                    <span>{{ t('transaction.actions.voidAmount') }}</span>
                    <strong>{{ labelMoneyText(selectedOperation, fullLabelAmount(selectedOperation)) }}</strong>
                    <em>{{ t('transaction.actions.fullVoidOnly') }}</em>
                </div>
                <el-form :model="voidForm" label-position="top" class="transaction-action-form">
                    <el-form-item :label="t('transaction.actions.voidAmount')">
                        <el-input :model-value="amountInputText(selectedOperation, fullLabelAmount(selectedOperation))" disabled>
                            <template #append>{{ labelCurrency(selectedOperation) || '-' }}</template>
                        </el-input>
                    </el-form-item>
                    <el-form-item :label="t('transaction.actions.reason')">
                        <el-select v-model="voidForm.reason" :placeholder="t('common.pleaseSelect')" filterable>
                            <el-option v-for="item in voidReasonOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.actions.description')" class="transaction-action-form__wide">
                        <el-input v-model.trim="voidForm.description" type="textarea" :rows="3" maxlength="200" show-word-limit :placeholder="t('transaction.actions.descriptionPlaceholder')" />
                    </el-form-item>
                </el-form>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    captureTransactionOperation,
    exportTransactionOperations,
    getTransactionOperationDetail,
    refundTransactionOperation,
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
import { loadChannelOptions, loadDictOptions, type SelectOption } from '@/views/channel/shared';
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
    fallbackTransactionStatusOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    moneyText,
    openTransactionDetail,
    optionText,
    rateText,
    resolveTransactionQueryRange,
    responseTooltip,
    splitDateRange,
    statusOptionTagType,
    statusTagType,
    tagText,
    transactionPaymentLogoKeys,
    type TransactionDictOption,
} from '../shared';

const { t, locale } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const exporting = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const refundVisible = ref(false);
const captureVisible = ref(false);
const voidVisible = ref(false);
const merchantVisible = ref(false);
const actionSubmitting = ref(false);
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
const typeOptions = ref<TransactionDictOption[]>([]);
const statusOptions = ref<TransactionDictOption[]>([]);
const channelOptions = ref<ChannelOption[]>([]);
const paymentMethodOptions = ref<SelectOption[]>([]);
const cardBrandOptions = ref<SelectOption[]>([]);
const channelMatchStatusOptions = ref<TransactionDictOption[]>([]);
const reconciliationStatusOptions = ref<TransactionDictOption[]>([]);
const settlementStatusOptions = ref<TransactionDictOption[]>([]);
const merchantNotificationStatusOptions = ref<TransactionDictOption[]>([]);
const timezoneOptions = ref<SelectOption[]>([]);
const refundForm = reactive({
    amount: '',
    currency: '',
    mode: 'PARTIAL',
    reason: '',
    description: '',
});
const captureForm = reactive({
    reason: '',
    description: '',
});
const voidForm = reactive({
    reason: '',
    description: '',
});
const refundReasonOptions = computed(() => transactionActionReasonOptions('refund'));
const captureReasonOptions = computed(() => transactionActionReasonOptions('capture'));
const voidReasonOptions = computed(() => transactionActionReasonOptions('void'));

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
    {
        key: 'paymentMethod',
        label: t('transaction.summary.paymentMethod'),
        value: '',
        description: '',
        tone: 'balance' as const,
        details: paymentMethodSummaryDetails(),
    },
]);

const refundAmountError = computed(() => validateRefundAmount());

onMounted(async () => {
    await loadDictionaries();
    await loadData();
});

async function loadDictionaries() {
    typeOptions.value = fallbackTransactionTypeOptions(t);
    statusOptions.value = fallbackTransactionStatusOptions(t);
    channelMatchStatusOptions.value = fallbackStatusOptions('channelMatch');
    reconciliationStatusOptions.value = fallbackStatusOptions('reconciliation');
    settlementStatusOptions.value = fallbackStatusOptions('settlement');
    merchantNotificationStatusOptions.value = fallbackStatusOptions('merchantNotification');
    try {
        const [types, statuses, channels, paymentMethods, cardBrands, channelMatches, reconciliations, settlements, merchantNotificationStatuses, timezones] = await Promise.all([
            loadTransactionDictOptions('transaction_type', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('transaction_status', String(locale.value || 'zh-CN')),
            loadChannelOptions(),
            loadDictOptions('acquiring_payment_method', String(locale.value || 'zh-CN')),
            loadDictOptions('card_brand', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('channel_match_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('reconciliation_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('settlement_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('merchant_notification_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []),
        ]);
        typeOptions.value = types.length ? types : typeOptions.value;
        statusOptions.value = statuses.length ? statuses : statusOptions.value;
        channelOptions.value = channels;
        paymentMethodOptions.value = paymentMethods;
        cardBrandOptions.value = cardBrands;
        channelMatchStatusOptions.value = channelMatches.length ? channelMatches : channelMatchStatusOptions.value;
        reconciliationStatusOptions.value = reconciliations.length ? reconciliations : reconciliationStatusOptions.value;
        settlementStatusOptions.value = settlements.length ? settlements : settlementStatusOptions.value;
        merchantNotificationStatusOptions.value = merchantNotificationStatuses.length ? merchantNotificationStatuses : merchantNotificationStatusOptions.value;
        timezoneOptions.value = ensureTransactionTimezoneOptions(timezones);
    } catch (error) {
        console.warn('[admin-system] Failed to load transaction dictionaries, fallback options are used.', error);
        timezoneOptions.value = ensureTransactionTimezoneOptions([]);
    }
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchTransactionOperationsWithSummary(buildQuery(page.value, pageSize.value));
        rows.value = result.page.records;
        total.value = result.page.total;
        operationSummary.value = result.summary || emptySummary();
    } finally {
        loading.value = false;
    }
}

async function handleExport() {
    exporting.value = true;
    try {
        await exportTransactionOperations(buildQuery());
    } finally {
        exporting.value = false;
    }
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

function openDetail(transactionId: string) {
    selectedDetailTransactionId.value = transactionId;
    openTransactionDetail(transactionId, detailLoading, detailVisible, detail, getTransactionOperationDetail, t('common.loadFailed'));
}

function openMerchant(merchantId: string) {
    selectedMerchantId.value = merchantId;
    merchantVisible.value = true;
}

function paymentLogos(row: TransactionOperation): PaymentLogoKey[] {
    return transactionPaymentLogoKeys(row.paymentMethod, row.paymentBrand);
}

function fallbackStatusOptions(scope: 'channelMatch' | 'reconciliation' | 'settlement' | 'merchantNotification'): TransactionDictOption[] {
    const values = scope === 'channelMatch'
        ? ['NOT_REQUIRED', 'PENDING', 'MATCHED', 'MISMATCHED', 'FAILED']
        : scope === 'reconciliation'
            ? ['NOT_RECONCILED', 'RECONCILED', 'MISMATCHED']
            : scope === 'settlement'
                ? ['NOT_SETTLED', 'SETTLING', 'SETTLED', 'FAILED']
                : ['INIT', 'PROCESSING', 'SUCCESS', 'FAILED', 'CLOSED'];
    return values.map((value) => ({ label: t(`transaction.statusOption.${value}`, value), value }));
}

function canRefund(row: TransactionOperation) {
    if (row.transactionStatus !== 'SUCCESS' || !['PAYMENT', 'CAPTURE'].includes(row.transactionType)) {
        return false;
    }
    const availableRefundAmount = toNullableAmount(row.availableRefundAmount);
    if (availableRefundAmount !== null) {
        return availableRefundAmount > 0;
    }
    return true;
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
    const details = summary.value.paymentMethodSummaries.slice(0, 2).map((item) => {
        const logoKeys = transactionPaymentLogoKeys(item.paymentMethod, item.paymentBrand);
        const primaryAmount = item.amountSummaries[0];
        return {
            key: paymentSummaryKey(item),
            label: '',
            value: `${item.count}笔 ${amountSummaryInlineText(item.amountSummaries)}`,
            description: `${paymentSummaryLabel(item)} ${t('transaction.summary.countUnit', { count: item.count })} ${amountSummaryInlineText(item.amountSummaries)}`,
            logoKeys,
            logoPlaceholder: !logoKeys.length,
            amountMeta: primaryAmount
                ? {
                    countText: t('transaction.summary.countUnit', { count: item.count }),
                    currency: primaryAmount.currency || '-',
                    amountText: amountText(primaryAmount.amount ?? 0, primaryAmount.currencyExponent),
                }
                : undefined,
        };
    });
    if (!details.length) {
        return [];
    }
    return details;
}

function amountSummaryInlineText(amountSummaries: TransactionAmountSummary[]) {
    const text = amountSummaries
        .slice(0, 1)
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
    if (row.transactionStatus !== 'SUCCESS' || !['AUTHORIZATION', 'PRE_AUTHORIZATION'].includes(row.transactionType)) {
        return false;
    }
    const capturedAmount = toNullableAmount(row.capturedAmount);
    const refundedAmount = toNullableAmount(row.refundedAmount);
    return (capturedAmount === null || capturedAmount === 0)
        && (refundedAmount === null || refundedAmount === 0);
}

function canCapture(row: TransactionOperation) {
    if (row.transactionStatus !== 'SUCCESS' || !['AUTHORIZATION', 'PRE_AUTHORIZATION'].includes(row.transactionType)) {
        return false;
    }
    const availableCaptureAmount = toNullableAmount(row.availableCaptureAmount);
    if (availableCaptureAmount !== null) {
        return availableCaptureAmount > 0;
    }
    return true;
}

function toNullableAmount(value?: number | string | null) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
}

function openRefundDialog(row: TransactionOperation) {
    selectedOperation.value = row;
    const defaultAmount = availableRefundLabelAmount(row);
    refundForm.amount = defaultAmount === undefined || defaultAmount === null ? '' : String(defaultAmount);
    refundForm.currency = labelCurrency(row);
    refundForm.mode = 'PARTIAL';
    refundForm.reason = '';
    refundForm.description = '';
    refundVisible.value = true;
}

function handleRefundModeChange() {
    if (refundForm.mode === 'FULL') {
        fillRemainingRefundAmount();
    }
}

function fillRemainingRefundAmount() {
    if (!selectedOperation.value) {
        return;
    }
    const amount = availableRefundLabelAmount(selectedOperation.value);
    refundForm.amount = amount === undefined || amount === null ? '' : String(amount);
}

function normalizeRefundAmount() {
    const amount = Number(refundForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        return;
    }
    refundForm.amount = String(amount);
}

function validateRefundAmount() {
    if (!refundVisible.value || !selectedOperation.value || !refundForm.amount) {
        return '';
    }
    const refundAmount = Number(refundForm.amount);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        return t('transaction.actions.amountRequired');
    }
    const availableRefundAmount = Number(selectedOperation.value.availableRefundAmount);
    const availableLabelAmount = availableRefundLabelAmount(selectedOperation.value);
    if (Number.isFinite(availableRefundAmount) && refundAmount > availableLabelAmount) {
        return t('transaction.actions.amountExceedsAvailable');
    }
    return '';
}

function openCaptureDialog(row: TransactionOperation) {
    selectedOperation.value = row;
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
    if (!selectedOperation.value) {
        return;
    }
    const refundAmount = Number(refundForm.amount);
    const errorMessage = validateRefundAmount();
    if (errorMessage || !refundForm.amount || !Number.isFinite(refundAmount) || refundAmount <= 0) {
        ElMessage.error(errorMessage || t('transaction.actions.amountRequired'));
        return;
    }
    actionSubmitting.value = true;
    try {
        const result = await refundTransactionOperation(selectedOperation.value.transactionId, {
            amount: refundForm.amount,
            currency: refundForm.currency || labelCurrency(selectedOperation.value),
            reason: actionReasonText(refundForm.reason, refundForm.description),
        });
        ElMessage.success(t('transaction.actions.refundSuccess', { transactionId: result.transactionId }));
        refundVisible.value = false;
        await refreshAfterAction(selectedOperation.value.transactionId);
    } finally {
        actionSubmitting.value = false;
    }
}

async function submitCapture() {
    if (!selectedOperation.value) {
        return;
    }
    actionSubmitting.value = true;
    try {
        const result = await captureTransactionOperation(selectedOperation.value.transactionId, {
            amount: availableCaptureLabelAmount(selectedOperation.value),
            currency: labelCurrency(selectedOperation.value),
            reason: actionReasonText(captureForm.reason, captureForm.description),
        });
        ElMessage.success(t('transaction.actions.captureSuccess', { transactionId: result.transactionId }));
        captureVisible.value = false;
        await refreshAfterAction(selectedOperation.value.transactionId);
    } finally {
        actionSubmitting.value = false;
    }
}

async function submitVoid() {
    if (!selectedOperation.value) {
        return;
    }
    actionSubmitting.value = true;
    try {
        const result = await voidTransactionOperation(selectedOperation.value.transactionId, {
            amount: fullLabelAmount(selectedOperation.value),
            currency: labelCurrency(selectedOperation.value),
            reason: actionReasonText(voidForm.reason, voidForm.description),
        });
        ElMessage.success(t('transaction.actions.voidSuccess', { transactionId: result.transactionId }));
        voidVisible.value = false;
        await refreshAfterAction(selectedOperation.value.transactionId);
    } finally {
        actionSubmitting.value = false;
    }
}

function labelCurrency(row?: TransactionOperation | null) {
    return row?.labelCurrency || row?.transactionCurrency || '';
}

function labelMoneyText(row?: TransactionOperation | null, amount?: number | string | null) {
    return moneyText(amount, labelCurrency(row), row?.currencyExponent);
}

function amountInputText(row?: TransactionOperation | null, amount?: number | string | null) {
    return moneyText(amount, undefined, row?.currencyExponent);
}

function fullLabelAmount(row: TransactionOperation) {
    return proportionalLabelAmount(row, row.transactionAmount);
}

function availableRefundLabelAmount(row: TransactionOperation) {
    return proportionalLabelAmount(row, row.availableRefundAmount ?? row.transactionAmount);
}

function availableCaptureLabelAmount(row: TransactionOperation) {
    return proportionalLabelAmount(row, row.availableCaptureAmount ?? row.transactionAmount);
}

function proportionalLabelAmount(row: TransactionOperation, transactionAmount?: number | string | null) {
    const labelAmount = Number(row.labelAmount);
    const sourceTransactionAmount = Number(row.transactionAmount);
    const targetTransactionAmount = Number(transactionAmount);
    if (Number.isFinite(labelAmount) && Number.isFinite(sourceTransactionAmount) && sourceTransactionAmount > 0 && Number.isFinite(targetTransactionAmount)) {
        return Number((targetTransactionAmount * labelAmount / sourceTransactionAmount).toFixed(6));
    }
    if (Number.isFinite(targetTransactionAmount)) {
        return targetTransactionAmount;
    }
    return Number.isFinite(labelAmount) ? labelAmount : 0;
}

function transactionActionReasonOptions(scope: 'refund' | 'capture' | 'void') {
    const keys = scope === 'refund'
        ? ['CUSTOMER_CANCELLED', 'DUPLICATE_PAYMENT', 'PRODUCT_UNAVAILABLE', 'SERVICE_COMPLETED']
        : scope === 'capture'
            ? ['GOODS_SHIPPED', 'SERVICE_COMPLETED', 'MERCHANT_CONFIRMED']
            : ['CUSTOMER_CANCELLED', 'AUTHORIZATION_EXPIRED', 'MERCHANT_CONFIRMED'];
    return keys.map((key) => ({ label: t(`transaction.actionReason.${key}`, key), value: key }));
}

function actionReasonText(reason?: string, description?: string) {
    const selectedReason = reason ? t(`transaction.actionReason.${reason}`, reason) : '';
    const text = [selectedReason, description?.trim()].filter(Boolean).join(' - ');
    return text || undefined;
}

async function refreshAfterAction(transactionId: string) {
    await loadData();
    if (detailVisible.value) {
        openDetail(transactionId);
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

.transaction-page__table :deep(.payment-logo-group) {
    justify-content: center;
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

@media (max-width: 640px) {
    .transaction-action-detail-grid,
    .transaction-action-form {
        grid-template-columns: 1fr;
    }
}
</style>

<template>
    <CommonDetailDrawer v-model:visible="drawerVisible" :title="title" size="full" :loading="loading">
        <div v-if="detail" class="transaction-detail">
            <section class="transaction-detail__hero" :class="`is-${summaryTone}`">
                <div class="transaction-detail__hero-item transaction-detail__hero-status">
                    <span class="transaction-detail__status-icon">
                        <TransactionSuccessCheckIcon
                            v-if="summaryTone === 'success'"
                            class="transaction-detail__success-check"
                        />
                        <el-icon v-else><component :is="summaryIcon" /></el-icon>
                    </span>
                    <div class="transaction-detail__hero-content">
                        <span class="transaction-detail__hero-label">{{ t('transaction.fields.transactionStatus') }}</span>
                        <strong class="transaction-detail__status-value">{{ summaryResultText }}</strong>
                    </div>
                </div>
                <div class="transaction-detail__hero-item transaction-detail__hero-amount">
                    <span class="transaction-detail__hero-label">{{ t('transaction.fields.labelAmount') }}</span>
                    <div class="transaction-detail__money-value">
                        <CurrencyAmountDisplay
                            :amount="focusedOperation?.labelAmount ?? detail.order?.labelAmount"
                            :currency="focusedOperation?.labelCurrency || detail.order?.labelCurrency"
                            :exponent="focusedOperation?.labelCurrencyExponent ?? detail.order?.labelCurrencyExponent"
                            :locale="String(locale)"
                            size="lg"
                            emphasized
                        />
                    </div>
                </div>
                <div class="transaction-detail__hero-item transaction-detail__hero-amount transaction-detail__hero-amount--channel">
                    <span class="transaction-detail__hero-label">{{ t('transaction.fields.channelTransactionAmount') }}</span>
                    <div class="transaction-detail__money-value">
                        <CurrencyAmountDisplay
                            :amount="focusedOperation?.transactionAmount ?? detail.order?.transactionAmount"
                            :currency="focusedOperation?.transactionCurrency || detail.order?.transactionCurrency"
                            :exponent="focusedOperation?.currencyExponent ?? detail.order?.currencyExponent"
                            :locale="String(locale)"
                            size="lg"
                            emphasized
                        />
                    </div>
                </div>
                <div class="transaction-detail__hero-item transaction-detail__hero-channel">
                    <span class="transaction-detail__hero-label">{{ t('transaction.fields.channelCode') }}</span>
                    <div class="transaction-detail__channel-value">
                        <ChannelIdentity :record="summaryRecord" :fallback="summaryChannelCode" :scope="detailScope === 'operations' ? 'OPERATION' : 'ORDER'" size="detail">
                            <div class="transaction-detail__channel-main">
                                <strong>{{ summaryChannelCode }}</strong>
                                <span v-if="summaryChannelFullName">{{ summaryChannelFullName }}</span>
                            </div>
                        </ChannelIdentity>
                        <div class="transaction-detail__payment-method">
                            <LegacyPaymentLogoGroup v-if="summaryPaymentLogos.length" :keys="summaryPaymentLogos" size="md" align="start" />
                            <span v-else>{{ summaryPaymentText }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section class="transaction-detail__identity-grid">
                <div class="transaction-detail__identity-item">
                    <span class="transaction-detail__identity-icon"><el-icon><Tickets /></el-icon></span>
                    <div>
                        <span>{{ t('transaction.fields.transactionId') }}</span>
                        <CopyableText :value="summaryTransactionId" :label="t('transaction.fields.transactionId')" wrap />
                    </div>
                </div>
                <div class="transaction-detail__identity-item">
                    <span class="transaction-detail__identity-icon"><el-icon><User /></el-icon></span>
                    <div>
                        <span>{{ t('transaction.fields.merchantId') }}</span>
                        <CopyableText :value="summaryMerchantId" :label="t('transaction.fields.merchantId')" wrap />
                    </div>
                </div>
                <div class="transaction-detail__identity-item">
                    <span class="transaction-detail__identity-icon"><el-icon><Shop /></el-icon></span>
                    <div>
                        <span>{{ t('transaction.fields.merchantOrderNo') }}</span>
                        <CopyableText :value="summaryMerchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" wrap />
                    </div>
                </div>
                <div class="transaction-detail__identity-item">
                    <span class="transaction-detail__identity-icon"><el-icon><CreditCard /></el-icon></span>
                    <div>
                        <span>{{ t('transaction.fields.channelOrderNo') }}</span>
                        <CopyableText :value="summaryChannelOrderNo" :label="t('transaction.fields.channelOrderNo')" wrap />
                    </div>
                </div>
            </section>

            <el-tabs v-model="activeTab" class="transaction-detail__tabs">
                <el-tab-pane :label="t('transaction.detail.baseInfo')" name="base">
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item :label="t('transaction.fields.merchantOrderNo')"><CopyableText :value="detail.order?.merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" wrap /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.merchantOrderId')"><CopyableText :value="detail.order?.merchantOrderId" :label="t('transaction.fields.merchantOrderId')" wrap /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionType')">
                            <TransactionTypeDisplay
                                :value="detail.order?.transactionType"
                                :label="optionText(typeOptions, detail.order?.transactionType)"
                                align="start"
                            />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionStatus')">
                            <TransactionStatusDisplay :value="detail.order?.transactionStatus" :label="optionText(statusOptions, detail.order?.transactionStatus)" align="start" />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.openApiResultCode')" :span="2">
                            <CopyableText :value="summaryRecord?.openApiResultCode" :label="t('transaction.fields.openApiResultCode')" wrap />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.internalResultMessage')" :span="2">
                            {{ summaryRecord?.internalResultMessage || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.merchantResultMessage')" :span="2">
                            {{ summaryRecord?.merchantResponseMessage || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.payerResultMessage')" :span="2">
                            {{ summaryRecord?.payerResultMessage || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.paymentMethodCardBrand')">
                            <LegacyPaymentLogoGroup v-if="paymentLogos(detail.order).length" :keys="paymentLogos(detail.order)" size="sm" align="start" class="transaction-detail__inline-logos" />
                            <span v-else>{{ paymentText(detail.order?.paymentMethod, detail.order?.paymentBrand) }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelCode')"><ChannelIdentity :record="detail.order" :fallback="detail.order?.channelCode || '-'" :scope="detailScope === 'operations' ? 'OPERATION' : 'ORDER'" size="detail" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelOrderNo')"><CopyableText :value="detail.order?.channelOrderNo" :label="t('transaction.fields.channelOrderNo')" wrap /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionDateTime')">
                            <BaseDateTime :value="detail.order?.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="displayTimeZone" />
                            <span class="transaction-detail__timezone">{{ displayTimeZone }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelCurrentAmount')"><CurrencyAmountDisplay :amount="detail.order?.currentAmount ?? detail.order?.transactionAmount" :currency="detail.order?.currentCurrency || detail.order?.transactionCurrency" :exponent="detail.order?.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.labelAmount')"><CurrencyAmountDisplay :amount="detail.order?.labelAmount" :currency="detail.order?.labelCurrency" :exponent="detail.order?.labelCurrencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelTransactionAmount')"><CurrencyAmountDisplay :amount="detail.order?.transactionAmount" :currency="detail.order?.transactionCurrency" :exponent="detail.order?.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionRate')">{{ rateText(detail.order?.transactionRate) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelMatchStatus')">
                            <TransactionStageStatusDisplay domain="matching" :value="capabilityRecord?.channelMatchStatus" :label="optionText(channelMatchStatusOptions, capabilityRecord?.channelMatchStatus)" />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.threeDs')">
                            <el-tag size="small" effect="plain" class="transaction-capability-tag transaction-capability-tag--three-ds" :class="{ 'is-enabled': capabilityRecord?.threeDsEnabled === 1 }">{{ t(capabilityRecord?.threeDsEnabled === 1 ? 'common.yes' : 'common.no') }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.dcc')">
                            <el-tag size="small" effect="plain" class="transaction-capability-tag transaction-capability-tag--dcc" :class="{ 'is-enabled': capabilityRecord?.dccEnabled === 1 }">{{ t(capabilityRecord?.dccEnabled === 1 ? 'transaction.capability.enabled' : 'transaction.capability.disabled') }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.edc')">
                            <el-tag size="small" effect="plain" class="transaction-capability-tag transaction-capability-tag--edc" :class="{ 'is-enabled': capabilityRecord?.edcEnabled === 1 }">{{ t(capabilityRecord?.edcEnabled === 1 ? 'transaction.capability.enabled' : 'transaction.capability.disabled') }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.labelAuthorizedAmount')"><CurrencyAmountDisplay :amount="detail.order?.labelAuthorizedAmount" :currency="detail.order?.labelCurrency" :exponent="detail.order?.labelCurrencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelAuthorizedAmount')"><CurrencyAmountDisplay :amount="detail.order?.authorizedAmount" :currency="detail.order?.transactionCurrency" :exponent="detail.order?.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.labelCapturedAmount')"><CurrencyAmountDisplay :amount="detail.order?.labelCapturedAmount" :currency="detail.order?.labelCurrency" :exponent="detail.order?.labelCurrencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelCapturedAmount')"><CurrencyAmountDisplay :amount="detail.order?.capturedAmount" :currency="detail.order?.transactionCurrency" :exponent="detail.order?.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.labelRefundedAmount')"><CurrencyAmountDisplay :amount="detail.order?.labelRefundedAmount" :currency="detail.order?.labelCurrency" :exponent="detail.order?.labelCurrencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelRefundedAmount')"><CurrencyAmountDisplay :amount="detail.order?.refundedAmount" :currency="detail.order?.transactionCurrency" :exponent="detail.order?.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.labelAvailableCaptureAmount')"><CurrencyAmountDisplay :amount="detail.order?.labelAvailableCaptureAmount" :currency="detail.order?.labelCurrency" :exponent="detail.order?.labelCurrencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelAvailableCaptureAmount')"><CurrencyAmountDisplay :amount="detail.order?.availableCaptureAmount" :currency="detail.order?.transactionCurrency" :exponent="detail.order?.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.labelAvailableRefundAmount')"><CurrencyAmountDisplay :amount="detail.order?.labelAvailableRefundAmount" :currency="detail.order?.labelCurrency" :exponent="detail.order?.labelCurrencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelAvailableRefundAmount')"><CurrencyAmountDisplay :amount="detail.order?.availableRefundAmount" :currency="detail.order?.transactionCurrency" :exponent="detail.order?.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                    </el-descriptions>
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.accessProcessing')" name="accessProcessing">
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item :label="t('transaction.detail.accessFields.accessType')">
                            {{ accessTypeText }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.detail.accessFields.merchantWebsite')">
                            <CopyableText :value="auditText(detail.order?.merchantWebsite)" :label="t('transaction.detail.accessFields.merchantWebsite')" wrap />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.detail.accessFields.ingressClientIp')">
                            <CopyableText :value="auditText(accessOperation?.ingressClientIp)" :label="t('transaction.detail.accessFields.ingressClientIp')" wrap />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.detail.accessFields.payerIp')">
                            <CopyableText :value="auditText(detail.payerInfo?.ipAddress)" :label="t('transaction.detail.accessFields.payerIp')" wrap />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.detail.accessFields.traceId')">
                            <CopyableText :value="auditText(processingTraceId)" :label="t('transaction.detail.accessFields.traceId')" wrap />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.detail.accessFields.processorService')">
                            <CopyableText :value="auditText(completionFlowEvent?.processorService)" :label="t('transaction.detail.accessFields.processorService')" wrap />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.detail.accessFields.processorInstanceId')">
                            <CopyableText :value="auditText(completionFlowEvent?.processorInstanceId)" :label="t('transaction.detail.accessFields.processorInstanceId')" wrap />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.detail.accessFields.processorPrivateIp')">
                            <CopyableText :value="auditText(completionFlowEvent?.processorPrivateIp)" :label="t('transaction.detail.accessFields.processorPrivateIp')" wrap />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.detail.accessFields.processorHostName')">
                            <CopyableText :value="auditText(completionFlowEvent?.processorHostName)" :label="t('transaction.detail.accessFields.processorHostName')" wrap />
                        </el-descriptions-item>
                    </el-descriptions>
                </el-tab-pane>

                <el-tab-pane v-if="partyInfoSections.length" :label="t('transaction.detail.partyInfo')" name="partyInfo">
                    <div class="transaction-detail__party-sections">
                        <section v-for="section in partyInfoSections" :key="section.key" class="transaction-detail__party-section">
                            <h3>{{ section.title }}</h3>
                            <dl class="transaction-detail__party-grid">
                                <div v-for="field in section.fields" :key="field.key" class="transaction-detail__party-field" :class="{ 'is-wide': field.wide }">
                                    <dt>{{ field.label }}</dt>
                                    <dd><CopyableText :value="field.value" :label="field.label" wrap /></dd>
                                </div>
                            </dl>
                        </section>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.operations')" name="operations">
                    <StandardTable table-key="transaction-detail-operations" :data="detail.operations || []" row-key="transactionId" size="small">
                        <el-table-column :label="t('transaction.fields.transactionId')" min-width="230" align="center" :show-overflow-tooltip="true">
                            <template #default="{ row }"><CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" wrap /></template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.transactionType')" width="150" align="center">
                            <template #default="{ row }">
                                <TransactionTypeDisplay :value="row.transactionType" :label="optionText(typeOptions, row.transactionType)" />
                            </template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.transactionStatus')" width="120" align="center">
                            <template #default="{ row }"><TransactionStatusDisplay :value="row.transactionStatus" :label="optionText(statusOptions, row.transactionStatus)" /></template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.labelAmount')" width="176" align="center">
                            <template #default="{ row }"><CurrencyAmountDisplay :amount="row.labelAmount" :currency="row.labelCurrency" :exponent="row.labelCurrencyExponent" :locale="String(locale)" align="center" /></template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.channelTransactionAmount')" width="184" align="center">
                            <template #default="{ row }"><CurrencyAmountDisplay :amount="row.transactionAmount" :currency="row.transactionCurrency" :exponent="row.currencyExponent" :locale="String(locale)" align="center" /></template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.transactionRate')" width="128" align="center">
                            <template #default="{ row }">{{ rateText(row.transactionRate) }}</template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.paymentMethodCardBrand')" width="140" align="center">
                            <template #default="{ row }">
                                <LegacyPaymentLogoGroup v-if="paymentLogos(row).length" :keys="paymentLogos(row)" size="sm" align="center" class="transaction-detail__logo-cell" />
                                <span v-else>-</span>
                            </template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.cardBin')" width="132" align="center">
                            <template #default="{ row }">{{ cardDisplayText(row.cardNumberMasked, row.cardBin) }}</template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.channelTransactionId')" min-width="210" align="center" :show-overflow-tooltip="true">
                            <template #default="{ row }"><CopyableText :value="row.channelTransactionId" :label="t('transaction.fields.channelTransactionId')" wrap /></template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.operationTime')" min-width="168" align="center">
                            <template #default="{ row }"><BaseDateTime :value="row.operationTime" source-time-zone="Asia/Shanghai" :display-time-zone="displayTimeZone" /></template>
                        </el-table-column>
                    </StandardTable>
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.amountChanges')" name="amountChanges">
                    <el-timeline v-if="amountChangeRows.length" class="transaction-detail__amount-timeline">
                        <el-timeline-item v-for="item in amountChangeRows" :key="String(item.amountChangeId || item.id || item.changeTime)" type="primary">
                            <article class="transaction-detail__amount-event">
                                <header class="transaction-detail__amount-event-head">
                                    <div class="transaction-detail__amount-event-title">
                                        <span class="transaction-detail__amount-event-icon"><el-icon><Operation /></el-icon></span>
                                        <div>
                                            <h3>
                                                <TransactionTypeDisplay
                                                    :value="String(item.changeType || '')"
                                                    :label="optionText(typeOptions, String(item.changeType || ''))"
                                                    size="md"
                                                    align="start"
                                                />
                                            </h3>
                                            <time>{{ displayRecordTime(item.changeTime || item.createTime) }}</time>
                                        </div>
                                    </div>
                                    <div class="transaction-detail__amount-event-value">
                                        <span>{{ t('transaction.detail.amountChange.actionAmount') }}</span>
                                        <CurrencyAmountDisplay :amount="amountDisplayValue(item, 'changeAmount', 'label')" :currency="amountDisplayCurrency(item, 'label')" :exponent="amountDisplayExponent('label')" :locale="String(locale)" emphasized />
                                        <small>{{ t('transaction.fields.channelTransactionAmount') }}: <CurrencyAmountDisplay :amount="amountDisplayValue(item, 'changeAmount', 'channel')" :currency="amountDisplayCurrency(item, 'channel')" :exponent="amountDisplayExponent('channel')" :locale="String(locale)" size="xs" /></small>
                                    </div>
                                </header>
                                <div class="transaction-detail__amount-metrics" :class="{ 'is-pair': amountMetrics(item).length === 2 }">
                                    <div v-for="metric in amountMetrics(item)" :key="metric.after" class="transaction-detail__amount-metric" :class="`is-${amountMetricTone(metric.after)}`">
                                        <div class="transaction-detail__amount-metric-head">
                                            <span class="transaction-detail__amount-metric-icon">
                                                <el-icon><component :is="amountMetricIcon(metric.after)" /></el-icon>
                                            </span>
                                            <span class="transaction-detail__amount-metric-label">{{ t(metric.label) }}</span>
                                        </div>
                                        <div class="transaction-detail__amount-metric-scopes">
                                            <div class="transaction-detail__amount-metric-values">
                                                <small>{{ t('transaction.fields.labelAmount') }}</small>
                                                <div>
                                                    <template v-if="amountHasChanged(item, metric.before, metric.after, 'label')">
                                                        <CurrencyAmountDisplay :amount="amountDisplayValue(item, metric.before, 'label')" :currency="amountDisplayCurrency(item, 'label')" :exponent="amountDisplayExponent('label')" :locale="String(locale)" size="xs" tone="muted" />
                                                        <span class="transaction-detail__amount-arrow" aria-hidden="true">→</span>
                                                    </template>
                                                    <CurrencyAmountDisplay :amount="amountDisplayValue(item, metric.after, 'label')" :currency="amountDisplayCurrency(item, 'label')" :exponent="amountDisplayExponent('label')" :locale="String(locale)" size="xs" emphasized />
                                                </div>
                                            </div>
                                            <div class="transaction-detail__amount-metric-values transaction-detail__amount-metric-values--channel">
                                                <small>{{ t('transaction.fields.channelTransactionAmount') }}</small>
                                                <div>
                                                    <template v-if="amountHasChanged(item, metric.before, metric.after, 'channel')">
                                                        <CurrencyAmountDisplay :amount="amountDisplayValue(item, metric.before, 'channel')" :currency="amountDisplayCurrency(item, 'channel')" :exponent="amountDisplayExponent('channel')" :locale="String(locale)" size="xs" tone="muted" />
                                                        <span class="transaction-detail__amount-arrow" aria-hidden="true">→</span>
                                                    </template>
                                                    <CurrencyAmountDisplay :amount="amountDisplayValue(item, metric.after, 'channel')" :currency="amountDisplayCurrency(item, 'channel')" :exponent="amountDisplayExponent('channel')" :locale="String(locale)" size="xs" emphasized />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p v-if="amountEventNote(item)" class="transaction-detail__amount-event-note">
                                    <el-icon><InfoFilled /></el-icon>
                                    <span>{{ amountEventNote(item) }}</span>
                                </p>
                            </article>
                        </el-timeline-item>
                    </el-timeline>
                    <el-empty v-if="!amountChangeRows.length" :description="t('transaction.detail.empty')" />
                </el-tab-pane>

                <el-tab-pane v-if="canViewFinance" :label="t('transaction.detail.finance.title')" name="finance" lazy>
                    <TransactionFinanceDetail :active="activeTab === 'finance'" :detail="detail" :focus-transaction-id="focusTransactionId" :display-time-zone="displayTimeZone" :type-options="typeOptions" />
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.timeline')" name="timeline" lazy>
                    <div v-loading="detailSections.timeline.loading" class="transaction-detail__lazy-section">
                        <TransactionFlowTimeline v-if="timelineDetail" :detail="timelineDetail" :focus-transaction-id="focusTransactionId" :display-time-zone="displayTimeZone" :type-options="typeOptions" :status-options="statusOptions" />
                        <div v-show="detailSections.timeline.total > 0" class="pagination-container transaction-detail__pagination">
                            <el-pagination v-model:current-page="detailSections.timeline.pageNo" v-model:page-size="detailSections.timeline.pageSize" :total="detailSections.timeline.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" background @current-change="loadDetailSection('timeline')" @size-change="resetDetailSectionPage('timeline')" />
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.channel')" name="channel" lazy>
                    <div v-loading="detailSections.channel.loading" class="transaction-detail__lazy-section">
                        <RecordList :rows="detailSections.channel.rows" variant="channel" :display-time-zone="displayTimeZone" :type-options="typeOptions" @load-payload="loadRecordPayload" />
                        <div v-show="detailSections.channel.total > 0" class="pagination-container transaction-detail__pagination">
                            <el-pagination v-model:current-page="detailSections.channel.pageNo" v-model:page-size="detailSections.channel.pageSize" :total="detailSections.channel.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" background @current-change="loadDetailSection('channel')" @size-change="resetDetailSectionPage('channel')" />
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.callback')" name="callback" lazy>
                    <div v-loading="detailSections.callback.loading" class="transaction-detail__lazy-section">
                        <RecordList :rows="detailSections.callback.rows" variant="callback" :display-time-zone="displayTimeZone" :type-options="typeOptions" @load-payload="loadRecordPayload" />
                        <div v-show="detailSections.callback.total > 0" class="pagination-container transaction-detail__pagination">
                            <el-pagination v-model:current-page="detailSections.callback.pageNo" v-model:page-size="detailSections.callback.pageSize" :total="detailSections.callback.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" background @current-change="loadDetailSection('callback')" @size-change="resetDetailSectionPage('callback')" />
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.merchantNotification')" name="notification" lazy>
                    <div v-loading="detailSections.notification.loading" class="transaction-detail__lazy-section">
                        <RecordList :rows="detailSections.notification.rows" variant="callback" :display-time-zone="displayTimeZone" :type-options="typeOptions" @load-payload="loadRecordPayload" />
                        <div v-show="detailSections.notification.total > 0" class="pagination-container transaction-detail__pagination">
                            <el-pagination v-model:current-page="detailSections.notification.pageNo" v-model:page-size="detailSections.notification.pageSize" :total="detailSections.notification.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" background @current-change="loadDetailSection('notification')" @size-change="resetDetailSectionPage('notification')" />
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.merchantApi')" name="merchantApi" lazy>
                    <div v-loading="detailSections.merchantApi.loading" class="transaction-detail__lazy-section">
                        <RecordList :rows="detailSections.merchantApi.rows" variant="merchantApi" :display-time-zone="displayTimeZone" :type-options="typeOptions" @load-payload="loadRecordPayload" />
                        <div v-show="detailSections.merchantApi.total > 0" class="pagination-container transaction-detail__pagination">
                            <el-pagination v-model:current-page="detailSections.merchantApi.pageNo" v-model:page-size="detailSections.merchantApi.pageSize" :total="detailSections.merchantApi.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" background @current-change="loadDetailSection('merchantApi')" @size-change="resetDetailSectionPage('merchantApi')" />
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
        <el-empty v-else :description="t('transaction.detail.empty')" />
    </CommonDetailDrawer>
</template>

<script setup lang="ts">
import ChannelIdentity from '@/views/channel/components/ChannelIdentity.vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
    CircleCheck,
    Clock,
    CloseBold,
    CreditCard,
    InfoFilled,
    Loading,
    Operation,
    RefreshLeft,
    Shop,
    Tickets,
    User,
    Wallet,
} from '@element-plus/icons-vue';
import { TransactionStageStatusDisplay, CurrencyAmountDisplay, safeErrorType, TransactionStatusDisplay, TransactionTypeDisplay, type PaymentLogoKey } from '@acquiring/shared';
import { LegacyPaymentLogoGroup } from '@acquiring/shared/legacy';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import type {
    TransactionContactInfo,
    TransactionDetail,
    TransactionDetailRecord,
    TransactionDetailScope,
    TransactionDetailSection,
    TransactionFlowEvent,
    TransactionOperation,
    TransactionOrder,
    TransactionPayerInfo,
} from '@/api/transaction';
import { getTransactionDetailRecordPayload, getTransactionDetailRecords } from '@/api/transaction';
import { formatDateTimeFromSourceTimeZone } from '@/utils/format';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    cardDisplayText,
    fallbackTransactionStatusOptions,
    fallbackTransactionStatusScopeOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    mergeTransactionDictOptions,
    optionText,
    rateText,
    transactionPaymentLogoKeys,
    type TransactionDictOption,
} from '../shared';
import CopyableText from './CopyableText.vue';
import RecordList from './TransactionRecordList.vue';
import TransactionFinanceDetail from './TransactionFinanceDetail.vue';
import TransactionFlowTimeline from './TransactionFlowTimeline.vue';
import TransactionSuccessCheckIcon from './TransactionSuccessCheckIcon.vue';

const props = defineProps<{
    visible: boolean;
    title: string;
    detail: TransactionDetail | null;
    detailScope: TransactionDetailScope;
    focusTransactionId?: string;
    displayTimeZone?: string;
    loading?: boolean;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
}>();

const { t, locale } = useI18n();
const userStore = useUserStore();
const activeTab = ref('base');
const typeOptions = ref<TransactionDictOption[]>(fallbackTransactionTypeOptions(t));
const statusOptions = ref<TransactionDictOption[]>(fallbackTransactionStatusOptions(t));
const channelMatchStatusOptions = ref<TransactionDictOption[]>(fallbackTransactionStatusScopeOptions(t, 'channelMatch'));
const canViewFinance = computed(() =>
    [
        'clearing:record:detail',
        'reconciliation:record:detail',
        'settlement:result-item:transaction-detail',
        'settlement:reserve-item:transaction-detail',
    ].some((permission) => userStore.hasPermission(permission)),
);

const displayTimeZone = computed(() => props.displayTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE);

type DetailSectionKey = 'timeline' | 'channel' | 'callback' | 'notification' | 'merchantApi';

interface DetailSectionState {
    rows: Record<string, unknown>[];
    pageNo: number;
    pageSize: number;
    total: number;
    loading: boolean;
    loaded: boolean;
}

const DETAIL_SECTION_TYPES: Record<DetailSectionKey, TransactionDetailSection> = {
    timeline: 'TIMELINE',
    channel: 'CHANNEL',
    callback: 'CALLBACK',
    notification: 'NOTIFICATION',
    merchantApi: 'MERCHANT_API',
};

const detailSections = reactive<Record<DetailSectionKey, DetailSectionState>>(createDetailSections());

const drawerVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
});

const amountChangeRows = computed(() => (props.detail?.amountChanges || []) as Record<string, unknown>[]);

const timelineDetail = computed<TransactionDetail | null>(() => {
    if (!props.detail) return null;
    const rows = detailSections.timeline.rows;
    return {
        ...props.detail,
        statusHistory: rows.filter((row) => row.detailRecordType === 'STATUS_HISTORY'),
        flowEvents: rows.filter((row) => row.detailRecordType === 'FLOW_EVENT') as TransactionFlowEvent[],
        riskEvents: rows.filter((row) => row.detailRecordType === 'RISK_EVENT'),
        // 金额变动已有独立核心页签，避免时间线翻页时重复展示同一批金额事实。
        amountChanges: [],
    };
});

interface PartyInfoField {
    key: string;
    label: string;
    value: string;
    wide?: boolean;
}

interface PartyInfoSection {
    key: string;
    title: string;
    fields: PartyInfoField[];
}

const partyInfoSections = computed<PartyInfoSection[]>(() => {
    const sections: PartyInfoSection[] = [];
    if (props.detail?.billingCardHolderInfo) {
        appendPartyInfoSection(
            sections,
            'billingCardHolderInfo',
            t('transaction.detail.billingCardHolderInfo'),
            contactInfoFields(props.detail.billingCardHolderInfo),
        );
    }
    if (props.detail?.payerInfo) {
        appendPartyInfoSection(sections, 'payerInfo', t('transaction.detail.payerInfo'), payerInfoFields(props.detail.payerInfo));
    }
    if (props.detail?.shippingInfo) {
        appendPartyInfoSection(
            sections,
            'shippingInfo',
            t('transaction.detail.shippingInfo'),
            contactInfoFields(props.detail.shippingInfo),
        );
    }
    return sections;
});

function appendPartyInfoSection(sections: PartyInfoSection[], key: string, title: string, fields: PartyInfoField[]) {
    const populatedFields = fields.filter((field) => field.value);
    if (populatedFields.length) {
        sections.push({ key, title, fields: populatedFields });
    }
}

function contactInfoFields(info: TransactionContactInfo): PartyInfoField[] {
    return [
        partyInfoField('firstName', info.firstName),
        partyInfoField('lastName', info.lastName),
        partyInfoField('phone', info.phone),
        partyInfoField('email', info.email),
        partyInfoField('country', info.country),
        partyInfoField('state', info.state),
        partyInfoField('city', info.city),
        partyInfoField('postal', info.postal),
        partyInfoField('street', info.street),
    ];
}

function payerInfoFields(info: TransactionPayerInfo): PartyInfoField[] {
    return [
        partyInfoField('payerId', info.payerId),
        ...contactInfoFields(info),
        partyInfoField('ipAddress', info.ipAddress),
        partyInfoField('sessionId', info.sessionId),
        partyInfoField('browserInfo', info.browserInfo, true),
        partyInfoField('userAgent', info.userAgent, true),
    ];
}

function partyInfoField(key: string, value: unknown, wide = false): PartyInfoField {
    return {
        key,
        label: t(`transaction.detail.partyFields.${key}`),
        value: partyInfoValue(value),
        wide,
    };
}

function partyInfoValue(value: unknown): string {
    if (value === undefined || value === null || value === '') {
        return '';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
}

const focusedOperation = computed(() => {
    const operations = props.detail?.operations || [];
    if (props.focusTransactionId) {
        return operations.find((item) => item.transactionId === props.focusTransactionId);
    }
    return undefined;
});

const accessOperation = computed(() => {
    if (focusedOperation.value) {
        return focusedOperation.value;
    }
    const operations = props.detail?.operations || [];
    const rootTransactionId = props.detail?.order?.rootTransactionId;
    return operations.find((item) => item.transactionId === rootTransactionId) || operations[0];
});

const accessTypeText = computed(() => {
    const accessType = accessOperation.value?.accessType;
    if (accessType === 'HOSTED_CHECKOUT') {
        return t('transaction.detail.accessTypes.hostedCheckout');
    }
    if (accessType === 'DIRECT_API') {
        return t('transaction.detail.accessTypes.directApi');
    }
    return auditText(accessType);
});

const completionFlowEvent = computed<TransactionFlowEvent | undefined>(() => {
    const events = timelineDetail.value?.flowEvents || [];
    const hasProcessorAudit = (event: TransactionFlowEvent) =>
        Boolean(
            event.processorService || event.processorInstanceId || event.processorHostName || event.processorPrivateIp || event.traceId,
        );
    const focusedEvents = props.focusTransactionId ? events.filter((event) => event.transactionId === props.focusTransactionId) : events;
    return [...focusedEvents].reverse().find(hasProcessorAudit) || [...events].reverse().find(hasProcessorAudit);
});

const processingTraceId = computed(() => {
    if (completionFlowEvent.value?.traceId) {
        return completionFlowEvent.value.traceId;
    }
    const apiLogs = detailSections.merchantApi.rows;
    const focusedLog = props.focusTransactionId
        ? [...apiLogs].reverse().find((item) => item.transactionId === props.focusTransactionId && item.traceId)
        : undefined;
    return focusedLog?.traceId || [...apiLogs].reverse().find((item) => item.traceId)?.traceId;
});

function auditText(value: unknown): string {
    return value === undefined || value === null || value === '' ? '-' : String(value);
}

const capabilityRecord = computed(() => focusedOperation.value || props.detail?.order);

const summaryRecord = computed(() => focusedOperation.value || props.detail?.order);

const summaryType = computed(() => focusedOperation.value?.transactionType || props.detail?.order?.transactionType || '');

const summaryStatus = computed(
    () => focusedOperation.value?.transactionStatus || props.detail?.order?.lifecycleStatus || props.detail?.order?.transactionStatus || '',
);

const summaryTypeText = computed(() => optionText(typeOptions.value, summaryType.value));

const summaryStatusText = computed(() => {
    if (!focusedOperation.value && props.detail?.order?.lifecycleStatus) {
        return t(
            `transaction.lifecycleStatus.${props.detail.order.lifecycleStatus}`,
            optionText(statusOptions.value, props.detail.order.transactionStatus),
        );
    }
    return optionText(statusOptions.value, summaryStatus.value);
});

const summaryResultText = computed(() => {
    const type = summaryTypeText.value === '-' ? '' : summaryTypeText.value;
    const status = summaryStatusText.value === '-' ? '' : summaryStatusText.value;
    if (!type && !status) {
        return '-';
    }
    if (!type || !status) {
        return type || status;
    }
    return String(locale.value || '').startsWith('zh') ? `${type}${status}` : `${type} ${status}`;
});

const summaryTransactionId = computed(() => focusedOperation.value?.transactionId || props.detail?.order?.rootTransactionId || '-');

const summaryMerchantId = computed(() => focusedOperation.value?.merchantId || props.detail?.order?.merchantId || '-');

const summaryMerchantOrderNo = computed(() => focusedOperation.value?.merchantOrderNo || props.detail?.order?.merchantOrderNo || '-');

const summaryChannelOrderNo = computed(() => focusedOperation.value?.channelOrderNo || props.detail?.order?.channelOrderNo || '-');

const summaryChannelCode = computed(() => {
    const record = summaryRecord.value;
    const channelCode = String(record?.channelCode || '');
    const channelName = String(record?.channelName || '');
    return channelCode || channelName || '-';
});

const summaryChannelFullName = computed(() => {
    const record = summaryRecord.value;
    const channelCode = String(record?.channelCode || '');
    const channelName = String(record?.channelName || '');
    if (channelCode && channelName && channelCode !== channelName) {
        return channelName;
    }
    return '';
});

const summaryPaymentLogos = computed(() => paymentLogos(summaryRecord.value));

const summaryPaymentText = computed(() => paymentText(summaryRecord.value?.paymentMethod, summaryRecord.value?.paymentBrand));

const summaryTone = computed(() => {
    if (summaryStatus.value === 'SUCCESS' || ['CAPTURED', 'PARTIALLY_CAPTURED', 'PARTIALLY_REFUNDED'].includes(summaryStatus.value)) {
        return 'success';
    }
    if (summaryStatus.value === 'FAILED') {
        return 'failed';
    }
    if (summaryStatus.value === 'PENDING' || ['VOIDED', 'FULLY_REFUNDED'].includes(summaryStatus.value)) {
        return 'pending';
    }
    return 'processing';
});

const summaryIcon = computed(() => {
    if (summaryTone.value === 'failed') {
        return CloseBold;
    }
    if (summaryTone.value === 'pending') {
        return Clock;
    }
    return Loading;
});

watch(activeTab, (tab) => {
    const sectionKey = asDetailSectionKey(tab);
    if (props.visible && props.detail && sectionKey && !detailSections[sectionKey].loaded) {
        loadDetailSection(sectionKey);
    }
});

watch(
    [
        () => props.detailScope,
        () => detailLocator()?.transactionId,
        () => detailLocator()?.transactionDateTime,
        () => detailLocator()?.rootTransactionDateTime,
    ],
    () => {
        resetDetailSections();
        const sectionKey = asDetailSectionKey(activeTab.value);
        if (props.visible && sectionKey) void loadDetailSection(sectionKey);
    },
);

watch(
    () => props.visible,
    (visible) => {
        if (!visible) {
            activeTab.value = 'base';
            resetDetailSections();
        }
    },
);

onMounted(loadDictionaries);
watch(locale, loadDictionaries);

function createDetailSections(): Record<DetailSectionKey, DetailSectionState> {
    const create = (): DetailSectionState => ({ rows: [], pageNo: 1, pageSize: 10, total: 0, loading: false, loaded: false });
    return {
        timeline: create(),
        channel: create(),
        callback: create(),
        notification: create(),
        merchantApi: create(),
    };
}

function resetDetailSections() {
    Object.assign(detailSections, createDetailSections());
}

function asDetailSectionKey(value: string): DetailSectionKey | null {
    return Object.prototype.hasOwnProperty.call(DETAIL_SECTION_TYPES, value) ? value as DetailSectionKey : null;
}

function detailLocator() {
    const order = props.detail?.order;
    if (!order) return null;
    const operation = focusedOperation.value
        || props.detail?.operations.find((item) => item.transactionId === props.focusTransactionId)
        || props.detail?.operations[0];
    const transactionId = props.focusTransactionId || operation?.transactionId || order.rootTransactionId;
    const transactionDateTime = operation?.transactionDateTime || order.transactionDateTime;
    const rootTransactionDateTime = order.rootTransactionDateTime || order.transactionDateTime;
    if (!transactionId || !transactionDateTime || !rootTransactionDateTime) return null;
    return { transactionId, transactionDateTime, rootTransactionDateTime };
}

async function loadDetailSection(sectionKey: DetailSectionKey) {
    const locator = detailLocator();
    const state = detailSections[sectionKey];
    if (!locator || state.loading) return;
    state.loading = true;
    try {
        const page = await getTransactionDetailRecords(
            props.detailScope,
            locator.transactionId,
            locator.transactionDateTime,
            locator.rootTransactionDateTime,
            DETAIL_SECTION_TYPES[sectionKey],
            state.pageNo,
            state.pageSize,
        );
        state.rows = (page.records || []).map(flattenDetailRecord);
        state.total = Number(page.total || 0);
        state.loaded = true;
    } catch (error) {
        console.warn('[admin-system] transaction detail section unavailable', safeErrorType(error));
        state.rows = [];
        state.total = 0;
        state.loaded = false;
        ElMessage.error(t('common.loadFailed'));
    } finally {
        state.loading = false;
    }
}

function resetDetailSectionPage(sectionKey: DetailSectionKey) {
    detailSections[sectionKey].pageNo = 1;
    loadDetailSection(sectionKey);
}

function flattenDetailRecord(item: TransactionDetailRecord): Record<string, unknown> {
    return {
        ...(item.record || {}),
        detailRecordType: item.recordType,
        detailRecordId: item.recordId,
        detailRecordTime: item.recordTime,
        detailPayloadAvailable: item.payloadAvailable,
        detailPayloadLoading: false,
    };
}

async function loadRecordPayload(row: Record<string, unknown>) {
    const locator = detailLocator();
    const recordType = String(row.detailRecordType || '');
    const recordId = String(row.detailRecordId || '');
    if (!locator || !recordType || !recordId || row.detailPayloadLoading === true) return;
    row.detailPayloadLoading = true;
    try {
        const payload = await getTransactionDetailRecordPayload(
            props.detailScope,
            locator.transactionId,
            locator.transactionDateTime,
            locator.rootTransactionDateTime,
            recordType,
            recordId,
        );
        Object.assign(row, payload.record || {}, {
            detailRecordType: payload.recordType,
            detailRecordId: payload.recordId,
            detailRecordTime: payload.recordTime,
            detailPayloadAvailable: false,
            detailPayloadLoading: false,
        });
    } catch (error) {
        console.warn('[admin-system] transaction detail payload unavailable', safeErrorType(error));
        row.detailPayloadLoading = false;
        ElMessage.error(t('common.loadFailed'));
    }
}

async function loadDictionaries() {
    const fallbackTypes = fallbackTransactionTypeOptions(t);
    const fallbackStatuses = fallbackTransactionStatusOptions(t);
    const fallbackChannelMatches = fallbackTransactionStatusScopeOptions(t, 'channelMatch');
    typeOptions.value = fallbackTypes;
    statusOptions.value = fallbackStatuses;
    channelMatchStatusOptions.value = fallbackChannelMatches;
    try {
        const [types, statuses, channelMatches] = await Promise.all([
            loadTransactionDictOptions('transaction_type', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('transaction_status', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('channel_match_status', String(locale.value || 'zh-CN')).catch(() => []),
        ]);
        typeOptions.value = mergeTransactionDictOptions(types, fallbackTypes);
        statusOptions.value = mergeTransactionDictOptions(statuses, fallbackStatuses);
        channelMatchStatusOptions.value = mergeTransactionDictOptions(channelMatches, fallbackChannelMatches);
    } catch (error) {
        console.warn('[admin-system] transaction dictionaries unavailable', safeErrorType(error));
    }
}

function paymentText(paymentMethod?: string, paymentBrand?: string) {
    if (!paymentMethod && !paymentBrand) {
        return '-';
    }
    return [paymentMethod, paymentBrand].filter(Boolean).join(' / ');
}

function paymentLogos(row?: Pick<TransactionOrder | TransactionOperation, 'paymentMethod' | 'paymentBrand'>): PaymentLogoKey[] {
    return transactionPaymentLogoKeys(row?.paymentMethod, row?.paymentBrand);
}

function amountValue(value: unknown) {
    return value as number | string | null | undefined;
}

function amountFieldKey(key: string, scope: 'label' | 'channel') {
    return scope === 'label' ? `label${key.charAt(0).toUpperCase()}${key.slice(1)}` : key;
}

function amountDisplayValue(row: Record<string, unknown>, key: string, scope: 'label' | 'channel') {
    return amountValue(row[amountFieldKey(key, scope)]);
}

function amountDisplayCurrency(row: Record<string, unknown>, scope: 'label' | 'channel') {
    return scope === 'label'
        ? String(row.labelAmountCurrency || props.detail?.order?.labelCurrency || '')
        : String(row.amountCurrency || props.detail?.order?.transactionCurrency || '');
}

function amountDisplayExponent(scope: 'label' | 'channel') {
    return scope === 'label' ? props.detail?.order?.labelCurrencyExponent : props.detail?.order?.currencyExponent;
}

function amountHasChanged(row: Record<string, unknown>, beforeKey: string, afterKey: string, scope: 'label' | 'channel') {
    return String(row[amountFieldKey(beforeKey, scope)] ?? '') !== String(row[amountFieldKey(afterKey, scope)] ?? '');
}

function amountMetrics(row: Record<string, unknown>) {
    const metric = (label: string, field: string) => ({
        label: `transaction.fields.${label}`,
        before: `${field}Before`,
        after: `${field}After`,
    });
    switch (String(row.changeType || '')) {
        case 'PAYMENT':
            return [
                metric('authorizedAmount', 'authorized'),
                metric('capturedAmount', 'captured'),
                metric('availableRefundAmount', 'availableRefund'),
            ];
        case 'AUTHORIZATION':
        case 'PRE_AUTHORIZATION':
        case 'INCREMENTAL_AUTHORIZATION':
        case 'VOID':
            return [metric('authorizedAmount', 'authorized'), metric('availableCaptureAmount', 'availableCapture')];
        case 'CAPTURE':
        case 'PRE_AUTH_COMPLETION':
            return [
                metric('capturedAmount', 'captured'),
                metric('availableCaptureAmount', 'availableCapture'),
                metric('availableRefundAmount', 'availableRefund'),
            ];
        case 'REFUND':
            return [
                metric('capturedAmount', 'captured'),
                metric('refundedAmount', 'refunded'),
                metric('availableRefundAmount', 'availableRefund'),
            ];
        default:
            return [metric('authorizedAmount', 'authorized'), metric('capturedAmount', 'captured'), metric('refundedAmount', 'refunded')];
    }
}

function amountMetricTone(field: string) {
    if (field.includes('availableRefund')) return 'warning';
    if (field.includes('refunded')) return 'danger';
    if (field.includes('captured')) return 'success';
    if (field.includes('availableCapture')) return 'info';
    return 'primary';
}

function amountMetricIcon(field: string) {
    if (field.includes('availableRefund') || field.includes('refunded')) return RefreshLeft;
    if (field.includes('captured')) return CircleCheck;
    if (field.includes('availableCapture')) return Wallet;
    return CreditCard;
}

function amountEventNote(row: Record<string, unknown>) {
    if (row.changeType === 'PAYMENT') return t('transaction.detail.amountChange.paymentCombined');
    if (row.changeType === 'REFUND') return t('transaction.detail.amountChange.refundBalance');
    return '';
}

function displayRecordTime(value: unknown) {
    return formatDateTimeFromSourceTimeZone(
        value as string | number | Date | null | undefined,
        DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
        displayTimeZone.value,
    );
}

</script>
<style scoped>
.transaction-detail__lazy-section {
    min-height: 180px;
}

.transaction-detail__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}

.transaction-capability-tag {
    --capability-color: #64748b;
    --capability-border: #cbd5e1;
    --capability-background: #f8fafc;
    gap: 6px;
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

.transaction-detail {
    --transaction-detail-border: var(--el-border-color-lighter);

    display: flex;
    flex-direction: column;
    gap: 18px;
}

.transaction-detail__hero {
    display: grid;
    overflow: hidden;
    align-items: stretch;
    grid-template-columns: minmax(210px, 0.9fr) repeat(2, minmax(170px, 0.75fr)) minmax(240px, 1.1fr);
    min-height: 112px;
    border: 1px solid var(--transaction-detail-border);
    border-left-width: 4px;
    border-radius: 8px;
    background: var(--el-bg-color);
    box-shadow: 0 5px 18px rgba(15, 23, 42, 0.045);
}

.transaction-detail__hero.is-success {
    border-left-color: var(--el-color-success);
}

.transaction-detail__hero.is-failed {
    border-left-color: var(--el-color-danger);
}

.transaction-detail__hero.is-pending {
    border-left-color: var(--el-color-warning);
}

.transaction-detail__hero.is-processing {
    border-left-color: var(--el-color-primary);
}

.transaction-detail__hero-item {
    display: flex;
    position: relative;
    justify-content: center;
    flex-direction: column;
    min-width: 0;
    padding: 22px 28px;
}

.transaction-detail__hero-item + .transaction-detail__hero-item::before {
    position: absolute;
    top: 22px;
    bottom: 22px;
    left: 0;
    width: 1px;
    background: var(--transaction-detail-border);
    content: '';
}

.transaction-detail__hero-status {
    align-items: center;
    justify-content: flex-start;
    flex-direction: row;
    gap: 16px;
    padding-left: 22px;
}

.transaction-detail__hero-content {
    display: grid;
    min-width: 0;
    gap: 3px;
}

.transaction-detail__hero-label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
}

.transaction-detail__status-value {
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 20px;
    font-weight: 700;
    line-height: 28px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-detail__hero.is-success .transaction-detail__status-value {
    color: var(--el-color-success);
}

.transaction-detail__hero.is-failed .transaction-detail__status-value {
    color: var(--el-color-danger);
}

.transaction-detail__hero.is-pending .transaction-detail__status-value {
    color: var(--el-color-warning-dark-2);
}

.transaction-detail__hero.is-processing .transaction-detail__status-value {
    color: var(--el-color-primary);
}

.transaction-detail__status-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    color: #fff;
    font-size: 25px;
}

.transaction-detail__success-check {
    width: 48px;
    height: 48px;
    overflow: visible;
    color: currentColor;
    transform: translateX(-2.4px);
}

.transaction-detail__hero.is-success .transaction-detail__status-icon {
    background: var(--el-color-success);
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.transaction-detail__hero.is-failed .transaction-detail__status-icon {
    background: var(--el-color-danger);
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

.transaction-detail__hero.is-pending .transaction-detail__status-icon {
    background: var(--el-color-warning);
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--el-color-warning) 13%, transparent);
}

.transaction-detail__hero.is-processing .transaction-detail__status-icon {
    background: var(--el-color-primary);
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.transaction-detail__hero.is-processing .transaction-detail__status-icon :deep(.el-icon) {
    animation: transaction-status-spin 1.2s linear infinite;
}

@keyframes transaction-status-spin {
    to {
        transform: rotate(360deg);
    }
}

.transaction-detail__money-value {
    display: flex;
    align-items: baseline;
    min-width: 0;
    gap: 9px;
    margin-top: 7px;
    font-variant-numeric: tabular-nums;
}

.transaction-detail__money-value span {
    flex: 0 0 auto;
    color: var(--el-text-color-regular);
    font-size: 14px;
    font-weight: 650;
    }

.transaction-detail__money-value :deep(.currency-amount-display__amount) {
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 26px;
    font-weight: 700;
    line-height: 34px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-detail__hero-amount--channel .transaction-detail__money-value :deep(.currency-amount-display__amount) {
    font-size: 24px;
    }

.transaction-detail__hero-channel {
    align-items: flex-start;
    }

.transaction-detail__channel-value {
    display: flex;
    align-items: center;
    max-width: 100%;
    gap: 14px;
    margin-top: 7px;
    }

.transaction-detail__channel-main {
    display: grid;
    min-width: 0;
    gap: 2px;
    }

.transaction-detail__channel-main strong {
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
    text-overflow: ellipsis;
    white-space: nowrap;
    }

.transaction-detail__channel-main span {
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
    }

.transaction-detail__payment-method {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    max-width: 100%;
    gap: 8px;
    min-height: 32px;
    border: 1px solid var(--transaction-detail-border);
    border-radius: 6px;
    padding: 3px 9px;
    background: var(--el-bg-color-page);
    }

.transaction-detail__payment-method > span {
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
    }

.transaction-detail__payment-method :deep(.payment-logo-group),
.transaction-detail__inline-logos,
.transaction-detail__logo-cell,
.transaction-detail__logo-cell :deep(.payment-logo-group) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    }

.transaction-detail__payment-method :deep(.payment-logo-mark),
.transaction-detail__inline-logos :deep(.payment-logo-mark),
.transaction-detail__logo-cell :deep(.payment-logo-mark) {
    align-self: center;
    }

.transaction-detail__inline-logos {
    display: inline-flex;
    width: 100%;
    justify-content: flex-start;
    vertical-align: middle;
    }

.transaction-detail__logo-cell {
    display: inline-flex;
    width: 100%;
    justify-content: center;
}

.transaction-detail__identity-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
}

.transaction-detail__identity-item {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 12px;
    border: 1px solid var(--transaction-detail-border);
    border-radius: 8px;
    padding: 13px 15px;
    background: var(--el-bg-color);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.025);
    transition:
        border-color 0.16s ease,
        box-shadow 0.16s ease,
        transform 0.16s ease;
}

.transaction-detail__identity-item:hover {
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 5px 14px rgba(31, 45, 61, 0.07);
    transform: translateY(-1px);
}

.transaction-detail__identity-item > div {
    min-width: 0;
}

.transaction-detail__identity-icon {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 50%;
    background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color));
    color: var(--el-color-primary);
    font-size: 17px !important;
}

.transaction-detail__identity-item > div > span {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.transaction-detail__identity-grid :deep(.copyable-text) {
    justify-content: flex-start;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    font-weight: 550;
    line-height: 22px;
    text-align: left;
}

.transaction-detail__tabs {
    min-width: 0;
}

.transaction-detail__tabs :deep(.el-tabs__header) {
    margin-bottom: 18px;
}

.transaction-detail__tabs :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background: var(--transaction-detail-border);
}

.transaction-detail__tabs :deep(.el-tabs__item) {
    height: 44px;
    padding: 0 20px;
    font-weight: 600;
}

.transaction-detail__party-sections {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
    gap: 14px;
}

.transaction-detail__party-section {
    overflow: hidden;
    min-width: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    background: var(--el-bg-color);
}

.transaction-detail__party-section h3 {
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 10px 14px;
    background: var(--el-fill-color-extra-light);
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 22px;
}

.transaction-detail__party-grid {
    margin: 0;
}

.transaction-detail__party-field {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    min-width: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 8px 12px;
    transition: background-color 0.16s ease;
}

.transaction-detail__party-field:last-child {
    border-bottom: 0;
}

.transaction-detail__party-field.is-wide {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 3px;
}

.transaction-detail__party-field:hover {
    background: var(--el-fill-color-extra-light);
}

.transaction-detail__party-field dt,
.transaction-detail__party-field dd {
    min-width: 0;
    margin: 0;
    line-height: 22px;
}

.transaction-detail__party-field dt {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.transaction-detail__party-field dd {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
}

.transaction-detail__party-field :deep(.copyable-text) {
    width: 100%;
    justify-content: flex-start;
    color: var(--el-text-color-primary);
    text-align: left;
}

.transaction-detail__party-field :deep(.copyable-text .el-icon) {
    opacity: 0;
    color: var(--el-text-color-secondary);
        transition:
            color 0.16s ease,
            opacity 0.16s ease;
}

.transaction-detail__party-field:hover :deep(.copyable-text .el-icon),
.transaction-detail__party-field:focus-within :deep(.copyable-text .el-icon) {
    opacity: 1;
}

.transaction-detail__party-field :deep(.copyable-text:hover .el-icon),
.transaction-detail__party-field :deep(.copyable-text:focus-visible .el-icon) {
    color: var(--el-color-primary);
}

.transaction-detail__party-field.is-wide :deep(.copyable-text.is-wrap span) {
    white-space: pre-wrap;
    word-break: break-word;
}

.transaction-detail__timezone {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
}

.transaction-detail__amount-timeline {
    width: min(100%, 2400px);
    margin: 0 auto;
    padding: 10px 4px 0 8px;
}

.transaction-detail__amount-timeline :deep(.el-timeline-item__wrapper) {
    padding-left: 24px;
}

.transaction-detail__amount-timeline :deep(.el-timeline-item__node) {
    top: 27px;
    width: 11px;
    height: 11px;
    border: 2px solid var(--el-bg-color);
    box-shadow: 0 0 0 4px var(--el-color-primary-light-9);
}

.transaction-detail__amount-event {
    margin-bottom: 18px;
    border: 1px solid var(--transaction-detail-border);
    border-radius: 8px;
    padding: 18px;
    background: var(--el-bg-color);
    box-shadow: 0 5px 18px rgba(15, 23, 42, 0.04);
}

.transaction-detail__amount-event-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--transaction-detail-border);
    padding-bottom: 15px;
}

.transaction-detail__amount-event-head time,
.transaction-detail__amount-event-value > span,
.transaction-detail__amount-metric-label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.transaction-detail__amount-event-title {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 12px;
}

.transaction-detail__amount-event-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 50%;
    background: color-mix(in srgb, var(--el-color-primary) 7%, var(--el-bg-color));
    color: var(--el-color-primary);
    font-size: 18px;
}

.transaction-detail__amount-event-head h3 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
}

.transaction-detail__amount-event-value {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
}

.transaction-detail__amount-event-value strong {
    color: var(--el-text-color-primary);
    font-size: 20px;
    line-height: 28px;
    font-variant-numeric: tabular-nums;
}

.transaction-detail__amount-event-value small {
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 18px;
    font-variant-numeric: tabular-nums;
}

.transaction-detail__amount-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.transaction-detail__amount-metrics.is-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.transaction-detail__amount-metric {
    --metric-accent: var(--el-color-primary);
    --metric-soft: color-mix(in srgb, var(--metric-accent) 7%, var(--el-bg-color));

    min-width: 0;
    border: 1px solid var(--transaction-detail-border);
    border-top: 3px solid color-mix(in srgb, var(--metric-accent) 72%, var(--transaction-detail-border));
    border-radius: 8px;
    padding: 14px 15px 15px;
    background: var(--el-bg-color);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.025);
}

.transaction-detail__amount-metric.is-success {
    --metric-accent: var(--el-color-success);
}

.transaction-detail__amount-metric.is-warning {
    --metric-accent: var(--el-color-warning);
}

.transaction-detail__amount-metric.is-danger {
    --metric-accent: var(--el-color-danger);
}

.transaction-detail__amount-metric.is-info {
    --metric-accent: var(--el-color-info);
}

.transaction-detail__amount-metric-head {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 12px;
}

.transaction-detail__amount-metric-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--metric-soft);
    color: var(--metric-accent);
    font-size: 16px;
}

.transaction-detail__amount-metric-label {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 650;
    line-height: 22px;
}

.transaction-detail__amount-metric-values {
    display: grid;
    grid-template-columns: minmax(78px, auto) minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 20px;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
}

.transaction-detail__amount-metric-scopes {
    display: grid;
    gap: 8px;
}

.transaction-detail__amount-metric-values small {
    color: var(--el-text-color-secondary);
    font-size: 11px;
    white-space: nowrap;
}

.transaction-detail__amount-metric-values > div {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    min-width: 0;
    gap: 7px;
    text-align: right;
}

.transaction-detail__amount-metric-values--channel {
    padding-top: 8px;
    border-top: 1px dashed var(--transaction-detail-border);
}

.transaction-detail__amount-arrow {
    color: var(--metric-accent);
    font-weight: 700;
}

.transaction-detail__amount-metric-values strong {
    color: var(--el-text-color-primary);
    font-weight: 700;
}

.transaction-detail__amount-event-note {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 13px 0 0;
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 6px;
    padding: 9px 12px;
    background: color-mix(in srgb, var(--el-color-primary) 5%, var(--el-bg-color));
    color: var(--el-color-primary);
    font-size: 12px;
    line-height: 18px;
}

@media (prefers-reduced-motion: reduce) {
    .transaction-detail__hero.is-processing .transaction-detail__status-icon :deep(.el-icon) {
        animation: none;
    }

    .transaction-detail__identity-item {
        transition: none;
    }
}

    @media (max-width: 1180px) {
    .transaction-detail__hero {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 0;
    }

        .transaction-detail__hero-item {
            min-height: 96px;
        }

        .transaction-detail__hero-item + .transaction-detail__hero-item::before {
            display: none;
        }

        .transaction-detail__hero-item:nth-child(odd) {
            border-right: 1px solid var(--el-border-color-lighter);
        }

        .transaction-detail__hero-item:nth-child(-n + 2) {
            border-bottom: 1px solid var(--el-border-color-lighter);
        }
    }

    @media (max-width: 980px) {
    .transaction-detail__identity-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .transaction-detail__amount-metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .transaction-detail__party-sections {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
        .transaction-detail__hero {
            grid-template-columns: 1fr;
        }

        .transaction-detail__hero-item {
            min-height: 88px;
            border-right: 0 !important;
            border-bottom: 1px solid var(--el-border-color-lighter);
            padding: 14px 16px;
        }

        .transaction-detail__hero-item:last-child {
            border-bottom: 0;
        }

        .transaction-detail__hero-status {
            justify-content: flex-start;
            padding-left: 16px;
    }

        .transaction-detail__channel-value {
            justify-content: space-between;
        }

        .transaction-detail__money-value :deep(.currency-amount-display__amount) {
        font-size: 22px;
        line-height: 30px;
    }

    .transaction-detail__identity-grid {
        grid-template-columns: 1fr;
    }

    .transaction-detail__amount-metrics,
    .transaction-detail__amount-metrics.is-pair {
        grid-template-columns: 1fr;
    }

    .transaction-detail__amount-event-head {
        flex-wrap: wrap;
        gap: 8px;
    }

    .transaction-detail__amount-event-value {
        align-items: flex-start;
    }

        .transaction-detail__amount-metric-values {
            grid-template-columns: 1fr;
            gap: 2px;
        }

        .transaction-detail__amount-metric-values > div {
            justify-content: flex-start;
            text-align: left;
        }

    .transaction-detail__party-grid {
        display: block;
    }

    .transaction-detail__party-sections {
        grid-template-columns: 1fr;
    }

    .transaction-detail__party-field {
        grid-template-columns: 96px minmax(0, 1fr);
    }

    .transaction-detail__party-field.is-wide {
        grid-template-columns: 1fr;
    }
}

@media (hover: none) {
    .transaction-detail__party-field :deep(.copyable-text .el-icon) {
        opacity: 0.65;
    }
}
</style>

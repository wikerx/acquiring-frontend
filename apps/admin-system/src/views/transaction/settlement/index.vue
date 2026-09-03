<!-- Admin 正式结算批次主页面：展示批次、交易明细、保证金、汇率、结果和资金事实，不在前端推导财务状态。 -->
<template>
    <div class="app-container transaction-page settlement-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.settlement.searchTitle')"
            :description="t('transaction.settlement.searchDescription')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            inline-time
            label-width="96px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.settlement.batchNo')">
                <el-input v-model.trim="query.settlementBatchNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantId')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.settlement.batchType')">
                <el-select v-model="query.batchType" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in batchTypeOptions" :key="item" :label="batchTypeText(item)" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.batchStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in batchStatusOptions" :key="item" :label="batchStatusText(item)" :value="item" />
                </el-select>
            </el-form-item>
            <template #time>
                <el-form-item :label="t('transaction.settlement.businessDate')" class="transaction-time-form-item">
                    <el-date-picker
                        v-model="dateRange"
                        type="daterange"
                        value-format="YYYY-MM-DD"
                        :range-separator="t('common.to')"
                        :start-placeholder="t('common.startTime')"
                        :end-placeholder="t('common.endTime')"
                        unlink-panels
                        :clearable="false"
                    />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar :items="summaryItems" @toggle-search="showSearch = !showSearch" @refresh="loadData" />

        <StandardTable
            table-key="admin-transaction-settlement-batches"
            v-loading="loading"
            :data="rows"
            row-key="id"
            size="small"
            class="transaction-page__table"
        >
            <el-table-column :label="t('transaction.settlement.batchNo')" min-width="210" fixed="left" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                    <CopyableText :value="row.settlementBatchNo" :label="t('transaction.settlement.batchNo')" />
                </template>
            </el-table-column>
            <el-table-column prop="merchantId" :label="t('transaction.fields.merchantId')" min-width="132" align="center" show-overflow-tooltip>
                <template #default="{ row }"><el-button link type="primary" @click="openMerchant(row.merchantId)">{{ row.merchantId }}</el-button></template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.batchType')" min-width="132" align="center">
                <template #default="{ row }">{{ batchTypeText(row.batchType) }}</template>
            </el-table-column>
            <el-table-column :label="t('common.status')" min-width="126" align="center">
                <template #default="{ row }">
                    <el-tag size="small" effect="plain" :type="batchStatusTagType(row.batchStatus)">
                        {{ batchStatusText(row.batchStatus) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.targetCurrency')" width="112" align="center">
                <template #default="{ row }"><strong class="settlement-page__currency">{{ row.targetCurrency }}</strong></template>
            </el-table-column>
            <el-table-column prop="transactionCount" :label="t('transaction.settlement.transactionCount')" width="104" align="center" />
            <el-table-column prop="candidateCount" :label="t('transaction.settlement.settlementItemCount')" width="112" align="center" />
            <el-table-column :label="t('transaction.settlement.netAmount')" min-width="162" align="right">
                <template #default="{ row }">
                    <div class="settlement-page__net-amount">
                        <DirectionTag v-if="row.netDirection" :direction="row.netDirection" :label="enumText('directionValue', row.netDirection)" />
                        <strong>{{ exactMoney(row.netAmount, row.targetCurrency, row.targetCurrencyExponent) }}</strong>
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.failure')" min-width="170" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                    <span v-if="row.lastFailureCode" class="settlement-page__failure">{{ row.lastFailureCode }}</span>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column prop="retryCount" :label="t('transaction.clearing.retryCount')" width="92" align="center" />
            <el-table-column prop="businessDate" :label="t('transaction.settlement.businessDate')" width="118" align="center" />
            <el-table-column :label="t('common.createTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.createTime" :source-time-zone="row.businessTimeZone" /></template>
            </el-table-column>
            <el-table-column v-if="showOperationColumn" :label="t('common.operation')" width="224" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button v-hasPermi="'settlement:batch:detail'" link type="primary" @click="openDetail(row)">
                        {{ t('common.detail') }}
                    </el-button>
                    <el-tooltip :disabled="canCancel(row)" :content="t('transaction.settlement.cancelDisabled')">
                        <span v-hasPermi="'settlement:batch:cancel'">
                            <el-button link type="warning" :disabled="!canCancel(row)" @click="openCommand('cancel', row)">
                                {{ t('transaction.settlement.cancel') }}
                            </el-button>
                        </span>
                    </el-tooltip>
                    <el-tooltip :disabled="canRequestReversal(row)" :content="t('transaction.settlement.reversalRequestDisabled')">
                        <span v-hasPermi="'settlement:reversal-order:create'">
                            <el-button link type="danger" :disabled="!canRequestReversal(row)" @click="openCommand('reversalRequest', row)">
                                {{ t('transaction.settlement.reversalRequest') }}
                            </el-button>
                        </span>
                    </el-tooltip>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-show="total > 0" class="pagination-container">
            <el-pagination
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @size-change="handlePageSizeChange"
                @current-change="loadData"
            />
        </div>

        <el-drawer v-model="detailVisible" :title="t('transaction.settlement.detailTitle')" size="92%" destroy-on-close>
            <div v-loading="detailLoading" class="settlement-detail">
                <template v-if="detail">
                    <div class="settlement-detail__identity">
                        <CopyableText :value="detail.batch.settlementBatchNo" :label="t('transaction.settlement.batchNo')" />
                        <el-tag size="small" effect="plain" :type="batchStatusTagType(detail.batch.batchStatus)">
                            {{ batchStatusText(detail.batch.batchStatus) }}
                        </el-tag>
                    </div>

                    <el-tabs v-model="detailTab" @tab-change="handleDetailTabChange">
                    <el-tab-pane :label="t('transaction.settlement.batchOverview')" name="overview">
                    <el-descriptions :column="3" border size="small" class="settlement-detail__descriptions">
                        <el-descriptions-item :label="t('transaction.fields.merchantId')"><el-button link type="primary" @click="openMerchant(detail.batch.merchantId)">{{ detail.batch.merchantId }}</el-button></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.batchType')">{{ batchTypeText(detail.batch.batchType) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.targetCurrency')">{{ detail.batch.targetCurrency }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.businessDate')">{{ detail.batch.businessDate }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.businessTimeZone')">{{ detail.batch.businessTimeZone }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.transactionCount')">{{ detail.batch.transactionCount }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.settlementItemCount')">{{ detail.batch.candidateCount }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.netAmount')"><strong>{{ exactMoney(detail.batch.netAmount, detail.batch.targetCurrency, detail.batch.targetCurrencyExponent) }}</strong></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.accountId')"><el-button v-if="detail.batch.settlementAccountId" link type="primary" @click="openAccount(detail.batch)">{{ detail.batch.settlementAccountId }}</el-button><span v-else>-</span></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.profileId')"><el-button v-if="detail.batch.settlementProfileId" link type="primary" @click="openProfile(detail.batch)">{{ detail.batch.settlementProfileId }}</el-button><span v-else>-</span></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.currentVersion')">v{{ detail.batch.version }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.reviewOrderNo')"><el-button v-if="detail.batch.reviewOrderNo" link type="primary" @click="openReview(detail.batch.reviewOrderNo)">{{ detail.batch.reviewOrderNo }}</el-button><span v-else>-</span></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.createMode')">{{ enumText('createModeValue', detail.batch.createMode) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.projectableCandidateCount')">{{ detail.batch.projectableCandidateCount ?? '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.submitter')">{{ detail.batch.makerAccountName || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.reviewer')">{{ detail.batch.checkerAccountName || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.reviewComment')">{{ detail.batch.checkerComment || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.settlement.originalBatchNo')" :span="3"><el-button v-if="detail.batch.originalBatchNo" link type="primary" @click="openBatch(detail.batch.originalBatchNo)">{{ detail.batch.originalBatchNo }}</el-button><span v-else>-</span></el-descriptions-item>
                    </el-descriptions>

                    <el-alert v-if="detail.batch.lastFailureCode" type="error" :closable="false" class="settlement-detail__failure">
                        <template #title>{{ detail.batch.lastFailureStage || '-' }} / {{ detail.batch.lastFailureCode }}</template>
                        {{ detail.batch.lastFailureMessage || '-' }}
                    </el-alert>

                    <section class="settlement-detail__section">
                        <h3>{{ t('transaction.settlement.operationalState') }}</h3>
                        <div class="settlement-detail__counters">
                            <div><span>{{ t('transaction.settlement.projection') }}</span><strong>{{ detail.operationalState.projectionCompletedCount }} / {{ detail.operationalState.projectionTaskCount }}</strong></div>
                            <div><span>{{ t('transaction.settlement.projectionFailed') }}</span><strong :class="{ 'is-danger': detail.operationalState.projectionFailedCount > 0 }">{{ detail.operationalState.projectionFailedCount }}</strong></div>
                            <div><span>{{ t('transaction.settlement.outbox') }}</span><strong>{{ detail.operationalState.outboxSentCount }} / {{ detail.operationalState.outboxEventCount }}</strong></div>
                            <div><span>{{ t('transaction.settlement.outboxFailed') }}</span><strong :class="{ 'is-danger': detail.operationalState.outboxFailedCount > 0 }">{{ detail.operationalState.outboxFailedCount }}</strong></div>
                        </div>
                    </section>

                    <section class="settlement-detail__section">
                        <h3>{{ t('transaction.settlement.rateMatrix') }}</h3>
                        <el-table :data="detail.rates || []" size="small" border>
                            <el-table-column prop="sourceCurrency" :label="t('transaction.settlement.sourceCurrency')" width="110" align="center" />
                            <el-table-column prop="targetCurrency" :label="t('transaction.settlement.targetCurrency')" width="110" align="center" />
                            <el-table-column :label="t('transaction.settlement.rateType')" width="120" align="center"><template #default="{ row }">{{ enumText('rateTypeValue', row.rateType) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.directRate')" min-width="160" align="right"><template #default="{ row }">{{ decimalText(row.directRate) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.rateSource')" min-width="140" align="center" show-overflow-tooltip><template #default="{ row }">{{ enumText('rateSourceValue', row.rateSource) }}</template></el-table-column>
                            <el-table-column prop="quoteId" :label="t('transaction.settlement.quoteId')" min-width="160" align="center" show-overflow-tooltip />
                            <el-table-column :label="t('transaction.settlement.lockedTime')" min-width="172" align="center"><template #default="{ row }"><BaseDateTime :value="row.lockedTime" :source-time-zone="detail.batch.businessTimeZone" /></template></el-table-column>
                        </el-table>
                    </section>

                    <section class="settlement-detail__section">
                        <h3>{{ t('transaction.settlement.resultSummary') }}</h3>
                        <el-table :data="detail.resultSummaries || []" size="small" border>
                            <el-table-column :label="t('transaction.settlement.paymentTypeMethod')" min-width="190" align="center"><template #default="{ row }"><PaymentMethodDisplay :payment-types="dimensionItems('paymentTypeValue', row.paymentType)" :payment-methods="dimensionItems('paymentMethodValue', row.paymentMethod)" /></template></el-table-column>
                            <el-table-column :label="t('transaction.fields.transactionType')" min-width="120" align="center"><template #default="{ row }">{{ enumText('transactionTypeValue', row.transactionType) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.resultItemType')" min-width="150" align="center"><template #default="{ row }">{{ enumText('resultItemTypeValue', row.resultItemType) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.clearing.feeCategory')" min-width="130" align="center"><template #default="{ row }">{{ enumText('feeCategoryValue', row.feeCategory) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.clearing.direction')" width="96" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('directionValue', row.direction)" /></template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.sourceAmount')" min-width="150" align="right"><template #default="{ row }">{{ exactMoney(row.sourceAmount, row.sourceCurrency, row.sourceCurrencyExponent) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.targetAmount')" min-width="150" align="right"><template #default="{ row }">{{ exactMoney(row.targetAmount, row.targetCurrency, row.targetCurrencyExponent) }}</template></el-table-column>
                            <el-table-column prop="transactionCount" :label="t('transaction.settlement.transactionCount')" width="96" align="center" />
                        </el-table>
                    </section>

                    <section class="settlement-detail__section">
                        <div class="settlement-detail__section-head">
                            <h3>{{ t('transaction.settlement.netPosting') }}</h3>
                            <el-button v-hasPermi="'settlement:posting:list'" link type="primary" @click="openPosting(detail.batch.settlementBatchNo, detail.batch.postedTime || detail.batch.businessDate)">{{ t('transaction.settlement.viewPostingRecords') }}</el-button>
                        </div>
                        <el-empty v-if="!detail.netPosting" :description="t('transaction.settlement.netPostingEmpty')" :image-size="64" />
                        <template v-else>
                            <el-descriptions :column="3" border size="small">
                                <el-descriptions-item :label="t('transaction.settlement.resultItemNo')">{{ detail.netPosting.settlementResultItemNo }}</el-descriptions-item>
                                <el-descriptions-item :label="t('transaction.clearing.direction')"><DirectionTag :direction="detail.netPosting.direction" :label="enumText('directionValue', detail.netPosting.direction)" /></el-descriptions-item>
                                <el-descriptions-item :label="t('transaction.settlement.netAmount')"><strong>{{ exactMoney(detail.netPosting.targetAmount, detail.netPosting.targetCurrency, detail.netPosting.targetCurrencyExponent) }}</strong></el-descriptions-item>
                                <el-descriptions-item :label="t('transaction.settlement.ledgerIdempotencyKey')" :span="3">{{ detail.netPosting.ledgerIdempotencyKey }}</el-descriptions-item>
                            </el-descriptions>
                            <pre v-if="detail.netPosting.formulaSnapshot" class="settlement-detail__formula">{{ settlementFormulaText(detail.netPosting.formulaSnapshot, translateSettlementFormula) }}</pre>
                        </template>
                    </section>
                    </el-tab-pane>

                    <el-tab-pane v-if="canViewTransactionItems" :label="t('transaction.settlement.transactionItems')" name="transactions">
                        <div class="settlement-detail__toolbar">
                            <el-input v-model.trim="transactionIdFilter" clearable :placeholder="t('transaction.fields.transactionId')" @keyup.enter="searchTransactionItems" />
                            <el-button type="primary" :icon="Search" @click="searchTransactionItems">{{ t('common.search') }}</el-button>
                            <el-button :icon="RefreshLeft" @click="resetTransactionItemsFilter">{{ t('common.reset') }}</el-button>
                            <el-button v-if="canExportTransactionItems" type="warning" plain :icon="Download" :loading="transactionExporting" @click="exportTransactionItems">{{ t('common.export') }}</el-button>
                        </div>
                        <el-table v-loading="transactionItemsLoading" :data="transactionItems" size="small" border>
                            <el-table-column prop="sourceTransactionId" :label="t('transaction.fields.transactionId')" min-width="205" fixed="left" align="center"><template #default="{ row }"><el-button v-if="row.sourceTransactionId" link type="primary" @click="openTransaction(row, detail.batch.businessTimeZone)">{{ row.sourceTransactionId }}</el-button><span v-else>-</span></template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.paymentTypeMethod')" min-width="190" align="center"><template #default="{ row }"><PaymentMethodDisplay :payment-types="dimensionItems('paymentTypeValue', row.paymentType)" :payment-methods="dimensionItems('paymentMethodValue', row.paymentMethod)" /></template></el-table-column>
                            <el-table-column :label="t('transaction.fields.transactionType')" min-width="130" align="center"><template #default="{ row }">{{ enumText('transactionTypeValue', row.transactionType) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.clearing.feeCategory')" min-width="140" align="center"><template #default="{ row }">{{ enumText('feeCategoryValue', row.feeCategory) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.resultItemType')" min-width="140" align="center"><template #default="{ row }">{{ enumText('resultItemTypeValue', row.resultItemType) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.clearing.direction')" width="96" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('directionValue', row.direction)" /></template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.sourceAmount')" min-width="150" align="right"><template #default="{ row }">{{ exactMoney(row.sourceAmount, row.sourceCurrency, row.sourceCurrencyExponent) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.directRate')" min-width="160" align="right"><template #default="{ row }">{{ decimalText(row.directRate) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.targetAmount')" min-width="150" align="right"><template #default="{ row }">{{ exactMoney(row.targetAmount, row.targetCurrency, row.targetCurrencyExponent) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.appliedLimit')" min-width="120" align="center"><template #default="{ row }">{{ enumText('appliedLimitValue', row.appliedLimit) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.fields.transactionDateTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.sourceTransactionDateTime" :source-time-zone="detail.batch.businessTimeZone" /></template></el-table-column>
                        </el-table>
                        <div v-show="transactionItemsTotal > 0" class="pagination-container"><el-pagination v-model:current-page="transactionItemsPage" v-model:page-size="transactionItemsPageSize" :total="transactionItemsTotal" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" background @current-change="loadTransactionItems" @size-change="resetTransactionItemsPage" /></div>
                    </el-tab-pane>

                    <el-tab-pane v-if="canViewReserveItems" :label="t('transaction.settlement.reserveItems')" name="reserves">
                        <div class="settlement-detail__toolbar">
                            <el-input v-model.trim="reserveNoFilter" clearable :placeholder="t('transaction.settlement.reserveNo')" @keyup.enter="searchReserveItems" />
                            <el-input v-model.trim="reserveTransactionIdFilter" clearable :placeholder="t('transaction.fields.transactionId')" @keyup.enter="searchReserveItems" />
                            <el-button type="primary" :icon="Search" @click="searchReserveItems">{{ t('common.search') }}</el-button>
                            <el-button :icon="RefreshLeft" @click="resetReserveItemsFilter">{{ t('common.reset') }}</el-button>
                            <el-button v-if="canExportReserveItems" type="warning" plain :icon="Download" :loading="reserveExporting" @click="exportReserveItems">{{ t('common.export') }}</el-button>
                        </div>
                        <el-table v-loading="reserveItemsLoading" :data="reserveItems" size="small" border>
                            <el-table-column prop="reserveActionNo" :label="t('transaction.settlement.reserveActionNo')" min-width="220" fixed="left" align="center" show-overflow-tooltip />
                            <el-table-column prop="reserveNo" :label="t('transaction.settlement.reserveNo')" min-width="190" align="center" show-overflow-tooltip />
                            <el-table-column :label="t('transaction.settlement.reserveActionType')" min-width="140" align="center"><template #default="{ row }">{{ enumText('reserveActionTypeValue', row.actionType) }}</template></el-table-column>
                            <el-table-column prop="sourceTransactionId" :label="t('transaction.fields.transactionId')" min-width="205" align="center"><template #default="{ row }"><el-button v-if="row.sourceTransactionId" link type="primary" @click="openTransaction(row, detail.batch.businessTimeZone)">{{ row.sourceTransactionId }}</el-button><span v-else>-</span></template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.postingAmount')" min-width="150" align="right"><template #default="{ row }">{{ exactMoney(row.amount, row.currency, row.currencyExponent) }}</template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.remainingAmount')" min-width="150" align="right"><template #default="{ row }"><strong>{{ exactMoney(row.remainingAmount, row.currency, row.currencyExponent) }}</strong></template></el-table-column>
                            <el-table-column :label="t('transaction.settlement.reserveStatus')" min-width="130" align="center"><template #default="{ row }">{{ enumText('reserveStatusValue', row.reserveStatus) }}</template></el-table-column>
                            <el-table-column prop="expectedReleaseDate" :label="t('transaction.settlement.expectedReleaseDate')" width="140" align="center" />
                            <el-table-column :label="t('transaction.settlement.actionTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.actionTime" :source-time-zone="detail.batch.businessTimeZone" /></template></el-table-column>
                        </el-table>
                        <div v-show="reserveItemsTotal > 0" class="pagination-container"><el-pagination v-model:current-page="reserveItemsPage" v-model:page-size="reserveItemsPageSize" :total="reserveItemsTotal" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" background @current-change="loadReserveItems" @size-change="resetReserveItemsPage" /></div>
                    </el-tab-pane>
                    </el-tabs>
                </template>
                <el-empty v-else-if="!detailLoading" :description="t('transaction.settlement.detailEmpty')" />
            </div>
        </el-drawer>

        <el-dialog v-model="commandVisible" :title="commandTitle" width="560px" destroy-on-close @closed="resetCommand">
            <el-alert :title="commandNotice" :type="commandType === 'reversalRequest' ? 'error' : 'warning'" :closable="false" show-icon />
            <div class="settlement-command__context">
                <span>{{ t('transaction.settlement.batchNo') }}</span>
                <strong>{{ selectedRow?.settlementBatchNo }}</strong>
                <el-tag v-if="selectedRow" size="small" effect="plain" :type="batchStatusTagType(selectedRow.batchStatus)">{{ batchStatusText(selectedRow.batchStatus) }}</el-tag>
            </div>
            <el-form :model="commandForm" label-width="92px">
                <el-form-item :label="t('transaction.clearing.reason')" required>
                    <el-input v-model="commandForm.reason" type="textarea" :rows="4" maxlength="400" show-word-limit :placeholder="t('transaction.settlement.reasonPlaceholder')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="commandLoading" @click="submitCommand">{{ t('common.confirm') }}</el-button>
                    <el-button @click="commandVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, RefreshLeft, Search } from '@element-plus/icons-vue';
import { DirectionTag, PaymentMethodDisplay } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
    cancelSettlementBatch,
    getSettlementBatchDetail,
    searchSettlementBatches,
    type SettlementBatchDetail,
    type SettlementBatchSummary,
} from '@/api/transaction';
import {
    exportSettlementReserveItems,
    exportSettlementResultItems,
    searchSettlementReserveItems,
    searchSettlementResultItems,
    submitSettlementReversal,
    type SettlementReserveItem,
    type SettlementResultItem,
} from '@/api/settlement';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import CopyableText from '@/views/transaction/components/CopyableText.vue';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import TransactionResultBar from '@/views/transaction/components/TransactionResultBar.vue';
import TransactionSearchPanel from '@/views/transaction/components/TransactionSearchPanel.vue';
import { fallbackTransactionTypeOptions, loadTransactionDictOptions } from '@/views/transaction/shared';
import { businessDateFromBusinessNo, moneyTextByExponent, settlementFormulaText } from '@/views/settlement/shared';

type CommandType = 'cancel' | 'reversalRequest';

const BATCH_TYPES = ['REGULAR', 'RESERVE_RELEASE', 'REVERSAL', 'ADJUSTMENT'] as const;
const BATCH_STATUSES = [
    'CREATED', 'CLAIMING', 'CLAIMED', 'RATE_LOCKED', 'CALCULATING', 'CALCULATED',
    'POSTING', 'POSTED', 'FAILED_RETRYABLE', 'MANUAL_REVIEW', 'CANCELLED', 'REVERSING', 'REVERSED',
] as const;
const CANCELLABLE_STATUSES = new Set<string>([
    'CREATED', 'CLAIMING', 'CLAIMED', 'RATE_LOCKED', 'CALCULATING', 'CALCULATED', 'FAILED_RETRYABLE',
]);
const { t, te, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<SettlementBatchSummary[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const dateRange = ref<[string, string]>(defaultDateRange());
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<SettlementBatchDetail | null>(null);
const detailTab = ref('overview');
const transactionItemsLoading = ref(false);
const transactionExporting = ref(false);
const transactionItems = ref<SettlementResultItem[]>([]);
const transactionItemsTotal = ref(0);
const transactionItemsPage = ref(1);
const transactionItemsPageSize = ref(10);
const transactionIdFilter = ref('');
const reserveItemsLoading = ref(false);
const reserveExporting = ref(false);
const reserveItems = ref<SettlementReserveItem[]>([]);
const reserveItemsTotal = ref(0);
const reserveItemsPage = ref(1);
const reserveItemsPageSize = ref(10);
const reserveNoFilter = ref('');
const reserveTransactionIdFilter = ref('');
const paymentTypeOptions = ref<SelectOption[]>([]);
const paymentMethodOptions = ref<SelectOption[]>([]);
const transactionTypeOptions = ref<SelectOption[]>(fallbackTransactionTypeOptions(t));
const commandVisible = ref(false);
const commandLoading = ref(false);
const commandType = ref<CommandType>('cancel');
const selectedRow = ref<SettlementBatchSummary | null>(null);
const query = reactive({ settlementBatchNo: '', merchantId: '', batchType: '', batchStatus: '' });
const commandForm = reactive({ reason: '' });
const batchTypeOptions = BATCH_TYPES;
const batchStatusOptions = BATCH_STATUSES;
const canViewTransactionItems = userStore.hasPermission('settlement:result-item:list');
const canExportTransactionItems = userStore.hasPermission('settlement:result-item:export');
const canViewReserveItems = userStore.hasPermission('settlement:reserve-item:list');
const canExportReserveItems = userStore.hasPermission('settlement:reserve-item:export');
const canViewBatchDetail = userStore.hasPermission('settlement:batch:detail');

const showOperationColumn = computed(() => [
    'settlement:batch:detail', 'settlement:batch:cancel', 'settlement:reversal-order:create',
].some((permission) => userStore.hasPermission(permission)));

const summaryItems = computed(() => {
    const posted = rows.value.filter((row) => row.batchStatus === 'POSTED').length;
    const failed = rows.value.filter((row) => ['FAILED_RETRYABLE', 'MANUAL_REVIEW'].includes(row.batchStatus)).length;
    const processing = rows.value.filter((row) => !['POSTED', 'CANCELLED', 'REVERSED', 'MANUAL_REVIEW'].includes(row.batchStatus)).length;
    return [
        { key: 'loaded', label: t('transaction.settlement.summary.loaded'), value: total.value, description: t('transaction.settlement.summary.loadedDescription') },
        { key: 'posted', label: t('transaction.settlement.summary.posted'), value: posted, description: t('transaction.settlement.summary.postedDescription'), tone: 'success' as const },
        { key: 'processing', label: t('transaction.settlement.summary.processing'), value: processing, description: t('transaction.settlement.summary.processingDescription') },
        { key: 'failed', label: t('transaction.settlement.summary.failed'), value: failed, description: t('transaction.settlement.summary.failedDescription'), tone: 'danger' as const },
    ];
});

const commandTitle = computed(() => t(`transaction.settlement.${commandType.value}Title`));
const commandNotice = computed(() => t(`transaction.settlement.${commandType.value}Notice`));

async function loadData() {
    if (!validDateRange(dateRange.value)) {
        ElMessage.warning(t('transaction.settlement.dateRangeInvalid'));
        return;
    }
    loading.value = true;
    try {
        const result = await searchSettlementBatches({
            settlementBatchNo: query.settlementBatchNo || undefined,
            merchantId: query.merchantId || undefined,
            batchType: query.batchType || undefined,
            batchStatus: query.batchStatus || undefined,
            beginBusinessDate: dateRange.value[0],
            endBusinessDate: dateRange.value[1],
            pageNo: page.value,
            pageSize: pageSize.value,
        });
        rows.value = result.records || [];
        total.value = result.total || 0;
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function handleReset() {
    query.settlementBatchNo = '';
    query.merchantId = '';
    query.batchType = '';
    query.batchStatus = '';
    dateRange.value = defaultDateRange();
    handleSearch();
}

async function openDetail(row: SettlementBatchSummary) {
    detailVisible.value = true;
    detailLoading.value = true;
    detailTab.value = 'overview';
    detail.value = null;
    transactionItems.value = [];
    transactionItemsTotal.value = 0;
    transactionItemsPage.value = 1;
    transactionIdFilter.value = '';
    reserveItems.value = [];
    reserveItemsTotal.value = 0;
    reserveItemsPage.value = 1;
    reserveNoFilter.value = '';
    reserveTransactionIdFilter.value = '';
    try {
        detail.value = await getSettlementBatchDetail(row.settlementBatchNo);
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.settlement.detailLoadFailed'));
    } finally {
        detailLoading.value = false;
    }
}

function handleDetailTabChange(name: string | number) {
    if (name === 'transactions' && !transactionItems.value.length) loadTransactionItems();
    if (name === 'reserves' && !reserveItems.value.length) loadReserveItems();
}

function transactionItemQuery() {
    const batch = detail.value?.batch;
    return {
        settlementBatchNo: batch?.settlementBatchNo,
        merchantId: batch?.merchantId,
        sourceDetailType: 'TRANSACTION_CLEARING' as const,
        sourceTransactionId: transactionIdFilter.value || undefined,
        beginBusinessDate: batch?.businessDate || dateRange.value[0],
        endBusinessDate: batch?.businessDate || dateRange.value[1],
        pageNo: transactionItemsPage.value,
        pageSize: transactionItemsPageSize.value,
    };
}

async function loadTransactionItems() {
    if (!detail.value) return;
    transactionItemsLoading.value = true;
    try {
        const result = await searchSettlementResultItems(transactionItemQuery());
        transactionItems.value = result.records || [];
        transactionItemsTotal.value = result.total || 0;
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('common.loadFailed'));
    } finally {
        transactionItemsLoading.value = false;
    }
}

function resetTransactionItemsPage() {
    transactionItemsPage.value = 1;
    loadTransactionItems();
}

function searchTransactionItems() {
    transactionItemsPage.value = 1;
    loadTransactionItems();
}

function resetTransactionItemsFilter() {
    transactionIdFilter.value = '';
    searchTransactionItems();
}

async function exportTransactionItems() {
    transactionExporting.value = true;
    try {
        await exportSettlementResultItems(transactionItemQuery());
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('common.exportFailed'));
    } finally {
        transactionExporting.value = false;
    }
}

function reserveItemQuery() {
    const batch = detail.value?.batch;
    return {
        settlementBatchNo: batch?.settlementBatchNo,
        merchantId: batch?.merchantId,
        reserveNo: reserveNoFilter.value || undefined,
        sourceTransactionId: reserveTransactionIdFilter.value || undefined,
        beginBusinessDate: batch?.businessDate || dateRange.value[0],
        endBusinessDate: batch?.businessDate || dateRange.value[1],
        pageNo: reserveItemsPage.value,
        pageSize: reserveItemsPageSize.value,
    };
}

async function loadReserveItems() {
    if (!detail.value) return;
    reserveItemsLoading.value = true;
    try {
        const result = await searchSettlementReserveItems(reserveItemQuery());
        reserveItems.value = result.records || [];
        reserveItemsTotal.value = result.total || 0;
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('common.loadFailed'));
    } finally {
        reserveItemsLoading.value = false;
    }
}

function resetReserveItemsPage() {
    reserveItemsPage.value = 1;
    loadReserveItems();
}

function searchReserveItems() {
    reserveItemsPage.value = 1;
    loadReserveItems();
}

function resetReserveItemsFilter() {
    reserveNoFilter.value = '';
    reserveTransactionIdFilter.value = '';
    searchReserveItems();
}

async function exportReserveItems() {
    reserveExporting.value = true;
    try {
        await exportSettlementReserveItems(reserveItemQuery());
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('common.exportFailed'));
    } finally {
        reserveExporting.value = false;
    }
}

function openMerchant(merchantId: string) {
    router.push({ path: '/merchant/info', query: { merchantId } });
}

function openAccount(batch: SettlementBatchSummary) {
    router.push({
        path: '/fund/account',
        query: { merchantId: batch.merchantId, settlementCurrency: batch.targetCurrency },
    });
}

function openProfile(batch: SettlementBatchSummary) {
    router.push({
        path: '/settlement/profiles',
        query: { merchantId: batch.merchantId, targetCurrency: batch.targetCurrency },
    });
}

function openReview(reviewOrderNo: string) {
    router.push({ path: '/settlement/review-orders', query: { reviewOrderNo } });
}

async function openBatch(settlementBatchNo: string) {
    query.settlementBatchNo = settlementBatchNo;
    const linkedBusinessDate = businessDateFromBusinessNo(settlementBatchNo);
    if (linkedBusinessDate) dateRange.value = [linkedBusinessDate, linkedBusinessDate];
    page.value = 1;
    detailVisible.value = false;
    await router.replace({ path: '/settlement/batches', query: { settlementBatchNo } });
    await loadData();
    await openLinkedBatchDetail(settlementBatchNo);
}

async function openLinkedBatchDetail(settlementBatchNo: string) {
    if (!canViewBatchDetail) return;
    const linkedRow = rows.value.find((row) => row.settlementBatchNo === settlementBatchNo);
    if (linkedRow) await openDetail(linkedRow);
}

function openPosting(settlementBatchNo: string, postedTime?: string) {
    router.push({
        path: '/settlement/postings',
        query: { settlementBatchNo, postedDate: postedTime?.slice(0, 10) },
    });
}

function openTransaction(row: SettlementResultItem | SettlementReserveItem, transactionTimeZone: string) {
    router.push({
        path: '/transaction/operation',
        query: {
            transactionId: row.sourceTransactionId,
            transactionDateTime: row.sourceTransactionDateTime,
            transactionTimeZone,
        },
    });
}

function enumText(group: string, value?: string) {
    if (!value) return '-';
    const options = group === 'paymentTypeValue' ? paymentTypeOptions.value
        : group === 'paymentMethodValue' ? paymentMethodOptions.value
            : group === 'transactionTypeValue' ? transactionTypeOptions.value : [];
    const option = options.find((item) => item.value === value);
    if (option) return option.label;
    const key = `transaction.settlement.${group}.${value}`;
    return te(key) ? t(key) : value;
}

function dimensionItems(group: string, value?: string) {
    return value ? [{ value, label: enumText(group, value) }] : [];
}

function translateSettlementFormula(key: string) {
    return t(key);
}

function openCommand(type: CommandType, row: SettlementBatchSummary) {
    commandType.value = type;
    selectedRow.value = row;
    commandForm.reason = '';
    commandVisible.value = true;
}

async function submitCommand() {
    const row = selectedRow.value;
    const reason = commandForm.reason.trim();
    if (!row || !reason) {
        ElMessage.warning(t('transaction.clearing.reasonRequired'));
        return;
    }
    commandLoading.value = true;
    try {
        const requestKey = `SET-${commandType.value.toUpperCase()}-${globalThis.crypto.randomUUID()}`;
        if (commandType.value === 'cancel') {
            const result = await cancelSettlementBatch(row.settlementBatchNo, {
                requestKey, expectedVersion: row.version, reason,
            });
            ElMessage.success(t('transaction.settlement.commandAccepted', { batchNo: result.resultBatchNo }));
        } else {
            const result = await submitSettlementReversal({
                requestKey, originalBatchNo: row.settlementBatchNo,
                expectedBatchVersion: row.version, reason,
            });
            ElMessage.success(t('transaction.settlement.reversalSubmitted', { orderNo: result.reversalOrderNo }));
        }
        commandVisible.value = false;
        await loadData();
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('common.operationFailed'));
    } finally {
        commandLoading.value = false;
    }
}

function resetCommand() {
    selectedRow.value = null;
    commandForm.reason = '';
}

function canCancel(row: SettlementBatchSummary) {
    return CANCELLABLE_STATUSES.has(row.batchStatus);
}

function canRequestReversal(row: SettlementBatchSummary) {
    return row.batchStatus === 'POSTED';
}

function batchTypeText(value?: string) {
    return enumText('type', value);
}

function batchStatusText(value?: string) {
    return enumText('status', value);
}

function batchStatusTagType(value?: string) {
    if (value === 'POSTED') return 'success';
    if (['FAILED_RETRYABLE', 'MANUAL_REVIEW'].includes(value || '')) return 'danger';
    if (['POSTING', 'REVERSING', 'CALCULATING', 'CLAIMING'].includes(value || '')) return 'primary';
    if (['CANCELLED', 'REVERSED'].includes(value || '')) return 'info';
    return 'warning';
}

function exactMoney(amount?: number | string | null, currency?: string, currencyExponent?: number) {
    return moneyTextByExponent(amount, currency, currencyExponent);
}

function decimalText(value?: number | string | null) {
    if (value === undefined || value === null || value === '') return '-';
    const text = String(value);
    const match = /^([+-]?)(\d+)(\.\d+)?$/.exec(text);
    return match ? `${match[1]}${match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${match[3] || ''}` : text;
}

function defaultDateRange(): [string, string] {
    const end = new Date();
    const begin = new Date(end);
    begin.setDate(begin.getDate() - 29);
    return [dateText(begin), dateText(end)];
}

function dateText(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function validDateRange(range: [string, string]) {
    if (!range?.[0] || !range?.[1]) return false;
    const begin = Date.parse(`${range[0]}T00:00:00Z`);
    const end = Date.parse(`${range[1]}T00:00:00Z`);
    return Number.isFinite(begin) && Number.isFinite(end) && begin <= end
        && (end - begin) / 86_400_000 <= 92;
}

function handlePageSizeChange() {
    page.value = 1;
    loadData();
}

async function loadDimensionDictionaries() {
    const language = String(locale.value || 'zh-CN');
    const [paymentTypes, paymentMethods, transactionTypes] = await Promise.all([
        loadDictOptions('acquiring_payment_method', language).catch(() => []),
        loadDictOptions('card_brand', language).catch(() => []),
        loadTransactionDictOptions('transaction_type', language).catch(() => []),
    ]);
    paymentTypeOptions.value = paymentTypes;
    paymentMethodOptions.value = paymentMethods;
    if (transactionTypes.length) transactionTypeOptions.value = transactionTypes;
}

onMounted(async () => {
    const linkedBatchNo = typeof route.query.settlementBatchNo === 'string'
        ? route.query.settlementBatchNo.trim() : '';
    if (linkedBatchNo) {
        query.settlementBatchNo = linkedBatchNo;
        const linkedBusinessDate = businessDateFromBusinessNo(linkedBatchNo);
        if (linkedBusinessDate) dateRange.value = [linkedBusinessDate, linkedBusinessDate];
    }
    await loadDimensionDictionaries();
    await loadData();
    if (linkedBatchNo) await openLinkedBatchDetail(linkedBatchNo);
});
</script>

<style scoped>
.settlement-page__currency,
.settlement-detail strong {
    font-variant-numeric: tabular-nums;
}

.settlement-page__failure,
.settlement-detail__counters .is-danger {
    color: var(--el-color-danger);
}

.settlement-detail {
    min-height: 320px;
}

.settlement-detail__identity,
.settlement-command__context {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    border-left: 4px solid #2563eb;
    padding: 10px 14px;
    background: #f7f9fc;
}

.settlement-detail__descriptions :deep(.el-descriptions__label) {
    width: 132px;
}

.settlement-detail__failure {
    margin-top: 12px;
}

.settlement-detail__section {
    margin-top: 20px;
}

.settlement-detail__toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
    min-height: 32px;
    margin-bottom: 10px;
}

.settlement-detail__toolbar :deep(.el-input) {
    width: min(280px, 28vw);
}

.settlement-detail :deep(.payment-method-display) {
    flex-wrap: nowrap;
}

.settlement-page__net-amount {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    width: 100%;
    white-space: nowrap;
}

.settlement-detail__section h3 {
    margin: 0 0 9px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding-bottom: 8px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 700;
}

.settlement-detail__counters {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border: 1px solid var(--el-border-color-lighter);
}

.settlement-detail__counters > div {
    display: grid;
    gap: 5px;
    border-right: 1px solid var(--el-border-color-lighter);
    padding: 11px 14px;
}

.settlement-detail__counters > div:last-child {
    border-right: 0;
}

.settlement-detail__counters span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.settlement-detail__counters strong {
    font-size: 18px;
}

.settlement-detail__formula {
    max-height: 180px;
    margin: 10px 0 0;
    overflow: auto;
    border: 1px solid var(--el-border-color-lighter);
    padding: 10px 12px;
    background: #fafbfc;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
}

.settlement-command__context {
    margin-top: 14px;
    border-left-color: #d97706;
    background: #fff9ed;
}

.settlement-command__context span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

@media (max-width: 900px) {
    .settlement-detail__counters {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .settlement-detail__counters > div:nth-child(2) {
        border-right: 0;
    }
}

@media (max-width: 640px) {
    .settlement-detail__toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .settlement-detail__toolbar :deep(.el-input) {
        width: 100%;
    }

    .settlement-detail__counters {
        grid-template-columns: 1fr;
    }

    .settlement-detail__counters > div {
        border-right: 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .settlement-detail__counters > div:last-child {
        border-bottom: 0;
    }

    .settlement-command__context {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>

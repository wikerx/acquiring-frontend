<template>
    <div class="app-container channel-page route-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="108px">
            <el-form-item :label="t('channel.route.keyword')">
                <el-input v-model.trim="query.keyword" clearable :placeholder="t('channel.route.keywordPlaceholder')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('channel.route.ruleType')">
                <el-select v-model="query.ruleType" clearable :placeholder="t('channel.common.pleaseSelect')">
                    <el-option v-for="item in ruleTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.route.scopeType')">
                <el-select v-model="query.scopeType" clearable :placeholder="t('channel.common.pleaseSelect')">
                    <el-option v-for="item in scopeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.route.merchant')">
                <el-select
                    v-model="query.merchantId"
                    clearable
                    filterable
                    remote remote-show-suffix
                    :remote-method="searchMerchantOptions"
                    :loading="merchantLoading"
                    :placeholder="t('channel.route.merchantPlaceholder')"
                    @visible-change="handleMerchantSelectVisible"
                >
                    <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.route.paymentMethod')">
                <el-select v-model="query.paymentScopeKeys" multiple clearable filterable collapse-tags collapse-tags-tooltip :max-collapse-tags="2" class="route-query-select" :placeholder="t('channel.route.allPaymentMethods')">
                    <template #label="{ value, label }"><div class="dimension-option dimension-option--selected"><PaymentLogoGroup :keys="paymentScopeLogoKeys(String(value))" size="sm" :wrap="false" fallback="text" /><span>{{ label }}</span></div></template>
                    <el-option v-for="item in paymentScopeOptions" :key="item.value" :label="item.label" :value="item.value">
                        <div class="dimension-option"><PaymentLogoGroup :keys="item.logoKeys" size="sm" :wrap="false" fallback="text" /><span>{{ item.label }}</span></div>
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.route.transactionType')">
                <el-select v-model="query.transactionTypes" multiple clearable filterable collapse-tags collapse-tags-tooltip :max-collapse-tags="2" class="route-query-select" :placeholder="t('channel.route.allTransactionTypes')">
                    <template #label="{ value, label }"><TransactionTypeDisplay :value="String(value)" :label="String(label)" align="start" /></template>
                    <el-option v-for="item in transactionTypeOptions" :key="item.value" :label="item.label" :value="item.value">
                        <TransactionTypeDisplay :value="item.value" :label="item.label" align="start" />
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.status')">
                <el-select v-model="query.ruleStatus" clearable :placeholder="t('channel.common.pleaseSelect')">
                    <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('channel.common.search') }}</el-button>
                <el-button :icon="Refresh" @click="resetQuery">{{ t('channel.common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'channel:route:add'">
                    {{ t('channel.common.add') }}
                </el-button>
            </el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
        </el-row>

        <StandardTable table-key="channel-payment-route-v2" v-loading="loading" :data="rows" row-key="id" size="small" class="route-table">
            <el-table-column :label="t('channel.route.rule')" min-width="208" align="left" fixed="left">
                <template #default="{ row }">
                    <div class="route-identity">
                        <span class="route-identity__name">{{ row.ruleName }}</span>
                        <span class="route-identity__code">{{ row.ruleCode }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.route.strategySummary')" min-width="126" align="left">
                <template #default="{ row }">
                    <div class="route-strategy">
                        <el-tag size="small" effect="plain" :type="row.ruleType === 'FIXED' ? 'warning' : 'info'">{{ ruleTypeText(row.ruleType) }}</el-tag>
                        <span>{{ t('channel.route.priorityValue', { value: row.rulePriority }) }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.route.scopeType')" min-width="194" align="left">
                <template #default="{ row }">
                    <div v-if="row.scopeType === 'GLOBAL'" class="route-scope route-scope--global">{{ t('channel.route.globalScopeShort') }}</div>
                    <div v-else class="route-scope route-scope--merchant">
                        <span v-for="merchantId in routeMerchantIds(row).slice(0, 2)" :key="merchantId">{{ merchantDisplayLabel(merchantId) }}</span>
                        <small v-if="routeMerchantIds(row).length > 2">+{{ routeMerchantIds(row).length - 2 }}</small>
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.route.matchDimensions')" min-width="168" align="left">
                <template #default="{ row }">
                    <div class="dimension-summary">
                        <div class="dimension-summary__row">
                            <span class="dimension-summary__label">{{ t('channel.route.paymentMethod') }}</span>
                            <div class="dimension-summary__values">
                                <ChannelPaymentScopeDisplay
                                    :keys="rulePaymentScopeLogoKeys(row)"
                                    :label="t('channel.route.paymentMethod')"
                                    :empty-text="rulePaymentScopeFallbackText(row)"
                                />
                            </div>
                        </div>
                        <div class="dimension-summary__row">
                            <span class="dimension-summary__label">{{ t('channel.route.transactionType') }}</span>
                            <div class="dimension-summary__values">
                                <span v-for="transactionType in ruleTransactionTypes(row)" :key="transactionType" class="dimension-chip">
                                    <TransactionTypeDisplay :value="transactionType" :label="optionLabel(transactionTypeOptions, transactionType)" align="start" />
                                </span>
                                <span v-if="ruleTransactionTypes(row).length === 0" class="muted-text">{{ row.ruleType === 'HISTORY_AFFINITY' ? t('channel.route.notRequired') : t('channel.route.allTransactionTypes') }}</span>
                            </div>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.route.routeResult')" min-width="124" align="left">
                <template #default="{ row }">
                    <div class="route-result">
                        <span>{{ row.ruleType === 'HISTORY_AFFINITY' ? t('channel.route.historyCandidateSource') : t('channel.route.candidateCountValue', { count: row.candidates?.length || 0 }) }}</span>
                        <small>{{ policyText(row.unavailablePolicy) }}</small>
                    </div>
                </template>
            </el-table-column>
                    <el-table-column :label="t('channel.route.statusAndUpdate')" min-width="170" align="center">
                <template #default="{ row }">
                    <div class="route-status-time">
                        <el-tag size="small" :type="statusTagType(row.ruleStatus)">{{ statusText(row.ruleStatus) }}</el-tag>
                        <BaseDateTime :value="row.updateTime" />
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.common.operation')" width="125" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'channel:route:detail'">{{ t('channel.common.detail') }}</el-button>
                    <el-dropdown v-if="hasMoreActions(row)" trigger="click" @command="(command: string) => handleRowCommand(command, row)">
                        <el-button type="primary" link>{{ t('channel.route.more') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-if="row.ruleStatus !== 'ENABLED' && userStore.hasPermission('channel:route:edit')" command="edit" :icon="Edit">{{ t('channel.common.edit') }}</el-dropdown-item>
                                <el-dropdown-item v-if="userStore.hasPermission('channel:route:copy')" command="copy" :icon="CopyDocument">{{ t('channel.route.copy') }}</el-dropdown-item>
                                <el-dropdown-item v-if="userStore.hasPermission('channel:route:validate')" command="validate" :icon="CircleCheck">{{ t('channel.route.validate') }}</el-dropdown-item>
                                <el-dropdown-item v-if="userStore.hasPermission('channel:route:history')" command="history" :icon="Clock">{{ t('channel.route.history') }}</el-dropdown-item>
                                <el-dropdown-item v-if="row.ruleStatus !== 'ENABLED' && userStore.hasPermission('channel:route:publish')" command="publish" :icon="Promotion" divided>{{ t('channel.route.publish') }}</el-dropdown-item>
                                <el-dropdown-item v-if="row.ruleStatus === 'ENABLED' && userStore.hasPermission('channel:route:disable')" command="disable" :icon="VideoPause" divided>{{ t('channel.route.disable') }}</el-dropdown-item>
                                <el-dropdown-item v-if="row.ruleStatus !== 'ENABLED' && userStore.hasPermission('channel:route:remove')" command="delete" :icon="Delete" class="danger-menu-item">{{ t('channel.common.delete') }}</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-show="total > 0" class="pagination-container">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="detailTitle" size="xl" :loading="detailLoading">
            <template v-if="detailRow">
                <div class="detail-heading">
                    <div>
                        <div class="detail-heading__title">{{ detailRow.ruleName }}</div>
                        <div class="detail-heading__code">{{ detailRow.ruleCode }}</div>
                    </div>
                    <div class="detail-heading__meta">
                        <el-tag :type="statusTagType(detailRow.ruleStatus)">{{ statusText(detailRow.ruleStatus) }}</el-tag>
                        <span>{{ t('channel.route.version', { version: detailRow.version }) }}</span>
                    </div>
                </div>
                <el-tabs v-model="detailTab" class="route-detail-tabs" @tab-change="handleDetailTabChange">
                    <el-tab-pane :label="t('channel.route.overview')" name="overview">
                        <div class="detail-section">
                            <div class="detail-section__title">{{ t('channel.route.basicSection') }}</div>
                            <el-descriptions :column="2" border size="small">
                                <el-descriptions-item :label="t('channel.route.ruleType')">{{ ruleTypeText(detailRow.ruleType) }}</el-descriptions-item>
                                <el-descriptions-item :label="t('channel.route.scopeType')">{{ scopeTypeText(detailRow.scopeType) }}</el-descriptions-item>
                                <el-descriptions-item :label="t('channel.route.merchant')">
                                    <div v-if="detailRow.merchantIds?.length" class="detail-merchants">
                                        <el-tag v-for="merchantId in detailRow.merchantIds" :key="merchantId" size="small" effect="plain">{{ merchantDisplayLabel(merchantId) }}</el-tag>
                                    </div>
                                    <span v-else>{{ t('channel.route.globalScopeShort') }}</span>
                                </el-descriptions-item>
                                <el-descriptions-item :label="t('channel.route.unavailablePolicy')">{{ policyText(detailRow.unavailablePolicy) }}</el-descriptions-item>
                                <el-descriptions-item :label="t('channel.route.rulePriority')">{{ detailRow.rulePriority }}</el-descriptions-item>
                                <el-descriptions-item v-if="detailRow.ruleType === 'HISTORY_AFFINITY'" :label="t('channel.route.historyLookbackMonths')">{{ t('channel.route.lookbackMonthValue', { count: detailRow.strategy?.historyLookbackMonths || 6 }) }}</el-descriptions-item>
                                <el-descriptions-item :label="t('channel.common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                                <el-descriptions-item :label="t('channel.common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                                <el-descriptions-item :label="t('channel.common.remark')" :span="2">{{ detailRow.remark || '-' }}</el-descriptions-item>
                            </el-descriptions>
                        </div>
                        <div v-if="detailRow.ruleType !== 'HISTORY_AFFINITY'" class="detail-section">
                            <div class="detail-section__title">{{ t('channel.route.matchSection') }}</div>
                            <div class="detail-dimensions">
                                <div class="detail-dimension">
                                    <span class="detail-dimension__label">{{ t('channel.route.paymentMethod') }}</span>
                                    <div class="detail-dimension__values">
                                        <span v-for="scopeKey in rulePaymentScopeKeys(detailRow)" :key="scopeKey" class="dimension-chip dimension-chip--detail">
                                            <PaymentLogoGroup :keys="paymentScopeLogoKeys(scopeKey)" size="sm" :wrap="false" fallback="text" />
                                            <span>{{ paymentScopeLabel(scopeKey) }}</span>
                                        </span>
                                        <span v-if="rulePaymentScopeKeys(detailRow).length === 0" class="muted-text">{{ t('channel.route.allPaymentMethods') }}</span>
                                    </div>
                                </div>
                                <div class="detail-dimension">
                                    <span class="detail-dimension__label">{{ t('channel.route.transactionType') }}</span>
                                    <div class="detail-dimension__values">
                                        <span v-for="transactionType in ruleTransactionTypes(detailRow)" :key="transactionType" class="dimension-chip dimension-chip--detail">
                                            <TransactionTypeDisplay :value="transactionType" :label="optionLabel(transactionTypeOptions, transactionType)" align="start" />
                                        </span>
                                        <span v-if="ruleTransactionTypes(detailRow).length === 0" class="muted-text">{{ t('channel.route.allTransactionTypes') }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane v-if="detailRow.ruleType !== 'HISTORY_AFFINITY'" :label="t('channel.route.candidates')" name="candidates">
                        <el-table :data="detailRow.candidates" border size="small" empty-text="-">
                            <el-table-column :label="t('channel.route.paymentMethod')" min-width="170" align="center">
                                <template #default="{ row }">
                                    <div class="candidate-method-cell">
                                        <PaymentLogoGroup :keys="paymentScopeLogoKeys(candidateScopeKey(row))" size="sm" :wrap="false" />
                                        <span>{{ paymentScopeLabel(candidateScopeKey(row)) }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="candidatePriority" :label="t('channel.route.candidatePriority')" width="110" align="center" />
                            <el-table-column v-if="detailRow.ruleType === 'WEIGHT'" :label="t('channel.route.candidateWeight')" width="110" align="center"><template #default="{ row }">{{ row.candidateWeight }}%</template></el-table-column>
                            <el-table-column :label="t('channel.common.channel')" min-width="210" align="center"><template #default="{ row }"><ChannelIdentity :record="row" :fallback="candidateChannelText(row)" scope="ROUTE" size="detail" /></template></el-table-column>
                            <el-table-column :label="t('channel.route.mid')" min-width="230" align="center"><template #default="{ row }">{{ candidateMidText(row) }}</template></el-table-column>
                            <el-table-column :label="t('channel.common.status')" width="100" align="center"><template #default="{ row }"><el-tag size="small" :type="row.candidateStatus === 1 ? 'success' : 'info'">{{ row.candidateStatus === 1 ? t('channel.common.enabled') : t('channel.common.disabled') }}</el-tag></template></el-table-column>
                        </el-table>
                    </el-tab-pane>
                    <el-tab-pane :label="t('channel.route.validation')" name="validation">
                        <div v-loading="validationLoading" class="validation-panel">
                            <el-result v-if="validationResult?.valid" icon="success" :title="t('channel.route.validationPassed')" :sub-title="t('channel.route.validationPassedHint')" />
                            <template v-else-if="validationResult">
                                <el-alert :title="t('channel.route.validationFailed', { count: validationResult.issues.length })" type="error" :closable="false" show-icon />
                                <div class="validation-list">
                                    <div v-for="issue in validationResult.issues" :key="`${issue.code}-${issue.field}`" class="validation-item">
                                        <el-tag size="small" type="danger" effect="plain">{{ issue.code }}</el-tag>
                                        <div><strong>{{ issue.field }}</strong><span>{{ validationIssueText(issue) }}</span></div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane :label="t('channel.route.history')" name="history">
                        <el-table v-loading="historyLoading" :data="historyRows" border size="small" empty-text="-">
                            <el-table-column :label="t('channel.route.actionType')" width="110" align="center"><template #default="{ row }">{{ actionText(row.actionType) }}</template></el-table-column>
                            <el-table-column :label="t('channel.route.versionChange')" width="120" align="center"><template #default="{ row }">{{ versionChangeText(row) }}</template></el-table-column>
                            <el-table-column prop="operatorName" :label="t('channel.common.operator')" min-width="130" align="center" />
                            <el-table-column prop="operationReason" :label="t('channel.route.operationReason')" min-width="260" show-overflow-tooltip />
                            <el-table-column :label="t('channel.common.createTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.createTime" /></template></el-table-column>
                        </el-table>
                        <div v-show="historyTotal > 0" class="pagination-container pagination-container--compact">
                            <el-pagination v-model:current-page="historyPage" v-model:page-size="historyPageSize" :total="historyTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" background @size-change="loadHistory" @current-change="loadHistory" />
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </template>
        </CommonDetailDrawer>

        <el-drawer v-model="formVisible" :title="formMode === 'create' ? t('channel.route.addTitle') : t('channel.route.editTitle')" size="min(1560px, 96vw)" append-to-body destroy-on-close class="app-form-drawer route-form-drawer" @closed="resetFormEditor">
            <el-form ref="formRef" :model="form" :rules="formRules" :validate-on-rule-change="false" label-width="118px" size="small" class="route-form">
                <section class="route-form-section">
                    <div class="form-section__title">{{ t('channel.route.basicSection') }}</div>
                    <div class="form-grid form-grid--two">
                        <el-form-item :label="t('channel.route.ruleName')" prop="ruleName"><el-input v-model.trim="form.ruleName" maxlength="128" /></el-form-item>
                        <el-form-item :label="t('channel.route.ruleType')" prop="ruleType"><el-select v-model="form.ruleType" style="width:100%" @change="handleRuleTypeChange"><el-option v-for="item in ruleTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                        <el-form-item :label="t('channel.route.scopeType')" prop="scopeType" class="form-grid__full route-scope-item">
                            <AdminLinearTabs v-model="form.scopeType" :items="scopeTabOptions" :stretch="false" size="compact" :aria-label="t('channel.route.scopeType')" class="route-scope-tabs" @change="handleScopeTypeChange" />
                        </el-form-item>
                        <el-form-item v-if="form.scopeType === 'MERCHANT'" :label="t('channel.route.merchant')" prop="merchantIds" class="form-grid__full route-merchant-item">
                            <el-select
                                v-model="form.merchantIds"
                                multiple
                                filterable
                                remote remote-show-suffix
                                reserve-keyword
                                collapse-tags
                                collapse-tags-tooltip
                                :max-collapse-tags="4"
                                :remote-method="searchMerchantOptions"
                                :loading="merchantLoading"
                                :placeholder="t('channel.route.merchantMultiPlaceholder')"
                                @visible-change="handleMerchantSelectVisible"
                                @change="handleMerchantSelectionChange"
                            >
                                <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
                            </el-select>
                            <div v-loading="merchantConflictLoading" class="selected-merchants">
                                <div v-for="merchantId in form.merchantIds" :key="merchantId" class="selected-merchant" :class="{ 'selected-merchant--warning': merchantConflictMap.has(merchantId) }">
                                    <div class="selected-merchant__identity">
                                        <el-icon><User /></el-icon>
                                        <span>{{ selectedMerchantLabel(merchantId) }}</span>
                                    </div>
                                    <div v-if="merchantConflictMap.has(merchantId)" class="selected-merchant__warning">
                                        <el-icon><WarningFilled /></el-icon>
                                        <div>
                                            <strong>{{ t('channel.route.merchantConfiguredWarning', { count: merchantConflictMap.get(merchantId)?.length || 0 }) }}</strong>
                                            <span v-for="rule in merchantConflictMap.get(merchantId)" :key="rule.id">
                                                {{ rule.ruleCode }} · {{ rule.ruleName }} · {{ ruleTypeText(rule.ruleType) }} · P{{ rule.rulePriority }} · {{ statusText(rule.ruleStatus) }}
                                            </span>
                                        </div>
                                    </div>
                                    <span v-else class="selected-merchant__ready">{{ t('channel.route.merchantReady') }}</span>
                                </div>
                            </div>
                        </el-form-item>
                    </div>
                    <div class="route-type-note"><strong>{{ ruleTypeText(form.ruleType) }}</strong><span>{{ t(`channel.route.typeDescriptions.${form.ruleType}`) }}</span></div>
                </section>

                <section v-if="form.ruleType !== 'HISTORY_AFFINITY'" class="route-form-section">
                    <div class="form-section__title">{{ t('channel.route.matchSection') }}</div>
                    <div class="route-dimension-editor">
                        <el-form-item :label="t('channel.route.paymentMethod')" prop="paymentScopeKeys">
                            <el-select v-model="form.paymentScopeKeys" multiple clearable filterable collapse-tags collapse-tags-tooltip :max-collapse-tags="4" style="width:100%" :placeholder="t('channel.route.paymentMethodGroupsPlaceholder')">
                                <template #label="{ value, label }"><div class="dimension-option dimension-option--selected"><PaymentLogoGroup :keys="paymentScopeLogoKeys(String(value))" size="sm" :wrap="false" fallback="text" /><span>{{ label }}</span></div></template>
                                <el-option v-for="item in paymentScopeOptions" :key="item.value" :label="item.label" :value="item.value"><div class="dimension-option"><PaymentLogoGroup :keys="item.logoKeys" size="sm" :wrap="false" fallback="text" /><span>{{ item.label }}</span></div></el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.route.transactionType')">
                            <el-select v-model="form.transactionTypes" multiple clearable filterable collapse-tags collapse-tags-tooltip :max-collapse-tags="4" style="width:100%" :placeholder="t('channel.route.allTransactionTypes')">
                                <template #label="{ value, label }"><TransactionTypeDisplay :value="String(value)" :label="String(label)" align="start" /></template>
                                <el-option v-for="item in transactionTypeOptions" :key="item.value" :label="item.label" :value="item.value"><TransactionTypeDisplay :value="item.value" :label="item.label" align="start" /></el-option>
                            </el-select>
                        </el-form-item>
                    </div>
                </section>

                <section class="route-form-section route-form-section--strategy">
                    <div class="form-section__title">{{ t('channel.route.strategySection') }}</div>
                    <div v-if="form.ruleType === 'HISTORY_AFFINITY'" class="history-config">
                        <el-form-item :label="t('channel.route.historyLookbackMonths')">
                            <div class="history-lookback-input">
                                <el-input-number v-model="form.strategy.historyLookbackMonths" :min="1" :max="24" controls-position="right" />
                                <span>{{ t('channel.route.monthUnit') }}</span>
                            </div>
                        </el-form-item>
                        <span>{{ t('channel.route.historyFallbackHint') }}</span>
                    </div>
                    <CandidateTransferWorkspace v-else v-model="form.candidates" :payment-scope-keys="form.paymentScopeKeys" :route-type="form.ruleType" :method-options="paymentScopeOptions" :channel-options="channelOptions" />
                </section>

                <section class="route-form-section route-form-section--last">
                    <div class="form-section__title">{{ t('channel.route.executionSection') }}</div>
                    <div class="form-grid form-grid--two">
                        <el-form-item :label="t('channel.route.rulePriority')" prop="rulePriority"><el-input-number v-model="form.rulePriority" :min="1" :max="10000" controls-position="right" /></el-form-item>
                        <el-form-item v-if="form.ruleType !== 'HISTORY_AFFINITY'" :label="t('channel.route.unavailablePolicy')" prop="unavailablePolicy"><el-select v-model="form.unavailablePolicy" style="width:100%"><el-option v-for="item in policyOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                        <div v-else class="history-priority-hint">{{ t('channel.route.historyPriorityHint') }}</div>
                        <el-form-item :label="t('channel.route.operationReason')" prop="operationReason" class="form-grid__full"><el-input v-model.trim="form.operationReason" maxlength="500" /></el-form-item>
                        <el-form-item :label="t('channel.common.remark')" class="form-grid__full"><el-input v-model.trim="form.remark" type="textarea" :rows="2" maxlength="500" show-word-limit /></el-form-item>
                    </div>
                </section>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" :loading="submitting" @click="submitForm">{{ t('channel.route.saveDraft') }}</el-button><el-button @click="formVisible = false">{{ t('channel.common.cancel') }}</el-button></div></template>
        </el-drawer>

        <el-dialog v-model="copyVisible" :title="t('channel.route.copyTitle')" width="560px" append-to-body destroy-on-close>
            <el-form ref="copyFormRef" :model="copyForm" :rules="copyRules" label-width="110px" size="small">
                <el-form-item :label="t('channel.route.ruleName')" prop="ruleName"><el-input v-model.trim="copyForm.ruleName" maxlength="128" /></el-form-item>
                <el-form-item :label="t('channel.route.operationReason')" prop="operationReason"><el-input v-model.trim="copyForm.operationReason" type="textarea" :rows="3" maxlength="500" /></el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" :loading="submitting" @click="submitCopy">{{ t('channel.route.copy') }}</el-button><el-button @click="copyVisible = false">{{ t('channel.common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import ChannelIdentity from '@/views/channel/components/ChannelIdentity.vue';
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { ArrowDown, CircleCheck, Clock, CopyDocument, Delete, Edit, House, Plus, Promotion, Refresh, Search, User, VideoPause, View, WarningFilled } from '@element-plus/icons-vue';
import { PaymentLogoGroup, TransactionTypeDisplay, type PaymentLogoKey } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import AdminLinearTabs from '@/components/AdminLinearTabs/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import ChannelPaymentScopeDisplay from '@/views/channel/components/ChannelPaymentScopeDisplay.vue';
import CandidateTransferWorkspace from './CandidateTransferWorkspace.vue';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import { useUserStore } from '@/store/modules/user';
import {
    copyPaymentRouteRule,
    createPaymentRouteRule,
    deletePaymentRouteRule,
    disablePaymentRouteRule,
    getPaymentRouteMerchantConflicts,
    getPaymentRouteRule,
    publishPaymentRouteRule,
    searchPaymentRouteChangeLogs,
    searchPaymentRouteRules,
    updatePaymentRouteRule,
    validatePaymentRouteRule,
    type ChannelOption,
    type MerchantRouteRuleBrief,
    type PaymentRouteCandidate,
    type PaymentRouteChangeLog,
    type PaymentRoutePaymentScope,
    type PaymentRouteRule,
    type PaymentRouteRuleQuery,
    type PaymentRouteRuleSaveRequest,
    type PaymentRouteValidationIssue,
    type PaymentRouteValidationResult,
} from '@/api/channel';
import {
    cardLogoKeys,
    loadChannelOptions,
    loadDictOptions,
    optionLabel,
    paymentLogoKeys,
    showChannelError,
    type SelectOption,
} from '../shared';

const { locale, t, te } = useI18n();
const userStore = useUserStore();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<PaymentRouteRule[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const merchantLoading = ref(false);
const merchantConflictLoading = ref(false);
const merchantOptions = ref<MerchantInfo[]>([]);
const merchantNameMap = ref(new Map<string, string>());
const merchantConflictMap = ref(new Map<string, MerchantRouteRuleBrief[]>());
const channelOptions = ref<ChannelOption[]>([]);
const paymentMethodOptions = ref<SelectOption[]>([]);
const cardBrandOptions = ref<SelectOption[]>([]);
const transactionTypeOptions = ref<SelectOption[]>([]);

interface PaymentScopeOption extends SelectOption {
    paymentMethod: string;
    cardBrand: string;
    logoKeys: PaymentLogoKey[];
}

const paymentScopeOptions = computed<PaymentScopeOption[]>(() => [
    ...cardBrandOptions.value
        .filter((item) => item.value !== 'ALL' && item.value !== 'NONE')
        .map((item) => ({ value: `CARD:${item.value}`, label: item.label, paymentMethod: 'BANK_CARD', cardBrand: item.value, logoKeys: cardLogoKeys(item.value, item) })),
    ...paymentMethodOptions.value
        .filter((item) => item.value !== 'ALL' && item.value !== 'BANK_CARD')
        .map((item) => ({ value: `PAYMENT:${item.value}`, label: item.label, paymentMethod: item.value, cardBrand: 'NONE', logoKeys: paymentLogoKeys(item.value, item) })),
]);

type RouteRuleQueryForm = Omit<PaymentRouteRuleQuery, 'paymentMethods' | 'paymentScopes'> & { paymentScopeKeys: string[]; transactionTypes: string[] };
const query = reactive<RouteRuleQueryForm>({
    keyword: '', ruleType: '', scopeType: '', merchantId: '', paymentScopeKeys: [], transactionTypes: [], ruleStatus: '', pageNo: 1, pageSize: 20,
});

const ruleTypeOptions = computed(() => [
    { label: t('channel.route.fixedRoute'), value: 'FIXED' },
    { label: t('channel.route.priorityRoute'), value: 'PRIORITY' },
    { label: t('channel.route.weightRoute'), value: 'WEIGHT' },
    { label: t('channel.route.historyAffinityRoute'), value: 'HISTORY_AFFINITY' },
]);
const scopeTypeOptions = computed(() => [
    { label: t('channel.route.globalScope'), value: 'GLOBAL' },
    { label: t('channel.route.merchantScope'), value: 'MERCHANT' },
]);
const scopeTabOptions = computed(() => [
    { label: t('channel.route.globalScope'), value: 'GLOBAL', icon: House },
    { label: t('channel.route.merchantScope'), value: 'MERCHANT', icon: User },
]);
const policyOptions = computed(() => [
    { label: t('channel.route.fallback'), value: 'FALLBACK' },
    { label: t('channel.route.reject'), value: 'REJECT' },
]);
const statusOptions = computed(() => [
    { label: t('channel.route.draft'), value: 'DRAFT' },
    { label: t('channel.route.enabled'), value: 'ENABLED' },
    { label: t('channel.route.disabled'), value: 'DISABLED' },
]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailRow = ref<PaymentRouteRule | null>(null);
const detailTab = ref('overview');
const validationLoading = ref(false);
const validationResult = ref<PaymentRouteValidationResult | null>(null);
const historyLoading = ref(false);
const historyRows = ref<PaymentRouteChangeLog[]>([]);
const historyTotal = ref(0);
const historyPage = ref(1);
const historyPageSize = ref(10);
const detailTitle = computed(() => t('channel.route.detailTitle'));

type FormMode = 'create' | 'edit';
type RouteForm = Omit<PaymentRouteRuleSaveRequest, 'candidates' | 'paymentMethods' | 'paymentScopes'> & {
    id: number;
    paymentScopeKeys: string[];
    candidates: PaymentRouteCandidate[];
};
const formVisible = ref(false);
const formMode = ref<FormMode>('create');
const formRef = ref<FormInstance>();
const submitting = ref(false);

function emptyForm(): RouteForm {
    return {
        id: 0,
        ruleName: '',
        ruleType: 'PRIORITY',
        scopeType: 'GLOBAL',
        merchantId: '',
        merchantIds: [],
        businessType: 'ACQUIRING',
        paymentScopeKeys: [],
        transactionTypes: [],
        rulePriority: 100,
        unavailablePolicy: 'FALLBACK',
        strategy: { strategyType: 'PRIORITY', strategyStatus: 1, historyLookbackMonths: undefined },
        candidates: [],
        version: undefined,
        remark: '',
        operationReason: '',
    };
}
const form = reactive<RouteForm>(emptyForm());

const formRules = computed<FormRules>(() => {
    const rules: FormRules = {
        ruleName: [{ required: true, message: t('channel.route.ruleNameRequired'), trigger: 'blur' }],
        ruleType: [{ required: true, message: t('channel.route.ruleTypeRequired'), trigger: 'change' }],
        scopeType: [{ required: true, message: t('channel.route.scopeTypeRequired'), trigger: 'change' }],
        rulePriority: [{ required: true, message: t('channel.route.rulePriorityRequired'), trigger: 'change' }],
        unavailablePolicy: [{ required: true, message: t('channel.route.policyRequired'), trigger: 'change' }],
        operationReason: [{ required: true, message: t('channel.route.reasonRequired'), trigger: 'blur' }],
    };
    if (form.ruleType !== 'HISTORY_AFFINITY') {
        rules.paymentScopeKeys = [{ required: true, type: 'array', min: 1, message: t('channel.route.paymentMethodRequired'), trigger: 'change' }];
    }
    if (form.scopeType === 'MERCHANT') {
        rules.merchantIds = [{ required: true, type: 'array', min: 1, message: t('channel.route.merchantRequired'), trigger: 'change' }];
    }
    return rules;
});

const copyVisible = ref(false);
const copyFormRef = ref<FormInstance>();
const copySource = ref<PaymentRouteRule | null>(null);
const copyForm = reactive({ ruleName: '', operationReason: '' });
const copyRules = computed<FormRules>(() => ({
    ruleName: [{ required: true, message: t('channel.route.ruleNameRequired'), trigger: 'blur' }],
    operationReason: [{ required: true, message: t('channel.route.reasonRequired'), trigger: 'blur' }],
}));

onMounted(() => {
    void loadOptions();
    void loadData();
});

watch(locale, () => { void loadOptions(); });

async function loadOptions() {
    const language = String(locale.value || 'zh-CN');
    try {
        const [channels, payments, cards, transactions] = await Promise.all([
            loadChannelOptions(),
            loadDictOptions('acquiring_payment_method', language),
            loadDictOptions('card_brand', language),
            loadDictOptions('transaction_type', language),
        ]);
        channelOptions.value = channels;
        paymentMethodOptions.value = payments;
        cardBrandOptions.value = cards;
        transactionTypeOptions.value = transactions;
    } catch (error) {
        await showChannelError(error, t('channel.route.loadFailedTitle'), t('channel.route.loadFailed'));
    }
}

async function loadData() {
    loading.value = true;
    try {
        const { paymentScopeKeys, ...criteria } = query;
        const result = await searchPaymentRouteRules({ ...criteria, paymentScopes: paymentScopeKeys.map(paymentScopeFromKey), pageNo: page.value, pageSize: pageSize.value });
        rows.value = result.records;
        total.value = result.total;
        await hydrateMerchantNames(result.records.flatMap(routeMerchantIds));
    } catch (error) {
        await showChannelError(error, t('channel.route.loadFailedTitle'), t('channel.route.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() { page.value = 1; void loadData(); }
function resetQuery() {
    Object.assign(query, { keyword: '', ruleType: '', scopeType: '', merchantId: '', paymentScopeKeys: [], transactionTypes: [], ruleStatus: '' });
    handleSearch();
}

async function openDetail(row: PaymentRouteRule, targetTab = 'overview') {
    detailVisible.value = true;
    detailLoading.value = true;
    detailTab.value = targetTab;
    validationResult.value = null;
    historyRows.value = [];
    try {
        detailRow.value = await getPaymentRouteRule(row.id);
        await hydrateMerchantNames(routeMerchantIds(detailRow.value));
        if (targetTab === 'validation') await loadValidation();
        if (targetTab === 'history') await loadHistory();
    } catch (error) {
        detailRow.value = null;
        detailVisible.value = false;
        await showChannelError(error, t('channel.route.loadFailedTitle'), t('channel.route.loadFailed'));
    } finally {
        detailLoading.value = false;
    }
}

async function handleDetailTabChange(tab: string | number) {
    if (tab === 'validation' && !validationResult.value) await loadValidation();
    if (tab === 'history' && historyRows.value.length === 0) await loadHistory();
}

async function loadValidation() {
    if (!detailRow.value) return;
    validationLoading.value = true;
    try {
        validationResult.value = await validatePaymentRouteRule(detailRow.value.id);
    } catch (error) {
        await showChannelError(error, t('channel.route.loadFailedTitle'), t('channel.route.loadFailed'));
    }
    finally { validationLoading.value = false; }
}

async function loadHistory() {
    if (!detailRow.value) return;
    historyLoading.value = true;
    try {
        const result = await searchPaymentRouteChangeLogs(detailRow.value.id, { pageNo: historyPage.value, pageSize: historyPageSize.value });
        historyRows.value = result.records;
        historyTotal.value = result.total;
    } catch (error) {
        await showChannelError(error, t('channel.route.loadFailedTitle'), t('channel.route.loadFailed'));
    } finally { historyLoading.value = false; }
}

async function openForm(mode: FormMode, row?: PaymentRouteRule) {
    formMode.value = mode;
    Object.assign(form, emptyForm());
    merchantConflictMap.value = new Map();
    if (mode === 'edit' && row) {
        try {
            const detail = await getPaymentRouteRule(row.id);
            Object.assign(form, {
                id: detail.id,
                ruleName: detail.ruleName,
                ruleType: String(detail.ruleType) === 'STANDARD' ? 'PRIORITY' : detail.ruleType,
                scopeType: detail.scopeType,
                merchantId: detail.merchantId || '',
                merchantIds: routeMerchantIds(detail),
                businessType: 'ACQUIRING',
                paymentScopeKeys: detail.ruleType === 'HISTORY_AFFINITY' ? [] : rulePaymentScopeKeys(detail),
                transactionTypes: detail.ruleType === 'HISTORY_AFFINITY' ? [] : [...(detail.transactionTypes || [])],
                rulePriority: detail.rulePriority,
                unavailablePolicy: detail.ruleType === 'HISTORY_AFFINITY' ? 'FALLBACK' : detail.unavailablePolicy,
                strategy: { ...detail.strategy, strategyType: String(detail.ruleType) === 'STANDARD' ? 'PRIORITY' : detail.ruleType },
                candidates: detail.candidates.map((item) => ({ ...item })),
                version: detail.version,
                remark: detail.remark || '',
                operationReason: '',
            });
            await hydrateMerchantNames(form.merchantIds);
            form.merchantIds.forEach((merchantId) => ensureMerchantOption(merchantId));
            await loadMerchantConflicts();
        } catch (error) {
            await showChannelError(error, t('channel.route.loadFailedTitle'), t('channel.route.loadFailed'));
            return;
        }
    }
    formVisible.value = true;
}

function resetFormEditor() {
    formRef.value?.clearValidate();
    merchantConflictMap.value = new Map();
}

function handleRuleTypeChange(value: string | number | boolean) {
    const routeType = String(value) as PaymentRouteRuleSaveRequest['ruleType'];
    form.strategy.strategyType = routeType;
    form.strategy.historyLookbackMonths = routeType === 'HISTORY_AFFINITY' ? 6 : undefined;
    form.unavailablePolicy = 'FALLBACK';
    form.candidates = [];
    if (routeType === 'HISTORY_AFFINITY') {
        form.paymentScopeKeys = [];
        form.transactionTypes = [];
    }
}
function handleScopeTypeChange(value: string | number | boolean) {
    if (value === 'GLOBAL') {
        form.merchantId = '';
        form.merchantIds = [];
        merchantConflictMap.value = new Map();
    }
    void nextTick(() => {
        formRef.value?.clearValidate(['scopeType', 'merchantIds']);
    });
}

function handleMerchantSelectionChange(values: string[]) {
    form.merchantIds = [...new Set(values.filter(Boolean))];
    void nextTick(() => formRef.value?.clearValidate('merchantIds'));
    void loadMerchantConflicts();
}

async function loadMerchantConflicts() {
    if (form.scopeType !== 'MERCHANT' || form.merchantIds.length === 0) {
        merchantConflictMap.value = new Map();
        return;
    }
    merchantConflictLoading.value = true;
    try {
        const conflicts = await getPaymentRouteMerchantConflicts({
            merchantIds: form.merchantIds,
            excludeRuleId: formMode.value === 'edit' && form.id ? form.id : undefined,
        });
        merchantConflictMap.value = new Map(conflicts.map((item) => [item.merchantId, item.rules]));
    } catch (error) {
        merchantConflictMap.value = new Map();
        await showChannelError(error, t('channel.route.loadFailedTitle'), t('channel.route.merchantConflictLoadFailed'));
    } finally {
        merchantConflictLoading.value = false;
    }
}

async function submitForm() {
    if (!formRef.value) return;
    try {
        await formRef.value.validate();
        validateCandidates();
        submitting.value = true;
        const payload: PaymentRouteRuleSaveRequest = {
            ruleName: form.ruleName,
            ruleType: form.ruleType,
            scopeType: form.scopeType,
            merchantId: form.scopeType === 'MERCHANT' && form.merchantIds.length === 1 ? form.merchantIds[0] : undefined,
            merchantIds: form.scopeType === 'MERCHANT' ? [...form.merchantIds] : [],
            businessType: 'ACQUIRING',
            paymentScopes: form.ruleType === 'HISTORY_AFFINITY' ? [] : form.paymentScopeKeys.map(paymentScopeFromKey),
            transactionTypes: form.ruleType === 'HISTORY_AFFINITY' ? [] : [...form.transactionTypes],
            rulePriority: form.rulePriority,
            unavailablePolicy: form.unavailablePolicy,
            strategy: {
                ...form.strategy,
                strategyType: form.ruleType,
                historyLookbackMonths: form.ruleType === 'HISTORY_AFFINITY' ? form.strategy.historyLookbackMonths || 6 : undefined,
            },
            candidates: form.ruleType === 'HISTORY_AFFINITY' ? [] : form.candidates.map((item) => ({
                paymentMethod: item.paymentMethod,
                cardBrand: item.cardBrand,
                channelId: item.channelId,
                midConfigId: item.midConfigId,
                candidatePriority: item.candidatePriority,
                candidateWeight: item.candidateWeight,
                candidateStatus: item.candidateStatus,
            })),
            version: formMode.value === 'edit' ? form.version : undefined,
            remark: form.remark || undefined,
            operationReason: form.operationReason,
        };
        if (formMode.value === 'create') await createPaymentRouteRule(payload);
        else await updatePaymentRouteRule(form.id, payload);
        ElMessage.success(t('channel.route.saved'));
        formVisible.value = false;
        await loadData();
    } catch (error) {
        if (error instanceof RouteFormValidationError) {
            ElMessage.error(error.message);
        } else if (error instanceof Error) {
            await showChannelError(error, t('channel.route.saveFailedTitle'), t('channel.route.saveFailed'));
        }
    } finally { submitting.value = false; }
}

function validateCandidates() {
    if (form.ruleType === 'HISTORY_AFFINITY') {
        if (!form.strategy.historyLookbackMonths || form.strategy.historyLookbackMonths < 1 || form.strategy.historyLookbackMonths > 24) {
            throw new RouteFormValidationError(t('channel.route.historyLookbackInvalid'));
        }
        return;
    }
    if (form.paymentScopeKeys.length === 0) throw new RouteFormValidationError(t('channel.route.paymentMethodRequired'));
    const priorities = new Set<string>();
    const mids = new Set<string>();
    for (const scopeKey of form.paymentScopeKeys) {
        const grouped = form.candidates.filter((item) => candidateScopeKey(item) === scopeKey && item.candidateStatus === 1);
        if (grouped.length === 0) {
            throw new RouteFormValidationError(t('channel.route.paymentMethodCandidateRequired', { method: paymentScopeLabel(scopeKey) }));
        }
        if (form.ruleType === 'FIXED' && grouped.length !== 1) throw new RouteFormValidationError(t('channel.route.fixedCandidateCountInvalid'));
        if (form.ruleType === 'WEIGHT') {
            const total = grouped.reduce((sum, item) => sum + weightBasisPoints(item.candidateWeight), 0);
            if (grouped.some((item) => weightBasisPoints(item.candidateWeight) <= 0) || total !== 10000) {
                throw new RouteFormValidationError(t('channel.route.weightTotalInvalid', { method: paymentScopeLabel(scopeKey) }));
            }
        }
    }
    form.candidates.forEach((item) => {
        const scopeKey = candidateScopeKey(item);
        if (!item.paymentMethod || !item.cardBrand || !form.paymentScopeKeys.includes(scopeKey) || !item.channelId || !item.midConfigId) {
            throw new RouteFormValidationError(t('channel.route.candidateIncomplete'));
        }
        const priorityKey = `${scopeKey}:${item.candidatePriority}`;
        const midKey = `${scopeKey}:${item.midConfigId}`;
        if (priorities.has(priorityKey)) throw new RouteFormValidationError(t('channel.route.candidatePriorityDuplicate'));
        if (mids.has(midKey)) throw new RouteFormValidationError(t('channel.route.candidateMidDuplicate'));
        priorities.add(priorityKey);
        mids.add(midKey);
    });
}

function weightBasisPoints(value?: string) {
    if (!value || !/^\d+(?:\.\d{1,2})?$/.test(value)) return 0;
    const [integer, fraction = ''] = value.split('.');
    return Number(integer) * 100 + Number(fraction.padEnd(2, '0'));
}

class RouteFormValidationError extends Error {}

function handleRowCommand(command: string, row: PaymentRouteRule) {
    if (command === 'edit') void openForm('edit', row);
    if (command === 'copy') openCopy(row);
    if (command === 'validate') void openDetail(row, 'validation');
    if (command === 'history') void openDetail(row, 'history');
    if (command === 'publish') void handleLifecycleAction(row, 'publish');
    if (command === 'disable') void handleLifecycleAction(row, 'disable');
    if (command === 'delete') void handleDelete(row);
}

/** 只有当前状态下至少存在一个已授权动作时，才展示“更多”菜单。 */
function hasMoreActions(row: PaymentRouteRule) {
    return userStore.hasPermission('channel:route:copy')
        || userStore.hasPermission('channel:route:validate')
        || userStore.hasPermission('channel:route:history')
        || row.ruleStatus !== 'ENABLED' && userStore.hasPermission('channel:route:edit')
        || row.ruleStatus !== 'ENABLED' && userStore.hasPermission('channel:route:publish')
        || row.ruleStatus !== 'ENABLED' && userStore.hasPermission('channel:route:remove')
        || row.ruleStatus === 'ENABLED' && userStore.hasPermission('channel:route:disable');
}

function openCopy(row: PaymentRouteRule) {
    copySource.value = row;
    copyForm.ruleName = t('channel.route.copyName', { name: row.ruleName });
    copyForm.operationReason = '';
    copyVisible.value = true;
}

async function submitCopy() {
    if (!copyFormRef.value || !copySource.value) return;
    try {
        await copyFormRef.value.validate();
        submitting.value = true;
        await copyPaymentRouteRule(copySource.value.id, {
            ruleName: copyForm.ruleName,
            operationReason: copyForm.operationReason,
            version: copySource.value.version,
        });
        ElMessage.success(t('channel.route.copied'));
        copyVisible.value = false;
        await loadData();
    } catch (error) {
        if (error instanceof Error) await showChannelError(error, t('channel.route.saveFailedTitle'), t('channel.route.saveFailed'));
    } finally { submitting.value = false; }
}

async function handleLifecycleAction(row: PaymentRouteRule, action: 'publish' | 'disable') {
    try {
        if (action === 'publish') {
            const validation = await validatePaymentRouteRule(row.id);
            if (validation.issues.length > 0) {
                await openDetail(row, 'validation');
                return;
            }
        }
        const { value } = await ElMessageBox.prompt(
            t(action === 'publish' ? 'channel.route.publishConfirm' : 'channel.route.disableConfirm', { name: row.ruleName }),
            t('channel.common.operationConfirm'),
            { inputType: 'textarea', inputPlaceholder: t('channel.route.reasonPlaceholder'), inputValidator: (input) => Boolean(input?.trim()) || t('channel.route.reasonRequired'), confirmButtonText: t(action === 'publish' ? 'channel.route.publish' : 'channel.route.disable') },
        );
        if (action === 'publish') await publishPaymentRouteRule(row.id, { version: row.version, operationReason: value.trim() });
        else await disablePaymentRouteRule(row.id, { version: row.version, operationReason: value.trim() });
        ElMessage.success(t(action === 'publish' ? 'channel.route.published' : 'channel.route.disabledSuccess'));
        await loadData();
    } catch (error) {
        if (!isDialogCancellation(error)) await showChannelError(error,
            t(action === 'publish' ? 'channel.route.publishFailedTitle' : 'channel.route.disableFailedTitle'),
            t(action === 'publish' ? 'channel.route.publishFailed' : 'channel.route.disableFailed'));
    }
}

async function handleDelete(row: PaymentRouteRule) {
    try {
        const { value } = await ElMessageBox.prompt(t('channel.route.deleteConfirm', { name: row.ruleName }), t('channel.common.operationConfirm'), {
            type: 'warning', inputType: 'textarea', inputPlaceholder: t('channel.route.reasonPlaceholder'),
            inputValidator: (input) => Boolean(input?.trim()) || t('channel.route.reasonRequired'), confirmButtonText: t('channel.common.delete'),
        });
        await deletePaymentRouteRule(row.id, { version: row.version, operationReason: value.trim() });
        ElMessage.success(t('channel.common.deleteSuccess'));
        await loadData();
    } catch (error) {
        if (!isDialogCancellation(error)) await showChannelError(error, t('channel.route.deleteFailedTitle'), t('channel.route.deleteFailed'));
    }
}

function isDialogCancellation(error: unknown) {
    return error === 'cancel' || error === 'close';
}

async function searchMerchantOptions(keyword: string) {
    merchantLoading.value = true;
    try {
        const selectedIds = new Set(form.merchantIds || []);
        const retained = merchantOptions.value.filter((item) => selectedIds.has(item.merchantId));
        const loaded = (await searchMerchants({ pageNo: 1, pageSize: 50, keyword: keyword.trim() || undefined })).records;
        merchantOptions.value = [...retained, ...loaded]
            .filter((item, index, items) => items.findIndex((candidate) => candidate.merchantId === item.merchantId) === index);
        const names = new Map(merchantNameMap.value);
        loaded.forEach((item) => names.set(item.merchantId, item.merchantName));
        merchantNameMap.value = names;
    }
    finally { merchantLoading.value = false; }
}
function handleMerchantSelectVisible(visible: boolean) { if (visible && merchantOptions.value.length === 0) void searchMerchantOptions(''); }
function merchantOptionLabel(item: MerchantInfo) { return item.merchantName ? `${item.merchantId}（${item.merchantName}）` : item.merchantId; }
function ensureMerchantOption(merchantId?: string, merchantName?: string) {
    if (!merchantId || merchantOptions.value.some((item) => item.merchantId === merchantId)) return;
    const resolvedName = merchantName || merchantNameMap.value.get(merchantId);
    merchantOptions.value.unshift({ merchantId, merchantName: resolvedName || '' } as MerchantInfo);
}
function routeMerchantIds(rule: Pick<PaymentRouteRule, 'merchantId' | 'merchantIds'>) {
    if (rule.merchantIds?.length) return [...new Set(rule.merchantIds.filter(Boolean))];
    return rule.merchantId ? [rule.merchantId] : [];
}
function merchantDisplayLabel(merchantId: string) {
    const name = merchantNameMap.value.get(merchantId)
        || merchantOptions.value.find((item) => item.merchantId === merchantId)?.merchantName;
    return name ? `${merchantId}（${name}）` : merchantId;
}
function selectedMerchantLabel(merchantId: string) {
    return merchantDisplayLabel(merchantId);
}

async function hydrateMerchantNames(merchantIds: string[]) {
    const ids = [...new Set(merchantIds.filter(Boolean))];
    const missingIds = ids.filter((merchantId) => !merchantNameMap.value.has(merchantId));
    if (missingIds.length === 0) return;
    const results = await Promise.allSettled(missingIds.map(async (merchantId) => {
        const result = await searchMerchants({ pageNo: 1, pageSize: 10, keyword: merchantId });
        return result.records.find((item) => item.merchantId === merchantId);
    }));
    const names = new Map(merchantNameMap.value);
    const resolved: MerchantInfo[] = [];
    results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
            names.set(result.value.merchantId, result.value.merchantName);
            resolved.push(result.value);
        }
    });
    merchantNameMap.value = names;
    merchantOptions.value = [...merchantOptions.value, ...resolved]
        .filter((item, index, items) => items.findIndex((candidate) => candidate.merchantId === item.merchantId) === index);
}

function ruleTypeText(value?: string) { return ruleTypeOptions.value.find((item) => item.value === value)?.label || value || '-'; }
function scopeTypeText(value?: string) { return scopeTypeOptions.value.find((item) => item.value === value)?.label || value || '-'; }
function policyText(value?: string) { return policyOptions.value.find((item) => item.value === value)?.label || value || '-'; }
function statusText(value?: string) { return statusOptions.value.find((item) => item.value === value)?.label || value || '-'; }
function statusTagType(value?: string) { return value === 'ENABLED' ? 'success' : value === 'DRAFT' ? 'warning' : 'info'; }
function paymentScopeFromKey(scopeKey: string): PaymentRoutePaymentScope {
    if (scopeKey.startsWith('CARD:')) return { paymentMethod: 'BANK_CARD', cardBrand: scopeKey.slice(5) };
    if (scopeKey.startsWith('PAYMENT:')) return { paymentMethod: scopeKey.slice(8), cardBrand: 'NONE' };
    throw new RouteFormValidationError(t('channel.route.paymentMethodRequired'));
}
function paymentScopeKey(scope: PaymentRoutePaymentScope) {
    return scope.paymentMethod === 'BANK_CARD' ? `CARD:${scope.cardBrand}` : `PAYMENT:${scope.paymentMethod}`;
}
function candidateScopeKey(candidate: Pick<PaymentRouteCandidate, 'paymentMethod' | 'cardBrand'>) {
    return paymentScopeKey({ paymentMethod: candidate.paymentMethod, cardBrand: candidate.cardBrand || 'NONE' });
}
function paymentScopeLabel(scopeKey: string) {
    return paymentScopeOptions.value.find((item) => item.value === scopeKey)?.label || scopeKey;
}
function paymentScopeLogoKeys(scopeKey: string) {
    return paymentScopeOptions.value.find((item) => item.value === scopeKey)?.logoKeys || [];
}
function rulePaymentScopeKeys(rule: PaymentRouteRule) {
    const scopes = rule.paymentScopes?.length
        ? rule.paymentScopes
        : (rule.candidates || []).map((candidate) => ({ paymentMethod: candidate.paymentMethod, cardBrand: candidate.cardBrand || 'NONE' }));
    return [...new Set(scopes.filter((scope) => scope.paymentMethod && scope.paymentMethod !== 'ALL').map(paymentScopeKey))];
}
function rulePaymentScopeLogoKeys(rule: PaymentRouteRule) {
    return [...new Set(rulePaymentScopeKeys(rule).flatMap(paymentScopeLogoKeys))];
}
function rulePaymentScopeFallbackText(rule: PaymentRouteRule) {
    if (rule.ruleType === 'HISTORY_AFFINITY') return t('channel.route.notRequired');
    const scopeKeys = rulePaymentScopeKeys(rule);
    return scopeKeys.length ? scopeKeys.map(paymentScopeLabel).join(', ') : t('channel.route.allPaymentMethods');
}
function ruleTransactionTypes(rule: PaymentRouteRule) { return rule.transactionTypes || []; }
function candidateChannelText(row: PaymentRouteCandidate) { return [row.channelCode, row.channelName].filter(Boolean).join(' - ') || String(row.channelId); }
function candidateMidText(row: PaymentRouteCandidate) { return [row.midName, row.channelMid].filter(Boolean).join(' - ') || String(row.midConfigId); }
function actionText(value: string) {
    const key = `channel.route.actions.${value}`;
    return te(key) ? t(key) : value;
}
function versionChangeText(row: PaymentRouteChangeLog) { return `${row.beforeVersion ?? '-'} → ${row.afterVersion ?? '-'}`; }
function validationIssueText(issue: PaymentRouteValidationIssue) {
    const key = `channel.route.validationCodes.${issue.code}`;
    return te(key) ? t(key) : issue.message;
}
</script>

<style scoped>
.route-table :deep(.el-table__row td.el-table__cell) { padding: 10px 0; }
.route-identity { display: flex; min-width: 0; flex-direction: column; gap: 5px; padding: 2px 0; }
.route-identity__name { overflow: hidden; color: var(--el-text-color-primary); font-weight: 600; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.route-identity__code { overflow: hidden; color: var(--el-text-color-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; line-height: 16px; text-overflow: ellipsis; white-space: nowrap; }
.route-strategy { display: grid; align-items: start; justify-items: start; gap: 4px; }
.route-strategy > span { color: var(--el-text-color-secondary); font-size: 11px; white-space: nowrap; }
.route-scope { min-width: 0; color: var(--el-text-color-primary); font-size: 12px; line-height: 18px; }
.route-scope--global { font-weight: 500; }
.route-scope--merchant { display: grid; gap: 3px; }
.route-scope--merchant span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.route-scope--merchant small { color: var(--el-text-color-secondary); }
.dimension-summary { display: grid; min-width: 0; gap: 5px; padding: 1px 0; }
.dimension-summary__row { display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: center; gap: 8px; }
.dimension-summary__label { color: var(--el-text-color-secondary); font-size: 11px; line-height: 18px; }
.dimension-summary__values { display: flex; min-width: 0; flex-wrap: wrap; align-items: center; gap: 5px; }
.dimension-chip { display: inline-flex; min-height: 24px; align-items: center; gap: 6px; padding: 1px 7px; border: 1px solid var(--el-border-color-lighter); border-radius: 4px; background: var(--el-bg-color); color: var(--el-text-color-regular); font-size: 12px; line-height: 20px; }
.dimension-chip--detail { min-height: 32px; padding: 4px 10px; }
.route-result, .route-status-time { display: grid; align-items: start; gap: 5px; }
.route-result > span { color: var(--el-text-color-primary); font-size: 12px; font-weight: 500; }
.route-result small { color: var(--el-text-color-secondary); font-size: 11px; }
.route-status-time { grid-template-columns: max-content; }
.route-status-time :deep(.base-date-time), .route-status-time > span:not(.el-tag) { color: var(--el-text-color-secondary); font-size: 11px; }
.candidate-method-cell { display: inline-flex; align-items: center; gap: 7px; }
.muted-text { color: var(--el-text-color-secondary); }
.detail-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 0 0 16px; border-bottom: 1px solid var(--el-border-color-lighter); }
.detail-heading__title { color: var(--el-text-color-primary); font-size: 18px; font-weight: 600; }
.detail-heading__code { margin-top: 5px; color: var(--el-text-color-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
.detail-heading__meta { display: flex; align-items: center; gap: 10px; color: var(--el-text-color-secondary); font-size: 12px; }
.route-detail-tabs { margin-top: 8px; }
.detail-section + .detail-section { margin-top: 18px; }
.detail-section__title, .form-section__title { margin-bottom: 12px; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; }
.detail-dimensions { display: grid; border-top: 1px solid var(--el-border-color-lighter); border-bottom: 1px solid var(--el-border-color-lighter); }
.detail-dimension { display: grid; grid-template-columns: 150px minmax(0, 1fr); min-height: 64px; align-items: center; }
.detail-dimension + .detail-dimension { border-top: 1px solid var(--el-border-color-lighter); }
.detail-dimension__label { align-self: stretch; display: flex; align-items: center; padding: 12px 16px; background: var(--el-fill-color-light); color: var(--el-text-color-regular); font-size: 12px; font-weight: 600; }
.detail-dimension__values { display: flex; min-width: 0; flex-wrap: wrap; gap: 7px; padding: 12px 16px; }
.validation-panel { min-height: 260px; }
.validation-list { display: grid; gap: 10px; margin-top: 16px; }
.validation-item { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 10px; padding: 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 4px; }
.validation-item strong { display: block; margin-bottom: 3px; color: var(--el-text-color-primary); font-size: 12px; }
.validation-item span { color: var(--el-text-color-regular); font-size: 13px; }
.pagination-container--compact { padding-bottom: 0; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 24px; }
.form-grid--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.form-grid__full { grid-column: 1 / -1; }
.form-grid__wide { grid-column: span 2; }
.detail-merchants { display: flex; flex-wrap: wrap; gap: 6px; }
.route-merchant-item { width: 100%; }
.route-merchant-item :deep(.el-form-item__content) { display: grid; min-width: 0; grid-template-columns: 1fr; gap: 10px; }
.route-merchant-item :deep(.el-select) { width: 100%; }
.selected-merchants { display: grid; min-height: 0; gap: 8px; }
.selected-merchant { display: grid; min-width: 0; grid-template-columns: minmax(220px, .7fr) minmax(0, 1.3fr); align-items: center; gap: 14px; padding: 10px 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; background: var(--el-fill-color-blank); }
.selected-merchant--warning { border-color: var(--el-color-danger-light-5); background: var(--el-color-danger-light-9); }
.selected-merchant__identity { display: flex; min-width: 0; align-items: center; gap: 8px; color: var(--el-text-color-primary); font-weight: 600; }
.selected-merchant__identity span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.selected-merchant__warning { display: grid; min-width: 0; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: 8px; color: var(--el-color-danger); }
.selected-merchant__warning > div { display: grid; min-width: 0; gap: 3px; }
.selected-merchant__warning strong { font-size: 12px; line-height: 1.5; }
.selected-merchant__warning span { overflow: hidden; font-size: 11px; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.selected-merchant__ready { color: var(--el-color-success); font-size: 12px; }
.route-form { display: grid; max-width: none; gap: 0; }
.route-form-section { min-width: 0; padding: 20px 0 4px; border-top: 1px solid var(--el-border-color-lighter); }
.route-form-section:first-child { padding-top: 0; border-top: 0; }
.route-form-section--strategy { padding-bottom: 20px; }
.route-form-section--last { padding-bottom: 4px; }
.route-type-note { display: grid; grid-template-columns: 140px 1fr; align-items: center; gap: 14px; margin: 0 0 14px; padding: 11px 14px; border-left: 3px solid var(--el-color-primary); background: var(--el-color-primary-light-9); }
.route-type-note strong { color: var(--el-color-primary); font-size: 13px; }
.route-type-note span { color: var(--el-text-color-regular); font-size: 12px; line-height: 1.6; }
.route-dimension-editor { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 24px; padding: 16px 18px 0; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; background: var(--el-fill-color-blank); }
.dimension-option { display: flex; min-width: 0; align-items: center; gap: 9px; }
.dimension-option--selected { gap: 6px; }
.dimension-option > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-config { display: grid; grid-template-columns: minmax(280px, 420px) 1fr; align-items: center; gap: 24px; padding: 16px 18px; border: 1px solid var(--el-border-color); border-radius: 6px; background: var(--el-fill-color-lighter); }
.history-config :deep(.el-form-item) { margin-bottom: 0; }
.history-config span { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
.history-lookback-input { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto; align-items: stretch; }
.history-lookback-input :deep(.el-input-number) { width: 100%; }
.history-lookback-input > span { display: flex; min-width: 52px; align-items: center; justify-content: center; border: 1px solid var(--el-border-color); border-left: 0; border-radius: 0 var(--el-border-radius-base) var(--el-border-radius-base) 0; background: var(--el-fill-color-light); color: var(--el-text-color-regular); font-size: 12px; }
.history-lookback-input :deep(.el-input__wrapper) { border-radius: var(--el-border-radius-base) 0 0 var(--el-border-radius-base); }
.history-priority-hint { display: flex; min-height: 32px; align-items: center; padding: 0 12px; border-left: 3px solid var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-text-color-regular); font-size: 12px; line-height: 1.5; }
:deep(.route-form .el-input-number) { width: 100%; }
.route-scope-tabs { width: min(100%, 360px); }
:deep(.route-query-select) { width: 280px; }
:deep(.route-query-select .el-select__prefix), :deep(.route-dimension-editor .el-select__prefix) { margin-right: 4px; }
:deep(.danger-menu-item) { color: var(--el-color-danger); }
:global(.route-form-drawer.app-form-drawer .route-form) { width: 100%; max-width: none; margin: 0; }
:global(.route-form-drawer.app-form-drawer .route-form .form-grid) { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }

@media (max-width: 900px) {
    .form-grid, .form-grid--two { grid-template-columns: 1fr; }
    .form-grid__wide { grid-column: auto; }
    .detail-heading { align-items: flex-start; flex-direction: column; }
    .detail-dimension { grid-template-columns: 1fr; }
    .detail-dimension__label { min-height: 40px; }
    .route-type-note { grid-template-columns: 1fr; margin-left: 0; }
    .route-dimension-editor { grid-template-columns: 1fr; }
    .history-config { grid-template-columns: 1fr; }
    .route-merchant-item { width: 100%; }
    .selected-merchant { grid-template-columns: 1fr; }
    .route-scope-tabs { min-width: 0; }
    :global(.route-form-drawer.app-form-drawer .route-form .form-grid) { grid-template-columns: 1fr !important; }
}
</style>

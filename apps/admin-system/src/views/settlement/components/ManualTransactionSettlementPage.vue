<template>
    <div
        class="manual-settlement-page"
        :class="{
            'app-container': !props.embedded,
            'manual-settlement-page--embedded': props.embedded,
        }"
    >
        <header class="page-header">
            <div class="page-title">
                <h2>{{ pageCopy.title }}</h2>
                <p>{{ pageCopy.description }}</p>
            </div>
            <div class="page-toolbar">
                <div class="current-stage">
                    <span>{{ activeStep + 1 }} / 3</span>
                    <strong>{{ workflowSteps[activeStep]?.title }}</strong>
                </div>
                <el-button v-if="task" :icon="Refresh" :loading="taskLoading" @click="refreshTask">
                    {{ t('transaction.settlement.refreshProgress') }}
                </el-button>
            </div>
        </header>

        <nav class="workflow-strip" :aria-label="pageCopy.workflowLabel">
            <div
                v-for="(step, index) in workflowSteps"
                :key="step.title"
                class="workflow-step"
                :class="{ active: activeStep === index, completed: activeStep > index }"
            >
                <span class="step-marker">
                    <el-icon v-if="activeStep > index"><Check /></el-icon>
                    <span v-else>{{ index + 1 }}</span>
                </span>
                <span class="step-copy">
                    <strong>{{ step.title }}</strong>
                    <small>{{ step.description }}</small>
                </span>
            </div>
        </nav>

        <div class="cycle-guard" role="note">
            <el-icon aria-hidden="true"><InfoFilled /></el-icon>
            <span>{{ pageCopy.notice }}</span>
        </div>

        <section v-if="!task" class="scope-workspace">
            <div class="section-heading">
                <h3>{{ t('transaction.settlement.selectSettlementScope') }}</h3>
                <p>{{ pageCopy.scopeDescription }}</p>
            </div>

            <el-form :model="scopeForm" label-position="top" class="scope-form">
                <el-form-item :label="t('transaction.fields.merchantId')" required class="merchant-field">
                    <MerchantRemoteSelect v-model="scopeForm.merchantId" @change="handleMerchantChange" />
                </el-form-item>
                <el-form-item :label="t('transaction.settlement.selectSettlementProfile')" required class="profile-field">
                    <el-select
                        v-model="scopeForm.settlementProfileId"
                        :loading="profilesLoading"
                        :disabled="!scopeForm.merchantId"
                        filterable
                        :placeholder="t('transaction.settlement.selectSettlementProfilePlaceholder')"
                        :no-data-text="t('transaction.settlement.settlementProfileEmpty')"
                        @change="handleProfileChange"
                    >
                        <el-option
                            v-for="profile in profiles"
                            :key="profile.id"
                            :label="profileOptionText(profile)"
                            :value="profile.id"
                            :disabled="!profileAvailable(profile)"
                        >
                            <div class="profile-option">
                                <span>{{ profileOptionText(profile) }}</span>
                                <el-tag
                                    v-if="!profileAvailable(profile)"
                                    size="small"
                                    type="danger"
                                    effect="plain"
                                >
                                    {{ t('transaction.settlement.profileUnavailable') }}
                                </el-tag>
                            </div>
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.settlement.paymentTypeOptional')" class="dimension-field">
                    <el-select
                        v-model="scopeForm.paymentType"
                        clearable
                        filterable
                        :placeholder="t('transaction.settlement.paymentTypeScopeAll')"
                        @change="resetPreviewState"
                    >
                        <el-option v-for="item in paymentTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.settlement.paymentMethodOptional')" class="dimension-field">
                    <el-select
                        v-model="scopeForm.paymentMethod"
                        clearable
                        filterable
                        :placeholder="t('transaction.settlement.paymentMethodScopeAll')"
                        @change="resetPreviewState"
                    >
                        <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.settlement.manualSettlementReason')" required class="reason-field">
                    <el-input
                        v-model="scopeForm.reason"
                        type="textarea"
                        :rows="2"
                        maxlength="400"
                        show-word-limit
                        :placeholder="pageCopy.reasonPlaceholder"
                        @input="resetPreviewState"
                    />
                </el-form-item>
            </el-form>

            <div v-if="selectedProfile" class="profile-summary" :class="{ unavailable: !selectedProfileReady }">
                <div class="summary-title">
                    <span class="summary-icon" aria-hidden="true"><el-icon><Clock /></el-icon></span>
                    <div>
                        <strong>{{ pageCopy.ruleSummary }}</strong>
                        <small>{{ pageCopy.ruleReadOnly }}</small>
                    </div>
                    <el-tag :type="selectedProfileReady ? 'success' : 'danger'" effect="plain">
                        {{ selectedProfileReady
                            ? t('transaction.settlement.profileReady')
                            : t('transaction.settlement.profileUnavailable') }}
                    </el-tag>
                </div>
                <dl class="profile-facts">
                    <div>
                        <dt>{{ t('transaction.settlement.settlementAccount') }}</dt>
                        <dd>{{ selectedProfile.settlementAccountNo || `#${selectedProfile.settlementAccountId}` }}</dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.settlement.targetCurrency') }}</dt>
                        <dd class="currency-value">{{ selectedProfile.targetCurrency }}</dd>
                    </div>
                    <div v-if="!isReserve">
                        <dt>{{ t('transaction.settlement.initialCycle') }}</dt>
                        <dd>{{ profileCycleText(selectedProfile, 'initial') }}</dd>
                    </div>
                    <div v-else>
                        <dt>{{ t('transaction.settlement.reserveReleaseCycleBasis') }}</dt>
                        <dd>{{ t('transaction.settlement.reserveReleaseCycleDetail') }}</dd>
                    </div>
                    <div v-if="!isReserve">
                        <dt>{{ t('transaction.settlement.regularCycle') }}</dt>
                        <dd>{{ profileCycleText(selectedProfile, 'regular') }}</dd>
                    </div>
                    <div v-else>
                        <dt>{{ t('transaction.settlement.reserveReleaseMaturityRule') }}</dt>
                        <dd>{{ t('transaction.settlement.reserveReleaseMaturityValue') }}</dd>
                    </div>
                    <div v-if="!isReserve">
                        <dt>{{ t('transaction.settlement.settlementFrequency') }}</dt>
                        <dd>{{ profileFrequencyText(selectedProfile) }}</dd>
                    </div>
                    <div v-else>
                        <dt>{{ t('transaction.settlement.reserveActionScope') }}</dt>
                        <dd>{{ t('transaction.settlement.reserveReleaseOnly') }}</dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.settlement.cutoffSchedule') }}</dt>
                        <dd>{{ selectedProfile.businessTimeZone }} · {{ normalizedTime(selectedProfile.dailyCutoffTime) }}</dd>
                    </div>
                </dl>
                <p v-if="!selectedProfileReady" class="profile-warning">
                    <el-icon><WarningFilled /></el-icon>
                    {{ pageCopy.profileUnavailable }}
                </p>
            </div>

            <div v-if="previewError" class="preview-error" role="alert">
                <el-icon><WarningFilled /></el-icon>
                <div>
                    <strong>{{ t('transaction.settlement.previewBlockedTitle') }}</strong>
                    <p>{{ previewError.text }}</p>
                </div>
                <el-button
                    v-if="previewError.batchNo"
                    type="danger"
                    plain
                    :icon="View"
                    @click="openBatch(previewError.batchNo)"
                >
                    {{ t('transaction.settlement.viewBlockingBatch') }}
                </el-button>
            </div>

            <div class="rules-panel">
                <div class="rules-heading">
                    <span aria-hidden="true"><el-icon><InfoFilled /></el-icon></span>
                    <div>
                        <strong>{{ t('transaction.settlement.inclusionRules') }}</strong>
                        <small>{{ pageCopy.inclusionDescription }}</small>
                    </div>
                </div>
                <ul>
                    <li><el-icon><Check /></el-icon><span>{{ pageCopy.maturedRule }}</span></li>
                    <li><el-icon><Check /></el-icon><span>{{ pageCopy.cycleRule }}</span></li>
                    <li><el-icon><Check /></el-icon><span>{{ t('transaction.settlement.manualRuleSingleAccount') }}</span></li>
                    <li><el-icon><Check /></el-icon><span>{{ t('transaction.settlement.manualRuleNoExclusion') }}</span></li>
                    <li><el-icon><Check /></el-icon><span>{{ t('transaction.settlement.manualRuleMakerChecker') }}</span></li>
                </ul>
            </div>

            <footer class="form-actions">
                <p><el-icon><InfoFilled /></el-icon>{{ pageCopy.previewAction }}</p>
                <div class="action-buttons">
                    <el-button :icon="RefreshLeft" @click="resetScope">
                        {{ t('transaction.settlement.clearSelection') }}
                    </el-button>
                    <el-button
                        v-hasPermi="createPermission"
                        type="primary"
                        :icon="DataAnalysis"
                        :loading="previewing"
                        :disabled="!selectedProfileReady"
                        @click="createPreview"
                    >
                        {{ t('transaction.settlement.previewSettlement') }}
                    </el-button>
                </div>
            </footer>
        </section>

        <template v-else>
            <section class="statement-section">
                <div class="statement-heading">
                    <div>
                        <h3>{{ t('transaction.settlement.manualSettlementPreview') }}</h3>
                        <p>{{ pageCopy.previewDescription }}</p>
                    </div>
                    <el-tag :type="taskStatusType" effect="plain">{{ taskStatusText }}</el-tag>
                </div>

                <article class="settlement-statement">
                    <header class="statement-header">
                        <div class="statement-title">
                            <h3>{{ pageCopy.statementTitle }}</h3>
                            <p>{{ pageCopy.statementFootnote }}</p>
                        </div>
                        <dl class="statement-meta">
                            <div><dt>{{ t('transaction.settlement.manualTaskNo') }}</dt><dd>{{ task.taskNo }}</dd></div>
                            <div><dt>{{ t('transaction.settlement.businessDate') }}</dt><dd>{{ task.businessDate }}</dd></div>
                            <div><dt>{{ t('transaction.settlement.targetCurrency') }}</dt><dd>{{ task.targetCurrency }}</dd></div>
                        </dl>
                    </header>

                    <div class="statement-facts">
                        <section>
                            <h4>{{ t('transaction.settlement.merchantInformation') }}</h4>
                            <dl>
                                <div><dt>{{ t('transaction.settlement.merchant') }}</dt><dd>{{ taskMerchantText }}</dd></div>
                                <div><dt>{{ t('transaction.settlement.settlementAccount') }}</dt><dd>{{ taskAccountText }}</dd></div>
                                <div><dt>{{ t('transaction.settlement.paymentScope') }}</dt><dd>{{ taskPaymentScopeText }}</dd></div>
                            </dl>
                        </section>
                        <section>
                            <h4>{{ t('transaction.settlement.settlementRule') }}</h4>
                            <dl>
                                <div v-if="!isReserve"><dt>{{ t('transaction.settlement.settlementCycle') }}</dt><dd>{{ taskCycleSummary }}</dd></div>
                                <div v-else><dt>{{ t('transaction.settlement.reserveReleaseCycle') }}</dt><dd>{{ taskReserveCycleSummary }}</dd></div>
                                <div v-if="!isReserve"><dt>{{ t('transaction.settlement.settlementFrequency') }}</dt><dd>{{ taskFrequencyText }}</dd></div>
                                <div v-else><dt>{{ t('transaction.settlement.expectedReleaseDateRange') }}</dt><dd>{{ taskReserveDateRange }}</dd></div>
                                <div><dt>{{ t('transaction.settlement.settlementCutoff') }}</dt><dd><BaseDateTime :value="task.cutoffEndTime" /></dd></div>
                            </dl>
                        </section>
                        <section>
                            <h4>{{ t('transaction.settlement.previewSnapshot') }}</h4>
                            <dl>
                                <div><dt>{{ pageCopy.expectedCountLabel }}</dt><dd class="metric-value">{{ integerText(task.expectedCandidateCount) }}</dd></div>
                                <div><dt>{{ t('transaction.settlement.sourceCurrencyCount') }}</dt><dd>{{ integerText(sourceCurrencyCount) }}</dd></div>
                                <div><dt>{{ t('transaction.settlement.sourceCurrencies') }}</dt><dd>{{ sourceCurrencyText }}</dd></div>
                            </dl>
                        </section>
                    </div>

                    <div class="statement-reason">
                        <span>{{ t('transaction.settlement.manualSettlementReason') }}</span>
                        <p>{{ task.submitReason || scopeForm.reason || '-' }}</p>
                    </div>

                    <div class="table-heading">
                        <div>
                            <h4>{{ t('transaction.settlement.sourceCurrencyStatistics') }}</h4>
                            <p>{{ pageCopy.currencyNotice }}</p>
                        </div>
                        <strong>{{ t('transaction.settlement.settlementCurrencyLabel', { currency: task.targetCurrency }) }}</strong>
                    </div>

                    <StandardTable
                        :table-key="`admin-manual-${props.kind}-settlement-preview`"
                        :data="task.preview || []"
                        row-key="sourceCurrency"
                        size="small"
                        border
                        class="statement-table"
                    >
                        <el-table-column prop="sourceCurrency" :label="t('transaction.settlement.sourceCurrency')" min-width="126" fixed="left" align="center">
                            <template #default="{ row }"><strong class="currency-value">{{ row.sourceCurrency }}</strong></template>
                        </el-table-column>
                        <el-table-column prop="transactionCount" :label="pageCopy.countColumn" min-width="125" align="right">
                            <template #default="{ row }">{{ integerText(row.transactionCount) }}</template>
                        </el-table-column>
                        <el-table-column v-if="!isReserve" :label="t('transaction.settlement.grossAmount')" min-width="175" align="right">
                            <template #default="{ row }">{{ previewMoney(row.grossAmount, row) }}</template>
                        </el-table-column>
                        <el-table-column v-if="!isReserve" :label="t('transaction.settlement.platformFeeAmount')" min-width="175" align="right">
                            <template #default="{ row }">{{ previewMoney(row.platformFeeAmount, row) }}</template>
                        </el-table-column>
                        <el-table-column v-if="!isReserve" :label="t('transaction.settlement.reserveAmount')" min-width="175" align="right">
                            <template #default="{ row }">{{ previewMoney(row.reserveAmount, row) }}</template>
                        </el-table-column>
                        <el-table-column v-if="!isReserve" :label="t('transaction.settlement.netSettlementAmount')" min-width="185" align="right">
                            <template #default="{ row }"><strong>{{ previewMoney(row.netSettlementAmount, row) }}</strong></template>
                        </el-table-column>
                        <el-table-column v-if="!isReserve" prop="pendingFeeCount" :label="t('transaction.settlement.pendingFeeCount')" min-width="185" align="right">
                            <template #default="{ row }">{{ integerText(row.pendingFeeCount) }}</template>
                        </el-table-column>
                        <el-table-column v-if="isReserve" :label="t('transaction.settlement.releasedReserveAmount')" min-width="180" align="right">
                            <template #default="{ row }"><strong>{{ previewMoney(row.releasedReserveAmount, row) }}</strong></template>
                        </el-table-column>
                        <el-table-column v-if="isReserve" :label="t('transaction.settlement.reserveReleaseCycle')" min-width="180" align="center">
                            <template #default="{ row }">{{ reserveCycleText(row) }}</template>
                        </el-table-column>
                        <el-table-column v-if="isReserve" :label="t('transaction.settlement.expectedReleaseDateRange')" min-width="230" align="center">
                            <template #default="{ row }">{{ reserveDateRange(row) }}</template>
                        </el-table-column>
                    </StandardTable>

                    <footer class="statement-footer">
                        <span>{{ pageCopy.currencyNotice }}</span>
                        <strong>{{ task.taskNo }}</strong>
                    </footer>
                </article>

                <footer v-if="task.taskStatus === 'PREVIEWED'" class="form-actions statement-actions">
                    <div class="action-copy">
                        <strong>{{ pageCopy.generateActionTitle }}</strong>
                        <span>{{ pageCopy.generateActionDescription }}</span>
                    </div>
                    <el-button
                        v-hasPermi="createPermission"
                        type="primary"
                        :icon="DocumentChecked"
                        :loading="starting"
                        @click="startGeneration"
                    >
                        {{ pageCopy.generateReviewOrder }}
                    </el-button>
                </footer>
            </section>

            <section v-if="task.taskStatus !== 'PREVIEWED'" class="progress-workspace">
                <div class="section-heading progress-heading">
                    <div>
                        <h3>{{ t('transaction.settlement.manualSettlementProgress') }}</h3>
                        <p>{{ pageCopy.progressDescription }}</p>
                    </div>
                    <strong class="progress-value">{{ task.progressPercent }}%</strong>
                </div>
                <el-progress
                    :percentage="task.progressPercent"
                    :status="task.taskStatus === 'FAILED' ? 'exception' : task.taskStatus === 'COMPLETED' ? 'success' : undefined"
                    :stroke-width="12"
                />
                <div class="progress-facts">
                    <div><span>{{ t('transaction.settlement.processedCandidates') }}</span><strong>{{ integerText(task.processedCandidateCount) }} / {{ integerText(task.expectedCandidateCount) }}</strong></div>
                    <div><span>{{ t('transaction.settlement.lockedCandidates') }}</span><strong>{{ integerText(task.lockedCandidateCount) }}</strong></div>
                    <div><span>{{ t('transaction.settlement.retryCount') }}</span><strong>{{ task.retryCount }}</strong></div>
                    <div><span>{{ t('transaction.settlement.manualTaskNo') }}</span><strong>{{ task.taskNo }}</strong></div>
                </div>
                <el-alert
                    v-if="task.taskStatus === 'FAILED'"
                    :title="t('transaction.settlement.manualTaskFailed')"
                    :description="taskFailureText"
                    type="error"
                    show-icon
                    :closable="false"
                />
                <div v-if="task.reviewOrderNo" class="progress-actions">
                    <el-button type="success" :icon="View" @click="openReviewOrder">
                        {{ t('transaction.settlement.viewReviewOrder') }}
                    </el-button>
                </div>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import {
    Check,
    Clock,
    DataAnalysis,
    DocumentChecked,
    InfoFilled,
    Refresh,
    RefreshLeft,
    View,
    WarningFilled,
} from '@element-plus/icons-vue';
import { BusinessResultError } from '@acquiring/shared';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
    getManualReserveReviewTask,
    getManualTransactionReviewTask,
    previewManualReserveReview,
    previewManualTransactionReview,
    searchSettlementProfiles,
    startManualReserveReview,
    startManualTransactionReview,
    type ManualSettlementPreviewLine,
    type ManualSettlementTask,
    type SettlementProfile,
} from '@/api/settlement';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import { moneyTextByExponent, requestKey } from '@/views/settlement/shared';

interface PreviewErrorState {
    code: string;
    text: string;
    batchNo?: string;
}

const props = withDefaults(defineProps<{
    embedded?: boolean;
    kind?: 'transaction' | 'reserve';
}>(), { embedded: false, kind: 'transaction' });
const { t, te, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const scopeForm = reactive({
    merchantId: '',
    settlementProfileId: undefined as number | undefined,
    paymentType: '',
    paymentMethod: '',
    reason: '',
});
const profiles = ref<SettlementProfile[]>([]);
const paymentTypeOptions = ref<SelectOption[]>([]);
const paymentMethodOptions = ref<SelectOption[]>([]);
const profilesLoading = ref(false);
const previewing = ref(false);
const starting = ref(false);
const taskLoading = ref(false);
const task = ref<ManualSettlementTask | null>(null);
const previewError = ref<PreviewErrorState | null>(null);
const previewRequestKey = ref('');
const startRequestKey = ref('');
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const isReserve = computed(() => props.kind === 'reserve');
const createPermission = computed(() => `settlement:${props.kind}-review:create`);
const pageCopy = computed(() => isReserve.value ? {
    title: t('transaction.settlement.manualReserveSettlementTitle'),
    description: t('transaction.settlement.manualReserveSettlementDescription'),
    workflowLabel: t('transaction.settlement.manualReserveSettlementWorkflow'),
    notice: t('transaction.settlement.manualReserveSettlementNotice'),
    scopeDescription: t('transaction.settlement.selectReserveSettlementScopeDescription'),
    reasonPlaceholder: t('transaction.settlement.manualReserveSettlementReasonPlaceholder'),
    ruleSummary: t('transaction.settlement.reserveReleaseRuleSummary'),
    ruleReadOnly: t('transaction.settlement.reserveReleaseRuleReadOnly'),
    profileUnavailable: t('transaction.settlement.reserveProfileUnavailableDescription'),
    inclusionDescription: t('transaction.settlement.reserveInclusionRulesDescription'),
    maturedRule: t('transaction.settlement.manualReserveRuleMatured'),
    cycleRule: t('transaction.settlement.manualReserveRuleCycleReadOnly'),
    previewAction: t('transaction.settlement.reservePreviewActionDescription'),
    previewDescription: t('transaction.settlement.reservePreviewStatementDescription'),
    statementTitle: t('transaction.settlement.reservePreviewStatement'),
    statementFootnote: t('transaction.settlement.reservePreviewStatementFootnote'),
    expectedCountLabel: t('transaction.settlement.expectedReserveReleaseCount'),
    currencyNotice: t('transaction.settlement.reserveCurrencyStatisticsNotice'),
    countColumn: t('transaction.settlement.reserveReleaseCount'),
    generateActionTitle: t('transaction.settlement.generateReserveActionTitle'),
    generateActionDescription: t('transaction.settlement.generateReserveActionDescription'),
    generateReviewOrder: t('transaction.settlement.generateReserveReviewOrder'),
    progressDescription: t('transaction.settlement.reserveProgressDescription'),
    generateConfirm: t('transaction.settlement.generateReserveReviewConfirm'),
} : {
    title: t('transaction.settlement.manualSettlementTitle'),
    description: t('transaction.settlement.manualSettlementDescription'),
    workflowLabel: t('transaction.settlement.manualSettlementWorkflow'),
    notice: t('transaction.settlement.manualSettlementNotice'),
    scopeDescription: t('transaction.settlement.selectSettlementScopeDescription'),
    reasonPlaceholder: t('transaction.settlement.manualSettlementReasonPlaceholder'),
    ruleSummary: t('transaction.settlement.settlementRuleSummary'),
    ruleReadOnly: t('transaction.settlement.settlementRuleReadOnly'),
    profileUnavailable: t('transaction.settlement.profileUnavailableDescription'),
    inclusionDescription: t('transaction.settlement.inclusionRulesDescription'),
    maturedRule: t('transaction.settlement.manualRuleMatured'),
    cycleRule: t('transaction.settlement.manualRuleCycleReadOnly'),
    previewAction: t('transaction.settlement.previewActionDescription'),
    previewDescription: t('transaction.settlement.previewStatementDescription'),
    statementTitle: t('transaction.settlement.transactionPreviewStatement'),
    statementFootnote: t('transaction.settlement.previewStatementFootnote'),
    expectedCountLabel: t('transaction.settlement.expectedCandidateCount'),
    currencyNotice: t('transaction.settlement.currencyStatisticsNotice'),
    countColumn: t('transaction.settlement.transactionCount'),
    generateActionTitle: t('transaction.settlement.generateActionTitle'),
    generateActionDescription: t('transaction.settlement.generateActionDescription'),
    generateReviewOrder: t('transaction.settlement.generateReviewOrder'),
    progressDescription: t('transaction.settlement.progressDescription'),
    generateConfirm: t('transaction.settlement.generateReviewConfirm'),
});
const workflowSteps = computed(() => [
    {
        title: t('transaction.settlement.manualSettlementScope'),
        description: t('transaction.settlement.manualSettlementScopeStep'),
    },
    {
        title: t('transaction.settlement.manualSettlementPreview'),
        description: t('transaction.settlement.manualSettlementPreviewStep'),
    },
    {
        title: t('transaction.settlement.manualSettlementProgress'),
        description: t('transaction.settlement.manualSettlementProgressStep'),
    },
]);
const activeStep = computed(() => {
    if (!task.value) return 0;
    return task.value.taskStatus === 'PREVIEWED' ? 1 : 2;
});
const selectedProfile = computed(() => profiles.value.find(
    (profile) => profile.id === scopeForm.settlementProfileId,
) || null);
const taskProfile = computed(() => profiles.value.find(
    (profile) => profile.id === task.value?.settlementProfileId,
) || null);
const selectedProfileReady = computed(() => Boolean(
    selectedProfile.value
        && selectedProfile.value.settlementAccountId
        && selectedProfile.value.targetCurrency
        && selectedProfile.value.businessTimeZone
        && selectedProfile.value.dailyCutoffTime
        && (isReserve.value || (selectedProfile.value.manualSettlementAvailable !== false
            && selectedProfile.value.initialDelayUnit
            && selectedProfile.value.initialDelayDays
            && selectedProfile.value.regularDelayDays
            && selectedProfile.value.settlementFrequency)),
));
const taskStatusText = computed(() => enumText('taskStatusValue', task.value?.taskStatus));
const taskStatusType = computed(() => {
    if (task.value?.taskStatus === 'COMPLETED') return 'success';
    if (task.value?.taskStatus === 'FAILED') return 'danger';
    if (task.value?.taskStatus === 'PREVIEWED') return 'warning';
    return 'primary';
});
const taskMerchantText = computed(() => {
    if (!task.value) return '-';
    return taskProfile.value?.merchantName
        ? `${taskProfile.value.merchantName} · ${task.value.merchantId}`
        : task.value.merchantId;
});
const taskAccountText = computed(() => {
    if (!task.value) return '-';
    return taskProfile.value?.settlementAccountNo || `#${task.value.settlementAccountId}`;
});
const taskPaymentScopeText = computed(() => {
    if (!task.value) return '-';
    return [
        dimensionText('paymentTypeValue', task.value.paymentType),
        dimensionText('paymentMethodValue', task.value.paymentMethod),
    ].join(' · ');
});
const taskCycleSummary = computed(() => {
    if (!task.value) return '-';
    return `${t('transaction.settlement.initialCycle')} ${cycleText(task.value.initialDelayUnit, task.value.initialDelayDays)} · ${t('transaction.settlement.regularCycle')} ${cycleText(task.value.initialDelayUnit, task.value.regularDelayDays)}`;
});
const taskFrequencyText = computed(() => task.value ? frequencyText(
    task.value.settlementFrequency,
    task.value.frequencyDay,
) : '-');
const taskReserveCycleSummary = computed(() => reserveCycleSummary(task.value?.preview || []));
const taskReserveDateRange = computed(() => reserveDateSummary(task.value?.preview || []));
const sourceCurrencyCount = computed(() => task.value?.preview?.length || 0);
const sourceCurrencyText = computed(() => task.value?.preview?.map((row) => row.sourceCurrency).join(', ') || '-');
const taskFailureText = computed(() => {
    if (!task.value) return '';
    return [task.value.failureCode, task.value.failureMessage].filter(Boolean).join(' · ');
});

onMounted(async () => {
    await loadDictionaries();
    const taskNo = typeof route.query.taskNo === 'string' ? route.query.taskNo.trim() : '';
    if (taskNo) await loadTask(taskNo);
});

onBeforeUnmount(stopPolling);

async function loadDictionaries() {
    const language = String(locale.value || 'zh-CN');
    const [paymentTypes, paymentMethods] = await Promise.all([
        loadDictOptions('acquiring_payment_method', language).catch(() => []),
        loadDictOptions('card_brand', language).catch(() => []),
    ]);
    paymentTypeOptions.value = paymentTypes;
    paymentMethodOptions.value = paymentMethods;
}

async function handleMerchantChange(value: string | string[]) {
    scopeForm.merchantId = Array.isArray(value) ? '' : value;
    scopeForm.settlementProfileId = undefined;
    profiles.value = [];
    resetPreviewState();
    if (scopeForm.merchantId) await loadProfiles(scopeForm.merchantId);
}

async function loadProfiles(merchantId: string) {
    profilesLoading.value = true;
    try {
        const result = await searchSettlementProfiles({
            merchantId,
            profileStatus: 'ACTIVE',
            pageNo: 1,
            pageSize: 100,
        });
        profiles.value = result.records || [];
    } catch (error) {
        ElMessage.error(errorText(error, 'common.loadFailed'));
    } finally {
        profilesLoading.value = false;
    }
}

function handleProfileChange() {
    resetPreviewState();
}

async function createPreview() {
    if (!scopeForm.merchantId || !scopeForm.settlementProfileId) {
        ElMessage.warning(t('transaction.settlement.settlementProfileRequired'));
        return;
    }
    if (!selectedProfileReady.value) {
        ElMessage.warning(t('transaction.settlement.profileUnavailableDescription'));
        return;
    }
    if (!scopeForm.reason.trim()) {
        ElMessage.warning(t('transaction.settlement.requiredFields'));
        return;
    }
    previewError.value = null;
    previewing.value = true;
    try {
        previewRequestKey.value ||= requestKey(
            isReserve.value ? 'SET-RESERVE-MANUAL-PREVIEW' : 'SET-MANUAL-PREVIEW',
        );
        const preview = isReserve.value ? previewManualReserveReview : previewManualTransactionReview;
        const result = await preview({
            requestKey: previewRequestKey.value,
            merchantId: scopeForm.merchantId,
            settlementProfileId: scopeForm.settlementProfileId,
            paymentType: scopeForm.paymentType || undefined,
            paymentMethod: scopeForm.paymentMethod || undefined,
            reason: scopeForm.reason.trim(),
        });
        applyTask(result);
        await syncTaskQuery(result.taskNo);
        ElMessage.success(t(isReserve.value
            ? 'transaction.settlement.manualReservePreviewReady'
            : 'transaction.settlement.manualPreviewReady'));
    } catch (error) {
        previewError.value = manualPreviewError(error);
        ElMessage.error(previewError.value.text);
    } finally {
        previewing.value = false;
    }
}

async function startGeneration() {
    if (!task.value || task.value.taskStatus !== 'PREVIEWED') return;
    try {
        await ElMessageBox.confirm(
            pageCopy.value.generateConfirm,
            pageCopy.value.generateReviewOrder,
            { type: 'warning', confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel') },
        );
    } catch {
        return;
    }
    starting.value = true;
    try {
        startRequestKey.value ||= requestKey(
            isReserve.value ? 'SET-RESERVE-MANUAL-START' : 'SET-MANUAL-START',
        );
        const start = isReserve.value ? startManualReserveReview : startManualTransactionReview;
        const result = await start(task.value.taskNo, {
            requestKey: startRequestKey.value,
            expectedVersion: task.value.version,
        });
        applyTask(result);
        ElMessage.success(t(isReserve.value
            ? 'transaction.settlement.manualReserveTaskSubmitted'
            : 'transaction.settlement.manualTaskSubmitted'));
    } catch (error) {
        ElMessage.error(errorText(error, 'common.operationFailed'));
    } finally {
        starting.value = false;
    }
}

async function refreshTask() {
    if (task.value) await loadTask(task.value.taskNo);
}

async function loadTask(taskNo: string, silent = false) {
    if (!silent) taskLoading.value = true;
    try {
        const getTask = isReserve.value ? getManualReserveReviewTask : getManualTransactionReviewTask;
        const result = await getTask(taskNo);
        applyTask(result);
        if (!profiles.value.some((profile) => profile.id === result.settlementProfileId)) {
            await loadProfiles(result.merchantId);
        }
    } catch (error) {
        stopPolling();
        if (!silent) ElMessage.error(errorText(error, 'common.loadFailed'));
    } finally {
        if (!silent) taskLoading.value = false;
    }
}

function applyTask(value: ManualSettlementTask) {
    task.value = value;
    scopeForm.merchantId = value.merchantId;
    scopeForm.settlementProfileId = value.settlementProfileId;
    scopeForm.paymentType = value.paymentType || '';
    scopeForm.paymentMethod = value.paymentMethod || '';
    scopeForm.reason = value.submitReason || scopeForm.reason;
    schedulePolling(value.taskStatus);
}

function schedulePolling(status: string) {
    stopPolling();
    if (!['QUEUED', 'PROCESSING', 'FINALIZING', 'CANCELLING'].includes(status) || !task.value) return;
    pollTimer = setTimeout(() => void loadTask(task.value!.taskNo, true), 2500);
}

function stopPolling() {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = undefined;
}

async function syncTaskQuery(taskNo: string) {
    await router.replace({ path: route.path, query: { ...route.query, taskNo } });
}

function openReviewOrder() {
    if (!task.value?.reviewOrderNo) return;
    router.push({ path: '/settlement/review-orders', query: { reviewOrderNo: task.value.reviewOrderNo } });
}

function openBatch(batchNo: string) {
    router.push({ path: '/settlement/batches', query: { settlementBatchNo: batchNo } });
}

function resetScope() {
    Object.assign(scopeForm, {
        merchantId: '',
        settlementProfileId: undefined,
        paymentType: '',
        paymentMethod: '',
        reason: '',
    });
    profiles.value = [];
    resetPreviewState();
}

function resetPreviewState() {
    previewRequestKey.value = '';
    previewError.value = null;
}

function profileOptionText(profile: SettlementProfile) {
    return `${profile.settlementAccountNo || `#${profile.settlementAccountId}`} · ${profile.targetCurrency} · ${profile.settlementProfileNo}`;
}

function profileAvailable(profile: SettlementProfile) {
    return isReserve.value || profile.manualSettlementAvailable !== false;
}

function profileCycleText(profile: SettlementProfile, phase: 'initial' | 'regular') {
    const days = phase === 'initial' ? profile.initialDelayDays : profile.regularDelayDays;
    return profile.initialDelayUnit && days ? cycleText(profile.initialDelayUnit, days) : '-';
}

function profileFrequencyText(profile: SettlementProfile) {
    return frequencyText(profile.settlementFrequency, profile.frequencyDay);
}

function frequencyText(frequency?: string, frequencyDay?: number) {
    if (!frequency) return '-';
    const label = enumText('frequencyValue', frequency);
    if (!frequencyDay) return label;
    if (frequency === 'MONTHLY') {
        return `${label} · ${t('transaction.settlement.frequencyDayMonthly', { day: frequencyDay })}`;
    }
    return `${label} · ${t('transaction.settlement.frequencyDayWeekly', {
        day: enumText('weekdayValue', String(frequencyDay)),
    })}`;
}

function dimensionText(group: string, value?: string) {
    if (value) return enumText(group, value);
    return group === 'paymentTypeValue'
        ? t('transaction.settlement.paymentTypeScopeAll')
        : t('transaction.settlement.paymentMethodScopeAll');
}

function enumText(group: string, value?: string) {
    if (!value) return '-';
    const options = group === 'paymentTypeValue' ? paymentTypeOptions.value
        : group === 'paymentMethodValue' ? paymentMethodOptions.value : [];
    const option = options.find((item) => item.value === value);
    if (option) return option.label;
    const key = `transaction.settlement.${group}.${value}`;
    return te(key) ? t(key) : value;
}

function cycleText(unit: string, days: number) {
    return `${unit}+${days}`;
}

function normalizedTime(value?: string) {
    return value ? value.slice(0, 8) : '-';
}

function previewMoney(value: number | string, row: ManualSettlementPreviewLine) {
    return moneyTextByExponent(value, row.sourceCurrency, row.sourceCurrencyExponent);
}

function reserveCycleText(row: ManualSettlementPreviewLine) {
    const unit = row.reserveDelayUnit || 'D';
    if (unit === 'MIXED') return t('transaction.settlement.mixedReserveCycles');
    const minimum = row.minimumReserveDelayDays;
    const maximum = row.maximumReserveDelayDays;
    if (minimum === undefined || maximum === undefined) return '-';
    return minimum === maximum ? `${unit}+${minimum}` : `${unit}+${minimum} ~ ${unit}+${maximum}`;
}

function reserveDateRange(row: ManualSettlementPreviewLine) {
    if (!row.earliestExpectedReleaseDate && !row.latestExpectedReleaseDate) return '-';
    if (row.earliestExpectedReleaseDate === row.latestExpectedReleaseDate) {
        return row.earliestExpectedReleaseDate || '-';
    }
    return `${row.earliestExpectedReleaseDate || '-'} ~ ${row.latestExpectedReleaseDate || '-'}`;
}

function reserveCycleSummary(rows: ManualSettlementPreviewLine[]) {
    if (!rows.length) return '-';
    const units = new Set(rows.map((row) => row.reserveDelayUnit).filter(Boolean));
    if (units.has('MIXED') || units.size > 1) return t('transaction.settlement.mixedReserveCycles');
    const minimums = rows.map((row) => row.minimumReserveDelayDays)
        .filter((value): value is number => value !== undefined);
    const maximums = rows.map((row) => row.maximumReserveDelayDays)
        .filter((value): value is number => value !== undefined);
    if (!minimums.length || !maximums.length) return '-';
    const unit = [...units][0] || 'D';
    const minimum = Math.min(...minimums);
    const maximum = Math.max(...maximums);
    return minimum === maximum ? `${unit}+${minimum}` : `${unit}+${minimum} ~ ${unit}+${maximum}`;
}

function reserveDateSummary(rows: ManualSettlementPreviewLine[]) {
    if (!rows.length) return '-';
    const values = rows.flatMap((row) => [
        row.earliestExpectedReleaseDate,
        row.latestExpectedReleaseDate,
    ]).filter((value): value is string => Boolean(value)).sort();
    if (!values.length) return '-';
    return values[0] === values[values.length - 1]
        ? values[0]
        : `${values[0]} ~ ${values[values.length - 1]}`;
}

function integerText(value?: number | null) {
    return value === undefined || value === null ? '-' : new Intl.NumberFormat(String(locale.value)).format(value);
}

function manualPreviewError(error: unknown): PreviewErrorState {
    if (!(error instanceof BusinessResultError)) {
        return { code: 'UNKNOWN', text: errorText(error, 'common.operationFailed') };
    }
    if (error.resultCode === 'MANUAL_REVIEW_BLOCKED_BATCH') {
        const details = parseBlockingBatch(error.message);
        return {
            code: error.resultCode,
            batchNo: details.batchNo,
            text: t('transaction.settlement.errorBlockedBatch', {
                batchNo: details.batchNo || '-',
                stage: details.failureStage || '-',
                code: details.failureCode || '-',
            }),
        };
    }
    const errorKey: Record<string, string> = {
        MANUAL_REVIEW_CANDIDATE_EMPTY: isReserve.value
            ? 'errorReserveCandidateEmpty' : 'errorCandidateEmpty',
        MANUAL_REVIEW_PROFILE_BUSY: 'errorProfileBusy',
        MANUAL_REVIEW_PROFILE_INVALID: isReserve.value
            ? 'errorReserveProfileInvalid' : 'errorProfileInvalid',
        MANUAL_REVIEW_CANDIDATE_COUNT_INVALID: 'errorCandidateCountInvalid',
    };
    const key = errorKey[error.resultCode];
    return {
        code: error.resultCode,
        text: key ? t(`transaction.settlement.${key}`) : error.message,
    };
}

function parseBlockingBatch(message: string) {
    const value = (key: string) => new RegExp(`${key}=([^;]+)`).exec(message)?.[1]?.trim();
    return {
        batchNo: value('batchNo'),
        failureStage: value('failureStage'),
        failureCode: value('failureCode'),
    };
}

function errorText(error: unknown, fallbackKey: string) {
    return error instanceof Error && error.message ? error.message : t(fallbackKey);
}
</script>

<style scoped>
.manual-settlement-page {
    --settlement-blue: #2563eb;
    --settlement-blue-soft: #eff6ff;
    --settlement-green: #16845b;
    --settlement-green-soft: #f0fdf7;
    --settlement-amber: #9a6700;
    --settlement-amber-soft: #fffbeb;
    --settlement-ink: #182230;
    --settlement-muted: #667085;
    --settlement-rule: #dfe5ec;
    --settlement-page: #f6f8fb;
    max-width: 1560px;
    margin: 0 auto;
    color: var(--settlement-ink);
}

.manual-settlement-page--embedded {
    width: 100%;
    max-width: none;
    margin: 0;
    min-height: 0;
    padding: 14px 0 0;
    background: transparent;
}

.page-header,
.page-toolbar,
.workflow-step,
.cycle-guard,
.summary-title,
.rules-heading,
.form-actions,
.statement-heading,
.table-heading,
.progress-heading {
    display: flex;
    align-items: center;
}

.page-header {
    justify-content: space-between;
    gap: 24px;
    padding: 2px 0 16px;
    border-bottom: 1px solid var(--settlement-rule);
}

.page-title {
    min-width: 0;
}

.page-title h2 {
    margin: 0;
    color: var(--settlement-ink);
    font-size: 20px;
    line-height: 1.4;
    letter-spacing: 0;
}

.page-title p {
    max-width: 920px;
    margin: 4px 0 0;
    color: var(--settlement-muted);
    font-size: 13px;
    line-height: 1.55;
}

.page-toolbar {
    flex: 0 0 auto;
    gap: 14px;
}

.current-stage {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    padding-left: 14px;
    border-left: 2px solid var(--settlement-blue);
}

.current-stage span {
    color: var(--settlement-blue);
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.current-stage strong {
    font-size: 13px;
    font-weight: 600;
}

.workflow-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 14px 0 10px;
    overflow-x: auto;
}

.workflow-step {
    position: relative;
    min-width: 220px;
    min-height: 46px;
    padding-right: 28px;
    color: #98a2b3;
}

.workflow-step:not(:last-child)::after {
    position: absolute;
    top: 14px;
    right: 8px;
    left: 34px;
    height: 1px;
    background: #d7dee7;
    content: '';
}

.workflow-step.active:not(:last-child)::after,
.workflow-step.completed:not(:last-child)::after {
    background: #8db8ff;
}

.step-marker {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    border: 1px solid #d7dee7;
    border-radius: 50%;
    background: #fff;
    font-size: 12px;
    font-weight: 700;
}

.step-copy {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    margin-left: 9px;
    padding-right: 12px;
    background: var(--settlement-page);
}

.step-copy strong {
    font-size: 13px;
    line-height: 1.35;
    letter-spacing: 0;
}

.step-copy small {
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.35;
}

.workflow-step.active,
.workflow-step.completed {
    color: var(--settlement-blue);
}

.workflow-step.active .step-marker,
.workflow-step.completed .step-marker {
    border-color: var(--settlement-blue);
    background: var(--settlement-blue);
    color: #fff;
}

.cycle-guard {
    gap: 8px;
    min-height: 34px;
    padding: 7px 11px;
    border: 1px solid #f1d899;
    border-radius: 5px;
    background: var(--settlement-amber-soft);
    color: #7a4f01;
    font-size: 12px;
    line-height: 1.5;
}

.cycle-guard .el-icon {
    flex: 0 0 auto;
    color: var(--settlement-amber);
    font-size: 15px;
}

.scope-workspace,
.statement-section,
.progress-workspace {
    padding-top: 20px;
}

.section-heading {
    display: block;
    margin-bottom: 16px;
}

.section-heading h3,
.statement-heading h3 {
    margin: 0;
    color: var(--settlement-ink);
    font-size: 16px;
    line-height: 1.45;
    letter-spacing: 0;
}

.section-heading p,
.statement-heading p {
    margin: 3px 0 0;
    color: var(--settlement-muted);
    font-size: 12px;
    line-height: 1.55;
}

.scope-form {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 0 16px;
    padding: 18px 18px 2px;
    border: 1px solid var(--settlement-rule);
    border-radius: 6px;
    background: #fff;
}

.scope-form :deep(.el-form-item) {
    min-width: 0;
    margin-bottom: 16px;
}

.scope-form :deep(.el-form-item__label) {
    padding-bottom: 7px;
    color: #344054;
    font-size: 13px;
    line-height: 1.35;
}

.scope-form :deep(.el-input),
.scope-form :deep(.el-select) {
    width: 100%;
}

.merchant-field,
.profile-field {
    grid-column: span 4;
}

.dimension-field {
    grid-column: span 2;
}

.reason-field {
    grid-column: 1 / -1;
}

.profile-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
}

.profile-summary {
    margin-top: 14px;
    overflow: hidden;
    border: 1px solid #cfe4da;
    border-left: 3px solid var(--settlement-green);
    border-radius: 6px;
    background: var(--settlement-green-soft);
}

.profile-summary.unavailable {
    border-color: var(--el-color-danger-light-5);
    border-left-color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
}

.summary-title {
    gap: 10px;
    padding: 11px 14px;
    border-bottom: 1px solid rgba(22, 132, 91, 0.16);
}

.summary-title > div {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
}

.summary-title strong {
    font-size: 13px;
}

.summary-title small {
    margin-top: 2px;
    color: var(--settlement-muted);
    font-size: 12px;
    line-height: 1.4;
}

.summary-icon {
    display: inline-flex;
    color: var(--settlement-green);
    font-size: 17px;
}

.profile-facts {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    margin: 0;
}

.profile-facts > div {
    min-width: 0;
    padding: 11px 14px;
    border-right: 1px solid rgba(22, 132, 91, 0.13);
}

.profile-facts > div:last-child {
    border-right: 0;
}

.profile-facts dt,
.statement-meta dt,
.statement-facts dt {
    margin-bottom: 4px;
    color: var(--settlement-muted);
    font-size: 12px;
}

.profile-facts dd,
.statement-meta dd,
.statement-facts dd {
    margin: 0;
    overflow-wrap: anywhere;
    color: var(--settlement-ink);
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.currency-value {
    color: var(--settlement-blue);
    font-weight: 700;
}

.profile-warning {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0;
    padding: 9px 14px;
    border-top: 1px solid var(--el-color-danger-light-7);
    color: var(--el-color-danger);
    font-size: 12px;
}

.preview-error {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
    padding: 12px 14px;
    border: 1px solid var(--el-color-danger-light-5);
    border-left: 3px solid var(--el-color-danger);
    border-radius: 6px;
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
}

.preview-error > .el-icon {
    font-size: 18px;
}

.preview-error strong {
    font-size: 13px;
}

.preview-error p {
    margin: 2px 0 0;
    font-size: 12px;
    line-height: 1.55;
}

.rules-panel {
    display: grid;
    grid-template-columns: minmax(210px, 0.7fr) minmax(0, 2.3fr);
    gap: 22px;
    margin-top: 14px;
    padding: 13px 15px;
    border: 1px solid var(--settlement-rule);
    border-radius: 6px;
    background: #fafbfc;
}

.rules-heading {
    align-items: flex-start;
    gap: 9px;
}

.rules-heading > span {
    display: inline-flex;
    margin-top: 1px;
    color: var(--settlement-blue);
    font-size: 17px;
}

.rules-heading > div {
    display: flex;
    flex-direction: column;
}

.rules-heading strong {
    font-size: 13px;
}

.rules-heading small {
    margin-top: 3px;
    color: var(--settlement-muted);
    font-size: 12px;
    line-height: 1.45;
}

.rules-panel ul {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px 20px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.rules-panel li {
    display: grid;
    grid-template-columns: 15px minmax(0, 1fr);
    align-items: start;
    gap: 6px;
    color: #475467;
    font-size: 12px;
    line-height: 1.5;
}

.rules-panel li .el-icon {
    margin-top: 2px;
    color: var(--settlement-green);
    font-size: 14px;
}

.form-actions {
    justify-content: space-between;
    gap: 20px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--settlement-rule);
}

.form-actions > p {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    margin: 0;
    color: var(--settlement-muted);
    font-size: 12px;
    line-height: 1.5;
}

.form-actions > p .el-icon {
    flex: 0 0 auto;
    color: var(--settlement-blue);
}

.action-buttons {
    display: flex;
    flex: 0 0 auto;
    gap: 8px;
}

.form-actions :deep(.el-button) {
    min-height: 36px;
}

.statement-heading {
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 14px;
}

.statement-heading > div {
    min-width: 0;
}

.settlement-statement {
    overflow: hidden;
    border: 1px solid var(--settlement-rule);
    border-radius: 6px;
    background: #fff;
}

.statement-header {
    display: grid;
    grid-template-columns: minmax(300px, 1.15fr) minmax(480px, 1.85fr);
    align-items: center;
    gap: 28px;
    padding: 20px 22px;
    border-bottom: 2px solid var(--settlement-blue);
    background: #f8fafc;
}

.statement-title h3 {
    margin: 0;
    color: var(--settlement-ink);
    font-size: 19px;
    line-height: 1.4;
    letter-spacing: 0;
}

.statement-title p {
    max-width: 560px;
    margin: 5px 0 0;
    color: var(--settlement-muted);
    font-size: 12px;
    line-height: 1.55;
}

.statement-meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
}

.statement-meta > div {
    min-width: 0;
    padding-left: 14px;
    border-left: 1px solid var(--settlement-rule);
}

.statement-meta dt {
    margin: 0 0 4px;
}

.statement-meta dd {
    font-size: 12px;
}

.statement-facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-bottom: 1px solid var(--settlement-rule);
}

.statement-facts > section {
    min-width: 0;
    padding: 18px 22px;
    border-right: 1px solid var(--settlement-rule);
}

.statement-facts > section:last-child {
    border-right: 0;
}

.statement-facts h4,
.table-heading h4 {
    margin: 0 0 10px;
    color: var(--settlement-ink);
    font-size: 13px;
    line-height: 1.45;
    letter-spacing: 0;
}

.statement-facts dl {
    display: grid;
    gap: 9px;
    margin: 0;
}

.statement-facts dl > div {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr);
    gap: 10px;
}

.statement-facts dt {
    margin: 0;
}

.statement-facts dd {
    font-size: 12px;
    font-weight: 500;
}

.statement-facts .metric-value {
    color: var(--settlement-blue);
    font-size: 17px;
    font-weight: 700;
}

.statement-reason {
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr);
    gap: 12px;
    padding: 11px 22px;
    border-bottom: 1px solid var(--settlement-rule);
    background: #fcfcfd;
}

.statement-reason span {
    color: var(--settlement-muted);
    font-size: 12px;
}

.statement-reason p {
    margin: 0;
    color: #475467;
    font-size: 12px;
    line-height: 1.55;
}

.table-heading {
    justify-content: space-between;
    gap: 20px;
    padding: 16px 22px 10px;
}

.table-heading > div {
    min-width: 0;
}

.table-heading h4 {
    margin-bottom: 2px;
}

.table-heading p {
    margin: 0;
    color: var(--settlement-muted);
    font-size: 12px;
    line-height: 1.45;
}

.table-heading > strong {
    flex: 0 0 auto;
    color: var(--settlement-amber);
    font-size: 12px;
    white-space: nowrap;
}

.statement-table {
    width: calc(100% - 44px);
    margin: 0 22px;
}

.statement-table :deep(.el-table__header th) {
    background: #f5f7fa;
    color: #344054;
}

.statement-table :deep(.el-table__cell) {
    font-variant-numeric: tabular-nums;
}

.statement-footer {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 11px 22px 15px;
    color: var(--settlement-muted);
    font-size: 12px;
    line-height: 1.45;
}

.statement-footer strong {
    color: #475467;
    font-weight: 600;
}

.statement-actions {
    margin-bottom: 22px;
}

.action-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.action-copy strong {
    font-size: 13px;
}

.action-copy span {
    margin-top: 2px;
    color: var(--settlement-muted);
    font-size: 12px;
    line-height: 1.45;
}

.progress-workspace {
    margin-top: 20px;
    padding: 18px 20px 20px;
    border: 1px solid var(--settlement-rule);
    border-radius: 6px;
    background: #fff;
}

.progress-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
}

.progress-heading > div {
    min-width: 0;
}

.progress-value {
    flex: 0 0 auto;
    color: var(--settlement-blue);
    font-size: 22px;
    font-variant-numeric: tabular-nums;
}

.progress-facts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 16px 0;
    border: 1px solid var(--settlement-rule);
    border-radius: 5px;
    background: #fafbfc;
}

.progress-facts > div {
    min-width: 0;
    padding: 11px 13px;
    border-right: 1px solid var(--settlement-rule);
}

.progress-facts > div:last-child {
    border-right: 0;
}

.progress-facts span,
.progress-facts strong {
    display: block;
}

.progress-facts span {
    margin-bottom: 4px;
    color: var(--settlement-muted);
    font-size: 12px;
}

.progress-facts strong {
    overflow-wrap: anywhere;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
}

.progress-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}

@media (max-width: 1280px) {
    .merchant-field,
    .profile-field,
    .dimension-field {
        grid-column: span 6;
    }

    .profile-facts {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .profile-facts > div:nth-child(3) {
        border-right: 0;
    }

    .profile-facts > div:nth-child(-n+3) {
        border-bottom: 1px solid rgba(22, 132, 91, 0.13);
    }

    .statement-header {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .statement-meta > div:first-child {
        padding-left: 0;
        border-left: 0;
    }
}

@media (max-width: 900px) {
    .workflow-strip {
        grid-template-columns: repeat(3, 245px);
        padding-bottom: 5px;
    }

    .rules-panel {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .statement-facts {
        grid-template-columns: 1fr;
    }

    .statement-facts > section {
        border-right: 0;
        border-bottom: 1px solid var(--settlement-rule);
    }

    .statement-facts > section:last-child {
        border-bottom: 0;
    }

    .progress-facts {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .progress-facts > div:nth-child(2) {
        border-right: 0;
    }

    .progress-facts > div:nth-child(-n+2) {
        border-bottom: 1px solid var(--settlement-rule);
    }
}

@media (max-width: 680px) {
    .manual-settlement-page {
        padding-right: 12px;
        padding-left: 12px;
    }

    .page-header,
    .form-actions,
    .statement-heading {
        align-items: stretch;
        flex-direction: column;
    }

    .page-toolbar {
        justify-content: space-between;
        width: 100%;
        gap: 10px;
    }

    .current-stage {
        align-self: flex-start;
    }

    .workflow-strip {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        overflow: visible;
    }

    .workflow-step {
        align-items: center;
        flex-direction: column;
        min-width: 0;
        padding: 0 4px;
        text-align: center;
    }

    .workflow-step:not(:last-child)::after {
        top: 12px;
        right: -50%;
        left: 50%;
    }

    .step-marker {
        width: 24px;
        height: 24px;
        font-size: 12px;
    }

    .step-copy {
        margin: 5px 0 0;
        padding: 0 3px;
    }

    .step-copy strong {
        font-size: 12px;
    }

    .step-copy small {
        display: none;
    }

    .scope-form {
        padding-right: 14px;
        padding-left: 14px;
    }

    .merchant-field,
    .profile-field,
    .dimension-field {
        grid-column: 1 / -1;
    }

    .profile-facts,
    .statement-meta,
    .rules-panel ul,
    .progress-facts {
        grid-template-columns: 1fr;
    }

    .profile-facts > div,
    .profile-facts > div:nth-child(3) {
        border-right: 0;
        border-bottom: 1px solid rgba(22, 132, 91, 0.13);
    }

    .profile-facts > div:last-child {
        border-bottom: 0;
    }

    .preview-error {
        grid-template-columns: 22px minmax(0, 1fr);
    }

    .preview-error .el-button {
        grid-column: 1 / -1;
        width: 100%;
    }

    .action-buttons {
        display: grid;
        grid-template-columns: 1fr;
    }

    .action-buttons :deep(.el-button),
    .statement-actions :deep(.el-button) {
        width: 100%;
        margin-left: 0;
    }

    .statement-header,
    .statement-facts > section {
        padding: 16px;
    }

    .statement-meta > div,
    .statement-meta > div:first-child {
        padding: 8px 0 0;
        border-top: 1px solid var(--settlement-rule);
        border-left: 0;
    }

    .statement-reason {
        grid-template-columns: 1fr;
        padding: 11px 16px;
    }

    .table-heading {
        align-items: flex-start;
        flex-direction: column;
        padding: 15px 16px 9px;
    }

    .statement-table {
        width: calc(100% - 32px);
        margin: 0 16px;
    }

    .statement-footer {
        align-items: flex-start;
        flex-direction: column;
        padding: 11px 16px 14px;
    }

    .progress-facts > div,
    .progress-facts > div:nth-child(2) {
        border-right: 0;
        border-bottom: 1px solid var(--settlement-rule);
    }

    .progress-facts > div:last-child {
        border-bottom: 0;
    }
}
</style>

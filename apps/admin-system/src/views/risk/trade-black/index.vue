<template>
  <div class="app-container">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="86px">
      <el-form-item :label="t('risk.common.merchantId')">
        <el-select v-model="query.merchantId" filterable remote clearable reserve-keyword remote-show-suffix :remote-method="searchMerchantOptions" :loading="merchantLoading" :placeholder="t('risk.common.placeholderMerchant')" class="query-merchant-select" @visible-change="handleMerchantVisibleChange">
          <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('risk.trade.merchantOrderNo')"><el-input v-model.trim="query.merchantOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="t('risk.trade.paymentOrderNo')"><el-input v-model.trim="query.paymentOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="t('risk.trade.targetType')">
        <el-select v-model="query.blackTargetType" clearable filterable><el-option v-for="item in targetTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select>
      </el-form-item>
      <el-form-item :label="t('common.status')">
        <el-select v-model="query.status" clearable><el-option v-for="item in tradeStatusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select>
      </el-form-item>
      <el-form-item :label="t('risk.trade.operator')"><el-input v-model.trim="query.operator" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="t('risk.trade.operationTime')">
        <el-date-picker v-model="operationRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" />
      </el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button><el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openWorkflow" v-hasPermi="['risk:tradeBlack:system:add', 'risk:tradeBlack:system:release']">{{ t('risk.trade.workflow.open') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="primary" plain :icon="Upload" size="small" @click="openFileImport" v-hasPermi="'risk:tradeBlack:system:batchAdd'">{{ t('risk.trade.workflow.fileImportOpen') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" :loading="exporting" @click="handleExport" v-hasPermi="'risk:tradeBlack:system:export'">{{ t('common.export') }}</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
    </el-row>
    <StandardTable table-key="risk-trade-black" v-loading="loading" :data="rows" row-key="id" size="small">
      <el-table-column prop="merchant_id" :label="t('risk.common.merchantId')" width="130" align="center" />
      <el-table-column prop="merchant_order_no" :label="t('risk.trade.merchantOrderNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="payment_order_no" :label="t('risk.trade.paymentOrderNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="black_target_type" :label="t('risk.trade.targetType')" width="150" align="center"><template #default="{ row }">{{ targetTypeText(row.black_target_type) }}</template></el-table-column>
      <el-table-column prop="black_target_value_masked" :label="t('risk.trade.targetValue')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column prop="action_reason" :label="t('risk.trade.reason')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column prop="operator" :label="t('risk.trade.operator')" width="130" align="center" show-overflow-tooltip />
      <el-table-column :label="t('common.status')" width="96" align="center"><template #default="{ row }"><el-tag :type="Number(row.status) === 1 ? 'danger' : 'success'" size="small">{{ tradeStatusText(row.status) }}</el-tag></template></el-table-column>
      <el-table-column :label="t('risk.trade.operationTime')" width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.update_time" /></template></el-table-column>
    </StandardTable>
    <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>

    <el-drawer v-model="workflowOpen" :title="workflowDialogTitle" class="trade-black-workflow-drawer app-form-drawer" size="min(1040px, 94vw)" append-to-body destroy-on-close :close-on-click-modal="false" :close-on-press-escape="!previewLoading && !executeLoading" :show-close="!previewLoading && !executeLoading" @closed="resetWorkflow">
      <template #header>
        <div class="workflow-drawer-title"><span aria-hidden="true"><el-icon><Lock /></el-icon></span><strong>{{ workflowDialogTitle }}</strong></div>
      </template>
      <nav class="workflow-progress" :class="{ 'is-preview': workflowStage === 2 }" :aria-label="t('risk.trade.workflow.title')">
        <span class="workflow-progress__rail" aria-hidden="true"><i /></span>
        <div class="workflow-progress__step is-active" :class="{ 'is-complete': workflowStage === 2 }" :aria-current="workflowStage === 1 ? 'step' : undefined"><span>1</span><strong>{{ t('risk.trade.workflow.configure') }}</strong></div>
        <div class="workflow-progress__step" :class="{ 'is-active': workflowStage === 2 }" :aria-current="workflowStage === 2 ? 'step' : undefined"><span>2</span><strong>{{ t('risk.trade.workflow.preview') }}</strong></div>
      </nav>

      <template v-if="workflowStage === 1">
        <section v-if="workflow.inputMode === 'FILE' && selectedFile" class="import-file-context">
          <el-icon><Document /></el-icon>
          <span><strong>{{ t('risk.trade.workflow.fileSelected') }}</strong><small>{{ selectedFile.name }} · {{ t('risk.trade.workflow.fileSelectedHint') }}</small></span>
        </section>
        <WorkflowSection number="01" :title="t('risk.trade.workflow.scopeTitle')" :description="t('risk.trade.workflow.scopeDescription')">
          <el-radio-group v-model="workflow.scopeType" class="scope-choice-grid"><el-radio-button value="GLOBAL"><span class="choice-label"><el-icon><Collection /></el-icon><strong>{{ t('risk.trade.workflow.globalScope') }}</strong></span></el-radio-button><el-radio-button value="MERCHANT"><span class="choice-label"><el-icon><Shop /></el-icon><strong>{{ t('risk.trade.workflow.merchantScope') }}</strong></span></el-radio-button></el-radio-group>
          <el-alert v-if="workflow.scopeType === 'GLOBAL'" type="warning" :closable="false" show-icon :title="t('risk.trade.workflow.globalWarning')" />
          <FieldBlock v-else :label="t('risk.trade.workflow.targetMerchants')" required :hint="t('risk.trade.workflow.targetMerchantsHint')">
            <el-select v-model="workflow.merchantIds" multiple filterable remote reserve-keyword collapse-tags collapse-tags-tooltip :remote-method="searchMerchantOptions" :loading="merchantLoading" :placeholder="t('risk.trade.workflow.targetMerchantsPlaceholder')" @visible-change="handleMerchantVisibleChange">
              <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
            </el-select>
          </FieldBlock>
        </WorkflowSection>

        <WorkflowSection v-if="workflow.inputMode !== 'FILE'" number="02" :title="t('risk.trade.workflow.ordersTitle')" :description="t('risk.trade.workflow.ordersDescription')">
          <el-radio-group v-model="workflow.inputMode" class="entry-mode-tabs"><el-radio-button value="SINGLE"><span class="choice-label"><el-icon><EditPen /></el-icon>{{ t('risk.trade.workflow.singleMode') }}</span></el-radio-button><el-radio-button value="PASTE"><span class="choice-label"><el-icon><Tickets /></el-icon>{{ t('risk.trade.workflow.pasteMode') }}</span></el-radio-button></el-radio-group>
          <div class="order-grid">
            <FieldBlock :label="t('risk.trade.workflow.identifierType')" required><el-select v-model="workflow.identifierType" @change="handleIdentifierTypeChange"><el-option :label="t('risk.trade.workflow.systemOrderNo')" value="SYSTEM_ORDER_NO" /><el-option :label="t('risk.trade.workflow.merchantOrderNoType')" value="MERCHANT_ORDER_NO" /></el-select></FieldBlock>
            <FieldBlock v-if="showLookupMerchantField" :label="t('risk.trade.workflow.lookupMerchant')" required :hint="t('risk.trade.workflow.lookupMerchantHint')">
              <el-select v-model="workflow.lookupMerchantId" filterable remote clearable reserve-keyword :remote-method="searchMerchantOptions" :loading="merchantLoading" :placeholder="t('risk.trade.workflow.lookupMerchantPlaceholder')" @visible-change="handleMerchantVisibleChange"><el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" /></el-select>
              <el-button v-if="canReuseTargetMerchant" class="lookup-merchant-switch" type="primary" link @click="useTargetMerchantForLookup">{{ t('risk.trade.workflow.useTargetMerchant') }}</el-button>
            </FieldBlock>
            <div v-else-if="workflow.identifierType === 'MERCHANT_ORDER_NO'" class="lookup-merchant-auto">
              <el-icon><Shop /></el-icon>
              <span><strong>{{ t('risk.trade.workflow.autoLookupMerchant') }}</strong><small>{{ t('risk.trade.workflow.autoLookupMerchantHint', { merchant: autoLookupMerchantLabel }) }}</small></span>
              <el-button type="primary" link @click="useDifferentLookupMerchant">{{ t('risk.trade.workflow.changeLookupMerchant') }}</el-button>
            </div>
          </div>
          <FieldBlock v-if="workflow.inputMode === 'SINGLE'" class="order-input" :label="orderInputLabel" required><el-input v-model.trim="workflow.singleOrderNo" clearable :placeholder="t('risk.trade.workflow.singlePlaceholder')" /></FieldBlock>
          <FieldBlock v-else class="order-input" :label="orderInputLabel" required :suffix="t('risk.trade.workflow.pasteCount', { count: parsedPasteOrders.length })"><el-input v-model="workflow.pasteOrderNos" type="textarea" :rows="6" resize="vertical" :placeholder="t('risk.trade.workflow.pastePlaceholder')" /></FieldBlock>
        </WorkflowSection>

        <WorkflowSection :number="workflow.inputMode === 'FILE' ? '02' : '03'" :title="t('risk.trade.workflow.actionTitle')" :description="t('risk.trade.workflow.actionDescription')">
          <el-radio-group v-model="workflow.actionType" class="action-choice-grid"><el-radio-button v-if="canAddAction" value="ADD"><span class="choice-label"><el-icon><CirclePlus /></el-icon><strong>{{ t('risk.trade.workflow.addBlacklist') }}</strong></span></el-radio-button><el-radio-button v-if="canReleaseAction" value="RELEASE"><span class="choice-label"><el-icon><Remove /></el-icon><strong>{{ t('risk.trade.workflow.releaseBlacklist') }}</strong></span></el-radio-button></el-radio-group>
        </WorkflowSection>

        <WorkflowSection :number="workflow.inputMode === 'FILE' ? '03' : '04'" :title="t('risk.trade.workflow.functionsTitle')" :description="t('risk.trade.workflow.functionsDescription')">
          <template #action><el-checkbox :model-value="allFunctionsSelected" :indeterminate="someFunctionsSelected" @change="toggleAllFunctions">{{ t('risk.trade.workflow.selectAll') }}</el-checkbox></template>
          <div v-for="group in functionGroups" :key="group.key" class="function-group"><h4><el-icon><component :is="group.icon" /></el-icon><span>{{ t(`risk.trade.workflow.group.${group.key}`) }}</span></h4><el-checkbox-group v-model="workflow.functionCodes" class="function-grid"><el-checkbox v-for="item in group.items" :key="item" :value="item" border class="function-card"><span class="function-card__content"><el-icon><component :is="functionIcon(item)" /></el-icon><span><strong>{{ t(`risk.trade.workflow.function.${item}`) }}</strong><small>{{ t(`risk.trade.workflow.functionHint.${item}`) }}</small></span></span></el-checkbox></el-checkbox-group></div>
        </WorkflowSection>

        <WorkflowSection :number="workflow.inputMode === 'FILE' ? '04' : '05'" :title="t('risk.trade.workflow.reasonLabel')" :description="t('risk.trade.workflow.reasonDescription')">
          <el-input v-model="workflow.actionReason" type="textarea" :rows="3" maxlength="500" show-word-limit :placeholder="t('risk.trade.workflow.reasonPlaceholder')" />
          <el-alert class="server-notice" type="info" :closable="false" show-icon :title="t('risk.trade.workflow.serverComputedNotice')" />
        </WorkflowSection>
      </template>

      <template v-else>
        <section class="preview-summary"><div><span>{{ t('risk.trade.workflow.orderCount') }}</span><strong>{{ preview?.orderCount || 0 }}</strong></div><div><span>{{ t('risk.trade.workflow.resolvedCount') }}</span><strong>{{ preview?.resolvedOrderCount || 0 }}</strong></div><div class="is-ready"><span>{{ t('risk.trade.workflow.selectableCount') }}</span><strong>{{ preview?.selectableCount || 0 }}</strong></div><div><span>{{ t('risk.trade.workflow.unavailableCount') }}</span><strong>{{ preview?.unavailableCount || 0 }}</strong></div></section>
        <section class="preview-context"><el-tag>{{ workflow.actionType === 'ADD' ? t('risk.trade.workflow.addBlacklist') : t('risk.trade.workflow.releaseBlacklist') }}</el-tag><el-tag type="warning" effect="plain">{{ previewScopeText }}</el-tag><span>{{ t('risk.trade.workflow.serverComputedNotice') }}</span></section>
        <WorkflowSection number="01" :title="t('risk.trade.workflow.candidateTitle')" :description="t('risk.trade.workflow.candidateDescription')">
          <template #action><el-checkbox :model-value="allReadySelected" :indeterminate="someReadySelected" @change="toggleAllCandidates">{{ t('risk.trade.workflow.selectReady') }}</el-checkbox></template>
          <div class="candidate-toolbar">
            <el-radio-group v-model="candidateFilter" size="small" @change="handleCandidateFilterChange">
              <el-radio-button value="READY">{{ t('risk.trade.workflow.filterReady', { count: candidateCounts.ready }) }}</el-radio-button>
              <el-radio-button value="IDEMPOTENT">{{ t('risk.trade.workflow.filterIdempotent', { count: candidateCounts.idempotent }) }}</el-radio-button>
              <el-radio-button value="NOT_AVAILABLE">{{ t('risk.trade.workflow.filterUnavailable', { count: candidateCounts.unavailable }) }}</el-radio-button>
              <el-radio-button value="ALL">{{ t('risk.trade.workflow.filterAll', { count: candidateCounts.all }) }}</el-radio-button>
            </el-radio-group>
            <span>{{ t('risk.trade.workflow.selectedSummary', { selected: selectedCandidateKeys.length, total: readyCandidates.length }) }}</span>
          </div>

          <el-empty v-if="filteredOrderGroups.length === 0" :image-size="72" :description="candidateEmptyText" />
          <div v-else class="candidate-orders">
            <article v-for="group in pagedOrderGroups" :key="group.key" class="candidate-order-card">
              <header class="candidate-order-header">
                <el-checkbox :model-value="groupAllReadySelected(group)" :indeterminate="groupSomeReadySelected(group)" :disabled="group.readyCount === 0" @change="toggleGroupCandidates(group, $event)" />
                <div>
                  <strong>{{ group.inputOrderNo || group.transactionId || `#${group.rowNo}` }}</strong>
                  <small>{{ t('risk.trade.workflow.orderCandidateMeta', { row: group.rowNo || '-', count: group.candidates.length }) }}<template v-if="group.transactionId"> · {{ t('risk.trade.workflow.resolvedTransaction') }} {{ group.transactionId }}</template></small>
                </div>
                <span class="candidate-order-tags"><el-tag v-if="group.readyCount" type="success" effect="plain" size="small">{{ t('risk.trade.workflow.readyCountTag', { count: group.readyCount }) }}</el-tag><el-tag v-if="group.unavailableCount" type="info" effect="plain" size="small">{{ t('risk.trade.workflow.unavailableCountTag', { count: group.unavailableCount }) }}</el-tag></span>
              </header>
              <div class="candidate-grid">
                <article v-for="candidate in group.candidates" :key="candidate.candidateKey" class="candidate-item" :class="{ 'is-selectable': candidate.selectable, 'is-selected': candidate.selected }">
                  <el-checkbox v-model="candidate.selected" :disabled="!candidate.selectable" @change="syncSelectedKeys" />
                  <div class="candidate-item__body">
                    <div class="candidate-item__title"><strong>{{ functionText(candidate.functionCode) }}</strong><el-tag :type="candidateStateType(candidate.state)" size="small" effect="plain">{{ candidateStateText(candidate.state) }}</el-tag></div>
                    <span class="candidate-item__value" :title="candidate.maskedValue || '-'">{{ candidate.maskedValue || '-' }}</span>
                    <dl><div><dt>{{ t('risk.trade.workflow.source') }}</dt><dd>{{ candidate.sourceLabel || '-' }}</dd></div><div><dt>{{ t('risk.trade.workflow.targetScope') }}</dt><dd>{{ candidateScopeText(candidate) }}</dd></div><div class="candidate-item__message"><dt>{{ t('risk.trade.workflow.message') }}</dt><dd>{{ candidate.stateMessage || '-' }}</dd></div></dl>
                  </div>
                </article>
              </div>
            </article>
            <el-pagination v-if="filteredOrderGroups.length > previewPageSize" v-model:current-page="previewPage" v-model:page-size="previewPageSize" :total="filteredOrderGroups.length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next" small background class="candidate-pagination" />
          </div>
        </WorkflowSection>
        <el-alert v-if="preview?.orderErrors?.length" type="warning" :closable="false" show-icon :title="t('risk.trade.workflow.orderErrors', { count: preview.orderErrors.length })"><template #default><ul class="error-list"><li v-for="item in preview.orderErrors.slice(0, 5)" :key="`${item.rowNo}-${item.orderNo}`">{{ item.orderNo || `#${item.rowNo}` }}：{{ item.message }}</li></ul></template></el-alert>
      </template>

      <template #footer><div class="dialog-footer"><template v-if="workflowStage === 1"><el-button :disabled="previewLoading" @click="workflowOpen = false">{{ t('common.cancel') }}</el-button><el-button type="primary" :loading="previewLoading" @click="generatePreview">{{ t('risk.trade.workflow.generatePreview') }}</el-button></template><template v-else><el-button :disabled="executeLoading" @click="backToConfigure">{{ t('common.back') }}</el-button><el-button :disabled="executeLoading" @click="workflowOpen = false">{{ t('common.cancel') }}</el-button><el-button type="primary" :disabled="selectedCandidateKeys.length === 0" @click="confirmOpen = true">{{ t('risk.trade.workflow.executeSelected', { count: selectedCandidateKeys.length }) }}</el-button></template></div></template>
    </el-drawer>

    <BaseImportDialog v-model="fileDialogOpen" :subject="t('risk.trade.workflow.fileSubject')" :loading="false" template-permission="risk:tradeBlack:system:batchAdd" :confirm-text="t('risk.trade.workflow.continueConfigure')" :result="fileDialogResult" @submit="handleFileSelection" @download-template="downloadTemplate" @reset-result="fileDialogResult = null" />
    <BaseFeedbackDialog v-model="confirmOpen" :title="t('risk.trade.workflow.confirmTitle')" :message="t('risk.trade.workflow.confirmMessage', { count: selectedCandidateKeys.length })" :description="confirmDescription" :tone="workflow.actionType === 'RELEASE' ? 'warning' : 'question'" :confirm-text="t('risk.trade.workflow.confirmExecute')" :loading="executeLoading" content-align="start" @confirm="executeSelected" />
    <BaseFeedbackDialog v-model="resultOpen" :title="t('risk.trade.workflow.resultTitle')" :message="resultMessage" :description="executeResult ? `${t('risk.trade.workflow.batchNo')}：${executeResult.batchNo}` : ''" :tone="resultTone" :show-cancel="false" :confirm-text="t('common.confirm')" content-align="start" width="560px" @confirm="closeResult">
      <div v-if="executeResult" class="result-summary"><div><span>{{ t('feedback.totalCount') }}</span><strong>{{ executeResult.totalCount }}</strong></div><div class="is-success"><span>{{ t('feedback.successCount') }}</span><strong>{{ executeResult.successCount }}</strong></div><div class="is-skipped"><span>{{ t('risk.trade.workflow.skippedCount') }}</span><strong>{{ executeResult.skippedCount }}</strong></div><div class="is-failure"><span>{{ t('feedback.failureCount') }}</span><strong>{{ executeResult.failureCount }}</strong></div></div>
      <el-button v-if="executeResult?.failures?.length" class="failure-download" link type="primary" :icon="Download" @click="downloadExecutionFailures">{{ t('feedback.downloadFailureDetails') }}</el-button>
    </BaseFeedbackDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CirclePlus, Collection, Connection, Cpu, CreditCard, Document, Download, EditPen, Grid, Key, Location, LocationInformation, Lock, MapLocation, Message, Monitor, OfficeBuilding, Phone, Plus, Postcard, Refresh, Remove, Search, Shop, Tickets, Upload, User } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseFeedbackDialog from '@/components/BaseFeedbackDialog.vue';
import BaseImportDialog from '@/components/BaseImportDialog.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import { downloadTradeBlackFailureReport, downloadTradeBlackTemplate, executeTradeBlack, executeTradeBlackFile, pageTradeBlack, previewTradeBlack, previewTradeBlackFile, submitTradeBlackExportTask, type TradeBlackCandidate, type TradeBlackExecuteResponse, type TradeBlackIdentifierType, type TradeBlackInputMode, type TradeBlackOrderReference, type TradeBlackPreviewRequest, type TradeBlackPreviewResponse, type TradeBlackQuery, type TradeBlackRecord } from '@/api/risk';

const WorkflowSection = defineComponent({
  props: { number: { type: String, required: true }, title: { type: String, required: true }, description: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => h('section', { class: 'workflow-section' }, [
      h('div', { class: 'section-heading' }, [
        h('span', { class: 'section-index' }, props.number),
        h('div', { class: 'section-copy' }, [h('h3', props.title), props.description ? h('p', props.description) : null]),
        slots.action ? h('div', { class: 'section-action' }, slots.action()) : null,
      ]),
      h('div', { class: 'section-content' }, slots.default?.()),
    ]);
  },
});
const FieldBlock = defineComponent({
  props: { label: { type: String, required: true }, required: Boolean, hint: { type: String, default: '' }, suffix: { type: String, default: '' } },
  setup(props, { slots }) { return () => h('div', { class: 'field-block' }, [h('label', [props.label, props.required ? h('b', '*') : null, props.suffix ? h('em', props.suffix) : null]), slots.default?.(), props.hint ? h('p', props.hint) : null]); },
});

type FileDialogResult = { type: 'error'; message: string } | null;
type CandidateFilter = 'READY' | 'IDEMPOTENT' | 'NOT_AVAILABLE' | 'ALL';
type CandidateOrderGroup = {
  key: string;
  rowNo?: number;
  inputOrderNo?: string;
  transactionId?: string;
  candidates: TradeBlackCandidate[];
  readyCount: number;
  unavailableCount: number;
};
const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const showSearch = ref(true), loading = ref(false), exporting = ref(false), rows = ref<TradeBlackRecord[]>([]), total = ref(0), page = ref(1), pageSize = ref(10);
const merchantLoading = ref(false), merchantOptions = ref<MerchantInfo[]>([]), query = reactive<TradeBlackQuery>({});
const operationRange = ref<[string, string] | []>([]);
const workflowOpen = ref(false), workflowStage = ref<1 | 2>(1), previewLoading = ref(false), executeLoading = ref(false);
const differentLookupMerchant = ref(false);
const fileDialogOpen = ref(false), fileDialogResult = ref<FileDialogResult>(null), selectedFile = ref<File | null>(null);
const preview = ref<TradeBlackPreviewResponse | null>(null), selectedCandidateKeys = ref<string[]>([]), confirmOpen = ref(false), resultOpen = ref(false), executeResult = ref<TradeBlackExecuteResponse | null>(null);
const executionRequestId = ref('');
const exportRequestId = ref('');
const candidateFilter = ref<CandidateFilter>('READY'), previewPage = ref(1), previewPageSize = ref(5);
const workflow = reactive({ inputMode: 'SINGLE' as TradeBlackInputMode, scopeType: 'GLOBAL' as 'GLOBAL' | 'MERCHANT', merchantIds: [] as string[], actionType: 'ADD' as 'ADD' | 'RELEASE', identifierType: 'SYSTEM_ORDER_NO' as TradeBlackIdentifierType, lookupMerchantId: '', singleOrderNo: '', pasteOrderNos: '', functionCodes: ['cardNo'] as string[], actionReason: '' });
const functionGroups = [
  { key: 'payment', icon: CreditCard, items: ['cardNo', 'cardFingerprint', 'cardBin', 'cardholderName', 'issuerCountry', 'deviceFingerprint'] },
  { key: 'contact', icon: Connection, items: ['phone', 'email', 'emailUsername', 'emailDomain', 'ip'] },
  { key: 'address', icon: MapLocation, items: ['billingAddress', 'billingZip', 'billingCountry', 'shippingAddress', 'shippingZip', 'shippingCountry', 'region'] },
] as const;
const functionIconMap: Record<string, typeof CreditCard> = {
  cardNo: CreditCard, cardFingerprint: Key, cardBin: Grid, cardholderName: User,
  issuerCountry: MapLocation, deviceFingerprint: Cpu, phone: Phone, email: Message,
  emailUsername: User, emailDomain: OfficeBuilding, ip: Monitor, billingAddress: Location,
  billingZip: Postcard, billingCountry: MapLocation, shippingAddress: Location,
  shippingZip: Postcard, shippingCountry: MapLocation, region: LocationInformation,
};
const allFunctionCodes = functionGroups.flatMap((group) => [...group.items]);
const workflowDialogTitle = computed(() => workflow.inputMode === 'FILE' ? t('risk.trade.workflow.fileConfigureTitle') : t('risk.trade.workflow.title'));
const canAddAction = computed(() => workflow.inputMode === 'FILE' ? userStore.hasPermission('risk:tradeBlack:system:batchAdd') : userStore.hasPermission('risk:tradeBlack:system:add'));
const canReleaseAction = computed(() => userStore.hasPermission('risk:tradeBlack:system:release'));
const tradeStatusOptions = computed(() => [{ label: t('risk.trade.status.blackened'), value: 1 }, { label: t('risk.trade.status.released'), value: 0 }]);
const targetTypeOptions = computed(() => allFunctionCodes.map((value) => ({ value, label: functionText(value) })));
const parsedPasteOrders = computed(() => uniqueOrders(workflow.pasteOrderNos.split(/[\n,，;；]+/)));
const orderInputLabel = computed(() => workflow.identifierType === 'MERCHANT_ORDER_NO' ? t('risk.trade.workflow.merchantOrderNoType') : t('risk.trade.workflow.systemOrderNo'));
const targetLookupMerchantId = computed(() => workflow.scopeType === 'MERCHANT' && workflow.merchantIds.length === 1 ? workflow.merchantIds[0] || '' : '');
const canReuseTargetMerchant = computed(() => workflow.identifierType === 'MERCHANT_ORDER_NO' && Boolean(targetLookupMerchantId.value));
const showLookupMerchantField = computed(() => workflow.identifierType === 'MERCHANT_ORDER_NO' && (!canReuseTargetMerchant.value || differentLookupMerchant.value));
const autoLookupMerchantLabel = computed(() => {
  const merchantId = targetLookupMerchantId.value;
  const merchant = merchantOptions.value.find((item) => item.merchantId === merchantId);
  return merchant ? merchantOptionLabel(merchant) : merchantId;
});
const allFunctionsSelected = computed(() => workflow.functionCodes.length === allFunctionCodes.length), someFunctionsSelected = computed(() => workflow.functionCodes.length > 0 && !allFunctionsSelected.value);
const readyCandidates = computed(() => (preview.value?.candidates || []).filter((item) => item.selectable));
const allReadySelected = computed(() => readyCandidates.value.length > 0 && readyCandidates.value.every((item) => item.selected)), someReadySelected = computed(() => readyCandidates.value.some((item) => item.selected) && !allReadySelected.value);
const candidateCounts = computed(() => {
  const candidates = preview.value?.candidates || [];
  return {
    ready: candidates.filter((item) => item.state === 'READY').length,
    idempotent: candidates.filter((item) => item.state === 'ALREADY_EXISTS' || item.state === 'ALREADY_MISSING').length,
    unavailable: candidates.filter((item) => item.state === 'NOT_AVAILABLE').length,
    all: candidates.length,
  };
});
const filteredCandidates = computed(() => (preview.value?.candidates || []).filter((item) => {
  if (candidateFilter.value === 'ALL') return true;
  if (candidateFilter.value === 'IDEMPOTENT') return item.state === 'ALREADY_EXISTS' || item.state === 'ALREADY_MISSING';
  return item.state === candidateFilter.value;
}));
const filteredOrderGroups = computed<CandidateOrderGroup[]>(() => {
  const groups = new Map<string, CandidateOrderGroup>();
  filteredCandidates.value.forEach((candidate) => {
    const key = `${candidate.rowNo || 0}|${candidate.inputOrderNo || candidate.transactionId || ''}`;
    const group = groups.get(key) || { key, rowNo: candidate.rowNo, inputOrderNo: candidate.inputOrderNo, transactionId: candidate.transactionId, candidates: [], readyCount: 0, unavailableCount: 0 };
    group.candidates.push(candidate);
    if (candidate.state === 'READY') group.readyCount += 1;
    if (candidate.state === 'NOT_AVAILABLE') group.unavailableCount += 1;
    groups.set(key, group);
  });
  return [...groups.values()];
});
const pagedOrderGroups = computed(() => filteredOrderGroups.value.slice((previewPage.value - 1) * previewPageSize.value, previewPage.value * previewPageSize.value));
const candidateEmptyText = computed(() => t(`risk.trade.workflow.candidateEmpty.${candidateFilter.value}`));
const previewScopeText = computed(() => workflow.scopeType === 'GLOBAL' ? t('risk.trade.workflow.previewGlobalScope') : t('risk.trade.workflow.previewMerchantScope', { count: workflow.merchantIds.length }));
const confirmDescription = computed(() => workflow.scopeType === 'GLOBAL' ? t('risk.trade.workflow.confirmGlobalDescription') : t('risk.trade.workflow.confirmMerchantDescription', { count: workflow.merchantIds.length }));
const resultTone = computed<'success' | 'warning' | 'error'>(() => !executeResult.value || executeResult.value.status === 'FAILED' ? 'error' : executeResult.value.status === 'SUCCESS' ? 'success' : 'warning');
const resultMessage = computed(() => executeResult.value ? t(`risk.trade.workflow.resultMessage.${executeResult.value.status}`, { success: executeResult.value.successCount, skipped: executeResult.value.skippedCount, failure: executeResult.value.failureCount }) : '');

onMounted(loadData);
function requestQuery(): TradeBlackQuery {
  const [operationStartTime, operationEndTime] = operationRange.value;
  return {
    ...query,
    operationStartTime: operationStartTime || undefined,
    operationEndTimeExclusive: operationEndTime ? addOneSecond(operationEndTime) : undefined,
    pageNo: page.value,
    pageSize: pageSize.value,
  };
}
async function loadData() { loading.value = true; try { const result = await pageTradeBlack(requestQuery()); rows.value = result.records || []; total.value = result.total || 0; } catch (error: unknown) { ElMessage.error(errorMessage(error, t('common.loadFailed'))); } finally { loading.value = false; } }
function handleSearch() { page.value = 1; loadData(); }
function handleReset() { Object.assign(query, { merchantId: undefined, merchantOrderNo: undefined, paymentOrderNo: undefined, blackTargetType: undefined, status: undefined, operator: undefined }); operationRange.value = []; exportRequestId.value = ''; handleSearch(); }
function defaultManualAction() { return userStore.hasPermission('risk:tradeBlack:system:add') ? 'ADD' : 'RELEASE'; }
function openWorkflow() { resetWorkflow(); workflow.actionType = defaultManualAction(); executeResult.value = null; workflowOpen.value = true; }
function openFileImport() { resetWorkflow(); workflow.inputMode = 'FILE'; workflow.actionType = 'ADD'; executeResult.value = null; fileDialogOpen.value = true; }
function resetWorkflow() { workflowStage.value = 1; preview.value = null; selectedCandidateKeys.value = []; selectedFile.value = null; fileDialogResult.value = null; differentLookupMerchant.value = false; executionRequestId.value = ''; resetPreviewView(); Object.assign(workflow, { inputMode: 'SINGLE', scopeType: 'GLOBAL', merchantIds: [], actionType: 'ADD', identifierType: 'SYSTEM_ORDER_NO', lookupMerchantId: '', singleOrderNo: '', pasteOrderNos: '', functionCodes: ['cardNo'], actionReason: '' }); }
function backToConfigure() { workflowStage.value = 1; preview.value = null; selectedCandidateKeys.value = []; executionRequestId.value = ''; resetPreviewView(); }
function resetPreviewView() { candidateFilter.value = 'READY'; previewPage.value = 1; previewPageSize.value = 5; }
function toggleAllFunctions(value: boolean | string | number) { workflow.functionCodes = value ? [...allFunctionCodes] : []; }
function uniqueOrders(values: string[]) { return [...new Set(values.map((value) => value.trim()).filter(Boolean))]; }
function handleIdentifierTypeChange() { if (workflow.identifierType === 'SYSTEM_ORDER_NO') { workflow.lookupMerchantId = ''; differentLookupMerchant.value = false; } }
function useDifferentLookupMerchant() { workflow.lookupMerchantId = ''; differentLookupMerchant.value = true; }
function useTargetMerchantForLookup() { workflow.lookupMerchantId = ''; differentLookupMerchant.value = false; }
function resolvedLookupMerchantId() {
  if (workflow.identifierType !== 'MERCHANT_ORDER_NO') return undefined;
  if (canReuseTargetMerchant.value && !differentLookupMerchant.value) return targetLookupMerchantId.value;
  return workflow.lookupMerchantId.trim() || undefined;
}

function buildOrders(): TradeBlackOrderReference[] | null {
  if (workflow.inputMode === 'FILE') return [];
  const values = workflow.inputMode === 'SINGLE' ? uniqueOrders([workflow.singleOrderNo]) : parsedPasteOrders.value;
  if (!values.length) { ElMessage.warning(t('risk.trade.workflow.orderRequired')); return null; }
  if (values.length > 500) { ElMessage.warning(t('risk.trade.workflow.tooManyPasteOrders')); return null; }
  const lookupMerchantId = resolvedLookupMerchantId();
  if (workflow.identifierType === 'MERCHANT_ORDER_NO' && !lookupMerchantId) { ElMessage.warning(t('risk.trade.workflow.lookupMerchantRequired')); return null; }
  return values.map((orderNo, index) => ({ rowNo: index + 1, identifierType: workflow.identifierType, lookupMerchantId, orderNo }));
}
function buildRequest(): TradeBlackPreviewRequest | null {
  if (workflow.scopeType === 'MERCHANT' && !workflow.merchantIds.length) { ElMessage.warning(t('risk.trade.workflow.targetMerchantRequired')); return null; }
  if (!workflow.functionCodes.length) { ElMessage.warning(t('risk.trade.workflow.functionRequired')); return null; }
  const orders = buildOrders(); if (!orders) return null;
  return { inputMode: workflow.inputMode, scopeType: workflow.scopeType, merchantIds: workflow.scopeType === 'MERCHANT' ? [...workflow.merchantIds] : [], actionType: workflow.actionType, functionCodes: [...workflow.functionCodes], actionReason: workflow.actionReason.trim() || undefined, orders };
}
function applyPreview(result: TradeBlackPreviewResponse) { result.candidates.forEach((item) => { item.selected = item.selectable; }); preview.value = result; executionRequestId.value = createRequestId('trade-black-execute'); candidateFilter.value = result.selectableCount > 0 ? 'READY' : result.unavailableCount > 0 ? 'NOT_AVAILABLE' : 'ALL'; previewPage.value = 1; syncSelectedKeys(); workflowStage.value = 2; }
async function generatePreview() { if (previewLoading.value) return; const request = buildRequest(); if (!request) return; if (workflow.inputMode === 'FILE') { if (!selectedFile.value) { ElMessage.warning(t('risk.trade.workflow.fileRequired')); return; } await previewFile(selectedFile.value, request); return; } previewLoading.value = true; try { applyPreview(await previewTradeBlack(request)); } catch (error: unknown) { ElMessage.error(workflowErrorMessage(error, t('risk.trade.workflow.previewFailed'))); } finally { previewLoading.value = false; } }
function handleFileSelection(file: File) { if (file.size > 5 * 1024 * 1024) { fileDialogResult.value = { type: 'error', message: t('risk.trade.workflow.fileTooLarge') }; return; } selectedFile.value = file; fileDialogResult.value = null; fileDialogOpen.value = false; workflowOpen.value = true; }
async function previewFile(file: File, request: TradeBlackPreviewRequest) { if (previewLoading.value) return; previewLoading.value = true; try { const { orders: _orders, ...metadata } = request; applyPreview(await previewTradeBlackFile(metadata, file)); } catch (error: unknown) { ElMessage.error(workflowErrorMessage(error, t('risk.trade.workflow.previewFailed'))); } finally { previewLoading.value = false; } }
function toggleAllCandidates(value: boolean | string | number) { readyCandidates.value.forEach((item) => { item.selected = Boolean(value); }); syncSelectedKeys(); }
function syncSelectedKeys() { selectedCandidateKeys.value = (preview.value?.candidates || []).filter((item) => item.selectable && item.selected).map((item) => item.candidateKey); }
function handleCandidateFilterChange() { previewPage.value = 1; }
function groupReadyCandidates(group: CandidateOrderGroup) { return group.candidates.filter((item) => item.selectable); }
function groupAllReadySelected(group: CandidateOrderGroup) { const candidates = groupReadyCandidates(group); return candidates.length > 0 && candidates.every((item) => item.selected); }
function groupSomeReadySelected(group: CandidateOrderGroup) { const candidates = groupReadyCandidates(group); return candidates.some((item) => item.selected) && !candidates.every((item) => item.selected); }
function toggleGroupCandidates(group: CandidateOrderGroup, value: boolean | string | number) { groupReadyCandidates(group).forEach((item) => { item.selected = Boolean(value); }); syncSelectedKeys(); }
async function executeSelected() { if (executeLoading.value) return; const request = buildRequest(); if (!request || selectedCandidateKeys.value.length === 0) return; executeLoading.value = true; try { const requestId = executionRequestId.value || createRequestId('trade-black-execute'); executionRequestId.value = requestId; if (workflow.inputMode === 'FILE') { if (!selectedFile.value) throw new Error(t('risk.trade.workflow.fileRequired')); const { orders: _orders, ...metadata } = request; executeResult.value = await executeTradeBlackFile(requestId, metadata, selectedCandidateKeys.value, selectedFile.value); } else executeResult.value = await executeTradeBlack({ requestId, workflow: request, selectedCandidateKeys: selectedCandidateKeys.value }); confirmOpen.value = false; workflowOpen.value = false; resultOpen.value = true; executionRequestId.value = ''; await loadData(); } catch (error: unknown) { ElMessage.error(workflowErrorMessage(error, t('common.operationFailed'))); } finally { executeLoading.value = false; } }
function workflowErrorMessage(error: unknown, fallback: string) { const detail = apiError(error); return detail.resultCode === 'F403' && detail.message === 'service-payment call forbidden' ? t('risk.trade.workflow.internalServiceForbidden') : detail.message || fallback; }
function closeResult() { resultOpen.value = false; executeResult.value = null; }
function downloadTemplate() { downloadTradeBlackTemplate(t('risk.trade.workflow.templateFileName')).catch((error: unknown) => ElMessage.error(errorMessage(error, t('common.operationFailed')))); }
function downloadExecutionFailures() { const batchNo = executeResult.value?.batchNo; if (!batchNo || !executeResult.value?.failureCount) return; downloadTradeBlackFailureReport(batchNo, t('risk.trade.workflow.failureFileName', { batchNo })).catch((error: unknown) => ElMessage.error(errorMessage(error, t('common.operationFailed')))); }
async function handleExport() { if (exporting.value) return; exporting.value = true; try { const requestId = exportRequestId.value || createRequestId('trade-black-export'); exportRequestId.value = requestId; const task = await submitTradeBlackExportTask({ requestId, query: requestQuery() }); exportRequestId.value = ''; await ElMessageBox.confirm(t('operations.exportTask.submitted', { taskNo: task.taskNo }), t('operations.exportTask.submittedTitle'), { confirmButtonText: t('operations.exportTask.openDownloadCenter'), cancelButtonText: t('common.close'), type: 'success' }).then(() => router.push('/operations/export-tasks')).catch(() => undefined); } catch (error: unknown) { ElMessage.error(errorMessage(error, t('common.exportFailed'))); } finally { exporting.value = false; } }
async function searchMerchantOptions(keyword: string) { await loadMerchantOptions(keyword.trim()); }
async function loadMerchantOptions(keyword = '') { merchantLoading.value = true; try { const result = await searchMerchants({ pageNo: 1, pageSize: 30, keyword: keyword || undefined }); merchantOptions.value = result.records || []; } catch (error: unknown) { ElMessage.error(errorMessage(error, t('common.loadFailed'))); } finally { merchantLoading.value = false; } }
function handleMerchantVisibleChange(visible: boolean) { if (visible && !merchantOptions.value.length) loadMerchantOptions(); }
function merchantOptionLabel(item: MerchantInfo) { return item.merchantName ? `${item.merchantId}（${item.merchantName}）` : item.merchantId; }
function tradeStatusText(value: unknown) { return Number(value) === 1 ? t('risk.trade.status.blackened') : t('risk.trade.status.released'); }
function targetTypeText(value: unknown) { const code = String(value || ''); if (!code) return '-'; if (code === 'CUSTOMER') return t('risk.trade.targetTypeOption.CUSTOMER'); const map: Record<string, string> = { cardNo: 'cardNo', cardFingerprint: 'cardFingerprint', cardBin: 'cardBin', cardholderName: 'cardholderName', issuerCountry: 'issuerCountry', deviceFingerprint: 'deviceFingerprint', phone: 'phone', email: 'email', emailUsername: 'emailUsername', emailDomain: 'emailDomain', ip: 'ip', billingAddress: 'billingAddress', billingZip: 'billingZip', billingCountry: 'billingCountry', shippingAddress: 'shippingAddress', shippingZip: 'shippingZip', shippingCountry: 'shippingCountry', region: 'region', CARD: 'cardNo', CARD_NO: 'cardNo', CARD_FINGERPRINT: 'cardFingerprint', CARD_BIN: 'cardBin', CARDHOLDER_NAME: 'cardholderName', ISSUER_COUNTRY: 'issuerCountry', EMAIL: 'email', EMAIL_USERNAME: 'emailUsername', EMAIL_DOMAIN: 'emailDomain', PHONE: 'phone', IP: 'ip', DEVICE: 'deviceFingerprint', DEVICE_FINGERPRINT: 'deviceFingerprint', BILLING_ADDRESS: 'billingAddress', BILLING_ZIP: 'billingZip', BILLING_COUNTRY: 'billingCountry', SHIPPING_ADDRESS: 'shippingAddress', SHIPPING_ZIP: 'shippingZip', SHIPPING_COUNTRY: 'shippingCountry', REGION: 'region' }; return map[code] ? functionText(map[code]) : t('risk.trade.targetTypeOption.unknown'); }
function functionText(code: string) { return t(`risk.trade.workflow.function.${code}`); }
function functionIcon(code: string) { return functionIconMap[code] || Collection; }
function candidateStateText(state: TradeBlackCandidate['state']) { return t(`risk.trade.workflow.candidateState.${state}`); }
function candidateStateType(state: TradeBlackCandidate['state']) { return ({ READY: 'primary', ALREADY_EXISTS: 'warning', ALREADY_MISSING: 'info', NOT_AVAILABLE: 'info' } as const)[state]; }
function candidateScopeText(candidate: TradeBlackCandidate) { return candidate.targetScope === 'GLOBAL' ? t('risk.trade.workflow.globalScope') : candidate.targetMerchantId || '-'; }
function addOneSecond(value: string) { const normalized = value.replace(' ', 'T'); const date = new Date(normalized); if (Number.isNaN(date.getTime())) return value; date.setSeconds(date.getSeconds() + 1); const pad = (part: number) => String(part).padStart(2, '0'); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`; }
function createRequestId(prefix: string) { if (typeof globalThis.crypto?.randomUUID === 'function') return `${prefix}-${globalThis.crypto.randomUUID()}`; return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function apiError(error: unknown): { message?: string; resultCode?: string } { if (error instanceof Error) return { message: error.message }; if (typeof error === 'object' && error !== null) { const value = error as Record<string, unknown>; return { message: typeof value.message === 'string' ? value.message : undefined, resultCode: typeof value.resultCode === 'string' ? value.resultCode : undefined }; } return {}; }
function errorMessage(error: unknown, fallback: string) { return apiError(error).message || fallback; }
</script>

<style scoped>
.query-merchant-select { width: 260px; }
</style>

<style>
.trade-black-workflow-drawer.el-drawer {
  --trade-black-primary: var(--app-primary, #2563eb);
  --trade-black-surface: var(--app-surface, #fff);
  --trade-black-surface-soft: var(--app-surface-soft, #f5f7fa);
  --trade-black-border: var(--app-border, #e4e7ed);
  --trade-black-text: var(--app-text, #303133);
  --trade-black-text-secondary: var(--app-text-secondary, #606266);
  --trade-black-muted: var(--app-muted, #909399);
  background: var(--trade-black-surface-soft);
}
.trade-black-workflow-drawer.el-drawer .el-drawer__header { min-height: 64px; padding: 18px 24px; background: linear-gradient(135deg, color-mix(in srgb, var(--trade-black-primary) 7%, var(--trade-black-surface)) 0%, var(--trade-black-surface) 72%); }
.trade-black-workflow-drawer.el-drawer .el-drawer__body { padding: 0 18px 22px; background: var(--trade-black-surface-soft); }
.trade-black-workflow-drawer.el-drawer .el-drawer__footer { padding: 12px 20px 14px; background: var(--trade-black-surface); text-align: right; }
.trade-black-workflow-drawer .workflow-drawer-title { display: flex; align-items: center; gap: 10px; color: var(--trade-black-text); }
.trade-black-workflow-drawer .workflow-drawer-title > span { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; border-radius: 8px; color: var(--trade-black-primary); background: var(--el-color-primary-light-9); font-size: 16px; }
.trade-black-workflow-drawer .workflow-drawer-title strong { font-size: 18px; line-height: 24px; }
.trade-black-workflow-drawer .workflow-progress { position: sticky; z-index: 4; top: 0; display: grid; grid-template-columns: repeat(2, minmax(220px, 320px)); justify-content: center; margin: 0 -18px 14px; padding: 16px 72px 14px; background: color-mix(in srgb, var(--trade-black-surface) 97%, transparent); box-shadow: 0 5px 14px rgb(15 23 42 / 5%); backdrop-filter: blur(8px); }
.trade-black-workflow-drawer .workflow-progress__rail { position: absolute; top: 29px; right: calc(50% - 160px); left: calc(50% - 160px); height: 2px; overflow: hidden; border-radius: 999px; background: color-mix(in srgb, var(--trade-black-border) 72%, var(--trade-black-muted)); }
.trade-black-workflow-drawer .workflow-progress__rail i { display: block; width: 0; height: 100%; background: var(--trade-black-primary); transition: width .25s ease; }
.trade-black-workflow-drawer .workflow-progress.is-preview .workflow-progress__rail i { width: 100%; }
.trade-black-workflow-drawer .workflow-progress__step { position: relative; z-index: 1; display: flex; min-width: 0; flex-direction: column; align-items: center; gap: 7px; color: var(--trade-black-muted); text-align: center; }
.trade-black-workflow-drawer .workflow-progress__step > span { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; border: 2px solid color-mix(in srgb, var(--trade-black-border) 68%, var(--trade-black-muted)); border-radius: 50%; background: var(--trade-black-surface); font-size: 12px; font-weight: 800; line-height: 1; transition: border-color .2s ease, color .2s ease, background-color .2s ease, box-shadow .2s ease; }
.trade-black-workflow-drawer .workflow-progress__step strong { overflow: hidden; max-width: 100%; font-size: 13px; font-weight: 700; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; }
.trade-black-workflow-drawer .workflow-progress__step.is-active { color: var(--trade-black-primary); }
.trade-black-workflow-drawer .workflow-progress__step.is-active > span { color: #fff; border-color: var(--trade-black-primary); background: var(--trade-black-primary); box-shadow: 0 0 0 4px var(--el-color-primary-light-9); }
.trade-black-workflow-drawer .workflow-progress__step.is-complete > span { color: var(--trade-black-primary); border-color: var(--trade-black-primary); background: var(--trade-black-surface); box-shadow: none; }
.trade-black-workflow-drawer .import-file-context { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px 14px; border: 1px solid var(--el-color-primary-light-7); border-radius: 8px; background: var(--el-color-primary-light-9); }
.trade-black-workflow-drawer .import-file-context > .el-icon { flex: none; color: var(--trade-black-primary); font-size: 24px; }
.trade-black-workflow-drawer .import-file-context > span { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.trade-black-workflow-drawer .import-file-context strong { color: var(--trade-black-text); font-size: 13px; }
.trade-black-workflow-drawer .import-file-context small { overflow: hidden; color: var(--trade-black-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.trade-black-workflow-drawer .workflow-section { margin-bottom: 12px; padding: 15px 16px 16px; border: 1px solid color-mix(in srgb, var(--trade-black-border) 90%, var(--trade-black-primary)); border-radius: 10px; background: var(--trade-black-surface); box-shadow: 0 2px 8px rgb(15 23 42 / 3%); }
.trade-black-workflow-drawer .workflow-section:last-of-type { margin-bottom: 0; }
.trade-black-workflow-drawer .section-heading { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: 10px; margin-bottom: 13px; }
.trade-black-workflow-drawer .section-index { display: inline-flex; min-width: 34px; height: 24px; align-items: center; justify-content: center; padding: 0 7px; border-radius: 7px; color: var(--trade-black-primary); background: var(--el-color-primary-light-9); font-size: 12px; font-weight: 800; line-height: 24px; letter-spacing: .02em; }
.trade-black-workflow-drawer .section-copy { display: flex; min-width: 0; flex-wrap: wrap; align-items: baseline; column-gap: 12px; row-gap: 2px; }
.trade-black-workflow-drawer .section-copy h3 { margin: 0; color: var(--trade-black-text); font-size: 15px; line-height: 24px; }
.trade-black-workflow-drawer .section-copy p { min-width: 240px; flex: 1; margin: 0; color: var(--trade-black-muted); font-size: 12px; line-height: 20px; }
.trade-black-workflow-drawer .section-action { padding-top: 2px; white-space: nowrap; }
.trade-black-workflow-drawer .section-content { padding-left: 44px; }
.trade-black-workflow-drawer .scope-choice-grid, .trade-black-workflow-drawer .action-choice-grid { display: grid; width: 100%; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.trade-black-workflow-drawer .scope-choice-grid .el-radio-button, .trade-black-workflow-drawer .action-choice-grid .el-radio-button { width: 100%; }
.trade-black-workflow-drawer .scope-choice-grid .el-radio-button__inner, .trade-black-workflow-drawer .action-choice-grid .el-radio-button__inner { width: 100%; padding: 12px 18px; border: 1px solid var(--trade-black-border) !important; border-radius: 8px !important; color: var(--trade-black-text-secondary); background: var(--trade-black-surface); box-shadow: none !important; font-weight: 600; text-align: left; }
.trade-black-workflow-drawer .scope-choice-grid .el-radio-button.is-active .el-radio-button__inner, .trade-black-workflow-drawer .action-choice-grid .el-radio-button.is-active .el-radio-button__inner { color: var(--trade-black-primary); border-color: var(--trade-black-primary) !important; background: var(--el-color-primary-light-9); box-shadow: 0 0 0 1px color-mix(in srgb, var(--trade-black-primary) 25%, transparent) !important; }
.trade-black-workflow-drawer .choice-label { display: inline-flex; align-items: center; gap: 8px; }
.trade-black-workflow-drawer .choice-label .el-icon { color: currentColor; font-size: 18px; }
.trade-black-workflow-drawer .scope-choice-grid + .el-alert { margin-top: 12px; }
.trade-black-workflow-drawer .entry-mode-tabs { margin-bottom: 12px; }
.trade-black-workflow-drawer .entry-mode-tabs .el-radio-button__inner { padding: 9px 18px; }
.trade-black-workflow-drawer .field-block { min-width: 0; margin-top: 16px; }
.trade-black-workflow-drawer .field-block > label { display: flex; gap: 5px; margin-bottom: 7px; color: var(--trade-black-text-secondary); font-size: 13px; font-weight: 600; }
.trade-black-workflow-drawer .field-block > label b { color: var(--el-color-danger); }
.trade-black-workflow-drawer .field-block > label em { margin-left: auto; color: var(--trade-black-muted); font-size: 12px; font-style: normal; font-weight: 400; }
.trade-black-workflow-drawer .field-block > p { margin: 5px 0 0; color: var(--trade-black-muted); font-size: 12px; }
.trade-black-workflow-drawer .field-block .el-select { width: 100%; }
.trade-black-workflow-drawer .order-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.trade-black-workflow-drawer .lookup-merchant-switch { margin-top: 5px; padding: 0; }
.trade-black-workflow-drawer .lookup-merchant-auto { display: grid; min-width: 0; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; margin-top: 16px; padding: 9px 11px; border: 1px solid var(--el-color-primary-light-7); border-radius: 8px; background: var(--el-color-primary-light-9); }
.trade-black-workflow-drawer .lookup-merchant-auto > .el-icon { color: var(--trade-black-primary); font-size: 20px; }
.trade-black-workflow-drawer .lookup-merchant-auto > span { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.trade-black-workflow-drawer .lookup-merchant-auto strong, .trade-black-workflow-drawer .lookup-merchant-auto small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.trade-black-workflow-drawer .lookup-merchant-auto strong { color: var(--trade-black-text-secondary); font-size: 12px; line-height: 18px; }
.trade-black-workflow-drawer .lookup-merchant-auto small { color: var(--trade-black-muted); font-size: 11px; line-height: 17px; }
.trade-black-workflow-drawer .function-group { display: grid; grid-template-columns: 138px minmax(0, 1fr); gap: 12px; padding: 11px; border-radius: 8px; background: color-mix(in srgb, var(--trade-black-primary) 3%, var(--trade-black-surface-soft)); }
.trade-black-workflow-drawer .function-group + .function-group { margin-top: 10px; }
.trade-black-workflow-drawer .function-group h4 { display: grid; grid-template-columns: 28px minmax(0, 1fr); align-items: center; gap: 8px; margin: 0; padding: 9px 8px; color: var(--trade-black-text-secondary); font-size: 13px; font-weight: 700; line-height: 19px; }
.trade-black-workflow-drawer .function-group h4 .el-icon { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; color: var(--trade-black-primary); font-size: 23px; }
.trade-black-workflow-drawer .function-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.trade-black-workflow-drawer .function-card.el-checkbox { width: 100%; height: auto; min-height: 54px; margin: 0; padding: 8px 10px; border-color: transparent; border-radius: 7px; background: var(--trade-black-surface); box-shadow: inset 0 0 0 1px var(--trade-black-border); transition: border-color .2s ease, background-color .2s ease, box-shadow .2s ease; }
.trade-black-workflow-drawer .function-card.el-checkbox.is-checked { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); box-shadow: inset 0 0 0 1px var(--el-color-primary-light-5); }
.trade-black-workflow-drawer .function-card .el-checkbox__label { min-width: 0; flex: 1; white-space: normal; }
.trade-black-workflow-drawer .function-card__content { display: grid; grid-template-columns: 24px minmax(0, 1fr); align-items: center; gap: 8px; }
.trade-black-workflow-drawer .function-card__content > .el-icon { display: inline-flex; width: 24px; height: 24px; align-items: center; justify-content: center; color: var(--trade-black-primary); font-size: 20px; }
.trade-black-workflow-drawer .function-card__content > span { display: flex; min-width: 0; flex-direction: column; }
.trade-black-workflow-drawer .function-card strong { overflow: hidden; color: var(--trade-black-text-secondary); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.trade-black-workflow-drawer .function-card small { overflow: hidden; margin-top: 2px; color: var(--trade-black-muted); font-size: 11px; line-height: 16px; text-overflow: ellipsis; white-space: nowrap; }
.trade-black-workflow-drawer .server-notice { margin-top: 16px; }
.trade-black-workflow-drawer .preview-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.trade-black-workflow-drawer .preview-summary > div { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid var(--trade-black-border); border-radius: 8px; background: var(--trade-black-surface); }
.trade-black-workflow-drawer .preview-summary span { color: var(--trade-black-muted); font-size: 12px; }
.trade-black-workflow-drawer .preview-summary strong { color: var(--trade-black-text); font-size: 22px; }
.trade-black-workflow-drawer .preview-summary .is-ready strong { color: var(--el-color-success); }
.trade-black-workflow-drawer .preview-context { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; padding: 12px 14px; border: 1px solid var(--trade-black-border); border-radius: 8px; background: var(--trade-black-surface); }
.trade-black-workflow-drawer .preview-context > span { margin-left: auto; color: var(--trade-black-muted); font-size: 12px; }
.trade-black-workflow-drawer .candidate-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; padding: 10px; border-radius: 8px; background: var(--trade-black-surface-soft); }
.trade-black-workflow-drawer .candidate-toolbar > span { color: var(--trade-black-muted); font-size: 12px; }
.trade-black-workflow-drawer .candidate-orders { display: flex; flex-direction: column; gap: 12px; }
.trade-black-workflow-drawer .candidate-order-card { overflow: hidden; border: 1px solid var(--trade-black-border); border-radius: 10px; background: var(--trade-black-surface); }
.trade-black-workflow-drawer .candidate-order-header { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 11px 13px; border-bottom: 1px solid var(--trade-black-border); background: color-mix(in srgb, var(--trade-black-primary) 4%, var(--trade-black-surface-soft)); }
.trade-black-workflow-drawer .candidate-order-header > div { display: flex; min-width: 0; flex-direction: column; }
.trade-black-workflow-drawer .candidate-order-header strong { overflow: hidden; color: var(--trade-black-text); font-size: 13px; line-height: 19px; text-overflow: ellipsis; white-space: nowrap; }
.trade-black-workflow-drawer .candidate-order-header small { overflow: hidden; color: var(--trade-black-muted); font-size: 11px; line-height: 17px; text-overflow: ellipsis; white-space: nowrap; }
.trade-black-workflow-drawer .candidate-order-tags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.trade-black-workflow-drawer .candidate-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; padding: 11px; }
.trade-black-workflow-drawer .candidate-item { display: grid; min-width: 0; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: 9px; padding: 11px; border: 1px solid var(--trade-black-border); border-radius: 8px; background: var(--trade-black-surface); transition: border-color .18s ease, background-color .18s ease, box-shadow .18s ease; }
.trade-black-workflow-drawer .candidate-item.is-selectable:hover { border-color: var(--el-color-primary-light-5); }
.trade-black-workflow-drawer .candidate-item.is-selected { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); box-shadow: inset 3px 0 0 var(--trade-black-primary); }
.trade-black-workflow-drawer .candidate-item > .el-checkbox { margin-top: 2px; }
.trade-black-workflow-drawer .candidate-item__body { min-width: 0; }
.trade-black-workflow-drawer .candidate-item__title { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 8px; }
.trade-black-workflow-drawer .candidate-item__title strong { overflow: hidden; color: var(--trade-black-text-secondary); font-size: 13px; line-height: 19px; text-overflow: ellipsis; white-space: nowrap; }
.trade-black-workflow-drawer .candidate-item__value { display: block; overflow: hidden; margin-top: 5px; color: var(--trade-black-text); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; }
.trade-black-workflow-drawer .candidate-item dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 12px; margin: 8px 0 0; }
.trade-black-workflow-drawer .candidate-item dl > div { display: grid; min-width: 0; grid-template-columns: auto minmax(0, 1fr); gap: 5px; }
.trade-black-workflow-drawer .candidate-item dt { color: var(--trade-black-muted); font-size: 11px; line-height: 17px; }
.trade-black-workflow-drawer .candidate-item dd { overflow: hidden; margin: 0; color: var(--trade-black-text-secondary); font-size: 11px; line-height: 17px; text-overflow: ellipsis; white-space: nowrap; }
.trade-black-workflow-drawer .candidate-item .candidate-item__message { grid-column: 1 / -1; }
.trade-black-workflow-drawer .candidate-pagination { align-self: flex-end; margin-top: 2px; }
.trade-black-workflow-drawer .error-list { margin: 8px 0 0; padding-left: 18px; font-size: 12px; line-height: 20px; }
.base-feedback-dialog .result-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0 0; }
.base-feedback-dialog .result-summary > div { display: flex; flex-direction: column; gap: 4px; padding: 9px 10px; border: 1px solid var(--app-border, #e4e7ed); border-radius: 8px; background: var(--app-surface-soft, #f5f7fa); }
.base-feedback-dialog .result-summary span { color: var(--app-muted, #909399); font-size: 12px; }
.base-feedback-dialog .result-summary strong { color: var(--app-text, #303133); font-size: 18px; }
.base-feedback-dialog .result-summary .is-success strong { color: var(--el-color-success); }
.base-feedback-dialog .result-summary .is-skipped strong { color: var(--el-color-warning); }
.base-feedback-dialog .result-summary .is-failure strong { color: var(--el-color-danger); }
.base-feedback-dialog .failure-download { margin-top: 12px; }
@media (max-width: 900px) {
  .trade-black-workflow-drawer .workflow-progress { padding-right: 44px; padding-left: 44px; }
  .trade-black-workflow-drawer .section-content { padding-left: 0; }
  .trade-black-workflow-drawer .function-group { grid-template-columns: 1fr; }
  .trade-black-workflow-drawer .function-group h4 { padding: 0 2px 2px; }
  .trade-black-workflow-drawer .function-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .trade-black-workflow-drawer .order-grid { grid-template-columns: 1fr; }
  .trade-black-workflow-drawer .candidate-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .trade-black-workflow-drawer.el-drawer { width: 100vw !important; }
  .trade-black-workflow-drawer.el-drawer .el-drawer__header, .trade-black-workflow-drawer.el-drawer .el-drawer__footer { padding-right: 16px; padding-left: 16px; }
  .trade-black-workflow-drawer.el-drawer .el-drawer__body { padding-right: 12px; padding-left: 12px; }
  .trade-black-workflow-drawer .workflow-progress { margin-right: -12px; margin-left: -12px; padding-right: 18px; padding-left: 18px; }
  .trade-black-workflow-drawer .workflow-progress__rail { right: 25%; left: 25%; }
  .trade-black-workflow-drawer .workflow-section { padding: 14px 12px; }
  .trade-black-workflow-drawer .section-heading { grid-template-columns: auto minmax(0, 1fr); }
  .trade-black-workflow-drawer .section-action { grid-column: 2; }
  .trade-black-workflow-drawer .section-copy p { min-width: 100%; }
  .trade-black-workflow-drawer .scope-choice-grid, .trade-black-workflow-drawer .action-choice-grid, .trade-black-workflow-drawer .function-grid, .trade-black-workflow-drawer .preview-summary { grid-template-columns: 1fr; }
  .trade-black-workflow-drawer .candidate-toolbar .el-radio-group { display: grid; width: 100%; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .trade-black-workflow-drawer .candidate-toolbar .el-radio-button, .trade-black-workflow-drawer .candidate-toolbar .el-radio-button__inner { width: 100%; }
  .trade-black-workflow-drawer .candidate-order-header { grid-template-columns: auto minmax(0, 1fr); }
  .trade-black-workflow-drawer .candidate-order-tags { grid-column: 2; justify-content: flex-start; }
  .trade-black-workflow-drawer .candidate-item dl { grid-template-columns: 1fr; }
  .trade-black-workflow-drawer .candidate-item .candidate-item__message { grid-column: auto; }
}
</style>

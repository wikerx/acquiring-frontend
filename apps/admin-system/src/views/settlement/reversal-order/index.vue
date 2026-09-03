<!-- Admin 结算冲正主页面：浏览器只提交申请或决策，可信 Maker/Checker 与资金冲正由后端编排。 -->
<template>
    <div class="app-container settlement-list-page">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('transaction.settlement.reversalOrderNo')"><el-input v-model.trim="query.reversalOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.settlement.originalBatchNo')"><el-input v-model.trim="query.originalBatchNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.merchantId')"><MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" /></el-form-item>
            <el-form-item :label="t('common.status')"><el-select v-model="query.reversalStatus" clearable :placeholder="t('common.pleaseSelect')"><el-option v-for="item in statuses" :key="item" :label="statusText(item)" :value="item" /></el-select></el-form-item>
            <el-form-item :label="t('transaction.settlement.submittedDate')"><el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button></el-form-item>
        </el-form>
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button v-hasPermi="'settlement:reversal-order:create'" type="primary" plain :icon="Plus" @click="openCreate">{{ t('transaction.settlement.createReversal') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch=!showSearch" @refresh="loadData" /></el-col>
        </el-row>
        <StandardTable v-loading="loading" table-key="admin-settlement-reversal-orders" :data="rows" row-key="id" size="small">
            <el-table-column prop="reversalOrderNo" :label="t('transaction.settlement.reversalOrderNo')" min-width="210" fixed="left" align="center" />
            <el-table-column prop="originalBatchNo" :label="t('transaction.settlement.originalBatchNo')" min-width="205" align="center"><template #default="{ row }"><el-button link type="primary" @click="openBatch(row.originalBatchNo)">{{ row.originalBatchNo }}</el-button></template></el-table-column>
            <el-table-column prop="reversalBatchNo" :label="t('transaction.settlement.reversalBatchNo')" min-width="205" align="center"><template #default="{ row }"><el-button v-if="row.reversalBatchNo" link type="primary" @click="openBatch(row.reversalBatchNo)">{{ row.reversalBatchNo }}</el-button><span v-else>-</span></template></el-table-column>
            <el-table-column prop="merchantId" :label="t('transaction.fields.merchantId')" min-width="140" align="center"><template #default="{ row }"><el-button link type="primary" @click="openMerchant(row.merchantId)">{{ row.merchantId }}</el-button></template></el-table-column>
            <el-table-column :label="t('transaction.settlement.netAmount')" min-width="164" align="right"><template #default="{row}">{{ moneyTextByExponent(row.netAmount,row.targetCurrency,row.targetCurrencyExponent) }}</template></el-table-column>
            <el-table-column :label="t('common.status')" min-width="132" align="center"><template #default="{row}"><el-tag size="small" effect="plain" :type="statusTagType(row.reversalStatus)">{{ statusText(row.reversalStatus) }}</el-tag></template></el-table-column>
            <el-table-column prop="submittedByAccountName" :label="t('transaction.settlement.submitter')" min-width="126" align="center" />
            <el-table-column prop="decidedByAccountName" :label="t('transaction.settlement.reviewer')" min-width="126" align="center" />
            <el-table-column :label="t('transaction.settlement.submittedTime')" min-width="174" align="center"><template #default="{row}"><BaseDateTime :value="row.submittedTime" /></template></el-table-column>
            <el-table-column :label="t('common.operation')" width="218" fixed="right" align="center"><template #default="{row}">
                <el-button v-hasPermi="'settlement:reversal-order:detail'" link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                <el-button v-if="row.reversalStatus==='PENDING_APPROVAL'" v-hasPermi="'settlement:reversal-order:approve'" link type="success" @click="openDecision('approve',row)">{{ t('transaction.settlement.approve') }}</el-button>
                <el-button v-if="row.reversalStatus==='PENDING_APPROVAL'" v-hasPermi="'settlement:reversal-order:reject'" link type="danger" @click="openDecision('reject',row)">{{ t('transaction.settlement.reject') }}</el-button>
            </template></el-table-column>
        </StandardTable>
        <div v-show="total>0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadData" @size-change="handleSearch" /></div>

        <el-drawer v-model="detailVisible" :title="t('transaction.settlement.reversalDetail')" size="min(760px, 96vw)" destroy-on-close>
            <el-descriptions v-if="detail" :column="2" border size="small">
                <el-descriptions-item :label="t('transaction.settlement.reversalOrderNo')">{{ detail.reversal.reversalOrderNo }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.status')">{{ statusText(detail.reversal.reversalStatus) }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.originalBatchNo')"><el-button link type="primary" @click="openBatch(detail.reversal.originalBatchNo)">{{ detail.reversal.originalBatchNo }}</el-button></el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.reversalBatchNo')"><el-button v-if="detail.reversal.reversalBatchNo" link type="primary" @click="openBatch(detail.reversal.reversalBatchNo)">{{ detail.reversal.reversalBatchNo }}</el-button><span v-else>-</span></el-descriptions-item>
                <el-descriptions-item :label="t('transaction.fields.merchantId')"><el-button link type="primary" @click="openMerchant(detail.reversal.merchantId)">{{ detail.reversal.merchantId }}</el-button></el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.netAmount')">{{ moneyTextByExponent(detail.reversal.netAmount,detail.reversal.targetCurrency,detail.reversal.targetCurrencyExponent) }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.submitter')">{{ detail.reversal.submittedByAccountName||'-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.reviewer')">{{ detail.reversal.decidedByAccountName||'-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.clearing.reason')" :span="2">{{ detail.reversal.submitReason||'-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.reviewComment')" :span="2">{{ detail.reversal.decisionComment||'-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.originalNetResultItemId')">{{ detail.originalNetResultItemId||'-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.originalFundLedgerId')">{{ detail.originalFundLedgerId||'-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.sourceFingerprint')" :span="2">{{ detail.sourceFingerprint||'-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.submitAudit')" :span="2">{{ auditText(detail.submittedRoleSnapshot,detail.submitClientIp,detail.submitUserAgent) }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.decisionAudit')" :span="2">{{ auditText(detail.decidedRoleSnapshot,detail.decisionClientIp,detail.decisionUserAgent) }}</el-descriptions-item>
            </el-descriptions>
        </el-drawer>

        <el-dialog v-model="createVisible" :title="t('transaction.settlement.createReversal')" width="560px" destroy-on-close>
            <el-alert :title="t('transaction.settlement.reversalRequestNotice')" type="error" :closable="false" show-icon />
            <el-form :model="createForm" label-width="128px" class="dialog-form">
                <el-form-item :label="t('transaction.settlement.originalBatchNo')" required><el-input v-model.trim="createForm.originalBatchNo" maxlength="19" /></el-form-item>
                <el-form-item :label="t('transaction.settlement.expectedVersion')" required><el-input-number v-model="createForm.expectedBatchVersion" :min="0" :step="1" step-strictly /></el-form-item>
                <el-form-item :label="t('transaction.clearing.reason')" required><el-input v-model="createForm.reason" type="textarea" :rows="4" maxlength="400" show-word-limit /></el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" :loading="submitting" @click="submitCreate">{{ t('common.confirm') }}</el-button><el-button @click="createVisible=false">{{ t('common.cancel') }}</el-button></div></template>
        </el-dialog>
        <el-dialog v-model="decisionVisible" :title="t(`transaction.settlement.decisionTitle.${decisionAction}`)" width="540px" destroy-on-close>
            <el-form :model="decisionForm" label-width="96px"><el-form-item :label="t('transaction.settlement.reviewComment')" required><el-input v-model="decisionForm.comment" type="textarea" :rows="4" maxlength="400" show-word-limit /></el-form-item></el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" :loading="deciding" @click="submitDecision">{{ t('common.confirm') }}</el-button><el-button @click="decisionVisible=false">{{ t('common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Plus, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { decideSettlementReversal,getSettlementReversal,searchSettlementReversals,submitSettlementReversal,type SettlementReversal,type SettlementReversalDetail,type SettlementReversalQuery } from '@/api/settlement';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import { defaultDateRange,moneyTextByExponent,requestKey,statusTagType } from '@/views/settlement/shared';
const {t,te}=useI18n();const router=useRouter();const statuses=['PENDING_APPROVAL','APPROVED','REJECTED'];
const showSearch=ref(true),loading=ref(false),detailVisible=ref(false),createVisible=ref(false),decisionVisible=ref(false),submitting=ref(false),deciding=ref(false);
const rows=ref<SettlementReversal[]>([]),total=ref(0),detail=ref<SettlementReversalDetail|null>(null),selected=ref<SettlementReversal|null>(null);
const dateRange=ref<[string,string]>(defaultDateRange());const query=reactive<SettlementReversalQuery>({beginSubmittedDate:'',endSubmittedDate:'',pageNo:1,pageSize:10});
const createForm=reactive({originalBatchNo:'',expectedBatchVersion:0,reason:''});const decisionAction=ref<'approve'|'reject'>('approve');const decisionForm=reactive({comment:''});
onMounted(loadData);
function requestQuery():SettlementReversalQuery{return{...query,reversalOrderNo:query.reversalOrderNo||undefined,originalBatchNo:query.originalBatchNo||undefined,merchantId:query.merchantId||undefined,reversalStatus:query.reversalStatus||undefined,beginSubmittedDate:dateRange.value[0],endSubmittedDate:dateRange.value[1]}}
async function loadData(){loading.value=true;try{const result=await searchSettlementReversals(requestQuery());rows.value=result.records||[];total.value=result.total||0}catch(error){ElMessage.error(error instanceof Error?error.message:t('common.loadFailed'))}finally{loading.value=false}}
function handleSearch(){query.pageNo=1;loadData()}function handleReset(){Object.assign(query,{reversalOrderNo:undefined,originalBatchNo:undefined,merchantId:undefined,reversalStatus:undefined,pageNo:1});dateRange.value=defaultDateRange();loadData()}
async function openDetail(row:SettlementReversal){detailVisible.value=true;detail.value=null;try{detail.value=await getSettlementReversal(row.reversalOrderNo)}catch(error){ElMessage.error(error instanceof Error?error.message:t('common.loadFailed'))}}
function openCreate(){Object.assign(createForm,{originalBatchNo:'',expectedBatchVersion:0,reason:''});createVisible.value=true}
async function submitCreate(){if(!createForm.originalBatchNo||!createForm.reason.trim()){ElMessage.warning(t('transaction.settlement.requiredFields'));return}submitting.value=true;try{const result=await submitSettlementReversal({requestKey:requestKey('SET-REVERSAL-CREATE'),originalBatchNo:createForm.originalBatchNo,expectedBatchVersion:createForm.expectedBatchVersion,reason:createForm.reason.trim()});ElMessage.success(t('transaction.settlement.reversalSubmitted',{orderNo:result.reversalOrderNo}));createVisible.value=false;await loadData()}catch(error){ElMessage.error(error instanceof Error?error.message:t('common.operationFailed'))}finally{submitting.value=false}}
function openDecision(action:'approve'|'reject',row:SettlementReversal){decisionAction.value=action;selected.value=row;decisionForm.comment='';decisionVisible.value=true}
async function submitDecision(){if(!selected.value||!decisionForm.comment.trim()){ElMessage.warning(t('transaction.settlement.requiredFields'));return}deciding.value=true;try{await decideSettlementReversal(selected.value.reversalOrderNo,decisionAction.value,{requestKey:requestKey(`SET-REVERSAL-${decisionAction.value.toUpperCase()}`),expectedVersion:selected.value.version,comment:decisionForm.comment.trim()});ElMessage.success(t('common.success'));decisionVisible.value=false;await loadData()}catch(error){ElMessage.error(error instanceof Error?error.message:t('common.operationFailed'))}finally{deciding.value=false}}
function statusText(value?:string){if(!value)return'-';const key=`transaction.settlement.reversalStatus.${value}`;return te(key)?t(key):value}
function auditText(role?:string,ip?:string,userAgent?:string){return [role,ip,userAgent].filter(Boolean).join(' / ')||'-'}
function openBatch(settlementBatchNo:string){router.push({path:'/settlement/batches',query:{settlementBatchNo}})}
function openMerchant(merchantId:string){router.push({path:'/merchant/info',query:{merchantId}})}
</script>
<style scoped>.search-form :deep(.el-input),.search-form :deep(.el-select){width:220px}.dialog-form{margin-top:20px}</style>

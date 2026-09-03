<!-- Admin 结算预审主页面：候选、汇率和试算用于运营复核，审批命令受权限、数据范围和 Maker-Checker 约束。 -->
<template>
    <div class="app-container settlement-list-page">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('transaction.settlement.reviewOrderNo')"><el-input v-model.trim="query.reviewOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.merchantId')"><MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.settlement.reviewType')">
                <el-select v-model="query.reviewType" clearable :placeholder="t('common.pleaseSelect')"><el-option v-for="item in reviewTypes" :key="item" :label="typeText(item)" :value="item" /></el-select>
            </el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.reviewStatus" clearable :placeholder="t('common.pleaseSelect')"><el-option v-for="item in reviewStatuses" :key="item" :label="statusText(item)" :value="item" /></el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.settlement.businessDate')">
                <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false"
                    :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button v-hasPermi="'settlement:review-order:export'" type="warning" plain :icon="Download" :loading="exporting" @click="handleExport">{{ t('common.export') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
        </el-row>

        <StandardTable v-loading="loading" table-key="admin-settlement-review-orders" :data="rows" row-key="id" size="small">
            <el-table-column prop="reviewOrderNo" :label="t('transaction.settlement.reviewOrderNo')" min-width="205" fixed="left" align="center" show-overflow-tooltip />
            <el-table-column prop="merchantId" :label="t('transaction.fields.merchantId')" min-width="140" align="center"><template #default="{ row }"><el-button link type="primary" @click="openMerchant(row.merchantId)">{{ row.merchantId }}</el-button></template></el-table-column>
            <el-table-column :label="t('transaction.settlement.reviewType')" min-width="150" align="center"><template #default="{ row }">{{ typeText(row.reviewType) }}</template></el-table-column>
            <el-table-column :label="t('common.status')" min-width="134" align="center"><template #default="{ row }"><el-tag size="small" effect="plain" :type="statusTagType(row.reviewStatus)">{{ statusText(row.reviewStatus) }}</el-tag></template></el-table-column>
            <el-table-column :label="t('transaction.settlement.netAmount')" min-width="164" align="right"><template #default="{ row }">{{ moneyTextByExponent(row.netAmount, row.targetCurrency, row.targetCurrencyExponent) }}</template></el-table-column>
            <el-table-column prop="candidateCount" :label="t('transaction.settlement.candidateCount')" width="104" align="center" />
            <el-table-column prop="submittedByAccountName" :label="t('transaction.settlement.submitter')" min-width="126" align="center" />
            <el-table-column prop="decidedByAccountName" :label="t('transaction.settlement.reviewer')" min-width="126" align="center" />
            <el-table-column prop="settlementBatchNo" :label="t('transaction.settlement.batchNo')" min-width="205" align="center" show-overflow-tooltip><template #default="{ row }"><el-button v-if="row.settlementBatchNo" link type="primary" @click="openBatch(row.settlementBatchNo)">{{ row.settlementBatchNo }}</el-button><span v-else>-</span></template></el-table-column>
            <el-table-column prop="businessDate" :label="t('transaction.settlement.businessDate')" width="116" align="center" />
            <el-table-column :label="t('common.createTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.createTime" :source-time-zone="row.businessTimeZone" /></template></el-table-column>
            <el-table-column :label="t('common.operation')" width="236" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button v-hasPermi="'settlement:review-order:detail'" link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                    <el-button v-if="row.reviewStatus === 'PENDING_APPROVAL'" v-hasPermi="'settlement:review-order:approve'" link type="success" @click="openDecision('approve', row)">{{ t('transaction.settlement.approve') }}</el-button>
                    <el-button v-if="row.reviewStatus === 'PENDING_APPROVAL'" v-hasPermi="'settlement:review-order:reject'" link type="danger" @click="openDecision('reject', row)">{{ t('transaction.settlement.reject') }}</el-button>
                    <el-button v-if="row.reviewStatus === 'PENDING_APPROVAL'" v-hasPermi="'settlement:review-order:cancel'" link type="warning" @click="openDecision('cancel', row)">{{ t('transaction.settlement.cancel') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadData" @size-change="handleSearch" /></div>

        <el-drawer v-model="detailVisible" :title="t('transaction.settlement.reviewDetail')" size="88%" destroy-on-close>
            <div v-loading="detailLoading" v-if="detail">
                <el-descriptions :column="3" border size="small">
                    <el-descriptions-item :label="t('transaction.settlement.reviewOrderNo')">{{ detail.review.reviewOrderNo }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.merchantId')"><el-button link type="primary" @click="openMerchant(detail.review.merchantId)">{{ detail.review.merchantId }}</el-button></el-descriptions-item>
                    <el-descriptions-item :label="t('common.status')">{{ statusText(detail.review.reviewStatus) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.reviewType')">{{ typeText(detail.review.reviewType) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.businessDate')">{{ detail.review.businessDate }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.businessTimeZone')">{{ detail.review.businessTimeZone }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.netAmount')">{{ moneyTextByExponent(detail.review.netAmount, detail.review.targetCurrency, detail.review.targetCurrencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.candidateCount')">{{ detail.review.candidateCount }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.projectableCandidateCount')">{{ detail.review.projectableCandidateCount }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.submitter')">{{ detail.review.submittedByAccountName || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.reviewer')">{{ detail.review.decidedByAccountName || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.batchNo')"><el-button v-if="detail.review.settlementBatchNo" link type="primary" @click="openBatch(detail.review.settlementBatchNo)">{{ detail.review.settlementBatchNo }}</el-button><span v-else>-</span></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.submittedTime')"><BaseDateTime :value="detail.review.submittedTime" :source-time-zone="detail.review.businessTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.decisionTime')"><BaseDateTime :value="detail.review.decisionTime" :source-time-zone="detail.review.businessTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('common.updateTime')"><BaseDateTime :value="detail.review.updateTime" :source-time-zone="detail.review.businessTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.clearing.reason')" :span="3">{{ detail.review.submitReason || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.reviewComment')" :span="3">{{ detail.review.reviewComment || '-' }}</el-descriptions-item>
                </el-descriptions>
                <h3 class="detail-section-title">{{ t('transaction.settlement.candidateList') }}</h3>
                <el-table :data="detail.candidates" border size="small">
                    <el-table-column prop="candidateNo" :label="t('transaction.settlement.candidateNo')" min-width="200" />
                    <el-table-column :label="t('transaction.settlement.sourceType')" min-width="150" align="center"><template #default="{ row }">{{ enumText('sourceTypeValue', row.sourceType) }}</template></el-table-column>
                    <el-table-column prop="sourceTransactionId" :label="t('transaction.fields.transactionId')" min-width="200"><template #default="{ row }"><el-button v-if="row.sourceTransactionId" link type="primary" @click="openTransaction(row)">{{ row.sourceTransactionId }}</el-button><span v-else>-</span></template></el-table-column>
                    <el-table-column :label="t('common.status')" width="130" align="center"><template #default="{ row }">{{ enumText('relationStatusValue', row.relationStatus) }}</template></el-table-column>
                </el-table>
                <h3 class="detail-section-title">{{ t('transaction.settlement.rateMatrix') }}</h3>
                <el-table :data="detail.rates" border size="small">
                    <el-table-column prop="sourceCurrency" :label="t('transaction.settlement.sourceCurrency')" width="120" align="center" />
                    <el-table-column prop="targetCurrency" :label="t('transaction.settlement.targetCurrency')" width="120" align="center" />
                    <el-table-column :label="t('transaction.settlement.directRate')" min-width="180" align="right"><template #default="{ row }">{{ decimalText(row.directRate) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.rateSource')" min-width="160" align="center"><template #default="{ row }">{{ enumText('rateSourceValue', row.rateSource) }}</template></el-table-column>
                    <el-table-column prop="quoteId" :label="t('transaction.settlement.quoteId')" min-width="180" />
                </el-table>
                <h3 class="detail-section-title">{{ t('transaction.settlement.resultSummary') }}</h3>
                <el-table :data="detail.summaries" border size="small">
                    <el-table-column :label="t('transaction.settlement.paymentTypeMethod')" min-width="190" align="center"><template #default="{ row }"><PaymentMethodDisplay :payment-types="dimensionItems('paymentTypeValue', row.paymentType)" :payment-methods="dimensionItems('paymentMethodValue', row.paymentMethod)" /></template></el-table-column>
                    <el-table-column :label="t('transaction.fields.transactionType')" min-width="140" align="center"><template #default="{ row }">{{ enumText('transactionTypeValue', row.transactionType) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.resultItemType')" min-width="160"><template #default="{ row }">{{ enumText('resultItemTypeValue', row.resultItemType) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.clearing.feeCategory')" min-width="140"><template #default="{ row }">{{ enumText('feeCategoryValue', row.feeCategory) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.clearing.direction')" width="100" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('directionValue', row.direction)" /></template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.sourceAmount')" min-width="160" align="right"><template #default="{ row }">{{ moneyTextByExponent(row.sourceAmount, row.sourceCurrency, row.sourceCurrencyExponent) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.targetAmount')" min-width="160" align="right"><template #default="{ row }">{{ moneyTextByExponent(row.targetAmount, row.targetCurrency, row.targetCurrencyExponent) }}</template></el-table-column>
                </el-table>
            </div>
        </el-drawer>

        <el-dialog v-model="decisionVisible" :title="decisionTitle" width="560px" destroy-on-close>
            <el-form :model="decisionForm" label-width="96px"><el-form-item :label="t('transaction.settlement.reviewComment')" required><el-input v-model="decisionForm.comment" type="textarea" :rows="4" maxlength="400" show-word-limit /></el-form-item></el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" :loading="deciding" @click="submitDecision">{{ t('common.confirm') }}</el-button><el-button @click="decisionVisible=false">{{ t('common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Download, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { DirectionTag, PaymentMethodDisplay } from '@acquiring/shared';
import { decideSettlementReview, exportSettlementReviews, getSettlementReview, searchSettlementReviews, type SettlementReview, type SettlementReviewDetail, type SettlementReviewQuery } from '@/api/settlement';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import { fallbackTransactionTypeOptions, loadTransactionDictOptions } from '@/views/transaction/shared';
import { businessDateFromBusinessNo, decimalText, defaultDateRange, moneyTextByExponent, requestKey, statusTagType } from '@/views/settlement/shared';

type DecisionAction = 'approve' | 'reject' | 'cancel';
const { t, te, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const reviewTypes = ['REGULAR', 'RESERVE_RELEASE', 'ADJUSTMENT'];
const reviewStatuses = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'];
const showSearch=ref(true), loading=ref(false), exporting=ref(false), detailVisible=ref(false), detailLoading=ref(false), decisionVisible=ref(false), deciding=ref(false);
const rows=ref<SettlementReview[]>([]), total=ref(0), detail=ref<SettlementReviewDetail|null>(null), selected=ref<SettlementReview|null>(null);
const dateRange=ref<[string,string]>(defaultDateRange());
const query=reactive<SettlementReviewQuery>({beginBusinessDate:'',endBusinessDate:'',pageNo:1,pageSize:10});
const decisionAction=ref<DecisionAction>('approve');
const decisionForm=reactive({comment:''});
const paymentTypeOptions=ref<SelectOption[]>([]), paymentMethodOptions=ref<SelectOption[]>([]);
const transactionTypeOptions=ref<SelectOption[]>(fallbackTransactionTypeOptions(t));
const decisionTitle=computed(()=>t(`transaction.settlement.decisionTitle.${decisionAction.value}`));
const canViewDetail = userStore.hasPermission('settlement:review-order:detail');
onMounted(async () => {
    const linkedReviewNo = typeof route.query.reviewOrderNo === 'string' ? route.query.reviewOrderNo.trim() : '';
    if (linkedReviewNo) {
        query.reviewOrderNo = linkedReviewNo;
        const linkedBusinessDate = businessDateFromBusinessNo(linkedReviewNo);
        if (linkedBusinessDate) dateRange.value = [linkedBusinessDate, linkedBusinessDate];
    }
    await loadDimensionDictionaries();
    await loadData();
    if (linkedReviewNo && canViewDetail) {
        const linkedRow = rows.value.find((row) => row.reviewOrderNo === linkedReviewNo);
        if (linkedRow) await openDetail(linkedRow);
    }
});

async function loadDimensionDictionaries(){const language=String(locale.value||'zh-CN');const [paymentTypes,paymentMethods,transactionTypes]=await Promise.all([loadDictOptions('acquiring_payment_method',language).catch(()=>[]),loadDictOptions('card_brand',language).catch(()=>[]),loadTransactionDictOptions('transaction_type',language).catch(()=>[])]);paymentTypeOptions.value=paymentTypes;paymentMethodOptions.value=paymentMethods;if(transactionTypes.length)transactionTypeOptions.value=transactionTypes}

function requestQuery(): SettlementReviewQuery { return {...query,reviewOrderNo:query.reviewOrderNo||undefined,merchantId:query.merchantId||undefined,reviewType:query.reviewType||undefined,reviewStatus:query.reviewStatus||undefined,beginBusinessDate:dateRange.value[0],endBusinessDate:dateRange.value[1]}; }
async function loadData(){loading.value=true;try{const result=await searchSettlementReviews(requestQuery());rows.value=result.records||[];total.value=result.total||0}catch(error){ElMessage.error(error instanceof Error?error.message:t('common.loadFailed'))}finally{loading.value=false}}
function handleSearch(){query.pageNo=1;loadData()}
function handleReset(){Object.assign(query,{reviewOrderNo:undefined,merchantId:undefined,reviewType:undefined,reviewStatus:undefined,pageNo:1});dateRange.value=defaultDateRange();loadData()}
async function handleExport(){exporting.value=true;try{await exportSettlementReviews(requestQuery())}catch(error){ElMessage.error(error instanceof Error?error.message:t('common.exportFailed'))}finally{exporting.value=false}}
async function openDetail(row:SettlementReview){detailVisible.value=true;detailLoading.value=true;detail.value=null;try{detail.value=await getSettlementReview(row.reviewOrderNo)}catch(error){ElMessage.error(error instanceof Error?error.message:t('common.loadFailed'))}finally{detailLoading.value=false}}
function openTransaction(row:SettlementReviewDetail['candidates'][number]){router.push({path:'/transaction/operation',query:{transactionId:row.sourceTransactionId,transactionDateTime:row.sourceTransactionDateTime,transactionTimeZone:detail.value?.review.businessTimeZone||'Asia/Shanghai'}})}
function openMerchant(merchantId:string){router.push({path:'/merchant/info',query:{merchantId}})}
function openBatch(settlementBatchNo:string){router.push({path:'/settlement/batches',query:{settlementBatchNo}})}
function openDecision(action:DecisionAction,row:SettlementReview){decisionAction.value=action;selected.value=row;decisionForm.comment='';decisionVisible.value=true}
async function submitDecision(){if(!selected.value||!decisionForm.comment.trim()){ElMessage.warning(t('transaction.settlement.requiredFields'));return}deciding.value=true;try{await decideSettlementReview(selected.value.reviewOrderNo,decisionAction.value,{requestKey:requestKey(`SET-REVIEW-${decisionAction.value.toUpperCase()}`),expectedVersion:selected.value.version,comment:decisionForm.comment.trim()});ElMessage.success(t('common.success'));decisionVisible.value=false;await loadData()}catch(error){ElMessage.error(error instanceof Error?error.message:t('common.operationFailed'))}finally{deciding.value=false}}
function typeText(value?:string){return enumText('reviewTypeValue',value)}
function statusText(value?:string){return enumText('reviewStatus',value)}
function enumText(group:string,value?:string){if(!value)return'-';const options=group==='paymentTypeValue'?paymentTypeOptions.value:group==='paymentMethodValue'?paymentMethodOptions.value:group==='transactionTypeValue'?transactionTypeOptions.value:[];const option=options.find((item)=>item.value===value);if(option)return option.label;const key=`transaction.settlement.${group}.${value}`;return te(key)?t(key):value}
function dimensionItems(group:string,value?:string){return value?[{value,label:enumText(group,value)}]:[]}
</script>

<style scoped>
.search-form :deep(.el-input),.search-form :deep(.el-select){width:220px}.detail-section-title{font-size:14px;margin:24px 0 10px;letter-spacing:0}
</style>

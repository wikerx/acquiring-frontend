<!-- Admin 保证金结算明细主页面：展示原标签币种不可变动作和剩余责任，不在浏览器换汇或改写责任公式。 -->
<template>
    <div class="app-container settlement-list-page">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('transaction.settlement.reserveNo')"><el-input v-model.trim="query.reserveNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.settlement.batchNo')"><el-input v-model.trim="query.settlementBatchNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.merchantId')"><MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.transactionId')"><el-input v-model.trim="query.sourceTransactionId" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.settlement.reserveActionType')"><el-select v-model="query.actionType" clearable filterable><el-option v-for="value in actionTypes" :key="value" :label="enumText('reserveActionTypeValue', value)" :value="value" /></el-select></el-form-item>
            <el-form-item :label="t('transaction.settlement.currency')"><CurrencySelect v-model="query.currency" /></el-form-item>
            <el-form-item :label="t('transaction.settlement.businessDate')"><el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button></el-form-item>
        </el-form>
        <el-row :gutter="10" class="mb8"><el-col :span="1.5"><el-button v-hasPermi="'settlement:reserve-item:export'" type="warning" plain :icon="Download" :loading="exporting" @click="handleExport">{{ t('common.export') }}</el-button></el-col><el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch=!showSearch" @refresh="loadData" /></el-col></el-row>
        <StandardTable v-loading="loading" table-key="admin-settlement-reserve-items" :data="rows" row-key="actionId" size="small">
            <el-table-column prop="reserveActionNo" :label="t('transaction.settlement.reserveActionNo')" min-width="220" fixed="left" align="center" show-overflow-tooltip />
            <el-table-column prop="reserveNo" :label="t('transaction.settlement.reserveNo')" min-width="190" align="center" show-overflow-tooltip />
            <el-table-column prop="merchantId" :label="t('transaction.fields.merchantId')" min-width="138" align="center"><template #default="{ row }"><el-button link type="primary" @click="openMerchant(row.merchantId)">{{ row.merchantId }}</el-button></template></el-table-column>
            <el-table-column :label="t('transaction.settlement.reserveActionType')" min-width="140" align="center"><template #default="{ row }"><el-tag effect="plain">{{ enumText('reserveActionTypeValue', row.actionType) }}</el-tag></template></el-table-column>
            <el-table-column :label="t('transaction.settlement.postingAmount')" min-width="150" align="right"><template #default="{ row }">{{ moneyTextByExponent(row.amount, row.currency, row.currencyExponent) }}</template></el-table-column>
            <el-table-column :label="t('transaction.settlement.remainingAmount')" min-width="160" align="right"><template #default="{ row }"><strong>{{ moneyTextByExponent(row.remainingAmount, row.currency, row.currencyExponent) }}</strong></template></el-table-column>
            <el-table-column :label="t('transaction.settlement.reserveStatus')" min-width="136" align="center"><template #default="{ row }"><el-tag :type="reserveStatusType(row.reserveStatus)" effect="plain">{{ enumText('reserveStatusValue', row.reserveStatus) }}</el-tag></template></el-table-column>
            <el-table-column prop="sourceTransactionId" :label="t('transaction.fields.transactionId')" min-width="205" align="center"><template #default="{ row }"><el-button v-if="row.sourceTransactionId" link type="primary" @click="openTransaction(row)">{{ row.sourceTransactionId }}</el-button><span v-else>-</span></template></el-table-column>
            <el-table-column prop="settlementBatchNo" :label="t('transaction.settlement.batchNo')" min-width="210" align="center"><template #default="{ row }"><el-button v-if="row.settlementBatchNo" link type="primary" @click="openBatch(row.settlementBatchNo)">{{ row.settlementBatchNo }}</el-button><span v-else>-</span></template></el-table-column>
            <el-table-column prop="businessDate" :label="t('transaction.settlement.businessDate')" width="118" align="center" />
            <el-table-column prop="expectedReleaseDate" :label="t('transaction.settlement.expectedReleaseDate')" width="140" align="center" />
            <el-table-column :label="t('transaction.settlement.actionTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.actionTime" /></template></el-table-column>
            <el-table-column :label="t('common.operation')" width="92" fixed="right" align="center"><template #default="{ row }"><el-button link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button></template></el-table-column>
        </StandardTable>
        <div v-show="total>0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadData" @size-change="handleSearch" /></div>
        <el-drawer v-model="detailVisible" :title="t('transaction.settlement.reserveDetail')" size="min(760px, 96vw)" destroy-on-close>
            <template v-if="detail">
                <div class="reserve-detail__identity"><strong>{{ detail.reserveActionNo }}</strong><el-tag :type="reserveStatusType(detail.reserveStatus)" effect="plain">{{ enumText('reserveStatusValue', detail.reserveStatus) }}</el-tag></div>
                <div class="reserve-detail__flow"><div><span>{{ t('transaction.settlement.retainedAmount') }}</span><strong>{{ moneyTextByExponent(detail.retainedAmount, detail.currency, detail.currencyExponent) }}</strong></div><div><span>{{ t('transaction.settlement.releasedAmount') }}</span><strong>{{ moneyTextByExponent(detail.releasedAmount, detail.currency, detail.currencyExponent) }}</strong></div><div class="is-current"><span>{{ t('transaction.settlement.remainingAmount') }}</span><strong>{{ moneyTextByExponent(detail.remainingAmount, detail.currency, detail.currencyExponent) }}</strong></div></div>
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item :label="t('transaction.settlement.reserveNo')">{{ detail.reserveNo }}</el-descriptions-item><el-descriptions-item :label="t('transaction.settlement.reserveActionType')">{{ enumText('reserveActionTypeValue', detail.actionType) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.merchantId')"><el-button link type="primary" @click="openMerchant(detail.merchantId)">{{ detail.merchantId }}</el-button></el-descriptions-item><el-descriptions-item :label="t('transaction.settlement.accountId')"><el-button link type="primary" @click="openAccount(detail)">{{ detail.accountId }}</el-button></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.batchNo')" :span="2"><el-button v-if="detail.settlementBatchNo" link type="primary" @click="openBatch(detail.settlementBatchNo)">{{ detail.settlementBatchNo }}</el-button><span v-else>-</span></el-descriptions-item><el-descriptions-item :label="t('transaction.fields.transactionId')" :span="2"><el-button v-if="detail.sourceTransactionId" link type="primary" @click="openTransaction(detail)">{{ detail.sourceTransactionId }}</el-button><span v-else>-</span></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.clearing.direction')"><DirectionTag :direction="detail.direction" :label="enumText('directionValue', detail.direction)" /></el-descriptions-item><el-descriptions-item :label="t('transaction.settlement.postingAmount')">{{ moneyTextByExponent(detail.amount, detail.currency, detail.currencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.returnedAmount')">{{ moneyTextByExponent(detail.returnedAmount, detail.currency, detail.currencyExponent) }}</el-descriptions-item><el-descriptions-item :label="t('transaction.settlement.debitAdjustmentAmount')">{{ moneyTextByExponent(detail.debitAdjustmentAmount, detail.currency, detail.currencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.creditAdjustmentAmount')">{{ moneyTextByExponent(detail.creditAdjustmentAmount, detail.currency, detail.currencyExponent) }}</el-descriptions-item><el-descriptions-item :label="t('transaction.settlement.reversedAmount')">{{ moneyTextByExponent(detail.reversedAmount, detail.currency, detail.currencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.businessDate')">{{ detail.businessDate }}</el-descriptions-item><el-descriptions-item :label="t('transaction.settlement.expectedReleaseDate')">{{ detail.expectedReleaseDate || '-' }}</el-descriptions-item><el-descriptions-item :label="t('transaction.settlement.actionTime')"><BaseDateTime :value="detail.actionTime" /></el-descriptions-item>
                </el-descriptions>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Download, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { DirectionTag } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { exportSettlementReserveItems, searchSettlementReserveItems, type SettlementReserveItem, type SettlementReserveItemQuery } from '@/api/settlement';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import CurrencySelect from '@/views/exchange/CurrencySelect.vue';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import { businessDateFromBusinessNo, defaultDateRange, moneyTextByExponent } from '@/views/settlement/shared';

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const actionTypes = ['HOLD','RETURN','RELEASE','ADJUSTMENT','REVERSAL_HOLD','REVERSAL_RETURN','REVERSAL_RELEASE','REVERSAL_ADJUSTMENT'];
const showSearch=ref(true), loading=ref(false), exporting=ref(false), detailVisible=ref(false);
const rows=ref<SettlementReserveItem[]>([]), total=ref(0), detail=ref<SettlementReserveItem|null>(null), dateRange=ref<[string,string]>(defaultDateRange());
const query=reactive<SettlementReserveItemQuery>({beginBusinessDate:'',endBusinessDate:'',pageNo:1,pageSize:10});
onMounted(async()=>{query.settlementBatchNo=routeText('settlementBatchNo');query.reserveNo=routeText('reserveNo');query.sourceTransactionId=routeText('sourceTransactionId');const linkedBusinessDate=businessDateFromBusinessNo(query.settlementBatchNo);if(linkedBusinessDate)dateRange.value=[linkedBusinessDate,linkedBusinessDate];await loadData();if(query.reserveNo){const linkedRow=rows.value.find((row)=>row.reserveNo===query.reserveNo);if(linkedRow)openDetail(linkedRow)}});
function requestQuery(): SettlementReserveItemQuery { return {...query, settlementBatchNo:query.settlementBatchNo||undefined, merchantId:query.merchantId||undefined, reserveNo:query.reserveNo||undefined, sourceTransactionId:query.sourceTransactionId||undefined, actionType:query.actionType||undefined, currency:query.currency||undefined, beginBusinessDate:dateRange.value[0], endBusinessDate:dateRange.value[1]}; }
async function loadData(){loading.value=true;try{const result=await searchSettlementReserveItems(requestQuery());rows.value=result.records||[];total.value=result.total||0}catch(error){showError(error)}finally{loading.value=false}}
function handleSearch(){query.pageNo=1;loadData()}
function handleReset(){Object.assign(query,{settlementBatchNo:undefined,merchantId:undefined,reserveNo:undefined,sourceTransactionId:undefined,actionType:undefined,currency:undefined,pageNo:1});dateRange.value=defaultDateRange();loadData()}
async function handleExport(){exporting.value=true;try{await exportSettlementReserveItems(requestQuery())}catch(error){showError(error)}finally{exporting.value=false}}
function openDetail(row:SettlementReserveItem){detail.value=row;detailVisible.value=true}
function openMerchant(merchantId:string){router.push({path:'/merchant/info',query:{merchantId}})}
function openAccount(row:SettlementReserveItem){router.push({path:'/fund/account',query:{merchantId:row.merchantId,settlementCurrency:row.currency}})}
function openTransaction(row:SettlementReserveItem){router.push({path:'/transaction/operation',query:{transactionId:row.sourceTransactionId,transactionDateTime:row.sourceTransactionDateTime,transactionTimeZone:'Asia/Shanghai'}})}
function openBatch(settlementBatchNo:string){router.push({path:'/settlement/batches',query:{settlementBatchNo}})}
function routeText(key:string){const value=route.query[key];return typeof value==='string'&&value.trim()?value.trim():undefined}
function enumText(group:string,value?:string){if(!value)return '-';const key=`transaction.settlement.${group}.${value}`;return te(key)?t(key):value}
function reserveStatusType(value?:string){if(value==='RELEASED'||value==='RETURNED')return 'success';if(value==='HELD'||value==='PARTIALLY_RETURNED'||value==='RELEASABLE')return 'warning';if(value==='FROZEN')return 'danger';if(value==='REVERSED')return 'info';return 'primary'}
function showError(error:unknown){ElMessage.error((error as {friendlyMessage?:string})?.friendlyMessage||(error instanceof Error?error.message:t('common.loadFailed')))}
</script>

<style scoped>
.search-form :deep(.el-input),.search-form :deep(.el-select){width:220px}.search-form :deep(.el-date-editor){width:292px}.reserve-detail__identity{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;border-left:4px solid #0f766e;padding:10px 14px;background:#f4f9f8}.reserve-detail__flow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:18px;border:1px solid var(--el-border-color-lighter)}.reserve-detail__flow>div{padding:13px;border-right:1px solid var(--el-border-color-lighter)}.reserve-detail__flow>div:last-child{border-right:0}.reserve-detail__flow span{display:block;color:var(--el-text-color-secondary);font-size:12px}.reserve-detail__flow strong{display:block;margin-top:5px}.reserve-detail__flow .is-current{background:#eef8f5}@media(max-width:640px){.reserve-detail__flow{grid-template-columns:1fr}.reserve-detail__flow>div{border-right:0;border-bottom:1px solid var(--el-border-color-lighter)}}
</style>

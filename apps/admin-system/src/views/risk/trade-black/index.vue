<template>
  <div class="app-container">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="86px">
      <el-form-item :label="$t('risk.common.merchantId')">
        <el-select
          v-model="query.merchantId"
          filterable
          remote
          clearable
          reserve-keyword
          remote-show-suffix
          :remote-method="searchMerchantOptions"
          :loading="merchantLoading"
          :placeholder="t('risk.common.placeholderMerchant')"
          :no-data-text="t('risk.common.noMerchantData')"
          :loading-text="t('risk.common.loadingMerchant')"
          class="query-merchant-select"
          @visible-change="handleMerchantVisibleChange"
        >
          <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('risk.trade.merchantOrderNo')"><el-input v-model.trim="query.merchantOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('risk.trade.paymentOrderNo')"><el-input v-model.trim="query.paymentOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('common.status')"><el-select v-model="query.status" clearable><el-option label="已加黑" :value="1" /><el-option label="已解除" :value="0" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm" v-hasPermi="'risk:tradeBlack:system:add'">{{ $t('common.add') }}</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
    </el-row>
    <el-table v-loading="loading" :data="rows" row-key="id" size="small">
      <el-table-column prop="merchant_id" :label="$t('risk.common.merchantId')" width="130" align="center" />
      <el-table-column prop="merchant_order_no" :label="$t('risk.trade.merchantOrderNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="payment_order_no" :label="$t('risk.trade.paymentOrderNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="black_target_type" :label="$t('risk.trade.targetType')" width="130" align="center" />
      <el-table-column prop="black_target_value_masked" :label="$t('risk.trade.targetValue')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column prop="action_reason" :label="$t('risk.trade.reason')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column :label="$t('common.status')" width="96" align="center"><template #default="{ row }"><el-tag :type="Number(row.status) === 1 ? 'danger' : 'info'" size="small">{{ Number(row.status) === 1 ? '已加黑' : '已解除' }}</el-tag></template></el-table-column>
      <el-table-column :label="$t('common.updateTime')" width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.update_time" /></template></el-table-column>
      <el-table-column :label="$t('common.operation')" width="120" align="center" fixed="right"><template #default="{ row }"><el-button size="small" type="primary" link :disabled="Number(row.status) !== 1" @click="handleRelease(row)" v-hasPermi="'risk:tradeBlack:system:release'">{{ $t('risk.trade.release') }}</el-button></template></el-table-column>
    </el-table>
    <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>
    <el-dialog :title="$t('risk.trade.addTitle')" v-model="formOpen" width="640px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-form-item :label="$t('risk.common.merchantId')">
          <el-select
            v-model="form.merchantId"
            filterable
            remote
            clearable
            reserve-keyword
            remote-show-suffix
            :remote-method="searchMerchantOptions"
            :loading="merchantLoading"
            :placeholder="t('risk.common.placeholderMerchant')"
            :no-data-text="t('risk.common.noMerchantData')"
            :loading-text="t('risk.common.loadingMerchant')"
            style="width:100%"
            @change="handleMerchantChange"
            @visible-change="handleMerchantVisibleChange"
          >
            <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('risk.trade.merchantOrderNo')"><el-input v-model.trim="form.merchantOrderNo" /></el-form-item>
        <el-form-item :label="$t('risk.trade.paymentOrderNo')"><el-input v-model.trim="form.paymentOrderNo" /></el-form-item>
        <el-form-item :label="$t('risk.trade.targetType')" prop="blackTargetType"><el-select v-model="form.blackTargetType" style="width:100%"><el-option label="CARD" value="CARD" /><el-option label="CARD_FINGERPRINT" value="CARD_FINGERPRINT" /><el-option label="EMAIL" value="EMAIL" /><el-option label="PHONE" value="PHONE" /><el-option label="IP" value="IP" /><el-option label="DEVICE" value="DEVICE" /><el-option label="CUSTOMER" value="CUSTOMER" /></el-select></el-form-item>
        <el-form-item :label="$t('risk.trade.targetValue')" prop="blackTargetValueMasked"><el-input v-model.trim="form.blackTargetValueMasked" /></el-form-item>
        <el-form-item :label="$t('risk.trade.targetHash')"><el-input v-model.trim="form.blackTargetHash" /></el-form-item>
        <el-form-item :label="$t('risk.trade.reason')"><el-input v-model.trim="form.actionReason" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button><el-button @click="formOpen = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Refresh, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import { createTradeBlack, pageTradeBlack, releaseTradeBlack, type TradeBlackQuery, type TradeBlackSaveRequest } from '@/api/risk';

const { t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const formOpen = ref(false);
const formRef = ref<FormInstance>();
const merchantLoading = ref(false);
const merchantOptions = ref<MerchantInfo[]>([]);
const query = reactive<TradeBlackQuery>({});
const form = reactive<TradeBlackSaveRequest>({ blackTargetType: 'CARD_FINGERPRINT', blackTargetValueMasked: '', status: 1 });
const rules: FormRules = {
  blackTargetType: [{ required: true, message: t('risk.validation.tradeTargetTypeRequired'), trigger: 'change' }],
  blackTargetValueMasked: [{ required: true, message: t('risk.validation.tradeTargetValueRequired'), trigger: 'blur' }],
};
onMounted(loadData);
async function loadData() { loading.value = true; try { const r = await pageTradeBlack({ ...query, pageNo: page.value, pageSize: pageSize.value }); rows.value = r.records; total.value = r.total; } catch (e: any) { ElMessage.error(e?.message || t('common.loadFailed')); } finally { loading.value = false; } }
function handleSearch() { page.value = 1; loadData(); }
function handleReset() { Object.assign(query, { merchantId: undefined, merchantOrderNo: undefined, paymentOrderNo: undefined, status: undefined }); handleSearch(); }
function openForm() { Object.assign(form, { merchantId: '', merchantOrderNo: '', paymentOrderNo: '', blackTargetType: 'CARD_FINGERPRINT', blackTargetValueMasked: '', blackTargetHash: '', actionReason: '', status: 1 }); formOpen.value = true; }
async function submitForm() { await formRef.value?.validate(); await createTradeBlack(form); ElMessage.success(t('common.saveSuccess')); formOpen.value = false; await loadData(); }
async function handleRelease(row: Record<string, unknown>) { const id = Number(row.id); const { value } = await ElMessageBox.prompt(t('risk.trade.releaseReason'), t('risk.trade.release'), { inputType: 'textarea' }); await releaseTradeBlack(id, value); ElMessage.success(t('common.success')); await loadData(); }

async function searchMerchantOptions(keyword: string) {
  const text = keyword.trim();
  await loadMerchantOptions(text);
}

async function loadMerchantOptions(keyword = '') {
  merchantLoading.value = true;
  try {
    const result = await searchMerchants({ pageNo: 1, pageSize: 20, keyword: keyword || undefined });
    merchantOptions.value = result.records || [];
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    merchantLoading.value = false;
  }
}

function handleMerchantVisibleChange(visible: boolean) {
  if (visible && merchantOptions.value.length === 0) {
    loadMerchantOptions();
  }
}

function handleMerchantChange(merchantId?: string) {
  const selected = merchantOptions.value.find((item) => item.merchantId === merchantId);
  form.merchantName = selected?.merchantName;
}

function merchantOptionLabel(item: MerchantInfo) {
  return item.merchantName ? `${item.merchantId}（${item.merchantName}）` : item.merchantId;
}
</script>

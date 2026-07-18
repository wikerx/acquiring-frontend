<template>
  <div class="app-container merchant-ip-whitelist-page">
    <el-form ref="queryFormRef" v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
      <el-form-item :label="$t('merchant.ipWhitelist.merchantId')" prop="merchantId">
        <el-select
          v-model="query.merchantId"
          filterable
          remote
          clearable
          reserve-keyword
          remote-show-suffix
          :remote-method="remoteSearchMerchants"
          :loading="merchantLoading"
          :placeholder="$t('merchant.ipWhitelist.merchantPlaceholder')"
          class="query-merchant-select"
          @visible-change="handleMerchantVisibleChange"
        >
          <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
        </el-select>
      </el-form-item>
      <el-form-item prop="ipValue">
        <div class="ip-query-control">
          <el-select v-model="query.ipType" class="ip-type-select" :placeholder="$t('merchant.ipWhitelist.ipType')" clearable :teleported="false" aria-label="IP type">
            <el-option label="IP v4" value="IPv4" />
            <el-option label="IP v6" value="IPv6" />
          </el-select>
          <el-input v-model.trim="query.ipValue" :placeholder="$t('merchant.ipWhitelist.ipPlaceholder')" clearable class="ip-address-input" @input="handleIpInput" @keyup.enter="handleSearch" />
        </div>
      </el-form-item>
      <el-form-item :label="$t('common.status')" prop="status">
        <el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option :label="$t('common.enable')" :value="1" />
          <el-option :label="$t('common.disable')" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('merchant.ipWhitelist.accessControl')" prop="ipWhitelistEnabled">
        <el-select v-model="query.ipWhitelistEnabled" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option :label="$t('common.enable')" :value="1" />
          <el-option :label="$t('common.disable')" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
        <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain :icon="Plus" size="small" @click="openForm('add')" v-hasPermi="'merchant:ip-whitelist:add'">{{ $t('common.add') }}</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openManageDrawer(selectedRows[0])" v-hasPermi="'merchant:ip-whitelist:edit'">{{ $t('common.edit') }}</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete()" v-hasPermi="'merchant:ip-whitelist:remove'">{{ $t('common.delete') }}</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain :icon="Download" size="small" :loading="exporting" @click="handleExport" v-hasPermi="'merchant:ip-whitelist:export'">{{ $t('common.export') }}</el-button>
      </el-col>
      <el-col class="right-toolbar">
        <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" />
      </el-col>
    </el-row>

    <StandardTable table-key="merchant-ip-whitelist" v-loading="loading" :data="rows" row-key="merchantId" size="small" @selection-change="selectedRows = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="merchantId" :label="$t('merchant.info.merchantId')" min-width="132" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ row.merchantId || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('merchant.info.merchantName')" min-width="180" align="center" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.merchantName || row.merchantShortName || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="IP" min-width="420" align="center">
        <template #default="{ row }">
          <div v-if="ipItems(row).length" class="ip-pill-list">
            <div v-for="item in ipItems(row)" :key="item.id || item.ipValue" class="ip-pill" :class="[item.ipType === 'IPv6' ? 'is-ipv6' : 'is-ipv4', item.status === 1 ? '' : 'is-disabled']">
              <span>{{ ipTypeLabel(item.ipType) }}</span>
              <code>{{ item.ipValue || '-' }}</code>
              <el-dropdown trigger="click" @command="(command: string) => handleIpCommand(command, row, item)">
                <button class="ip-pill-action" type="button" @click.stop>
                  <el-icon><MoreFilled /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">{{ $t('common.detail') }}</el-dropdown-item>
                    <el-dropdown-item command="edit" v-hasPermi="'merchant:ip-whitelist:edit'">{{ $t('common.edit') }}</el-dropdown-item>
                    <el-dropdown-item command="status" v-hasPermi="'merchant:ip-whitelist:status'">{{ item.status === 1 ? $t('common.disable') : $t('common.enable') }}</el-dropdown-item>
                    <el-dropdown-item command="delete" divided v-hasPermi="'merchant:ip-whitelist:remove'">{{ $t('common.delete') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('merchant.ipWhitelist.accessControl')" width="120" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.ipWhitelistEnabled"
            :active-value="1"
            :inactive-value="0"
            :disabled="!row.merchantId"
            @change="toggleConfig(row)"
            v-hasPermi="'merchant:ip-whitelist:config'"
          />
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.status')" width="100" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="hasDisabledIp(row) ? 'warning' : 'success'" effect="plain">{{ ipStatusSummary(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" :label="$t('common.remark')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column prop="updateBy" :label="$t('merchant.ipWhitelist.updateBy')" width="110" align="center" show-overflow-tooltip />
      <el-table-column :label="$t('common.updateTime')" min-width="170" align="center">
        <template #default="{ row }"><BaseDateTime :value="row.gmtModified" /></template>
      </el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" width="210" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'merchant:ip-whitelist:detail'">{{ $t('common.detail') }}</el-button>
          <el-button size="small" type="primary" link :icon="Edit" @click="openManageDrawer(row)" v-hasPermi="'merchant:ip-whitelist:edit'">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'merchant:ip-whitelist:remove'">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </StandardTable>

    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>

    <el-drawer :title="formMode === 'add' ? $t('merchant.ipWhitelist.addTitle') : $t('merchant.ipWhitelist.editTitle')" v-model="formVisible" size="min(720px, 92vw)" append-to-body destroy-on-close class="merchant-ip-form-drawer">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="112px" size="small" class="ip-form">
        <el-form-item :label="$t('merchant.ipWhitelist.merchant')" prop="merchantId">
          <el-select
            v-model="form.merchantId"
            filterable
            remote
            clearable
            :disabled="formMode === 'edit'"
            :remote-method="remoteSearchMerchants"
            :loading="merchantLoading"
            :placeholder="$t('merchant.ipWhitelist.merchantPlaceholder')"
            style="width:100%"
          >
            <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formMode === 'add'" :label="$t('merchant.ipWhitelist.ipValues')" prop="ipText">
          <el-input v-model="form.ipText" type="textarea" :rows="8" :placeholder="$t('merchant.ipWhitelist.ipValuesPlaceholder')" />
        </el-form-item>
        <el-form-item v-else label="IP" prop="ipValue">
          <el-input v-model.trim="form.ipValue" placeholder="203.0.113.10" />
        </el-form-item>
        <el-form-item :label="$t('common.status')" prop="status">
          <el-select v-model="form.status" style="width:100%">
            <el-option :label="$t('common.enable')" :value="1" />
            <el-option :label="$t('common.disable')" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('common.remark')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="512" show-word-limit :placeholder="$t('common.pleaseInput')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="saving" @click="submitForm">{{ $t('common.confirm') }}</el-button>
          <el-button @click="formVisible = false">{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer :title="$t('merchant.ipWhitelist.manageTitle')" v-model="manageVisible" size="min(860px, 94vw)" append-to-body destroy-on-close class="merchant-ip-manage-drawer">
      <div v-if="manageRow" class="ip-manage">
        <div class="ip-manage__merchant">
          <span>{{ $t('merchant.ipWhitelist.currentMerchant') }}</span>
          <strong>{{ manageRow.merchantId }}</strong>
          <em>{{ manageRow.merchantName || manageRow.merchantShortName || '-' }}</em>
        </div>
        <div class="ip-manage__toolbar">
          <el-button type="primary" plain :icon="Plus" size="small" @click="openMerchantIpAddForm" v-hasPermi="'merchant:ip-whitelist:add'">{{ $t('merchant.ipWhitelist.addIp') }}</el-button>
        </div>
        <el-empty v-if="!ipItems(manageRow).length" :description="$t('merchant.ipWhitelist.emptyIp')" />
        <div v-else class="ip-manage__list">
          <div v-for="item in ipItems(manageRow)" :key="item.id || item.ipValue" class="ip-manage__item">
            <div class="ip-manage__ip">
              <span class="ip-manage__type">{{ ipTypeLabel(item.ipType) }}</span>
              <code>{{ item.ipValue || '-' }}</code>
            </div>
            <el-tag size="small" :type="item.status === 1 ? 'success' : 'info'" effect="plain">{{ item.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag>
            <div class="ip-manage__remark">{{ item.remark || '-' }}</div>
            <div class="ip-manage__actions">
              <el-button size="small" type="primary" link :icon="View" @click="openDetail(manageRow, item)" v-hasPermi="'merchant:ip-whitelist:detail'">{{ $t('common.detail') }}</el-button>
              <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', toSingleIpRow(manageRow, item))" v-hasPermi="'merchant:ip-whitelist:edit'">{{ $t('common.edit') }}</el-button>
              <el-button size="small" type="primary" link @click="toggleStatus(manageRow, item)" v-hasPermi="'merchant:ip-whitelist:status'">{{ item.status === 1 ? $t('common.disable') : $t('common.enable') }}</el-button>
              <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(toSingleIpRow(manageRow, item))" v-hasPermi="'merchant:ip-whitelist:remove'">{{ $t('common.delete') }}</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('merchant.ipWhitelist.detailTitle')" size="lg" :loading="detailLoading">
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item :label="$t('merchant.info.merchantId')">{{ detail.merchantId || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.info.merchantName')">{{ detail.merchantName || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.ipType')">{{ detail.ipType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ detail.ipValue || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.accessControl')">
          <el-tag size="small" :type="detail.ipWhitelistEnabled === 1 ? 'success' : 'info'">{{ detail.ipWhitelistEnabled === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">
          <el-tag size="small" :type="detail.status === 1 ? 'success' : 'danger'">{{ detail.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('common.remark')" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('merchant.ipWhitelist.configRemark')" :span="2">{{ detail.configRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.createTime')"><BaseDateTime :value="detail.gmtCreate" /></el-descriptions-item>
        <el-descriptions-item :label="$t('common.updateTime')"><BaseDateTime :value="detail.gmtModified" /></el-descriptions-item>
      </el-descriptions>
    </CommonDetailDrawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Download, Edit, MoreFilled, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import {
  createMerchantIpWhitelists,
  deleteMerchantIpWhitelist,
  exportMerchantIpWhitelists,
  getMerchantIpWhitelist,
  searchMerchantIpWhitelists,
  updateMerchantIpWhitelist,
  updateMerchantIpWhitelistConfig,
  updateMerchantIpWhitelistStatus,
  type MerchantIpWhitelistItem,
  type MerchantIpWhitelistQuery,
  type MerchantIpWhitelistRow,
} from '@/api/merchant/ip-whitelist';

const { t } = useI18n();
const queryFormRef = ref<FormInstance>();
const formRef = ref<FormInstance>();
const showSearch = ref(true);
const loading = ref(false);
const saving = ref(false);
const exporting = ref(false);
const rows = ref<MerchantIpWhitelistRow[]>([]);
const selectedRows = ref<MerchantIpWhitelistRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const query = reactive<MerchantIpWhitelistQuery>({ pageNo: 1, pageSize: 10 });
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const merchantLoading = ref(false);
const merchantOptions = ref<MerchantInfo[]>([]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<MerchantIpWhitelistRow>();
const manageVisible = ref(false);
const manageRow = ref<MerchantIpWhitelistRow>();
const form = reactive({
  id: '',
  merchantId: '',
  ipText: '',
  ipValue: '',
  status: 1,
  remark: '',
});

const formRules: FormRules = {
  merchantId: [{ required: true, message: t('merchant.ipWhitelist.requiredMerchant'), trigger: 'change' }],
  ipText: [{ required: true, message: t('merchant.ipWhitelist.requiredIp'), trigger: 'blur' }],
  ipValue: [{ required: true, message: t('merchant.ipWhitelist.requiredIp'), trigger: 'blur' }],
};

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const result = await searchMerchantIpWhitelists({ ...cleanQuery(query), pageNo: page.value, pageSize: pageSize.value });
    rows.value = result.records || [];
    total.value = result.total || 0;
    syncManageRow();
  } catch (error) {
    rows.value = [];
    total.value = 0;
    ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  if (page.value === 1) {
    loadData();
    return;
  }
  page.value = 1;
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  Object.keys(query).forEach((key) => delete query[key as keyof MerchantIpWhitelistQuery]);
  handleSearch();
}

function openForm(mode: 'add' | 'edit', row?: MerchantIpWhitelistRow) {
  const editable = firstIpItem(row);
  formMode.value = mode;
  Object.assign(form, {
    id: editable?.id || '',
    merchantId: row?.merchantId || '',
    ipText: '',
    ipValue: editable?.ipValue || '',
    status: editable?.status ?? 1,
    remark: editable?.remark || '',
  });
  if (row?.merchantId) {
    merchantOptions.value = [{
      id: '0',
      merchantId: row.merchantId,
      merchantName: row.merchantName || row.merchantShortName || row.merchantId,
      merchantStatus: 1,
      merchantCategoryCode: '',
      countryCode: '',
      settlementCurrency: '',
      timezone: '',
      riskLevel: 2,
    }];
  }
  formVisible.value = true;
  setTimeout(() => formRef.value?.clearValidate(), 0);
}

function openManageDrawer(row: MerchantIpWhitelistRow) {
  manageRow.value = row;
  manageVisible.value = true;
}

function openMerchantIpAddForm() {
  if (!manageRow.value) {
    return;
  }
  openForm('add', {
    ...manageRow.value,
    id: undefined,
    ipType: undefined,
    ipValue: undefined,
    status: 1,
    remark: '',
    ipWhitelists: undefined,
  });
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (formMode.value === 'add') {
      await createMerchantIpWhitelists({
        merchantId: form.merchantId,
        ipValues: parseIpText(form.ipText),
        status: form.status,
        remark: form.remark || undefined,
      });
    } else {
      await updateMerchantIpWhitelist(form.id, {
        ipValue: form.ipValue,
        status: form.status,
        remark: form.remark || undefined,
      });
    }
    ElMessage.success(t('common.saveSuccess'));
    formVisible.value = false;
    await loadData();
    syncManageRow();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
  } finally {
    saving.value = false;
  }
}

async function openDetail(row: MerchantIpWhitelistRow, item?: MerchantIpWhitelistItem) {
  const target = item || firstIpItem(row);
  if (!target?.id) return;
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getMerchantIpWhitelist(target.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

async function handleDelete(row?: MerchantIpWhitelistRow) {
  const targets = row ? [row] : selectedRows.value;
  const items = targets.flatMap((target) => ipItems(target)).filter((item): item is MerchantIpWhitelistItem => Boolean(item?.id));
  if (!items.length) {
    ElMessage.warning(t('common.pleaseSelect'));
    return;
  }
  try {
    await ElMessageBox.confirm(t('merchant.ipWhitelist.deleteConfirm', { name: items.map((item) => item.ipValue).join('、') }), t('common.delete'), { type: 'warning' });
  } catch {
    return;
  }
  try {
    await Promise.all(items.map((item) => deleteMerchantIpWhitelist(item.id!)));
    ElMessage.success(t('common.deleteSuccess'));
    await loadData();
    syncManageRow();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
  }
}

async function toggleStatus(row: MerchantIpWhitelistRow, item?: MerchantIpWhitelistItem) {
  const target = item || firstIpItem(row);
  if (!target?.id) return;
  const nextStatus = target.status === 1 ? 0 : 1;
  try {
    await ElMessageBox.confirm(t('common.statusToggleConfirm', { action: nextStatus === 1 ? t('common.enable') : t('common.disable'), name: target.ipValue || target.id }), t('common.operationConfirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
  } catch {
    return;
  }
  try {
    await updateMerchantIpWhitelistStatus(target.id, nextStatus);
    ElMessage.success(t('common.success'));
    await loadData();
    syncManageRow();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
  }
}

async function toggleConfig(row: MerchantIpWhitelistRow) {
  const nextStatus = row.ipWhitelistEnabled === 1 ? 0 : 1;
  let remark: string | undefined;
  try {
    const result = await ElMessageBox.prompt(t('merchant.ipWhitelist.configRemarkPrompt'), t('merchant.ipWhitelist.configConfirm', { action: nextStatus === 1 ? t('common.enable') : t('common.disable'), name: row.merchantId }), {
      type: nextStatus === 1 ? 'warning' : 'info',
      inputType: 'textarea',
      inputValue: row.configRemark || '',
      inputPlaceholder: t('merchant.ipWhitelist.configRemarkPlaceholder'),
    });
    remark = result.value;
  } catch {
    return;
  }
  try {
    await updateMerchantIpWhitelistConfig({ merchantId: row.merchantId, ipWhitelistEnabled: nextStatus, remark: remark || undefined });
    ElMessage.success(t('common.success'));
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    await exportMerchantIpWhitelists({ ...cleanQuery(query) });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.exportFailed'));
  } finally {
    exporting.value = false;
  }
}

function handleIpCommand(command: string, row: MerchantIpWhitelistRow, item: MerchantIpWhitelistItem) {
  const target = toSingleIpRow(row, item);
  if (command === 'detail') {
    openDetail(target, item);
    return;
  }
  if (command === 'edit') {
    openForm('edit', target);
    return;
  }
  if (command === 'status') {
    toggleStatus(target, item);
    return;
  }
  if (command === 'delete') {
    handleDelete(target);
  }
}

async function remoteSearchMerchants(keyword: string) {
  const text = keyword.trim();
  merchantLoading.value = true;
  try {
    const result = await searchMerchants({ pageNo: 1, pageSize: 20, keyword: text || undefined });
    merchantOptions.value = result.records || [];
  } finally {
    merchantLoading.value = false;
  }
}

function handleMerchantVisibleChange(visible: boolean) {
  if (visible && merchantOptions.value.length === 0) {
    remoteSearchMerchants('');
  }
}

function handleIpInput(value: string) {
  const nextType = detectIpType(value);
  if (nextType) {
    query.ipType = nextType;
  }
}

function detectIpType(value: string): 'IPv4' | 'IPv6' | undefined {
  const text = String(value || '').trim();
  if (!text) {
    return undefined;
  }
  if (text.includes(':')) {
    return 'IPv6';
  }
  if (/^\d{1,3}(\.\d{1,3}){0,3}$/.test(text)) {
    return 'IPv4';
  }
  return undefined;
}

function parseIpText(value: string) {
  return Array.from(new Set((value || '').split(/[\n,，;\s]+/).map((item) => item.trim()).filter(Boolean)));
}

function merchantOptionLabel(item: MerchantInfo) {
  return `${item.merchantId} / ${item.merchantName || item.merchantShortName || '-'}`;
}

function ipTypeLabel(value?: string) {
  if (value === 'IPv4') {
    return 'IPv4';
  }
  if (value === 'IPv6') {
    return 'IPv6';
  }
  return value || '-';
}

function ipItems(row?: MerchantIpWhitelistRow): MerchantIpWhitelistItem[] {
  if (!row) {
    return [];
  }
  if (row.ipWhitelists?.length) {
    return row.ipWhitelists;
  }
  if (row.id || row.ipValue) {
    return [{
      id: row.id,
      ipType: row.ipType,
      ipValue: row.ipValue,
      status: row.status,
      remark: row.remark,
      updateBy: row.updateBy,
      gmtModified: row.gmtModified,
    }];
  }
  return [];
}

function firstIpItem(row?: MerchantIpWhitelistRow) {
  return ipItems(row)[0];
}

function syncManageRow() {
  if (!manageRow.value?.merchantId) {
    return;
  }
  const refreshed = rows.value.find((row) => row.merchantId === manageRow.value?.merchantId);
  manageRow.value = refreshed || { ...manageRow.value, ipWhitelists: [], id: undefined, ipType: undefined, ipValue: undefined, remark: undefined, status: undefined };
}

function toSingleIpRow(row: MerchantIpWhitelistRow, item: MerchantIpWhitelistItem): MerchantIpWhitelistRow {
  return {
    ...row,
    id: item.id,
    ipType: item.ipType,
    ipValue: item.ipValue,
    status: item.status,
    remark: item.remark,
    updateBy: item.updateBy,
    gmtModified: item.gmtModified,
    ipWhitelists: undefined,
  };
}

function hasDisabledIp(row: MerchantIpWhitelistRow) {
  return ipItems(row).some((item) => item.status !== 1);
}

function ipStatusSummary(row: MerchantIpWhitelistRow) {
  const items = ipItems(row);
  const enabled = items.filter((item) => item.status === 1).length;
  if (!items.length || enabled === items.length) {
    return t('common.enable');
  }
  if (enabled === 0) {
    return t('common.disable');
  }
  return `${enabled}/${items.length}`;
}

function cleanQuery(source: MerchantIpWhitelistQuery) {
  const result: MerchantIpWhitelistQuery = {};
  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      result[key as keyof MerchantIpWhitelistQuery] = value as never;
    }
  });
  return result;
}
</script>

<style scoped>
.query-merchant-select {
  width: 240px;
}

.ip-query-control {
  display: inline-flex;
  align-items: center;
  width: 306px;
  height: 28px;
}

.ip-type-select {
  width: 86px;
  flex: 0 0 86px;
}

.ip-address-input {
  width: 220px;
  flex: 0 0 220px;
}

.ip-type-select :deep(.el-select__wrapper) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.ip-address-input :deep(.el-input__wrapper) {
  margin-left: -1px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.ip-pill-list {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 3px 0;
}

.ip-pill {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #cfe2ff;
  border-radius: 6px;
  background: #f8fbff;
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.08);
  line-height: 1;
  vertical-align: middle;
}

.ip-pill span {
  flex: 0 0 auto;
  padding: 5px 9px;
  border-right: 1px solid #cfe2ff;
  background: #edf5ff;
  color: #1165ff;
  font-size: 12px;
  line-height: 16px;
}

.ip-pill code {
  overflow: hidden;
  min-width: 0;
  padding: 5px 10px;
  color: #1f2d3d;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-pill-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  align-self: stretch;
  border: 0;
  border-left: 1px solid #cfe2ff;
  background: transparent;
  color: #6a8db8;
  cursor: pointer;
}

.ip-pill-action:hover {
  background: #edf5ff;
  color: #1165ff;
}

.ip-pill.is-disabled {
  opacity: 0.62;
}

.ip-pill.is-ipv6 {
  border-color: #dcd7ff;
  background: #fbfaff;
  box-shadow: inset 0 0 0 1px rgba(103, 69, 168, 0.08);
}

.ip-pill.is-ipv6 span {
  border-right-color: #dcd7ff;
  background: #f1efff;
  color: #6745d8;
}

.ip-pill.is-ipv6 code {
  color: #1f2d3d;
}

.ip-pill.is-ipv6 .ip-pill-action {
  border-left-color: #dcd7ff;
  color: #7d6cc0;
}

.ip-pill.is-ipv6 .ip-pill-action:hover {
  background: #f1efff;
  color: #6745d8;
}

.ip-form {
  padding: 0 18px 12px;
}

.ip-manage {
  padding: 0 18px 16px;
}

.ip-manage__merchant {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #e4ecf7;
  border-radius: 6px;
  background: #f8fbff;
}

.ip-manage__merchant span {
  color: #7b8798;
}

.ip-manage__merchant strong {
  color: #1d5eff;
  font-weight: 500;
}

.ip-manage__merchant em {
  overflow: hidden;
  color: #344563;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-manage__toolbar {
  display: flex;
  justify-content: flex-end;
  margin: 12px 0;
}

.ip-manage__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ip-manage__item {
  display: grid;
  grid-template-columns: minmax(260px, 1.4fr) 78px minmax(120px, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #edf0f5;
  border-radius: 6px;
  background: #fff;
}

.ip-manage__ip {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #cfe2ff;
  border-radius: 6px;
  background: #f8fbff;
}

.ip-manage__type {
  flex: 0 0 auto;
  padding: 5px 9px;
  border-right: 1px solid #cfe2ff;
  background: #edf5ff;
  color: #1165ff;
  font-size: 12px;
}

.ip-manage__ip code {
  overflow: hidden;
  min-width: 0;
  padding: 5px 10px;
  color: #1f2d3d;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-manage__remark {
  overflow: hidden;
  color: #667085;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-manage__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

@media (max-width: 760px) {
  .ip-manage__item {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .ip-manage__actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>

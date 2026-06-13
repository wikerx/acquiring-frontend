<template>
  <div class="app-container merchant-info-page">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="82px">
      <el-form-item :label="$t('merchant.info.keyword')">
        <el-input v-model="query.keyword" :placeholder="$t('merchant.info.keywordPlaceholder')" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item :label="$t('common.status')">
        <el-select v-model="query.merchantStatus" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option :label="$t('merchant.info.statusNormal')" :value="1" />
          <el-option :label="$t('merchant.info.statusFrozen')" :value="2" />
          <el-option :label="$t('merchant.info.statusClosed')" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('merchant.info.countryCode')">
        <el-input v-model="query.countryCode" placeholder="USA" clearable maxlength="3" @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
        <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain :icon="Plus" size="small" @click="openForm('add')" v-hasPermi="'merchant:info:add'">{{ $t('common.add') }}</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'merchant:info:edit'">{{ $t('common.edit') }}</el-button>
      </el-col>
      <el-col class="right-toolbar">
        <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" />
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="merchantId" :label="$t('merchant.info.merchantId')" min-width="140" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="merchantName" :label="$t('merchant.info.merchantName')" min-width="190" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="merchantCategoryCode" label="MCC" width="90" align="center" />
      <el-table-column prop="countryCode" :label="$t('merchant.info.countryCode')" width="100" align="center" />
      <el-table-column prop="settlementCurrency" :label="$t('merchant.info.settlementCurrency')" width="110" align="center" />
      <el-table-column :label="$t('merchant.info.riskLevel')" width="100" align="center">
        <template #default="{ row }"><el-tag size="small" :type="riskType(row.riskLevel)">{{ riskText(row.riskLevel) }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="$t('common.status')" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType(row.merchantStatus)">{{ statusText(row.merchantStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('merchant.info.keyStatus')" min-width="210" align="center">
        <template #default="{ row }">
          <div class="key-status-line">
            <span>JWT</span>
            <el-tag size="small" :type="row.jwtKey ? 'success' : 'info'">{{ keyStateText(row.jwtKey) }}</el-tag>
            <em>{{ shortFingerprint(row.jwtKey?.fingerprint) }}</em>
          </div>
          <div class="key-status-line">
            <span>RSA</span>
            <el-tag size="small" :type="row.platformPayloadKey ? 'success' : 'info'">{{ keyStateText(row.platformPayloadKey) }}</el-tag>
            <em>{{ shortFingerprint(row.platformPayloadKey?.fingerprint) }}</em>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="gmtCreate" :label="$t('common.createTime')" min-width="170" align="center" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('common.operation')" align="center" width="300" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'merchant:info:query'">{{ $t('common.detail') }}</el-button>
          <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'merchant:info:edit'">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Key" @click="openKeys(row)" v-hasPermi="'merchant:key:manage'">{{ $t('merchant.info.keyManage') }}</el-button>
          <el-button size="small" type="primary" link :icon="Key" @click="openMaterial(row)" v-hasPermi="'merchant:material:view'">{{ $t('merchant.info.material') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>

    <el-dialog :title="formMode === 'add' ? $t('merchant.info.addTitle') : $t('merchant.info.editTitle')" v-model="formVisible" width="640px" append-to-body destroy-on-close>
      <el-form :model="form" label-width="112px" size="small">
        <el-form-item :label="$t('merchant.info.merchantId')"><el-input v-model="form.merchantId" :disabled="formMode === 'edit'" maxlength="32" /></el-form-item>
        <el-form-item :label="$t('merchant.info.merchantName')"><el-input v-model="form.merchantName" maxlength="128" /></el-form-item>
        <el-form-item :label="$t('merchant.info.shortName')"><el-input v-model="form.merchantShortName" maxlength="64" /></el-form-item>
        <el-form-item label="MCC"><el-input v-model="form.merchantCategoryCode" maxlength="4" placeholder="5311" /></el-form-item>
        <el-form-item :label="$t('merchant.info.countryCode')"><el-input v-model="form.countryCode" maxlength="3" placeholder="USA" /></el-form-item>
        <el-form-item :label="$t('merchant.info.settlementCurrency')"><el-input v-model="form.settlementCurrency" maxlength="3" placeholder="USD" /></el-form-item>
        <el-form-item :label="$t('merchant.info.timezone')">
          <el-select v-model="form.timezone" filterable clearable style="width:100%" :placeholder="$t('common.pleaseSelect')">
            <el-option v-for="item in timezoneOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('common.status')"><el-select v-model="form.merchantStatus" style="width:100%"><el-option :label="$t('merchant.info.statusNormal')" :value="1" /><el-option :label="$t('merchant.info.statusFrozen')" :value="2" /><el-option :label="$t('merchant.info.statusClosed')" :value="3" /></el-select></el-form-item>
        <el-form-item :label="$t('merchant.info.riskLevel')"><el-select v-model="form.riskLevel" style="width:100%"><el-option :label="$t('merchant.info.riskLow')" :value="1" /><el-option :label="$t('merchant.info.riskNormal')" :value="2" /><el-option :label="$t('merchant.info.riskHigh')" :value="3" /></el-select></el-form-item>
        <el-form-item :label="$t('merchant.info.regionCode')"><el-input v-model="form.regionCode" /></el-form-item>
        <el-form-item :label="$t('merchant.info.contactEmail')"><el-input v-model="form.contactEmail" /></el-form-item>
        <el-form-item :label="$t('merchant.info.contactPhone')"><el-input v-model="form.contactPhone" /></el-form-item>
        <el-form-item :label="$t('merchant.info.city')"><el-input v-model="form.city" /></el-form-item>
        <el-form-item :label="$t('merchant.info.address')"><el-input v-model="form.addressLine" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="materialVisible" :title="$t('merchant.info.materialTitle')" size="760px" append-to-body>
      <template v-if="currentMerchant">
        <el-alert class="mb16" type="warning" :closable="false" :title="$t('merchant.info.secretWarning')" />
        <el-descriptions :column="1" border size="small" class="mb16">
          <el-descriptions-item :label="$t('merchant.info.merchantId')">{{ currentMerchant.merchantId }}</el-descriptions-item>
          <el-descriptions-item :label="$t('merchant.info.merchantName')">{{ currentMerchant.merchantName }}</el-descriptions-item>
          <el-descriptions-item label="JWT">{{ keySummaryText(currentMerchant.jwtKey) }}</el-descriptions-item>
          <el-descriptions-item label="Platform RSA">{{ keySummaryText(currentMerchant.platformPayloadKey) }}</el-descriptions-item>
          <el-descriptions-item label="Response RSA">{{ keySummaryText(currentMerchant.responseKey) }}</el-descriptions-item>
        </el-descriptions>
        <div class="material-actions">
          <el-button type="primary" :icon="Key" @click="provisionMaterial" v-hasPermi="'merchant:material:view'">{{ $t('merchant.info.provision') }}</el-button>
          <el-button :icon="Refresh" @click="rotateJwt" v-hasPermi="'merchant:key:rotate'">{{ $t('merchant.info.rotateJwt') }}</el-button>
          <el-button :icon="Refresh" @click="rotatePlatform" v-hasPermi="'merchant:platform-payload-key:rotate'">{{ $t('merchant.info.rotatePlatform') }}</el-button>
          <el-button :icon="Refresh" @click="rotateResponse" v-hasPermi="'merchant:response-key:update'">{{ $t('merchant.info.rotateResponse') }}</el-button>
        </div>
        <el-divider />
        <el-empty v-if="!material" :description="$t('merchant.info.noMaterial')" />
        <div v-else class="secret-preview-list" v-hasPermi="'merchant:material:view'">
          <div v-if="material.merchantKey" class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>merchantKey</strong>
                <p>{{ $t('merchant.info.merchantKeyHelp') }}</p>
              </div>
              <div class="secret-preview__actions">
                <el-button size="small" @click="copySecret('merchantKey', material.merchantKey)">{{ $t('merchant.info.copy') }}</el-button>
                <el-button size="small" @click="downloadSecret('merchantKey.txt', material.merchantKey)">{{ $t('merchant.info.download') }}</el-button>
              </div>
            </div>
            <el-input :model-value="material.merchantKey" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" readonly />
          </div>
          <div v-if="material.platformPublicKeyX509Base64" class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>platformPublicKeyX509Base64</strong>
                <p>{{ $t('merchant.info.platformPublicKeyHelp') }}</p>
              </div>
              <div class="secret-preview__actions">
                <el-button size="small" @click="copySecret('platformPublicKeyX509Base64', material.platformPublicKeyX509Base64)">{{ $t('merchant.info.copy') }}</el-button>
                <el-button size="small" @click="downloadSecret('platformPublicKeyX509Base64.txt', material.platformPublicKeyX509Base64)">{{ $t('merchant.info.download') }}</el-button>
              </div>
            </div>
            <el-input :model-value="material.platformPublicKeyX509Base64" type="textarea" :autosize="{ minRows: 6, maxRows: 12 }" readonly />
          </div>
          <div v-if="material.merchantResponsePublicKeyX509Base64" class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>merchantResponsePublicKeyX509Base64</strong>
                <p>{{ $t('merchant.info.responsePublicKeyHelp') }}</p>
              </div>
              <div class="secret-preview__actions">
                <el-button size="small" @click="copySecret('merchantResponsePublicKeyX509Base64', material.merchantResponsePublicKeyX509Base64)">{{ $t('merchant.info.copy') }}</el-button>
                <el-button size="small" @click="downloadSecret('merchantResponsePublicKeyX509Base64.txt', material.merchantResponsePublicKeyX509Base64)">{{ $t('merchant.info.download') }}</el-button>
              </div>
            </div>
            <el-input :model-value="material.merchantResponsePublicKeyX509Base64" type="textarea" :autosize="{ minRows: 6, maxRows: 12 }" readonly />
          </div>
          <div v-if="material.merchantResponsePrivateKeyPkcs8Base64" class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>merchantResponsePrivateKeyPkcs8Base64</strong>
                <p>{{ $t('merchant.info.responsePrivateKeyHelp') }}</p>
              </div>
              <div class="secret-preview__actions">
                <el-button size="small" @click="copySecret('merchantResponsePrivateKeyPkcs8Base64', material.merchantResponsePrivateKeyPkcs8Base64)">{{ $t('merchant.info.copy') }}</el-button>
                <el-button size="small" @click="downloadSecret('merchantResponsePrivateKeyPkcs8Base64.txt', material.merchantResponsePrivateKeyPkcs8Base64)">{{ $t('merchant.info.download') }}</el-button>
              </div>
            </div>
            <el-input :model-value="material.merchantResponsePrivateKeyPkcs8Base64" type="textarea" :autosize="{ minRows: 8, maxRows: 14 }" readonly />
          </div>
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="keysVisible" :title="$t('merchant.info.keyManageTitle')" size="860px" append-to-body>
      <template v-if="keyBundle">
        <el-alert class="mb16" type="info" :closable="false" :title="$t('merchant.info.keyManageWarning')" />
        <el-descriptions :column="1" border size="small" class="mb16">
          <el-descriptions-item :label="$t('merchant.info.merchantId')">{{ keyBundle.merchantId }}</el-descriptions-item>
          <el-descriptions-item :label="$t('merchant.info.merchantName')">{{ keyBundle.merchantName }}</el-descriptions-item>
        </el-descriptions>
        <div class="secret-preview-list">
          <div v-for="item in keyBundle.keys" :key="`${item.keyType}-${item.keyVersion || item.fingerprint}`" class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>{{ keyTitle(item) }}</strong>
                <p>{{ item.usage }}</p>
              </div>
              <el-tag size="small" :type="item.enabled === 1 ? 'success' : 'info'">{{ item.enabled === 1 ? $t('merchant.info.configured') : $t('merchant.info.disabled') }}</el-tag>
            </div>
            <el-descriptions :column="1" border size="small" class="mb12">
              <el-descriptions-item :label="$t('merchant.info.owner')">{{ item.owner || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.algorithm')">{{ item.algorithm || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.keySize')">{{ item.keySize || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.fingerprint')">{{ item.fingerprint || '-' }}</el-descriptions-item>
              <el-descriptions-item v-if="item.keyVersion" :label="$t('merchant.info.keyVersion')">{{ item.keyVersion }}</el-descriptions-item>
              <el-descriptions-item v-if="item.gmtModified" :label="$t('common.updateTime')">{{ item.gmtModified }}</el-descriptions-item>
            </el-descriptions>
            <div v-if="item.merchantKey" class="key-value-block">
              <div class="secret-preview__header compact">
                <div><strong>merchantKey</strong><p>{{ $t('merchant.info.merchantKeyHelp') }}</p></div>
                <div class="secret-preview__actions">
                  <el-button size="small" @click="copySecret('merchantKey', item.merchantKey)">{{ $t('merchant.info.copy') }}</el-button>
                  <el-button size="small" @click="downloadSecret('merchantKey.txt', item.merchantKey)">{{ $t('merchant.info.download') }}</el-button>
                </div>
              </div>
              <el-input :model-value="item.merchantKey" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" readonly />
            </div>
            <div v-if="item.publicKeyX509Base64" class="key-value-block">
              <div class="secret-preview__header compact">
                <div><strong>{{ publicKeyTitle(item) }}</strong><p>{{ publicKeyHelp(item) }}</p></div>
                <div class="secret-preview__actions">
                  <el-button size="small" @click="copySecret(publicKeyTitle(item), item.publicKeyX509Base64)">{{ $t('merchant.info.copy') }}</el-button>
                  <el-button size="small" @click="downloadSecret(`${publicKeyTitle(item)}.txt`, item.publicKeyX509Base64)">{{ $t('merchant.info.download') }}</el-button>
                </div>
              </div>
              <el-input :model-value="item.publicKeyX509Base64" type="textarea" :autosize="{ minRows: 6, maxRows: 12 }" readonly />
            </div>
            <div v-if="item.privateKeyPkcs8Base64" class="key-value-block">
              <div class="secret-preview__header compact">
                <div><strong>{{ privateKeyTitle(item) }}</strong><p>{{ privateKeyHelp(item) }}</p></div>
                <div class="secret-preview__actions">
                  <el-button size="small" @click="copySecret(privateKeyTitle(item), item.privateKeyPkcs8Base64)">{{ $t('merchant.info.copy') }}</el-button>
                  <el-button size="small" @click="downloadSecret(`${privateKeyTitle(item)}.txt`, item.privateKeyPkcs8Base64)">{{ $t('merchant.info.download') }}</el-button>
                </div>
              </div>
              <el-input :model-value="item.privateKeyPkcs8Base64" type="textarea" :autosize="{ minRows: 8, maxRows: 14 }" readonly />
            </div>
            <el-alert v-else-if="item.keyType === 'MERCHANT_RESPONSE_PAYLOAD_RSA'" type="warning" :closable="false" :title="$t('merchant.info.responsePrivateMissing')" />
          </div>
        </div>
        <template v-if="keyBundle.keys.length === 0">
          <el-empty :description="$t('merchant.info.noKeys')" />
        </template>
        <div class="drawer-footer">
          <el-button type="primary" @click="openResponseKeyUpdate" v-hasPermi="'merchant:response-key:update'">{{ $t('merchant.info.updateResponseKey') }}</el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="responseKeyVisible" :title="$t('merchant.info.updateResponseKey')" width="680px" append-to-body destroy-on-close>
      <el-form label-position="top" size="small">
        <el-form-item label="merchantResponsePublicKeyX509Base64">
          <el-input v-model="responseKeyForm.publicKeyX509Base64" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="merchantResponsePrivateKeyPkcs8Base64">
          <el-input v-model="responseKeyForm.privateKeyPkcs8Base64" type="textarea" :rows="8" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="responseKeyVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitResponseKey">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Key, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import {
  createMerchant,
  getMerchantKeys,
  provisionSecurityMaterial,
  rotateJwtKey,
  rotateMerchantResponseKey,
  rotatePlatformPayloadKey,
  searchMerchants,
  updateMerchant,
  updateMerchantResponseKey,
  type MerchantKeyBundle,
  type MerchantKeyMaterial,
  type MerchantInfo,
  type MerchantSaveRequest,
  type MerchantSecurityMaterial,
  type MerchantKeySummary,
} from '@/api/merchant/info';
import { searchDictData, type SysDictData } from '@/api/system/dict';

const { t, locale } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<MerchantInfo[]>([]);
const selectedRows = ref<MerchantInfo[]>([]);
const timezoneOptions = ref<SysDictData[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const query = reactive<{ keyword: string; merchantStatus?: number; countryCode: string }>({ keyword: '', merchantStatus: undefined, countryCode: '' });

const emptyForm = (): MerchantSaveRequest => ({
  merchantId: '',
  merchantName: '',
  merchantShortName: '',
  merchantStatus: 1,
  merchantCategoryCode: '',
  countryCode: '',
  regionCode: '',
  city: '',
  addressLine: '',
  contactEmail: '',
  contactPhone: '',
  settlementCurrency: 'USD',
  timezone: 'Asia/Shanghai',
  riskLevel: 2,
});
const form = reactive<MerchantSaveRequest>(emptyForm());
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const editingId = ref<number>();
const materialVisible = ref(false);
const currentMerchant = ref<MerchantInfo>();
const material = ref<MerchantSecurityMaterial>();
const keysVisible = ref(false);
const keyBundle = ref<MerchantKeyBundle>();
const responseKeyVisible = ref(false);
const responseKeyForm = reactive({ publicKeyX509Base64: '', privateKeyPkcs8Base64: '' });

onMounted(() => {
  loadData();
  loadTimezones();
});

async function loadData() {
  loading.value = true;
  try {
    const result = await searchMerchants({ pageNo: page.value, pageSize: pageSize.value, keyword: query.keyword || undefined, merchantStatus: query.merchantStatus, countryCode: query.countryCode || undefined });
    rows.value = result.records;
    total.value = result.total;
  } catch {
    rows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() { page.value = 1; loadData(); }
function resetQuery() { query.keyword = ''; query.merchantStatus = undefined; query.countryCode = ''; handleSearch(); }
function openForm(mode: 'add' | 'edit', row?: MerchantInfo) {
  formMode.value = mode;
  editingId.value = row?.id;
  Object.assign(form, emptyForm(), row || {});
  formVisible.value = true;
}
function openDetail(row: MerchantInfo) { openMaterial(row); }
function openMaterial(row: MerchantInfo) { currentMerchant.value = row; material.value = undefined; materialVisible.value = true; }

async function loadTimezones() {
  try {
    const result = await searchDictData({ pageNo: 1, pageSize: 1000, dictType: 'sys_timezone', locale: String(locale.value), status: 1 });
    timezoneOptions.value = result.records;
  } catch {
    timezoneOptions.value = [];
  }
}

async function submitForm() {
  try {
    if (formMode.value === 'add') await createMerchant(form);
    else if (editingId.value) await updateMerchant(editingId.value, form);
    ElMessage.success(t('common.saveSuccess'));
    formVisible.value = false;
    loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}

async function provisionMaterial() {
  if (!currentMerchant.value) return;
  try {
    await confirmSecretAction(t('merchant.info.provision'));
    material.value = await provisionSecurityMaterial(currentMerchant.value.merchantId);
    ElMessage.success(t('common.success'));
    loadData();
  } catch { /* cancelled or failed */ }
}
async function rotateJwt() {
  if (!currentMerchant.value) return;
  try { await confirmSecretAction(t('merchant.info.rotateJwt')); material.value = await rotateJwtKey(currentMerchant.value.merchantId); ElMessage.success(t('common.success')); loadData(); } catch { /* ignore */ }
}
async function rotatePlatform() {
  if (!currentMerchant.value) return;
  try { await confirmSecretAction(t('merchant.info.rotatePlatform')); material.value = await rotatePlatformPayloadKey(currentMerchant.value.merchantId); ElMessage.success(t('common.success')); loadData(); } catch { /* ignore */ }
}
async function rotateResponse() {
  if (!currentMerchant.value) return;
  try { await confirmSecretAction(t('merchant.info.rotateResponse')); material.value = await rotateMerchantResponseKey(currentMerchant.value.merchantId); ElMessage.success(t('common.success')); loadData(); } catch { /* ignore */ }
}

async function openKeys(row: MerchantInfo) {
  currentMerchant.value = row;
  keysVisible.value = true;
  keyBundle.value = undefined;
  try {
    keyBundle.value = await getMerchantKeys(row.merchantId);
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}

function openResponseKeyUpdate() {
  const responseKey = keyBundle.value?.keys.find(item => item.keyType === 'MERCHANT_RESPONSE_PAYLOAD_RSA');
  responseKeyForm.publicKeyX509Base64 = responseKey?.publicKeyX509Base64 || '';
  responseKeyForm.privateKeyPkcs8Base64 = responseKey?.privateKeyPkcs8Base64 || '';
  responseKeyVisible.value = true;
}

async function submitResponseKey() {
  if (!keyBundle.value) return;
  try {
    await updateMerchantResponseKey(keyBundle.value.merchantId, responseKeyForm.publicKeyX509Base64, responseKeyForm.privateKeyPkcs8Base64);
    ElMessage.success(t('common.saveSuccess'));
    responseKeyVisible.value = false;
    keyBundle.value = await getMerchantKeys(keyBundle.value.merchantId);
    loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}

async function confirmSecretAction(action: string) {
  await ElMessageBox.confirm(t('merchant.info.secretConfirm', { action }), t('common.operationConfirm'), { type: 'warning' });
}

async function copySecret(name: string, value?: string) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  ElMessage.success(t('merchant.info.copySuccess', { name }));
}

function downloadSecret(fileName: string, value?: string) {
  if (!value) return;
  const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentMerchant.value?.merchantId || 'merchant'}-${fileName}`;
  link.click();
  URL.revokeObjectURL(url);
}

function statusText(status: number) {
  return status === 1 ? t('merchant.info.statusNormal') : status === 2 ? t('merchant.info.statusFrozen') : t('merchant.info.statusClosed');
}
function statusType(status: number) {
  return status === 1 ? 'success' : status === 2 ? 'warning' : 'danger';
}
function riskText(level: number) {
  return level === 1 ? t('merchant.info.riskLow') : level === 3 ? t('merchant.info.riskHigh') : t('merchant.info.riskNormal');
}
function riskType(level: number) {
  return level === 1 ? 'success' : level === 3 ? 'danger' : 'warning';
}

function keyStateText(key?: MerchantKeySummary) {
  return key ? t('merchant.info.configured') : t('merchant.info.notConfigured');
}

function shortFingerprint(value?: string) {
  if (!value) return '-';
  return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-6)}` : value;
}

function keySummaryText(key?: MerchantKeySummary) {
  if (!key) return t('merchant.info.notConfigured');
  return `${key.algorithm || '-'} / ${key.keySize || '-'} / ${key.fingerprint || '-'}`;
}

function keyTitle(item: MerchantKeyMaterial) {
  if (item.keyType === 'MERCHANT_JWT') return 'merchantKey';
  if (item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA') return 'platformPayloadKey';
  if (item.keyType === 'MERCHANT_RESPONSE_PAYLOAD_RSA') return 'merchantResponseKey';
  return item.keyName || item.keyType;
}

function publicKeyTitle(item: MerchantKeyMaterial) {
  return item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA' ? 'platformPublicKeyX509Base64' : 'merchantResponsePublicKeyX509Base64';
}

function privateKeyTitle(item: MerchantKeyMaterial) {
  return item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA' ? 'platformPrivateKeyPkcs8Base64' : 'merchantResponsePrivateKeyPkcs8Base64';
}

function publicKeyHelp(item: MerchantKeyMaterial) {
  return item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA' ? t('merchant.info.platformPublicKeyHelp') : t('merchant.info.responsePublicKeyHelp');
}

function privateKeyHelp(item: MerchantKeyMaterial) {
  return item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA' ? t('merchant.info.platformPrivateKeyHelp') : t('merchant.info.responsePrivateKeyHelp');
}
</script>

<style scoped>
.merchant-info-page .key-status-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  line-height: 22px;
  white-space: nowrap;
}

.merchant-info-page .key-status-line span {
  width: 32px;
  color: #606266;
}

.merchant-info-page .key-status-line em {
  max-width: 92px;
  overflow: hidden;
  color: #909399;
  font-style: normal;
  text-overflow: ellipsis;
}

.material-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mb16 {
  margin-bottom: 16px;
}

.mb12 {
  margin-bottom: 12px;
}

.secret-preview-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.secret-preview {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 12px;
  background: #fff;
}

.secret-preview__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.secret-preview__header strong {
  display: block;
  color: #303133;
  font-size: 13px;
  line-height: 20px;
}

.secret-preview__header p {
  margin: 2px 0 0;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

.secret-preview__actions {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}

.secret-preview__header.compact {
  margin-top: 8px;
}

.key-value-block + .key-value-block {
  margin-top: 12px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

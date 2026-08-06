<template>
    <div class="app-container email-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="86px">
            <el-form-item :label="t('email.account.accountName')">
                <el-input v-model.trim="query.accountName" :placeholder="t('email.common.keywordPlaceholder')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('email.account.fromEmail')">
                <el-input v-model.trim="query.fromEmail" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('email.common.appCode')">
                <el-select v-model="query.appCode" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in appOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('email.common.scopeType')">
                <el-select v-model="query.scopeType" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in scopeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('email.common.sceneCode')">
                <el-select v-model="query.sceneCode" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in sceneOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.status" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option :label="t('common.enable')" :value="1" />
                    <el-option :label="t('common.disable')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'email:account:add'">{{ t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'email:account:edit'">{{ t('common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'email:account:remove'">{{ t('common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="email-account" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="accountCode" :label="t('email.account.accountCode')" min-width="150" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="accountName" :label="t('email.account.accountName')" min-width="170" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('email.common.scopeType')" min-width="120" align="center">
                <template #default="{ row }">{{ optionLabel(scopeOptions, row.scopeType) }}</template>
            </el-table-column>
            <el-table-column :label="t('email.common.sceneCode')" min-width="140" align="center">
                <template #default="{ row }">{{ optionLabel(sceneOptions, row.sceneCode) }}</template>
            </el-table-column>
            <el-table-column prop="fromEmail" :label="t('email.account.fromEmail')" min-width="200" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('email.account.smtp')" min-width="170" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">{{ row.smtpHost }}:{{ row.smtpPort }}</template>
            </el-table-column>
            <el-table-column :label="t('email.account.defaultFlag')" width="92" align="center">
                <template #default="{ row }"><el-tag size="small" :type="row.defaultFlag === 1 ? 'success' : 'info'">{{ row.defaultFlag === 1 ? t('common.yes') : t('common.no') }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('email.account.verifyStatus')" width="110" align="center">
                <template #default="{ row }"><el-tag size="small" :type="row.verifyStatus === 1 ? 'success' : row.verifyStatus === 2 ? 'danger' : 'warning'">{{ optionLabel(verifyOptions, String(row.verifyStatus ?? '0')) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('common.status')" width="86" align="center">
                <template #default="{ row }">
                    <el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'email:account:status'" />
                </template>
            </el-table-column>
            <el-table-column :label="t('common.updateTime')" min-width="170" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="360" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'email:account:detail'">{{ t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'email:account:edit'">{{ t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Star" @click="handleSetDefault(row)" v-hasPermi="'email:account:default'">{{ t('email.account.setDefault') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Promotion" @click="openTest(row)" v-hasPermi="'email:account:test'">{{ t('email.account.test') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'email:account:remove'">{{ t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('email.account.detailTitle')" size="lg">
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="t('email.account.accountCode')">{{ detailRow.accountCode }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.accountName')">{{ detailRow.accountName }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.common.appCode')">{{ optionLabel(appOptions, detailRow.appCode) }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.common.scopeType')">{{ optionLabel(scopeOptions, detailRow.scopeType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.common.merchant')">{{ detailRow.merchantName || detailRow.merchantNo || detailRow.merchantId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.common.sceneCode')">{{ optionLabel(sceneOptions, detailRow.sceneCode) }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.providerType')">{{ optionLabel(providerOptions, detailRow.providerType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.fromName')">{{ detailRow.fromName }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.fromEmail')">{{ detailRow.fromEmail }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.replyToEmail')">{{ detailRow.replyToEmail || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.smtp')">{{ detailRow.smtpHost }}:{{ detailRow.smtpPort }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.encryptionType')">{{ optionLabel(encryptionOptions, detailRow.encryptionType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.smtpUsername')">{{ detailRow.smtpUsername }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.smtpPassword')">{{ maskSecret(detailRow.passwordConfigured) }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.limit')">{{ detailRow.minuteLimit ?? '-' }} / {{ detailRow.dailyLimit ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.defaultFlag')"><el-tag size="small" :type="detailRow.defaultFlag === 1 ? 'success' : 'info'">{{ detailRow.defaultFlag === 1 ? t('common.yes') : t('common.no') }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('email.account.verifyStatus')">{{ optionLabel(verifyOptions, String(detailRow.verifyStatus ?? '0')) }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.status')"><el-tag size="small" :type="statusType(detailRow.status)">{{ detailRow.status === 1 ? t('common.enable') : t('common.disable') }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('email.account.lastTestTime')"><BaseDateTime :value="detailRow.lastTestTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('email.account.lastErrorMessage')">{{ detailRow.lastErrorMessage || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>

        <el-dialog :title="formMode === 'create' ? t('email.account.addTitle') : t('email.account.editTitle')" v-model="formVisible" width="780px" top="5vh" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="126px" size="small">
                <div class="form-grid">
                    <el-form-item :label="t('email.account.accountName')" prop="accountName"><el-input v-model.trim="form.accountName" maxlength="128" :placeholder="t('email.account.placeholder.accountName')" /></el-form-item>
                    <el-form-item :label="t('email.common.appCode')" prop="appCode"><el-select v-model="form.appCode" filterable style="width:100%" :placeholder="t('email.account.placeholder.appCode')"><el-option v-for="item in appOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="t('email.common.scopeType')" prop="scopeType"><el-select v-model="form.scopeType" style="width:100%" :placeholder="t('email.account.placeholder.scopeType')" @change="handleScopeChange"><el-option v-for="item in scopeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item v-if="form.scopeType === 'MERCHANT'" :label="t('email.common.merchant')" prop="merchantId">
                        <el-select
                            v-model="form.merchantId"
                            filterable
                            remote
                            clearable
                            reserve-keyword
                            :remote-method="searchMerchantOptions"
                            :loading="merchantLoading"
                            :placeholder="t('email.account.placeholder.merchant')"
                            style="width:100%"
                            @change="handleMerchantChange"
                            @clear="clearMerchant"
                        >
                            <el-option
                                v-for="item in merchantOptions"
                                :key="item.merchantId"
                                :label="merchantOptionLabel(item)"
                                :value="item.merchantId"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('email.common.sceneCode')"><el-select v-model="form.sceneCode" filterable clearable style="width:100%" :placeholder="t('email.account.placeholder.sceneCode')"><el-option v-for="item in sceneOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="t('email.account.providerType')"><el-select v-model="form.providerType" clearable style="width:100%" :placeholder="t('email.account.placeholder.providerType')"><el-option v-for="item in providerOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="t('email.account.fromName')" prop="fromName"><el-input v-model.trim="form.fromName" maxlength="128" :placeholder="t('email.account.placeholder.fromName')" /></el-form-item>
                    <el-form-item :label="t('email.account.fromEmail')" prop="fromEmail"><el-input v-model.trim="form.fromEmail" maxlength="128" :placeholder="t('email.account.placeholder.fromEmail')" /></el-form-item>
                    <el-form-item :label="t('email.account.replyToEmail')" prop="replyToEmail"><el-input v-model.trim="form.replyToEmail" maxlength="128" :placeholder="t('email.account.placeholder.replyToEmail')" /></el-form-item>
                    <el-form-item :label="t('email.account.smtpHost')" prop="smtpHost"><el-input v-model.trim="form.smtpHost" maxlength="128" :placeholder="t('email.account.placeholder.smtpHost')" /></el-form-item>
                    <el-form-item :label="t('email.account.smtpPort')" prop="smtpPort"><el-input-number v-model="form.smtpPort" :min="1" :max="65535" :placeholder="t('email.account.placeholder.smtpPort')" style="width:100%" /></el-form-item>
                    <el-form-item :label="t('email.account.encryptionType')" prop="encryptionType"><el-select v-model="form.encryptionType" style="width:100%" :placeholder="t('email.account.placeholder.encryptionType')"><el-option v-for="item in encryptionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="t('email.account.smtpAuthRequired')"><el-switch v-model="form.smtpAuthRequired" :active-value="1" :inactive-value="0" /></el-form-item>
                    <el-form-item :label="t('email.account.smtpUsername')" prop="smtpUsername"><el-input v-model.trim="form.smtpUsername" maxlength="128" :placeholder="t('email.account.placeholder.smtpUsername')" /></el-form-item>
                    <el-form-item :label="t('email.account.smtpPassword')" :prop="formMode === 'create' ? 'smtpPassword' : undefined"><el-input v-model="form.smtpPassword" type="password" show-password maxlength="256" :placeholder="formMode === 'edit' ? t('email.account.passwordKeepHint') : t('email.account.placeholder.smtpPassword')" /></el-form-item>
                    <el-form-item :label="t('email.account.connectTimeoutMs')"><el-input-number v-model="form.connectTimeoutMs" :min="1000" :step="1000" :placeholder="t('email.account.placeholder.connectTimeoutMs')" style="width:100%" /></el-form-item>
                    <el-form-item :label="t('email.account.readTimeoutMs')"><el-input-number v-model="form.readTimeoutMs" :min="1000" :step="1000" :placeholder="t('email.account.placeholder.readTimeoutMs')" style="width:100%" /></el-form-item>
                    <el-form-item :label="t('email.account.minuteLimit')"><el-input-number v-model="form.minuteLimit" :min="0" :placeholder="t('email.account.placeholder.minuteLimit')" style="width:100%" /></el-form-item>
                    <el-form-item :label="t('email.account.dailyLimit')"><el-input-number v-model="form.dailyLimit" :min="0" :placeholder="t('email.account.placeholder.dailyLimit')" style="width:100%" /></el-form-item>
                    <el-form-item :label="t('email.account.defaultFlag')"><el-switch v-model="form.defaultFlag" :active-value="1" :inactive-value="0" /></el-form-item>
                    <el-form-item :label="t('common.status')"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" /></el-form-item>
                    <el-form-item :label="t('common.sort')"><el-input-number v-model="form.sortOrder" :min="0" :placeholder="t('email.account.placeholder.sortOrder')" style="width:100%" /></el-form-item>
                </div>
                <el-form-item :label="t('common.remark')"><el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit :placeholder="t('email.account.placeholder.remark')" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ t('common.confirm') }}</el-button>
                    <el-button @click="formVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog :title="t('email.account.testTitle')" v-model="testVisible" width="560px" append-to-body destroy-on-close>
            <el-form ref="testFormRef" :model="testForm" :rules="testRules" label-width="92px" size="small">
                <el-form-item :label="t('email.account.toEmail')" prop="toEmail"><el-input v-model.trim="testForm.toEmail" :placeholder="t('email.account.placeholder.toEmail')" /></el-form-item>
                <el-form-item :label="t('email.template.subjectTemplate')"><el-input v-model="testForm.subject" :placeholder="t('email.account.placeholder.testSubject')" /></el-form-item>
                <el-form-item :label="t('email.template.contentTemplate')"><el-input v-model="testForm.content" type="textarea" :rows="5" :placeholder="t('email.account.placeholder.testContent')" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitTest">{{ t('email.account.sendTest') }}</el-button>
                    <el-button @click="testVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Edit, Plus, Promotion, Refresh, Search, Star, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    createEmailAccount,
    deleteEmailAccount,
    getEmailAccount,
    searchEmailAccounts,
    setDefaultEmailAccount,
    testEmailAccount,
    updateEmailAccount,
    updateEmailAccountStatus,
    type EmailAccount,
} from '@/api/email';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import { loadEmailDictOptions, maskSecret, optionLabel, showEmailError, statusType, type SelectOption } from '../shared';

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<EmailAccount[]>([]);
const selectedRows = ref<EmailAccount[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const appOptions = ref<SelectOption[]>([]);
const scopeOptions = ref<SelectOption[]>([]);
const sceneOptions = ref<SelectOption[]>([]);
const providerOptions = ref<SelectOption[]>([]);
const encryptionOptions = ref<SelectOption[]>([]);
const verifyOptions = ref<SelectOption[]>([]);
const merchantOptions = ref<MerchantInfo[]>([]);
const merchantLoading = ref(false);
const detailVisible = ref(false);
const detailRow = ref<EmailAccount | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const testVisible = ref(false);
const testFormRef = ref<FormInstance>();
const testAccount = ref<EmailAccount | null>(null);

const query = reactive({
    appCode: undefined as string | undefined,
    scopeType: undefined as string | undefined,
    accountName: '',
    fromEmail: '',
    sceneCode: undefined as string | undefined,
    status: undefined as number | undefined,
    verifyStatus: undefined as number | undefined,
});

const emptyForm = () => ({
    id: 0,
    accountCode: '',
    accountName: '',
    appCode: 'ADMIN',
    scopeType: 'SYSTEM',
    merchantId: '',
    merchantNo: '',
    merchantName: '',
    sceneCode: 'COMMON',
    providerType: 'SMTP',
    fromName: '',
    fromEmail: '',
    replyToEmail: '',
    smtpHost: '',
    smtpPort: 465,
    encryptionType: 'SSL',
    smtpAuthRequired: 1,
    smtpUsername: '',
    smtpPassword: '',
    connectTimeoutMs: 10000,
    readTimeoutMs: 10000,
    defaultFlag: 0,
    status: 1,
    minuteLimit: 60,
    dailyLimit: 1000,
    remark: '',
    sortOrder: 0,
});
const form = reactive(emptyForm());
const testForm = reactive({ toEmail: '', subject: '', content: '' });

const emailValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        callback();
        return;
    }
    callback(new Error(t('email.common.invalidEmail')));
};
const rules: FormRules = {
    accountName: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    appCode: [{ required: true, message: () => t('common.pleaseSelect'), trigger: 'change' }],
    scopeType: [{ required: true, message: () => t('common.pleaseSelect'), trigger: 'change' }],
    merchantId: [{ required: true, message: () => t('common.pleaseSelect'), trigger: 'change' }],
    fromName: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    fromEmail: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }, { validator: emailValidator, trigger: 'blur' }],
    replyToEmail: [{ validator: emailValidator, trigger: 'blur' }],
    smtpHost: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    smtpPort: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    encryptionType: [{ required: true, message: () => t('common.pleaseSelect'), trigger: 'change' }],
    smtpUsername: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    smtpPassword: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
};
const testRules: FormRules = {
    toEmail: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }, { validator: emailValidator, trigger: 'blur' }],
};

onMounted(async () => {
    await Promise.all([loadOptions(), loadData()]);
});

watch(locale, () => loadOptions());

async function loadOptions() {
    const lang = String(locale.value || 'zh-CN');
    const [apps, scopes, scenes, providers, encryptions, verifies] = await Promise.all([
        loadEmailDictOptions('email_app_code', lang),
        loadEmailDictOptions('email_scope_type', lang),
        loadEmailDictOptions('email_scene_code', lang),
        loadEmailDictOptions('email_provider_type', lang),
        loadEmailDictOptions('email_encryption_type', lang),
        loadEmailDictOptions('email_verify_status', lang),
    ]);
    appOptions.value = apps;
    scopeOptions.value = scopes;
    sceneOptions.value = scenes;
    providerOptions.value = providers;
    encryptionOptions.value = encryptions;
    verifyOptions.value = verifies;
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchEmailAccounts({
            pageNo: page.value,
            pageSize: pageSize.value,
            appCode: query.appCode,
            scopeType: query.scopeType,
            accountName: query.accountName || undefined,
            fromEmail: query.fromEmail || undefined,
            sceneCode: query.sceneCode,
            status: query.status,
            verifyStatus: query.verifyStatus,
        });
        rows.value = result.records;
        total.value = result.total;
        selectedRows.value = [];
    } catch (error) {
        await showEmailError(error, t('email.common.errorTitle'), t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    Object.assign(query, { appCode: undefined, scopeType: undefined, accountName: '', fromEmail: '', sceneCode: undefined, status: undefined, verifyStatus: undefined });
    handleSearch();
}

async function openDetail(row: EmailAccount) {
    detailRow.value = await getEmailAccount(row.id);
    detailVisible.value = true;
}

function openForm(mode: 'create' | 'edit', row?: EmailAccount) {
    formMode.value = mode;
    Object.assign(form, emptyForm(), mode === 'edit' && row ? row : {}, { smtpPassword: '' });
    syncCurrentMerchantOption();
    formVisible.value = true;
}

async function searchMerchantOptions(keyword: string) {
    const text = keyword.trim();
    if (!text) {
        syncCurrentMerchantOption();
        return;
    }
    merchantLoading.value = true;
    try {
        const result = await searchMerchants({ pageNo: 1, pageSize: 20, keyword: text });
        merchantOptions.value = mergeMerchantOptions(result.records || []);
    } catch (error) {
        await showEmailError(error, t('email.common.errorTitle'), t('common.loadFailed'));
    } finally {
        merchantLoading.value = false;
    }
}

function handleScopeChange(value: string) {
    if (value !== 'MERCHANT') {
        clearMerchant();
    } else {
        syncCurrentMerchantOption();
    }
}

function handleMerchantChange(merchantId?: string) {
    const selected = merchantOptions.value.find((item) => item.merchantId === merchantId);
    if (!selected) {
        form.merchantNo = merchantId || '';
        form.merchantName = '';
        return;
    }
    form.merchantId = selected.merchantId;
    form.merchantNo = selected.merchantId;
    form.merchantName = selected.merchantName;
}

function clearMerchant() {
    form.merchantId = '';
    form.merchantNo = '';
    form.merchantName = '';
    merchantOptions.value = [];
}

function syncCurrentMerchantOption() {
    if (form.scopeType !== 'MERCHANT' || !form.merchantId) {
        merchantOptions.value = [];
        return;
    }
    merchantOptions.value = mergeMerchantOptions([{
        id: '0',
        merchantId: form.merchantId,
        merchantName: form.merchantName || form.merchantNo || form.merchantId,
        merchantStatus: 1,
        defaultLocale: 'zh-CN',
        merchantCategoryCode: '',
        countryCode: '',
        settlementCurrency: '',
        timezone: '',
        riskLevel: 0,
    }]);
}

function mergeMerchantOptions(items: MerchantInfo[]) {
    const map = new Map<string, MerchantInfo>();
    for (const item of merchantOptions.value) {
        map.set(item.merchantId, item);
    }
    for (const item of items) {
        map.set(item.merchantId, item);
    }
    return Array.from(map.values());
}

function merchantOptionLabel(item: MerchantInfo) {
    return `${item.merchantId}（${item.merchantName || '-'}）`;
}

async function submitForm() {
    await formRef.value?.validate();
    const payload: Partial<EmailAccount> = { ...form };
    delete payload.accountCode;
    if (payload.scopeType !== 'MERCHANT') {
        delete payload.merchantId;
        delete payload.merchantNo;
        delete payload.merchantName;
    }
    if (formMode.value === 'edit' && !payload.smtpPassword) {
        delete payload.smtpPassword;
    }
    try {
        if (formMode.value === 'create') {
            await createEmailAccount(payload);
            ElMessage.success(t('common.addSuccess'));
        } else {
            await updateEmailAccount(form.id, payload);
            ElMessage.success(t('common.editSuccess'));
        }
        formVisible.value = false;
        loadData();
    } catch (error) {
        await showEmailError(error, t('email.common.errorTitle'), t('common.saveFailed'));
    }
}

async function toggleStatus(row: EmailAccount) {
    const nextStatus = row.status === 1 ? 0 : 1;
    const action = nextStatus === 1 ? t('common.enable') : t('common.disable');
    const name = row.accountName || row.fromEmail || row.accountCode || row.id;
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name }), t('common.operationConfirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
    } catch {
        return;
    }
    try {
        await updateEmailAccountStatus(row.id, nextStatus);
        ElMessage.success(t('common.success'));
        loadData();
    } catch (error) {
        await showEmailError(error, t('email.common.errorTitle'), t('common.operationFailed'));
        loadData();
    }
}

async function handleSetDefault(row: EmailAccount) {
    try {
        await setDefaultEmailAccount(row.id);
        ElMessage.success(t('common.success'));
        loadData();
    } catch (error) {
        await showEmailError(error, t('email.common.errorTitle'), t('common.operationFailed'));
    }
}

function openTest(row: EmailAccount) {
    testAccount.value = row;
    Object.assign(testForm, {
        toEmail: '',
        subject: t('email.account.defaultTestSubject'),
        content: t('email.account.defaultTestContent'),
    });
    testVisible.value = true;
}

async function submitTest() {
    await testFormRef.value?.validate();
    if (!testAccount.value) {
        return;
    }
    try {
        const result = await testEmailAccount(testAccount.value.id, testForm);
        if (result.sendStatus === 2) {
            ElMessage.success(t('email.account.testSuccess'));
        } else {
            await ElMessageBox.alert(result.errorMessage || t('email.account.testFailed'), t('email.account.testTitle'), { type: 'error' });
        }
        testVisible.value = false;
        loadData();
    } catch (error) {
        await showEmailError(error, t('email.account.testTitle'), t('email.account.testFailed'));
    }
}

async function handleDelete(target?: EmailAccount | EmailAccount[]) {
    const targets = Array.isArray(target) ? target : target ? [target] : selectedRows.value;
    if (!targets.length) {
        ElMessage.warning(t('common.pleaseSelect'));
        return;
    }
    try {
        await ElMessageBox.confirm(t('email.common.deleteConfirm', { name: targets.map((item) => item.accountName).join(', ') }), t('common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        await Promise.all(targets.map((item) => deleteEmailAccount(item.id)));
        ElMessage.success(t('common.deleteSuccess'));
        loadData();
    } catch (error) {
        await showEmailError(error, t('email.common.errorTitle'), t('common.deleteFailed'));
    }
}
</script>

<style scoped>
.email-page :deep(.el-select) {
    width: 180px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 18px;
}


@media (max-width: 760px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
}
</style>

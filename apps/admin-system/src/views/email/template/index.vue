<template>
    <div class="app-container email-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="86px">
            <el-form-item :label="t('email.template.templateName')">
                <el-input v-model.trim="query.templateName" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('email.template.templateCode')">
                <el-input v-model.trim="query.templateCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('email.common.appCode')">
                <el-select v-model="query.appCode" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in appOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('email.common.sceneCode')">
                <el-select v-model="query.sceneCode" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in sceneOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('email.template.locale')">
                <el-select v-model="query.locale" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in localeOptions" :key="item.value" :label="item.label" :value="item.value" />
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
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'email:template:add'">{{ t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'email:template:edit'">{{ t('common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'email:template:remove'">{{ t('common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="email-template" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="templateCode" :label="t('email.template.templateCode')" min-width="170" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="templateName" :label="t('email.template.templateName')" min-width="180" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('email.common.appCode')" min-width="120" align="center">
                <template #default="{ row }">{{ optionLabel(appOptions, row.appCode) }}</template>
            </el-table-column>
            <el-table-column :label="t('email.common.sceneCode')" min-width="140" align="center">
                <template #default="{ row }">{{ optionLabel(sceneOptions, row.sceneCode) }}</template>
            </el-table-column>
            <el-table-column :label="t('email.template.locale')" min-width="150" align="center">
                <template #default="{ row }">{{ localeLabel(row.locale) }}</template>
            </el-table-column>
            <el-table-column prop="subjectTemplate" :label="t('email.template.subjectTemplate')" min-width="220" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('email.template.versionNo')" width="90" align="center">
                <template #default="{ row }">v{{ row.versionNo || 1 }}</template>
            </el-table-column>
            <el-table-column :label="t('common.status')" width="86" align="center">
                <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'email:template:status'" /></template>
            </el-table-column>
            <el-table-column :label="t('common.updateTime')" min-width="170" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="340" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'email:template:detail'">{{ t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'email:template:edit'">{{ t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="DocumentCopy" @click="handleCopy(row)" v-hasPermi="'email:template:copy'">{{ t('email.template.copy') }}</el-button>
                    <el-button size="small" type="primary" link :icon="View" @click="openPreview(row)" v-hasPermi="'email:template:preview'">{{ t('email.template.preview') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'email:template:remove'">{{ t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog :title="t('email.template.detailTitle')" v-model="detailVisible" width="min(1040px, 92vw)" top="5vh" append-to-body destroy-on-close>
            <div v-if="detailRow" class="template-detail">
                <header class="template-detail__header">
                    <div>
                        <div class="template-detail__eyebrow">{{ detailRow.templateCode }}</div>
                        <h2>{{ detailRow.templateName }}</h2>
                        <p>{{ detailRow.subjectTemplate }}</p>
                    </div>
                    <div class="template-detail__badges">
                        <el-tag size="small" type="primary">{{ optionLabel(appOptions, detailRow.appCode) }}</el-tag>
                        <el-tag size="small" type="success">{{ optionLabel(sceneOptions, detailRow.sceneCode) }}</el-tag>
                        <el-tag size="small" :type="statusType(detailRow.status)">{{ detailRow.status === 1 ? t('common.enable') : t('common.disable') }}</el-tag>
                    </div>
                </header>

                <section class="template-detail__meta">
                    <div><span>{{ t('email.template.locale') }}</span><strong>{{ localeLabel(detailRow.locale) }}</strong></div>
                    <div><span>{{ t('email.template.contentType') }}</span><strong>{{ optionLabel(contentTypeOptions, detailRow.contentType) }}</strong></div>
                    <div><span>{{ t('email.template.versionNo') }}</span><strong>v{{ detailRow.versionNo || 1 }}</strong></div>
                    <div><span>{{ t('common.updateTime') }}</span><strong><BaseDateTime :value="detailRow.updateTime" /></strong></div>
                </section>

                <section class="template-detail__section">
                    <div class="template-detail__section-title">{{ t('email.template.variableSchema') }}</div>
                    <pre class="code-block">{{ prettyJson(detailRow.variableSchema) }}</pre>
                </section>

                <section class="template-detail__section">
                    <div class="template-detail__section-title">{{ t('email.template.sensitiveVariableNames') }}</div>
                    <div class="template-detail__tags">
                        <el-tag v-for="name in sensitiveNames(detailRow.sensitiveVariableNames)" :key="name" size="small" type="warning">{{ name }}</el-tag>
                        <span v-if="!sensitiveNames(detailRow.sensitiveVariableNames).length">-</span>
                    </div>
                </section>

                <section class="template-detail__section">
                    <div class="template-detail__section-title">{{ t('email.template.emailPreview') }}</div>
                    <iframe class="template-detail__preview" :sandbox="''" :srcdoc="detailPreviewHtml(detailRow)" />
                </section>

                <section class="template-detail__section">
                    <div class="template-detail__section-title">{{ t('email.template.contentSource') }}</div>
                    <pre class="code-block">{{ detailRow.contentTemplate }}</pre>
                </section>

                <section class="template-detail__section">
                    <div class="template-detail__section-title">{{ t('common.remark') }}</div>
                    <div class="template-detail__remark">{{ detailRow.remark || '-' }}</div>
                </section>
            </div>
            <template #footer><div class="dialog-footer"><el-button @click="detailVisible = false">{{ t('common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog :title="formMode === 'create' ? t('email.template.addTitle') : t('email.template.editTitle')" v-model="formVisible" width="980px" top="5vh" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="124px" size="small">
                <div class="form-grid">
                    <el-form-item :label="t('email.template.templateCode')" prop="templateCode"><el-input v-model.trim="form.templateCode" maxlength="80" @input="form.templateCode = form.templateCode.toUpperCase()" /></el-form-item>
                    <el-form-item :label="t('email.template.templateName')" prop="templateName"><el-input v-model.trim="form.templateName" maxlength="128" /></el-form-item>
                    <el-form-item :label="t('email.common.appCode')" prop="appCode"><el-select v-model="form.appCode" filterable style="width:100%"><el-option v-for="item in appOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="t('email.common.sceneCode')" prop="sceneCode"><el-select v-model="form.sceneCode" filterable style="width:100%"><el-option v-for="item in sceneOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="t('email.template.locale')"><el-select v-model="form.locale" filterable style="width:100%" :placeholder="t('common.pleaseSelect')"><el-option v-for="item in localeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="t('email.template.contentType')"><el-select v-model="form.contentType" style="width:100%"><el-option v-for="item in contentTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="t('common.status')"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" /></el-form-item>
                    <el-form-item :label="t('email.template.sensitiveVariableNames')"><el-input v-model.trim="form.sensitiveVariableNames" maxlength="500" :placeholder="t('email.template.sensitiveHint')" /></el-form-item>
                </div>
                <el-form-item :label="t('email.template.subjectTemplate')" prop="subjectTemplate"><el-input v-model="form.subjectTemplate" maxlength="300" show-word-limit /></el-form-item>
                <el-form-item :label="t('email.template.contentTemplate')" prop="contentTemplate"><el-input v-model="form.contentTemplate" type="textarea" :rows="14" resize="vertical" maxlength="20000" show-word-limit /></el-form-item>
                <el-form-item :label="t('email.template.variableSchema')"><el-input v-model="form.variableSchema" type="textarea" :rows="5" resize="vertical" :placeholder="t('email.template.variableSchemaHint')" /></el-form-item>
                <el-form-item :label="t('common.remark')"><el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ t('common.confirm') }}</el-button>
                    <el-button @click="previewForm" v-hasPermi="'email:template:preview'">{{ t('email.template.preview') }}</el-button>
                    <el-button @click="formVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog :title="t('email.template.previewTitle')" v-model="previewVisible" width="min(1080px, 92vw)" top="5vh" append-to-body destroy-on-close>
            <div class="preview-workspace">
                <section class="preview-editor">
                    <div class="preview-section-title">{{ t('email.template.previewVariables') }}</div>
                    <el-form ref="previewFormRef" :model="previewFormState" :rules="previewRules" label-position="top" size="small">
                        <el-form-item prop="variablesText">
                            <el-input v-model="previewFormState.variablesText" type="textarea" :rows="6" resize="vertical" :placeholder="t('email.template.previewVariablesHint')" />
                        </el-form-item>
                    </el-form>
                </section>

                <section v-if="previewResult" class="mail-preview">
                    <div class="mail-preview__toolbar">
                        <div>
                            <span>{{ t('email.template.subjectTemplate') }}</span>
                            <strong>{{ previewResult.subject || '-' }}</strong>
                        </div>
                        <el-tag size="small" effect="plain">{{ optionLabel(contentTypeOptions, previewSource?.contentType) || previewSource?.contentType || 'HTML' }}</el-tag>
                    </div>
                    <div class="mail-preview__viewport">
                        <iframe class="mail-preview__frame" :sandbox="''" :srcdoc="previewFrameHtml(previewResult)" />
                    </div>
                    <el-alert v-if="previewResult.missingVariables?.length" :title="t('email.template.missingVariables', { names: previewResult.missingVariables.join(', ') })" type="warning" show-icon :closable="false" />
                </section>

                <section v-else class="preview-empty">
                    <div>{{ t('email.template.previewEmpty') }}</div>
                </section>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitPreview">{{ t('email.template.preview') }}</el-button>
                    <el-button @click="previewVisible = false">{{ t('common.close') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, DocumentCopy, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    copyEmailTemplate,
    createEmailTemplate,
    deleteEmailTemplate,
    getEmailTemplate,
    previewEmailTemplate,
    searchEmailTemplates,
    updateEmailTemplate,
    updateEmailTemplateStatus,
    type EmailTemplate,
    type EmailTemplatePreviewResponse,
} from '@/api/email';
import { loadEmailDictOptions, optionLabel, parseJsonObject, prettyJson, showEmailError, statusType, type SelectOption } from '../shared';

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<EmailTemplate[]>([]);
const selectedRows = ref<EmailTemplate[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const appOptions = ref<SelectOption[]>([]);
const sceneOptions = ref<SelectOption[]>([]);
const contentTypeOptions = ref<SelectOption[]>([]);
const detailVisible = ref(false);
const detailRow = ref<EmailTemplate | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const previewVisible = ref(false);
const previewSource = ref<Partial<EmailTemplate> | null>(null);
const previewFormRef = ref<FormInstance>();
const previewResult = ref<EmailTemplatePreviewResponse | null>(null);
const localeOptions = computed<SelectOption[]>(() => [
    { label: t('email.template.localeZhCn'), value: 'zh-CN' },
    { label: t('email.template.localeEnUs'), value: 'en-US' },
]);

const query = reactive({
    templateName: '',
    templateCode: '',
    appCode: undefined as string | undefined,
    sceneCode: undefined as string | undefined,
    locale: '',
    status: undefined as number | undefined,
});

const emptyForm = () => ({
    id: 0,
    templateCode: '',
    templateName: '',
    appCode: 'ADMIN',
    sceneCode: 'COMMON',
    locale: 'zh-CN',
    subjectTemplate: '',
    contentType: 'TEXT',
    contentTemplate: '',
    variableSchema: '{\n  "merchantName": "Demo Merchant"\n}',
    sensitiveVariableNames: '',
    status: 1,
    remark: '',
});
const form = reactive(emptyForm());
const previewFormState = reactive({ variablesText: '{\n  "merchantName": "Demo Merchant"\n}' });

const jsonObjectValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!String(value || '').trim()) {
        callback();
        return;
    }
    try {
        parseJsonObject(value);
        callback();
    } catch {
        callback(new Error(t('email.template.invalidJsonObject')));
    }
};
const rules: FormRules = {
    templateCode: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    templateName: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    appCode: [{ required: true, message: () => t('common.pleaseSelect'), trigger: 'change' }],
    sceneCode: [{ required: true, message: () => t('common.pleaseSelect'), trigger: 'change' }],
    subjectTemplate: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    contentTemplate: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
    variableSchema: [{ validator: jsonObjectValidator, trigger: 'blur' }],
};
const previewRules: FormRules = {
    variablesText: [{ validator: jsonObjectValidator, trigger: 'blur' }],
};

onMounted(async () => {
    await Promise.all([loadOptions(), loadData()]);
});

watch(locale, () => loadOptions());

async function loadOptions() {
    const lang = String(locale.value || 'zh-CN');
    const [apps, scenes, contentTypes] = await Promise.all([
        loadEmailDictOptions('email_app_code', lang),
        loadEmailDictOptions('email_scene_code', lang),
        loadEmailDictOptions('email_content_type', lang),
    ]);
    appOptions.value = apps;
    sceneOptions.value = scenes;
    contentTypeOptions.value = contentTypes;
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchEmailTemplates({
            pageNo: page.value,
            pageSize: pageSize.value,
            templateName: query.templateName || undefined,
            templateCode: query.templateCode || undefined,
            appCode: query.appCode,
            sceneCode: query.sceneCode,
            locale: query.locale || undefined,
            status: query.status,
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
    Object.assign(query, { templateName: '', templateCode: '', appCode: undefined, sceneCode: undefined, locale: '', status: undefined });
    handleSearch();
}

async function openDetail(row: EmailTemplate) {
    detailRow.value = await getEmailTemplate(row.id);
    detailVisible.value = true;
}

function openForm(mode: 'create' | 'edit', row?: EmailTemplate) {
    formMode.value = mode;
    Object.assign(form, emptyForm(), mode === 'edit' && row ? row : {});
    formVisible.value = true;
}

async function submitForm() {
    await formRef.value?.validate();
    try {
        const payload = buildTemplatePayload();
        if (formMode.value === 'create') {
            await createEmailTemplate(payload);
            ElMessage.success(t('common.addSuccess'));
        } else {
            await updateEmailTemplate(form.id, payload);
            ElMessage.success(t('common.editSuccess'));
        }
        formVisible.value = false;
        loadData();
    } catch (error) {
        await showEmailError(error, t('email.common.errorTitle'), t('common.saveFailed'));
    }
}

async function toggleStatus(row: EmailTemplate) {
    const nextStatus = row.status === 1 ? 0 : 1;
    const action = nextStatus === 1 ? t('common.enable') : t('common.disable');
    const name = row.templateName || row.templateCode || row.id;
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name }), t('common.operationConfirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
    } catch {
        return;
    }
    try {
        await updateEmailTemplateStatus(row.id, nextStatus);
        ElMessage.success(t('common.success'));
        loadData();
    } catch (error) {
        await showEmailError(error, t('email.common.errorTitle'), t('common.operationFailed'));
        loadData();
    }
}

async function handleCopy(row: EmailTemplate) {
    try {
        await copyEmailTemplate(row.id);
        ElMessage.success(t('common.success'));
        loadData();
    } catch (error) {
        await showEmailError(error, t('email.common.errorTitle'), t('common.operationFailed'));
    }
}

function openPreview(row: Partial<EmailTemplate>) {
    previewSource.value = row;
    previewFormState.variablesText = row.variableSchema || '{\n  "merchantName": "Demo Merchant"\n}';
    previewResult.value = null;
    previewVisible.value = true;
}

async function previewForm() {
    await formRef.value?.validate();
    openPreview(buildTemplatePayload());
}

async function submitPreview() {
    await previewFormRef.value?.validate();
    if (!previewSource.value) {
        return;
    }
    try {
        previewResult.value = await previewEmailTemplate({
            subjectTemplate: previewSource.value.subjectTemplate || '',
            contentTemplate: previewSource.value.contentTemplate || '',
            sensitiveVariableNames: previewSource.value.sensitiveVariableNames || '',
            variables: parseJsonObject(previewFormState.variablesText),
        });
    } catch (error) {
        await showEmailError(error, t('email.template.previewTitle'), t('common.operationFailed'));
    }
}

async function handleDelete(target?: EmailTemplate | EmailTemplate[]) {
    const targets = Array.isArray(target) ? target : target ? [target] : selectedRows.value;
    if (!targets.length) {
        ElMessage.warning(t('common.pleaseSelect'));
        return;
    }
    try {
        await ElMessageBox.confirm(t('email.common.deleteConfirm', { name: targets.map((item) => item.templateName).join(', ') }), t('common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        await Promise.all(targets.map((item) => deleteEmailTemplate(item.id)));
        ElMessage.success(t('common.deleteSuccess'));
        loadData();
    } catch (error) {
        await showEmailError(error, t('email.common.errorTitle'), t('common.deleteFailed'));
    }
}

function buildTemplatePayload() {
    return {
        ...form,
        sensitiveVariableNames: normalizeSensitiveVariables(form.sensitiveVariableNames),
    };
}

function normalizeSensitiveVariables(value?: string) {
    const source = String(value || '').trim();
    if (!source) {
        return '';
    }
    if (source.startsWith('[')) {
        return source;
    }
    return JSON.stringify(source.split(',').map((item) => item.trim()).filter(Boolean));
}

function localeLabel(value?: string) {
    return optionLabel(localeOptions.value, value) || value || '-';
}

function sensitiveNames(value?: string) {
    const source = String(value || '').trim();
    if (!source) {
        return [];
    }
    try {
        const parsed = JSON.parse(source);
        return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
    } catch {
        return source.split(',').map((item) => item.trim()).filter(Boolean);
    }
}

function detailPreviewHtml(row: EmailTemplate) {
    const variables = parsePreviewVariables(row.variableSchema);
    return renderTemplate(row.contentTemplate || '', variables);
}

function parsePreviewVariables(value?: string) {
    try {
        return parseJsonObject(value || '{}');
    } catch {
        return {};
    }
}

function renderTemplate(template: string, variables: Record<string, unknown>) {
    return template.replace(/\$\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_all, name: string) => String(variables[name] ?? `\${${name}}`));
}

function previewFrameHtml(result: EmailTemplatePreviewResponse) {
    const content = result.maskedContent || result.content || '';
    const contentType = String(previewSource.value?.contentType || '').toUpperCase();
    if (contentType === 'TEXT') {
        return `<div style="margin:0;padding:32px;background:#f4f7fb;font-family:Arial,sans-serif;color:#1f2937;"><div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:28px;line-height:1.8;font-size:14px;white-space:pre-wrap;">${escapeHtml(content)}</div></div>`;
    }
    return content;
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

.code-block {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.preview-workspace {
    display: grid;
    gap: 16px;
}

.preview-editor {
    padding: 16px 18px 2px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f8fafc;
}

.preview-section-title {
    margin-bottom: 10px;
    color: #334155;
    font-size: 13px;
    font-weight: 600;
}

.mail-preview {
    display: grid;
    gap: 12px;
    min-width: 0;
}

.mail-preview__toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
}

.mail-preview__toolbar span {
    display: block;
    margin-bottom: 4px;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
}

.mail-preview__toolbar strong {
    color: #111827;
    font-size: 16px;
    line-height: 1.5;
}

.mail-preview__viewport {
    padding: 18px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #eef2f7;
}

.mail-preview__frame {
    display: block;
    width: 100%;
    min-height: 520px;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    background: #fff;
}

.preview-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 220px;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    color: #64748b;
    background: #f8fafc;
}

.template-detail {
    display: grid;
    gap: 16px;
}

.template-detail__header {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
}

.template-detail__eyebrow {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
}

.template-detail__header h2 {
    margin: 6px 0;
    color: #111827;
    font-size: 22px;
    line-height: 1.3;
}

.template-detail__header p {
    margin: 0;
    color: #475569;
}

.template-detail__badges,
.template-detail__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-content: flex-start;
}

.template-detail__meta {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.template-detail__meta > div {
    min-height: 64px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #f8fafc;
}

.template-detail__meta span,
.template-detail__section-title {
    display: block;
    margin-bottom: 6px;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
}

.template-detail__meta strong {
    color: #111827;
    font-size: 14px;
    font-weight: 600;
}

.template-detail__section {
    min-width: 0;
}

.template-detail__preview {
    width: 100%;
    min-height: 460px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #f8fafc;
}

.template-detail__remark {
    min-height: 36px;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #334155;
    background: #fff;
}


@media (max-width: 760px) {
    .form-grid {
        grid-template-columns: 1fr;
    }

    .template-detail__header {
        display: block;
    }

    .template-detail__badges {
        margin-top: 12px;
    }

    .template-detail__meta {
        grid-template-columns: 1fr;
    }

    .mail-preview__toolbar {
        display: block;
    }

    .mail-preview__toolbar .el-tag {
        margin-top: 10px;
    }

    .mail-preview__viewport {
        padding: 10px;
    }
}
</style>

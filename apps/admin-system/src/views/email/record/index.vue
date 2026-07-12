<template>
    <div class="app-container email-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="86px">
            <el-form-item :label="t('email.record.emailNo')">
                <el-input v-model.trim="query.emailNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
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
            <el-form-item :label="t('email.template.templateCode')">
                <el-input v-model.trim="query.templateCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('email.record.toEmail')">
                <el-input v-model.trim="query.toEmail" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('email.record.sendStatus')">
                <el-select v-model="query.sendStatus" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in sendStatusOptions" :key="item.value" :label="item.label" :value="Number(item.value)" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="email-record" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="emailNo" :label="t('email.record.emailNo')" min-width="180" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('email.common.appCode')" width="120" align="center">
                <template #default="{ row }">{{ optionLabel(appOptions, row.appCode) }}</template>
            </el-table-column>
            <el-table-column :label="t('email.common.sceneCode')" min-width="140" align="center">
                <template #default="{ row }">{{ optionLabel(sceneOptions, row.sceneCode) }}</template>
            </el-table-column>
            <el-table-column prop="templateName" :label="t('email.template.templateName')" min-width="170" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="toEmails" :label="t('email.record.toEmail')" min-width="220" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="subject" :label="t('email.record.subject')" min-width="220" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('email.record.sendStatus')" width="100" align="center">
                <template #default="{ row }"><el-tag size="small" :type="sendStatusType(row.sendStatus)">{{ optionLabel(sendStatusOptions, String(row.sendStatus ?? '0')) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="retryCount" :label="t('email.record.retryCount')" width="90" align="center" />
            <el-table-column :label="t('email.record.sendSuccessTime')" min-width="170" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.sendSuccessTime" /></template>
            </el-table-column>
            <el-table-column :label="t('common.createTime')" min-width="170" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.createTime" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="150" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'email:record:detail'">{{ t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="RefreshRight" :disabled="row.sendStatus === 2" @click="handleResend(row)" v-hasPermi="'email:record:resend'">{{ t('email.record.resend') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('email.record.detailTitle')" size="lg">
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="t('email.record.emailNo')">{{ detailRow.emailNo }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.common.appCode')">{{ optionLabel(appOptions, detailRow.appCode) }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.common.merchant')">{{ detailRow.merchantName || detailRow.merchantNo || detailRow.merchantId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.common.sceneCode')">{{ optionLabel(sceneOptions, detailRow.sceneCode) }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.template.templateCode')">{{ detailRow.templateCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.template.templateName')">{{ detailRow.templateName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.accountCode')">{{ detailRow.accountCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.providerType')">{{ optionLabel(providerOptions, detailRow.providerType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.fromName')">{{ detailRow.fromName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.account.fromEmail')">{{ detailRow.fromEmail || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.toEmail')">{{ detailRow.toEmails || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.ccEmails')">{{ detailRow.ccEmails || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.bccEmails')">{{ detailRow.bccEmails || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.subject')">{{ detailRow.subject || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.contentSnapshot')"><pre class="code-block">{{ detailRow.contentSnapshot || '-' }}</pre></el-descriptions-item>
                <el-descriptions-item :label="t('email.record.variablesSnapshot')"><pre class="code-block">{{ prettyJson(detailRow.variablesSnapshot) }}</pre></el-descriptions-item>
                <el-descriptions-item :label="t('email.record.bizType')">{{ detailRow.bizType || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.bizNo')">{{ detailRow.bizNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.sendStatus')"><el-tag size="small" :type="sendStatusType(detailRow.sendStatus)">{{ optionLabel(sendStatusOptions, String(detailRow.sendStatus ?? '0')) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('email.record.retryCount')">{{ detailRow.retryCount ?? 0 }} / {{ detailRow.maxRetryCount ?? 0 }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.sendStartTime')"><BaseDateTime :value="detailRow.sendStartTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('email.record.sendEndTime')"><BaseDateTime :value="detailRow.sendEndTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('email.record.sendSuccessTime')"><BaseDateTime :value="detailRow.sendSuccessTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('email.record.costMs')">{{ detailRow.costMs ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.errorCode')">{{ detailRow.errorCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.errorMessage')">{{ detailRow.errorMessage || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('email.record.operatorName')">{{ detailRow.operatorName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, RefreshRight, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { getEmailRecord, resendEmailRecord, searchEmailRecords, type EmailRecord } from '@/api/email';
import { loadEmailDictOptions, optionLabel, prettyJson, sendStatusType, showEmailError, type SelectOption } from '../shared';

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<EmailRecord[]>([]);
const selectedRows = ref<EmailRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const appOptions = ref<SelectOption[]>([]);
const sceneOptions = ref<SelectOption[]>([]);
const providerOptions = ref<SelectOption[]>([]);
const sendStatusOptions = ref<SelectOption[]>([]);
const detailVisible = ref(false);
const detailRow = ref<EmailRecord | null>(null);

const query = reactive({
    emailNo: '',
    appCode: undefined as string | undefined,
    sceneCode: undefined as string | undefined,
    templateCode: '',
    toEmail: '',
    sendStatus: undefined as number | undefined,
});

onMounted(async () => {
    await Promise.all([loadOptions(), loadData()]);
});

watch(locale, () => loadOptions());

async function loadOptions() {
    const lang = String(locale.value || 'zh-CN');
    const [apps, scenes, providers, statuses] = await Promise.all([
        loadEmailDictOptions('email_app_code', lang),
        loadEmailDictOptions('email_scene_code', lang),
        loadEmailDictOptions('email_provider_type', lang),
        loadEmailDictOptions('email_send_status', lang),
    ]);
    appOptions.value = apps;
    sceneOptions.value = scenes;
    providerOptions.value = providers;
    sendStatusOptions.value = statuses;
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchEmailRecords({
            pageNo: page.value,
            pageSize: pageSize.value,
            emailNo: query.emailNo || undefined,
            appCode: query.appCode,
            sceneCode: query.sceneCode,
            templateCode: query.templateCode || undefined,
            toEmail: query.toEmail || undefined,
            sendStatus: query.sendStatus,
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
    Object.assign(query, { emailNo: '', appCode: undefined, sceneCode: undefined, templateCode: '', toEmail: '', sendStatus: undefined });
    handleSearch();
}

async function openDetail(row: EmailRecord) {
    detailRow.value = await getEmailRecord(row.id);
    detailVisible.value = true;
}

async function handleResend(row: EmailRecord) {
    try {
        await ElMessageBox.confirm(t('email.record.resendConfirm', { no: row.emailNo }), t('email.record.resend'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        const result = await resendEmailRecord(row.id);
        if (result.sendStatus === 2) {
            ElMessage.success(t('email.record.resendSuccess'));
        } else {
            await ElMessageBox.alert(result.errorMessage || t('email.record.resendFailed'), t('email.record.resend'), { type: 'error' });
        }
        loadData();
    } catch (error) {
        await showEmailError(error, t('email.record.resend'), t('email.record.resendFailed'));
    }
}
</script>

<style scoped>
.email-page :deep(.el-select) {
    width: 180px;
}

.code-block {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

</style>

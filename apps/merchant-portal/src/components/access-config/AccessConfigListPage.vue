<template>
    <div class="page merchant-redesigned-page access-config-page">
        <header class="access-config-header">
            <div class="access-config-header__title">
                <span class="access-config-header__icon">
                    <el-icon><Link v-if="isSourceUrl" /><Connection v-else /></el-icon>
                </span>
                <h2>{{ title }}</h2>
            </div>
            <div class="access-config-header__actions">
                <div class="status-rail" aria-live="polite">
                    <span><strong>{{ rows.length }}</strong>{{ t('accessConfig.totalCount') }}</span>
                    <span class="is-pending"><strong>{{ statusCount(0) }}</strong>{{ t('accessConfig.pending') }}</span>
                    <span class="is-approved"><strong>{{ statusCount(1) }}</strong>{{ t('accessConfig.approved') }}</span>
                    <span class="is-rejected"><strong>{{ statusCount(2) }}</strong>{{ t('accessConfig.rejected') }}</span>
                </div>
                <el-tooltip :content="t('common.refresh')" placement="bottom">
                    <el-button circle :icon="Refresh" :loading="loading" :aria-label="t('common.refresh')" @click="loadData" />
                </el-tooltip>
                <el-button v-if="canSubmit" type="primary" :icon="Plus" @click="openSubmit">{{ t('accessConfig.submit') }}</el-button>
            </div>
        </header>

        <section class="access-config-content">
            <div class="access-config-toolbar">
                <el-select v-model="query.approvalStatus" clearable :placeholder="t('accessConfig.allApproval')" class="status-filter">
                    <el-option :label="t('accessConfig.pending')" :value="0" />
                    <el-option :label="t('accessConfig.approved')" :value="1" />
                    <el-option :label="t('accessConfig.rejected')" :value="2" />
                </el-select>
                <el-select v-model="query.status" clearable :placeholder="t('accessConfig.allTransaction')" class="status-filter">
                    <el-option :label="t('accessConfig.allowed')" :value="1" />
                    <el-option :label="t('accessConfig.prohibited')" :value="0" />
                </el-select>
            </div>

            <StandardTable table-key="merchant-access-config" v-loading="loading" :data="pagedRows" row-key="id" size="small" :empty-text="t('accessConfig.empty')">
                <el-table-column :label="valueColumnLabel" min-width="240" fixed="left" show-overflow-tooltip>
                    <template #default="{ row }"><code class="config-value">{{ itemValue(row) }}</code></template>
                </el-table-column>
                <el-table-column :label="secondaryColumnLabel" min-width="150" show-overflow-tooltip>
                    <template #default="{ row }">{{ secondaryValue(row) }}</template>
                </el-table-column>
                <el-table-column :label="t('accessConfig.approvalStatus')" width="120" align="center">
                    <template #default="{ row }"><el-tag size="small" effect="plain" :type="approvalTagType(row.approvalStatus)">{{ approvalStatusText(row.approvalStatus) }}</el-tag></template>
                </el-table-column>
                <el-table-column :label="t('accessConfig.transactionStatus')" width="122" align="center">
                    <template #default="{ row }"><el-tag size="small" effect="plain" :type="row.status === 1 ? 'success' : 'info'">{{ transactionStatusText(row.status) }}</el-tag></template>
                </el-table-column>
                <el-table-column :label="t('accessConfig.submitSource')" width="120" align="center">
                    <template #default="{ row }">{{ submitSourceText(row.submitSource) }}</template>
                </el-table-column>
                <el-table-column prop="approvalRemark" :label="t('accessConfig.approvalRemark')" min-width="190" show-overflow-tooltip>
                    <template #default="{ row }">{{ row.approvalRemark || '-' }}</template>
                </el-table-column>
                <el-table-column :label="t('accessConfig.updateTime')" width="176" align="center">
                    <template #default="{ row }"><BaseDateTime :value="updatedAt(row)" /></template>
                </el-table-column>
                <el-table-column v-if="canViewDetail" :label="t('common.operation')" width="100" align="center" fixed="right">
                    <template #default="{ row }"><el-button link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button></template>
                </el-table-column>
            </StandardTable>

            <div v-show="filteredRows.length > 0" class="pagination-container">
                <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="filteredRows.length" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" background />
            </div>
        </section>

        <el-dialog v-model="submitVisible" :title="submitTitle" width="min(540px, 92vw)" append-to-body destroy-on-close>
            <el-form label-position="top" size="small">
                <el-form-item :label="t('accessConfig.values')" required>
                    <el-input v-model="submitForm.values" type="textarea" :rows="7" :placeholder="inputPlaceholder" />
                </el-form-item>
                <el-form-item :label="t('accessConfig.submitRemark')">
                    <el-input v-model.trim="submitForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit :placeholder="t('accessConfig.remarkPlaceholder')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="submitting" @click="submit">{{ t('accessConfig.submit') }}</el-button>
                    <el-button @click="submitVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-drawer v-model="detailVisible" :title="t('accessConfig.detailTitle')" size="min(620px, 92vw)" append-to-body destroy-on-close>
            <el-descriptions v-if="detailRow" :column="1" border size="small" class="access-config-detail">
                <el-descriptions-item :label="valueColumnLabel"><code class="config-value is-detail">{{ itemValue(detailRow) }}</code></el-descriptions-item>
                <el-descriptions-item :label="secondaryColumnLabel">{{ secondaryValue(detailRow) }}</el-descriptions-item>
                <el-descriptions-item :label="t('accessConfig.approvalStatus')"><el-tag size="small" :type="approvalTagType(detailRow.approvalStatus)">{{ approvalStatusText(detailRow.approvalStatus) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('accessConfig.transactionStatus')"><el-tag size="small" :type="detailRow.status === 1 ? 'success' : 'info'">{{ transactionStatusText(detailRow.status) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('accessConfig.submitSource')">{{ submitSourceText(detailRow.submitSource) }}</el-descriptions-item>
                <el-descriptions-item :label="t('accessConfig.submitRemark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('accessConfig.approvalRemark')">{{ detailRow.approvalRemark || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('accessConfig.reviewBy')">{{ detailRow.reviewBy || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('accessConfig.reviewTime')"><BaseDateTime :value="detailRow.reviewTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('accessConfig.createTime')"><BaseDateTime :value="createdAt(detailRow)" /></el-descriptions-item>
                <el-descriptions-item :label="t('accessConfig.updateTime')"><BaseDateTime :value="updatedAt(detailRow)" /></el-descriptions-item>
            </el-descriptions>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Connection, Link, Plus, Refresh, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { accessConfigApi, type MerchantIpWhitelistItem, type MerchantSourceUrlItem } from '@/api/accessConfigApi';
import { hasPermission } from '@/utils/permission';

type AccessConfigKind = 'source-url' | 'ip-whitelist';
type AccessConfigItem = MerchantSourceUrlItem | MerchantIpWhitelistItem;

const props = defineProps<{ kind: AccessConfigKind }>();
const { t } = useI18n();
const rows = ref<AccessConfigItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const submitVisible = ref(false);
const detailVisible = ref(false);
const detailRow = ref<AccessConfigItem>();
const page = ref(1);
const pageSize = ref(10);
const query = reactive<{ approvalStatus?: number; status?: number }>({});
const submitForm = reactive({ values: '', remark: '' });
const isSourceUrl = computed(() => props.kind === 'source-url');
const canSubmit = computed(() => hasPermission(isSourceUrl.value
    ? 'merchant:access-config:source-url:submit'
    : 'merchant:access-config:ip-whitelist:submit'));
const canViewDetail = computed(() => hasPermission(isSourceUrl.value
    ? 'merchant:access-config:source-url:detail'
    : 'merchant:access-config:ip-whitelist:detail'));
const title = computed(() => t(isSourceUrl.value ? 'accessConfig.sourceUrlTitle' : 'accessConfig.ipWhitelistTitle'));
const submitTitle = computed(() => t(isSourceUrl.value ? 'accessConfig.submitSourceUrl' : 'accessConfig.submitIpWhitelist'));
const valueColumnLabel = computed(() => t(isSourceUrl.value ? 'accessConfig.sourceUrlValue' : 'accessConfig.ipValue'));
const secondaryColumnLabel = computed(() => t(isSourceUrl.value ? 'accessConfig.sourceHost' : 'accessConfig.ipType'));
const inputPlaceholder = computed(() => t(isSourceUrl.value ? 'accessConfig.sourceUrlPlaceholder' : 'accessConfig.ipPlaceholder'));
const filteredRows = computed(() => rows.value.filter((item) =>
    (query.approvalStatus === undefined || item.approvalStatus === query.approvalStatus)
    && (query.status === undefined || item.status === query.status),
));
const pagedRows = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    return filteredRows.value.slice(start, start + pageSize.value);
});

watch([() => query.approvalStatus, () => query.status, pageSize], () => { page.value = 1; });
onMounted(loadData);

async function loadData() {
    loading.value = true;
    try {
        rows.value = isSourceUrl.value
            ? await accessConfigApi.listSourceUrls()
            : await accessConfigApi.listIpWhitelists();
        if ((page.value - 1) * pageSize.value >= rows.value.length) page.value = 1;
    } catch (error: any) {
        rows.value = [];
        ElMessage.error(error?.friendlyMessage || error?.message || t('accessConfig.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function openSubmit() {
    Object.assign(submitForm, { values: '', remark: '' });
    submitVisible.value = true;
}

function openDetail(row: AccessConfigItem) {
    detailRow.value = row;
    detailVisible.value = true;
}

async function submit() {
    const values = parseValues(submitForm.values);
    if (!values.length) {
        ElMessage.warning(t('accessConfig.valuesRequired'));
        return;
    }
    const invalidValue = values.find((value) => isSourceUrl.value ? !isValidSourceUrl(value) : !isValidIp(value));
    if (invalidValue) {
        ElMessage.warning(t(isSourceUrl.value ? 'accessConfig.invalidSourceUrl' : 'accessConfig.invalidIp', { value: invalidValue }));
        return;
    }
    submitting.value = true;
    try {
        if (isSourceUrl.value) {
            await accessConfigApi.submitSourceUrls(values, submitForm.remark || undefined);
        } else {
            await accessConfigApi.submitIpWhitelists(values, submitForm.remark || undefined);
        }
        ElMessage.success(t('accessConfig.submitSuccess'));
        submitVisible.value = false;
        await loadData();
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('accessConfig.submitFailed'));
    } finally {
        submitting.value = false;
    }
}

function parseValues(value: string) {
    return Array.from(new Set(value.split(/[\n,，;\s]+/).map((item) => item.trim()).filter(Boolean)));
}

function isValidSourceUrl(value: string) {
    try {
        const parsed = new URL(value);
        return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.hostname);
    } catch {
        return false;
    }
}

function isValidIp(value: string) {
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
        return value.split('.').every((part) => Number(part) >= 0 && Number(part) <= 255);
    }
    return value.includes(':') && /^[0-9a-f:]+$/i.test(value) && value.length <= 45;
}

function statusCount(status: number) {
    return rows.value.filter((item) => item.approvalStatus === status).length;
}

function approvalStatusText(status?: number) {
    if (status === 0) return t('accessConfig.pending');
    if (status === 1) return t('accessConfig.approved');
    if (status === 2) return t('accessConfig.rejected');
    return '-';
}

function approvalTagType(status?: number): 'warning' | 'success' | 'danger' | 'info' {
    if (status === 0) return 'warning';
    if (status === 1) return 'success';
    if (status === 2) return 'danger';
    return 'info';
}

function transactionStatusText(status?: number) {
    return status === 1 ? t('accessConfig.allowed') : t('accessConfig.prohibited');
}

function submitSourceText(source?: string) {
    if (source === 'ADMIN') return t('accessConfig.sourceAdmin');
    if (source === 'MERCHANT') return t('accessConfig.sourceMerchant');
    return source || '-';
}

function itemValue(item: AccessConfigItem) {
    return 'sourceUrl' in item ? item.sourceUrl : item.ipValue;
}

function secondaryValue(item: AccessConfigItem) {
    return 'sourceUrl' in item ? item.sourceHost || '-' : item.ipType || '-';
}

function createdAt(item: AccessConfigItem) {
    return 'sourceUrl' in item ? item.createTime : item.gmtCreate;
}

function updatedAt(item: AccessConfigItem) {
    return 'sourceUrl' in item ? item.updateTime : item.gmtModified;
}
</script>

<style scoped>
.access-config-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.access-config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 4px 0 14px;
    border-bottom: 1px solid var(--el-border-color-light);
}

.access-config-header__title,
.access-config-header__actions,
.access-config-toolbar,
.status-rail {
    display: flex;
    align-items: center;
}

.access-config-header__title {
    min-width: 0;
    gap: 10px;
}

.access-config-header__title h2 {
    margin: 0;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 20px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.access-config-header__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    color: var(--el-color-primary);
    font-size: 18px;
}

.access-config-header__actions {
    gap: 10px;
}

.status-rail {
    height: 32px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    background: var(--el-bg-color);
}

.status-rail span {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    padding: 0 10px;
    border-right: 1px solid var(--el-border-color-lighter);
    color: var(--el-text-color-secondary);
    font-size: 12px;
    white-space: nowrap;
}

.status-rail span:last-child { border-right: 0; }
.status-rail strong { color: var(--el-text-color-primary); font-size: 15px; }
.status-rail .is-pending strong { color: var(--el-color-warning); }
.status-rail .is-approved strong { color: var(--el-color-success); }
.status-rail .is-rejected strong { color: var(--el-color-danger); }

.access-config-content {
    min-width: 0;
}

.access-config-toolbar {
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 10px;
}

.status-filter { width: 174px; }

.config-value {
    color: var(--el-text-color-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
}

.config-value.is-detail {
    overflow-wrap: anywhere;
    white-space: normal;
}

.pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
}

.access-config-detail { padding: 0 18px; }

@media (max-width: 900px) {
    .access-config-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .access-config-header__actions {
        width: 100%;
        flex-wrap: wrap;
    }

    .status-rail {
        max-width: 100%;
        overflow-x: auto;
    }
}

@media (max-width: 560px) {
    .access-config-toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .status-filter { width: 100%; }
    .status-rail span { padding: 0 8px; }
}
</style>

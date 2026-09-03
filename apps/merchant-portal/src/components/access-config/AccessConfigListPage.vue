<template>
    <div class="page merchant-redesigned-page access-config-page">
        <section class="merchant-list-card merchant-search-card">
            <el-form v-show="showSearch" :model="query" inline size="small" class="search-form access-config-search-form">
                <el-form-item :label="valueColumnLabel">
                    <el-input v-model.trim="query.keyword" :placeholder="keywordPlaceholder" clearable @keyup.enter="applyQuery" />
                </el-form-item>
                <el-form-item :label="t('accessConfig.approvalStatus')">
                    <el-select v-model="query.approvalStatus" :placeholder="t('common.all')" clearable>
                        <el-option :label="t('accessConfig.pending')" :value="0" />
                        <el-option :label="t('accessConfig.approved')" :value="1" />
                        <el-option :label="t('accessConfig.rejected')" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('accessConfig.transactionStatus')">
                    <el-select v-model="query.status" :placeholder="t('common.all')" clearable>
                        <el-option :label="t('accessConfig.allowed')" :value="1" />
                        <el-option :label="t('accessConfig.prohibited')" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item class="merchant-search-actions">
                    <el-button type="primary" :icon="Search" @click="applyQuery">{{ t('common.search') }}</el-button>
                    <el-button :icon="RefreshLeft" @click="resetQuery">{{ t('common.reset') }}</el-button>
                </el-form-item>
            </el-form>
        </section>

        <section class="merchant-list-card merchant-table-card">
            <div class="merchant-table-head">
                <div class="merchant-table-head__actions">
                    <h3>{{ title }}</h3>
                    <el-button v-if="canSubmit" type="primary" plain size="small" :icon="Plus" @click="openSubmit">
                        {{ t('accessConfig.submit') }}
                    </el-button>
                </div>
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </div>

            <StandardTable :table-key="tableKey" v-loading="loading" :data="pagedRows" row-key="id" size="small" :empty-text="emptyText">
                <el-table-column :label="valueColumnLabel" min-width="260" fixed="left" show-overflow-tooltip>
                    <template #default="{ row }"><code class="config-value">{{ itemValue(row) }}</code></template>
                </el-table-column>
                <el-table-column v-if="!isSourceUrl" :label="t('accessConfig.ipType')" min-width="130" align="center">
                    <template #default="{ row }">{{ ipTypeText(row) }}</template>
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
                <el-table-column :label="t('common.operation')" width="100" align="center" class-name="small-padding fixed-width" fixed="right">
                    <template #default="{ row }">
                        <el-button v-if="canDetail" link type="primary" size="small" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
            </StandardTable>

            <div v-show="filteredRows.length > 0" class="pagination-container">
                <el-pagination
                    v-model:current-page="page"
                    v-model:page-size="pageSize"
                    :total="filteredRows.length"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
                />
            </div>
        </section>

        <el-dialog v-model="submitVisible" :title="submitTitle" width="min(540px, 92vw)" append-to-body destroy-on-close>
            <el-form label-position="top" size="small">
                <el-form-item :label="valueColumnLabel" required>
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

        <el-drawer v-model="detailVisible" :title="detailTitle" size="min(620px, 92vw)" append-to-body destroy-on-close>
            <el-descriptions v-if="detailRow" :column="1" border size="small" class="access-config-detail">
                <el-descriptions-item :label="valueColumnLabel"><code class="config-value is-detail">{{ itemValue(detailRow) }}</code></el-descriptions-item>
                <el-descriptions-item v-if="!isSourceUrl" :label="t('accessConfig.ipType')">{{ ipTypeText(detailRow) }}</el-descriptions-item>
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
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="detailVisible = false">{{ t('common.close') }}</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { accessConfigApi, type MerchantIpWhitelistItem, type MerchantSourceUrlItem } from '@/api/accessConfigApi';
import { hasPermission } from '@/utils/permission';

type AccessConfigKind = 'source-url' | 'ip-whitelist';
type AccessConfigItem = MerchantSourceUrlItem | MerchantIpWhitelistItem;

interface AccessConfigQuery {
    keyword: string;
    approvalStatus?: number;
    status?: number;
}

const props = defineProps<{ kind: AccessConfigKind }>();
const { t } = useI18n();
const rows = ref<AccessConfigItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const showSearch = ref(true);
const submitVisible = ref(false);
const detailVisible = ref(false);
const detailRow = ref<AccessConfigItem>();
const page = ref(1);
const pageSize = ref(20);
const query = reactive<AccessConfigQuery>({ keyword: '' });
const appliedQuery = reactive<AccessConfigQuery>({ keyword: '' });
const submitForm = reactive({ values: '', remark: '' });
const isSourceUrl = computed(() => props.kind === 'source-url');
const title = computed(() => t(isSourceUrl.value ? 'accessConfig.sourceUrlTitle' : 'accessConfig.ipWhitelistTitle'));
const submitTitle = computed(() => t(isSourceUrl.value ? 'accessConfig.submitSourceUrl' : 'accessConfig.submitIpWhitelist'));
const detailTitle = computed(() => t(isSourceUrl.value ? 'accessConfig.sourceUrlDetailTitle' : 'accessConfig.ipWhitelistDetailTitle'));
const valueColumnLabel = computed(() => t(isSourceUrl.value ? 'accessConfig.sourceUrlValue' : 'accessConfig.ipValue'));
const keywordPlaceholder = computed(() => t(isSourceUrl.value ? 'accessConfig.sourceUrlKeywordPlaceholder' : 'accessConfig.ipKeywordPlaceholder'));
const inputPlaceholder = computed(() => t(isSourceUrl.value ? 'accessConfig.sourceUrlPlaceholder' : 'accessConfig.ipPlaceholder'));
const emptyText = computed(() => t(isSourceUrl.value ? 'accessConfig.sourceUrlEmpty' : 'accessConfig.ipWhitelistEmpty'));
const tableKey = computed(() => `merchant-access-config-${props.kind}`);
const canSubmit = computed(() => hasPermission(isSourceUrl.value
    ? 'merchant:access-config:source-url:submit'
    : 'merchant:access-config:ip-whitelist:submit'));
const canDetail = computed(() => hasPermission(isSourceUrl.value
    ? 'merchant:access-config:source-url:detail'
    : 'merchant:access-config:ip-whitelist:detail'));
const filteredRows = computed(() => {
    const keyword = appliedQuery.keyword.trim().toLowerCase();
    return rows.value.filter((item) =>
        (!keyword || itemValue(item).toLowerCase().includes(keyword))
        && (appliedQuery.approvalStatus === undefined || item.approvalStatus === appliedQuery.approvalStatus)
        && (appliedQuery.status === undefined || item.status === appliedQuery.status));
});
const pagedRows = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    return filteredRows.value.slice(start, start + pageSize.value);
});

watch(pageSize, () => { page.value = 1; });
onMounted(loadData);

async function loadData() {
    loading.value = true;
    try {
        rows.value = isSourceUrl.value
            ? await accessConfigApi.listSourceUrls()
            : await accessConfigApi.listIpWhitelists();
        if ((page.value - 1) * pageSize.value >= filteredRows.value.length) page.value = 1;
    } catch (error: any) {
        rows.value = [];
        ElMessage.error(error?.friendlyMessage || error?.message || t('accessConfig.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function applyQuery() {
    Object.assign(appliedQuery, query);
    page.value = 1;
}

function resetQuery() {
    Object.assign(query, { keyword: '', approvalStatus: undefined, status: undefined });
    applyQuery();
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

function ipTypeText(item: AccessConfigItem) {
    return 'ipValue' in item ? item.ipType || '-' : '-';
}

function createdAt(item: AccessConfigItem) {
    return 'sourceUrl' in item ? item.createTime : item.gmtCreate;
}

function updatedAt(item: AccessConfigItem) {
    return 'sourceUrl' in item ? item.updateTime : item.gmtModified;
}
</script>

<style scoped>
.access-config-search-form :deep(.el-input),
.access-config-search-form :deep(.el-select) {
    width: 210px;
}

.config-value {
    color: var(--el-text-color-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
}

.config-value.is-detail {
    overflow-wrap: anywhere;
    white-space: normal;
}

.access-config-detail {
    padding: 0 18px;
}

@media (max-width: 640px) {
    .access-config-search-form :deep(.el-form-item),
    .access-config-search-form :deep(.el-input),
    .access-config-search-form :deep(.el-select) {
        width: 100%;
    }

    .pagination-container {
        justify-content: flex-start;
        overflow-x: auto;
    }

    .pagination-container :deep(.el-pagination__jump) {
        display: none;
    }
}
</style>

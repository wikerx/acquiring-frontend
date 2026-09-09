<!-- Admin 结算档案主页面：查询和维护商户结算账户、币种、时区、日切及处理模式，保存仍由后端校验业务约束。 -->
<template>
    <div class="app-container settlement-profile-page">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('transaction.settlement.profileNo')">
                <el-input v-model.trim="query.settlementProfileNo" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantId')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.settlement.targetCurrency')">
                <el-input v-model.trim="query.targetCurrency" clearable maxlength="3" :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.settlement.processingMode')">
                <el-select v-model="query.processingMode" clearable :placeholder="t('common.pleaseSelect')">
                    <el-option v-for="mode in processingModes" :key="mode" :value="mode" :label="modeText(mode)" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.profileStatus" clearable :placeholder="t('common.pleaseSelect')">
                    <el-option v-for="status in profileStatuses" :key="status" :value="status" :label="statusText(status)" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </el-col>
        </el-row>

        <StandardTable v-loading="loading" table-key="admin-settlement-profiles" :data="rows" row-key="id" size="small">
            <el-table-column prop="settlementProfileNo" :label="t('transaction.settlement.profileNo')" min-width="210" fixed="left" align="center" show-overflow-tooltip />
            <el-table-column :label="t('transaction.settlement.merchant')" min-width="210" align="center">
                <template #default="{ row }">
                    <MerchantIdentityDisplay :merchant-id="row.merchantId" :merchant-name="row.merchantName" clickable @click="openMerchant(row.merchantId)" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.settlementAccount')" min-width="210" align="center">
                <template #default="{ row }">
                    <button
                        type="button"
                        class="identity-link"
                        :title="row.settlementAccountNo || `#${row.settlementAccountId}`"
                        @click="openAccount(row)"
                    >
                        <strong>{{ row.settlementAccountNo || `#${row.settlementAccountId}` }}</strong>
                        <el-tag size="small" effect="plain" :type="accountStatusTagType(row.settlementAccountStatus)">
                            {{ accountStatusText(row.settlementAccountStatus) }}
                        </el-tag>
                    </button>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.targetCurrency')" width="116" align="center">
                <template #default="{ row }"><strong>{{ row.targetCurrency }}</strong></template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.processingMode')" min-width="150" align="center">
                <template #default="{ row }"><el-tag effect="plain" :type="modeTagType(row.processingMode)">{{ modeText(row.processingMode) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.cutoffSchedule')" min-width="190" align="center">
                <template #default="{ row }">
                    <div class="schedule-cell" :title="`${row.businessTimeZone || '-'} ${normalizedTime(row.dailyCutoffTime)}`">
                        <span>{{ row.businessTimeZone || '-' }}</span>
                        <strong>{{ normalizedTime(row.dailyCutoffTime) }}</strong>
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('common.status')" width="108" align="center">
                <template #default="{ row }"><el-tag effect="plain" :type="row.profileStatus === 'ACTIVE' ? 'success' : 'info'">{{ statusText(row.profileStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.effectivePeriod')" min-width="196" align="center">
                <template #default="{ row }">{{ row.effectiveDate }} ~ {{ row.expireDate || t('transaction.settlement.longTerm') }}</template>
            </el-table-column>
            <el-table-column :label="t('common.updateTime')" min-width="176" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="150" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button v-hasPermi="'settlement:profile:detail'" link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                    <el-button v-hasPermi="'settlement:profile:update'" link type="primary" :icon="Edit" @click="openEdit(row)">{{ t('common.edit') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-show="total > 0" class="pagination-container">
            <el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total"
                :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background
                @current-change="loadData" @size-change="handleSearch" />
        </div>

        <el-drawer v-model="detailVisible" :title="t('transaction.settlement.profileDetail')" size="min(680px, 96vw)" destroy-on-close>
            <el-descriptions v-if="detail" :column="2" border size="small">
                <el-descriptions-item :label="t('transaction.settlement.profileNo')" :span="2">{{ detail.settlementProfileNo }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.merchant')"><MerchantIdentityDisplay :merchant-id="detail.merchantId" :merchant-name="detail.merchantName" clickable @click="openMerchant(detail.merchantId)" /></el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.settlementAccount')"><el-button link type="primary" @click="openAccount(detail)">{{ detail.settlementAccountNo || detail.settlementAccountId }}</el-button></el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.targetCurrency')">{{ detail.targetCurrency }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.processingMode')">{{ modeText(detail.processingMode) }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.businessTimeZone')">{{ detail.businessTimeZone }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.dailyCutoffTime')">{{ normalizedTime(detail.dailyCutoffTime) }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.status')">{{ statusText(detail.profileStatus) }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.expectedVersion')">{{ detail.version }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.effectiveDate')">{{ detail.effectiveDate }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.expireDate')">{{ detail.expireDate || t('transaction.settlement.longTerm') }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.createTime')"><BaseDateTime :value="detail.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('common.updateTime')"><BaseDateTime :value="detail.updateTime" /></el-descriptions-item>
            </el-descriptions>
        </el-drawer>

        <el-dialog v-model="editVisible" :title="t('transaction.settlement.editProfile')" width="640px" destroy-on-close>
            <el-alert :title="t('transaction.settlement.profileIdentityReadonly')" type="info" show-icon :closable="false" />
            <div v-if="editing" class="profile-identity">
                <div><span>{{ t('transaction.settlement.merchant') }}</span><MerchantIdentityDisplay :merchant-id="editing.merchantId" :merchant-name="editing.merchantName" /></div>
                <div><span>{{ t('transaction.settlement.settlementAccount') }}</span><strong>{{ editing.settlementAccountNo || editing.settlementAccountId }}</strong></div>
                <div><span>{{ t('transaction.settlement.targetCurrency') }}</span><strong>{{ editing.targetCurrency }}</strong></div>
            </div>
            <el-form :model="editForm" label-width="112px" class="profile-edit-form">
                <el-form-item :label="t('transaction.settlement.processingMode')" required>
                    <el-segmented v-model="editForm.processingMode" :options="modeOptions" block />
                </el-form-item>
                <div class="mode-explanation">
                    <strong>{{ modeText(editForm.processingMode) }}</strong>
                    <span>{{ t(`transaction.settlement.processingModeDescription.${editForm.processingMode}`) }}</span>
                </div>
                <el-form-item :label="t('transaction.settlement.businessTimeZone')" required>
                    <el-input v-model.trim="editForm.businessTimeZone" placeholder="Asia/Shanghai" />
                </el-form-item>
                <el-form-item :label="t('transaction.settlement.dailyCutoffTime')" required>
                    <el-time-picker v-model="editForm.dailyCutoffTime" value-format="HH:mm:ss" format="HH:mm:ss" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="saving" @click="saveProfile">{{ t('common.save') }}</el-button>
                    <el-button @click="editVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Edit, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { MerchantIdentityDisplay } from '@acquiring/shared';
import {
    getSettlementProfile, searchSettlementProfiles, updateSettlementProfile,
    type SettlementProfile, type SettlementProfileQuery,
} from '@/api/settlement';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const processingModes = ['AUTO_POST', 'AUTO_REVIEW', 'MANUAL'];
const profileStatuses = ['ACTIVE', 'SUSPENDED', 'RETIRED'];
const showSearch = ref(true);
const loading = ref(false);
const saving = ref(false);
const rows = ref<SettlementProfile[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const detail = ref<SettlementProfile | null>(null);
const editVisible = ref(false);
const editing = ref<SettlementProfile | null>(null);
const query = reactive<SettlementProfileQuery>({ pageNo: 1, pageSize: 10 });
const editForm = reactive({ processingMode: 'AUTO_POST', businessTimeZone: '', dailyCutoffTime: '' });
const modeOptions = computed(() => processingModes.map((value) => ({ value, label: modeText(value) })));

onMounted(() => {
    query.settlementProfileNo = routeText('settlementProfileNo');
    query.merchantId = routeText('merchantId');
    query.targetCurrency = routeText('targetCurrency');
    void loadData().then(async () => {
        if (!userStore.hasPermission('settlement:profile:detail')) return;
        const linkedProfileNo = routeText('settlementProfileNo');
        const linkedRow = linkedProfileNo
            ? rows.value.find((row) => row.settlementProfileNo === linkedProfileNo)
            : rows.value.length === 1 && (routeText('merchantId') || routeText('targetCurrency')) ? rows.value[0] : undefined;
        if (linkedRow) await openDetail(linkedRow);
    });
});

async function loadData() {
    loading.value = true;
    try {
        const result = await searchSettlementProfiles({
            ...query,
            settlementProfileNo: query.settlementProfileNo || undefined,
            merchantId: query.merchantId || undefined,
            targetCurrency: query.targetCurrency?.toUpperCase() || undefined,
            processingMode: query.processingMode || undefined,
            profileStatus: query.profileStatus || undefined,
        });
        rows.value = result.records || [];
        total.value = result.total || 0;
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() { query.pageNo = 1; loadData(); }
function handleReset() {
    Object.assign(query, { settlementProfileNo: undefined, merchantId: undefined, targetCurrency: undefined, processingMode: undefined, profileStatus: undefined, pageNo: 1 });
    loadData();
}

async function openDetail(row: SettlementProfile) {
    detailVisible.value = true;
    detail.value = null;
    try { detail.value = await getSettlementProfile(row.settlementProfileNo); }
    catch (error) { ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed')); }
}

async function openEdit(row: SettlementProfile) {
    try {
        editing.value = await getSettlementProfile(row.settlementProfileNo);
        Object.assign(editForm, {
            processingMode: editing.value.processingMode,
            businessTimeZone: editing.value.businessTimeZone,
            dailyCutoffTime: editableTime(editing.value.dailyCutoffTime),
        });
        editVisible.value = true;
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

async function saveProfile() {
    if (!editing.value || !editForm.processingMode || !editForm.businessTimeZone || !editForm.dailyCutoffTime) {
        ElMessage.warning(t('transaction.settlement.requiredFields'));
        return;
    }
    try {
        await ElMessageBox.confirm(
            t('transaction.settlement.profileUpdateConfirm'),
            t('transaction.settlement.editProfile'),
            { type: 'warning', confirmButtonText: t('common.save'), cancelButtonText: t('common.cancel') },
        );
    } catch {
        return;
    }
    saving.value = true;
    try {
        await updateSettlementProfile(editing.value.settlementProfileNo, {
            processingMode: editForm.processingMode,
            businessTimeZone: editForm.businessTimeZone,
            dailyCutoffTime: editForm.dailyCutoffTime,
            expectedVersion: editing.value.version,
        });
        ElMessage.success(t('transaction.settlement.profileUpdated'));
        editVisible.value = false;
        await loadData();
    } catch (error) {
        if (error !== 'cancel') ElMessage.error(error instanceof Error ? error.message : t('common.operationFailed'));
    } finally {
        saving.value = false;
    }
}

function openMerchant(merchantId: string) { router.push({ path: '/merchant/info', query: { merchantId } }); }
function openAccount(profile: SettlementProfile) {
    router.push({
        path: '/fund/account',
        query: {
            merchantId: profile.merchantId,
            accountNo: profile.settlementAccountNo,
            settlementCurrency: profile.targetCurrency,
        },
    });
}
function routeText(key: string) {
    const value = route.query[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
function translatedValue(group: string, value?: string) {
    if (!value) return '-';
    const key = `transaction.settlement.${group}.${value}`;
    return te(key) ? t(key) : value;
}
function modeText(value?: string) { return translatedValue('processingModeValue', value); }
function statusText(value?: string) { return translatedValue('profileStatusValue', value); }
function accountStatusText(value?: string) { return translatedValue('accountStatusValue', value); }
function modeTagType(value?: string) { return value === 'AUTO_POST' ? 'success' : value === 'AUTO_REVIEW' ? 'warning' : 'info'; }
function accountStatusTagType(value?: string) { return value === 'NORMAL' ? 'success' : value === 'FROZEN' ? 'warning' : 'info'; }
function normalizedTime(value?: string) { return value ? value.slice(0, 8) : '-'; }
function editableTime(value?: string) { return value ? value.slice(0, 8) : ''; }
</script>

<style scoped>
.search-form :deep(.el-input), .search-form :deep(.el-select) { width: 220px; }
.identity-link { display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; width: 100%; padding: 0; border: 0; color: var(--el-color-primary); background: transparent; text-align: center; white-space: nowrap; cursor: pointer; }
.identity-link strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.identity-link :deep(.el-tag) { flex: 0 0 auto; }
.schedule-cell { display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; white-space: nowrap; }
.schedule-cell span { min-width: 0; overflow: hidden; color: var(--el-text-color-regular); font-size: 12px; text-overflow: ellipsis; }
.schedule-cell strong { flex: 0 0 auto; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
.profile-identity { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 18px 0; padding-bottom: 16px; border-bottom: 1px solid var(--el-border-color-lighter); }
.profile-identity div { display: grid; gap: 4px; min-width: 0; }
.profile-identity span { color: var(--el-text-color-secondary); font-size: 12px; }
.profile-identity strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-edit-form :deep(.el-segmented), .profile-edit-form :deep(.el-date-editor) { width: 100%; }
.mode-explanation { display: grid; gap: 4px; margin: -6px 0 18px 112px; padding: 10px 12px; border-left: 3px solid var(--el-color-primary); background: var(--el-fill-color-light); font-size: 13px; }
.mode-explanation span { color: var(--el-text-color-secondary); line-height: 1.55; }
@media (max-width: 720px) {
    .profile-identity { grid-template-columns: 1fr; }
    .mode-explanation { margin-left: 0; }
}
</style>

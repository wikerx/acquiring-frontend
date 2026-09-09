<template>
    <div class="app-container">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="82px">
            <el-form-item :label="$t('feeAccount.merchant')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('feeAccount.rechargeNo')">
                <el-input v-model="query.keyword" clearable :placeholder="$t('feeAccount.rechargeKeywordPlaceholder')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('common.status')">
                <el-select v-model="query.rechargeStatus" clearable :placeholder="$t('feeAccount.allStatuses')">
                    <el-option v-for="item in rechargeStatuses" :key="item" :label="statusText(item)" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="RefreshLeft" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button v-hasPermi="'fund:recharge:add'" type="primary" plain :icon="CreditCard" size="small" @click="openCreate()">{{ $t('feeAccount.recharge') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button v-hasPermi="'fund:recharge:export'" type="warning" plain :icon="Download" size="small" @click="handleExport">{{ $t('common.export') }}</el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadRecharges" />
            </el-col>
        </el-row>

        <StandardTable v-loading="loading" table-key="admin-fund-recharge-list" :data="rows" row-key="id" size="small">
            <el-table-column prop="rechargeNo" :label="$t('feeAccount.rechargeNo')" min-width="190" fixed="left" align="center" show-overflow-tooltip />
            <el-table-column :label="$t('feeAccount.merchant')" min-width="240" align="center">
                <template #default="{ row }"><MerchantIdentityDisplay :merchant-id="row.merchantId" :merchant-name="row.merchantName" clickable @click="openMerchant(row.merchantId)" /></template>
            </el-table-column>
            <el-table-column prop="accountNo" :label="$t('feeAccount.accountNo')" min-width="180" align="center" show-overflow-tooltip />
            <el-table-column :label="$t('feeAccount.rechargeAmount')" min-width="150" align="right">
                <template #default="{ row }"><BaseAmount :value="row.amount" :currency="row.currency" currency-display="code" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.status')" width="135" align="center">
                <template #default="{ row }"><el-tag :type="statusType(row.rechargeStatus)">{{ statusText(row.rechargeStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="submitByName" :label="$t('feeAccount.submitter')" width="115" align="center" />
            <el-table-column :label="$t('feeAccount.submitTime')" min-width="170" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.submitTime" /></template>
            </el-table-column>
            <el-table-column prop="auditByName" :label="$t('feeAccount.auditor')" width="115" align="center" />
            <el-table-column prop="recheckByName" :label="$t('feeAccount.rechecker')" width="115" align="center" />
            <el-table-column :label="$t('feeAccount.postedTime')" min-width="170" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.postedTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="230" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button link type="primary" :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                    <el-button v-if="row.rechargeStatus === 'PENDING_AUDIT'" v-hasPermi="'fund:recharge:audit'" link type="success" :icon="CircleCheck" @click="openAction('audit', row)">{{ $t('feeAccount.audit') }}</el-button>
                    <el-button v-if="row.rechargeStatus === 'PENDING_RECHECK'" v-hasPermi="'fund:recharge:recheck'" link type="success" :icon="Checked" @click="openAction('recheck', row)">{{ $t('feeAccount.recheck') }}</el-button>
                    <el-button v-if="['PENDING_AUDIT', 'PENDING_RECHECK'].includes(row.rechargeStatus)" v-hasPermi="'fund:recharge:reject'" link type="danger" :icon="CircleClose" @click="openAction('reject', row)">{{ $t('feeAccount.reject') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-show="total > 0" class="pagination-container">
            <el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadRecharges" @size-change="handleSearch" />
        </div>

        <el-dialog v-model="createVisible" :title="$t('feeAccount.createRechargeTitle')" width="620px" append-to-body destroy-on-close>
            <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="112px" class="dialog-form">
                <el-form-item :label="$t('feeAccount.merchant')" prop="merchantId">
                    <MerchantRemoteSelect v-model="createForm.merchantId" @change="handleMerchantChange" />
                </el-form-item>
                <el-form-item :label="$t('feeAccount.fundAccountTitle')" prop="accountId">
                    <el-select v-model="createForm.accountId" filterable :loading="accountLoading" :placeholder="$t('feeAccount.selectFundAccount')" @change="syncSelectedAccount">
                        <el-option v-for="item in accountOptions" :key="item.id" :label="`${item.accountNo} / ${item.settlementCurrency}`" :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('feeAccount.rechargeCurrency')">
                    <el-input :model-value="selectedAccount?.settlementCurrency || '-'" disabled />
                </el-form-item>
                <el-form-item :label="$t('feeAccount.rechargeAmount')" prop="amount">
                    <el-input v-model.trim="createForm.amount" inputmode="decimal" :placeholder="$t('feeAccount.rechargeAmountPlaceholder')">
                        <template #append>{{ selectedAccount?.settlementCurrency || '---' }}</template>
                    </el-input>
                    <div class="field-hint">{{ $t('feeAccount.rechargeLimitHint') }}</div>
                </el-form-item>
                <el-form-item :label="$t('common.remark')" prop="remark">
                    <el-input v-model.trim="createForm.remark" type="textarea" :rows="4" maxlength="500" show-word-limit :placeholder="$t('feeAccount.rechargeRemarkPlaceholder')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="submitting" @click="submitRecharge">{{ $t('common.submit') }}</el-button>
                    <el-button @click="createVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="actionVisible" :title="actionTitle" width="520px" append-to-body destroy-on-close>
            <el-alert :title="actionNotice" :type="actionMode === 'reject' ? 'warning' : 'info'" :closable="false" show-icon />
            <el-form ref="actionFormRef" :model="actionForm" :rules="actionRules" label-width="94px" class="dialog-form action-form">
                <el-form-item :label="$t('feeAccount.rechargeNo')">{{ actionTarget?.rechargeNo }}</el-form-item>
                <el-form-item :label="$t('feeAccount.rechargeAmount')">
                    <BaseAmount v-if="actionTarget" :value="actionTarget.amount" :currency="actionTarget.currency" currency-display="code" />
                </el-form-item>
                <el-form-item :label="$t('feeAccount.reviewComment')" prop="comment">
                    <el-input v-model.trim="actionForm.comment" type="textarea" :rows="4" maxlength="500" show-word-limit :placeholder="$t('feeAccount.reviewCommentPlaceholder')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button :type="actionMode === 'reject' ? 'danger' : 'primary'" :loading="submitting" @click="submitAction">{{ actionConfirmText }}</el-button>
                    <el-button @click="actionVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('feeAccount.rechargeDetailTitle')" size="lg">
            <div v-if="detail" class="recharge-detail">
                <section class="recharge-amount-band">
                    <span>{{ $t('feeAccount.rechargeAmount') }}</span>
                    <strong><BaseAmount :value="detail.amount" :currency="detail.currency" currency-display="code" /></strong>
                    <el-tag :type="statusType(detail.rechargeStatus)">{{ statusText(detail.rechargeStatus) }}</el-tag>
                </section>
                <section class="review-band is-submit">
                    <h4>{{ $t('feeAccount.rechargeInformation') }}</h4>
                    <el-descriptions :column="2" size="small">
                        <el-descriptions-item :label="$t('feeAccount.rechargeNo')">{{ detail.rechargeNo }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.requestId')">{{ detail.requestId }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.merchant')" :span="2"><MerchantIdentityDisplay :merchant-id="detail.merchantId" :merchant-name="detail.merchantName" clickable @click="openMerchant(detail.merchantId)" /></el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.accountNo')">{{ detail.accountNo }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.rechargeCurrency')">{{ detail.currency }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('common.remark')" :span="2">{{ detail.remark }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.submitter')">{{ detail.submitByName || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.submitTime')"><BaseDateTime :value="detail.submitTime" /></el-descriptions-item>
                    </el-descriptions>
                </section>
                <section v-if="detail.auditByName || detail.auditTime || detail.auditComment" class="review-band is-audit">
                    <h4>{{ $t('feeAccount.auditInformation') }}</h4>
                    <el-descriptions :column="2" size="small">
                        <el-descriptions-item :label="$t('feeAccount.auditor')">{{ detail.auditByName || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.auditTime')"><BaseDateTime :value="detail.auditTime" /></el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.auditComment')" :span="2">{{ detail.auditComment || '-' }}</el-descriptions-item>
                    </el-descriptions>
                </section>
                <section v-if="detail.recheckByName || detail.recheckTime || detail.recheckComment" class="review-band is-recheck">
                    <h4>{{ $t('feeAccount.recheckInformation') }}</h4>
                    <el-descriptions :column="2" size="small">
                        <el-descriptions-item :label="$t('feeAccount.rechecker')">{{ detail.recheckByName || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.recheckTime')"><BaseDateTime :value="detail.recheckTime" /></el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.recheckComment')" :span="2">{{ detail.recheckComment || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.ledgerNo')">{{ detail.ledgerNo || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.postedTime')"><BaseDateTime :value="detail.postedTime" /></el-descriptions-item>
                    </el-descriptions>
                </section>
                <section v-if="detail.rejectByName || detail.rejectTime || detail.rejectComment" class="review-band is-reject">
                    <h4>{{ $t('feeAccount.rejectInformation') }}</h4>
                    <el-descriptions :column="2" size="small">
                        <el-descriptions-item :label="$t('feeAccount.rejectOperator')">{{ detail.rejectByName || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.rejectTime')"><BaseDateTime :value="detail.rejectTime" /></el-descriptions-item>
                        <el-descriptions-item :label="$t('feeAccount.rejectComment')" :span="2">{{ detail.rejectComment || '-' }}</el-descriptions-item>
                    </el-descriptions>
                </section>
            </div>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { Checked, CircleCheck, CircleClose, CreditCard, Download, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { MerchantIdentityDisplay } from '@acquiring/shared';
import {
    auditFundRecharge,
    createFundRecharge,
    exportFundRecharges,
    getFundAccount,
    recheckFundRecharge,
    rejectFundRecharge,
    searchFundAccounts,
    searchFundRecharges,
    type FundAccount,
    type FundRecharge,
    type FundRechargeQuery,
} from '@/api/fund';
import BaseAmount from '@/components/BaseAmount/index.vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';

type ActionMode = 'audit' | 'recheck' | 'reject';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const rechargeStatuses = ['PENDING_AUDIT', 'PENDING_RECHECK', 'POSTED', 'REJECTED'];
const showSearch = ref(true);
const loading = ref(false);
const submitting = ref(false);
const rows = ref<FundRecharge[]>([]);
const total = ref(0);
const query = ref<FundRechargeQuery>({ pageNo: 1, pageSize: 10 });
const detailVisible = ref(false);
const detail = ref<FundRecharge | null>(null);

const createVisible = ref(false);
const createFormRef = ref<FormInstance>();
const accountLoading = ref(false);
const accountOptions = ref<FundAccount[]>([]);
const selectedAccount = ref<FundAccount | null>(null);
const createForm = reactive({
    merchantId: '',
    accountId: undefined as number | undefined,
    amount: '',
    remark: '',
});
const createRules: FormRules = {
    merchantId: [{ required: true, message: t('feeAccount.selectMerchantRequired'), trigger: 'change' }],
    accountId: [{ required: true, message: t('feeAccount.selectFundAccountRequired'), trigger: 'change' }],
    amount: [{ validator: validateRechargeAmount, trigger: 'blur' }],
    remark: [{ required: true, message: t('feeAccount.rechargeRemarkRequired'), trigger: 'blur' }],
};

const actionVisible = ref(false);
const actionFormRef = ref<FormInstance>();
const actionMode = ref<ActionMode>('audit');
const actionTarget = ref<FundRecharge | null>(null);
const actionForm = reactive({ comment: '' });
const actionTitle = computed(() => t(`feeAccount.${actionMode.value}RechargeTitle`));
const actionNotice = computed(() => t(`feeAccount.${actionMode.value}RechargeNotice`));
const actionConfirmText = computed(() => t(actionMode.value === 'reject' ? 'feeAccount.confirmReject' : 'common.confirm'));
const actionRules = computed<FormRules>(() => ({
    comment: actionMode.value === 'reject'
        ? [{ required: true, message: t('feeAccount.rejectionReasonRequired'), trigger: 'blur' }]
        : [],
}));

onMounted(async () => {
    const merchantId = typeof route.query.merchantId === 'string' ? route.query.merchantId.trim() : '';
    if (merchantId) query.value.merchantId = merchantId;
    await loadRecharges();
    const accountId = Number(route.query.accountId);
    if (Number.isSafeInteger(accountId) && accountId > 0) {
        await openCreate(accountId);
        await router.replace({ path: route.path, query: merchantId ? { merchantId } : {} });
    }
});

/** Load recharge applications under the current query. */
async function loadRecharges() {
    loading.value = true;
    try {
        const result = await searchFundRecharges(query.value);
        rows.value = result.records || [];
        total.value = result.total || 0;
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    query.value.pageNo = 1;
    loadRecharges();
}

function handleReset() {
    query.value = { pageNo: 1, pageSize: query.value.pageSize || 10 };
    loadRecharges();
}

async function handleExport() {
    try {
        await exportFundRecharges(query.value);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

async function openCreate(accountId?: number) {
    Object.assign(createForm, { merchantId: '', accountId: undefined, amount: '', remark: '' });
    accountOptions.value = [];
    selectedAccount.value = null;
    if (accountId) {
        accountLoading.value = true;
        try {
            const account = await getFundAccount(accountId);
            createForm.merchantId = account.merchantId;
            createForm.accountId = account.id;
            accountOptions.value = [account];
            selectedAccount.value = account;
        } finally {
            accountLoading.value = false;
        }
    }
    createVisible.value = true;
    nextTick(() => createFormRef.value?.clearValidate());
}

async function handleMerchantChange(value: string | string[]) {
    const merchantId = Array.isArray(value) ? value[0] : value;
    createForm.accountId = undefined;
    selectedAccount.value = null;
    accountOptions.value = [];
    if (!merchantId) return;
    accountLoading.value = true;
    try {
        const result = await searchFundAccounts({ pageNo: 1, pageSize: 20, keyword: merchantId });
        accountOptions.value = (result.records || []).filter((item) => item.merchantId === merchantId);
        if (accountOptions.value.length === 1) {
            createForm.accountId = accountOptions.value[0].id;
            selectedAccount.value = accountOptions.value[0];
        }
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        accountLoading.value = false;
    }
}

function syncSelectedAccount(accountId: number) {
    selectedAccount.value = accountOptions.value.find((item) => item.id === accountId) || null;
}

async function submitRecharge() {
    const valid = await createFormRef.value?.validate().catch(() => false);
    if (!valid || !createForm.accountId) return;
    submitting.value = true;
    try {
        await createFundRecharge({
            accountId: createForm.accountId,
            amount: createForm.amount,
            requestId: createRequestId(),
            remark: createForm.remark,
        });
        ElMessage.success(t('feeAccount.rechargeSubmitted'));
        createVisible.value = false;
        await loadRecharges();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    } finally {
        submitting.value = false;
    }
}

function openAction(mode: ActionMode, row: FundRecharge) {
    actionMode.value = mode;
    actionTarget.value = row;
    actionForm.comment = '';
    actionVisible.value = true;
    nextTick(() => actionFormRef.value?.clearValidate());
}

async function submitAction() {
    const valid = await actionFormRef.value?.validate().catch(() => false);
    if (!valid || !actionTarget.value) return;
    submitting.value = true;
    try {
        if (actionMode.value === 'audit') {
            await auditFundRecharge(actionTarget.value.id, actionForm.comment || undefined);
        } else if (actionMode.value === 'recheck') {
            await recheckFundRecharge(actionTarget.value.id, actionForm.comment || undefined);
        } else {
            await rejectFundRecharge(actionTarget.value.id, actionForm.comment);
        }
        ElMessage.success(t('common.success'));
        actionVisible.value = false;
        await loadRecharges();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    } finally {
        submitting.value = false;
    }
}

function openDetail(row: FundRecharge) {
    detail.value = row;
    detailVisible.value = true;
}

function openMerchant(merchantId: string) {
    router.push({ path: '/merchant/info', query: { merchantId } });
}

function validateRechargeAmount(_rule: unknown, value: string, callback: (error?: Error) => void) {
    if (!/^\d+(\.\d+)?$/.test(String(value || ''))) {
        callback(new Error(t('feeAccount.rechargeAmountInvalid')));
        return;
    }
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 100 || numericValue > 100000000) {
        callback(new Error(t('feeAccount.rechargeAmountInvalid')));
        return;
    }
    callback();
}

function createRequestId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `recharge-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function statusText(value: string) {
    return t(`feeAccount.rechargeStatus.${value}`);
}

function statusType(value: string) {
    if (value === 'POSTED') return 'success';
    if (value === 'REJECTED') return 'danger';
    return value === 'PENDING_RECHECK' ? 'warning' : 'info';
}
</script>

<style scoped>
.search-form :deep(.el-select),
.search-form :deep(.el-input) { width: 220px; }
.dialog-form { padding: 4px 20px 0; }
.dialog-form :deep(.el-select),
.dialog-form :deep(.merchant-remote-select) { width: 100%; }
.field-hint { width: 100%; margin-top: 5px; color: #909399; font-size: 12px; line-height: 18px; }
.action-form { margin-top: 18px; }
.recharge-detail { display: grid; gap: 16px; min-width: 0; }
.recharge-amount-band { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 4px 16px; padding: 18px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; }
.recharge-amount-band span { color: #7a8494; font-size: 12px; }
.recharge-amount-band strong { color: #17243a; font-size: 22px; letter-spacing: 0; }
.recharge-amount-band .el-tag { grid-column: 2; grid-row: 1 / span 2; }
.review-band { padding: 14px 16px 8px; border-left: 3px solid #94a3b8; border-radius: 4px; background: #f8fafc; }
.review-band h4 { margin: 0 0 10px; color: #344054; font-size: 13px; font-weight: 700; letter-spacing: 0; }
.review-band.is-submit { border-left-color: #3b82c4; background: #f5faff; }
.review-band.is-audit { border-left-color: #d49b2f; background: #fffbf2; }
.review-band.is-recheck { border-left-color: #1f9d78; background: #f3faf7; }
.review-band.is-reject { border-left-color: #d45d56; background: #fff7f6; }
</style>

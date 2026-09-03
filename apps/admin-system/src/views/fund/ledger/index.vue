<template>
    <div class="app-container fund-ledger-page">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="82px">
            <el-form-item :label="$t('feeAccount.merchant')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('feeAccount.accountNo')">
                <el-input v-model.trim="query.accountNo" clearable :placeholder="$t('feeAccount.accountNoPlaceholder')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('common.keyword')">
                <el-input v-model.trim="query.keyword" clearable :placeholder="$t('feeAccount.ledgerSearchPlaceholder')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('feeAccount.businessType')">
                <el-select v-model="query.businessType" clearable filterable :placeholder="$t('common.pleaseSelect')">
                    <el-option v-for="item in businessTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('feeAccount.direction')">
                <el-select v-model="query.direction" clearable :placeholder="$t('common.pleaseSelect')">
                    <el-option v-for="item in directionOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('feeAccount.currency')">
                <CurrencySelect v-model="query.currency" />
            </el-form-item>
            <el-form-item :label="$t('feeAccount.postedTime')">
                <el-date-picker
                    v-model="postedRange"
                    class="posted-range"
                    type="datetimerange"
                    :default-time="FULL_DAY_RANGE_DEFAULT_TIMES"
                    :range-separator="$t('common.to')"
                    :start-placeholder="$t('common.startTime')"
                    :end-placeholder="$t('common.endTime')"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    format="YYYY-MM-DD HH:mm:ss"
                />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="RefreshLeft" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button v-hasPermi="'fund:ledger:all:export'" type="warning" plain :icon="Download" size="small" :loading="exporting" @click="handleExport">
                    {{ $t('common.export') }}
                </el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadLedgers" />
            </el-col>
        </el-row>

        <StandardTable v-loading="loading" table-key="admin-fund-ledger-all-list" :data="rows" row-key="id" size="small">
            <el-table-column prop="ledgerNo" :label="$t('feeAccount.ledgerNo')" min-width="200" fixed="left" align="center" show-overflow-tooltip />
            <el-table-column :label="$t('feeAccount.merchant')" min-width="240" align="center">
                <template #default="{ row }"><MerchantIdentityDisplay :merchant-id="row.merchantId" :merchant-name="row.merchantName" /></template>
            </el-table-column>
            <el-table-column prop="accountNo" :label="$t('feeAccount.accountNo')" min-width="180" align="center" show-overflow-tooltip />
            <el-table-column :label="$t('feeAccount.businessType')" min-width="150" align="center">
                <template #default="{ row }">{{ dictLabel(businessTypeOptions, row.businessType) }}</template>
            </el-table-column>
            <el-table-column prop="summary" :label="$t('feeAccount.summary')" min-width="210" align="center" show-overflow-tooltip />
            <el-table-column :label="$t('feeAccount.direction')" width="92" align="center">
                <template #default="{ row }">
                    <DirectionTag :direction="row.direction" :label="dictLabel(directionOptions, row.direction)" />
                </template>
            </el-table-column>
            <el-table-column :label="$t('feeAccount.occurredAmount')" min-width="150" align="right">
                <template #default="{ row }"><BaseAmount :value="row.amount" :currency="row.currency" currency-display="code" /></template>
            </el-table-column>
            <el-table-column :label="$t('feeAccount.balanceBefore')" min-width="150" align="right">
                <template #default="{ row }"><BaseAmount :value="row.balanceBefore" :currency="row.currency" currency-display="code" /></template>
            </el-table-column>
            <el-table-column :label="$t('feeAccount.balanceAfter')" min-width="150" align="right">
                <template #default="{ row }"><BaseAmount :value="row.balanceAfter" :currency="row.currency" currency-display="code" /></template>
            </el-table-column>
            <el-table-column prop="operatorName" :label="$t('feeAccount.operator')" width="115" align="center" />
            <el-table-column prop="reviewerName" :label="$t('feeAccount.reviewer')" width="115" align="center" />
            <el-table-column :label="$t('feeAccount.postedTime')" min-width="170" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.postedTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="84" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button link type="primary" :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-show="total > 0" class="pagination-container">
            <el-pagination
                v-model:current-page="query.pageNo"
                v-model:page-size="query.pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @current-change="loadLedgers"
                @size-change="handleSearch"
            />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('feeAccount.ledgerDetailTitle')" size="lg">
            <FundLedgerDetail
                v-if="detail"
                :ledger="detail"
                :business-type-label="dictLabel(businessTypeOptions, detail.businessType)"
            />
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { DirectionTag, FULL_DAY_RANGE_DEFAULT_TIMES, MerchantIdentityDisplay } from '@acquiring/shared';
import { Download, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import {
    exportAllFundLedgers,
    searchAllFundLedgers,
    type FundDetailQuery,
    type FundLedger,
} from '@/api/fund';
import BaseAmount from '@/components/BaseAmount/index.vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import CurrencySelect from '@/views/exchange/CurrencySelect.vue';
import FundLedgerDetail from '@/views/fund/components/FundLedgerDetail.vue';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import { defaultTodayFullDayRange } from '@/views/transaction/shared';

/**
 * 管理端全局余额明细页。查询范围由后端权限和条件共同限定，页面不缓存资金数据，
 * 只把字典标签用于展示，导出始终使用当前完整筛选条件。
 */
const { locale, t } = useI18n();
const loading = ref(false);
const exporting = ref(false);
const showSearch = ref(true);
const rows = ref<FundLedger[]>([]);
const total = ref(0);
const query = ref<FundDetailQuery>({ pageNo: 1, pageSize: 10 });
const postedRange = ref<string[]>(defaultTodayFullDayRange());
const businessTypeOptions = ref<SelectOption[]>([]);
const directionOptions = ref<SelectOption[]>([]);
const detailVisible = ref(false);
const detail = ref<FundLedger | null>(null);

onMounted(async () => {
    await loadDictionaries();
    await loadLedgers();
});

/** 加载资金流水字典；字典暂不可用时保留后端编码，避免阻塞查询。 */
async function loadDictionaries() {
    const currentLocale = String(locale.value || 'zh-CN');
    const [businessTypes, directions] = await Promise.all([
        loadDictOptions('fund_ledger_business_type', currentLocale).catch(() => []),
        loadDictOptions('fund_direction', currentLocale).catch(() => []),
    ]);
    businessTypeOptions.value = businessTypes;
    directionOptions.value = directions;
}

/** 组装分页查询条件，入账时间使用包含起止端点的系统时间范围。 */
function requestQuery(): FundDetailQuery {
    return {
        ...query.value,
        currency: query.value.currency?.toUpperCase(),
        postedStartTime: postedRange.value[0] || undefined,
        postedEndTime: postedRange.value[1] || undefined,
    };
}

/** 查询所有商户的不可变余额流水。 */
async function loadLedgers() {
    loading.value = true;
    try {
        const result = await searchAllFundLedgers(requestQuery());
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
    loadLedgers();
}

function handleReset() {
    query.value = { pageNo: 1, pageSize: query.value.pageSize || 10 };
    postedRange.value = defaultTodayFullDayRange();
    loadLedgers();
}

/** 按当前筛选条件下载全部余额明细，不受页面分页限制。 */
async function handleExport() {
    exporting.value = true;
    try {
        await exportAllFundLedgers(requestQuery());
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.exportFailed'));
    } finally {
        exporting.value = false;
    }
}

function openDetail(row: FundLedger) {
    detail.value = row;
    detailVisible.value = true;
}

function dictLabel(options: SelectOption[], value?: string) {
    if (!value) return '-';
    return options.find((item) => item.value === value)?.label || value;
}
</script>

<style scoped>
.search-form :deep(.el-select),
.search-form :deep(.el-input) { width: 220px; }
.search-form :deep(.posted-range) { width: 372px; }
@media (max-width: 720px) {
    .search-form :deep(.posted-range) { width: min(372px, 82vw); }
}
</style>

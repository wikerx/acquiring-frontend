<template>
    <div class="app-container exchange-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="$t('exchange.fields.rateType')">
                <el-select v-model="query.rateType" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in rateTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('exchange.fields.usageScene')">
                <el-select v-model="query.usageScene" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in usageSceneOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('exchange.fields.businessType')"><el-input v-model.trim="query.businessType" placeholder="PAYMENT" clearable @keyup.enter="handleSearch" @input="query.businessType = normalizeCurrency(query.businessType)" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.businessNo')"><el-input v-model.trim="query.businessNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.baseCurrency')"><CurrencySelect v-model="query.baseCurrency" @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.quoteCurrency')"><CurrencySelect v-model="query.quoteCurrency" @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.appliedTime')">
                <el-date-picker v-model="appliedRange" type="datetimerange" :start-placeholder="$t('exchange.placeholders.start')" :end-placeholder="$t('exchange.placeholders.end')" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'exchange:usage-snapshot:export'">{{ $t('common.export') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="exchange-usage-snapshot" v-loading="loading" :data="rows" row-key="id" size="small">
            <el-table-column :label="$t('exchange.fields.rateType')" min-width="120" align="center"><template #default="{ row }">{{ optionLabel(rateTypeOptions, row.rateType) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.usageScene')" min-width="110" align="center"><template #default="{ row }">{{ optionLabel(usageSceneOptions, row.usageScene) }}</template></el-table-column>
            <el-table-column prop="businessType" :label="$t('exchange.fields.businessType')" min-width="120" align="center" />
            <el-table-column prop="businessNo" :label="$t('exchange.fields.businessNo')" min-width="180" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('exchange.fields.currencyPair')" width="150" align="center"><template #default="{ row }">{{ formatCurrencyPair(translate, row.baseCurrency, row.quoteCurrency) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.usedRate')" min-width="150" align="right"><template #default="{ row }"><strong>{{ formatRate(row.usedRate) }}</strong></template></el-table-column>
            <el-table-column prop="businessRateId" :label="$t('exchange.fields.businessRateId')" width="110" align="center" />
            <el-table-column :label="$t('exchange.fields.appliedTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.appliedTime" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" width="110" align="center" fixed="right">
                <template #default="{ row }"><el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'exchange:usage-snapshot:detail'">{{ $t('common.detail') }}</el-button></template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('exchange.usageSnapshot.detailTitle')" size="lg">
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="$t('exchange.fields.rateType')">{{ optionLabel(rateTypeOptions, detailRow.rateType) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.usageScene')">{{ optionLabel(usageSceneOptions, detailRow.usageScene) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.businessType')">{{ detailRow.businessType }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.businessNo')">{{ detailRow.businessNo }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.currencyPair')">{{ formatCurrencyPair(translate, detailRow.baseCurrency, detailRow.quoteCurrency) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.usedRate')">{{ formatRate(detailRow.usedRate) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.businessRateId')">{{ detailRow.businessRateId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.rawRateId')">{{ detailRow.rawRateId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.ruleId')">{{ detailRow.ruleId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.appliedTime')"><BaseDateTime :value="detailRow.appliedTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.calculationDescription')">{{ detailRow.calculationDescription || '-' }}</el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Download, Refresh, Search, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { exportExchangeUsageSnapshots, getExchangeUsageSnapshot, searchExchangeUsageSnapshots, type ExchangeRateUsageSnapshot } from '@/api/exchange';
import CurrencySelect from '../CurrencySelect.vue';
import { formatCurrencyPair, formatRate, normalizeCurrency, optionLabel, rateTypeOptions as buildRateTypeOptions, usageSceneOptions as buildUsageSceneOptions } from '../shared';

const { t } = useI18n();
const translate = (key: string, params?: Record<string, unknown>) => t(key, params || {});
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ExchangeRateUsageSnapshot[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const appliedRange = ref<[string, string] | null>(null);
const detailVisible = ref(false);
const detailRow = ref<ExchangeRateUsageSnapshot | null>(null);

const query = reactive({
    rateType: '',
    usageScene: '',
    businessType: '',
    businessNo: '',
    baseCurrency: '',
    quoteCurrency: '',
});
const rateTypeOptions = computed(() => buildRateTypeOptions(translate));
const usageSceneOptions = computed(() => buildUsageSceneOptions(translate));

onMounted(loadData);

async function loadData() {
    loading.value = true;
    try {
        const [appliedStartTime, appliedEndTime] = appliedRange.value || [];
        const result = await searchExchangeUsageSnapshots({ pageNo: page.value, pageSize: pageSize.value, ...query, appliedStartTime, appliedEndTime });
        rows.value = result.records;
        total.value = result.total;
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    query.rateType = '';
    query.usageScene = '';
    query.businessType = '';
    query.businessNo = '';
    query.baseCurrency = '';
    query.quoteCurrency = '';
    appliedRange.value = null;
    handleSearch();
}

async function openDetail(row: ExchangeRateUsageSnapshot) {
    detailRow.value = await getExchangeUsageSnapshot(row.id);
    detailVisible.value = true;
}

async function handleExport() {
    const [appliedStartTime, appliedEndTime] = appliedRange.value || [];
    await exportExchangeUsageSnapshots({ pageNo: page.value, pageSize: pageSize.value, ...query, appliedStartTime, appliedEndTime });
}
</script>

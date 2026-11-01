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
            <el-form-item :label="$t('exchange.fields.businessType')"><el-input v-model.trim="query.businessType" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" @input="query.businessType = normalizeCurrency(query.businessType)" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.businessNo')"><el-input v-model.trim="query.businessNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.baseCurrency')"><CurrencySelect v-model="query.baseCurrency" @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.quoteCurrency')"><CurrencySelect v-model="query.quoteCurrency" @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.appliedTime')">
                <el-date-picker v-model="appliedRange" type="datetimerange" :default-time="FULL_DAY_RANGE_DEFAULT_TIMES" :clearable="false" :range-separator="$t('common.to')" :start-placeholder="$t('exchange.placeholders.start')" :end-placeholder="$t('exchange.placeholders.end')" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" />
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
            <el-table-column :label="$t('exchange.fields.rateType')" min-width="115" align="center"><template #default="{ row }"><el-tag size="small" effect="plain" :type="rateTypeTagType(row.rateType)">{{ optionLabel(rateTypeOptions, row.rateType) }}</el-tag></template></el-table-column>
            <el-table-column :label="$t('exchange.fields.usageScene')" min-width="90" align="center"><template #default="{ row }"><span class="scene-label">{{ optionLabel(usageSceneOptions, row.usageScene) }}</span></template></el-table-column>
            <el-table-column prop="businessType" :label="$t('exchange.fields.businessType')" min-width="150" align="center" :show-overflow-tooltip="true"><template #default="{ row }"><span class="code-label table-code-label">{{ row.businessType || '-' }}</span></template></el-table-column>
            <el-table-column prop="businessNo" :label="$t('exchange.fields.businessNo')" min-width="175" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('exchange.fields.currencyPair')" min-width="155" align="center"><template #default="{ row }"><CurrencyPairDisplay :base-currency="row.baseCurrency" :quote-currency="row.quoteCurrency" :locale="String(locale)" /></template></el-table-column>
            <el-table-column :label="$t('exchange.fields.usedRate')" min-width="130" align="right"><template #default="{ row }"><strong class="rate-value">{{ formatRate(row.usedRate) }}</strong></template></el-table-column>
            <el-table-column :label="$t('exchange.usageSnapshot.rateSection')" min-width="125" align="center">
                <template #default="{ row }">
                    <div class="rate-evidence">
                        <strong>{{ row.rateSource || '-' }}</strong>
                        <span v-if="row.businessRateId">#{{ row.businessRateId }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="$t('exchange.fields.appliedTime')" min-width="165" align="center"><template #default="{ row }"><BaseDateTime :value="row.appliedTime" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" width="90" align="center" fixed="right">
                <template #default="{ row }"><el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'exchange:usage-snapshot:detail'">{{ $t('common.detail') }}</el-button></template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('exchange.usageSnapshot.detailTitle')" size="lg">
            <div class="snapshot-detail" v-loading="detailLoading">
                <template v-if="detailRow">
                    <section class="detail-section">
                        <h3>{{ $t('exchange.usageSnapshot.eventSection') }}</h3>
                        <el-descriptions :column="1" border size="small">
                            <el-descriptions-item :label="$t('exchange.fields.usageEventId')"><span class="code-label code-label--wrap">{{ detailRow.usageEventId || '-' }}</span></el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.producerService')">{{ detailRow.producerService || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.businessType')">{{ detailRow.businessType || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.businessNo')">{{ detailRow.businessNo || '-' }}</el-descriptions-item>
                        </el-descriptions>
                    </section>

                    <section class="detail-section">
                        <h3>{{ $t('exchange.usageSnapshot.rateSection') }}</h3>
                        <el-descriptions :column="1" border size="small">
                            <el-descriptions-item :label="$t('exchange.fields.rateType')"><el-tag size="small" effect="plain" :type="rateTypeTagType(detailRow.rateType)">{{ optionLabel(rateTypeOptions, detailRow.rateType) }}</el-tag></el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.usageScene')">{{ optionLabel(usageSceneOptions, detailRow.usageScene) }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.currencyPair')"><CurrencyPairDisplay :base-currency="detailRow.baseCurrency" :quote-currency="detailRow.quoteCurrency" :locale="String(locale)" size="sm" variant="soft" /></el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.usedRate')"><strong class="rate-value rate-value--detail">{{ formatRate(detailRow.usedRate) }}</strong></el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.rateSource')">{{ detailRow.rateSource || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.sourceQuoteDirection')">{{ detailRow.sourceQuoteDirection || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.businessRateId')">{{ detailRow.businessRateId || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.rawRateId')">{{ detailRow.rawRateId || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.ruleId')">{{ detailRow.ruleId || '-' }}</el-descriptions-item>
                        </el-descriptions>
                    </section>

                    <section class="detail-section detail-section--last">
                        <h3>{{ $t('exchange.usageSnapshot.auditSection') }}</h3>
                        <el-descriptions :column="1" border size="small">
                            <el-descriptions-item :label="$t('exchange.fields.rateEffectiveTime')"><BaseDateTime :value="detailRow.rateEffectiveTime" /></el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.appliedTime')"><BaseDateTime :value="detailRow.appliedTime" /></el-descriptions-item>
                            <el-descriptions-item :label="$t('common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                            <el-descriptions-item :label="$t('exchange.fields.calculationDescription')"><span class="calculation-description">{{ detailRow.calculationDescription || '-' }}</span></el-descriptions-item>
                        </el-descriptions>
                    </section>
                </template>
            </div>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { FULL_DAY_RANGE_DEFAULT_TIMES } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { Download, Refresh, Search, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { loadCurrencyPresentations } from '@/api/base/currency';
import { exportExchangeUsageSnapshots, getExchangeUsageSnapshot, searchExchangeUsageSnapshots, type ExchangeRateUsageSnapshot } from '@/api/exchange';
import CurrencySelect from '../CurrencySelect.vue';
import CurrencyPairDisplay from '../CurrencyPairDisplay.vue';
import { formatRate, normalizeCurrency, optionLabel, rateTypeOptions as buildRateTypeOptions, todayDateTimeRange, type DateTimeRange, usageSceneOptions as buildUsageSceneOptions } from '../shared';

const { locale, t } = useI18n();
const translate = (key: string, params?: Record<string, unknown>) => t(key, params || {});
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ExchangeRateUsageSnapshot[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const appliedRange = ref<DateTimeRange>(todayDateTimeRange());
const detailVisible = ref(false);
const detailLoading = ref(false);
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

onMounted(() => {
    void loadCurrencyPresentations().catch(() => undefined);
    loadData();
});

async function loadData() {
    loading.value = true;
    try {
        const [appliedStartTime, appliedEndTime] = appliedRange.value;
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
    appliedRange.value = todayDateTimeRange();
    handleSearch();
}

async function openDetail(row: ExchangeRateUsageSnapshot) {
    detailVisible.value = true;
    detailLoading.value = true;
    detailRow.value = null;
    try {
        detailRow.value = await getExchangeUsageSnapshot(row.id);
    } finally {
        detailLoading.value = false;
    }
}

async function handleExport() {
    const [appliedStartTime, appliedEndTime] = appliedRange.value;
    await exportExchangeUsageSnapshots({ pageNo: page.value, pageSize: pageSize.value, ...query, appliedStartTime, appliedEndTime });
}

function rateTypeTagType(rateType?: string): 'primary' | 'success' | 'warning' | 'info' {
    if (rateType === 'TRANSACTION_RATE') return 'primary';
    if (rateType === 'SETTLEMENT_RATE') return 'success';
    if (rateType === 'CLEARING_RATE') return 'warning';
    return 'info';
}
</script>

<style scoped>
.scene-label,
.rate-evidence strong {
    color: var(--el-text-color-regular);
    font-weight: 500;
}

.code-label,
.rate-value {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-variant-numeric: tabular-nums;
}

.code-label--wrap,
.calculation-description {
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}

.table-code-label {
    font-size: 12px;
    white-space: nowrap;
}

.rate-evidence {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    line-height: 1.2;
}

.rate-evidence span {
    color: var(--el-text-color-placeholder);
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 11px;
}

.rate-value {
    color: var(--el-text-color-primary);
    font-size: 13px;
}

.rate-value--detail {
    color: var(--el-color-primary);
    font-size: 16px;
}

.snapshot-detail {
    min-height: 160px;
}

.detail-section {
    margin-bottom: 22px;
}

.detail-section--last {
    margin-bottom: 0;
}

.detail-section h3 {
    margin: 0 0 10px;
    padding-left: 10px;
    border-left: 3px solid var(--el-color-primary);
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
}

.snapshot-detail :deep(.el-descriptions__label) {
    width: 148px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
}

@media (max-width: 640px) {
    .snapshot-detail :deep(.el-descriptions__label) {
        width: 112px;
    }
}
</style>

<template>
  <div class="app-container volatility-page">
    <el-form
      :model="query"
      :inline="true"
      size="small"
      class="search-form volatility-search-form"
      label-width="92px"
    >
      <el-form-item :label="t('exchange.fields.rateType')">
        <el-select
          v-model="query.rateType"
          class="rate-type-select"
          @change="handleRateTypeChange"
        >
          <el-option
            v-for="item in rateTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('exchange.volatility.timeRange')">
        <div class="time-range-control">
          <el-radio-group
            v-model="selectedPreset"
            class="time-range-presets"
            size="small"
            @change="handlePresetChange"
          >
            <el-radio-button
              v-for="preset in timePresets"
              :key="preset.hours"
              :value="preset.hours"
            >
              {{ preset.label }}
            </el-radio-button>
          </el-radio-group>
          <el-date-picker
            v-model="timeRange"
            class="time-range-picker"
            type="datetimerange"
            :clearable="false"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            :range-separator="t('common.to')"
            :start-placeholder="t('exchange.placeholders.start')"
            :end-placeholder="t('exchange.placeholders.end')"
            @change="handleCustomRange"
          />
        </div>
      </el-form-item>
      <el-form-item :label="t('exchange.fields.currencyPair')">
        <el-select
          v-model="selectedPairKeys"
          class="pair-select"
          multiple
          filterable
          clearable
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="2"
          :placeholder="t('exchange.volatility.selectComparisonPairs')"
          :disabled="loading || !pairOptions.length"
        >
          <el-option
            v-for="item in pairOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <CurrencyPairDisplay
              :base-currency="item.baseCurrency"
              :quote-currency="item.quoteCurrency"
              :locale="String(locale)"
              size="xs"
            />
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item class="query-actions">
        <el-button type="primary" :icon="Search" :loading="loading" @click="loadData">
          {{ t('common.search') }}
        </el-button>
        <el-button :icon="Refresh" @click="resetQuery">{{ t('common.reset') }}</el-button>
        <el-button
          :icon="Download"
          :loading="exporting"
          v-hasPermi="'exchange:volatility:export'"
          @click="handleExport"
        >
          {{ t('common.export') }}
        </el-button>
      </el-form-item>
    </el-form>

    <section class="chart-section" v-loading="loading">
      <div class="section-heading">
        <div class="section-title-block">
          <h2>{{ t('exchange.volatility.chartTitle') }}</h2>
          <p>{{ t('exchange.volatility.chartSubtitle') }}</p>
          <span class="scope-summary">
            {{
              t('exchange.volatility.visiblePairCount', {
                visible: filteredTrendSeries.length,
                total: trendSeries.length,
              })
            }}
          </span>
          <div class="comparison-pairs" :aria-label="t('exchange.volatility.selectedComparisons')">
            <span class="comparison-pairs__label">{{ t('exchange.volatility.selectedComparisons') }}</span>
            <template v-if="selectedPairRows.length">
              <el-tag
                v-for="row in selectedPairRows"
                :key="row.pairKey"
                closable
                effect="plain"
                @close="removeComparison(row.pairKey)"
              >
                <CurrencyPairDisplay
                  :base-currency="row.baseCurrency"
                  :quote-currency="row.quoteCurrency"
                  :locale="String(locale)"
                  size="xs"
                />
              </el-tag>
              <el-button text type="primary" size="small" @click="clearComparisons">
                {{ t('exchange.volatility.clearComparisons') }}
              </el-button>
            </template>
            <span v-else class="comparison-pairs__empty">{{ t('exchange.volatility.noComparisonSelected') }}</span>
          </div>
        </div>
        <div class="chart-actions">
          <el-radio-group v-model="displayMode" size="small">
            <el-radio-button
              v-for="item in displayModeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
          <el-tooltip :content="t('exchange.volatility.formula')" placement="top">
            <el-button :icon="InfoFilled" circle text :aria-label="t('exchange.volatility.formula')" />
          </el-tooltip>
        </div>
      </div>
      <AnalyticsChart
        :option="chartOption"
        :loading="loading"
        :empty="!filteredTrendSeries.length || !canQueryTrend"
        :empty-text="chartEmptyText"
        :aria-label="t('exchange.volatility.chartTitle')"
        height="420px"
      />
    </section>

    <section class="overview-section">
      <div class="section-heading overview-heading">
        <div class="section-title-block">
          <h2>{{ t('exchange.volatility.overviewTitle') }}</h2>
          <p>{{ t('exchange.volatility.overviewSubtitle') }}</p>
        </div>
        <div class="overview-actions">
          <el-radio-group v-model="overviewMode" size="small">
            <el-radio-button value="WATCHED">{{ t('exchange.volatility.watchedPairs') }} ({{ watchedRows.length }})</el-radio-button>
            <el-radio-button value="ALERTING">{{ t('exchange.volatility.alertingPairs') }} ({{ alertingRows.length }})</el-radio-button>
            <el-radio-button value="ALL">{{ t('common.all') }} ({{ overviewRows.length }})</el-radio-button>
          </el-radio-group>
          <span v-if="lastQueryTime" class="last-query-time">
            {{ t('exchange.volatility.lastUpdated') }}: {{ lastQueryTime }}
          </span>
        </div>
      </div>
      <StandardTable
        table-key="exchange-volatility-overview"
        :data="displayOverviewRows"
        row-key="pairKey"
        size="small"
        :empty-text="overviewEmptyText"
      >
        <el-table-column :label="t('exchange.volatility.watch')" width="58" align="center" fixed="left">
          <template #default="{ row }">
            <el-tooltip :content="watchActionText(row.pairKey)" placement="top">
              <el-button
                text
                circle
                :type="watchedPairSet.has(row.pairKey) ? 'warning' : 'info'"
                :icon="watchedPairSet.has(row.pairKey) ? StarFilled : Star"
                :aria-label="watchActionText(row.pairKey)"
                @click="toggleWatch(row.pairKey)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="t('exchange.fields.currencyPair')" min-width="164" align="center" fixed="left">
          <template #default="{ row }">
            <CurrencyPairDisplay
              :base-currency="row.baseCurrency"
              :quote-currency="row.quoteCurrency"
              :locale="String(locale)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('exchange.volatility.latestRate')" min-width="130" align="right">
          <template #default="{ row }">
            <strong class="numeric-value">{{ formatRate(row.latestRate) }}</strong>
          </template>
        </el-table-column>
        <el-table-column :label="t('exchange.volatility.rangeChange')" min-width="126" align="right">
          <template #default="{ row }">
            <span :class="['range-change', trendClass(row.changeRate)]">
              <el-icon><component :is="trendIcon(row.changeRate)" /></el-icon>
              <strong>{{ formatChangeRate(row.changeRate) }}</strong>
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="t('exchange.volatility.minimumRate')" min-width="130" align="right">
          <template #default="{ row }">
            <span class="numeric-value">{{ formatRate(row.minimumRate) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('exchange.volatility.maximumRate')" min-width="130" align="right">
          <template #default="{ row }">
            <span class="numeric-value">{{ formatRate(row.maximumRate) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('exchange.volatility.volatilityRate')"
          min-width="130"
          align="right"
        >
          <template #default="{ row }">
            <strong :class="['numeric-value', Number(row.volatilityRate) > 3 ? 'is-alert' : '']">
              {{ formatVolatilityRate(row.volatilityRate) }}
            </strong>
          </template>
        </el-table-column>
        <el-table-column
          prop="sampleCount"
          :label="t('exchange.volatility.sampleCount')"
          min-width="100"
          align="right"
        />
        <el-table-column prop="latestSourceCode" :label="t('exchange.volatility.latestSource')" min-width="142" align="center" show-overflow-tooltip />
        <el-table-column :label="t('exchange.volatility.alertStatus')" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="alertTagType(row.alertStatus)" size="small" effect="plain">
              {{ alertStatusText(row.alertStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('exchange.volatility.latestTime')" min-width="170" align="center">
          <template #default="{ row }">
            <BaseDateTime :value="row.latestEffectiveTime" />
          </template>
        </el-table-column>
      </StandardTable>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { AnalyticsChart, formatExchangeRate, formatPercentageValue, resolveCurrencyPresentation } from '@acquiring/shared';
  import { Bottom, Download, InfoFilled, Minus, Refresh, Search, Star, StarFilled, Top } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import {
    getExchangeRateVolatilityOverview,
    getExchangeRateVolatilityTrend,
    submitExchangeRateVolatilityExportTask,
    type ExchangeCurrencyPair,
    type ExchangeRateTrendSeries,
    type ExchangeRateVolatilityOverview,
    type ExchangeRateVolatilityQuery,
    type ExchangeRateVolatilityType,
  } from '@/api/exchange';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import StandardTable from '@/components/StandardTable/StandardTable.vue';
  import { useUserStore } from '@/store/modules/user';
  import CurrencyPairDisplay from '../CurrencyPairDisplay.vue';

  type DisplayMode = 'ACTUAL' | 'RELATIVE';
  type OverviewMode = 'WATCHED' | 'ALERTING' | 'ALL';
  type OverviewRow = ExchangeRateVolatilityOverview & {
    pairKey: string;
    latestSourceCode?: string;
    changeRate: number;
  };
  type WatchState = Record<ExchangeRateVolatilityType, string[]>;

  const WATCH_STORAGE_KEY = 'vexra.admin.exchange.volatility.watch-pairs.v1';

  const { locale, t } = useI18n();
  const router = useRouter();
  const userStore = useUserStore();
  const loading = ref(false);
  const exporting = ref(false);
  const displayMode = ref<DisplayMode>('RELATIVE');
  const overviewMode = ref<OverviewMode>('WATCHED');
  const selectedPreset = ref(72);
  const timeRange = ref<[string, string]>(rangeForHours(72));
  const selectedPairKeys = ref<string[]>([]);
  const watchState = ref<WatchState>(readWatchState());
  const lastQueryTime = ref('');
  const query = reactive<{ rateType: ExchangeRateVolatilityType }>({
    rateType: 'TRANSACTION_RATE',
  });
  const overviewRows = ref<OverviewRow[]>([]);
  const trendSeries = ref<ExchangeRateTrendSeries[]>([]);
  const canQueryTrend = computed(() => userStore.hasPermission('exchange:volatility:query'));
  const rateTypeOptions = computed(() => [
    { label: t('exchange.enums.rateType.TRANSACTION_RATE'), value: 'TRANSACTION_RATE' },
    { label: t('exchange.enums.rateType.SETTLEMENT_RATE'), value: 'SETTLEMENT_RATE' },
  ]);
  const displayModeOptions = computed(() => [
    { label: t('exchange.volatility.actualMode'), value: 'ACTUAL' as DisplayMode },
    { label: t('exchange.volatility.relativeMode'), value: 'RELATIVE' as DisplayMode },
  ]);
  const timePresets = computed(() => [
    { label: t('exchange.volatility.last24Hours'), hours: 24 },
    { label: t('exchange.volatility.last72Hours'), hours: 72 },
    { label: t('exchange.volatility.last7Days'), hours: 24 * 7 },
    { label: t('exchange.volatility.last30Days'), hours: 24 * 30 },
  ]);
  const pairOptions = computed(() =>
    overviewRows.value.map((row) => ({
      value: row.pairKey,
      label: pairDisplayLabel(row.baseCurrency, row.quoteCurrency),
      baseCurrency: row.baseCurrency,
      quoteCurrency: row.quoteCurrency,
    })),
  );
  const selectedPairSet = computed(() => new Set(selectedPairKeys.value));
  const watchedPairKeys = computed(() => watchState.value[query.rateType] || []);
  const watchedPairSet = computed(() => new Set(watchedPairKeys.value));
  const watchedRows = computed(() => overviewRows.value.filter((row) => watchedPairSet.value.has(row.pairKey)));
  const alertingRows = computed(() => overviewRows.value.filter((row) => isAlerting(row)));
  const displayOverviewRows = computed(() => {
    if (overviewMode.value === 'WATCHED') return watchedRows.value;
    if (overviewMode.value === 'ALERTING') return alertingRows.value;
    return overviewRows.value;
  });
  const selectedPairRows = computed(() => overviewRows.value.filter((row) => selectedPairSet.value.has(row.pairKey)));
  const filteredTrendSeries = computed(() => {
    if (!selectedPairKeys.value.length) return [];
    return trendSeries.value.filter((series) => selectedPairSet.value.has(pairKey(series)));
  });
  const chartEmptyText = computed(() => {
    if (!canQueryTrend.value) return t('exchange.volatility.noTrendPermission');
    if (!selectedPairKeys.value.length) return t('exchange.volatility.selectPairsForChart');
    return t('common.noData');
  });
  const overviewEmptyText = computed(() => {
    if (overviewMode.value === 'WATCHED') return t('exchange.volatility.noWatchedPairs');
    if (overviewMode.value === 'ALERTING') return t('exchange.volatility.noAlertingPairs');
    return t('common.noData');
  });
  const chartColors = [
    '#2563eb',
    '#059669',
    '#d97706',
    '#dc2626',
    '#7c3aed',
    '#0891b2',
    '#db2777',
    '#65a30d',
    '#4f46e5',
    '#ea580c',
    '#0f766e',
    '#9333ea',
  ];

  const chartOption = computed(() => ({
    baseOption: {
      color: chartColors,
      grid: { left: 18, right: 190, top: 18, bottom: 48, containLabel: true },
      legend: {
        top: 8,
        right: 8,
        bottom: 36,
        width: 160,
        type: 'scroll',
        orient: 'vertical',
        pageButtonItemGap: 4,
        pageButtonGap: 8,
        pageTextStyle: { color: '#64748b', fontSize: 11 },
        itemWidth: 18,
        itemHeight: 10,
        itemGap: 10,
        formatter: (name: string) => legendPairLabel(name),
        textStyle: {
          color: '#475569',
          fontFamily: 'Inter, "PingFang SC", "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
          fontSize: 12,
        },
      },
      tooltip: {
        trigger: 'axis',
        enterable: true,
        confine: true,
        padding: 0,
        borderColor: '#d8e2ee',
        borderWidth: 1,
        backgroundColor: '#ffffff',
        extraCssText:
          'max-width: calc(100vw - 32px); border-radius: 6px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);',
        formatter: (payload: unknown) => formatTooltip(payload),
      },
      xAxis: {
        type: 'time',
        axisLabel: { color: '#64748b' },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        scale: true,
        name:
          displayMode.value === 'ACTUAL'
            ? t('exchange.volatility.rateAxis')
            : t('exchange.volatility.changeAxis'),
        nameTextStyle: { color: '#64748b', padding: [0, 0, 6, 0] },
        axisLabel: {
          color: '#64748b',
          formatter: displayMode.value === 'RELATIVE' ? '{value}%' : formatRate,
        },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 6 }],
      series: filteredTrendSeries.value.map((series, index) => {
        const baseline = Number(series.points[0]?.rate || 0);
        return {
          name: `${series.baseCurrency}/${series.quoteCurrency}`,
          type: 'line',
          showSymbol: series.points.length < 40,
          symbolSize: 6,
          connectNulls: false,
          emphasis: { focus: 'series', lineStyle: { width: 3 } },
          blur: { lineStyle: { opacity: 0.18 } },
          lineStyle: {
            width: 2,
            type: Math.floor(index / chartColors.length) % 2 === 0 ? 'solid' : 'dashed',
          },
          data: series.points.map((point) => {
            const rate = Number(point.rate);
            const relativeChange = baseline === 0 ? 0 : ((rate - baseline) / baseline) * 100;
            return {
              value: [
                point.effectiveTime,
                displayMode.value === 'RELATIVE' ? relativeChange : rate,
              ],
              rawRate: point.rate,
              relativeChange,
              sourceCode: point.sourceCode,
              baseCurrency: series.baseCurrency,
              quoteCurrency: series.quoteCurrency,
            };
          }),
        };
      }),
    },
    media: [
      {
        query: { maxWidth: 900 },
        option: {
          grid: { left: 18, right: 18, top: 74, bottom: 48, containLabel: true },
          legend: {
            top: 8,
            left: 8,
            right: 8,
            bottom: null,
            width: null,
            orient: 'horizontal',
            itemGap: 12,
          },
        },
      },
    ],
  }));

  onMounted(() => {
    selectedPairKeys.value = [...watchedPairKeys.value];
    if (!watchedPairKeys.value.length) overviewMode.value = 'ALL';
    void loadData();
  });

  /**
   * 空币种对是后端约定的“查询全部币种对”。页面始终加载全量摘要供关注、预警和全部视图使用，
   * 趋势图只展示用户明确选择的币种对，避免默认几十条曲线互相遮挡。
   */
  async function loadData() {
    const request: ExchangeRateVolatilityQuery = {
      rateType: query.rateType,
      currencyPairs: [],
      startTime: timeRange.value[0],
      endTime: timeRange.value[1],
    };
    loading.value = true;
    try {
      const [overview, trend] = await Promise.all([
        getExchangeRateVolatilityOverview(request),
        canQueryTrend.value ? getExchangeRateVolatilityTrend(request) : Promise.resolve([]),
      ]);
      trendSeries.value = trend;
      overviewRows.value = overview.map((row) => enrichOverviewRow(row, trend));
      selectedPairKeys.value = selectedPairKeys.value.filter((key) =>
        overviewRows.value.some((row) => row.pairKey === key),
      );
      lastQueryTime.value = formatDisplayDateTime(new Date());
    } catch {
      overviewRows.value = [];
      trendSeries.value = [];
      selectedPairKeys.value = [];
    } finally {
      loading.value = false;
    }
  }

  function handleRateTypeChange() {
    selectedPairKeys.value = [...watchedPairKeys.value];
    overviewMode.value = watchedPairKeys.value.length ? 'WATCHED' : 'ALL';
    void loadData();
  }

  function handlePresetChange(value: string | number | boolean | undefined) {
    const hours = Number(value);
    if (!Number.isFinite(hours) || hours <= 0) return;
    selectedPreset.value = hours;
    timeRange.value = rangeForHours(hours);
    void loadData();
  }

  function handleCustomRange() {
    selectedPreset.value = 0;
  }

  function resetQuery() {
    query.rateType = 'TRANSACTION_RATE';
    displayMode.value = 'RELATIVE';
    selectedPairKeys.value = [...watchState.value.TRANSACTION_RATE];
    overviewMode.value = selectedPairKeys.value.length ? 'WATCHED' : 'ALL';
    selectedPreset.value = 72;
    timeRange.value = rangeForHours(72);
    void loadData();
  }

  async function handleExport() {
    const selectedPairs = selectedPairKeys.value
      .map((key) => overviewRows.value.find((row) => row.pairKey === key))
      .filter((row): row is OverviewRow => Boolean(row))
      .map((row) => ({ baseCurrency: row.baseCurrency, quoteCurrency: row.quoteCurrency }));
    exporting.value = true;
    try {
      const task = await submitExchangeRateVolatilityExportTask({
        requestId: createExportRequestId('exchange-volatility'),
        query: {
          rateType: query.rateType,
          currencyPairs: selectedPairs,
          startTime: timeRange.value[0],
          endTime: timeRange.value[1],
        },
      });
      await openSubmittedTask(task.taskNo);
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : t('common.exportFailed'));
    } finally {
      exporting.value = false;
    }
  }

  async function openSubmittedTask(taskNo: string) {
    await ElMessageBox.confirm(
      t('operations.exportTask.submitted', { taskNo }),
      t('operations.exportTask.submittedTitle'),
      {
        confirmButtonText: t('operations.exportTask.openDownloadCenter'),
        cancelButtonText: t('common.close'),
        type: 'success',
      },
    ).then(() => router.push('/operations/export-tasks')).catch(() => undefined);
  }

  function createExportRequestId(prefix: string) {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return `${prefix}-export-${globalThis.crypto.randomUUID()}`;
    }
    return `${prefix}-export-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function rangeForHours(hours: number): [string, string] {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    return [formatLocalDateTime(start), formatLocalDateTime(end)];
  }

  function formatLocalDateTime(value: Date) {
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  function formatDisplayDateTime(value: Date) {
    return formatLocalDateTime(value).replace('T', ' ');
  }

  function pairKey(pair: ExchangeCurrencyPair) {
    return `${pair.baseCurrency}/${pair.quoteCurrency}`;
  }

  function enrichOverviewRow(
    row: ExchangeRateVolatilityOverview,
    seriesList: ExchangeRateTrendSeries[],
  ): OverviewRow {
    const key = pairKey(row);
    const points = [...(seriesList.find((series) => pairKey(series) === key)?.points || [])]
      .sort((left, right) => left.effectiveTime.localeCompare(right.effectiveTime));
    const firstRate = Number(points[0]?.rate || 0);
    const latestPoint = points.at(-1);
    const latestRate = Number(latestPoint?.rate || row.latestRate || 0);
    return {
      ...row,
      pairKey: key,
      latestSourceCode: latestPoint?.sourceCode || '-',
      changeRate: firstRate === 0 ? 0 : ((latestRate - firstRate) / firstRate) * 100,
    };
  }

  function toggleWatch(key: string) {
    const current = new Set(watchedPairKeys.value);
    if (current.has(key)) current.delete(key);
    else current.add(key);
    watchState.value = { ...watchState.value, [query.rateType]: [...current] };
    persistWatchState();
    if (current.has(key) && !selectedPairSet.value.has(key)) {
      selectedPairKeys.value = [...selectedPairKeys.value, key];
    }
  }

  function removeComparison(key: string) {
    selectedPairKeys.value = selectedPairKeys.value.filter((item) => item !== key);
  }

  function clearComparisons() {
    selectedPairKeys.value = [];
  }

  function watchActionText(key: string) {
    return watchedPairSet.value.has(key)
      ? t('exchange.volatility.removeWatch')
      : t('exchange.volatility.addWatch');
  }

  function isAlerting(row: OverviewRow) {
    return ['OPEN', 'ACKNOWLEDGED'].includes(row.alertStatus || '')
      || Number(row.volatilityRate || 0) >= 3;
  }

  function trendIcon(changeRate: number) {
    if (changeRate > 0) return Top;
    if (changeRate < 0) return Bottom;
    return Minus;
  }

  function trendClass(changeRate: number) {
    if (changeRate > 0) return 'is-up';
    if (changeRate < 0) return 'is-down';
    return 'is-flat';
  }

  function formatChangeRate(changeRate: number) {
    const prefix = changeRate > 0 ? '+' : '';
    return `${prefix}${formatVolatilityValue(changeRate)}%`;
  }

  function formatVolatilityRate(value?: string | number | null) {
    if (value === undefined || value === null || String(value).trim() === '') return '-';
    return `${formatVolatilityValue(value)}%`;
  }

  function formatVolatilityValue(value: string | number) {
    return formatPercentageValue(value, String(locale.value), '-', 4);
  }

  function formatRate(value?: string | number | null) {
    return formatExchangeRate(value, String(locale.value));
  }

  function readWatchState(): WatchState {
    const fallback: WatchState = { TRANSACTION_RATE: [], SETTLEMENT_RATE: [] };
    try {
      const stored = JSON.parse(localStorage.getItem(WATCH_STORAGE_KEY) || '{}') as Partial<WatchState>;
      return {
        TRANSACTION_RATE: Array.isArray(stored.TRANSACTION_RATE) ? stored.TRANSACTION_RATE.filter((item): item is string => typeof item === 'string') : [],
        SETTLEMENT_RATE: Array.isArray(stored.SETTLEMENT_RATE) ? stored.SETTLEMENT_RATE.filter((item): item is string => typeof item === 'string') : [],
      };
    } catch {
      return fallback;
    }
  }

  function persistWatchState() {
    localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(watchState.value));
  }

  function formatTooltip(payload: unknown) {
    const items = (Array.isArray(payload) ? payload : [payload]) as Array<{
      marker?: string;
      data?: {
        rawRate?: string;
        relativeChange?: number;
        sourceCode?: string;
        baseCurrency?: string;
        quoteCurrency?: string;
        value?: [string, number];
      };
    }>;
    const visibleItems = items.filter((item) => item?.data);
    const firstItem = visibleItems[0];
    if (!firstItem?.data) return '';
    const effectiveTime = String(firstItem.data.value?.[0] || '-').replace('T', ' ');
    const [date = '-', time = ''] = effectiveTime.split(' ');
    const rows = visibleItems
      .map((item) => tooltipPairRow(item))
      .join('');
    return `
      <div style="width: min(520px, calc(100vw - 48px)); color: #334155;">
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid #dbe4ee; background: #f8fafc;">
          <span style="display: block; width: 3px; height: 30px; border-radius: 2px; background: #2563eb;"></span>
          <div style="display: flex; align-items: baseline; gap: 8px; min-width: 0;">
            <strong style="color: #1e293b; font-size: 13px; font-variant-numeric: tabular-nums;">${escapeHtml(date)}</strong>
            <span style="color: #64748b; font-size: 12px; font-variant-numeric: tabular-nums;">${escapeHtml(time)}</span>
          </div>
        </div>
        <div style="max-height: 300px; overflow-y: auto; overscroll-behavior: contain;">${rows}</div>
      </div>`;
  }

  /** 将同一统计时刻的每个币种对压缩为单独一行，避免汇率来源和趋势信息上下错位。 */
  function tooltipPairRow(item: {
    marker?: string;
    data?: {
      rawRate?: string;
      relativeChange?: number;
      sourceCode?: string;
      baseCurrency?: string;
      quoteCurrency?: string;
    };
  }) {
    if (!item.data) return '';
    const change = Number(item.data.relativeChange || 0);
    const trend = trendPresentation(change);
    const pair = pairDisplayLabel(item.data.baseCurrency, item.data.quoteCurrency);
    return `
      <div style="display: grid; grid-template-columns: minmax(154px, 1.35fr) minmax(88px, 1fr) 88px minmax(76px, 0.8fr); align-items: center; gap: 10px; min-height: 38px; padding: 7px 12px; border-bottom: 1px solid #eef2f7; white-space: nowrap;">
        <strong style="overflow: hidden; color: #1e293b; text-overflow: ellipsis;">${escapeHtml(pair)}</strong>
        <span style="overflow: hidden; font-family: SFMono-Regular, Consolas, monospace; font-variant-numeric: tabular-nums; text-overflow: ellipsis;">${escapeHtml(formatRate(item.data.rawRate))}</span>
        <strong style="color: ${trend.color}; font-variant-numeric: tabular-nums; text-align: right;">${trend.icon} ${formatVolatilityRate(Math.abs(change))}</strong>
        <span style="overflow: hidden; color: #64748b; text-align: right; text-overflow: ellipsis;" title="${escapeHtml(item.data.sourceCode || '-')}">${escapeHtml(item.data.sourceCode || '-')}</span>
      </div>`;
  }

  function trendPresentation(change: number) {
    if (change > 0) return { icon: '↑', color: '#dc2626' };
    if (change < 0) return { icon: '↓', color: '#059669' };
    return { icon: '→', color: '#64748b' };
  }

  function pairDisplayLabel(baseCurrency?: string, quoteCurrency?: string) {
    const base = resolveCurrencyPresentation(baseCurrency, String(locale.value));
    const quote = resolveCurrencyPresentation(quoteCurrency, String(locale.value));
    return `${base.iconText} ${base.alphabeticCode} → ${quote.iconText} ${quote.alphabeticCode}`;
  }

  function legendPairLabel(name: string) {
    const [baseCurrency, quoteCurrency] = name.split('/');
    return pairDisplayLabel(baseCurrency, quoteCurrency);
  }

  /** 转义图表 tooltip 中的来源编码等动态文本，避免后端字段被浏览器解释为 HTML。 */
  function escapeHtml(value: string) {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character] || character,
    );
  }

  function alertTagType(status?: string): 'danger' | 'warning' | 'success' | 'info' {
    if (status === 'OPEN') return 'danger';
    if (status === 'ACKNOWLEDGED') return 'warning';
    if (status === 'RESOLVED') return 'success';
    return 'info';
  }

  function alertStatusText(status?: string) {
    return status ? t(`exchange.alertEvent.status.${status}`) : t('exchange.volatility.normal');
  }
</script>

<style scoped>
  .volatility-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .volatility-search-form {
    margin-bottom: 0;
  }

  .rate-type-select {
    width: 180px;
  }

  .time-range-control {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .time-range-presets {
    display: inline-flex;
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .time-range-picker,
  .time-range-control :deep(.el-date-editor.time-range-picker) {
    width: 430px;
    min-width: 430px;
  }

  .pair-select {
    width: 360px;
  }

  .scope-summary,
  .last-query-time {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .scope-summary {
    display: inline-block;
    margin-top: 6px;
    color: var(--el-color-primary);
    font-weight: 500;
  }

  .comparison-pairs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
  }

  .comparison-pairs__label,
  .comparison-pairs__empty {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .comparison-pairs :deep(.el-tag) {
    height: 28px;
    border-radius: 4px;
  }

  .chart-section,
  .overview-section {
    min-width: 0;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .section-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .section-title-block h2 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0;
  }

  .section-title-block p {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .chart-actions {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    gap: 4px;
  }

  .overview-heading {
    align-items: flex-end;
  }

  .overview-actions {
    display: flex;
    align-items: flex-end;
    flex-direction: column;
    gap: 8px;
  }

  .numeric-value {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }

  .numeric-value.is-alert {
    color: var(--el-color-danger);
  }

  .range-change {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    font-variant-numeric: tabular-nums;
  }

  .range-change.is-up {
    color: #dc2626;
  }

  .range-change.is-down {
    color: #059669;
  }

  .range-change.is-flat {
    color: var(--el-text-color-secondary);
  }

  @media (max-width: 900px) {
    .volatility-search-form :deep(.el-form-item) {
      width: 100%;
      margin-right: 0;
    }

    .volatility-search-form :deep(.el-form-item__content),
    .rate-type-select,
    .pair-select {
      width: 100%;
    }

    .time-range-control {
      align-items: stretch;
      flex-direction: column;
      width: 100%;
    }

    .time-range-presets {
      width: 100%;
    }

    .time-range-presets :deep(.el-radio-button) {
      flex: 1 1 25%;
    }

    .time-range-presets :deep(.el-radio-button__inner) {
      width: 100%;
    }

    .time-range-picker,
    .time-range-control :deep(.el-date-editor.time-range-picker) {
      width: 100%;
      min-width: 0;
    }

    .query-actions :deep(.el-form-item__content) {
      justify-content: flex-end;
    }

    .section-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .chart-actions {
      justify-content: space-between;
      width: 100%;
    }

    .last-query-time {
      align-self: flex-start;
    }

    .overview-actions {
      align-items: flex-start;
      width: 100%;
    }

    .overview-actions :deep(.el-radio-group) {
      display: flex;
      width: 100%;
    }

    .overview-actions :deep(.el-radio-button) {
      flex: 1 1 0;
    }

    .overview-actions :deep(.el-radio-button__inner) {
      width: 100%;
    }
  }
</style>

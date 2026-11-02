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
          :placeholder="t('exchange.volatility.allPairs')"
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
        :empty-text="
          canQueryTrend ? t('common.noData') : t('exchange.volatility.noTrendPermission')
        "
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
        <span v-if="lastQueryTime" class="last-query-time">
          {{ t('exchange.volatility.lastUpdated') }}: {{ lastQueryTime }}
        </span>
      </div>
      <StandardTable
        table-key="exchange-volatility-overview"
        :data="filteredOverviewRows"
        row-key="pairKey"
        size="small"
      >
        <el-table-column :label="t('exchange.fields.currencyPair')" min-width="150" align="center">
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
            <strong class="numeric-value">{{ row.latestRate }}</strong>
          </template>
        </el-table-column>
        <el-table-column :label="t('exchange.volatility.minimumRate')" min-width="130" align="right">
          <template #default="{ row }">
            <span class="numeric-value">{{ row.minimumRate }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('exchange.volatility.maximumRate')" min-width="130" align="right">
          <template #default="{ row }">
            <span class="numeric-value">{{ row.maximumRate }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('exchange.volatility.volatilityRate')"
          min-width="130"
          align="right"
        >
          <template #default="{ row }">
            <strong :class="['numeric-value', Number(row.volatilityRate) > 3 ? 'is-alert' : '']">
              {{ row.volatilityRate }}%
            </strong>
          </template>
        </el-table-column>
        <el-table-column
          prop="sampleCount"
          :label="t('exchange.volatility.sampleCount')"
          min-width="100"
          align="right"
        />
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
  import { AnalyticsChart, resolveCurrencyPresentation } from '@acquiring/shared';
  import { Download, InfoFilled, Refresh, Search } from '@element-plus/icons-vue';
  import { useI18n } from 'vue-i18n';
  import {
    exportExchangeRateVolatility,
    getExchangeRateVolatilityOverview,
    getExchangeRateVolatilityTrend,
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
  type OverviewRow = ExchangeRateVolatilityOverview & { pairKey: string };

  const { locale, t } = useI18n();
  const userStore = useUserStore();
  const loading = ref(false);
  const displayMode = ref<DisplayMode>('RELATIVE');
  const selectedPreset = ref(72);
  const timeRange = ref<[string, string]>(rangeForHours(72));
  const selectedPairKeys = ref<string[]>([]);
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
  const filteredOverviewRows = computed(() => {
    if (!selectedPairKeys.value.length) return overviewRows.value;
    return overviewRows.value.filter((row) => selectedPairSet.value.has(row.pairKey));
  });
  const filteredTrendSeries = computed(() => {
    if (!selectedPairKeys.value.length) return trendSeries.value;
    return trendSeries.value.filter((series) => selectedPairSet.value.has(pairKey(series)));
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
          formatter: displayMode.value === 'RELATIVE' ? '{value}%' : '{value}',
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

  onMounted(loadData);

  /**
   * 空币种对是后端约定的“查询全部币种对”，页面再用本地多选做即时筛选。
   * 这样首次进入即可看全量趋势，也避免每次勾选图例都重复请求接口。
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
      overviewRows.value = overview.map((row) => ({
        ...row,
        pairKey: pairKey(row),
      }));
      trendSeries.value = trend;
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
    selectedPairKeys.value = [];
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
    selectedPairKeys.value = [];
    selectedPreset.value = 72;
    timeRange.value = rangeForHours(72);
    void loadData();
  }

  async function handleExport() {
    const selectedPairs = selectedPairKeys.value
      .map((key) => overviewRows.value.find((row) => row.pairKey === key))
      .filter((row): row is OverviewRow => Boolean(row))
      .map((row) => ({ baseCurrency: row.baseCurrency, quoteCurrency: row.quoteCurrency }));
    await exportExchangeRateVolatility({
      rateType: query.rateType,
      currencyPairs: selectedPairs,
      startTime: timeRange.value[0],
      endTime: timeRange.value[1],
    });
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
        <span style="overflow: hidden; font-family: SFMono-Regular, Consolas, monospace; font-variant-numeric: tabular-nums; text-overflow: ellipsis;">${escapeHtml(item.data.rawRate || '-')}</span>
        <strong style="color: ${trend.color}; font-variant-numeric: tabular-nums; text-align: right;">${trend.icon} ${Math.abs(change).toFixed(4)}%</strong>
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

  .numeric-value {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }

  .numeric-value.is-alert {
    color: var(--el-color-danger);
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
  }
</style>

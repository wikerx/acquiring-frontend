<template>
  <div class="app-container merchant-ranking-page">
    <section class="ranking-hero">
      <div class="ranking-hero__identity">
        <div class="ranking-hero__icon">
          <el-icon><Histogram /></el-icon>
        </div>
        <div>
          <h2>{{ t('risk.dashboard.merchantRanking') }}</h2>
          <p>{{ t('risk.dashboard.merchantRankingDesc') }}</p>
        </div>
      </div>

      <div class="ranking-hero__metrics">
        <div
          v-for="item in summaryMetrics"
          :key="item.label"
          class="hero-metric"
          :class="`hero-metric--${item.tone}`"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </section>

    <section class="ranking-panel">
      <div class="ranking-panel__head">
        <div>
          <h3>{{ t('risk.dashboard.merchantRanking') }}</h3>
          <p>{{ t('risk.dashboard.merchantRankingDesc') }}</p>
        </div>
        <div class="ranking-panel__count">{{ rows.length }}</div>
      </div>

      <el-table
        v-loading="loading"
        :data="rows"
        size="small"
        class="ranking-table"
        table-layout="fixed"
      >
        <el-table-column :label="t('common.index')" width="76" align="center">
          <template #default="{ $index }">
            <span class="rank-number" :class="rankTone($index)">{{ $index + 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="merchant_id"
          :label="t('risk.common.merchantId')"
          min-width="150"
          align="center"
        >
          <template #default="{ row }">
            <span class="merchant-code">{{ textValue(row.merchant_id) }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="merchant_name"
          :label="t('risk.common.merchantName')"
          min-width="240"
          align="center"
        >
          <template #default="{ row }">
            <div class="merchant-name-cell" :class="{ 'is-missing': !merchantName(row) }">
              <strong :title="merchantName(row) || undefined">{{
                merchantName(row) || '—'
              }}</strong>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="risk_count"
          :label="t('risk.ranking.riskEventCount')"
          min-width="210"
        >
          <template #default="{ row }">
            <div class="risk-volume">
              <strong>{{ formatCount(row.risk_count) }}</strong>
              <span class="risk-volume__track">
                <i :style="{ width: `${riskPercentage(row.risk_count)}%` }"></i>
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="high_risk_count"
          :label="t('risk.ranking.highRiskCount')"
          width="140"
          align="center"
        >
          <template #default="{ row }">
            <span class="count-badge count-badge--danger">{{
              formatCount(row.high_risk_count)
            }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="reject_count"
          :label="t('risk.ranking.rejectCount')"
          width="130"
          align="center"
        >
          <template #default="{ row }">
            <span class="count-badge count-badge--warning">{{
              formatCount(row.reject_count)
            }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('risk.ranking.latestHitTime')" width="190" align="center">
          <template #default="{ row }">
            <div class="latest-hit-time">
              <i></i>
              <BaseDateTime :value="row.latest_evaluation_time" />
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="t('common.noData')" :image-size="72" />
        </template>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { ElMessage } from 'element-plus';
  import { Histogram } from '@element-plus/icons-vue';
  import { useI18n } from 'vue-i18n';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import { getRiskMerchantRanking } from '@/api/risk';

  interface MerchantRankingRow {
    merchant_id?: unknown;
    merchant_name?: unknown;
    risk_count?: unknown;
    high_risk_count?: unknown;
    reject_count?: unknown;
    latest_evaluation_time?: string | number | Date | null;
  }

  const { locale, t } = useI18n();
  const loading = ref(false);
  const rows = ref<MerchantRankingRow[]>([]);

  /**
   * 高风险商户排行页只展示后端聚合结果，概览数字和风险热度条均由当前结果集派生。
   */
  const totalRiskEvents = computed(() => sumBy('risk_count'));
  const totalHighRisk = computed(() => sumBy('high_risk_count'));
  const totalRejects = computed(() => sumBy('reject_count'));
  const maxRiskEvents = computed(() =>
    Math.max(0, ...rows.value.map((row) => numberValue(row.risk_count))),
  );
  const summaryMetrics = computed(() => [
    {
      label: t('risk.ranking.riskEventCount'),
      value: formatCount(totalRiskEvents.value),
      tone: 'primary',
    },
    {
      label: t('risk.ranking.highRiskCount'),
      value: formatCount(totalHighRisk.value),
      tone: 'danger',
    },
    {
      label: t('risk.ranking.rejectCount'),
      value: formatCount(totalRejects.value),
      tone: 'warning',
    },
  ]);

  onMounted(loadData);

  async function loadData() {
    loading.value = true;
    try {
      rows.value = (await getRiskMerchantRanking()) as MerchantRankingRow[];
    } catch (error: any) {
      ElMessage.error(error?.message || t('common.loadFailed'));
    } finally {
      loading.value = false;
    }
  }

  function sumBy(key: 'risk_count' | 'high_risk_count' | 'reject_count') {
    return rows.value.reduce((sum, row) => sum + numberValue(row[key]), 0);
  }

  function numberValue(value: unknown) {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : 0;
  }

  function formatCount(value: unknown) {
    return new Intl.NumberFormat(locale.value).format(numberValue(value));
  }

  function textValue(value: unknown) {
    const text = String(value ?? '').trim();
    return text && text !== '-' ? text : '—';
  }

  function merchantName(row: MerchantRankingRow) {
    const name = String(row.merchant_name ?? '').trim();
    return name && name !== '-' ? name : '';
  }

  function riskPercentage(value: unknown) {
    const count = numberValue(value);
    return maxRiskEvents.value && count > 0
      ? Math.max(4, Math.round((count / maxRiskEvents.value) * 100))
      : 0;
  }

  function rankTone(index: number) {
    if (index === 0) return 'rank-number--first';
    if (index === 1) return 'rank-number--second';
    if (index === 2) return 'rank-number--third';
    return '';
  }
</script>

<style scoped>
  .merchant-ranking-page {
    --ranking-primary: var(--app-primary, #2563eb);
    --ranking-primary-light: var(--app-primary-light, #eaf2ff);
    display: flex;
    flex-direction: column;
    gap: 14px;
    color: var(--el-text-color-primary);
  }

  .ranking-hero {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    min-height: 126px;
    padding: 22px 24px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--ranking-primary) 16%, var(--el-border-color-lighter));
    border-radius: 10px;
    background: linear-gradient(
      112deg,
      color-mix(in srgb, var(--ranking-primary-light) 72%, #fff) 0%,
      var(--el-bg-color) 52%,
      color-mix(in srgb, var(--ranking-primary) 8%, var(--el-bg-color)) 100%
    );
  }

  .ranking-hero::after {
    position: absolute;
    top: -82px;
    right: 13%;
    width: 260px;
    height: 260px;
    border: 1px solid color-mix(in srgb, var(--ranking-primary) 12%, transparent);
    border-radius: 50%;
    content: '';
  }

  .ranking-hero__identity,
  .ranking-hero__metrics {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
  }

  .ranking-hero__identity {
    min-width: 0;
    gap: 16px;
  }

  .ranking-hero__icon {
    display: grid;
    flex: 0 0 auto;
    width: 54px;
    height: 54px;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--ranking-primary) 22%, transparent);
    border-radius: 14px;
    background: color-mix(in srgb, var(--ranking-primary) 10%, var(--el-bg-color));
    color: var(--ranking-primary);
    font-size: 27px;
  }

  .ranking-hero h2,
  .ranking-panel h3 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-weight: 700;
  }

  .ranking-hero h2 {
    font-size: 23px;
    line-height: 1.35;
  }

  .ranking-hero p,
  .ranking-panel__head p {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.6;
  }

  .ranking-hero__metrics {
    flex: 0 0 auto;
    gap: 10px;
  }

  .hero-metric {
    min-width: 116px;
    padding: 12px 14px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
  }

  .hero-metric span,
  .hero-metric strong {
    display: block;
  }

  .hero-metric span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .hero-metric strong {
    margin-top: 4px;
    color: var(--el-text-color-primary);
    font-size: 21px;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .hero-metric--primary {
    border-top: 2px solid var(--ranking-primary);
  }
  .hero-metric--danger {
    border-top: 2px solid var(--el-color-danger);
  }
  .hero-metric--warning {
    border-top: 2px solid var(--el-color-warning);
  }

  .ranking-panel {
    min-height: 420px;
    padding: 0 18px 18px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-bg-color);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.045);
  }

  .ranking-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 76px;
    padding: 14px 2px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .ranking-panel h3 {
    font-size: 16px;
  }

  .ranking-panel__head p {
    margin-top: 3px;
  }

  .ranking-panel__count {
    display: grid;
    min-width: 36px;
    height: 28px;
    padding: 0 10px;
    place-items: center;
    border-radius: 14px;
    background: var(--ranking-primary-light);
    color: var(--ranking-primary);
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .ranking-table {
    width: 100%;
  }

  .ranking-table :deep(.el-table__header th.el-table__cell) {
    height: 52px;
    background: color-mix(in srgb, var(--el-fill-color-light) 72%, var(--el-bg-color));
    color: var(--el-text-color-regular);
    font-weight: 650;
  }

  .ranking-table :deep(.el-table__row) {
    transition: background-color 0.18s ease;
  }

  .ranking-table :deep(.el-table__row td.el-table__cell) {
    height: 66px;
  }

  .ranking-table :deep(.el-table__row:hover > td.el-table__cell) {
    background: color-mix(in srgb, var(--ranking-primary) 4%, var(--el-bg-color));
  }

  .rank-number {
    display: inline-grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .rank-number--first {
    background: linear-gradient(135deg, #fff3c4, #f6c453);
    color: #7c4a03;
  }

  .rank-number--second {
    background: linear-gradient(135deg, #f2f5f9, #c9d2de);
    color: #475569;
  }

  .rank-number--third {
    background: linear-gradient(135deg, #f8dfcf, #d89a72);
    color: #7c3f20;
  }

  .merchant-code {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border: 1px solid color-mix(in srgb, var(--ranking-primary) 18%, var(--el-border-color-lighter));
    border-radius: 6px;
    background: color-mix(in srgb, var(--ranking-primary) 6%, var(--el-bg-color));
    color: var(--ranking-primary);
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }

  .merchant-name-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    text-align: center;
  }

  .merchant-name-cell strong {
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .merchant-name-cell.is-missing strong {
    color: var(--el-text-color-placeholder);
  }

  .risk-volume {
    display: grid;
    grid-template-columns: minmax(64px, auto) minmax(70px, 1fr);
    align-items: center;
    gap: 12px;
  }

  .risk-volume strong {
    font-size: 15px;
    font-variant-numeric: tabular-nums;
  }

  .risk-volume__track {
    position: relative;
    height: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--el-fill-color);
  }

  .risk-volume__track i {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--ranking-primary) 58%, #60a5fa),
      var(--ranking-primary)
    );
  }

  .count-badge {
    display: inline-grid;
    min-width: 58px;
    min-height: 28px;
    padding: 0 10px;
    place-items: center;
    border-radius: 14px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .count-badge--danger {
    background: color-mix(in srgb, var(--el-color-danger) 12%, var(--el-bg-color));
    color: var(--el-color-danger);
  }

  .count-badge--warning {
    background: color-mix(in srgb, var(--el-color-warning) 14%, var(--el-bg-color));
    color: var(--el-color-warning-dark-2);
  }

  .latest-hit-time {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    gap: 8px;
    color: var(--el-text-color-regular);
    font-size: 13px;
  }

  .latest-hit-time > i {
    flex: 0 0 auto;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ranking-primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--ranking-primary) 10%, transparent);
  }

  @media (max-width: 1100px) {
    .ranking-hero {
      align-items: flex-start;
      flex-direction: column;
    }

    .ranking-hero__metrics {
      width: 100%;
    }

    .hero-metric {
      flex: 1;
    }
  }

  @media (max-width: 640px) {
    .merchant-ranking-page {
      gap: 10px;
    }

    .ranking-hero {
      min-height: auto;
      padding: 18px;
    }

    .ranking-hero__identity {
      align-items: flex-start;
    }

    .ranking-hero__icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      font-size: 22px;
    }

    .ranking-hero h2 {
      font-size: 19px;
    }

    .ranking-hero__metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
    }

    .hero-metric {
      min-width: 0;
      padding: 10px;
    }

    .hero-metric span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .hero-metric strong {
      font-size: 17px;
    }

    .ranking-panel {
      min-height: 360px;
      padding: 0 10px 10px;
    }
  }
</style>

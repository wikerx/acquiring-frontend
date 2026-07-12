<template>
  <div class="app-container risk-cockpit">
    <section class="cockpit-head">
      <div>
        <div class="eyebrow">{{ t('risk.dashboard.cockpitEyebrow') }}</div>
        <h3>{{ t('risk.dashboard.cockpitTitle') }}</h3>
        <p>{{ t('risk.dashboard.cockpitDesc') }}</p>
      </div>
      <div class="priority-strip">
        <span>{{ t('risk.dashboard.priorityTitle') }}</span>
        <template v-for="(item, index) in prioritySteps" :key="item.label">
          <strong :class="item.tone">{{ item.label }}</strong>
          <i v-if="index < prioritySteps.length - 1"></i>
        </template>
      </div>
    </section>

    <el-row :gutter="12" class="metric-row">
      <el-col v-for="item in metricCards" :key="item.label" :xs="12" :sm="12" :md="6">
        <div class="metric-box" :class="item.tone">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <em>{{ item.hint }}</em>
        </div>
      </el-col>
    </el-row>

    <section class="quick-panel">
      <button
        v-for="entry in dashboardEntries"
        :key="entry.path"
        type="button"
        class="dashboard-entry"
        @click="go(entry.path)"
      >
        <el-icon><component :is="entry.icon" /></el-icon>
        <span>{{ entry.title }}</span>
        <small>{{ entry.desc }}</small>
        <el-icon class="entry-arrow"><ArrowRight /></el-icon>
      </button>
    </section>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="16">
        <section class="module-grid" v-loading="loading">
          <article
            v-for="module in moduleSummaries"
            :key="module.type"
            class="module-card"
            :class="module.tone"
            @click="go(module.path)"
          >
            <div class="module-card__top">
              <div>
                <span>{{ module.label }}</span>
                <strong>{{ module.enabled }} / {{ module.total }}</strong>
              </div>
              <el-tag size="small" :type="module.tagType">{{ module.action }}</el-tag>
            </div>
            <p>{{ module.desc }}</p>
            <el-progress :percentage="module.rate" :stroke-width="8" :show-text="false" />
            <div class="module-card__foot">
              <span>{{ t('risk.dashboard.functionCount') }} {{ module.functions }}</span>
              <span>{{ t('risk.dashboard.emptyFunctions') }} {{ module.emptyFunctions }}</span>
            </div>
          </article>
        </section>
      </el-col>
      <el-col :xs="24" :lg="8">
        <section class="change-panel">
          <div class="panel-title">
            <div>
              <h4>{{ t('risk.dashboard.recentChanges') }}</h4>
              <p>{{ t('risk.dashboard.recentChangesDesc') }}</p>
            </div>
            <el-button link type="primary" @click="go('/risk/dashboard/config-changes')">{{ t('risk.dashboard.viewAll') }}</el-button>
          </div>
          <div v-loading="loading" class="change-list">
            <div v-for="item in changes" :key="String(item.id || `${item.function_code}-${item.operation_time}`)" class="change-item">
              <div>
                <strong>{{ functionName(item) }}</strong>
                <span>{{ operationName(item.operation_type) }} · {{ item.operator || '-' }}</span>
              </div>
              <BaseDateTime :value="String(item.operation_time || '')" />
            </div>
            <el-empty v-if="!loading && changes.length === 0" :description="t('risk.dashboard.noChanges')" />
          </div>
        </section>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowRight, DataAnalysis, Histogram, Operation, TrendCharts } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import { getRiskDashboard, type RiskDashboardFunction } from '@/api/risk';
import { riskFunctionName } from '@/views/risk/shared';

const { t } = useI18n();
const router = useRouter();
const loading = ref(false);
const functions = ref<RiskDashboardFunction[]>([]);
const changes = ref<Record<string, unknown>[]>([]);

/**
 * 风控总览页聚合名单、规则和配置变更的概览数据，帮助运营先判断覆盖面再进入具体功能处理。
 */
const prioritySteps = computed(() => [
  { label: t('risk.dashboard.priorityAml'), tone: 'priority-danger' },
  { label: t('risk.dashboard.priorityStrongWhite'), tone: 'priority-success' },
  { label: t('risk.dashboard.priorityBlackA'), tone: 'priority-warning' },
  { label: t('risk.dashboard.priorityPreferWhite'), tone: 'priority-success' },
  { label: t('risk.dashboard.priorityBlackB'), tone: 'priority-warning' },
  { label: t('risk.dashboard.priorityWeakWhite'), tone: 'priority-success' },
  { label: t('risk.dashboard.priorityBlackC'), tone: 'priority-warning' },
  { label: t('risk.dashboard.priorityRules'), tone: 'priority-primary' },
]);

const dashboardEntries = computed(() => [
  { title: t('risk.dashboard.todayEvents'), desc: t('risk.dashboard.todayEventsDesc'), path: '/risk/dashboard/today-events', icon: TrendCharts },
  { title: t('risk.dashboard.merchantRanking'), desc: t('risk.dashboard.merchantRankingDesc'), path: '/risk/dashboard/merchant-ranking', icon: Histogram },
  { title: t('risk.dashboard.configChanges'), desc: t('risk.dashboard.configChangesDesc'), path: '/risk/dashboard/config-changes', icon: Operation },
]);

const totalRules = computed(() => functions.value.reduce((sum, item) => sum + Number(item.total || 0), 0));
const enabledRules = computed(() => functions.value.reduce((sum, item) => sum + Number(item.enabled || 0), 0));
const emptyFunctions = computed(() => functions.value.filter((item) => Number(item.total || 0) === 0).length);
const overallRate = computed(() => totalRules.value ? Math.round((enabledRules.value / totalRules.value) * 100) : 0);

const metricCards = computed(() => [
  { label: t('risk.dashboard.functionCount'), value: functions.value.length, hint: t('risk.dashboard.functionCountHint'), tone: 'tone-blue' },
  { label: t('risk.dashboard.totalRules'), value: totalRules.value, hint: t('risk.dashboard.totalRulesHint'), tone: 'tone-ink' },
  { label: t('risk.dashboard.enabledRules'), value: enabledRules.value, hint: `${overallRate.value}% ${t('risk.dashboard.enabledRate')}`, tone: 'tone-green' },
  { label: t('risk.dashboard.emptyFunctions'), value: emptyFunctions.value, hint: t('risk.dashboard.emptyFunctionsHint'), tone: 'tone-amber' },
]);

const moduleSummaries = computed(() => [
  moduleSummary('AML', t('risk.overview.amlTitle'), t('risk.overview.amlDesc'), '/risk/aml/overview', 'risk-aml', 'danger', t('risk.overview.forceReject')),
  moduleSummary('BLACK', t('risk.overview.blackTitle'), t('risk.overview.blackDesc'), '/risk/blacklist/overview', 'risk-black', 'warning', t('risk.overview.blockOrReview')),
  moduleSummary('WHITE', t('risk.overview.whiteTitle'), t('risk.overview.whiteDesc'), '/risk/whitelist/overview', 'risk-white', 'success', t('risk.overview.riskExemption')),
  moduleSummary('RULE', t('risk.overview.ruleTitle'), t('risk.overview.ruleDesc'), '/risk/rule/overview', 'risk-rule', 'primary', t('risk.overview.ruleControl')),
]);

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const data = await getRiskDashboard();
    functions.value = data.functions || [];
    changes.value = data.changeLogs || [];
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function moduleSummary(type: string, label: string, desc: string, path: string, tone: string, tagType: string, action: string) {
  const rows = functions.value.filter((item) => item.moduleType === type);
  const total = rows.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const enabled = rows.reduce((sum, item) => sum + Number(item.enabled || 0), 0);
  return {
    type,
    label,
    desc,
    path,
    tone,
    tagType,
    action,
    total,
    enabled,
    functions: rows.length,
    emptyFunctions: rows.filter((item) => Number(item.total || 0) === 0).length,
    rate: total ? Math.round((enabled / total) * 100) : 0,
  };
}

function functionName(row: Record<string, unknown>) {
  const matched = functions.value.find((item) => item.moduleType === row.module_type && item.functionCode === row.function_code);
  return matched ? riskFunctionName(t, matched) : String(row.function_code || '-');
}

function operationName(value: unknown) {
  const code = String(value || '');
  return code ? t(`risk.operation.${code}`) : '-';
}

function go(path: string) {
  router.push(path);
}
</script>

<style scoped>
.risk-cockpit {
  color: var(--el-text-color-primary);
}

.cockpit-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  min-height: 126px;
  margin-bottom: 12px;
  padding: 18px 20px;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(255, 255, 255, 0.92) 48%, rgba(241, 245, 249, 0.94)),
    repeating-linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0 1px, transparent 1px 28px);
}

.cockpit-head h3 {
  margin: 4px 0 8px;
  font-size: 22px;
  font-weight: 700;
}

.cockpit-head p {
  max-width: 680px;
  margin: 0;
  color: #526274;
  font-size: 13px;
  line-height: 1.7;
}

.eyebrow {
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

.priority-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 720px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.78);
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
  overflow-x: auto;
}

.priority-strip strong {
  flex: 0 0 auto;
  color: #0f172a;
}

.priority-strip .priority-danger { color: #dc2626; }
.priority-strip .priority-success { color: #15803d; }
.priority-strip .priority-warning { color: #b45309; }
.priority-strip .priority-primary { color: #2563eb; }

.priority-strip i {
  width: 18px;
  height: 1px;
  background: #94a3b8;
}

.metric-row {
  margin-bottom: 12px;
}

.metric-box {
  height: 96px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 13px 14px;
  background: var(--el-bg-color);
}

.metric-box span,
.metric-box em {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-style: normal;
}

.metric-box strong {
  display: block;
  margin: 6px 0 4px;
  font-size: 26px;
  font-weight: 750;
}

.tone-blue { border-left: 4px solid #3b82f6; }
.tone-ink { border-left: 4px solid #475569; }
.tone-green { border-left: 4px solid #16a34a; }
.tone-amber { border-left: 4px solid #d97706; }

.quick-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.dashboard-entry {
  position: relative;
  display: grid;
  grid-template-columns: 34px 1fr 18px;
  grid-template-rows: auto auto;
  gap: 2px 10px;
  min-height: 76px;
  padding: 13px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
  text-align: left;
  cursor: pointer;
}

.dashboard-entry > .el-icon:first-child {
  grid-row: 1 / 3;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
}

.dashboard-entry span {
  align-self: end;
  font-size: 14px;
  font-weight: 700;
}

.dashboard-entry small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.entry-arrow {
  grid-column: 3;
  grid-row: 1 / 3;
  align-self: center;
  color: var(--el-text-color-secondary);
}

.dashboard-entry:hover,
.module-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.module-card,
.change-panel {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.module-card {
  padding: 15px;
  cursor: pointer;
}

.module-card__top,
.module-card__foot,
.panel-title,
.change-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.module-card__top span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.module-card__top strong {
  display: block;
  margin-top: 4px;
  font-size: 24px;
}

.module-card p {
  min-height: 42px;
  margin: 10px 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.7;
}

.module-card__foot {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.risk-aml { border-top: 3px solid #dc2626; }
.risk-black { border-top: 3px solid #d97706; }
.risk-white { border-top: 3px solid #16a34a; }
.risk-rule { border-top: 3px solid #2563eb; }

.change-panel {
  min-height: 100%;
  padding: 15px;
}

.panel-title {
  align-items: flex-start;
  margin-bottom: 10px;
}

.panel-title h4 {
  margin: 0 0 4px;
  font-size: 15px;
}

.panel-title p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.change-list {
  min-height: 260px;
}

.change-item {
  padding: 10px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.change-item strong,
.change-item span {
  display: block;
}

.change-item strong {
  margin-bottom: 4px;
  font-size: 13px;
}

.change-item span,
.change-item :deep(.base-date-time) {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 1100px) {
  .cockpit-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .priority-strip {
    min-width: 0;
    width: 100%;
    overflow-x: auto;
  }

  .quick-panel,
  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>

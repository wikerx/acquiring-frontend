<template>
  <div class="app-container risk-module-overview">
    <section class="module-head" :class="moduleMeta.tone">
      <div>
        <div class="eyebrow">{{ moduleMeta.eyebrow }}</div>
        <h3>{{ moduleMeta.title }}</h3>
        <p>{{ moduleMeta.description }}</p>
      </div>
      <div class="module-policy">
        <span>{{ t('risk.overview.priorityLabel') }}</span>
        <strong>{{ moduleMeta.policy }}</strong>
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

    <section v-if="layerCards.length > 0" class="layer-panel">
      <div class="section-head layer-head">
        <div>
          <h4>{{ t('risk.overview.layerTitle') }}</h4>
          <p>{{ layerDesc }}</p>
        </div>
      </div>
      <div class="layer-grid">
        <article v-for="item in layerCards" :key="item.title" class="layer-card" :class="item.tone">
          <span>{{ item.level }}</span>
          <strong>{{ item.title }}</strong>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section class="section-head">
      <div>
        <h4>{{ t('risk.overview.quickEntries') }}</h4>
        <p>{{ t('risk.overview.quickEntriesDesc') }}</p>
      </div>
      <el-switch v-model="showNoPermission" :active-text="t('risk.overview.showNoPermission')" />
    </section>

    <div v-loading="loading" class="category-stack">
      <section v-for="group in visibleGroups" :key="group.name" class="category-panel" :class="`category-panel--${group.tone}`">
        <div class="category-title">
          <span>{{ group.name }}</span>
          <em>{{ group.items.length }} {{ t('risk.overview.itemsUnit') }}</em>
        </div>
        <div class="function-grid">
          <article
            v-for="item in group.items"
            :key="item.functionCode"
            class="function-card"
            :class="{ disabled: !canEnter(item) }"
            @click="enterFunction(item)"
          >
            <div class="function-card__top">
              <div class="function-card__title">
                <strong>{{ functionDisplayName(item) }}</strong>
                <span>{{ functionHint(item) }}</span>
              </div>
              <div class="function-card__layer">
                <span class="risk-layer-tag" :class="`risk-layer-tag--${riskLayer(item).tone}`">{{ t(riskLayer(item).labelKey) }}</span>
              </div>
              <div class="function-card__tags">
                <el-tag size="small" :type="statusTagType(item)">{{ statusText(item) }}</el-tag>
              </div>
            </div>
            <div class="function-card__body">
              <div>
                <span>{{ t('risk.dashboard.totalRules') }}</span>
                <strong>{{ item.total || 0 }}</strong>
              </div>
              <div>
                <span>{{ t('risk.dashboard.enabledRules') }}</span>
                <strong>{{ item.enabled || 0 }}</strong>
              </div>
              <div>
                <span>{{ t('risk.overview.disabledRules') }}</span>
                <strong>{{ item.disabled || 0 }}</strong>
              </div>
            </div>
            <el-progress :percentage="Number(item.enabledRate || 0)" :stroke-width="7" :show-text="false" />
            <div class="function-card__foot">
              <span v-if="item.latestOperationTime">
                {{ t('risk.overview.latestChange') }}
                <BaseDateTime :value="item.latestOperationTime" />
              </span>
              <span v-else>{{ t('risk.overview.noChange') }}</span>
              <el-icon><component :is="canEnter(item) ? ArrowRight : Lock" /></el-icon>
            </div>
          </article>
        </div>
      </section>
      <el-empty v-if="!loading && visibleGroups.length === 0" :description="t('risk.overview.noEntries')" />
    </div>

    <section class="detail-panel">
      <div class="section-head">
        <div>
          <h4>{{ t('risk.overview.detailTitle') }}</h4>
          <p>{{ t('risk.overview.detailDesc') }}</p>
        </div>
      </div>
      <el-table v-loading="loading" :data="accessibleFunctions" size="small">
        <el-table-column :label="moduleMeta.functionNameLabel" min-width="190" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ functionDisplayName(row) }}</template>
        </el-table-column>
        <el-table-column :label="$t('risk.layer.ownerLayer')" width="132" align="center">
          <template #default="{ row }">
            <span class="risk-layer-tag" :class="`risk-layer-tag--${riskLayer(row).tone}`">{{ t(riskLayer(row).labelKey) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="functionCode" :label="$t('risk.common.functionCode')" min-width="130" align="center" show-overflow-tooltip />
        <el-table-column prop="total" :label="$t('risk.dashboard.totalRules')" width="110" align="center" />
        <el-table-column prop="enabled" :label="$t('risk.dashboard.enabledRules')" width="110" align="center" />
        <el-table-column prop="enabledRate" :label="$t('risk.overview.enabledRate')" width="110" align="center">
          <template #default="{ row }">{{ row.enabledRate || 0 }}%</template>
        </el-table-column>
        <el-table-column :label="$t('risk.overview.latestOperator')" min-width="150" align="center">
          <template #default="{ row }">{{ row.latestOperator || '-' }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.updateTime')" width="170" align="center">
          <template #default="{ row }"><BaseDateTime :value="row.latestUpdateTime" /></template>
        </el-table-column>
        <el-table-column :label="$t('common.operation')" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="!canEnter(row)" @click.stop="enterFunction(row)">{{ t('risk.overview.enter') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowRight, Lock } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import { getRiskDashboard, type RiskDashboardFunction } from '@/api/risk';
import { useUserStore } from '@/store/modules/user';
import { riskFunctionName, riskLayerMeta } from '@/views/risk/shared';

type ModuleType = 'AML' | 'BLACK' | 'WHITE' | 'RULE';

interface CategoryGroup {
  name: string;
  tone: CategoryTone;
  codes: string[];
}

type CategoryTone =
  | 'card'
  | 'network'
  | 'identity'
  | 'contact'
  | 'address'
  | 'merchant'
  | 'access'
  | 'amount'
  | 'frequency'
  | 'countryCard';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const showNoPermission = ref(false);
const functions = ref<RiskDashboardFunction[]>([]);

/**
 * 分模块总览页负责展示 AML、黑名单、白名单和规则的分层说明、快捷入口和配置明细。
 */
const moduleType = computed<ModuleType>(() => {
  if (route.path.startsWith('/risk/aml')) return 'AML';
  if (route.path.startsWith('/risk/whitelist')) return 'WHITE';
  if (route.path.startsWith('/risk/rule')) return 'RULE';
  return 'BLACK';
});

const moduleFunctions = computed(() => functions.value.filter((item) => item.moduleType === moduleType.value));
const accessibleFunctions = computed(() => moduleFunctions.value.filter((item) => canEnter(item)));
const displayedFunctions = computed(() => showNoPermission.value ? moduleFunctions.value : accessibleFunctions.value);
const totalRules = computed(() => moduleFunctions.value.reduce((sum, item) => sum + Number(item.total || 0), 0));
const enabledRules = computed(() => moduleFunctions.value.reduce((sum, item) => sum + Number(item.enabled || 0), 0));
const noPermissionCount = computed(() => moduleFunctions.value.length - accessibleFunctions.value.length);
const configuredCount = computed(() => moduleFunctions.value.filter((item) => Number(item.total || 0) > 0).length);
const enabledRate = computed(() => totalRules.value ? Math.round((enabledRules.value / totalRules.value) * 100) : 0);

const moduleMeta = computed(() => {
  const map = {
    AML: {
      title: t('risk.overview.amlTitle'),
      eyebrow: t('risk.overview.amlEyebrow'),
      description: t('risk.overview.amlDesc'),
      policy: t('risk.overview.amlPolicy'),
      tone: 'tone-aml',
      functionNameLabel: t('risk.overview.amlFunctionName'),
    },
    BLACK: {
      title: t('risk.overview.blackTitle'),
      eyebrow: t('risk.overview.blackEyebrow'),
      description: t('risk.overview.blackDesc'),
      policy: t('risk.overview.blackPolicy'),
      tone: 'tone-black',
      functionNameLabel: t('risk.overview.blackFunctionName'),
    },
    WHITE: {
      title: t('risk.overview.whiteTitle'),
      eyebrow: t('risk.overview.whiteEyebrow'),
      description: t('risk.overview.whiteDesc'),
      policy: t('risk.overview.whitePolicy'),
      tone: 'tone-white',
      functionNameLabel: t('risk.overview.whiteFunctionName'),
    },
    RULE: {
      title: t('risk.overview.ruleTitle'),
      eyebrow: t('risk.overview.ruleEyebrow'),
      description: t('risk.overview.ruleDesc'),
      policy: t('risk.overview.rulePolicy'),
      tone: 'tone-rule',
      functionNameLabel: t('risk.overview.ruleFunctionName'),
    },
  };
  return map[moduleType.value];
});

const metricCards = computed(() => [
  { label: t('risk.dashboard.functionCount'), value: moduleFunctions.value.length, hint: `${accessibleFunctions.value.length} ${t('risk.overview.accessibleCount')}`, tone: 'tone-blue' },
  { label: t('risk.dashboard.totalRules'), value: totalRules.value, hint: `${configuredCount.value} ${t('risk.overview.configuredFunctions')}`, tone: 'tone-ink' },
  { label: t('risk.dashboard.enabledRules'), value: enabledRules.value, hint: `${enabledRate.value}% ${t('risk.dashboard.enabledRate')}`, tone: 'tone-green' },
  { label: t('risk.overview.noPermission'), value: noPermissionCount.value, hint: t('risk.overview.noPermissionHint'), tone: 'tone-amber' },
]);

const layerDesc = computed(() => {
  if (moduleType.value === 'BLACK') return t('risk.overview.blackLayerDesc');
  if (moduleType.value === 'WHITE') return t('risk.overview.whiteLayerDesc');
  if (moduleType.value === 'AML') return t('risk.overview.amlLayerDesc');
  return '';
});

const layerCards = computed(() => {
  if (moduleType.value === 'BLACK') {
    return [
      { level: 'AML', title: t('risk.overview.layerAmlBlack'), desc: t('risk.overview.layerAmlBlackDesc'), tone: 'layer-danger' },
      { level: 'A', title: t('risk.overview.layerBlackA'), desc: t('risk.overview.layerBlackADesc'), tone: 'layer-warning-strong' },
      { level: 'B', title: t('risk.overview.layerBlackB'), desc: t('risk.overview.layerBlackBDesc'), tone: 'layer-warning' },
      { level: 'C', title: t('risk.overview.layerBlackC'), desc: t('risk.overview.layerBlackCDesc'), tone: 'layer-muted' },
    ];
  }
  if (moduleType.value === 'WHITE') {
    return [
      { level: t('risk.layer.strongWhiteShort'), title: t('risk.overview.layerStrongWhite'), desc: t('risk.overview.layerStrongWhiteDesc'), tone: 'layer-success-strong' },
      { level: t('risk.layer.preferWhiteShort'), title: t('risk.overview.layerPreferWhite'), desc: t('risk.overview.layerPreferWhiteDesc'), tone: 'layer-success' },
      { level: t('risk.layer.weakWhiteShort'), title: t('risk.overview.layerWeakWhite'), desc: t('risk.overview.layerWeakWhiteDesc'), tone: 'layer-muted' },
    ];
  }
  if (moduleType.value === 'AML') {
    return [
      { level: 'P0', title: t('risk.overview.layerAmlBlack'), desc: t('risk.overview.layerAmlBlackDesc'), tone: 'layer-danger' },
    ];
  }
  return [];
});

const categoryGroups = computed<CategoryGroup[]>(() => {
  const map: Record<ModuleType, CategoryGroup[]> = {
    AML: [
      { name: t('risk.overview.categoryCard'), tone: 'card', codes: ['card', 'cardBin'] },
      { name: t('risk.overview.categoryNetwork'), tone: 'network', codes: ['ip', 'sourceUrl'] },
      { name: t('risk.overview.categoryIdentity'), tone: 'identity', codes: ['country', 'email', 'phone', 'cardholderName', 'legalPerson', 'enterprise', 'merchantBillingAddress'] },
    ],
    BLACK: [
      { name: t('risk.overview.categoryCard'), tone: 'card', codes: ['cardNo', 'cardFingerprint', 'cardBin', 'cardholderName'] },
      { name: t('risk.overview.categoryNetwork'), tone: 'network', codes: ['ip', 'region', 'deviceFingerprint'] },
      { name: t('risk.overview.categoryContact'), tone: 'contact', codes: ['phone', 'email', 'emailUsername', 'emailDomain'] },
      { name: t('risk.overview.categoryAddress'), tone: 'address', codes: ['billingAddress', 'billingZip', 'billingCountry', 'shippingAddress', 'shippingZip', 'shippingCountry', 'issuerCountry'] },
    ],
    WHITE: [
      { name: t('risk.overview.categoryMerchant'), tone: 'merchant', codes: ['merchant', 'customerId'] },
      { name: t('risk.overview.categoryCard'), tone: 'card', codes: ['cardNo', 'cardFingerprint', 'cardBin'] },
      { name: t('risk.overview.categoryNetwork'), tone: 'network', codes: ['ip', 'tradeCountry', 'issuerCountry', 'deviceFingerprint'] },
      { name: t('risk.overview.categoryContact'), tone: 'contact', codes: ['email', 'emailDomain', 'phone'] },
    ],
    RULE: [
      { name: t('risk.overview.categoryAccess'), tone: 'access', codes: ['sourceUrl', 'threeDs'] },
      { name: t('risk.overview.categoryAmount'), tone: 'amount', codes: ['merchantLimit'] },
      { name: t('risk.overview.categoryFrequency'), tone: 'frequency', codes: ['frequency'] },
      { name: t('risk.overview.categoryCountryCard'), tone: 'countryCard', codes: ['issuerCountry', 'cardBin'] },
    ],
  };
  return map[moduleType.value];
});

const visibleGroups = computed(() => categoryGroups.value
  .map((group) => ({
    name: group.name,
    tone: group.tone,
    items: group.codes
      .map((code) => displayedFunctions.value.find((item) => item.functionCode === code))
      .filter((item): item is RiskDashboardFunction => Boolean(item)),
  }))
  .filter((group) => group.items.length > 0));

onMounted(loadData);
watch(() => route.path, () => {
  showNoPermission.value = false;
});

async function loadData() {
  loading.value = true;
  try {
    const data = await getRiskDashboard();
    functions.value = data.functions || [];
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function canEnter(item: RiskDashboardFunction) {
  return userStore.hasPermission(`${item.permissionPrefix}:list`);
}

function enterFunction(item: RiskDashboardFunction) {
  if (!canEnter(item)) {
    ElMessage.warning(t('risk.overview.noFunctionPermission'));
    return;
  }
  router.push(item.routePath);
}

function functionDisplayName(item: RiskDashboardFunction) {
  return riskFunctionName(t, item);
}

function statusTagType(item: RiskDashboardFunction) {
  if (!canEnter(item)) return 'info';
  if (Number(item.total || 0) === 0) return 'warning';
  if (Number(item.enabled || 0) === 0) return 'danger';
  return 'success';
}

function statusText(item: RiskDashboardFunction) {
  if (!canEnter(item)) return t('risk.overview.noPermission');
  if (Number(item.total || 0) === 0) return t('risk.overview.notConfigured');
  if (Number(item.enabled || 0) === 0) return t('risk.overview.allDisabled');
  return t('risk.overview.enabled');
}

function functionHint(item: RiskDashboardFunction) {
  if (moduleType.value === 'AML') return t('risk.overview.forceReject');
  if (moduleType.value === 'WHITE') return item.functionCode === 'merchant' ? t('risk.overview.merchantExemption') : t('risk.overview.riskExemption');
  if (moduleType.value === 'RULE') return t('risk.overview.ruleControl');
  return item.functionCode === 'region' ? t('risk.overview.regionBlock') : t('risk.overview.blockOrReview');
}

function riskLayer(item: RiskDashboardFunction) {
  return riskLayerMeta(item);
}
</script>

<style scoped>
.risk-module-overview {
  color: var(--el-text-color-primary);
}

.module-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  min-height: 120px;
  margin-bottom: 12px;
  padding: 18px 20px;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  background: #fff;
}

.module-head h3 {
  margin: 4px 0 8px;
  font-size: 22px;
  font-weight: 700;
}

.module-head p {
  max-width: 760px;
  margin: 0;
  color: #526274;
  font-size: 13px;
  line-height: 1.7;
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
}

.module-policy {
  min-width: 260px;
  padding: 11px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.45);
}

.module-policy span,
.module-policy strong {
  display: block;
}

.module-policy span {
  margin-bottom: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.module-policy strong {
  font-size: 13px;
}

.tone-aml {
  background: linear-gradient(135deg, #fff1f2, #fff 56%, #f8fafc);
}

.tone-aml .eyebrow { color: #dc2626; }

.tone-black {
  background: linear-gradient(135deg, #fff7ed, #fff 56%, #f8fafc);
}

.tone-black .eyebrow { color: #d97706; }

.tone-white {
  background: linear-gradient(135deg, #ecfdf5, #fff 56%, #f8fafc);
}

.tone-white .eyebrow { color: #16a34a; }

.tone-rule {
  background: linear-gradient(135deg, #eff6ff, #fff 56%, #f8fafc);
}

.tone-rule .eyebrow { color: #2563eb; }

.metric-row {
  margin-bottom: 12px;
}

.metric-box {
  height: 92px;
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

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 14px 0 10px;
}

.section-head h4 {
  margin: 0 0 4px;
  font-size: 15px;
}

.section-head p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.category-stack {
  min-height: 180px;
}

.layer-panel {
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.layer-head {
  margin-top: 0;
}

.layer-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.layer-card {
  min-height: 112px;
  padding: 13px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: #fff;
}

.layer-card span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  margin-bottom: 8px;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.layer-card strong {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
}

.layer-card p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.layer-danger { border-left: 4px solid #dc2626; }
.layer-danger span { background: #dc2626; }
.layer-warning-strong { border-left: 4px solid #b45309; }
.layer-warning-strong span { background: #b45309; }
.layer-warning { border-left: 4px solid #d97706; }
.layer-warning span { background: #d97706; }
.layer-success-strong { border-left: 4px solid #15803d; }
.layer-success-strong span { background: #15803d; }
.layer-success { border-left: 4px solid #16a34a; }
.layer-success span { background: #16a34a; }
.layer-muted { border-left: 4px solid #64748b; }
.layer-muted span { background: #64748b; }

.category-panel {
  --category-color: #3b82f6;
  --category-soft: #eff6ff;
  --category-soft-strong: #dbeafe;
  --category-border: #bfdbfe;
  position: relative;
  margin-bottom: 12px;
  padding: 14px 14px 14px 16px;
  border: 1px solid var(--category-border);
  border-radius: 8px;
  background: linear-gradient(180deg, var(--category-soft), #fff 58%);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.category-panel::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  content: '';
  background: var(--category-color);
}

.category-panel--card {
  --category-color: #ea580c;
  --category-soft: #fff7ed;
  --category-soft-strong: #ffedd5;
  --category-border: #fed7aa;
}

.category-panel--network {
  --category-color: #2563eb;
  --category-soft: #eff6ff;
  --category-soft-strong: #dbeafe;
  --category-border: #bfdbfe;
}

.category-panel--identity {
  --category-color: #7c3aed;
  --category-soft: #f5f3ff;
  --category-soft-strong: #ede9fe;
  --category-border: #ddd6fe;
}

.category-panel--contact {
  --category-color: #0891b2;
  --category-soft: #ecfeff;
  --category-soft-strong: #cffafe;
  --category-border: #a5f3fc;
}

.category-panel--address {
  --category-color: #64748b;
  --category-soft: #f8fafc;
  --category-soft-strong: #e2e8f0;
  --category-border: #cbd5e1;
}

.category-panel--merchant {
  --category-color: #16a34a;
  --category-soft: #f0fdf4;
  --category-soft-strong: #dcfce7;
  --category-border: #bbf7d0;
}

.category-panel--access {
  --category-color: #4f46e5;
  --category-soft: #eef2ff;
  --category-soft-strong: #e0e7ff;
  --category-border: #c7d2fe;
}

.category-panel--amount {
  --category-color: #ca8a04;
  --category-soft: #fefce8;
  --category-soft-strong: #fef3c7;
  --category-border: #fde68a;
}

.category-panel--frequency {
  --category-color: #db2777;
  --category-soft: #fdf2f8;
  --category-soft-strong: #fce7f3;
  --category-border: #fbcfe8;
}

.category-panel--countryCard {
  --category-color: #0d9488;
  --category-soft: #f0fdfa;
  --category-soft-strong: #ccfbf1;
  --category-border: #99f6e4;
}

.category-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.category-title span {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border: 1px solid var(--category-border);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--category-color);
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.category-title em {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 4px;
  background: var(--category-soft-strong);
  color: var(--category-color);
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  line-height: 1;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.function-card {
  padding: 13px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.function-card:hover {
  border-color: var(--category-border);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.category-panel :deep(.el-progress-bar__inner) {
  background-color: var(--category-color);
}

.function-card.disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.function-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.function-card__top {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 10px;
}

.function-card__title {
  min-width: 0;
}

.function-card__tags {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

.function-card__tags :deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  line-height: 1;
  padding-top: 0;
  padding-bottom: 0;
}

.function-card__title strong,
.function-card__title span {
  display: block;
}

.function-card__title strong {
  margin-bottom: 5px;
  font-size: 14px;
}

.function-card__title span,
.function-card__body span,
.function-card__foot {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.function-card__body {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 10px;
  margin: 10px 0 10px;
}

.function-card__body > div {
  min-width: 0;
}

.function-card__body > div:nth-child(2) {
  text-align: center;
}

.function-card__body > div:nth-child(3) {
  text-align: right;
}

.function-card__layer {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
}

.function-card__body strong {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-size: 18px;
}

.function-card__foot {
  margin-top: 10px;
}

.function-card__foot span {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.risk-layer-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 24px;
  padding: 0 10px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
}

.risk-layer-tag--danger {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fef2f2;
}

.risk-layer-tag--warningStrong {
  color: #92400e;
  border-color: #fed7aa;
  background: #fff7ed;
}

.risk-layer-tag--warning {
  color: #a16207;
  border-color: #fde68a;
  background: #fffbeb;
}

.risk-layer-tag--successStrong {
  color: #166534;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.risk-layer-tag--success {
  color: #047857;
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.risk-layer-tag--muted {
  color: #475569;
  border-color: #cbd5e1;
  background: #f8fafc;
}

.risk-layer-tag--rule {
  color: #1d4ed8;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.detail-panel {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

@media (max-width: 1280px) {
  .layer-grid,
  .function-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

}

@media (max-width: 900px) {
  .module-head,
  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .module-policy {
    min-width: 0;
    width: 100%;
  }

  .layer-grid,
  .function-grid {
    grid-template-columns: 1fr;
  }

}
</style>

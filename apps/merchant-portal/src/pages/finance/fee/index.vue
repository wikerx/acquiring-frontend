<template>
    <div class="page system-page merchant-redesigned-page merchant-fee-page">
        <el-empty v-if="!loading && !fee" :description="$t('finance.noActiveFee')" />
        <template v-else>
            <section v-loading="loading" class="fee-version-band">
                <div class="fee-version-primary">
                    <span>{{ $t('finance.configurationName') }}</span>
                    <strong>{{ fee?.displayName || '-' }}</strong>
                </div>
                <div>
                    <span>{{ $t('finance.activeVersionLabel') }}</span>
                    <strong>{{ fee ? `v${fee.versionNo}` : '-' }}</strong>
                </div>
                <div>
                    <span>{{ $t('finance.effectiveTime') }}</span>
                    <strong class="fee-date"><BaseDateTime :value="fee?.effectiveTime" /></strong>
                </div>
            </section>

            <section class="merchant-list-card merchant-table-card">
                <div class="merchant-table-head">
                    <div class="merchant-table-head__actions">
                        <el-tag v-if="fee" type="success" effect="plain">{{ $t('finance.activeVersion', { version: fee.versionNo }) }}</el-tag>
                    </div>
                    <RightToolbar :show-search="false" @refresh="load" />
                </div>

                <el-tabs v-model="activeTab" class="fee-tabs">
                    <el-tab-pane v-for="tab in feeTabs" :key="tab.name" :label="tab.label" :name="tab.name">
                        <StandardTable v-loading="loading" :table-key="`merchant-current-fee-${tab.name}`" :data="rulesFor(tab.name)" row-key="id" size="small">
                            <el-table-column type="expand" width="48" fixed="left">
                                <template #default="{ row }">
                                    <div class="tier-detail">
                                        <span v-if="!row.tiers?.length">{{ $t('finance.noTiers') }}</span>
                                        <el-table v-else :data="row.tiers" border size="small">
                                            <el-table-column prop="lowerBound" :label="$t('finance.lowerInclusive')" min-width="110" align="center" />
                                            <el-table-column prop="upperBound" :label="$t('finance.upperExclusive')" min-width="120" align="center">
                                                <template #default="{ row: tier }">{{ tier.upperBound ?? $t('finance.unlimited') }}</template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.rate')" min-width="110" align="right">
                                                <template #default="{ row: tier }">{{ tier.percentageRate }}%</template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.fixedFee')" min-width="120" align="right">
                                                <template #default="{ row: tier }">{{ usd(tier.fixedAmountUsd) }}</template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.minimumFee')" min-width="120" align="right">
                                                <template #default="{ row: tier }">{{ usd(tier.minimumAmountUsd) }}</template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.maximumFee')" min-width="120" align="right">
                                                <template #default="{ row: tier }">{{ usd(tier.maximumAmountUsd) }}</template>
                                            </el-table-column>
                                        </el-table>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="ruleName" :label="$t('finance.feeName')" min-width="160" fixed="left" align="center" />
                            <el-table-column prop="transactionType" :label="$t('finance.transactionType')" min-width="130" align="center" />
                            <el-table-column prop="paymentType" :label="$t('finance.paymentType')" min-width="130" align="center" />
                            <el-table-column prop="paymentMethod" :label="$t('finance.paymentMethod')" min-width="120" align="center" />
                            <el-table-column :label="$t('finance.feeMode')" width="120" align="center">
                                <template #default="{ row }"><el-tag :type="row.feeMode === 'TIER' ? 'warning' : 'info'">{{ row.feeMode === 'TIER' ? $t('finance.monthlyTier') : $t('finance.standardRate') }}</el-tag></template>
                            </el-table-column>
                            <el-table-column :label="$t('finance.percentageRate')" width="120" align="right">
                                <template #default="{ row }">{{ row.percentageRate }}%</template>
                            </el-table-column>
                            <el-table-column :label="$t('finance.fixedFee')" width="130" align="right">
                                <template #default="{ row }">{{ usd(row.fixedAmountUsd) }}</template>
                            </el-table-column>
                            <el-table-column :label="$t('finance.minimumFee')" width="130" align="right">
                                <template #default="{ row }">{{ usd(row.minimumAmountUsd) }}</template>
                            </el-table-column>
                            <el-table-column :label="$t('finance.maximumFee')" width="130" align="right">
                                <template #default="{ row }">{{ usd(row.maximumAmountUsd) }}</template>
                            </el-table-column>
                        </StandardTable>
                    </el-tab-pane>

                    <el-tab-pane :label="$t('finance.reserveSettings')" name="RESERVE">
                        <section class="configuration-panel">
                            <el-alert :title="$t('finance.reserveRuleHint')" type="info" :closable="false" show-icon />
                            <el-descriptions :column="2" border size="small">
                                <el-descriptions-item :label="$t('finance.reserveRate')">{{ fee?.reserveRate ?? 0 }}%</el-descriptions-item>
                                <el-descriptions-item :label="$t('finance.reserveDelayDays')">D+{{ fee?.reserveDelayDays || '-' }}</el-descriptions-item>
                            </el-descriptions>
                        </section>
                    </el-tab-pane>

                    <el-tab-pane :label="$t('finance.settlementSettings')" name="SETTLEMENT">
                        <section class="configuration-panel">
                            <el-descriptions :column="3" border size="small">
                                <el-descriptions-item :label="$t('finance.initialCycle')">{{ cycle(fee?.initialDelayUnit, fee?.initialDelayDays) }}</el-descriptions-item>
                                <el-descriptions-item :label="$t('finance.regularCycle')">{{ cycle(fee?.regularDelayUnit, fee?.regularDelayDays) }}</el-descriptions-item>
                                <el-descriptions-item :label="$t('finance.settlementFrequency')">{{ frequency(fee?.settlementFrequency, fee?.frequencyDay) }}</el-descriptions-item>
                            </el-descriptions>
                        </section>
                    </el-tab-pane>
                </el-tabs>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { financeApi, type CurrentFee, type FeeRule } from '@/api/financeApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';

type FeeCategory = FeeRule['feeCategory'];

const { t } = useI18n();
const loading = ref(false);
const fee = ref<CurrentFee | null>(null);
const activeTab = ref<FeeCategory | 'RESERVE' | 'SETTLEMENT'>('TRANSACTION_FEE');
const feeTabs = computed(() => [
    { name: 'TRANSACTION_FEE' as const, label: t('finance.category.transaction') },
    { name: 'REFUND_FEE' as const, label: t('finance.category.refund') },
    { name: 'RISK_FEE' as const, label: t('finance.category.risk') },
    { name: 'DISPUTE_FEE' as const, label: t('finance.category.dispute') },
]);

onMounted(load);

/** Load the merchant's active copied fee configuration without exposing template-library metadata. */
async function load() {
    loading.value = true;
    try {
        fee.value = await financeApi.currentFee();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function rulesFor(category: FeeCategory) {
    return fee.value?.rules.filter((item) => item.feeCategory === category) || [];
}

function cycle(unit?: string, days?: number) {
    return unit && days ? `${unit}+${days}` : '-';
}

function frequency(value?: string, day?: number | null) {
    if (value === 'DAILY') return t('finance.daily');
    if (value === 'WEEKLY') return t('finance.weekly', { day: day || '-' });
    if (value === 'BIWEEKLY') return t('finance.biweekly', { day: day || '-' });
    if (value === 'MONTHLY') return t('finance.monthly', { day: day || '-' });
    return value || '-';
}

function usd(value?: string | number | null) {
    return value === null || value === undefined || value === '' ? '-' : `USD ${value}`;
}
</script>

<style scoped>
.merchant-fee-page { --fee-ink: #17243a; --fee-muted: #697586; }
.fee-version-band { display: grid; grid-template-columns: 1.5fr repeat(2, minmax(0, 1fr)); overflow: hidden; border: 1px solid #dbe4ec; border-radius: 6px; background: #fff; }
.fee-version-band > div { min-height: 90px; padding: 16px; border-right: 1px solid #e8edf2; }
.fee-version-band > div:last-child { border-right: 0; }
.fee-version-band span { color: var(--fee-muted); font-size: 12px; }
.fee-version-band strong { display: block; margin-top: 8px; color: var(--fee-ink); font-size: 17px; }
.fee-version-primary { border-top: 3px solid var(--merchant-action-primary); }
.fee-version-primary strong { font-size: 19px; }
.fee-version-band .fee-date { font-size: 13px; }
.fee-tabs { padding: 0 16px 16px; }
.fee-tabs :deep(.el-tabs__item) { min-width: 108px; text-align: center; }
.tier-detail { padding: 14px 48px; background: #f7fafc; }
.tier-detail > span { color: var(--fee-muted); font-size: 12px; }
.configuration-panel { display: grid; gap: 16px; min-height: 180px; padding: 8px 0; align-content: start; }
@media (max-width: 760px) {
    .fee-version-band { grid-template-columns: 1fr; }
    .fee-version-band > div { border-right: 0; border-bottom: 1px solid #e8edf2; }
    .fee-version-band > div:last-child { border-bottom: 0; }
    .fee-tabs { padding: 0 10px 12px; }
    .fee-tabs :deep(.el-tabs__item) { min-width: 0; padding: 0 12px; }
    .tier-detail { padding: 10px; }
}
</style>

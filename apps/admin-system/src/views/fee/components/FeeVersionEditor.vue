<template>
    <div class="fee-version-editor">
        <el-tabs v-model="activeTab" class="fee-config-tabs">
            <el-tab-pane v-for="tab in feeTabs" :key="tab.name" :label="tab.label" :name="tab.name">
                <section class="fee-editor-section">
                    <div class="fee-editor-section__head">
                        <span>{{ $t('feeAccount.feeRulesDesc') }}</span>
                        <el-button :icon="Plus" type="primary" plain @click="addRule(tab.name)">{{ $t('feeAccount.addRule') }}</el-button>
                    </div>
                    <el-empty v-if="!rulesFor(tab.name).length" :description="$t('feeAccount.noCategoryRules')" />
                    <div v-for="(rule, ruleIndex) in rulesFor(tab.name)" :key="ruleLocalKey(rule)" class="fee-rule-block">
                        <div class="fee-rule-block__head">
                            <strong>{{ $t('feeAccount.rule', { index: ruleIndex + 1 }) }}</strong>
                            <el-button :icon="Delete" type="danger" link @click="removeRule(rule)">{{ $t('common.delete') }}</el-button>
                        </div>
                        <el-row :gutter="12">
                            <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.ruleName')" required><el-input v-model="rule.ruleName" maxlength="128" /></el-form-item></el-col>
                            <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.transactionType')" required><FeeDictSelect v-model="rule.transactionType" dict-type="transaction_type" /></el-form-item></el-col>
                            <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.paymentType')" required><FeeDictSelect v-model="rule.paymentType" dict-type="acquiring_payment_method" @change="handlePaymentTypeChange(rule)" /></el-form-item></el-col>
                            <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.paymentMethod')" required><FeeDictSelect v-model="rule.paymentMethod" dict-type="card_brand" allow-all :disabled="rule.paymentType !== 'BANK_CARD'" /></el-form-item></el-col>
                            <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.feeMode')" required><el-segmented v-model="rule.feeMode" :options="feeModeOptions" @change="changeMode(rule)" /></el-form-item></el-col>
                            <template v-if="rule.feeMode === 'STANDARD'">
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.percentageRate')" required><el-input v-model="rule.percentageRate" inputmode="decimal"><template #append>%</template></el-input></el-form-item></el-col>
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.fixedFeeUsd')" required><el-input v-model="rule.fixedAmountUsd" inputmode="decimal"><template #prepend>USD</template></el-input></el-form-item></el-col>
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.minimumFeeUsd')"><el-input v-model="rule.minimumAmountUsd" clearable inputmode="decimal"><template #prepend>USD</template></el-input></el-form-item></el-col>
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.maximumFeeUsd')"><el-input v-model="rule.maximumAmountUsd" clearable inputmode="decimal"><template #prepend>USD</template></el-input></el-form-item></el-col>
                            </template>
                            <el-col v-else :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.monthlyMetric')" required><el-select v-model="rule.tierMetric"><el-option :label="$t('feeAccount.transactionCount')" value="COUNT" /><el-option :label="$t('feeAccount.transactionAmountUsd')" value="AMOUNT" /></el-select></el-form-item></el-col>
                            <el-col :span="24"><el-form-item :label="$t('common.remark')"><el-input v-model="rule.remark" maxlength="500" /></el-form-item></el-col>
                        </el-row>
                        <div v-if="rule.feeMode === 'TIER'" class="fee-tier-table">
                            <div class="fee-tier-table__head"><span>{{ $t('feeAccount.tierBillingDesc') }}</span><el-button :icon="Plus" size="small" @click="addTier(rule)">{{ $t('feeAccount.addTier') }}</el-button></div>
                            <el-table :data="rule.tiers" border size="small">
                                <el-table-column :label="$t('feeAccount.lowerInclusive')" min-width="120"><template #default="scope"><el-input v-model="scope.row.lowerBound" /></template></el-table-column>
                                <el-table-column :label="$t('feeAccount.upperExclusive')" min-width="130"><template #default="scope"><el-input v-model="scope.row.upperBound" clearable :placeholder="$t('feeAccount.lastTierEmpty')" /></template></el-table-column>
                                <el-table-column :label="$t('feeAccount.percentageRate')" min-width="110"><template #default="scope"><el-input v-model="scope.row.percentageRate" /></template></el-table-column>
                                <el-table-column :label="$t('feeAccount.fixedUsd')" min-width="110"><template #default="scope"><el-input v-model="scope.row.fixedAmountUsd" /></template></el-table-column>
                                <el-table-column :label="$t('feeAccount.minimumUsd')" min-width="110"><template #default="scope"><el-input v-model="scope.row.minimumAmountUsd" clearable /></template></el-table-column>
                                <el-table-column :label="$t('feeAccount.maximumUsd')" min-width="110"><template #default="scope"><el-input v-model="scope.row.maximumAmountUsd" clearable /></template></el-table-column>
                                <el-table-column :label="$t('common.operation')" width="76" fixed="right" align="center"><template #default="scope"><el-button :icon="Delete" type="danger" link @click="rule.tiers.splice(scope.$index, 1)" /></template></el-table-column>
                            </el-table>
                        </div>
                    </div>
                </section>
            </el-tab-pane>

            <el-tab-pane :label="$t('feeAccount.reserveSettings')" name="RESERVE">
                <section class="fee-editor-section reserve-settings">
                    <el-alert :title="$t('feeAccount.reserveRuleHint')" type="info" :closable="false" show-icon />
                    <el-row :gutter="16">
                        <el-col :xs="24" :sm="12" :lg="8"><el-form-item :label="$t('feeAccount.reserveRate')" required><el-input v-model="model.reserveRate" inputmode="decimal"><template #append>%</template></el-input></el-form-item></el-col>
                        <el-col :xs="24" :sm="12" :lg="8"><el-form-item :label="$t('feeAccount.reserveDelayDays')" required><div class="fee-cycle-input"><el-input value="D" disabled /><el-input-number v-model="model.reserveDelayDays" :min="1" :max="3650" controls-position="right" /></div></el-form-item></el-col>
                    </el-row>
                </section>
            </el-tab-pane>

            <el-tab-pane :label="$t('feeAccount.settlementSettings')" name="SETTLEMENT">
                <section class="fee-editor-section">
                    <div class="fee-editor-section__head"><span>{{ $t('feeAccount.settlementSettingsDesc') }}</span></div>
                    <el-row :gutter="16">
                        <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.initialCycle')" required><div class="fee-cycle-input"><el-select v-model="model.initialDelayUnit"><el-option :label="$t('feeAccount.businessDays')" value="T" /><el-option :label="$t('feeAccount.calendarDays')" value="D" /></el-select><el-input-number v-model="model.initialDelayDays" :min="1" :max="365" controls-position="right" /></div></el-form-item></el-col>
                        <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.regularCycle')" required><div class="fee-cycle-input"><el-select v-model="model.regularDelayUnit"><el-option :label="$t('feeAccount.businessDays')" value="T" /><el-option :label="$t('feeAccount.calendarDays')" value="D" /></el-select><el-input-number v-model="model.regularDelayDays" :min="1" :max="365" controls-position="right" /></div></el-form-item></el-col>
                        <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.settlementFrequency')" required><el-select v-model="model.settlementFrequency" @change="normalizeFrequencyDay"><el-option :label="$t('feeAccount.daily')" value="DAILY" /><el-option :label="$t('feeAccount.weekly')" value="WEEKLY" /><el-option :label="$t('feeAccount.biweekly')" value="BIWEEKLY" /><el-option :label="$t('feeAccount.monthly')" value="MONTHLY" /></el-select></el-form-item></el-col>
                        <el-col v-if="model.settlementFrequency !== 'DAILY'" :xs="24" :sm="12" :lg="6"><el-form-item :label="model.settlementFrequency === 'MONTHLY' ? $t('feeAccount.monthlyExecutionDay') : $t('feeAccount.weeklyExecutionDay')" required><el-input-number v-model="model.frequencyDay" :min="1" :max="model.settlementFrequency === 'MONTHLY' ? 28 : 7" controls-position="right" /></el-form-item></el-col>
                    </el-row>
                </section>
            </el-tab-pane>
        </el-tabs>
        <el-form-item :label="$t('feeAccount.changeReason')" required class="change-reason"><el-input v-model="model.changeReason" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { FeeRuleInput, FeeVersionInput } from '@/api/fee';
import { createEmptyRule } from '@/views/fee/shared';
import FeeDictSelect from '@/views/fee/components/FeeDictSelect.vue';

type FeeCategory = FeeRuleInput['feeCategory'];
const model = defineModel<FeeVersionInput>({ required: true });
const { t } = useI18n();
const activeTab = ref<FeeCategory | 'RESERVE' | 'SETTLEMENT'>('TRANSACTION_FEE');
const feeTabs = computed(() => [
    { name: 'TRANSACTION_FEE' as const, label: t('feeAccount.category.transaction') },
    { name: 'REFUND_FEE' as const, label: t('feeAccount.category.refund') },
    { name: 'RISK_FEE' as const, label: t('feeAccount.category.risk') },
    { name: 'DISPUTE_FEE' as const, label: t('feeAccount.category.dispute') },
]);
const feeModeOptions = computed(() => [{ label: t('feeAccount.standard'), value: 'STANDARD' }, { label: t('feeAccount.tier'), value: 'TIER' }]);

function rulesFor(category: FeeCategory) { return model.value.rules.filter((item) => item.feeCategory === category); }
function ruleLocalKey(rule: FeeRuleInput) { return model.value.rules.indexOf(rule); }
function addRule(category: FeeCategory) { const rule = createEmptyRule(); rule.feeCategory = category; model.value.rules.push(rule); }
function removeRule(rule: FeeRuleInput) { const index = model.value.rules.indexOf(rule); if (index >= 0) model.value.rules.splice(index, 1); }
function handlePaymentTypeChange(rule: FeeRuleInput) { if (rule.paymentType !== 'BANK_CARD') rule.paymentMethod = 'ALL'; }
function changeMode(rule: FeeRuleInput) { if (rule.feeMode === 'TIER') { rule.tierMetric ||= 'COUNT'; if (!rule.tiers.length) addTier(rule); } else { rule.tierMetric = null; rule.tierPeriod = null; rule.tiers = []; } }
function addTier(rule: FeeRuleInput) { const previous = rule.tiers.at(-1); rule.tiers.push({ lowerBound: previous?.upperBound || '0', upperBound: null, percentageRate: rule.percentageRate || '0', fixedAmountUsd: rule.fixedAmountUsd || '0', minimumAmountUsd: rule.minimumAmountUsd, maximumAmountUsd: rule.maximumAmountUsd, sortNo: rule.tiers.length }); }
function normalizeFrequencyDay() { if (model.value.settlementFrequency === 'DAILY') { model.value.frequencyDay = null; return; } const maximum = model.value.settlementFrequency === 'MONTHLY' ? 28 : 7; if (!model.value.frequencyDay || model.value.frequencyDay > maximum) model.value.frequencyDay = 1; }
</script>

<style scoped>
.fee-version-editor { display: grid; gap: 18px; }
.fee-config-tabs :deep(.el-tabs__header) { margin: 0 0 18px; }
.fee-config-tabs :deep(.el-tabs__item) { min-width: 108px; padding: 0 18px; text-align: center; }
.fee-editor-section { min-height: 240px; }
.fee-editor-section__head, .fee-rule-block__head, .fee-tier-table__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.fee-editor-section__head { margin-bottom: 14px; color: #667085; font-size: 12px; }
.fee-rule-block { margin-top: 12px; padding: 16px; border: 1px solid #dfe6ee; border-radius: 6px; background: #fbfcfe; }
.fee-rule-block__head { margin-bottom: 12px; }
.fee-rule-block__head strong { color: #27344a; font-size: 13px; }
.fee-cycle-input { display: grid; grid-template-columns: minmax(88px, 1fr) minmax(92px, 1fr); gap: 8px; width: 100%; }
.fee-tier-table { margin-top: 2px; padding-top: 12px; border-top: 1px dashed #d9e1ea; }
.fee-tier-table__head { margin-bottom: 10px; color: #7a8494; font-size: 12px; }
.reserve-settings { display: grid; align-content: start; gap: 20px; }
.change-reason { padding-top: 18px; border-top: 1px solid #e8edf3; }
:deep(.el-form-item) { margin-bottom: 14px; }
:deep(.el-select), :deep(.el-input-number), :deep(.el-segmented) { width: 100%; }
@media (max-width: 640px) { .fee-editor-section__head { align-items: flex-start; flex-direction: column; } .fee-rule-block { padding: 12px 10px; } .fee-config-tabs :deep(.el-tabs__item) { min-width: 0; padding: 0 12px; } }
</style>

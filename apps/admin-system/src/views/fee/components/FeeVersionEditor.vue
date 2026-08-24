<template>
    <div class="fee-version-editor">
        <el-tabs v-model="activeTab" class="fee-config-tabs">
            <el-tab-pane v-for="tab in feeTabs" :key="tab.name" :name="tab.name">
                <template #label>
                    <span class="fee-tab-label">
                        <span>{{ tab.label }}</span>
                        <span class="fee-tab-label__count">{{ rulesForCategory(tab.name).length }}</span>
                    </span>
                </template>

                <section class="fee-editor-section">
                    <div class="fee-mode-toolbar">
                        <div v-if="tab.name === 'RISK_FEE'" class="risk-mode-intro">
                            <strong>{{ $t('feeAccount.riskPerEventTitle') }}</strong>
                            <span>{{ $t('feeAccount.riskPerEventHint') }}</span>
                        </div>
                        <div v-else class="fee-mode-toolbar__control">
                            <span class="fee-mode-toolbar__label">{{ $t('feeAccount.feeMode') }}</span>
                            <el-tooltip
                                :disabled="!lockedMode(tab.name)"
                                :content="$t('feeAccount.modeLockedHint')"
                                placement="top"
                            >
                                <el-segmented
                                    v-model="activeModes[tab.name]"
                                    :options="modeOptions(tab.name)"
                                    @change="handleModeChange(tab.name, $event as FeeMode)"
                                />
                            </el-tooltip>
                        </div>
                        <el-button :icon="Plus" type="primary" plain @click="addRule(tab.name)">
                            {{ $t('feeAccount.addRule') }}
                        </el-button>
                    </div>

                    <el-empty
                        v-if="!(tab.name === 'RISK_FEE' ? rulesForCategory(tab.name) : rulesFor(tab.name, activeModes[tab.name])).length"
                        :description="$t('feeAccount.noModeRules')"
                        :image-size="72"
                    />

                    <div
                        v-for="(rule, ruleIndex) in tab.name === 'RISK_FEE' ? rulesForCategory(tab.name) : rulesFor(tab.name, activeModes[tab.name])"
                        :key="ruleLocalKey(rule)"
                        class="fee-rule-block"
                    >
                        <div class="fee-rule-block__head">
                            <div class="fee-rule-block__identity">
                                <el-tag size="small" effect="plain" :type="rule.feeCategory === 'RISK_FEE' ? 'success' : rule.feeMode === 'TIER' ? 'warning' : 'primary'">
                                    {{ rule.feeCategory === 'RISK_FEE' ? riskServiceText(rule.riskServiceType) : rule.feeMode === 'TIER' ? $t('feeAccount.tier') : $t('feeAccount.standard') }}
                                </el-tag>
                                <strong class="fee-rule-block__name" :title="ruleDisplayName(rule, ruleIndex)">
                                    {{ ruleDisplayName(rule, ruleIndex) }}
                                </strong>
                            </div>
                            <el-button :icon="Delete" type="danger" link @click="removeRule(rule)">
                                {{ $t('common.delete') }}
                            </el-button>
                        </div>

                        <el-row :gutter="14">
                            <el-col v-if="rule.feeCategory === 'RISK_FEE'" :xs="24" :sm="12" :lg="6">
                                <el-form-item :label="$t('feeAccount.riskServiceType')" required>
                                    <el-select v-model="rule.riskServiceType" @change="handleRiskServiceTypeChange(rule)">
                                        <el-option :label="$t('feeAccount.riskType.internal')" value="INTERNAL" />
                                        <el-option :label="$t('feeAccount.riskType.external')" value="EXTERNAL" />
                                        <el-option :label="$t('feeAccount.riskType.threeDs')" value="THREE_DS" />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :xs="24" :sm="12" :lg="6">
                                <el-form-item :label="$t('feeAccount.ruleName')">
                                    <el-input v-model="rule.ruleName" maxlength="128" clearable :placeholder="$t('feeAccount.ruleNamePlaceholder')" />
                                </el-form-item>
                            </el-col>
                            <el-col :xs="24" :sm="12" :lg="6">
                                <el-form-item :label="$t('feeAccount.transactionType')" required>
                                    <FeeDictSelect v-model="rule.transactionTypes" dict-type="transaction_type" multiple :placeholder="$t('feeAccount.multipleSelectPlaceholder')" />
                                </el-form-item>
                            </el-col>
                            <el-col :xs="24" :sm="24" :lg="12">
                                <div class="fee-payment-field-pair">
                                    <el-form-item :label="$t('feeAccount.paymentType')" required>
                                        <FeeDictSelect v-model="rule.paymentTypes" dict-type="acquiring_payment_method" multiple :placeholder="$t('feeAccount.multipleSelectPlaceholder')" @change="handlePaymentTypeChange(rule)" />
                                    </el-form-item>
                                    <el-form-item :label="$t('feeAccount.paymentMethod')" required>
                                        <FeeDictSelect v-model="rule.paymentMethods" dict-type="card_brand" multiple allow-all :disabled="!hasBankCard(rule)" :placeholder="$t('feeAccount.multipleSelectPlaceholder')" @change="handlePaymentMethodChange(rule)" />
                                    </el-form-item>
                                </div>
                            </el-col>

                            <template v-if="rule.feeCategory === 'RISK_FEE'">
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.riskFixedFeeUsd')" required><el-input v-model="rule.fixedAmountUsd" :disabled="rule.chargeTrigger === 'NO_CHARGE'" inputmode="decimal"><template #prepend>USD</template></el-input></el-form-item></el-col>
                                <el-col :xs="24" :sm="12" :lg="12"><el-form-item :label="$t('feeAccount.chargeTrigger')" required><el-segmented v-model="rule.chargeTrigger" :options="chargeTriggerOptions(rule.riskServiceType)" @change="handleChargeTriggerChange(rule)" /></el-form-item></el-col>
                            </template>
                            <template v-else-if="rule.feeMode === 'STANDARD'">
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.percentageRate')" required><el-input v-model="rule.percentageRate" inputmode="decimal"><template #append>%</template></el-input></el-form-item></el-col>
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.fixedFeeUsd')" required><el-input v-model="rule.fixedAmountUsd" inputmode="decimal"><template #prepend>USD</template></el-input></el-form-item></el-col>
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.minimumFeeUsd')"><el-input v-model="rule.minimumAmountUsd" clearable inputmode="decimal"><template #prepend>USD</template></el-input></el-form-item></el-col>
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.maximumFeeUsd')"><el-input v-model="rule.maximumAmountUsd" clearable inputmode="decimal"><template #prepend>USD</template></el-input></el-form-item></el-col>
                            </template>
                            <el-col v-else :xs="24" :sm="12" :lg="6">
                                <el-form-item :label="$t('feeAccount.monthlyMetric')" required>
                                    <el-select v-model="rule.tierMetric">
                                        <el-option :label="$t('feeAccount.transactionCount')" value="COUNT" />
                                        <el-option :label="$t('feeAccount.transactionAmountUsd')" value="AMOUNT" />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :span="24"><el-form-item :label="$t('common.remark')"><el-input v-model="rule.remark" maxlength="500" /></el-form-item></el-col>
                        </el-row>

                        <div v-if="rule.feeCategory !== 'RISK_FEE' && rule.feeMode === 'TIER'" class="fee-tier-table">
                            <div class="fee-tier-table__head">
                                <span>{{ $t('feeAccount.tierBillingDesc') }}</span>
                                <el-button :icon="Plus" size="small" @click="addTier(rule)">{{ $t('feeAccount.addTier') }}</el-button>
                            </div>
                            <el-table :data="rule.tiers" border size="small">
                                <el-table-column :label="$t('feeAccount.lowerInclusive')" min-width="120"><template #default="scope"><el-input v-model="scope.row.lowerBound" disabled inputmode="decimal" /></template></el-table-column>
                                <el-table-column :label="$t('feeAccount.upperExclusive')" min-width="130"><template #default="scope"><el-input v-model="scope.row.upperBound" clearable inputmode="decimal" :placeholder="scope.$index === rule.tiers.length - 1 ? $t('feeAccount.lastTierEmpty') : ''" @input="synchronizeNextTierLowerBound(rule, scope.$index)" /></template></el-table-column>
                                <el-table-column :label="$t('feeAccount.percentageRate')" min-width="110"><template #default="scope"><el-input v-model="scope.row.percentageRate" /></template></el-table-column>
                                <el-table-column :label="$t('feeAccount.fixedUsd')" min-width="110"><template #default="scope"><el-input v-model="scope.row.fixedAmountUsd" /></template></el-table-column>
                                <el-table-column :label="$t('feeAccount.minimumUsd')" min-width="110"><template #default="scope"><el-input v-model="scope.row.minimumAmountUsd" clearable /></template></el-table-column>
                                <el-table-column :label="$t('feeAccount.maximumUsd')" min-width="110"><template #default="scope"><el-input v-model="scope.row.maximumAmountUsd" clearable /></template></el-table-column>
                                <el-table-column :label="$t('common.operation')" width="76" fixed="right" align="center"><template #default="scope"><el-button :icon="Delete" type="danger" link @click="removeTier(rule, scope.$index)" /></template></el-table-column>
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
                        <el-col :xs="24" :sm="12" :lg="8"><el-form-item :label="$t('feeAccount.reserveDelayDays')" required><div class="fee-cycle-input"><el-select v-model="model.reserveDelayUnit"><el-option :label="$t('feeAccount.businessDays')" value="T" /><el-option :label="$t('feeAccount.calendarDays')" value="D" /></el-select><el-input-number v-model="model.reserveDelayDays" :min="1" :max="3650" controls-position="right" /></div></el-form-item></el-col>
                    </el-row>
                </section>
            </el-tab-pane>

            <el-tab-pane :label="$t('feeAccount.settlementSettings')" name="SETTLEMENT">
                <section class="fee-editor-section">
                    <div class="fee-editor-section__head"><span>{{ $t('feeAccount.settlementSettingsDesc') }}</span></div>
                    <el-row :gutter="16">
                        <el-col v-if="showSettlementCurrency" :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.settlementCurrency')" required><el-select v-model="model.settlementCurrency" filterable><el-option v-for="currency in currencyOptions" :key="currency" :label="currency" :value="currency" /></el-select></el-form-item></el-col>
                        <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.settlementCycleUnit')" required><el-select v-model="model.initialDelayUnit" @change="synchronizeSettlementUnit"><el-option :label="$t('feeAccount.businessDays')" value="T" /><el-option :label="$t('feeAccount.calendarDays')" value="D" /></el-select></el-form-item></el-col>
                        <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.initialCycle')" required><el-input-number v-model="model.initialDelayDays" :min="1" :max="365" controls-position="right" /></el-form-item></el-col>
                        <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.regularCycle')" required><el-input-number v-model="model.regularDelayDays" :min="1" :max="365" controls-position="right" /></el-form-item></el-col>
                        <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.settlementFrequency')" required><el-select v-model="model.settlementFrequency" @change="normalizeFrequencyDay"><el-option :label="$t('feeAccount.daily')" value="DAILY" /><el-option :label="$t('feeAccount.weekly')" value="WEEKLY" /><el-option :label="$t('feeAccount.biweekly')" value="BIWEEKLY" /><el-option :label="$t('feeAccount.monthly')" value="MONTHLY" /></el-select></el-form-item></el-col>
                        <el-col v-if="model.settlementFrequency !== 'DAILY'" :xs="24" :sm="12" :lg="6"><el-form-item :label="model.settlementFrequency === 'MONTHLY' ? $t('feeAccount.monthlyExecutionDay') : $t('feeAccount.weeklyExecutionDay')" required><el-input-number v-model="model.frequencyDay" :min="1" :max="model.settlementFrequency === 'MONTHLY' ? 28 : 7" controls-position="right" /></el-form-item></el-col>
                    </el-row>

                    <div class="settlement-fx-section">
                        <div class="settlement-fx-section__title">
                            <div><strong>{{ $t('feeAccount.settlementFxFee') }}</strong><span>{{ $t('feeAccount.settlementFxFeeHint') }}</span></div>
                            <el-tag effect="plain" type="primary">{{ $t('feeAccount.standard') }}</el-tag>
                        </div>
                        <div v-if="!settlementFxRule" class="settlement-fx-empty">
                            <span>{{ $t('feeAccount.noFxRules') }}</span>
                            <el-button :icon="Plus" type="primary" plain @click="configureSettlementFxFee">{{ $t('feeAccount.addFxRule') }}</el-button>
                        </div>
                        <div v-else class="fee-rule-block settlement-fx-rule">
                            <div class="fee-rule-block__head">
                                <div class="fee-rule-block__identity"><strong>{{ $t('feeAccount.settlementFxFee') }}</strong><span>{{ $t('feeAccount.singleFxRuleHint') }}</span></div>
                                <el-button :icon="Delete" type="danger" link @click="removeRule(settlementFxRule)">{{ $t('common.delete') }}</el-button>
                            </div>
                            <el-row :gutter="14">
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.percentageRate')" required><el-input v-model="settlementFxRule.percentageRate" inputmode="decimal"><template #append>%</template></el-input></el-form-item></el-col>
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.fixedFeeUsd')" required><el-input v-model="settlementFxRule.fixedAmountUsd" inputmode="decimal"><template #prepend>USD</template></el-input></el-form-item></el-col>
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.minimumFeeUsd')"><el-input v-model="settlementFxRule.minimumAmountUsd" clearable inputmode="decimal"><template #prepend>USD</template></el-input></el-form-item></el-col>
                                <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.maximumFeeUsd')"><el-input v-model="settlementFxRule.maximumAmountUsd" clearable inputmode="decimal"><template #prepend>USD</template></el-input></el-form-item></el-col>
                                <el-col :span="24"><el-form-item :label="$t('common.remark')"><el-input v-model="settlementFxRule.remark" maxlength="500" /></el-form-item></el-col>
                            </el-row>
                        </div>
                    </div>
                </section>
            </el-tab-pane>
        </el-tabs>

        <section class="fee-change-section">
            <el-form-item :label="changeReasonRequired ? $t('feeAccount.changeReason') : $t('feeAccount.changeReasonOptional')" :required="changeReasonRequired">
                <el-input v-model="model.changeReason" type="textarea" :rows="3" maxlength="500" show-word-limit :placeholder="changeReasonRequired ? $t('feeAccount.changeReasonPlaceholder') : $t('feeAccount.initialChangeReasonPlaceholder')" />
            </el-form-item>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import type { FeeRuleInput, FeeVersionInput } from '@/api/fee';
import { compareDecimal, createEmptyRule, createRiskRule, createSettlementFxRule } from '@/views/fee/shared';
import FeeDictSelect from '@/views/fee/components/FeeDictSelect.vue';

type FeeCategory = FeeRuleInput['feeCategory'];
type FeeMode = FeeRuleInput['feeMode'];

withDefaults(defineProps<{
    changeReasonRequired?: boolean;
    showSettlementCurrency?: boolean;
    currencyOptions?: string[];
}>(), {
    changeReasonRequired: true,
    showSettlementCurrency: false,
    currencyOptions: () => [],
});
const model = defineModel<FeeVersionInput>({ required: true });
const { t } = useI18n();
const activeTab = ref<FeeCategory | 'RESERVE' | 'SETTLEMENT'>('TRANSACTION_FEE');
const activeModes = ref<Record<FeeCategory, FeeMode>>({
    TRANSACTION_FEE: initialMode('TRANSACTION_FEE'),
    REFUND_FEE: initialMode('REFUND_FEE'),
    RISK_FEE: 'STANDARD',
    DISPUTE_FEE: initialMode('DISPUTE_FEE'),
    SETTLEMENT_PROCESSING_FEE: initialMode('SETTLEMENT_PROCESSING_FEE'),
    SETTLEMENT_FX_FEE: initialMode('SETTLEMENT_FX_FEE'),
});
const feeTabs = computed(() => [
    { name: 'TRANSACTION_FEE' as const, label: t('feeAccount.category.transaction') },
    { name: 'REFUND_FEE' as const, label: t('feeAccount.category.refund') },
    { name: 'RISK_FEE' as const, label: t('feeAccount.category.risk') },
    { name: 'DISPUTE_FEE' as const, label: t('feeAccount.category.dispute') },
]);
const settlementFxRule = computed(() => rulesForCategory('SETTLEMENT_FX_FEE')[0]);

function rulesForCategory(category: FeeCategory) {
    return model.value.rules.filter((item) => item.feeCategory === category);
}

function initialMode(category: FeeCategory): FeeMode {
    const rules = model.value.rules.filter((item) => item.feeCategory === category);
    return rules.some((item) => item.feeMode === 'STANDARD') || !rules.length ? 'STANDARD' : 'TIER';
}

function rulesFor(category: FeeCategory, mode: FeeMode) {
    return rulesForCategory(category).filter((item) => item.feeMode === mode);
}

function modeOptions(category: FeeCategory) {
    const configuredMode = lockedMode(category);
    return [
        {
            label: `${t('feeAccount.standard')} (${rulesFor(category, 'STANDARD').length})`,
            value: 'STANDARD',
            disabled: configuredMode !== null && configuredMode !== 'STANDARD',
        },
        {
            label: `${t('feeAccount.tier')} (${rulesFor(category, 'TIER').length})`,
            value: 'TIER',
            disabled: configuredMode !== null && configuredMode !== 'TIER',
        },
    ];
}

function configuredModes(category: FeeCategory) {
    return new Set(rulesForCategory(category).map((rule) => rule.feeMode));
}

function lockedMode(category: FeeCategory): FeeMode | null {
    const rules = rulesForCategory(category);
    if (!rules.length || rules.length === 1 && isBlankRule(rules[0])) return null;
    const modes = configuredModes(category);
    return modes.size === 1 ? [...modes][0] : null;
}

function hasMixedModes(category: FeeCategory) {
    return configuredModes(category).size > 1;
}

function ruleLocalKey(rule: FeeRuleInput) {
    return model.value.rules.indexOf(rule);
}

function ruleDisplayName(rule: FeeRuleInput, index: number) {
    return rule.ruleName?.trim() || t('feeAccount.rule', { index: index + 1 });
}

function addRule(category: FeeCategory) {
    if (hasMixedModes(category)) {
        ElMessage.warning(t('feeAccount.validation.mixedFeeModes'));
        return;
    }
    const rule = category === 'RISK_FEE' ? createRiskRule(nextRiskServiceType()) : createEmptyRule();
    rule.feeCategory = category;
    rule.feeMode = category === 'RISK_FEE' ? 'STANDARD' : lockedMode(category) || activeModes.value[category];
    if (rule.feeMode === 'TIER') {
        rule.tierMetric = 'COUNT';
        addTier(rule);
    }
    model.value.rules.push(rule);
}

function configureSettlementFxFee() {
    if (!settlementFxRule.value) model.value.rules.push(createSettlementFxRule());
}

function nextRiskServiceType() {
    const used = new Set(rulesForCategory('RISK_FEE').map((rule) => rule.riskServiceType));
    return (['INTERNAL', 'EXTERNAL', 'THREE_DS'] as const).find((type) => !used.has(type)) || 'INTERNAL';
}

function riskServiceText(type?: FeeRuleInput['riskServiceType']) {
    if (type === 'EXTERNAL') return t('feeAccount.riskType.external');
    if (type === 'THREE_DS') return t('feeAccount.riskType.threeDs');
    return t('feeAccount.riskType.internal');
}

function chargeTriggerOptions(type?: FeeRuleInput['riskServiceType']) {
    if (type === 'INTERNAL') {
        return [
            { label: t('feeAccount.chargeTriggerType.noCharge'), value: 'NO_CHARGE' },
            { label: t('feeAccount.chargeTriggerType.success'), value: 'SUCCESS' },
            { label: t('feeAccount.chargeTriggerType.successOrFailure'), value: 'SUCCESS_OR_FAILURE' },
        ];
    }
    return [
        { label: t('feeAccount.chargeTriggerType.noCharge'), value: 'NO_CHARGE' },
        { label: t('feeAccount.chargeTriggerType.onCall'), value: 'ON_CALL' },
    ];
}

function handleRiskServiceTypeChange(rule: FeeRuleInput) {
    const validTriggers = chargeTriggerOptions(rule.riskServiceType).map((option) => option.value);
    if (!rule.chargeTrigger || !validTriggers.includes(rule.chargeTrigger)) {
        rule.chargeTrigger = 'NO_CHARGE';
        rule.fixedAmountUsd = '';
    }
}

function handleChargeTriggerChange(rule: FeeRuleInput) {
    if (rule.chargeTrigger === 'NO_CHARGE') rule.fixedAmountUsd = '';
}

function removeRule(rule: FeeRuleInput) {
    const category = rule.feeCategory;
    const index = model.value.rules.indexOf(rule);
    if (index >= 0) {
        model.value.rules.splice(index, 1);
    }
    const modes = configuredModes(category);
    if (modes.size === 1) activeModes.value[category] = [...modes][0];
}

function handleModeChange(category: FeeCategory, mode: FeeMode) {
    const configuredMode = lockedMode(category);
    if (configuredMode && configuredMode !== mode) {
        activeModes.value[category] = configuredMode;
        ElMessage.warning(t('feeAccount.modeLockedHint'));
        return;
    }
    const categoryRules = rulesForCategory(category);
    if (categoryRules.length !== 1 || !isBlankRule(categoryRules[0])) return;
    const rule = categoryRules[0];
    rule.feeMode = mode;
    if (rule.feeMode === 'TIER') {
        rule.tierMetric = 'COUNT';
        rule.tiers = [];
        addTier(rule);
    } else {
        rule.tierMetric = null;
        rule.tierPeriod = null;
        rule.tiers = [];
    }
}

function isBlankRule(rule: FeeRuleInput) {
    const paymentMethodsAreBlank = !rule.paymentMethods.length
        || rule.paymentMethods.length === 1 && rule.paymentMethods[0] === 'ALL';
    const amountsAreBlank = [rule.percentageRate, rule.fixedAmountUsd,
        rule.minimumAmountUsd, rule.maximumAmountUsd]
        .every((value) => value === null || value === undefined || String(value).trim() === '');
    const tiersAreBlank = !rule.tiers.length || rule.tiers.length === 1
        && compareDecimal(rule.tiers[0].lowerBound, '0') === 0
        && !hasDecimalValue(rule.tiers[0].upperBound)
        && [rule.tiers[0].percentageRate, rule.tiers[0].fixedAmountUsd,
            rule.tiers[0].minimumAmountUsd, rule.tiers[0].maximumAmountUsd]
            .every((value) => value === null || value === undefined || String(value).trim() === '');
    return !rule.ruleName?.trim()
        && !rule.transactionTypes.length
        && !rule.paymentTypes.length
        && paymentMethodsAreBlank
        && amountsAreBlank
        && tiersAreBlank
        && !rule.remark?.trim();
}

function hasBankCard(rule: FeeRuleInput) {
    return rule.paymentTypes.includes('BANK_CARD');
}

function handlePaymentTypeChange(rule: FeeRuleInput) {
    if (!hasBankCard(rule) || !rule.paymentMethods.length) {
        rule.paymentMethods = ['ALL'];
    }
}

function handlePaymentMethodChange(rule: FeeRuleInput) {
    if (rule.paymentMethods.length <= 1 || !rule.paymentMethods.includes('ALL')) {
        return;
    }
    rule.paymentMethods = rule.paymentMethods.at(-1) === 'ALL'
        ? ['ALL']
        : rule.paymentMethods.filter((item) => item !== 'ALL');
}

function addTier(rule: FeeRuleInput) {
    const previous = rule.tiers.at(-1);
    if (previous && !hasDecimalValue(previous.upperBound)) {
        ElMessage.warning(t('feeAccount.tierUpperBeforeAdd'));
        return;
    }
    if (previous && (compareDecimal(previous.upperBound!, previous.lowerBound) ?? -1) <= 0) {
        const ruleIndex = model.value.rules.indexOf(rule) + 1;
        ElMessage.warning(t('feeAccount.validation.tierInvalidRange', {
            ruleIndex,
            tierIndex: rule.tiers.length,
        }));
        return;
    }
    rule.tiers.push({
        lowerBound: previous?.upperBound ?? '0',
        upperBound: null,
        percentageRate: rule.percentageRate || '',
        fixedAmountUsd: rule.fixedAmountUsd || '',
        minimumAmountUsd: rule.minimumAmountUsd,
        maximumAmountUsd: rule.maximumAmountUsd,
        sortNo: rule.tiers.length,
    });
}

function synchronizeNextTierLowerBound(rule: FeeRuleInput, tierIndex: number) {
    const nextTier = rule.tiers[tierIndex + 1];
    if (!nextTier) return;
    const upperBound = rule.tiers[tierIndex].upperBound;
    nextTier.lowerBound = hasDecimalValue(upperBound) ? upperBound : '';
}

function removeTier(rule: FeeRuleInput, tierIndex: number) {
    rule.tiers.splice(tierIndex, 1);
    if (!rule.tiers.length) return;
    rule.tiers[0].lowerBound = '0';
    for (let index = 1; index < rule.tiers.length; index += 1) {
        rule.tiers[index].lowerBound = rule.tiers[index - 1].upperBound ?? '';
    }
    rule.tiers[rule.tiers.length - 1].upperBound = null;
    rule.tiers.forEach((tier, index) => { tier.sortNo = index; });
}

function hasDecimalValue(value?: string | number | null): value is string | number {
    return value !== null && value !== undefined && String(value).trim() !== '';
}

function normalizeFrequencyDay() {
    if (model.value.settlementFrequency === 'DAILY') {
        model.value.frequencyDay = null;
        return;
    }
    const maximum = model.value.settlementFrequency === 'MONTHLY' ? 28 : 7;
    if (!model.value.frequencyDay || model.value.frequencyDay > maximum) {
        model.value.frequencyDay = 1;
    }
}

function synchronizeSettlementUnit() {
    model.value.regularDelayUnit = model.value.initialDelayUnit;
}
</script>

<style scoped>
.fee-version-editor { display: grid; gap: 18px; }
.fee-config-tabs :deep(.el-tabs__header) { margin: 0 0 16px; }
.fee-config-tabs :deep(.el-tabs__item) { min-width: 116px; padding: 0 16px; text-align: center; }
.fee-tab-label { display: inline-flex; align-items: center; gap: 7px; }
.fee-tab-label__count { display: inline-grid; place-items: center; min-width: 20px; height: 18px; padding: 0 5px; border: 1px solid #dbe4f0; border-radius: 8px; color: #64748b; background: #f8fafc; font-size: 11px; line-height: 1; }
.fee-editor-section { min-height: 250px; }
.fee-mode-toolbar, .fee-editor-section__head, .fee-rule-block__head, .fee-tier-table__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.fee-mode-toolbar { min-height: 48px; margin-bottom: 14px; padding: 8px 12px; border: 1px solid #dbe3ef; border-radius: 6px; background: #f8fafc; }
.fee-mode-toolbar__control { display: flex; align-items: center; gap: 12px; min-width: 0; }
.fee-mode-toolbar__label { flex: 0 0 auto; color: #475569; font-size: 12px; font-weight: 600; }
.fee-mode-toolbar__control :deep(.el-segmented) { width: 360px; max-width: 100%; }
.fee-mode-toolbar__control :deep(.el-segmented__group) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
.fee-mode-toolbar__control :deep(.el-segmented__item) { min-width: 0; justify-content: center; }
.risk-mode-intro { display: grid; gap: 3px; min-width: 0; }
.risk-mode-intro strong { color: #334155; font-size: 13px; }
.risk-mode-intro span { color: #64748b; font-size: 12px; }
.fee-editor-section__head { margin-bottom: 14px; color: #667085; font-size: 12px; }
.fee-rule-block { margin-top: 12px; padding: 16px; border: 1px solid #dfe6ee; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025); }
.fee-rule-block__head { margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #edf1f6; }
.fee-rule-block__identity { display: flex; align-items: center; gap: 9px; min-width: 0; }
.fee-rule-block__name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fee-rule-block__head strong { color: #27344a; font-size: 13px; }
.fee-payment-field-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.fee-cycle-input { display: grid; grid-template-columns: minmax(88px, 1fr) minmax(92px, 1fr); gap: 8px; width: 100%; }
.fee-tier-table { margin-top: 2px; padding-top: 12px; border-top: 1px dashed #d9e1ea; }
.fee-tier-table__head { margin-bottom: 10px; color: #667085; font-size: 12px; }
.reserve-settings { display: grid; align-content: start; gap: 20px; }
.settlement-fx-section { margin-top: 8px; padding-top: 18px; border-top: 1px solid #e5eaf1; }
.settlement-fx-section__title { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.settlement-fx-section__title > div { display: grid; gap: 4px; }
.settlement-fx-section__title strong { color: #27344a; font-size: 14px; }
.settlement-fx-section__title span { color: #64748b; font-size: 12px; }
.settlement-fx-empty { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; padding: 12px 14px; border: 1px dashed #cfd8e5; border-radius: 6px; color: #64748b; background: #fafcff; font-size: 12px; }
.settlement-fx-rule .fee-rule-block__identity { display: grid; gap: 3px; }
.settlement-fx-rule .fee-rule-block__identity span { color: #64748b; font-size: 12px; font-weight: 400; }
.fee-change-section { padding: 16px 16px 2px; border: 1px solid #dbe3ef; border-radius: 6px; background: #f8fafc; }
:deep(.el-form-item) { margin-bottom: 14px; }
:deep(.el-select), :deep(.el-input-number), :deep(.el-segmented) { width: 100%; }
@media (max-width: 720px) { .fee-mode-toolbar { align-items: stretch; flex-direction: column; } .fee-mode-toolbar__control { align-items: stretch; flex-direction: column; gap: 7px; } .fee-payment-field-pair { grid-template-columns: 1fr; gap: 0; } .fee-rule-block { padding: 12px 10px; } .fee-config-tabs :deep(.el-tabs__item) { min-width: 0; padding: 0 10px; } }
</style>

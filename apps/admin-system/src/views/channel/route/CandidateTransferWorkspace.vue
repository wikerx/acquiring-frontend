<template>
    <section class="candidate-configurator">
        <el-empty v-if="paymentScopeKeys.length === 0" :description="t('channel.route.paymentMethodGroupsEmpty')" :image-size="84" />
        <template v-else>
            <div class="method-tabs" role="tablist" :aria-label="t('channel.route.paymentMethodGroups')">
                <button
                    v-for="method in paymentScopeKeys"
                    :key="method"
                    type="button"
                    class="method-tab"
                    :class="{ 'method-tab--active': method === activeMethod }"
                    :aria-selected="method === activeMethod"
                    @click="activeMethod = method"
                >
                    <PaymentLogoGroup :keys="methodLogoKeys(method)" size="sm" :wrap="false" fallback="text" />
                    <span>{{ methodLabel(method) }}</span>
                    <small>{{ candidateCount(method) }}</small>
                </button>
            </div>

            <div class="method-context">
                <div><span>{{ t('channel.route.configuringMethod') }}</span><strong>{{ methodLabel(activeMethod) }}</strong></div>
                <span>{{ modeHint }}</span>
            </div>

            <section v-if="routeType === 'FIXED'" class="fixed-target">
                <div class="fixed-target__selectors">
                    <el-form-item :label="t('channel.common.channel')" required>
                        <el-select v-model="fixedChannelId" filterable :placeholder="t('channel.route.selectChannelFirst')" @change="handleFixedChannelChange">
                            <el-option v-for="item in enabledChannels" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('channel.route.mid')" required>
                        <el-select
                            v-model="fixedMidId"
                            filterable
                            :disabled="!fixedChannelId"
                            :loading="fixedLoading"
                            :placeholder="fixedChannelId ? t('channel.route.selectMid') : t('channel.route.selectChannelFirst')"
                        >
                            <el-option v-for="item in fixedMidOptions" :key="item.id" :label="midOptionLabel(item)" :value="item.id">
                                <div class="mid-option">
                                    <span><strong>{{ item.midName || item.channelMid }}</strong><small>{{ item.channelMid }}</small></span>
                                    <CurrencyDisplay :currency="item.defaultTransactionCurrency" :locale="String(locale)" size="xs" variant="soft" />
                                </div>
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-button type="primary" :disabled="!fixedMidId" @click="saveFixedTarget">{{ t('channel.route.confirmTarget') }}</el-button>
                </div>
                <div v-if="activeCandidates[0]" class="fixed-target__current">
                    <span>{{ t('channel.route.currentTarget') }}</span>
                    <strong>{{ candidateChannelText(activeCandidates[0]) }}</strong>
                    <span>{{ candidateMidText(activeCandidates[0]) }}</span>
                    <el-button type="danger" link :icon="Delete" @click="removeOne(activeCandidates[0])">{{ t('channel.common.delete') }}</el-button>
                </div>
                <el-empty v-else :description="t('channel.route.fixedTargetEmpty')" :image-size="72" />
            </section>

            <template v-else>
                <div class="transfer-toolbar">
                    <div class="transfer-toolbar__channel">
                        <span>{{ t('channel.common.channel') }}</span>
                        <el-select v-model="availableQuery.channelId" filterable :placeholder="t('channel.route.selectChannelFirst')" @change="handleAvailableChannelChange">
                            <el-option v-for="item in enabledChannels" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                        </el-select>
                    </div>
                    <span class="transfer-toolbar__hint">{{ t('channel.route.channelGateHint') }}</span>
                </div>

                <div class="transfer-layout">
                    <section class="transfer-panel" aria-labelledby="available-mid-title">
                        <header class="transfer-panel__header">
                            <div>
                                <strong id="available-mid-title">{{ t('channel.route.availableMids') }}</strong>
                                <span>{{ t('channel.route.availableMidsHint') }}</span>
                            </div>
                            <el-tag size="small" effect="plain">{{ availableTotal }}</el-tag>
                        </header>
                        <div class="transfer-panel__filters">
                            <el-input
                                v-model.trim="availableQuery.keyword"
                                clearable
                                :disabled="!availableQuery.channelId"
                                :prefix-icon="Search"
                                :placeholder="t('channel.route.midKeywordPlaceholder')"
                                @keyup.enter="searchAvailable"
                                @clear="searchAvailable"
                            />
                            <el-button :icon="Refresh" :disabled="!availableQuery.channelId" :title="t('common.refresh')" circle @click="loadAvailable" />
                        </div>
                        <el-table
                            ref="availableTableRef"
                            v-loading="availableLoading"
                            :data="availableRows"
                            row-key="id"
                            height="280"
                            size="small"
                            :empty-text="availableQuery.channelId ? '-' : t('channel.route.selectChannelEmpty')"
                            @selection-change="availableSelection = $event"
                        >
                            <el-table-column type="selection" width="40" align="center" :selectable="canSelectAvailable" />
                            <el-table-column :label="t('channel.route.mid')" min-width="180" align="left" show-overflow-tooltip>
                                <template #default="{ row }"><div class="mid-identity"><strong>{{ row.midName || row.channelMid }}</strong><span>{{ row.channelMid }}</span></div></template>
                            </el-table-column>
                            <el-table-column :label="t('channel.route.defaultTransactionCurrency')" width="108" align="center">
                                <template #default="{ row }"><CurrencyDisplay :currency="row.defaultTransactionCurrency" :locale="String(locale)" size="xs" variant="soft" /></template>
                            </el-table-column>
                        </el-table>
                        <div class="transfer-panel__pagination">
                            <span>{{ t('channel.route.selectedCount', { count: availableSelection.length }) }}</span>
                            <el-pagination
                                v-model:current-page="availablePage"
                                v-model:page-size="availablePageSize"
                                :total="availableTotal"
                                :page-sizes="[10, 20, 50]"
                                layout="total, prev, pager, next"
                                size="small"
                                background
                                @size-change="loadAvailable"
                                @current-change="loadAvailable"
                            />
                        </div>
                    </section>

                    <div class="transfer-actions" :aria-label="t('channel.route.transferActions')">
                        <el-button type="primary" :icon="ArrowRight" :disabled="availableSelection.length === 0" @click="addSelected">{{ t('channel.route.addSelected') }}</el-button>
                        <el-button :icon="ArrowLeft" :disabled="selectedSelection.length === 0" @click="removeSelected">{{ t('channel.route.removeSelected') }}</el-button>
                    </div>

                    <section class="transfer-panel" aria-labelledby="selected-mid-title">
                        <header class="transfer-panel__header">
                            <div>
                                <strong id="selected-mid-title">{{ t('channel.route.selectedMids') }}</strong>
                                <span>{{ selectedHint }}</span>
                            </div>
                            <div class="transfer-panel__header-actions">
                                <span v-if="routeType === 'WEIGHT'" class="weight-total" :class="{ 'weight-total--valid': weightTotal === '100.00' }">{{ t('channel.route.weightTotal') }} {{ weightTotal }}%</span>
                                <el-tag size="small" effect="plain">{{ activeCandidates.length }}</el-tag>
                                <el-button v-if="routeType === 'WEIGHT' && activeCandidates.length" type="primary" link @click="equalizeWeights">{{ t('channel.route.equalWeight') }}</el-button>
                            </div>
                        </header>
                        <div class="transfer-panel__filters transfer-panel__filters--selected">
                            <el-input v-model.trim="selectedKeyword" clearable :prefix-icon="Search" :placeholder="t('channel.route.selectedMidKeywordPlaceholder')" />
                            <el-button type="danger" plain :icon="Delete" :disabled="selectedSelection.length === 0" @click="removeSelected">{{ t('channel.route.batchRemove') }}</el-button>
                        </div>
                        <el-table :data="selectedPageRows" row-key="midConfigId" height="280" size="small" :empty-text="t('channel.route.noSelectedMids')" @selection-change="selectedSelection = $event">
                            <el-table-column type="selection" width="40" align="center" />
                            <el-table-column :label="t('channel.route.selectedMid')" min-width="190" align="left" show-overflow-tooltip>
                                <template #default="{ row }"><div class="mid-identity"><strong>{{ row.midName || row.channelMid || row.midConfigId }}</strong><span>{{ candidateChannelText(row) }} · {{ row.channelMid || row.midConfigId }}</span></div></template>
                            </el-table-column>
                            <el-table-column v-if="routeType === 'PRIORITY'" :label="t('channel.route.candidatePriority')" width="104" align="center">
                                <template #default="{ row, $index }">
                                    <div class="order-actions">
                                        <span>{{ absoluteIndex($index) + 1 }}</span>
                                        <el-button :icon="ArrowUp" text circle :title="t('table.moveUp')" :aria-label="t('table.moveUp')" :disabled="absoluteIndex($index) === 0" @click="moveCandidate(row, -1)" />
                                        <el-button :icon="ArrowDown" text circle :title="t('table.moveDown')" :aria-label="t('table.moveDown')" :disabled="absoluteIndex($index) === activeCandidates.length - 1" @click="moveCandidate(row, 1)" />
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column v-else :label="t('channel.route.candidateWeight')" width="112" align="center">
                                <template #default="{ row }">
                                    <el-input
                                        class="weight-input"
                                        :model-value="row.candidateWeight"
                                        :aria-label="t('channel.route.candidateWeightForMid', { mid: row.midName || row.channelMid || row.midConfigId })"
                                        inputmode="decimal"
                                        @input="stageWeight(row, String($event))"
                                        @change="updateWeight(row, String($event))"
                                        @blur="updateWeight(row, String(row.candidateWeight || ''))"
                                        @keyup.enter="updateWeight(row, String(row.candidateWeight || ''))"
                                    >
                                        <template #append>%</template>
                                    </el-input>
                                </template>
                            </el-table-column>
                            <el-table-column width="44" align="center">
                                <template #default="{ row }"><el-button type="danger" :icon="Delete" circle text :title="t('channel.common.delete')" @click="removeOne(row)" /></template>
                            </el-table-column>
                        </el-table>
                        <div class="transfer-panel__pagination">
                            <span>{{ t('channel.route.selectedCount', { count: selectedSelection.length }) }}</span>
                            <el-pagination v-model:current-page="selectedPage" v-model:page-size="selectedPageSize" :total="filteredSelectedRows.length" layout="total, prev, pager, next" size="small" background />
                        </div>
                    </section>
                </div>
            </template>
        </template>
    </section>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Delete, Refresh, Search } from '@element-plus/icons-vue';
import { CurrencyDisplay, PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { searchChannelMids, type ChannelMidConfig, type ChannelOption, type PaymentRouteCandidate, type PaymentRouteRuleType } from '@/api/channel';
import { channelOptionLabel, type SelectOption } from '../shared';

interface PaymentScopeOption extends SelectOption {
    paymentMethod: string;
    cardBrand: string;
    logoKeys: PaymentLogoKey[];
}

const props = defineProps<{
    modelValue: PaymentRouteCandidate[];
    paymentScopeKeys: string[];
    routeType: PaymentRouteRuleType;
    methodOptions: PaymentScopeOption[];
    channelOptions: ChannelOption[];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: PaymentRouteCandidate[]] }>();
const { locale, t } = useI18n();
const activeMethod = ref('');
const availableLoading = ref(false);
const availableRows = ref<ChannelMidConfig[]>([]);
const availableTotal = ref(0);
const availablePage = ref(1);
const availablePageSize = ref(10);
const availableSelection = ref<ChannelMidConfig[]>([]);
const availableTableRef = ref<{ clearSelection: () => void }>();
const availableQuery = reactive<{ keyword: string; channelId?: number }>({ keyword: '', channelId: undefined });
const selectedKeyword = ref('');
const selectedPage = ref(1);
const selectedPageSize = ref(10);
const selectedSelection = ref<PaymentRouteCandidate[]>([]);
const fixedChannelId = ref<number>();
const fixedMidId = ref<number>();
const fixedLoading = ref(false);
const fixedMidOptions = ref<ChannelMidConfig[]>([]);

const enabledChannels = computed(() => props.channelOptions.filter((item) => item.channelStatus === 1 && item.supportAcquiring === 1));
const activeCandidates = computed(() => props.modelValue.filter((item) => candidateScopeKey(item) === activeMethod.value).sort((left, right) => left.candidatePriority - right.candidatePriority));
const filteredSelectedRows = computed(() => {
    const keyword = selectedKeyword.value.trim().toLowerCase();
    if (!keyword) return activeCandidates.value;
    return activeCandidates.value.filter((item) => [item.channelCode, item.channelName, item.channelMid, item.midName, item.midConfigId].some((value) => String(value || '').toLowerCase().includes(keyword)));
});
const selectedPageRows = computed(() => {
    const start = (selectedPage.value - 1) * selectedPageSize.value;
    return filteredSelectedRows.value.slice(start, start + selectedPageSize.value);
});
const modeHint = computed(() => t(`channel.route.typeHints.${props.routeType}`));
const selectedHint = computed(() => props.routeType === 'WEIGHT' ? t('channel.route.weightSelectedHint') : t('channel.route.selectedMidsHint'));
const weightTotal = computed(() => formatBasisPoints(activeCandidates.value.reduce((total, candidate) => total + toBasisPoints(candidate.candidateWeight), 0)));

watch(() => props.paymentScopeKeys, (methods) => {
    if (!methods.includes(activeMethod.value)) activeMethod.value = methods[0] || '';
    const retained = props.modelValue.filter((candidate) => methods.includes(candidateScopeKey(candidate)));
    if (retained.length !== props.modelValue.length) emit('update:modelValue', retained);
}, { immediate: true, deep: true });

watch(activeMethod, () => {
    availableRows.value = [];
    availableTotal.value = 0;
    availableQuery.channelId = undefined;
    availableQuery.keyword = '';
    selectedPage.value = 1;
    selectedKeyword.value = '';
    selectedSelection.value = [];
    hydrateFixedTarget();
});
watch(() => props.routeType, () => {
    availableRows.value = [];
    availableTotal.value = 0;
    availableQuery.channelId = undefined;
    hydrateFixedTarget();
});
watch([selectedKeyword, selectedPageSize], () => { selectedPage.value = 1; });

function hydrateFixedTarget() {
    const target = activeCandidates.value[0];
    fixedChannelId.value = target?.channelId;
    fixedMidId.value = target?.midConfigId;
    fixedMidOptions.value = target ? [{
        id: target.midConfigId, channelId: target.channelId, channelCode: target.channelCode || '', channelName: target.channelName || '',
        channelMid: target.channelMid || '', midName: target.midName || '', businessType: 'ACQUIRING',
        paymentMethodScope: target.paymentMethodScope || activeScope()?.paymentMethod || '', transactionTypeScope: 'ALL', currencyScope: target.currencyScope || 'ALL',
        allowedCountryScope: 'ALL', defaultTransactionCurrency: target.defaultTransactionCurrency || '', defaultSettlementCurrency: '', settlementCycle: '', settlementTimeZone: '', midStatus: target.midStatus ?? 1,
    }] : [];
}

async function handleFixedChannelChange() {
    fixedMidId.value = undefined;
    fixedMidOptions.value = [];
    const scope = activeScope();
    if (!fixedChannelId.value || !scope) return;
    fixedLoading.value = true;
    try {
        const result = await searchChannelMids({ pageNo: 1, pageSize: 100, channelId: fixedChannelId.value, businessType: 'ACQUIRING', paymentMethod: scope.paymentMethod, cardBrand: scope.cardBrand, midStatus: 1 });
        fixedMidOptions.value = result.records;
    } finally { fixedLoading.value = false; }
}

function saveFixedTarget() {
    const mid = fixedMidOptions.value.find((item) => item.id === fixedMidId.value);
    if (!mid || !activeMethod.value) return;
    emit('update:modelValue', [...props.modelValue.filter((item) => candidateScopeKey(item) !== activeMethod.value), toCandidate(mid, 10)]);
}

async function loadAvailable() {
    const scope = activeScope();
    if (!scope || !availableQuery.channelId) {
        availableRows.value = [];
        availableTotal.value = 0;
        return;
    }
    availableLoading.value = true;
    try {
        const result = await searchChannelMids({ pageNo: availablePage.value, pageSize: availablePageSize.value, keyword: availableQuery.keyword || undefined, channelId: availableQuery.channelId, businessType: 'ACQUIRING', paymentMethod: scope.paymentMethod, cardBrand: scope.cardBrand, midStatus: 1 });
        availableRows.value = result.records;
        availableTotal.value = result.total;
        await nextTick();
        availableTableRef.value?.clearSelection();
    } finally { availableLoading.value = false; }
}

function handleAvailableChannelChange() { availablePage.value = 1; void loadAvailable(); }
function searchAvailable() { availablePage.value = 1; void loadAvailable(); }
function canSelectAvailable(row: ChannelMidConfig) { return !activeCandidates.value.some((item) => item.midConfigId === row.id); }

function addSelected() {
    if (!activeMethod.value || availableSelection.value.length === 0) return;
    let nextPriority = activeCandidates.value.reduce((max, item) => Math.max(max, item.candidatePriority), 0);
    const additions = availableSelection.value.filter(canSelectAvailable).map((mid) => {
        nextPriority += 10;
        return toCandidate(mid, nextPriority, props.routeType === 'WEIGHT' ? '0.00' : undefined);
    });
    const next = [...props.modelValue, ...additions];
    emit('update:modelValue', props.routeType === 'WEIGHT' ? equalizedCandidates(next, activeMethod.value) : next);
    availableSelection.value = [];
    availableTableRef.value?.clearSelection();
}

function toCandidate(mid: ChannelMidConfig, priority: number, weight?: string): PaymentRouteCandidate {
    const scope = activeScope();
    if (!scope) throw new Error('Payment scope is required');
    return {
        paymentMethod: scope.paymentMethod, cardBrand: scope.cardBrand, channelId: mid.channelId, channelCode: mid.channelCode, channelName: mid.channelName,
        midConfigId: mid.id, channelMid: mid.channelMid, midName: mid.midName, paymentMethodScope: mid.paymentMethodScope,
        currencyScope: mid.currencyScope, defaultTransactionCurrency: mid.defaultTransactionCurrency, midStatus: mid.midStatus, candidatePriority: priority, candidateWeight: weight, candidateStatus: 1,
    };
}

function removeSelected() {
    const ids = new Set(selectedSelection.value.map((item) => item.midConfigId));
    const next = props.modelValue.filter((item) => candidateScopeKey(item) !== activeMethod.value || !ids.has(item.midConfigId));
    emit('update:modelValue', props.routeType === 'WEIGHT' ? equalizedCandidates(next, activeMethod.value) : normalizePriorities(next, activeMethod.value));
    selectedSelection.value = [];
}
function removeOne(row: PaymentRouteCandidate) {
    const scopeKey = candidateScopeKey(row);
    const next = props.modelValue.filter((item) => candidateScopeKey(item) !== scopeKey || item.midConfigId !== row.midConfigId);
    emit('update:modelValue', props.routeType === 'WEIGHT' ? equalizedCandidates(next, scopeKey) : normalizePriorities(next, scopeKey));
}
function moveCandidate(row: PaymentRouteCandidate, offset: number) {
    const grouped = [...activeCandidates.value];
    const index = grouped.findIndex((item) => item.midConfigId === row.midConfigId);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= grouped.length) return;
    [grouped[index], grouped[target]] = [grouped[target], grouped[index]];
    const priorityByMid = new Map(grouped.map((item, position) => [item.midConfigId, (position + 1) * 10]));
    emit('update:modelValue', props.modelValue.map((item) => candidateScopeKey(item) === activeMethod.value ? { ...item, candidatePriority: priorityByMid.get(item.midConfigId) || item.candidatePriority } : item));
}
function stageWeight(row: PaymentRouteCandidate, value: string) {
    if (!/^\d{0,3}(?:\.\d{0,2})?$/.test(value)) return;
    const scopeKey = candidateScopeKey(row);
    emit('update:modelValue', props.modelValue.map((item) => candidateScopeKey(item) === scopeKey && item.midConfigId === row.midConfigId
        ? { ...item, candidateWeight: value }
        : item));
}
function updateWeight(row: PaymentRouteCandidate, value: string) {
    const scopeKey = candidateScopeKey(row);
    const grouped = props.modelValue
        .filter((item) => candidateScopeKey(item) === scopeKey)
        .sort((left, right) => left.candidatePriority - right.candidatePriority || left.midConfigId - right.midConfigId);
    if (grouped.length === 0) return;
    if (grouped.length === 1) {
        emit('update:modelValue', props.modelValue.map((item) => candidateScopeKey(item) === scopeKey ? { ...item, candidateWeight: '100.00' } : item));
        return;
    }

    const others = grouped.filter((item) => item.midConfigId !== row.midConfigId);
    const requestedBasisPoints = /^\d{1,3}(?:\.\d{0,2})?$/.test(value) ? toBasisPoints(value) : 0;
    const requested = Math.min(10000 - others.length, Math.max(1, requestedBasisPoints));
    const remaining = 10000 - requested;
    const distributable = remaining - others.length;
    const oldWeights = others.map((item) => toBasisPoints(item.candidateWeight));
    const hasExistingRatio = oldWeights.some((weight) => weight > 0);
    const normalizedOldWeights = oldWeights.map((weight) => hasExistingRatio ? Math.max(1, weight) : 1);
    const oldTotal = normalizedOldWeights.reduce((total, weight) => total + weight, 0);
    const allocations = others.map((item, index) => {
        const oldWeight = normalizedOldWeights[index] ?? 1;
        const numerator = distributable * oldWeight;
        return {
            item,
            basisPoints: 1 + (oldTotal > 0 ? Math.floor(numerator / oldTotal) : 0),
            remainder: oldTotal > 0 ? numerator % oldTotal : 0,
        };
    });
    let unallocated = remaining - allocations.reduce((total, allocation) => total + allocation.basisPoints, 0);
    allocations
        .sort((left, right) => right.remainder - left.remainder
            || left.item.candidatePriority - right.item.candidatePriority
            || left.item.midConfigId - right.item.midConfigId)
        .forEach((allocation) => {
            if (unallocated > 0) {
                allocation.basisPoints += 1;
                unallocated -= 1;
            }
        });
    const weights = new Map<number, number>([[row.midConfigId, requested]]);
    allocations.forEach((allocation) => weights.set(allocation.item.midConfigId, allocation.basisPoints));
    emit('update:modelValue', props.modelValue.map((item) => candidateScopeKey(item) === scopeKey
        ? { ...item, candidateWeight: formatBasisPoints(weights.get(item.midConfigId) || 0) }
        : item));
}
function equalizeWeights() { emit('update:modelValue', equalizedCandidates(props.modelValue, activeMethod.value)); }
function equalizedCandidates(candidates: PaymentRouteCandidate[], method: string) {
    const grouped = candidates.filter((item) => candidateScopeKey(item) === method).sort((left, right) => left.candidatePriority - right.candidatePriority);
    if (grouped.length === 0) return candidates;
    const base = Math.floor(10000 / grouped.length);
    let remainder = 10000 - base * grouped.length;
    const weights = new Map(grouped.map((item) => [item.midConfigId, base + (remainder-- > 0 ? 1 : 0)]));
    return candidates.map((item) => candidateScopeKey(item) === method ? { ...item, candidateWeight: formatBasisPoints(weights.get(item.midConfigId) || 0) } : item);
}
function normalizePriorities(candidates: PaymentRouteCandidate[], method: string) {
    const priorities = new Map(candidates.filter((item) => candidateScopeKey(item) === method).sort((left, right) => left.candidatePriority - right.candidatePriority).map((item, index) => [item.midConfigId, (index + 1) * 10]));
    return candidates.map((item) => candidateScopeKey(item) === method ? { ...item, candidatePriority: priorities.get(item.midConfigId) || 10 } : item);
}
function toBasisPoints(value?: string) {
    if (!value || !/^\d+(?:\.\d{0,2})?$/.test(value)) return 0;
    const [integer, fraction = ''] = value.split('.');
    return Number(integer) * 100 + Number(fraction.padEnd(2, '0'));
}
function formatBasisPoints(value: number) { return `${Math.floor(value / 100)}.${String(Math.abs(value % 100)).padStart(2, '0')}`; }
function absoluteIndex(pageIndex: number) { return (selectedPage.value - 1) * selectedPageSize.value + pageIndex; }
function candidateCount(method: string) { return props.modelValue.filter((item) => candidateScopeKey(item) === method).length; }
function methodLabel(method: string) { return props.methodOptions.find((item) => item.value === method)?.label || method; }
function methodLogoKeys(method: string) { return props.methodOptions.find((item) => item.value === method)?.logoKeys || []; }
function activeScope() { return props.methodOptions.find((item) => item.value === activeMethod.value); }
function candidateScopeKey(candidate: Pick<PaymentRouteCandidate, 'paymentMethod' | 'cardBrand'>) {
    return candidate.paymentMethod === 'BANK_CARD' ? `CARD:${candidate.cardBrand}` : `PAYMENT:${candidate.paymentMethod}`;
}
function candidateChannelText(row: PaymentRouteCandidate) { return [row.channelCode, row.channelName].filter(Boolean).join(' / ') || String(row.channelId); }
function candidateMidText(row: PaymentRouteCandidate) { return [row.midName, row.channelMid].filter(Boolean).join(' / ') || String(row.midConfigId); }
function midOptionLabel(row: ChannelMidConfig) { return `${row.midName || row.channelMid} · ${row.channelMid}`; }
</script>

<style scoped>
.candidate-configurator { min-width: 0; container-type: inline-size; }
.method-tabs { display: flex; overflow-x: auto; border-bottom: 1px solid var(--el-border-color); gap: 4px; }
.method-tab { display: inline-flex; min-width: max-content; height: 42px; align-items: center; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--el-text-color-regular); cursor: pointer; gap: 8px; padding: 0 14px; }
.method-tab:hover, .method-tab--active { color: var(--el-color-primary); }
.method-tab--active { border-bottom-color: var(--el-color-primary); font-weight: 600; }
.method-tab small { min-width: 20px; padding: 1px 6px; border-radius: 9px; background: var(--el-fill-color); color: var(--el-text-color-secondary); font-size: 11px; text-align: center; }
.method-context { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 2px; }
.method-context div { display: flex; align-items: baseline; gap: 8px; color: var(--el-text-color-secondary); font-size: 12px; }
.method-context strong { color: var(--el-text-color-primary); font-size: 14px; }
.method-context > span { color: var(--el-text-color-secondary); font-size: 12px; text-align: right; }
.fixed-target { min-height: 220px; padding: 20px; border: 1px solid var(--el-border-color); border-radius: 6px; background: var(--el-bg-color); }
.fixed-target__selectors { display: grid; grid-template-columns: minmax(220px, .8fr) minmax(280px, 1.2fr) auto; align-items: end; gap: 16px; }
.fixed-target__selectors :deep(.el-form-item) { margin-bottom: 0; }
.fixed-target__selectors :deep(.el-select) { width: 100%; }
.fixed-target__current { display: grid; grid-template-columns: auto 1fr 1fr auto; align-items: center; gap: 16px; margin-top: 22px; padding: 14px 16px; border: 1px solid var(--el-color-success-light-5); border-radius: 6px; background: var(--el-color-success-light-9); }
.fixed-target__current span { color: var(--el-text-color-secondary); font-size: 12px; }
.mid-option { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.mid-option > span { display: flex; min-width: 0; flex-direction: column; }
.mid-option small { color: var(--el-text-color-secondary); }
.transfer-toolbar { display: flex; min-height: 58px; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 12px; padding: 10px 14px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-fill-color-light); }
.transfer-toolbar__channel { display: grid; width: min(100%, 480px); grid-template-columns: auto minmax(260px, 1fr); align-items: center; gap: 12px; color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; }
.transfer-toolbar__channel .el-select { width: 100%; }
.transfer-toolbar__hint { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; text-align: right; }
.transfer-layout { display: grid; grid-template-columns: minmax(0, 1fr) max-content minmax(0, 1fr); align-items: stretch; gap: 14px; }
.transfer-panel { display: grid; min-width: 0; overflow: hidden; grid-template-rows: 64px 50px 280px 50px; border: 1px solid var(--el-border-color); border-radius: 8px; background: var(--el-bg-color); box-shadow: 0 1px 2px rgb(15 23 42 / 4%); }
.transfer-panel__header { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border-bottom: 1px solid var(--el-border-color-lighter); }
.transfer-panel__header > div:first-child { display: grid; min-width: 0; gap: 3px; }
.transfer-panel__header strong { color: var(--el-text-color-primary); font-size: 14px; }
.transfer-panel__header span { overflow: hidden; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
.transfer-panel__header-actions { display: flex; min-width: fit-content; align-items: center; gap: 8px; }
.transfer-panel__header-actions .el-button { margin: 0; }
.transfer-panel__filters { display: grid; grid-template-columns: minmax(160px, 1fr) 32px; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--el-border-color-lighter); background: var(--el-fill-color-extra-light); }
.transfer-panel__filters--selected { grid-template-columns: minmax(160px, 1fr) auto; }
.transfer-panel__pagination { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; border-top: 1px solid var(--el-border-color-lighter); color: var(--el-text-color-secondary); font-size: 12px; }
.transfer-panel__pagination :deep(.el-pagination) { min-width: 0; justify-content: flex-end; }
.transfer-actions { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
.transfer-actions .el-button { width: auto; min-width: 132px; margin: 0; white-space: nowrap; }
.transfer-actions .el-button + .el-button { margin-left: 0; }
.mid-identity { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.mid-identity strong, .mid-identity span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mid-identity strong { color: var(--el-text-color-primary); font-size: 12px; font-weight: 600; }
.mid-identity span { color: var(--el-text-color-secondary); font-size: 11px; }
.order-actions { display: grid; grid-template-columns: 22px 26px 26px; align-items: center; justify-content: center; }
.order-actions .el-button { width: 26px; height: 26px; }
.weight-total { color: var(--el-color-danger); font-size: 12px; font-weight: 600; }
.weight-total--valid { color: var(--el-color-success); }
:deep(.transfer-panel .el-table__header-wrapper th.el-table__cell) { height: 40px; background: var(--el-fill-color-light); }
:deep(.transfer-panel .el-table__body-wrapper td.el-table__cell) { height: 52px; }
:deep(.transfer-panel .el-table__empty-block) { min-height: 236px; }
:deep(.weight-input .el-input__inner) { text-align: right; }
:deep(.transfer-panel .el-input-group__append) { padding: 0 8px; }
@container (max-width: 1180px) {
    .transfer-layout { grid-template-columns: 1fr; }
    .transfer-actions { flex-direction: row; padding: 2px 0; }
    .transfer-actions :deep(.el-icon) { transform: rotate(90deg); }
    .transfer-toolbar { align-items: stretch; flex-direction: column; gap: 8px; }
    .transfer-toolbar__channel { width: 100%; }
    .transfer-toolbar__hint { text-align: left; }
    .fixed-target__selectors, .fixed-target__current { grid-template-columns: 1fr; }
}
@container (max-width: 640px) {
    .transfer-toolbar__channel { grid-template-columns: 1fr; }
    .transfer-panel__header { align-items: flex-start; flex-direction: column; }
    .transfer-panel__header-actions { width: 100%; justify-content: space-between; }
    .transfer-panel__pagination { align-items: flex-start; flex-direction: column; }
    .transfer-panel__pagination :deep(.el-pagination) { justify-content: flex-start; }
}
</style>

<template>
    <div class="page system-page merchant-redesigned-page access-overview-page">
        <section v-if="loading" class="access-overview-state" aria-busy="true">
            <el-skeleton :rows="10" animated />
        </section>

        <section v-else-if="loadFailed || !overview" class="access-overview-state">
            <el-result icon="error" :title="t('accessConfig.overviewLoadFailed')">
                <template #extra>
                    <el-button type="primary" :icon="Refresh" @click="loadOverview">
                        {{ t('accessConfig.retryLoad') }}
                    </el-button>
                </template>
            </el-result>
        </section>

        <template v-else>
            <section class="integration-status-band" :class="`is-${statusTone(overview.overallStatus)}`">
                <div class="integration-status-band__icon" aria-hidden="true">
                    <component :is="overallIcon" />
                </div>
                <div class="integration-status-band__body">
                    <span class="integration-status-band__eyebrow">{{ t('accessConfig.overviewEyebrow') }}</span>
                    <div class="integration-status-band__title-row">
                        <h2>{{ overallTitle }}</h2>
                        <el-tag :type="statusTagType(overview.overallStatus)" effect="light">
                            {{ statusLabel(overview.overallStatus) }}
                        </el-tag>
                    </div>
                    <p>{{ overallDescription }}</p>
                </div>
                <div class="integration-status-band__progress">
                    <div>
                        <span>{{ t('accessConfig.completion') }}</span>
                        <strong>{{ overview.completedRequiredChecks }}/{{ overview.requiredCheckCount }}</strong>
                    </div>
                    <el-progress
                        :percentage="completionPercentage"
                        :show-text="false"
                        :stroke-width="8"
                        :status="progressStatus"
                    />
                </div>
                <el-button :icon="Refresh" :loading="loading" @click="loadOverview">
                    {{ t('accessConfig.refresh') }}
                </el-button>
            </section>

            <section class="integration-process" aria-labelledby="integration-process-title">
                <header class="section-heading">
                    <div>
                        <h3 id="integration-process-title">{{ t('accessConfig.processTitle') }}</h3>
                        <p>{{ t('accessConfig.processDesc') }}</p>
                    </div>
                </header>
                <div class="integration-process__scroll">
                    <ol class="integration-process__steps">
                        <li v-for="(item, index) in stageItems" :key="item.key">
                            <span class="integration-process__index" :class="`is-${statusTone(item.status)}`">
                                <component :is="item.icon" aria-hidden="true" />
                            </span>
                            <div>
                                <small>{{ t('accessConfig.stageNumber', { number: index + 1 }) }}</small>
                                <strong>{{ item.title }}</strong>
                                <span :class="`is-${statusTone(item.status)}`">{{ statusLabel(item.status) }}</span>
                            </div>
                        </li>
                    </ol>
                </div>
            </section>

            <section class="integration-environment" aria-labelledby="integration-environment-title">
                <h3 id="integration-environment-title">{{ t('accessConfig.environment') }}</h3>
                <dl>
                    <div>
                        <dt>{{ t('accessConfig.openApiBaseUrl') }}</dt>
                        <dd class="integration-environment__url">{{ overview.openApiBaseUrl || '-' }}</dd>
                    </div>
                    <div>
                        <dt>{{ t('accessConfig.sdkVersion') }}</dt>
                        <dd>{{ overview.sdkVersion || '-' }}</dd>
                    </div>
                    <div>
                        <dt>{{ t('accessConfig.cryptoMode') }}</dt>
                        <dd>{{ overview.cryptoMode || '-' }}</dd>
                    </div>
                </dl>
            </section>

            <section class="integration-checks" aria-labelledby="integration-checks-title">
                <header class="section-heading">
                    <div>
                        <h3 id="integration-checks-title">{{ t('accessConfig.checkListTitle') }}</h3>
                        <p>{{ t('accessConfig.checkListDesc') }}</p>
                    </div>
                </header>

                <div class="integration-check-list">
                    <article v-for="item in stageItems" :key="item.key" class="integration-check-row">
                        <div class="integration-check-row__icon" :class="`is-${statusTone(item.status)}`" aria-hidden="true">
                            <component :is="item.icon" />
                        </div>
                        <div class="integration-check-row__content">
                            <div class="integration-check-row__title">
                                <h4>{{ item.title }}</h4>
                                <el-tag :type="statusTagType(item.status)" effect="light" size="small">
                                    {{ statusLabel(item.status) }}
                                </el-tag>
                            </div>
                            <p>{{ item.description }}</p>

                            <div v-if="item.key === 'merchantProfile'" class="integration-facts">
                                <span>{{ t('accessConfig.onboardingStatus') }} <b>{{ businessStatusLabel(overview.merchantProfile.onboardingStatus) }}</b></span>
                                <span>{{ t('accessConfig.reviewStatus') }} <b>{{ businessStatusLabel(overview.merchantProfile.reviewStatus) }}</b></span>
                                <span>{{ t('accessConfig.activationStatus') }} <b>{{ businessStatusLabel(overview.merchantProfile.activationStatus) }}</b></span>
                            </div>

                            <div v-else-if="item.key === 'settlement'" class="integration-facts">
                                <span class="integration-fact--currency">
                                    {{ t('accessConfig.settlementCurrency') }}
                                    <CurrencyDisplay :currency="overview.settlement.settlementCurrency" :locale="locale" size="xs" />
                                </span>
                                <span>{{ t('accessConfig.settlementCycle') }} <b>{{ settlementCycleLabel }}</b></span>
                                <span>{{ t('accessConfig.dailyCutoff') }} <b>{{ overview.settlement.dailyCutoffTime || '-' }}</b></span>
                                <span>{{ t('accessConfig.businessTimeZone') }} <b>{{ overview.settlement.businessTimeZone || '-' }}</b></span>
                                <span>{{ t('accessConfig.processingMode') }} <b>{{ processingModeLabel(overview.settlement.processingMode) }}</b></span>
                            </div>

                            <div v-else-if="item.key === 'paymentCapability'" class="payment-capability-summary">
                                <el-alert v-if="overview.paymentCapability.assessmentStatus !== 'EVALUATED'" :title="t(overview.paymentCapability.assessmentStatus === 'HISTORY_PENDING' ? 'paymentMethod.overview.historyPending' : 'paymentMethod.overview.unassessed')" :type="overview.paymentCapability.assessmentStatus === 'HISTORY_PENDING' ? 'warning' : 'info'" :closable="false" show-icon />
                                <div v-if="capabilityMetrics.length" class="integration-facts payment-authorization-metrics">
                                    <span v-for="metric in capabilityMetrics" :key="metric.key">{{ t(`paymentMethod.overview.${metric.key}`) }} <b>{{ metric.value ?? t('paymentMethod.unassessed') }}</b></span>
                                    <span v-if="overview.paymentCapability.assessedAt">{{ t('paymentMethod.overview.assessedAt') }} <BaseDateTime :value="overview.paymentCapability.assessedAt" /></span>
                                </div>
                                <div v-if="overview.paymentCapability.assessmentStatus === 'EVALUATED' || overview.paymentCapability.assessmentStatus === 'HISTORY_PENDING'" class="integration-facts">
                                    <span>{{ t(overview.paymentCapability.assessmentStatus === 'EVALUATED' ? 'paymentMethod.overview.executableMethods' : 'paymentMethod.overview.observedMethods', { count: capabilityGroups.length }) }}</span>
                                </div>
                                <div
                                    v-if="capabilityGroups.length && ['EVALUATED', 'HISTORY_PENDING'].includes(overview.paymentCapability.assessmentStatus || '')"
                                    class="payment-capability-list"
                                    role="list"
                                    :aria-label="t('accessConfig.paymentMethods')"
                                >
                                    <div
                                        v-for="group in capabilityGroups"
                                        :key="group.key"
                                        class="payment-capability-item"
                                        role="listitem"
                                    >
                                        <PaymentMethodDisplay
                                            :payment-types="[{ value: group.paymentType, label: paymentTypeLabel(group.paymentType) }]"
                                            :payment-methods="[{ value: group.paymentMethod, label: group.paymentMethod }]"
                                            :show-payment-type-label="false"
                                            align="start"
                                        />
                                    </div>
                                </div>
                                <el-empty v-else :image-size="40" :description="t(overview.paymentCapability.assessmentStatus === 'EVALUATED' && overview.paymentCapability.executionReadyCount != null ? 'paymentMethod.overview.noExecutableMethods' : 'paymentMethod.unassessed')" />
                            </div>

                            <div v-else-if="item.key === 'fee'" class="integration-facts">
                                <span>{{ t('accessConfig.activeFeeVersion') }} <b>{{ feeVersionLabel }}</b></span>
                                <span>{{ t('accessConfig.platformManaged') }}</span>
                            </div>

                            <div v-else-if="item.key === 'risk'" class="integration-facts">
                                <span>{{ t('accessConfig.riskLevel') }} <b>{{ riskLevelLabel(overview.risk.riskLevel) }}</b></span>
                                <span>{{ t('accessConfig.riskPrivacyNotice') }}</span>
                            </div>

                            <div v-else class="integration-facts integration-facts--technical">
                                <span>{{ t('accessConfig.jwtSignature') }} <b :class="`is-${keyTone(overview.credentials.jwtKeyStatus)}`">{{ keyStatusLabel(overview.credentials.jwtKeyStatus) }}</b></span>
                                <span>{{ t('accessConfig.requestEncryption') }} <b :class="`is-${keyTone(overview.credentials.platformPayloadKeyStatus)}`">{{ keyStatusLabel(overview.credentials.platformPayloadKeyStatus) }}</b></span>
                                <span>{{ t('accessConfig.responseDecryption') }} <b :class="`is-${responseKeyTone}`">{{ responseKeyLabel }}</b></span>
                                <span>{{ t('accessConfig.ipCheckTitle') }} <b>{{ ruleSummary(overview.ipWhitelist) }}</b></span>
                                <span>{{ t('accessConfig.sourceUrlCheckTitle') }} <b>{{ ruleSummary(overview.sourceUrl) }}</b></span>
                            </div>
                        </div>

                        <div class="integration-check-row__meta">
                            <div class="integration-check-row__time">
                                <span>{{ t('accessConfig.lastUpdated') }}</span>
                                <BaseDateTime :value="item.lastUpdatedTime" />
                            </div>
                            <el-button
                                v-if="item.key === 'merchantProfile' && auth.hasPermission('merchant:info:view')"
                                text
                                type="primary"
                                :icon="ArrowRight"
                                @click="openManagement('/merchant-info/profile')"
                            >
                                {{ t('accessConfig.viewProfile') }}
                            </el-button>
                            <el-button
                                v-else-if="item.key === 'paymentCapability' && auth.hasPermission('merchant:payment-method:view')"
                                text type="primary" :icon="ArrowRight"
                                @click="openManagement('/merchant-info/payment-methods')"
                            >{{ t('paymentMethod.title') }}</el-button>
                            <div v-else-if="item.key === 'technical'" class="integration-check-row__actions">
                                <el-button
                                    v-if="auth.hasPermission('merchant:openapi:key:view')"
                                    text
                                    type="primary"
                                    @click="openManagement('/merchant-info/openapi-keys')"
                                >{{ t('accessConfig.credentials') }}</el-button>
                                <el-button
                                    v-if="auth.hasPermission('merchant:access-config:ip-whitelist:list')"
                                    text
                                    type="primary"
                                    @click="openManagement('/access-config/ip-whitelist')"
                                >{{ t('accessConfig.ipCheckTitle') }}</el-button>
                                <el-button
                                    v-if="auth.hasPermission('merchant:access-config:source-url:list')"
                                    text
                                    type="primary"
                                    @click="openManagement('/access-config/source-url')"
                                >{{ t('accessConfig.sourceUrlCheckTitle') }}</el-button>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
    ArrowRight,
    CircleCheck,
    Clock,
    Connection,
    CreditCard,
    Lock,
    Refresh,
    Tickets,
    User,
    Wallet,
    Warning,
} from '@element-plus/icons-vue';
import { CurrencyDisplay, PaymentMethodDisplay } from '@acquiring/shared';
import {
    accessConfigApi,
    type MerchantAccessCheckStatus,
    type MerchantAccessOverview,
    type MerchantAccessRuleCheck,
} from '@/api/accessConfigApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import { paymentCapabilityMetrics } from '@/utils/paymentAuthorizationPresentation';
import { useAuthStore } from '@/stores/authStore';

type StageKey = 'merchantProfile' | 'settlement' | 'paymentCapability' | 'fee' | 'risk' | 'technical';
type StageItem = {
    key: StageKey;
    title: string;
    description: string;
    status: MerchantAccessCheckStatus;
    icon: Component;
    lastUpdatedTime?: string;
};
type CapabilityGroup = {
    key: string;
    paymentType: string;
    paymentMethod: string;
};

const { locale, t, te } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const loadFailed = ref(false);
const overview = ref<MerchantAccessOverview>();

const overallTitle = computed(() => {
    if (overview.value?.overallStatus === 'READY') return t('accessConfig.overviewReady');
    if (overview.value?.overallStatus === 'PENDING_REVIEW') return t('accessConfig.overviewPending');
    return t('accessConfig.overviewActionRequired');
});

const overallDescription = computed(() => {
    if (overview.value?.overallStatus === 'READY') return t('accessConfig.overviewReadyDesc');
    if (overview.value?.overallStatus === 'PENDING_REVIEW') return t('accessConfig.overviewPendingDesc');
    return t('accessConfig.overviewActionRequiredDesc');
});

const overallIcon = computed(() => {
    if (overview.value?.overallStatus === 'READY') return CircleCheck;
    if (overview.value?.overallStatus === 'PENDING_REVIEW') return Clock;
    return Warning;
});

const completionPercentage = computed(() => {
    const total = overview.value?.requiredCheckCount || 0;
    return total ? Math.round((overview.value?.completedRequiredChecks || 0) * 100 / total) : 0;
});

const progressStatus = computed<'success' | 'warning' | 'exception' | undefined>(() => {
    if (overview.value?.overallStatus === 'READY') return 'success';
    if (overview.value?.overallStatus === 'PENDING_REVIEW') return 'warning';
    return 'exception';
});

const stageItems = computed<StageItem[]>(() => {
    const data = overview.value;
    if (!data) return [];
    return [
        stageItem('merchantProfile', data.merchantProfile.status, User, data.merchantProfile.lastUpdatedTime),
        stageItem('settlement', data.settlement.status, Wallet, data.settlement.lastUpdatedTime),
        stageItem('paymentCapability', data.paymentCapability.status, CreditCard, data.paymentCapability.lastUpdatedTime),
        stageItem('fee', data.fee.status, Tickets, data.fee.lastUpdatedTime),
        stageItem('risk', data.risk.status, Lock, data.risk.lastUpdatedTime),
        stageItem('technical', data.technicalStatus, Connection, technicalLastUpdatedTime(data)),
    ];
});

const capabilityMetrics = computed(() => paymentCapabilityMetrics(overview.value?.paymentCapability));

const capabilityGroups = computed<CapabilityGroup[]>(() => {
    const groups = new Map<string, CapabilityGroup>();
    (overview.value?.paymentCapability.capabilities || []).forEach((capability) => {
        const key = `${capability.paymentType}:${capability.paymentMethod}`;
        const current = groups.get(key) || {
            key,
            paymentType: capability.paymentType,
            paymentMethod: capability.paymentMethod,
        };
        groups.set(key, current);
    });
    return Array.from(groups.values());
});

const responseKeyLabel = computed(() => {
    const credentials = overview.value?.credentials;
    if (!credentials) return t('accessConfig.keyMissing');
    if (credentials.merchantResponseKeyStatus !== 'ENABLED') {
        return keyStatusLabel(credentials.merchantResponseKeyStatus);
    }
    return credentials.merchantResponsePrivateKeyAvailable
        ? t('accessConfig.keyEnabled')
        : t('accessConfig.keyPrivateMissing');
});

const responseKeyTone = computed(() => {
    const credentials = overview.value?.credentials;
    return credentials?.merchantResponseKeyStatus === 'ENABLED'
        && credentials.merchantResponsePrivateKeyAvailable ? 'ready' : 'action';
});

const settlementCycleLabel = computed(() => {
    const settlement = overview.value?.settlement;
    if (!settlement?.settlementFrequency) return '-';
    const frequencyKey = `accessConfig.frequency.${settlement.settlementFrequency}`;
    const frequency = te(frequencyKey)
        ? t(frequencyKey, { day: settlement.frequencyDay || '-' })
        : settlement.settlementFrequency;
    const delayUnit = settlement.initialDelayUnit || '-';
    return t('accessConfig.settlementCycleValue', {
        initial: `${delayUnit}+${settlement.initialDelayDays ?? '-'}`,
        regular: `${delayUnit}+${settlement.regularDelayDays ?? '-'}`,
        frequency,
    });
});

const feeVersionLabel = computed(() => overview.value?.fee.activeVersionNo == null
    ? t('accessConfig.platformPending')
    : `V${overview.value.fee.activeVersionNo}`);

function stageItem(
    key: StageKey,
    status: MerchantAccessCheckStatus,
    icon: Component,
    lastUpdatedTime?: string,
): StageItem {
    return {
        key,
        status,
        icon,
        lastUpdatedTime,
        title: t(`accessConfig.stage.${key}`),
        description: stageDescription(key, status),
    };
}

function stageDescription(key: StageKey, status: MerchantAccessCheckStatus) {
    const tone = status === 'READY' ? 'ready' : status === 'ACTION_REQUIRED' ? 'action' : 'pending';
    return t(`accessConfig.stageDescription.${key}.${tone}`);
}

function statusLabel(status: MerchantAccessCheckStatus) {
    if (status === 'READY') return t('accessConfig.statusReady');
    if (status === 'PENDING_REVIEW') return t('accessConfig.statusPending');
    if (status === 'NOT_REQUIRED') return t('accessConfig.statusNotRequired');
    return t('accessConfig.statusActionRequired');
}

function statusTagType(status: MerchantAccessCheckStatus) {
    if (status === 'READY') return 'success';
    if (status === 'PENDING_REVIEW') return 'warning';
    if (status === 'NOT_REQUIRED') return 'info';
    return 'danger';
}

function statusTone(status: MerchantAccessCheckStatus) {
    if (status === 'READY') return 'ready';
    if (status === 'PENDING_REVIEW') return 'pending';
    if (status === 'NOT_REQUIRED') return 'optional';
    return 'action';
}

function businessStatusLabel(status?: string) {
    if (!status) return '-';
    const key = `accessConfig.businessStatus.${status}`;
    return te(key) ? t(key) : status;
}

function keyStatusLabel(status?: string) {
    if (status === 'ENABLED') return t('accessConfig.keyEnabled');
    if (status === 'DISABLED') return t('accessConfig.keyDisabled');
    return t('accessConfig.keyMissing');
}

function keyTone(status?: string) {
    return status === 'ENABLED' ? 'ready' : 'action';
}

function ruleSummary(rule: MerchantAccessRuleCheck) {
    if (rule.status === 'NOT_REQUIRED') return t('accessConfig.statusNotRequired');
    if (rule.status === 'READY') return t('accessConfig.activeCount', { count: rule.activeCount });
    if (rule.status === 'PENDING_REVIEW') return t('accessConfig.pendingCount', { count: rule.pendingCount });
    return t('accessConfig.statusActionRequired');
}

function processingModeLabel(mode?: string) {
    if (!mode) return '-';
    const key = `accessConfig.processingModeValue.${mode}`;
    return te(key) ? t(key) : mode;
}

function riskLevelLabel(level?: number) {
    if (level == null) return t('accessConfig.platformPending');
    const key = `accessConfig.riskLevelValue.${level}`;
    return te(key) ? t(key) : String(level);
}

function paymentTypeLabel(paymentType: string) {
    const key = `transaction.paymentMethod.${paymentType}`;
    return te(key) ? t(key) : paymentType;
}

function technicalLastUpdatedTime(data: MerchantAccessOverview) {
    return [
        data.credentials.lastUpdatedTime,
        data.ipWhitelist.lastUpdatedTime,
        data.sourceUrl.lastUpdatedTime,
    ].filter((value): value is string => Boolean(value)).sort().at(-1);
}

async function loadOverview() {
    loading.value = true;
    loadFailed.value = false;
    try {
        overview.value = await accessConfigApi.overview();
    } catch (error: any) {
        overview.value = undefined;
        loadFailed.value = true;
        ElMessage.error(error?.friendlyMessage || error?.message || t('accessConfig.overviewLoadFailed'));
    } finally {
        loading.value = false;
    }
}

function openManagement(path: string) {
    void router.push(path);
}

onMounted(loadOverview);
</script>

<style scoped>
.access-overview-page {
    display: grid;
    gap: 16px;
    min-width: 0;
}

.access-overview-state {
    min-height: 360px;
    padding: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
}

.integration-status-band {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) minmax(180px, 240px) auto;
    gap: 18px;
    align-items: center;
    padding: 20px 22px;
    border: 1px solid #dbe4ee;
    border-left: 4px solid #64748b;
    border-radius: 6px;
    background: #fff;
}

.integration-status-band.is-ready { border-left-color: #15803d; }
.integration-status-band.is-pending { border-left-color: #d97706; }
.integration-status-band.is-action { border-left-color: #dc2626; }

.integration-status-band__icon,
.integration-check-row__icon,
.integration-process__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    color: #475569;
    background: #f1f5f9;
}

.integration-status-band__icon {
    width: 52px;
    height: 52px;
    border-radius: 6px;
}

.integration-status-band__icon :deep(svg) { width: 26px; height: 26px; }
.integration-status-band.is-ready .integration-status-band__icon,
.integration-check-row__icon.is-ready,
.integration-process__index.is-ready { color: #15803d; background: #f0fdf4; }
.integration-status-band.is-pending .integration-status-band__icon,
.integration-check-row__icon.is-pending,
.integration-process__index.is-pending { color: #b45309; background: #fffbeb; }
.integration-status-band.is-action .integration-status-band__icon,
.integration-check-row__icon.is-action,
.integration-process__index.is-action { color: #b91c1c; background: #fef2f2; }
.integration-check-row__icon.is-optional { color: #475569; background: #f1f5f9; }

.integration-status-band__eyebrow {
    display: block;
    margin-bottom: 4px;
    color: #64748b;
    font-size: 12px;
    line-height: 18px;
}

.integration-status-band__title-row,
.integration-check-row__title {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
}

.integration-status-band h2,
.section-heading h3,
.integration-environment h3,
.integration-check-row h4 {
    margin: 0;
    color: #172033;
    letter-spacing: 0;
}

.integration-status-band h2 { font-size: 20px; line-height: 28px; }
.integration-status-band__body p,
.section-heading p,
.integration-check-row__content > p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 20px;
}

.integration-status-band__progress > div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 7px;
    color: #64748b;
    font-size: 12px;
}

.integration-status-band__progress strong { color: #172033; font-size: 14px; }

.integration-process,
.integration-checks {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
    overflow: hidden;
}

.section-heading {
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
}

.section-heading h3 { font-size: 16px; line-height: 24px; }
.integration-process__scroll { overflow-x: auto; }
.integration-process__steps {
    display: grid;
    grid-template-columns: repeat(6, minmax(132px, 1fr));
    min-width: 820px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.integration-process__steps li {
    position: relative;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    min-width: 0;
    padding: 15px 14px;
    border-right: 1px solid #edf1f5;
}

.integration-process__steps li:last-child { border-right: 0; }
.integration-process__index { width: 34px; height: 34px; border-radius: 50%; }
.integration-process__index :deep(svg) { width: 17px; height: 17px; }
.integration-process__steps li > div { display: grid; min-width: 0; }
.integration-process__steps small { color: #94a3b8; font-size: 10px; line-height: 15px; }
.integration-process__steps strong {
    overflow: hidden;
    color: #263449;
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.integration-process__steps li > div > span { margin-top: 1px; font-size: 11px; line-height: 16px; }
.integration-process__steps span.is-ready { color: #15803d; }
.integration-process__steps span.is-pending { color: #b45309; }
.integration-process__steps span.is-action { color: #b91c1c; }

.integration-environment {
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    align-items: stretch;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
    overflow: hidden;
}

.integration-environment h3 {
    display: flex;
    align-items: center;
    padding: 18px 20px;
    border-right: 1px solid #e2e8f0;
    background: #f8fafc;
    font-size: 14px;
}

.integration-environment dl {
    display: grid;
    grid-template-columns: minmax(280px, 2fr) minmax(140px, 1fr) minmax(160px, 1fr);
    margin: 0;
}

.integration-environment dl > div { min-width: 0; padding: 14px 18px; border-right: 1px solid #e2e8f0; }
.integration-environment dl > div:last-child { border-right: 0; }
.integration-environment dt,
.integration-check-row__time span { color: #64748b; font-size: 12px; line-height: 18px; }
.integration-environment dd {
    margin: 3px 0 0;
    color: #1e293b;
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
}
.integration-environment__url { overflow-wrap: anywhere; }

.integration-check-row {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) minmax(190px, auto);
    gap: 16px;
    align-items: center;
    padding: 18px 20px;
    border-bottom: 1px solid #edf1f5;
}

.integration-check-row:last-child { border-bottom: 0; }
.integration-check-row__icon { width: 42px; height: 42px; border-radius: 6px; }
.integration-check-row__icon :deep(svg) { width: 21px; height: 21px; }
.integration-check-row h4 { font-size: 14px; line-height: 22px; }

.integration-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 10px;
}

.integration-facts > span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 26px;
    padding: 3px 9px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    color: #64748b;
    background: #f8fafc;
    font-size: 12px;
    line-height: 18px;
}

.integration-facts b { color: #334155; font-weight: 600; }
.integration-facts b.is-ready { color: #15803d; }
.integration-facts b.is-action { color: #b91c1c; }
.integration-fact--currency { padding-right: 6px !important; }

.payment-capability-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 10px;
}
.payment-capability-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 58px;
    min-height: 38px;
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background: #f8fafc;
}
.payment-capability-item :deep(.payment-method-display) { min-height: 24px; }
.payment-capability-summary :deep(.el-empty) { padding: 8px 0 0; }
.payment-capability-summary :deep(.el-empty__description) { margin-top: 4px; }
.payment-capability-summary :deep(.el-empty__description p) { font-size: 12px; }

.integration-check-row__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 7px;
}

.integration-check-row__time { min-width: 150px; text-align: right; }
.integration-check-row__time :deep(.base-date-time) {
    display: block;
    margin-top: 2px;
    color: #334155;
    font-size: 12px;
    line-height: 18px;
}
.integration-check-row__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 2px; }
.integration-check-row__actions .el-button + .el-button { margin-left: 0; }

@media (max-width: 980px) {
    .integration-status-band { grid-template-columns: 48px minmax(0, 1fr) auto; }
    .integration-status-band__progress { grid-column: 2 / -1; }
    .integration-environment { grid-template-columns: 1fr; }
    .integration-environment h3 { border-right: 0; border-bottom: 1px solid #e2e8f0; }
    .integration-environment dl { grid-template-columns: 1fr 1fr; }
    .integration-environment dl > div:first-child {
        grid-column: 1 / -1;
        border-right: 0;
        border-bottom: 1px solid #e2e8f0;
    }
    .integration-check-row { grid-template-columns: 42px minmax(0, 1fr); align-items: start; }
    .integration-check-row__meta {
        grid-column: 2;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
    }
    .integration-check-row__time { text-align: left; }
}

@media (max-width: 680px) {
    .access-overview-page { gap: 12px; }
    .integration-status-band { grid-template-columns: 42px minmax(0, 1fr); gap: 13px; padding: 16px; }
    .integration-status-band__icon { width: 42px; height: 42px; }
    .integration-status-band > .el-button,
    .integration-status-band__progress { grid-column: 1 / -1; }
    .integration-status-band > .el-button { width: 100%; }
    .section-heading { padding: 15px 16px; }
    .integration-environment dl { grid-template-columns: 1fr; }
    .integration-environment dl > div,
    .integration-environment dl > div:first-child {
        grid-column: auto;
        border-right: 0;
        border-bottom: 1px solid #e2e8f0;
    }
    .integration-environment dl > div:last-child { border-bottom: 0; }
    .integration-check-row { grid-template-columns: 38px minmax(0, 1fr); gap: 12px; padding: 16px; }
    .integration-check-row__icon { width: 38px; height: 38px; }
    .integration-check-row__meta { grid-column: 1 / -1; }
    .payment-capability-list { gap: 7px; }
    .payment-capability-item { min-width: 52px; padding: 6px 8px; }
    .integration-check-row__actions { justify-content: flex-start; }
}
</style>

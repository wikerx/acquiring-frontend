<template>
    <section class="product-alert-flow" :data-product="product" :aria-labelledby="`${flowId}-title`">
        <header class="flow-intro">
            <div>
                <h4 :id="`${flowId}-title`">{{ t(`${flowKey}.title`) }}</h4>
                <p>{{ t(`${flowKey}.prompt`) }}</p>
            </div>
            <img :src="logo" alt="" width="86" height="40" />
        </header>

        <div class="flow-layout">
            <div class="flow-board">
                <div class="flow-participants">
                    <div v-for="participant in participants" :key="participant.key" class="flow-participant">
                        <span class="participant-icon" :class="participant.key">
                            <el-icon aria-hidden="true"><component :is="participant.icon" /></el-icon>
                        </span>
                        <span>{{ t(`${flowKey}.participants.${participant.key}`) }}</span>
                    </div>
                </div>
                <ol class="flow-sequence">
                    <li v-for="(row, index) in flow.rows" :key="row[0].key" class="flow-row">
                        <button
                            v-for="step in row"
                            :key="step.key"
                            type="button"
                            class="flow-step"
                            :class="{ 'flow-step--response': step.response, 'flow-step--dashed': step.dashed }"
                            :data-route="step.route"
                            :aria-pressed="selectedStep.key === step.key"
                            :aria-controls="`${flowId}-step-detail`"
                            @click="selectStep(step)"
                        >
                            <span class="flow-step-label">
                                <span class="flow-count" aria-hidden="true">{{ index + 1 }}{{ step.branch }}</span>
                                {{ t(`${flowKey}.steps.${step.key}.label`) }}
                            </span>
                            <span class="flow-line" aria-hidden="true">
                                <span v-if="selectedStep.key === step.key && step.route.includes('-')" class="flow-pulse-track">
                                    <span :key="pulseRevision" class="flow-pulse" />
                                </span>
                            </span>
                        </button>
                    </li>
                </ol>
            </div>

            <section :id="`${flowId}-step-detail`" class="flow-detail" :aria-labelledby="`${flowId}-step-title`" aria-live="polite">
                <p class="detail-route">{{ t(`${stepKey}.route`) }}</p>
                <h5 :id="`${flowId}-step-title`">{{ t(`${stepKey}.title`) }}</h5>
                <p class="detail-intro">{{ t(`${stepKey}.description`) }}</p>

                <dl class="detail-points">
                    <div v-for="point in selectedStep.points" :key="point">
                        <dt>{{ t(`${stepKey}.points.${point}.label`) }}</dt>
                        <dd>{{ t(`${stepKey}.points.${point}.description`) }}</dd>
                    </div>
                </dl>

                <div v-if="product === 'ethoca' && selectedStep.key === 'receipt'" class="receipt-example">
                    <span class="receipt-title">{{ t('alertConfig.guide.ethoca.flow.receiptExample') }}</span>
                    <ul>
                        <li v-for="example in receiptExamples" :key="example.id">
                            <span class="receipt-id">
                                <el-icon :class="example.status" aria-hidden="true"><component :is="example.icon" /></el-icon>
                                <code>{{ example.id }}</code>
                            </span>
                            <span>{{ t(`alertConfig.guide.ethoca.flow.receiptStatus.${example.status}`) }}</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    </section>
</template>

<script setup lang="ts">
import { CircleCheck, Connection, OfficeBuilding, Shop, User, Warning } from '@element-plus/icons-vue';
import { computed, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { alertProductFlows, type AlertFlowProduct, type AlertFlowStep } from './alert-product-flows';

const props = defineProps<{ product: AlertFlowProduct; logo: string }>();
const { t } = useI18n();
const flow = alertProductFlows[props.product];
const flowId = `alert-flow-${props.product}`;
const flowKey = `alertConfig.guide.${props.product}.flow`;
const participants = [
    { key: 'issuer', icon: props.product === 'amexInquiry' ? User : OfficeBuilding },
    { key: 'provider', icon: Connection },
    { key: 'merchant', icon: Shop },
];
const pulseRevision = ref(0);
const selectedStep = shallowRef(flow.rows.flat().find(({ key }) => key === flow.defaultStep) ?? flow.rows[0][0]);
const stepKey = computed(() => `${flowKey}.steps.${selectedStep.value.key}`);
const receiptExamples = [
    { id: 'EX-001', status: 'accepted', icon: CircleCheck },
    { id: 'EX-002', status: 'review', icon: Warning },
];

function selectStep(step: AlertFlowStep) {
    selectedStep.value = step;
    pulseRevision.value += 1;
}
</script>

<style scoped>
.product-alert-flow {
    container-type: inline-size;
    margin: 0 12px;
    padding: 18px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--admin-panel-radius);
    background: var(--el-bg-color);
}
.flow-intro {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-block-end: 14px;
}
.flow-intro h4 {
    margin: 0 0 3px;
    color: var(--el-text-color-primary);
    font-size: 17px;
    line-height: 1.45;
}
.flow-intro p,
.flow-detail p {
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.65;
}
.flow-intro img {
    box-sizing: content-box;
    width: 78px;
    height: 36px;
    padding: 4px 7px;
    border-radius: 8px;
    background: var(--el-color-primary-light-9);
    object-fit: contain;
}
.product-alert-flow[data-product='ethoca'] .flow-intro img {
    background: #fff3e8;
}
.flow-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    align-items: stretch;
    gap: 12px;
}
.flow-board {
    --flow-grid: color-mix(in srgb, var(--el-color-primary-light-3) 55%, var(--admin-panel-border));
    display: flex;
    min-inline-size: 0;
    flex-direction: column;
    padding: 17px 12px 12px;
    border: 1px solid var(--admin-panel-border);
    border-radius: var(--admin-panel-radius);
    background: linear-gradient(180deg, var(--el-color-primary-light-9), var(--admin-panel-muted-bg) 85%);
    color: var(--el-text-color-primary);
}
.flow-participants {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
}
.flow-participant {
    display: flex;
    min-inline-size: 0;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
}
.participant-icon {
    display: grid;
    width: 36px;
    height: 36px;
    place-items: center;
    border: 1px solid var(--admin-panel-border);
    border-radius: 9px;
    background: var(--admin-panel-bg);
    color: var(--el-color-primary);
    font-size: 19px;
}
.participant-icon.provider {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary);
    color: var(--el-color-white);
}
.flow-sequence {
    position: relative;
    display: grid;
    flex: 1;
    grid-auto-rows: minmax(47px, 1fr);
    align-items: center;
    margin: 7px 0 0;
    padding: 7px 0 2px;
    list-style: none;
    background-image:
        repeating-linear-gradient(to bottom, var(--flow-grid) 0 4px, transparent 4px 8px),
        repeating-linear-gradient(to bottom, var(--flow-grid) 0 4px, transparent 4px 8px),
        repeating-linear-gradient(to bottom, var(--flow-grid) 0 4px, transparent 4px 8px);
    background-repeat: no-repeat;
    background-position: 16.667% 0, 50% 0, 83.333% 0;
    background-size: 1px 100%;
}
.flow-row {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    align-items: center;
}
.flow-step {
    --route-ink: var(--el-color-primary);
    --route-line: color-mix(in srgb, var(--route-ink) 65%, var(--admin-panel-header-bg));
    display: grid;
    grid-column: 2 / 4;
    grid-row: 1;
    width: 100%;
    min-inline-size: 0;
    gap: 4px;
    padding: 2px 0 6px;
    appearance: none;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
}
.flow-step--response {
    --route-ink: var(--app-primary-dark);
}
.flow-step:is([data-route='center-right'], [data-route='right-center']) {
    grid-column: 4 / 6;
}
.flow-step[data-route='center'] {
    grid-column: 3 / 5;
}
.flow-step[data-route='right'] {
    grid-column: 5 / 7;
}
.flow-step-label {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
    justify-self: center;
    gap: 5px;
    padding: 4px 6px;
    border: 1px solid var(--admin-panel-border);
    border-radius: 6px;
    background: var(--admin-panel-bg);
    font-size: 12px;
    font-weight: 650;
    line-height: 1.3;
    text-align: start;
}
.flow-count {
    flex: none;
    color: var(--route-ink);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
}
.flow-step[aria-pressed='true'] {
    --route-line: var(--route-ink);
}
.flow-step[aria-pressed='true'] .flow-step-label {
    border-color: var(--route-ink);
    background: var(--route-ink);
    color: var(--el-color-white);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--route-ink) 12%, transparent);
}
.flow-step[aria-pressed='true'] .flow-count {
    color: inherit;
}
.flow-step[aria-pressed='false']:hover .flow-step-label {
    border-color: var(--route-ink);
    background: var(--el-color-primary-light-9);
}
.flow-step:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 3px;
}
.flow-line {
    position: relative;
    height: 2px;
    background: var(--route-line);
}
.flow-line::after {
    position: absolute;
    inset-block-start: -3px;
    inset-inline-end: 0;
    width: 0;
    height: 0;
    border-block: 4px solid transparent;
    border-inline-start: 6px solid var(--route-line);
    content: '';
}
.flow-step:is([data-route='right-center'], [data-route='center-left']) .flow-line::after {
    inset-inline-start: 0;
    inset-inline-end: auto;
    transform: rotate(180deg);
}
.flow-step--dashed .flow-line {
    background: repeating-linear-gradient(to right, var(--route-line) 0 5px, transparent 5px 9px);
}
.flow-pulse-track {
    position: absolute;
    inset: -1px 0;
    overflow: hidden;
    pointer-events: none;
}
.flow-pulse {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: 35%;
    background: linear-gradient(90deg, transparent, var(--el-color-primary-light-3) 32%, var(--el-color-white) 50%, var(--el-color-primary-light-3) 68%, transparent);
    animation: alert-flow-pulse 1.5s linear 3 both;
}
.flow-step:is([data-route='right-center'], [data-route='center-left']) .flow-pulse {
    animation-direction: reverse;
}
.flow-step--dashed .flow-pulse-track {
    mask-image: repeating-linear-gradient(to right, black 0 5px, transparent 5px 9px);
}
@keyframes alert-flow-pulse {
    from {
        transform: translateX(-100%);
    }
    to {
        transform: translateX(300%);
    }
}
@media (prefers-reduced-motion: reduce) {
    .flow-pulse-track {
        display: none;
    }
}
.flow-step:is([data-route='center'], [data-route='right']) .flow-line {
    width: 7px;
    height: 7px;
    justify-self: center;
    border-radius: 50%;
}
.flow-step:is([data-route='center'], [data-route='right']) .flow-line::after {
    content: none;
}
.flow-detail {
    min-inline-size: 0;
    padding: 17px;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--admin-panel-radius);
    background: var(--el-fill-color-extra-light);
}
.flow-detail .detail-route {
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 650;
}
.flow-detail h5 {
    margin: 4px 0 6px;
    color: var(--el-text-color-primary);
    font-size: 19px;
    line-height: 1.35;
}
.detail-points {
    margin: 12px 0 0;
}
.detail-points > div {
    padding: 7px 0;
    border-top: 1px solid var(--el-border-color-lighter);
}
.detail-points dt {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 650;
}
.detail-points dd {
    margin: 2px 0 0;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.55;
}
.receipt-example {
    margin-block-start: 6px;
    padding: 9px 11px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 7px;
    background: var(--el-bg-color);
}
.receipt-title {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}
.receipt-example ul {
    display: grid;
    gap: 5px;
    margin: 5px 0 0;
    padding: 0;
    list-style: none;
}
.receipt-example li,
.receipt-id {
    display: flex;
    align-items: center;
    gap: 8px;
}
.receipt-example li {
    justify-content: space-between;
    color: var(--el-text-color-regular);
    font-size: 12px;
}
.receipt-id {
    white-space: nowrap;
}
.receipt-id .accepted {
    color: var(--el-color-success);
}
.receipt-id .review {
    color: var(--el-color-warning);
}
@container (max-width: 720px) {
    .flow-layout {
        grid-template-columns: minmax(0, 1fr);
    }
}
@container (max-width: 600px) {
    .product-alert-flow {
        margin-inline: 6px;
        padding: 10px;
    }
    .flow-intro img {
        width: 58px;
        height: 30px;
    }
}
@container (max-width: 360px) {
    .flow-board {
        padding-inline: 5px;
    }
    .flow-step-label {
        gap: 3px;
        padding-inline: 3px;
        font-size: 11px;
    }
    .flow-step {
        overflow-wrap: anywhere;
    }
    .flow-detail {
        padding: 12px;
    }
}
</style>

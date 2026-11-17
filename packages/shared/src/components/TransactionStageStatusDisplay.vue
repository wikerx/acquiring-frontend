<template>
    <span
        class="transaction-stage-status-display"
        :data-domain="domain"
        :data-status="value || ''"
        :data-semantic="presentation?.semantic || 'neutral'"
        :title="displayText"
        :aria-label="displayText"
    >
        <img v-if="presentation" class="transaction-stage-status-display__icon" :src="presentation.icon" alt="" aria-hidden="true" />
        <span class="transaction-stage-status-display__text">{{ displayText }}</span>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveTransactionStagePresentation, type TransactionStage } from '../transactionStagePresentation';

const props = defineProps<{ domain: TransactionStage; value?: string | null; label?: string | null }>();
const presentation = computed(() => resolveTransactionStagePresentation(props.domain, props.value));
const displayText = computed(() => props.label?.trim() || props.value?.trim() || '-');
</script>

<style scoped>
.transaction-stage-status-display {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0 8px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #475569;
    vertical-align: middle;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
}
.transaction-stage-status-display[data-semantic='success'] { background: #f0fdf4; color: #166534; }
.transaction-stage-status-display[data-semantic='mismatch'],
.transaction-stage-status-display[data-semantic='failed'] { background: #fef2f2; color: #b91c1c; }
.transaction-stage-status-display[data-semantic='processing'] { background: #eff6ff; color: #1d4ed8; }
.transaction-stage-status-display[data-semantic='pending-review'] { background: #fffbeb; color: #92400e; }
.transaction-stage-status-display__icon {
    width: 20px;
    height: 20px;
    flex: 0 0 20px;
    object-fit: contain;
}
.transaction-stage-status-display__text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
</style>

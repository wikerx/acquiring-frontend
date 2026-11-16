<template>
    <span
        class="transaction-status-display"
        :class="[
            `transaction-status-display--${size}`,
            `transaction-status-display--${align}`,
            `transaction-status-display--${statusCode?.toLowerCase() || 'neutral'}`,
            { 'transaction-status-display--icon-only': iconOnly },
        ]"
        :title="displayText"
        :aria-label="displayText"
    >
        <img
            v-if="icon"
            class="transaction-status-display__icon"
            :src="icon"
            alt=""
            aria-hidden="true"
        />
        <span v-if="!iconOnly" class="transaction-status-display__text">{{ displayText }}</span>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
    normalizeTransactionStatusIconCode,
    resolveTransactionStatusIcon,
} from '../transactionPresentation';

const props = withDefaults(defineProps<{
    value?: string | null;
    label?: string | null;
    size?: 'sm' | 'md';
    align?: 'start' | 'center' | 'end';
    iconOnly?: boolean;
}>(), {
    value: '',
    label: '',
    size: 'sm',
    align: 'center',
    iconOnly: false,
});

const icon = computed(() => resolveTransactionStatusIcon(props.value));
const statusCode = computed(() => normalizeTransactionStatusIconCode(props.value));
const displayText = computed(() => props.label?.trim() || props.value?.trim() || '-');
</script>

<style scoped>
.transaction-status-display {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    color: #475467;
    font-size: 12px;
    font-weight: 650;
    line-height: 20px;
    white-space: nowrap;
}

.transaction-status-display--start { justify-content: flex-start; }
.transaction-status-display--center { justify-content: center; }
.transaction-status-display--end { justify-content: flex-end; }
.transaction-status-display--icon-only { gap: 0; }
.transaction-status-display--success { color: #15803d; }
.transaction-status-display--failed { color: #dc2626; }
.transaction-status-display--pending { color: #b45309; }
.transaction-status-display--processing { color: #1d4ed8; }

.transaction-status-display--md {
    gap: 7px;
    font-size: 13px;
    line-height: 22px;
}

.transaction-status-display__icon {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    object-fit: contain;
}

.transaction-status-display--md .transaction-status-display__icon {
    width: 22px;
    height: 22px;
    flex-basis: 22px;
}

.transaction-status-display__text {
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
}
</style>

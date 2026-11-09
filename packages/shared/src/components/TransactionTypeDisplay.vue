<template>
    <span
        class="transaction-type-display"
        :class="[
            `transaction-type-display--${size}`,
            `transaction-type-display--${align}`,
            { 'transaction-type-display--icon-only': iconOnly },
        ]"
        :title="displayText"
        :aria-label="displayText"
    >
        <img
            v-if="icon"
            class="transaction-type-display__icon"
            :src="icon"
            alt=""
            aria-hidden="true"
        />
        <span v-if="!iconOnly" class="transaction-type-display__text">{{ displayText }}</span>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveTransactionTypeIcon } from '../transactionPresentation';

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

const icon = computed(() => resolveTransactionTypeIcon(props.value));
const displayText = computed(() => props.label?.trim() || props.value?.trim() || '-');
</script>

<style scoped>
.transaction-type-display {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    color: #344054;
    font-size: 12px;
    font-weight: 600;
    line-height: 20px;
    white-space: nowrap;
}

.transaction-type-display--start { justify-content: flex-start; }
.transaction-type-display--center { justify-content: center; }
.transaction-type-display--end { justify-content: flex-end; }
.transaction-type-display--icon-only { gap: 0; }

.transaction-type-display--md {
    gap: 7px;
    font-size: 13px;
    line-height: 22px;
}

.transaction-type-display__icon {
    width: 20px;
    height: 20px;
    flex: 0 0 20px;
    object-fit: contain;
}

.transaction-type-display--md .transaction-type-display__icon {
    width: 22px;
    height: 22px;
    flex-basis: 22px;
}

.transaction-type-display__text {
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
}
</style>

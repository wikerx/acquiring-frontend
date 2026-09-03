<template>
    <span
        class="direction-tag"
        :class="`direction-tag--${tone}`"
        :title="displayLabel"
    >
        {{ displayLabel }}
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    direction?: string | null;
    label?: string | null;
    emptyText?: string;
}>(), {
    direction: '',
    label: '',
    emptyText: '-',
});

const normalizedDirection = computed(() => String(props.direction || '').trim().toUpperCase());
const displayLabel = computed(() => props.label || normalizedDirection.value || props.emptyText);
const tone = computed(() => {
    if (normalizedDirection.value === 'CREDIT') return 'credit';
    if (normalizedDirection.value === 'DEBIT') return 'debit';
    return 'neutral';
});
</script>

<style scoped>
.direction-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 54px;
    max-width: 100%;
    min-height: 24px;
    padding: 0 8px;
    overflow: hidden;
    border: 1px solid #d8dee8;
    border-radius: 4px;
    background: #f6f8fa;
    color: #667085;
    font-size: 12px;
    font-weight: 650;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.direction-tag--credit {
    border-color: #b9dfca;
    background: #eefaf3;
    color: #15803d;
}

.direction-tag--debit {
    border-color: #efc2bf;
    background: #fff3f2;
    color: #c2413b;
}
</style>

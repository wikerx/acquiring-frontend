<template>
    <div class="transaction-payload-blocks" :class="{ 'is-single-column': singleColumn }">
        <section v-for="block in displayBlocks" :key="block.title" class="transaction-payload-blocks__section">
            <div class="transaction-payload-blocks__title">
                <span>{{ block.title }}</span>
                <CopyableText v-if="block.text" :value="block.text" :label="block.title" icon-only />
            </div>
            <pre>{{ block.text || block.emptyText }}</pre>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CopyableText from './CopyableText.vue';

const props = defineProps<{
    blocks: { title: string; value: unknown; emptyText?: string }[];
    singleColumn?: boolean;
}>();

const displayBlocks = computed(() => props.blocks.map((block) => ({
    ...block,
    text: formatPayload(block.value),
})));

function formatPayload(value: unknown) {
    if (value == null || value === '') {
        return '';
    }
    if (typeof value !== 'string') {
        return JSON.stringify(value, null, 2);
    }
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            return JSON.stringify(JSON.parse(trimmed), null, 2);
        } catch {
            return value;
        }
    }
    return value;
}
</script>

<style scoped>
.transaction-payload-blocks {
    display: grid;
    align-items: start;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    min-width: 0;
}

.transaction-payload-blocks.is-single-column {
    grid-template-columns: minmax(0, 1fr);
}

.transaction-payload-blocks__section {
    min-width: 0;
}

.transaction-payload-blocks__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border: 1px solid #1e293b;
    border-bottom: 0;
    border-radius: 8px 8px 0 0;
    padding: 8px 10px;
    background: #111827;
    color: #dbeafe;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.5;
}

pre {
    overflow: auto;
    max-height: 420px;
    margin: 0;
    border: 1px solid #1e293b;
    border-radius: 0 0 8px 8px;
    padding: 12px 14px;
    background: #0b1120;
    color: #e2e8f0;
    font-size: 12px;
    line-height: 1.55;
    tab-size: 2;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

@media (max-width: 900px) {
    .transaction-payload-blocks {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>

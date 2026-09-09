<template>
    <el-tooltip
        :disabled="displayText === '-'"
        effect="dark"
        placement="top"
        :show-after="300"
    >
        <template #content>
            <span class="merchant-identity-tooltip__content">{{ displayText }}</span>
        </template>
        <button
            v-if="clickable && merchantId"
            type="button"
            class="merchant-identity merchant-identity--button"
            @click="$emit('click')"
        >
            {{ displayText }}
        </button>
        <span v-else class="merchant-identity">{{ displayText }}</span>
    </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    merchantId?: string | number | null;
    merchantName?: string | null;
    clickable?: boolean;
}>(), {
    merchantId: '',
    merchantName: '',
    clickable: false,
});

defineEmits<{ click: [] }>();

const displayText = computed(() => {
    const merchantId = String(props.merchantId ?? '').trim();
    const merchantName = String(props.merchantName ?? '').trim();
    if (merchantId && merchantName && merchantName !== merchantId) return `${merchantId}（${merchantName}）`;
    return merchantId || merchantName || '-';
});
</script>

<style scoped>
.merchant-identity {
    display: inline-block;
    overflow: hidden;
    max-width: 100%;
    color: inherit;
    font-size: inherit;
    line-height: 1.5;
    text-overflow: ellipsis;
    vertical-align: middle;
    white-space: nowrap;
}

.merchant-identity--button {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--el-color-primary, #2563eb);
    cursor: pointer;
}

.merchant-identity--button:hover,
.merchant-identity--button:focus-visible { text-decoration: underline; }

.merchant-identity--button:focus-visible {
    border-radius: 2px;
    outline: 2px solid color-mix(in srgb, var(--el-color-primary, #2563eb) 28%, transparent);
    outline-offset: 2px;
}

.merchant-identity-tooltip__content {
    display: block;
    max-width: min(380px, calc(100vw - 32px));
    line-height: 1.6;
    overflow-wrap: anywhere;
}
</style>

<template>
    <div
        class="admin-linear-tabs"
        :class="[
            `admin-linear-tabs--${size}`,
            { 'admin-linear-tabs--stretch': stretch },
        ]"
        role="tablist"
        :aria-label="ariaLabel || undefined"
    >
        <button
            v-for="item in items"
            :key="item.value"
            type="button"
            role="tab"
            class="admin-linear-tabs__item"
            :class="{ 'is-active': modelValue === item.value }"
            :aria-selected="modelValue === item.value"
            :tabindex="modelValue === item.value ? 0 : -1"
            :disabled="item.disabled"
            @click="selectTab(item)"
            @keydown="handleKeydown"
        >
            <el-icon v-if="item.icon" class="admin-linear-tabs__icon" aria-hidden="true">
                <component :is="item.icon" />
            </el-icon>
            <span class="admin-linear-tabs__label">{{ item.label }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

interface AdminLinearTabOption {
    value: string;
    label: string;
    icon?: Component;
    disabled?: boolean;
}

withDefaults(defineProps<{
    modelValue: string;
    items: AdminLinearTabOption[];
    stretch?: boolean;
    size?: 'default' | 'compact';
    ariaLabel?: string;
}>(), {
    stretch: true,
    size: 'default',
    ariaLabel: '',
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string];
}>();

function selectTab(item: AdminLinearTabOption) {
    if (item.disabled) {
        return;
    }
    emit('update:modelValue', item.value);
    emit('change', item.value);
}

function handleKeydown(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return;
    }
    event.preventDefault();
    const enabledItems = event.currentTarget instanceof HTMLElement
        ? Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('.admin-linear-tabs__item:not(:disabled)') || [])
        : [];
    if (!enabledItems.length) {
        return;
    }
    const current = enabledItems.indexOf(event.currentTarget as HTMLButtonElement);
    const next = event.key === 'Home'
        ? 0
        : event.key === 'End'
            ? enabledItems.length - 1
            : (current + (event.key === 'ArrowRight' ? 1 : -1) + enabledItems.length) % enabledItems.length;
    enabledItems[next]?.focus();
    enabledItems[next]?.click();
}
</script>

<style scoped>
.admin-linear-tabs {
    display: flex;
    width: 100%;
    min-width: 0;
    min-height: 48px;
    align-items: stretch;
    overflow-x: auto;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-blank);
    scrollbar-width: none;
}

.admin-linear-tabs::-webkit-scrollbar {
    display: none;
}

.admin-linear-tabs__item {
    position: relative;
    display: inline-flex;
    min-width: 120px;
    min-height: 48px;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 22px;
    border: 0;
    background: transparent;
    color: var(--el-text-color-regular);
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    transition: color 160ms ease, background-color 160ms ease;
}

.admin-linear-tabs--stretch .admin-linear-tabs__item {
    min-width: 128px;
    flex: 1 0 0;
}

.admin-linear-tabs--compact {
    width: auto;
    min-height: 36px;
}

.admin-linear-tabs--compact .admin-linear-tabs__item {
    min-width: 112px;
    min-height: 36px;
    gap: 6px;
    padding: 0 16px;
    font-size: 13px;
}

.admin-linear-tabs--compact .admin-linear-tabs__item::after {
    right: 12px;
    left: 12px;
}

.admin-linear-tabs--compact .admin-linear-tabs__icon {
    width: 16px;
    height: 16px;
    flex-basis: 16px;
    font-size: 16px;
}

.admin-linear-tabs__item::after {
    position: absolute;
    right: 18px;
    bottom: -1px;
    left: 18px;
    height: 2px;
    background: var(--el-color-primary);
    content: "";
    opacity: 0;
    transform: scaleX(0.55);
    transition: opacity 160ms ease, transform 160ms ease;
}

.admin-linear-tabs__item:hover:not(:disabled) {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
}

.admin-linear-tabs__item.is-active {
    color: var(--el-color-primary);
    font-weight: 600;
}

.admin-linear-tabs__item.is-active::after {
    opacity: 1;
    transform: scaleX(1);
}

.admin-linear-tabs__item:focus-visible {
    border-radius: 4px;
    outline: 2px solid var(--el-color-primary-light-5);
    outline-offset: -4px;
}

.admin-linear-tabs__item:disabled {
    color: var(--el-text-color-disabled);
    cursor: not-allowed;
}

.admin-linear-tabs__icon {
    width: 19px;
    height: 19px;
    flex: 0 0 19px;
    font-size: 19px;
}

.admin-linear-tabs__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
    .admin-linear-tabs__item,
    .admin-linear-tabs__item::after {
        transition: none;
    }
}
</style>

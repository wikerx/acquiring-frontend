<template>
    <div class="vexra-brand-logo" :class="[variantClass, { compact }]">
        <img
            v-if="showIcon"
            class="vexra-brand-logo__icon"
            :src="brand.logos.icon"
            :alt="brand.name"
        />
        <img
            v-if="showHorizontal"
            class="vexra-brand-logo__horizontal"
            :src="brand.logos.horizontal"
            :alt="brand.name"
        />
        <div v-if="showText" class="vexra-brand-logo__text">
            <strong>{{ brand.name }}</strong>
            <small>{{ subtitle }}</small>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getSystemBrand, type VexraSystemKey } from '../brand';

const props = withDefaults(
    defineProps<{
        system: VexraSystemKey;
        mode?: 'full' | 'icon' | 'lockup' | 'text';
        locale?: 'zh-CN' | 'en-US';
        compact?: boolean;
    }>(),
    {
        mode: 'full',
        locale: 'en-US',
        compact: false,
    },
);

const brand = computed(() => getSystemBrand(props.system));
const subtitle = computed(() =>
    props.locale === 'zh-CN' ? brand.value.subtitleZh : brand.value.subtitleEn,
);
const variantClass = computed(() => `vexra-brand-logo--${props.mode}`);
const showIcon = computed(() => props.mode === 'icon' || props.mode === 'lockup');
const showHorizontal = computed(() => props.mode === 'full');
const showText = computed(() => props.mode === 'text' || props.mode === 'lockup');
</script>

<style scoped>
.vexra-brand-logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.vexra-brand-logo.compact {
    gap: 8px;
}

.vexra-brand-logo__icon {
    width: 28px;
    height: 28px;
    display: block;
    flex: 0 0 auto;
}

.vexra-brand-logo.compact .vexra-brand-logo__icon {
    width: 24px;
    height: 24px;
}

.vexra-brand-logo__horizontal {
    display: block;
    height: 26px;
    width: auto;
    max-width: 100%;
}

.vexra-brand-logo.compact .vexra-brand-logo__horizontal {
    height: 22px;
}

.vexra-brand-logo__text {
    display: grid;
    gap: 2px;
    min-width: 0;
}

.vexra-brand-logo__text strong {
    font-size: 14px;
    line-height: 1.1;
    white-space: nowrap;
}

.vexra-brand-logo__text small {
    font-size: 11px;
    line-height: 1.1;
    color: #64748b;
    white-space: nowrap;
}
</style>

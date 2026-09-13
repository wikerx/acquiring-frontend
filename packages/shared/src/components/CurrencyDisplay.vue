<template>
    <span
        class="currency-display"
        :class="[`currency-display--${size}`, `currency-display--${variant}`]"
        :title="titleText"
    >
        <span
            class="currency-display__mark"
            :class="`is-${presentation.iconType}`"
            aria-hidden="true"
        >{{ presentation.iconText }}</span>
        <span v-if="!iconOnly" class="currency-display__content">
            <strong>{{ presentation.alphabeticCode }}</strong>
            <small v-if="showName">{{ presentation.displayName }}</small>
        </span>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveCurrencyPresentation } from '../currencyPresentation';

const props = withDefaults(defineProps<{
    currency?: string | null;
    iconKey?: string | null;
    chineseName?: string | null;
    englishName?: string | null;
    currencySymbol?: string | null;
    locale?: string;
    showName?: boolean;
    iconOnly?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'plain' | 'soft';
}>(), {
    currency: '',
    locale: 'zh-CN',
    showName: false,
    size: 'sm',
    variant: 'plain',
});

const presentation = computed(() => resolveCurrencyPresentation(props.currency, props.locale, {
    iconKey: props.iconKey,
    chineseName: props.chineseName,
    englishName: props.englishName,
    currencySymbol: props.currencySymbol,
}));
const titleText = computed(() => [
    presentation.value.alphabeticCode,
    presentation.value.displayName,
].filter((value, index, values) => value && values.indexOf(value) === index).join(' · '));
</script>

<style scoped>
.currency-display {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 0;
    max-width: 100%;
    color: #17243a;
    vertical-align: middle;
}

.currency-display__mark {
    display: inline-grid;
    width: 26px;
    height: 26px;
    flex: 0 0 auto;
    overflow: hidden;
    border: 1px solid #d8e2ee;
    border-radius: 50%;
    place-items: center;
    background: #fff;
    box-shadow: 0 1px 3px rgb(15 23 42 / 10%);
    font-family: Inter, "PingFang SC", sans-serif;
    font-size: 16px;
    font-weight: 800;
    line-height: 1;
}

.currency-display__mark.is-flag {
    background: #f8fafc;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
}

.currency-display__mark.is-currency {
    border-color: #bfd3f3;
    color: #1d5db8;
    background: #edf5ff;
    font-size: 9px;
}

.currency-display__content {
    display: grid;
    min-width: 0;
    line-height: 1.1;
    text-align: left;
}

.currency-display__content strong {
    overflow: hidden;
    font-size: 12px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.currency-display__content small {
    overflow: hidden;
    margin-top: 3px;
    color: #718096;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.currency-display--soft {
    padding: 4px 8px 4px 5px;
    border: 1px solid #d9e6f5;
    border-radius: 5px;
    background: #f8fbff;
}

.currency-display--xs { gap: 5px; }
.currency-display--xs .currency-display__mark { width: 19px; height: 19px; font-size: 12px; }
.currency-display--xs .currency-display__mark.is-currency { font-size: 7px; }
.currency-display--xs .currency-display__content strong { font-size: 10px; }
.currency-display--sm .currency-display__mark { width: 23px; height: 23px; font-size: 14px; }
.currency-display--sm .currency-display__mark.is-currency { font-size: 8px; }
.currency-display--md .currency-display__mark { width: 30px; height: 30px; font-size: 19px; }
.currency-display--md .currency-display__mark.is-currency { font-size: 10px; }
.currency-display--md .currency-display__content strong { font-size: 13px; }
.currency-display--lg { gap: 9px; }
.currency-display--lg .currency-display__mark { width: 38px; height: 38px; font-size: 24px; }
.currency-display--lg .currency-display__mark.is-currency { font-size: 12px; }
.currency-display--lg .currency-display__content strong { font-size: 16px; }
.currency-display--lg .currency-display__content small { font-size: 10px; }
</style>

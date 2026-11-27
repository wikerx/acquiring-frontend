<template>
    <span v-if="unrestricted">{{ unrestrictedLabel }}</span>
    <span v-else-if="!countries.length">—</span>
    <div v-else class="country-scope">
        <span v-for="country in preview" :key="country.code" class="country-chip">
            <span v-if="country.flag" aria-hidden="true">{{ country.flag }}</span>
            <span>{{ country.name }}</span>
            <span v-if="country.name !== country.code" class="country-chip__code">{{ country.code }}</span>
        </span>
        <el-tooltip v-if="remaining" :content="fullScope">
            <span class="country-chip" tabindex="0" :aria-label="fullScope">+{{ remaining }}</span>
        </el-tooltip>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { IsoCountry } from '@/api/base/country';

const props = defineProps<{
    scope?: string;
    options: IsoCountry[];
    unrestrictedLabel: string;
}>();
const { locale } = useI18n();
const unrestricted = computed(() => props.scope?.trim().toUpperCase() === 'ALL');
const directory = computed(() => {
    const byCode = new Map<string, IsoCountry>();
    for (const option of props.options) {
        byCode.set(option.alpha2Code?.toUpperCase(), option);
        byCode.set(option.alpha3Code?.toUpperCase(), option);
    }
    return byCode;
});

const countries = computed(() => {
    if (unrestricted.value) return [];
    const codes = (props.scope || '').split(',').map((code) => code.trim().toUpperCase());
    return [...new Set(codes.filter((code) => code && code !== 'NONE'))].map((code) => {
        const info = directory.value.get(code);
        const name = locale.value.startsWith('en') ? info?.englishName : info?.chineseName;
        return { code, name: name || code, flag: info?.flagEmoji };
    });
});
const preview = computed(() => countries.value.slice(0, 3));
const remaining = computed(() => countries.value.length - preview.value.length);
const fullScope = computed(() => countries.value.map(({ name, code }) => name === code ? code : `${name} (${code})`).join(', '));
</script>

<style scoped>
.country-scope {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
}

.country-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 5px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    font-size: 12px;
    line-height: 18px;
    white-space: nowrap;
}

.country-chip__code {
    color: var(--el-text-color-secondary);
    font-size: 11px;
}
</style>

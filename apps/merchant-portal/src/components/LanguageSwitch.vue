<template>
    <el-dropdown trigger="click" @command="handleSwitch">
        <span class="merchant-lang-trigger">
            {{ currentFlag }} {{ currentLabel }}
        </span>
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item
                    v-for="lang in languages"
                    :key="lang.value"
                    :command="lang.value"
                    :class="{ 'is-active': currentLang === lang.value }"
                >
                    {{ lang.flag }} {{ lang.label }}
                </el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLocale } from '@/i18n';

type MerchantLocale = 'zh-CN' | 'en-US';

const languages = [
    { value: 'zh-CN', flag: '🇨🇳', label: '简体中文' },
    { value: 'en-US', flag: '🇺🇸', label: 'English' },
];

const { locale } = useI18n();
const currentLang = computed(() => locale.value);
const currentFlag = computed(() => languages.find((l) => l.value === currentLang.value)?.flag || '');
const currentLabel = computed(() => languages.find((l) => l.value === currentLang.value)?.label || '');

function handleSwitch(lang: string) {
    setLocale(lang as MerchantLocale);
}
</script>

<style scoped>
.merchant-lang-trigger {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 13px;
    color: #4b5563;
    cursor: pointer;
    user-select: none;
    padding: 0 4px;
}

.merchant-lang-trigger:hover {
    color: #059669;
}

.el-dropdown-menu__item.is-active {
    color: #059669;
    font-weight: 600;
}
</style>

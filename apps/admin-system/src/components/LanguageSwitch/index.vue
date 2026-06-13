<template>
    <el-dropdown trigger="click" @command="handleSwitch">
        <span class="lang-trigger">
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

const languages = [
    { value: 'zh-CN', flag: '🇨🇳', label: '简体中文' },
    { value: 'en-US', flag: '🇺🇸', label: 'English' },
];

const { locale } = useI18n();
const currentLang = computed(() => locale.value);
const currentFlag = computed(() => languages.find((l) => l.value === currentLang.value)?.flag || '');
const currentLabel = computed(() => languages.find((l) => l.value === currentLang.value)?.label || '');

function handleSwitch(lang: string) {
    setLocale(lang);
}
</script>

<style scoped>
.lang-trigger {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    user-select: none;
    padding: 0 4px;
}

.lang-trigger:hover {
    color: var(--app-primary, #409eff);
}

.el-dropdown-menu__item.is-active {
    color: var(--app-primary, #409eff);
    font-weight: 600;
}
</style>

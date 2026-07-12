<template>
    <el-config-provider :locale="elLocale">
        <RouterView />
    </el-config-provider>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import { useSettingsStore } from '@/store';
import { applyNavigationMode, applyNavigationTheme, applyThemeColor } from '@/utils/theme';

const { locale } = useI18n();
const elLocale = computed(() => locale.value === 'en-US' ? en : zhCn);

const settings = useSettingsStore();

// Apply theme tokens on app start.
applyThemeColor(settings.themeColor);
applyNavigationTheme(settings.sideTheme);
applyNavigationMode(settings.layoutMode);

watch(() => settings.themeColor, (color) => {
    applyThemeColor(color);
});

watch(() => settings.sideTheme, (theme) => {
    applyNavigationTheme(theme);
});

watch(() => settings.layoutMode, (mode) => {
    applyNavigationMode(mode);
});
</script>

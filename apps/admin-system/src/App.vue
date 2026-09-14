<template>
  <el-config-provider :locale="elLocale">
    <RouterView />
  </el-config-provider>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute } from 'vue-router';
  import zhCn from 'element-plus/es/locale/lang/zh-cn';
  import en from 'element-plus/es/locale/lang/en';
  import { useSettingsStore } from '@/store';
  import { updateAdminDocumentTitle } from '@/utils/document-title';
  import {
    applyAppearancePreset,
    applyNavigationMode,
    applyNavigationTheme,
    applyThemeColor,
  } from '@/utils/theme';

  const { locale } = useI18n();
  const route = useRoute();
  const elLocale = computed(() => (locale.value === 'en-US' ? en : zhCn));

  const settings = useSettingsStore();

  // Apply theme tokens on app start.
  applyThemeColor(settings.themeColor);
  applyNavigationTheme(settings.sideTheme);
  applyNavigationMode(settings.layoutMode);
  applyAppearancePreset(settings.appearancePreset);

  watch(
    () => settings.themeColor,
    (color) => {
      applyThemeColor(color);
    },
  );

  watch(
    () => settings.sideTheme,
    (theme) => {
      applyNavigationTheme(theme);
    },
  );

  watch(
    () => settings.layoutMode,
    (mode) => {
      applyNavigationMode(mode);
    },
  );

  watch(
    () => settings.appearancePreset,
    (preset) => {
      applyAppearancePreset(preset);
    },
  );

  watch(
    [locale, () => route.fullPath],
    () => {
      updateAdminDocumentTitle(route.meta);
    },
    { immediate: true },
  );
</script>

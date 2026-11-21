<template>
    <el-config-provider :locale="elLocale">
        <RouterView />
        <FeedbackHost />
    </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import FeedbackHost from './components/FeedbackHost.vue';
import { useDialogFooterLayout } from './composables/useDialogFooterLayout';

const { locale } = useI18n();
useDialogFooterLayout();
const elLocale = computed(() => locale.value === 'en-US' ? en : zhCn);
</script>

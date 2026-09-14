<template>
    <el-alert
        v-if="capability && capability.status !== 'AVAILABLE'"
        :title="displayTitle"
        :description="capability.reason || $t('monitor.workbench.capability.notConfigured')"
        type="info"
        show-icon
        :closable="false"
        class="monitor-capability-alert"
    />
</template>

<script setup lang="ts">
/** 显式展示可选监控提供方未配置或不可用原因，避免把能力缺失误判为空数据。 */
import { computed } from 'vue';
import type { ProviderCapability } from '@/api/monitor/workbench';

const props = defineProps<{ capability?: ProviderCapability; title?: string }>();
const displayTitle = computed(() => [
    props.title || props.capability?.provider,
    props.capability?.status,
].filter(Boolean).join(' · '));
</script>

<style scoped>
.monitor-capability-alert { margin-bottom: 16px; }
</style>

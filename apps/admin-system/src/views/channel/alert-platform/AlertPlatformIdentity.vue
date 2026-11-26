<template>
    <span class="platform-identity" :class="{ 'platform-identity--compact': compact }">
        <PrivateImage v-if="platform?.logoVersion" class="platform-logo" :version="platform.logoVersion" :load="loadLogo"
            alt="" />
        <span class="platform-name" :title="name">{{ name }}</span>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PrivateImage } from '@acquiring/shared';
import { loadAlertPlatformLogo, type AlertPlatform } from '@/api/channel/disputeAlert';

const props = defineProps<{ platform?: Pick<AlertPlatform, 'id' | 'name' | 'logoVersion'>; fallback?: string; compact?: boolean }>();
const name = computed(() => props.platform?.name || props.fallback || '—');
async function loadLogo(): Promise<Blob> {
    if (!props.platform?.logoVersion) throw new Error('Platform logo is unavailable');
    return loadAlertPlatformLogo(props.platform.id);
}
</script>

<style scoped>
.platform-identity {
    display: inline-flex;
    max-width: 100%;
    min-width: 0;
    align-items: center;
    gap: 6px;
    vertical-align: middle;
}
.platform-logo {
    width: 44px;
    height: 26px;
}
.platform-identity--compact .platform-logo {
    width: 32px;
    height: 20px;
}
.platform-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>

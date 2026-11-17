<template>
    <ChannelDisplay :name="name" :fallback="fallback" :version="resolved?.logoVersion" :image-key="imageKey"
        :load="loadLogo" :size="size" :loading="loading" :preview="preview">
        <slot>{{ fallback }}</slot>
    </ChannelDisplay>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChannelDisplay } from '@acquiring/shared';
import { useUserStore } from '@/store/modules/user';
import { channelPresentationSource, type ChannelPresentationScope } from '@/api/channel/presentation';
import { localizedChannelName, type ChannelPresentation } from '@/api/channel/channelPresentationSource';

const props = withDefaults(defineProps<{
    record?: { channelId?: number; channelCode?: string } | null;
    channelId?: number; channelCode?: string; fallback: string; scope: ChannelPresentationScope;
    size?: 'list' | 'detail'; presentation?: ChannelPresentation; preview?: boolean;
}>(), { size: 'list', preview: false });
const user = useUserStore();
const { locale } = useI18n();
const resolved = ref<ChannelPresentation | null>(null);
const loading = ref(false);
let generation = 0;
const source = computed(() => user.account ? channelPresentationSource(user.account, props.scope) : null);
const imageKey = computed(() => `${user.account?.accountId || ''}:${props.scope}:${resolved.value?.id || ''}`);
const name = computed(() => localizedChannelName(resolved.value, String(locale.value), props.fallback));
watch([() => props.record, () => props.record?.channelId, () => props.record?.channelCode,
    () => props.channelId, () => props.channelCode, () => props.presentation, source], async () => {
    const current = ++generation;
    resolved.value = null;
    loading.value = false;
    if (!source.value) return;
    if (props.presentation) { resolved.value = props.presentation; return; }
    const reference = { id: props.channelId ?? props.record?.channelId, code: props.channelCode ?? props.record?.channelCode };
    if (!reference.id && !reference.code) return;
    loading.value = true;
    try {
        const value = await source.value.resolve(reference);
        if (current === generation) resolved.value = value;
    } catch { /* 未授权、已删除或不可用时保持原文字，不提升调用页面权限。 */ }
    finally { if (current === generation) loading.value = false; }
}, { immediate: true });
async function loadLogo() {
    const item = resolved.value;
    if (!source.value || !item?.logoVersion) throw new Error('Channel image unavailable');
    return source.value.loadLogo(item.id, item.logoVersion);
}
onBeforeUnmount(() => { generation++; });
</script>

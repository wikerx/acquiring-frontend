<template>
    <span class="channel-display" :class="{ 'is-detail': size === 'detail' }">
        <el-tooltip v-if="loading || (version && state !== 'error')" :content="name" :disabled="!name" :trigger="['hover', 'focus']" placement="top">
            <span class="channel-display__frame" :class="{ 'is-previewable': preview && state === 'ready' }"
                :role="preview ? 'button' : 'img'" :aria-label="name" :aria-busy="loading || state === 'loading'" tabindex="0"
                @click="openPreview" @keydown.enter.prevent="openPreview" @keydown.space.prevent="openPreview">
                <img v-if="url" :src="url" :alt="name" :class="{ 'is-ready': state === 'ready' }" @load="imageState($event, 'ready')" @error="imageState($event, 'error')" />
                <span v-if="loading || state === 'loading'" class="channel-display__placeholder" aria-hidden="true" />
            </span>
        </el-tooltip>
        <span v-else class="channel-display__fallback"><slot>{{ fallback }}</slot></span>
        <el-image-viewer v-if="viewerVisible && url" :url-list="[url]" teleported @close="viewerVisible = false" />
    </span>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
const props = withDefaults(defineProps<{
    name: string; fallback: string; version?: string | null; imageKey?: string;
    load: () => Promise<Blob>; size?: 'list' | 'detail'; loading?: boolean; preview?: boolean;
}>(), { size: 'list', loading: false, imageKey: '', preview: false });
const url = ref('');
const viewerVisible = ref(false);
const state = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
let generation = 0;
function release() { viewerVisible.value = false; if (url.value) URL.revokeObjectURL(url.value); url.value = ''; }
function openPreview() { if (props.preview && state.value === 'ready') viewerVisible.value = true; }
function imageState(event: Event, value: 'ready' | 'error') {
    if ((event.target as HTMLImageElement).src === url.value) state.value = value;
}
watch([() => props.version, () => props.imageKey], async ([version]) => {
    const current = ++generation;
    release();
    state.value = version ? 'loading' : 'idle';
    if (!version) return;
    try {
        const blob = await props.load();
        if (current !== generation) return;
        if (blob.type !== 'image/png') { state.value = 'error'; return; }
        url.value = URL.createObjectURL(blob);
    } catch { if (current === generation) state.value = 'error'; }
}, { immediate: true });
onBeforeUnmount(() => { generation++; release(); });
</script>
<style scoped>
.channel-display { display: inline-flex; min-height: 28px; max-width: 100%; align-items: center; vertical-align: middle; }
.channel-display__frame { position: relative; display: inline-flex; flex: 0 0 72px; width: 72px; height: 28px; align-items: center; justify-content: center; vertical-align: middle; }
.channel-display.is-detail { min-height: 36px; }
.channel-display.is-detail .channel-display__frame { width: 96px; height: 36px; flex-basis: 96px; }
.channel-display__frame img { display: block; width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain; opacity: 0; }
.channel-display__frame img.is-ready { opacity: 1; }
.channel-display__frame.is-previewable { cursor: zoom-in; }
.channel-display__frame:focus-visible { outline: 2px solid var(--el-color-primary, #2864ed); outline-offset: 3px; border-radius: 4px; }
.channel-display__placeholder { position: absolute; inset: 0; border-radius: 4px; background: var(--el-fill-color-light, #f5f7fa); }
.channel-display__fallback { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
</style>

<template>
    <el-image v-if="url" class="private-image" :class="{ 'is-round': round }" :src="url" :alt="alt" :fit="round ? 'cover' : 'contain'" :preview-src-list="preview ? [url] : []" preview-teleported>
        <template #error><span class="private-image__fallback">{{ fallback }}</span></template>
    </el-image>
    <span v-else class="private-image private-image__fallback" :class="{ 'is-round': round }" :aria-label="alt">{{ fallback }}</span>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
const props = withDefaults(defineProps<{ version?: string | null; load: () => Promise<Blob>; alt: string; fallback?: string; round?: boolean; preview?: boolean }>(), { fallback: '—', round: false, preview: false });
const url = ref('');
let generation = 0;
watch(() => props.version, async (version) => {
    const current = ++generation;
    if (url.value) URL.revokeObjectURL(url.value);
    url.value = '';
    if (!version) return;
    try {
        const blob = await props.load();
        if (current !== generation || blob.type !== 'image/png') return;
        url.value = URL.createObjectURL(blob);
    } catch { /* 私有图片读取失败时显示占位，不替换或泄露其他用户的图片。 */ }
}, { immediate: true });
onBeforeUnmount(() => { generation++; if (url.value) URL.revokeObjectURL(url.value); });
</script>
<style scoped>
.private-image { display: inline-flex; flex-shrink: 0; width: 100%; height: 100%; overflow: hidden; vertical-align: middle; border-radius: 6px; }
.private-image.is-round { border-radius: 50%; }
.private-image__fallback { align-items: center; justify-content: center; color: inherit; font-size: inherit; background: transparent; }
</style>

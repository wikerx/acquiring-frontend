<template>
    <span
        class="file-type-icon"
        :class="[`file-type-icon--${tone}`, `file-type-icon--${size}`]"
        aria-hidden="true"
    >
        <el-icon><Document /></el-icon>
        <small>{{ label }}</small>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Document } from '@element-plus/icons-vue';

const props = withDefaults(defineProps<{
    extension?: string;
    size?: 'sm' | 'md';
}>(), {
    extension: '',
    size: 'sm',
});

const normalizedExtension = computed(() => props.extension.trim().toLowerCase());
const label = computed(() => (normalizedExtension.value || 'file').slice(0, 4).toUpperCase());
const tone = computed(() => {
    if (['xls', 'xlsx', 'csv'].includes(normalizedExtension.value)) return 'sheet';
    if (normalizedExtension.value === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(normalizedExtension.value)) return 'document';
    if (normalizedExtension.value === 'json') return 'json';
    if (normalizedExtension.value === 'zip') return 'archive';
    return 'generic';
});
</script>

<style scoped>
.file-type-icon {
    --file-type-color: var(--el-color-info);
    --file-type-background: var(--el-fill-color-light);
    position: relative;
    display: inline-grid;
    flex: 0 0 auto;
    place-items: center;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--file-type-color) 22%, transparent);
    border-radius: 6px;
    background: var(--file-type-background);
    color: var(--file-type-color);
}

.file-type-icon .el-icon { font-size: 20px; transform: translateY(-3px); }
.file-type-icon small {
    position: absolute;
    right: 2px;
    bottom: 2px;
    left: 2px;
    overflow: hidden;
    font-size: 7px;
    font-weight: 600;
    line-height: 10px;
    text-align: center;
    text-overflow: clip;
    white-space: nowrap;
}

.file-type-icon--sm { width: 34px; height: 38px; }
.file-type-icon--md { width: 42px; height: 46px; }
.file-type-icon--md .el-icon { font-size: 24px; }
.file-type-icon--md small { font-size: 8px; line-height: 11px; }
.file-type-icon--sheet { --file-type-color: var(--el-color-success); --file-type-background: var(--el-color-success-light-9); }
.file-type-icon--pdf { --file-type-color: var(--el-color-danger); --file-type-background: var(--el-color-danger-light-9); }
.file-type-icon--document { --file-type-color: var(--el-color-primary); --file-type-background: var(--el-color-primary-light-9); }
.file-type-icon--json { --file-type-color: var(--el-color-warning); --file-type-background: var(--el-color-warning-light-9); }
.file-type-icon--archive { --file-type-color: var(--el-color-warning); --file-type-background: var(--el-color-warning-light-9); }
</style>

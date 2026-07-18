<template>
    <el-tooltip :content="tooltipText" placement="top">
        <button
            class="copyable-text"
            type="button"
            :class="{ 'is-wrap': wrap, 'is-icon-only': iconOnly }"
            :disabled="!copyValue"
            :aria-label="tooltipText"
            @click.stop="copyText"
        >
            <span v-if="!iconOnly">{{ displayValue }}</span>
            <el-icon v-if="copyValue || iconOnly"><CopyDocument /></el-icon>
        </button>
    </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { CopyDocument } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
    value?: string | number | null;
    label?: string;
    wrap?: boolean;
    iconOnly?: boolean;
}>();

const { t } = useI18n();

const copyValue = computed(() => {
    if (props.value === undefined || props.value === null || props.value === '') {
        return '';
    }
    return String(props.value);
});

const displayValue = computed(() => copyValue.value || '-');

const tooltipText = computed(() => copyValue.value ? t('common.copyTip') : '-');

async function copyText() {
    if (!copyValue.value) {
        return;
    }
    await writeClipboard(copyValue.value);
    ElMessage.success(t('common.copySuccess', { name: props.label || copyValue.value }));
}

async function writeClipboard(value: string) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', 'true');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
}
</script>

<style scoped>
.copyable-text {
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--el-color-primary);
    cursor: pointer;
    font: inherit;
    line-height: inherit;
}

.copyable-text:disabled {
    color: var(--el-text-color-secondary);
    cursor: default;
}

.copyable-text span {
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.copyable-text.is-wrap {
    justify-content: flex-start;
    text-align: left;
}

.copyable-text.is-wrap span {
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-all;
}

.copyable-text.is-icon-only {
    width: 22px;
    height: 22px;
    justify-content: center;
    border-radius: 4px;
    color: var(--el-text-color-secondary);
}

.copyable-text.is-icon-only:hover:not(:disabled) {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
}

.copyable-text .el-icon {
    flex: 0 0 auto;
    font-size: 13px;
}
</style>

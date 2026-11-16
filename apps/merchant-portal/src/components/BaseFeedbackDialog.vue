<template>
    <el-dialog
        :model-value="modelValue"
        :title="title"
        class="base-feedback-dialog"
        :width="width"
        append-to-body
        align-center
        :close-on-click-modal="false"
        :close-on-press-escape="!loading"
        :show-close="!loading"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <div class="base-feedback-dialog__content" :class="[`is-${tone}`, `is-align-${contentAlign}`]">
            <span class="base-feedback-dialog__icon" aria-hidden="true"><el-icon><component :is="icon" /></el-icon></span>
            <div class="base-feedback-dialog__copy">
                <p v-if="message" class="base-feedback-dialog__message">{{ message }}</p>
                <p v-if="description" class="base-feedback-dialog__description">{{ description }}</p>
                <slot />
            </div>
        </div>
        <template #footer>
            <slot name="footer">
                <div class="dialog-footer">
                    <el-button v-if="showCancel" :disabled="loading" @click="emit('update:modelValue', false)">{{ cancelText }}</el-button>
                    <el-button :type="tone === 'danger' ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">{{ confirmText }}</el-button>
                </div>
            </slot>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CircleCheck, CircleClose, Delete, InfoFilled, QuestionFilled, WarningFilled } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

type Tone = 'question' | 'info' | 'success' | 'warning' | 'error' | 'danger';
const props = withDefaults(defineProps<{
    modelValue: boolean;
    title: string;
    message?: string;
    description?: string;
    tone?: Tone;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    loading?: boolean;
    width?: string | number;
    contentAlign?: 'center' | 'start';
}>(), { tone: 'info', showCancel: true, loading: false, width: '492px', contentAlign: 'center' });
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; confirm: [] }>();
const { t } = useI18n();
const confirmText = computed(() => props.confirmText || t('common.confirm'));
const cancelText = computed(() => props.cancelText || t('common.cancel'));
const icon = computed(() => ({ question: QuestionFilled, info: InfoFilled, success: CircleCheck, warning: WarningFilled, error: CircleClose, danger: Delete })[props.tone]);
</script>

<style scoped>
.base-feedback-dialog__content { display: flex; align-items: center; gap: 16px; min-width: 0; }
.base-feedback-dialog__content.is-align-start { align-items: flex-start; }
.base-feedback-dialog__content.is-align-start .base-feedback-dialog__icon { margin-top: 2px; }
.base-feedback-dialog__icon { display: grid; place-items: center; width: 24px; height: 24px; flex: none; color: var(--merchant-primary); font-size: 24px; }
.base-feedback-dialog__content.is-success .base-feedback-dialog__icon { color: var(--el-color-success); }
.base-feedback-dialog__content.is-warning .base-feedback-dialog__icon { color: var(--el-color-warning); }
.base-feedback-dialog__content.is-error .base-feedback-dialog__icon,
.base-feedback-dialog__content.is-danger .base-feedback-dialog__icon { color: var(--el-color-danger); }
.base-feedback-dialog__copy { min-width: 0; flex: 1; overflow-wrap: anywhere; }
.base-feedback-dialog__message { margin: 0; color: var(--merchant-ink); font-size: 15px; font-weight: 600; line-height: 24px; }
.base-feedback-dialog__description { margin: 6px 0 0; color: var(--merchant-muted); font-size: 12.5px; line-height: 20px; }
.base-feedback-dialog__copy :deep(p:last-child) { margin-bottom: 0; }
</style>

<template>
    <BaseFeedbackDialog v-if="request" class="merchant-confirmation-host" :model-value="true" :title="String(request.title || '')" :tone="tone" @opened="focusFirstControl"
        :message="typeof request.message === 'string' ? request.message : ''"
        :confirm-text="request.options.confirmButtonText" :cancel-text="request.options.cancelButtonText"
        :close-on-click-modal="request.options.closeOnClickModal !== false" :close-on-press-escape="request.options.closeOnPressEscape !== false" :show-close="request.options.showClose !== false"
        :show-cancel="request.options.showCancelButton !== false" @confirm="confirm" @update:model-value="finishFeedback(false)">
        <component :is="content" v-if="typeof request.message !== 'string' && request.message" />
        <el-input v-if="request.prompt" v-model="input" :type="request.options.inputType === 'textarea' ? 'textarea' : 'text'"
            :placeholder="request.options.inputPlaceholder" />
        <p v-if="inputError" role="alert">{{ inputError }}</p>
    </BaseFeedbackDialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseFeedbackDialog from './BaseFeedbackDialog.vue';
import { activeFeedback as request, finishFeedback } from '@/utils/feedback';

const input = ref('');
const inputError = ref('');
function focusFirstControl() {
    const selector = request.value?.prompt ? '.merchant-confirmation-host input, .merchant-confirmation-host textarea'
        : '.merchant-confirmation-host .dialog-footer button';
    document.querySelector<HTMLElement>(selector)?.focus();
}
watch(request, value => { input.value = value?.options.inputValue || ''; inputError.value = ''; });
const tone = computed(() => {
    if (request.value?.options.confirmButtonClass?.includes('feedback-danger-button') || request.value?.options.confirmButtonType === 'danger') return 'danger';
    const type = request.value?.options.type;
    return type === 'warning' || type === 'error' || type === 'success' ? type : 'info';
});
const content = () => {
    const message = request.value?.message;
    return typeof message === 'function' ? message({ confirm: () => finishFeedback(true), cancel: () => finishFeedback(false), close: () => finishFeedback(false) }) : message;
};
function confirm() {
    const options = request.value?.options;
    if (request.value?.prompt && options) {
        const validation = options.inputValidator?.(input.value);
        if (options.inputPattern && !options.inputPattern.test(input.value) || validation === false || typeof validation === 'string') {
            inputError.value = typeof validation === 'string' ? validation : options.inputErrorMessage || '';
            return;
        }
    }
    finishFeedback(true, input.value);
}
</script>

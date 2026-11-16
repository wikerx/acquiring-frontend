<template>
    <section class="image-picker" :class="{ 'is-round': round, 'is-dragging': dragging, 'has-error': feedbackError, 'is-processing': processing }" :aria-busy="validating || processing">
        <input ref="input" class="image-picker__input" type="file" accept="image/png,image/jpeg" :disabled="blocked" tabindex="-1" :aria-label="t('media.choose')" @change="choose" />
        <div class="image-picker__drop" :class="{ 'has-image': hasImage }" role="button" :tabindex="blocked ? -1 : 0" :aria-disabled="blocked" :aria-label="t('media.dropImage')" @click="openPicker" @keydown.enter.prevent="openPicker" @keydown.space.prevent="openPicker" @dragover.prevent="dragging = !blocked" @dragleave.prevent="dragging = false" @drop.prevent="drop">
            <template v-if="hasImage">
                <div class="image-picker__preview" :class="{ 'is-round': round }" @click.stop @keydown.stop>
                    <el-image v-if="localUrl" :src="localUrl" :alt="t('media.preview')" :fit="round ? 'cover' : 'contain'" :preview-src-list="[localUrl]" preview-teleported />
                    <PrivateImage v-else :version="version" :load="load" :alt="t('media.preview')" :round="round" fallback="" preview />
                </div>
                <div class="image-picker__file">
                    <strong :title="modelValue?.name || t('media.currentImage')">{{ modelValue?.name || t('media.currentImage') }}</strong>
                    <span>{{ modelValue ? fileSize : t('media.previewHint') }}</span>
                    <span class="image-picker__state" :class="{ 'is-saved': !modelValue }"><el-icon><Clock v-if="modelValue" /><CircleCheck v-else /></el-icon>{{ modelValue ? t('media.selected') : t('media.uploaded') }}</span>
                </div>
            </template>
            <template v-else>
                <span class="image-picker__upload-icon"><el-icon><UploadFilled /></el-icon></span>
                <strong>{{ t('media.dropImage') }}</strong>
                <span class="image-picker__formats">{{ t('media.hint') }}</span>
            </template>
        </div>
        <footer class="image-picker__footer">
            <div class="image-picker__feedback" :class="{ 'is-error': feedbackError }" :role="feedbackError ? 'alert' : 'status'" aria-live="polite">
                <el-icon :class="{ 'is-loading': validating || processing }"><Warning v-if="feedbackError" /><Loading v-else-if="validating || processing" /><InfoFilled v-else /></el-icon>
                <span v-if="feedbackError" class="image-picker__error">{{ feedbackError }}</span>
                <span v-else>{{ processing ? t('media.saving') : validating ? t('media.validating') : removed ? t('media.removePending') : t('media.saveHint') }}</span>
            </div>
            <div class="image-picker__buttons">
                <el-button v-if="hasImage" :disabled="blocked" @click="remove">{{ t('media.remove') }}</el-button>
                <el-button class="image-picker__choose" type="primary" plain :icon="Upload" :disabled="blocked" @click="openPicker">{{ hasImage ? t('media.replace') : t('media.choose') }}</el-button>
            </div>
        </footer>
        <p v-if="round" class="image-picker__crop-hint">{{ t('media.cropHint') }}</p>
    </section>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { CircleCheck, Clock, InfoFilled, Loading, Upload, UploadFilled, Warning } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { validateImageFile } from '../imageUpload';
import PrivateImage from './PrivateImage.vue';
const props = withDefaults(defineProps<{ modelValue: File | null; removed?: boolean; version?: string | null; load: () => Promise<Blob>; round?: boolean; disabled?: boolean; processing?: boolean; errorMessage?: string }>(), { removed: false, round: false, disabled: false, processing: false, errorMessage: '' });
const emit = defineEmits<{ 'update:modelValue': [File | null]; 'update:removed': [boolean] }>();
const { t } = useI18n();
const input = ref<HTMLInputElement>();
const localUrl = ref('');
const error = ref('');
const dragging = ref(false);
const validating = ref(false);
let selection = 0;
const blocked = computed(() => props.disabled || props.processing);
const hasImage = computed(() => Boolean(props.modelValue || (props.version && !props.removed)));
const feedbackError = computed(() => error.value || props.errorMessage);
const fileSize = computed(() => props.modelValue ? `${(props.modelValue.size / 1024).toFixed(1)} KB` : '');
watch(() => props.modelValue, (file) => {
    if (localUrl.value) URL.revokeObjectURL(localUrl.value);
    localUrl.value = file ? URL.createObjectURL(file) : '';
    error.value = '';
}, { immediate: true });
onBeforeUnmount(() => { selection++; if (localUrl.value) URL.revokeObjectURL(localUrl.value); });
function openPicker() { if (!blocked.value) input.value?.click(); }
async function choose(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0]; target.value = '';
    if (file) await acceptFile(file);
}
async function acceptFile(file: File) {
    if (blocked.value) return;
    const current = ++selection; validating.value = true; error.value = '';
    const result = await validateImageFile(file);
    if (current !== selection) return;
    validating.value = false;
    if (!result.valid) {
        error.value = t(`media.validation.${result.reason}`, { actual: result.actual || '' }); return;
    }
    emit('update:modelValue', file); emit('update:removed', false);
}
async function drop(event: DragEvent) {
    dragging.value = false;
    if (blocked.value) return;
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    if (files.length !== 1) { selection++; validating.value = false; error.value = t('media.singleFile'); return; }
    await acceptFile(files[0]);
}
function remove() { selection++; validating.value = false; error.value = ''; emit('update:modelValue', null); emit('update:removed', true); }
</script>
<style scoped>
.image-picker { --image-upload-primary: var(--app-primary, var(--merchant-primary, #2864ed)); --image-upload-border: var(--app-border, #e2e8f1); --image-upload-text: var(--app-text, #24324a); --image-upload-muted: var(--app-muted, #74829a); width: min(100%, 680px); min-width: 0; padding: 16px; border: 1px solid var(--image-upload-border); border-radius: 10px; background: #fff; }
.image-picker__input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.image-picker__drop { display: flex; min-height: 156px; flex-direction: column; justify-content: center; align-items: center; gap: 8px; padding: 20px; border: 1px dashed #bdcef8; border-radius: 8px; background: #f7faff; text-align: center; cursor: pointer; transition: border-color .18s, background-color .18s; }
.image-picker__drop:hover, .image-picker.is-dragging .image-picker__drop { border-color: var(--image-upload-primary); background: #f0f5ff; }
.image-picker__drop:focus-visible { outline: 2px solid var(--image-upload-primary); outline-offset: 3px; }
.image-picker__drop strong { color: var(--image-upload-text); font-size: 14px; font-weight: 600; line-height: 22px; }
.image-picker__formats { color: var(--image-upload-muted); font-size: 12px; line-height: 20px; }
.image-picker__upload-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 10px; color: var(--image-upload-primary); background: #eaf1ff; font-size: 26px; }
.image-picker__drop.has-image { min-height: 140px; flex-direction: row; justify-content: flex-start; gap: 18px; text-align: left; }
.image-picker__preview { width: 116px; height: 84px; flex: 0 0 116px; overflow: hidden; border: 1px solid #e3e9f3; border-radius: 8px; background: #fff; }
.image-picker__preview.is-round { width: 84px; flex-basis: 84px; border-radius: 50%; }
.image-picker__preview :deep(.el-image) { width: 100%; height: 100%; }
.image-picker__file { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
.image-picker__file strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.image-picker__file > span { color: var(--image-upload-muted); font-size: 12px; line-height: 18px; }
.image-picker__file > .image-picker__state { display: inline-flex; align-items: center; gap: 5px; color: var(--image-upload-primary); }
.image-picker__file > .image-picker__state.is-saved { color: var(--el-color-success, #20a66d); }
.image-picker__footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--image-upload-border); }
.image-picker__feedback { display: flex; align-items: flex-start; gap: 6px; min-width: 0; color: var(--image-upload-muted); font-size: 12px; line-height: 20px; }
.image-picker__feedback .el-icon { flex-shrink: 0; margin-top: 3px; }
.image-picker__feedback span { overflow-wrap: anywhere; }
.image-picker__feedback.is-error { color: var(--el-color-danger, #ef5350); }
.image-picker__buttons { display: flex; flex-shrink: 0; gap: 8px; }
.image-picker__buttons :deep(.el-button:not(.is-link):not(.is-text):not(.is-circle)) { height: 36px; padding: 0 14px; margin-left: 0; border-radius: 6px; font-size: 14px; }
.image-picker__buttons :deep(.el-button--primary.is-plain) { color: var(--image-upload-primary); border-color: #bdcef8; background: #fff; }
.image-picker__crop-hint { margin: 10px 0 0; color: var(--image-upload-muted); font-size: 12px; line-height: 20px; }
.image-picker.is-processing .image-picker__drop { cursor: progress; }
@media (max-width: 640px) { .image-picker { padding: 12px; } .image-picker__footer { flex-direction: column; align-items: stretch; } .image-picker__buttons { justify-content: flex-end; } .image-picker__drop.has-image { gap: 12px; padding: 16px; } .image-picker__preview { width: 88px; flex-basis: 88px; height: 72px; } .image-picker__preview.is-round { width: 72px; flex-basis: 72px; } }
@media (prefers-reduced-motion: reduce) { .image-picker__drop { transition: none; } }
</style>

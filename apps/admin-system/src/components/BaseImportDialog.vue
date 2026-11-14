<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('feedback.importTitle', { name: subject })"
    class="base-import-dialog"
    width="680px"
    append-to-body
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    @update:model-value="handleVisible"
  >
    <div class="base-import-dialog__meta">
      <div>
        <span>{{ t('feedback.template') }}</span>
        <el-button
          v-hasPermi="templatePermission"
          link
          type="primary"
          :icon="Download"
          :disabled="loading"
          @click="emit('download-template')"
        >
          {{ t('feedback.downloadTemplate') }}
        </el-button>
      </div>
      <div v-if="selectedFile">
        <span>{{ t('feedback.selectedFile') }}</span>
        <strong :title="selectedFile.name">{{ selectedFile.name }}</strong>
      </div>
    </div>

    <section v-if="loading" class="base-import-dialog__processing" aria-live="polite">
      <span class="base-import-dialog__state-icon is-processing" aria-hidden="true"><el-icon><Loading /></el-icon></span>
      <div class="base-import-dialog__state-copy">
        <strong>{{ t('feedback.importProcessingTitle') }}</strong>
        <p>{{ t('feedback.importProcessing') }}</p>
      </div>
      <div class="base-import-dialog__steps" aria-hidden="true">
        <span class="is-complete"><el-icon><CircleCheck /></el-icon>{{ t('feedback.uploadCompleted') }}</span>
        <i />
        <span class="is-active"><b>2</b>{{ t('feedback.dataValidating') }}</span>
        <i />
        <span><b>3</b>{{ t('feedback.importResult') }}</span>
      </div>
      <div class="base-import-dialog__progress"><i /></div>
      <p class="base-import-dialog__processing-note"><el-icon><InfoFilled /></el-icon>{{ t('feedback.processingCountPending') }}</p>
    </section>

    <section v-else-if="result" class="base-import-dialog__feedback" :class="`is-${resultTone}`" aria-live="polite">
      <div class="base-import-dialog__state-heading">
        <span class="base-import-dialog__state-icon" :class="`is-${resultTone}`" aria-hidden="true">
          <el-icon><CircleCheck v-if="resultTone === 'success'" /><WarningFilled v-else-if="resultTone === 'partial'" /><CircleClose v-else /></el-icon>
        </span>
        <div class="base-import-dialog__state-copy">
          <div class="base-import-dialog__state-title">
            <strong>{{ resultTitle }}</strong>
            <el-tag :type="resultTagType" effect="light" size="small">{{ resultTagText }}</el-tag>
          </div>
          <p>{{ resultDescription }}</p>
        </div>
      </div>

      <div v-if="hasCountSummary" class="base-import-dialog__counts">
        <div><span>{{ t('feedback.totalCount') }}</span><strong>{{ totalCount }}</strong></div>
        <div class="is-success"><span>{{ t('feedback.successCount') }}</span><strong>{{ successCount }}</strong></div>
        <div class="is-failure"><span>{{ t('feedback.failureCount') }}</span><strong>{{ failureCount }}</strong></div>
      </div>

      <p v-if="resultTone === 'error' && !hasCountSummary" class="base-import-dialog__failure-note">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ result.message || t('feedback.importFailed') }}</span>
      </p>
      <p v-else class="base-import-dialog__result-note" :class="`is-${resultTone}`">
        <el-icon><CircleCheck v-if="resultTone === 'success'" /><WarningFilled v-else /></el-icon>
        <span>{{ resultNote }}</span>
      </p>

      <div v-if="failureErrors.length" class="base-import-dialog__errors">
        <div class="base-import-dialog__errors-heading">
          <strong>{{ t('feedback.failureDetails') }}</strong>
          <el-button link type="primary" :icon="Download" @click="downloadFailureDetails">{{ t('feedback.downloadFailureDetails') }}</el-button>
        </div>
        <ol>
          <li v-for="(message, index) in visibleFailureErrors" :key="`${index}-${message}`">
            <span>{{ index + 1 }}</span><p>{{ message }}</p>
          </li>
        </ol>
        <p v-if="failureErrors.length > visibleFailureErrors.length" class="base-import-dialog__errors-more">
          {{ t('feedback.moreFailureDetails', { count: failureErrors.length - visibleFailureErrors.length }) }}
        </p>
      </div>
    </section>

    <template v-else>
      <div class="base-import-dialog__intro">
        <p>{{ t('feedback.importGuidance') }}</p>
      </div>
      <div class="base-import-dialog__drop" @dragover.prevent @drop.prevent="handleDrop">
        <el-icon class="base-import-dialog__upload-icon"><UploadFilled /></el-icon>
        <strong>{{ t('feedback.dropFile') }}</strong>
        <span>{{ t('feedback.supportedFormats') }}</span>
        <el-button :icon="FolderOpened" @click="chooseFile">{{ t('feedback.chooseFile') }}</el-button>
        <input ref="inputRef" class="base-import-dialog__input" type="file" accept=".xlsx,.xls,.csv" tabindex="-1" aria-hidden="true" @change="handleInput" />
      </div>
      <div v-if="selectedFile" class="base-import-dialog__selected">
        <el-icon><Document /></el-icon>
        <span :title="selectedFile.name">{{ selectedFile.name }}</span>
        <el-button link :aria-label="t('feedback.removeFile')" @click="clearFile"><el-icon><Close /></el-icon></el-button>
      </div>
      <p v-if="validationError" class="base-import-dialog__error" role="alert">{{ validationError }}</p>
      <p class="base-import-dialog__helper">
        <el-icon><InfoFilled /></el-icon>
        <span>{{ t('feedback.importHelper') }}</span>
      </p>
    </template>

    <template #footer>
      <div class="dialog-footer">
        <template v-if="loading">
          <el-button disabled>{{ t('common.cancel') }}</el-button>
          <el-button type="primary" loading disabled>{{ t('feedback.processingAction') }}</el-button>
        </template>
        <template v-else-if="result">
          <el-button v-if="resultTone !== 'success'" @click="prepareRetry">{{ t('feedback.chooseAnotherFile') }}</el-button>
          <el-button v-if="failureErrors.length" :icon="Download" @click="downloadFailureDetails">{{ t('feedback.downloadFailureDetails') }}</el-button>
          <el-button type="primary" @click="handleVisible(false)">{{ resultTone === 'success' ? t('common.confirm') : t('common.close') }}</el-button>
        </template>
        <template v-else>
          <el-button @click="handleVisible(false)">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :disabled="!selectedFile" @click="handleConfirm">{{ confirmText || t('feedback.startImport') }}</el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CircleCheck, CircleClose, Close, Document, Download, FolderOpened, InfoFilled, Loading, UploadFilled, WarningFilled } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

type ImportFeedbackResult = {
  type: 'success' | 'error';
  message?: string;
  successCount?: number;
  failureCount?: number;
  errors?: string[];
};

const props = defineProps<{
  modelValue: boolean;
  subject: string;
  loading: boolean;
  templatePermission: string;
  confirmText?: string;
  result?: ImportFeedbackResult | null;
}>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [file: File];
  'download-template': [];
  'reset-result': [];
}>();
const { t } = useI18n();
const inputRef = ref<HTMLInputElement>();
const selectedFile = ref<File | null>(null);
const validationError = ref('');

const successCount = computed(() => Math.max(0, Number(props.result?.successCount || 0)));
const failureCount = computed(() => Math.max(0, Number(props.result?.failureCount || 0)));
const totalCount = computed(() => successCount.value + failureCount.value);
const hasCountSummary = computed(() => props.result?.successCount !== undefined || props.result?.failureCount !== undefined);
const failureErrors = computed(() => (props.result?.errors || []).filter((message) => Boolean(message?.trim())));
const visibleFailureErrors = computed(() => failureErrors.value.slice(0, 5));
const resultTone = computed<'success' | 'partial' | 'failure' | 'error'>(() => {
  if (props.result?.type === 'error') return 'error';
  if (failureCount.value > 0 && successCount.value > 0) return 'partial';
  if (failureCount.value > 0) return 'failure';
  return 'success';
});
const resultTagType = computed(() => resultTone.value === 'success' ? 'success' : resultTone.value === 'partial' ? 'warning' : 'danger');
const resultTitle = computed(() => t(`feedback.resultTitle.${resultTone.value}`));
const resultTagText = computed(() => t(`feedback.resultTag.${resultTone.value}`));
const resultDescription = computed(() => {
  if (hasCountSummary.value) return t('feedback.importCountSummary', { total: totalCount.value, success: successCount.value, failure: failureCount.value });
  return props.result?.message || t('feedback.importFailed');
});
const resultNote = computed(() => t(`feedback.resultNote.${resultTone.value}`, { count: failureCount.value }));

watch(() => props.modelValue, (visible) => { if (!visible) clearFile(); });

function clearFile() {
  selectedFile.value = null;
  validationError.value = '';
  if (inputRef.value) inputRef.value.value = '';
}

function acceptFile(file?: File) {
  validationError.value = '';
  if (!file) return;
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
    clearFile();
    emit('reset-result');
    validationError.value = t('feedback.invalidFileType');
    return;
  }
  emit('reset-result');
  selectedFile.value = file;
}

function chooseFile() { inputRef.value?.click(); }
function handleInput(event: Event) { acceptFile((event.target as HTMLInputElement).files?.[0]); }
function handleDrop(event: DragEvent) { if (!props.loading) acceptFile(event.dataTransfer?.files?.[0]); }
function handleVisible(visible: boolean) { if (!props.loading) emit('update:modelValue', visible); }
function handleConfirm() {
  if (!selectedFile.value) { validationError.value = t('feedback.fileRequired'); return; }
  if (!props.loading) emit('submit', selectedFile.value);
}
function prepareRetry() {
  clearFile();
  emit('reset-result');
}
function csvCell(value: string | number) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function downloadFailureDetails() {
  if (!failureErrors.value.length) return;
  const rows = [
    [t('feedback.failureSequence'), t('feedback.failureReason')],
    ...failureErrors.value.map((message, index) => [index + 1, message]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  const baseName = selectedFile.value?.name.replace(/\.[^.]+$/, '') || 'import';
  link.href = url;
  link.download = `${baseName}-failures.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
</script>

<style scoped>
/* Batch-import states share one measured layout so status changes do not move the dialog. */
.base-import-dialog__meta { display: grid; gap: 8px; margin-bottom: 20px; color: var(--app-muted); font-size: 13px; }
.base-import-dialog__meta > div { display: flex; align-items: center; gap: 10px; min-width: 0; }
.base-import-dialog__meta > div > span { min-width: 56px; flex: 0 0 auto; white-space: nowrap; }
.base-import-dialog__meta strong { min-width: 0; overflow: hidden; color: var(--app-text); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.base-import-dialog__meta .el-button { height: auto; padding: 0; font-size: 13px; }
.base-import-dialog__intro { margin-bottom: 16px; }
.base-import-dialog__intro p { margin: 0; color: #606266; font-size: 14px; line-height: 22px; }
.base-import-dialog__drop { display: flex; min-height: 184px; flex-direction: column; justify-content: center; align-items: center; gap: 8px; padding: 24px; border: 1px dashed var(--el-color-primary-light-3); border-radius: 10px; background: color-mix(in srgb, var(--app-primary-light) 46%, var(--app-surface)); text-align: center; transition: border-color .18s ease, background-color .18s ease; }
.base-import-dialog__drop:hover { border-color: var(--app-primary); background: color-mix(in srgb, var(--app-primary-light) 64%, var(--app-surface)); }
.base-import-dialog__drop strong { color: var(--app-text); font-size: 16px; font-weight: 600; line-height: 24px; }
.base-import-dialog__drop span { color: #606266; font-size: 13px; line-height: 20px; }
.base-import-dialog__drop .el-button { min-width: 112px; height: 36px; margin-top: 4px; }
.base-import-dialog__upload-icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 12px; background: color-mix(in srgb, var(--app-primary-light) 72%, var(--app-surface)); color: var(--app-primary); font-size: 30px; }
.base-import-dialog__input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.base-import-dialog__selected { display: flex; align-items: center; gap: 8px; min-width: 0; margin-top: 14px; padding: 10px 12px; border: 1px solid var(--app-border); border-radius: 8px; background: #fafafa; }
.base-import-dialog__selected span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.base-import-dialog__error { margin: 10px 0 0; color: var(--el-color-danger); line-height: 1.5; }
.base-import-dialog__helper { display: flex; align-items: center; gap: 8px; margin: 16px 0 0; padding: 10px 12px; border: 1px solid var(--app-border); border-radius: 8px; background: color-mix(in srgb, var(--app-primary-light) 20%, var(--app-surface)); color: #606266; font-size: 13px; line-height: 20px; }
.base-import-dialog__helper .el-icon { flex: none; font-size: 16px; }
.base-import-dialog__processing { padding-top: 4px; }
.base-import-dialog__state-heading, .base-import-dialog__processing { position: relative; }
.base-import-dialog__state-heading { display: flex; align-items: flex-start; gap: 14px; }
.base-import-dialog__processing { display: grid; grid-template-columns: 48px 1fr; gap: 14px; }
.base-import-dialog__state-icon { display: grid; place-items: center; width: 48px; height: 48px; flex: none; border-radius: 14px; font-size: 27px; }
.base-import-dialog__state-icon.is-processing { background: var(--el-color-primary-light-9); color: var(--app-primary); }
.base-import-dialog__state-icon.is-processing .el-icon { animation: rotating 1.5s linear infinite; }
.base-import-dialog__state-icon.is-success { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.base-import-dialog__state-icon.is-partial { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.base-import-dialog__state-icon.is-failure, .base-import-dialog__state-icon.is-error { background: var(--el-color-danger-light-9); color: var(--el-color-danger); }
.base-import-dialog__state-copy { min-width: 0; }
.base-import-dialog__state-copy > strong, .base-import-dialog__state-title strong { color: var(--app-text); font-size: 17px; font-weight: 600; line-height: 26px; }
.base-import-dialog__state-copy p { margin: 5px 0 0; color: var(--app-muted); font-size: 13px; line-height: 21px; overflow-wrap: anywhere; }
.base-import-dialog__state-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.base-import-dialog__steps { grid-column: 1 / -1; display: grid; grid-template-columns: auto 1fr auto 1fr auto; align-items: center; margin-top: 20px; color: var(--app-muted); font-size: 12px; }
.base-import-dialog__steps span { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
.base-import-dialog__steps span b, .base-import-dialog__steps span .el-icon { display: grid; place-items: center; width: 22px; height: 22px; border: 1px solid var(--app-border); border-radius: 50%; font-size: 12px; font-weight: 600; }
.base-import-dialog__steps span.is-complete { color: var(--el-color-success); }
.base-import-dialog__steps span.is-complete .el-icon { border-color: var(--el-color-success-light-5); background: var(--el-color-success-light-9); }
.base-import-dialog__steps span.is-active { color: var(--app-primary); font-weight: 600; }
.base-import-dialog__steps span.is-active b { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); }
.base-import-dialog__steps i { height: 1px; margin: 0 10px; background: var(--app-border); }
.base-import-dialog__progress { grid-column: 1 / -1; height: 8px; margin-top: 18px; overflow: hidden; border-radius: 999px; background: var(--el-color-primary-light-9); }
.base-import-dialog__progress i { display: block; width: 45%; height: 100%; border-radius: inherit; background: var(--app-primary); animation: import-progress 1.4s ease-in-out infinite alternate; }
.base-import-dialog__processing-note { grid-column: 1 / -1; display: flex; align-items: center; gap: 7px; margin: 2px 0 0; padding-top: 14px; border-top: 1px dashed var(--app-border); color: var(--app-muted); font-size: 12px; line-height: 20px; }
.base-import-dialog__feedback { padding-top: 4px; }
.base-import-dialog__counts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 22px; }
.base-import-dialog__counts > div { display: grid; place-items: center; gap: 5px; min-height: 82px; border: 1px solid var(--app-border); border-radius: 10px; background: color-mix(in srgb, var(--app-surface) 92%, var(--app-bg)); }
.base-import-dialog__counts span { color: var(--app-muted); font-size: 12px; }
.base-import-dialog__counts strong { color: var(--app-text); font-size: 28px; line-height: 32px; }
.base-import-dialog__counts .is-success { border-color: var(--el-color-success-light-7); background: var(--el-color-success-light-9); }
.base-import-dialog__counts .is-success strong { color: var(--el-color-success); }
.base-import-dialog__counts .is-failure { border-color: var(--el-color-danger-light-8); background: var(--el-color-danger-light-9); }
.base-import-dialog__counts .is-failure strong { color: var(--el-color-danger); }
.base-import-dialog__result-note, .base-import-dialog__failure-note { display: flex; align-items: flex-start; gap: 8px; margin: 14px 0 0; padding-top: 14px; border-top: 1px dashed var(--app-border); color: var(--app-muted); font-size: 13px; line-height: 20px; }
.base-import-dialog__result-note.is-partial { color: var(--el-color-warning-dark-2); }
.base-import-dialog__result-note.is-failure, .base-import-dialog__failure-note { color: var(--el-color-danger); }
.base-import-dialog__result-note .el-icon, .base-import-dialog__failure-note .el-icon { margin-top: 2px; flex: none; }
.base-import-dialog__failure-note { padding: 12px; border: 1px solid var(--el-color-danger-light-7); border-radius: 8px; background: var(--el-color-danger-light-9); overflow-wrap: anywhere; }
.base-import-dialog__errors { margin-top: 16px; overflow: hidden; border: 1px solid var(--app-border); border-radius: 10px; }
.base-import-dialog__errors-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; background: color-mix(in srgb, var(--app-bg) 55%, var(--app-surface)); }
.base-import-dialog__errors-heading strong { color: var(--app-text); font-size: 13px; }
.base-import-dialog__errors ol { margin: 0; padding: 0; list-style: none; }
.base-import-dialog__errors li { display: grid; grid-template-columns: 24px 1fr; gap: 8px; padding: 9px 12px; border-top: 1px solid var(--app-border); color: var(--app-muted); font-size: 12px; line-height: 18px; }
.base-import-dialog__errors li span { color: var(--app-muted); text-align: right; }
.base-import-dialog__errors li p { margin: 0; overflow-wrap: anywhere; }
.base-import-dialog__errors-more { margin: 0; padding: 8px 12px; border-top: 1px solid var(--app-border); color: var(--app-muted); font-size: 12px; }

@keyframes import-progress { from { transform: translateX(-15%); } to { transform: translateX(135%); } }

@media (max-width: 640px) {
  .base-import-dialog__drop { min-height: 200px; padding: 20px 16px; }
  .base-import-dialog__meta > div { align-items: flex-start; flex-direction: column; gap: 4px; }
  .base-import-dialog__meta > div > span { width: auto; }
  .base-import-dialog__steps { grid-template-columns: 1fr; gap: 8px; }
  .base-import-dialog__steps i { display: none; }
  .base-import-dialog__counts { grid-template-columns: 1fr; }
}
</style>

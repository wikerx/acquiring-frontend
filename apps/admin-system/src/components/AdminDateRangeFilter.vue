<template>
    <div class="admin-date-range-filter">
        <label :for="startId" class="admin-date-range-filter__label">
            {{ label }}
            <el-tooltip v-if="help" :content="help" placement="top">
                <el-icon tabindex="0" :aria-label="help"><InfoFilled /></el-icon>
            </el-tooltip>
        </label>
        <el-date-picker
            v-model="model"
            :id="[startId, endId]"
            :type="type"
            size="small"
            :value-format="type === 'daterange' ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm:ss'"
            :format="type === 'daterange' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss'"
            :range-separator="t('common.to')"
            :start-placeholder="t('common.startTime')"
            :end-placeholder="t('common.endTime')"
            :clearable="clearable"
        />
    </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { useI18n } from 'vue-i18n';
import { InfoFilled } from '@element-plus/icons-vue';

withDefaults(defineProps<{
    label: string;
    help?: string;
    type: 'daterange' | 'datetimerange';
    clearable?: boolean;
}>(), { help: '', clearable: true });
const model = defineModel<[string, string] | [] | null>({ required: true });
const { t } = useI18n();
const id = useId();
const startId = `${id}-start`;
const endId = `${id}-end`;
</script>

<style scoped>
.admin-date-range-filter {
    display: flex;
    flex: 0 1 auto;
    align-items: center;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
}
.admin-date-range-filter__label {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    white-space: nowrap;
}
.admin-date-range-filter__label .el-icon { color: var(--el-text-color-secondary); }
@media (max-width: 640px) {
    .admin-date-range-filter { align-items: stretch; flex-direction: column; width: 100%; }
}
</style>

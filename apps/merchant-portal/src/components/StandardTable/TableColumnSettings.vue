<template>
    <el-popover placement="bottom-end" trigger="click" width="300" popper-class="table-column-settings-popper">
        <template #reference>
            <el-button :icon="Setting" size="small" plain>{{ t('table.editColumns') }}</el-button>
        </template>
        <div class="table-column-settings">
            <div class="table-column-settings__head">
                <span>{{ t('table.columns') }}</span>
                <el-button type="primary" link size="small" @click="$emit('resetColumns')">{{ t('table.resetColumns') }}</el-button>
            </div>
            <div v-if="fixedColumns.length" class="table-column-settings__section">
                <div class="table-column-settings__title">{{ t('table.fixedColumns') }}</div>
                <div v-for="column in fixedColumns" :key="column.key" class="table-column-settings__row is-fixed">
                    <el-checkbox :model-value="true" disabled>{{ column.label }}</el-checkbox>
                </div>
            </div>
            <div class="table-column-settings__section">
                <div class="table-column-settings__title">{{ t('table.visibleColumns') }}</div>
                <div v-for="(column, index) in editableColumns" :key="column.key" class="table-column-settings__row">
                    <el-checkbox :model-value="column.visible" :disabled="column.hideable === false" @change="(checked: boolean) => $emit('visibleChange', column.key, checked)">
                        {{ column.label }}
                    </el-checkbox>
                    <div class="table-column-settings__moves">
                        <el-tooltip :content="t('table.moveUp')" placement="top">
                            <el-button :icon="ArrowUp" size="small" text :disabled="index === 0" @click="$emit('moveColumn', column.key, 'up')" />
                        </el-tooltip>
                        <el-tooltip :content="t('table.moveDown')" placement="top">
                            <el-button :icon="ArrowDown" size="small" text :disabled="index === editableColumns.length - 1" @click="$emit('moveColumn', column.key, 'down')" />
                        </el-tooltip>
                    </div>
                </div>
            </div>
        </div>
    </el-popover>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDown, ArrowUp, Setting } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { StandardTableColumnState } from './types';

const props = defineProps<{
    columns: StandardTableColumnState[];
    fixedColumns?: Array<{ key: string; label: string }>;
}>();

defineEmits<{
    visibleChange: [key: string, visible: boolean];
    moveColumn: [key: string, direction: 'up' | 'down'];
    resetColumns: [];
}>();

const { t } = useI18n();
const fixedColumns = computed(() => props.fixedColumns || props.columns.filter((column) => column.hideable === false));
const editableColumns = computed(() => props.columns.filter((column) => column.hideable !== false));
</script>

<style scoped>
.table-column-settings {
    max-height: 420px;
    overflow-y: auto;
}

.table-column-settings__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    font-weight: 600;
}

.table-column-settings__section + .table-column-settings__section {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
}

.table-column-settings__title {
    margin-bottom: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.table-column-settings__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 30px;
    gap: 8px;
}

.table-column-settings__row :deep(.el-checkbox) {
    min-width: 0;
    flex: 1;
}

.table-column-settings__row :deep(.el-checkbox__label) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.table-column-settings__moves {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    flex: 0 0 auto;
}
</style>

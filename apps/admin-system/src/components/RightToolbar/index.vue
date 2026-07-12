<template>
    <span :data-standard-toolbar-id="toolbarId" class="standard-right-toolbar">
        <el-tooltip v-if="showSearch" :content="$t('common.search')" effect="dark" placement="bottom">
            <el-button :icon="Search" size="small" circle @click="$emit('toggleSearch')" />
        </el-tooltip>
        <el-tooltip v-if="showRefresh" :content="$t('common.refresh')" effect="dark" placement="bottom">
            <el-button :icon="Refresh" size="small" circle @click="$emit('refresh')" />
        </el-tooltip>
        <TableColumnSettings
            v-if="standardTable"
            :columns="standardTable.columns.value"
            :fixed-columns="standardTable.fixedColumns.value"
            @visible-change="standardTable.setColumnVisible"
            @move-column="standardTable.moveColumn"
            @reset-columns="standardTable.resetColumns"
        />
        <slot />
    </span>
</template>

<script setup lang="ts">
import { Search, Refresh } from '@element-plus/icons-vue';
import { useId } from 'vue';
import TableColumnSettings from '@/components/StandardTable/TableColumnSettings.vue';
import { useToolbarStandardTable } from '@/components/StandardTable/standardTableRegistry';

const props = withDefaults(defineProps<{
    showSearch?: boolean;
    showRefresh?: boolean;
}>(), {
    showSearch: true,
    showRefresh: true,
});

defineEmits<{
    toggleSearch: [];
    refresh: [];
}>();

const toolbarId = `toolbar-${useId()}`;
const standardTable = useToolbarStandardTable(toolbarId);
</script>

<style scoped>
.standard-right-toolbar {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
</style>

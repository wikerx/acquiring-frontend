<template>
    <el-dialog v-model="visible" :title="title" width="620px" append-to-body destroy-on-close>
        <el-descriptions :column="column" border size="small">
            <el-descriptions-item v-for="item in items" :key="item.label" :label="item.label" :span="item.span || 1">
                <slot :name="'cell-' + item.prop" :item="item" :data="data">
                    {{ data?.[item.prop] ?? '-' }}
                </slot>
            </el-descriptions-item>
        </el-descriptions>
        <template #footer>
            <div class="dialog-footer"><el-button @click="visible = false">{{ $t('common.close') }}</el-button></div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
    visible: boolean;
    title: string;
    data: Record<string, unknown> | null;
    items: Array<{ prop: string; label: string; span?: number }>;
    column?: number;
}>();
</script>

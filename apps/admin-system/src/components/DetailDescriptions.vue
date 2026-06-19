<template>
    <el-dialog v-model="dialogVisible" :title="title" width="620px" append-to-body destroy-on-close>
        <el-descriptions :column="column" border size="small">
            <el-descriptions-item v-for="item in items" :key="item.label" :label="item.label" :span="item.span || 1">
                <slot :name="'cell-' + item.prop" :item="item" :data="data">
                    {{ data?.[item.prop] ?? '-' }}
                </slot>
            </el-descriptions-item>
        </el-descriptions>
        <template #footer>
            <div class="dialog-footer"><el-button @click="dialogVisible = false">{{ $t('common.close') }}</el-button></div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    visible: boolean;
    title: string;
    data: Record<string, unknown> | null;
    items: Array<{ prop: string; label: string; span?: number }>;
    column?: number;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
}>();

const dialogVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
});
</script>

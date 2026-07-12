<template>
    <CommonDetailDrawer v-model:visible="drawerVisible" :title="title" :size="size">
        <el-descriptions :column="column" border size="small">
            <el-descriptions-item v-for="item in items" :key="item.label" :label="item.label" :span="item.span || 1">
                <slot :name="'cell-' + item.prop" :item="item" :data="data">
                    {{ data?.[item.prop] ?? '-' }}
                </slot>
            </el-descriptions-item>
        </el-descriptions>
    </CommonDetailDrawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';

const props = defineProps<{
    visible: boolean;
    title: string;
    data: Record<string, unknown> | null;
    items: Array<{ prop: string; label: string; span?: number }>;
    column?: number;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
}>();

const drawerVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
});
</script>

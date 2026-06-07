<template>
    <div class="table-panel">
        <el-table
            v-loading="loading"
            :data="rows"
            border
            stripe
            row-key="id"
            class="base-table"
            @selection-change="$emit('selectionChange', $event)"
        >
            <template #empty>
                <el-empty description="暂无数据" />
            </template>
            <el-table-column type="selection" width="46" />
            <el-table-column
                v-for="column in columns"
                :key="column.prop"
                :prop="column.prop"
                :label="column.label"
                :width="column.width"
                :min-width="column.minWidth"
                show-overflow-tooltip
            >
                <template #default="{ row }">
                    <BaseStatusTag v-if="column.type === 'status'" :value="row[column.prop]" />
                    <BaseDateTime v-else-if="column.type === 'datetime'" :value="row[column.prop]" />
                    <BaseAmount v-else-if="column.type === 'amount'" :value="row[column.prop]" />
                    <span v-else>{{ row[column.prop] ?? '-' }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="190" fixed="right">
                <template #default="{ row }">
                    <el-button link type="primary" @click="$emit('view', row)">查看</el-button>
                    <el-button link type="primary" @click="$emit('edit', row)">编辑</el-button>
                    <el-button link type="danger" @click="$emit('delete', row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <div class="table-pagination">
            <el-pagination
                :current-page="page"
                :page-size="pageSize"
                :total="total"
                layout="total, sizes, prev, pager, next, jumper"
                :page-sizes="[10, 20, 50, 100]"
                @update:current-page="$emit('update:page', $event)"
                @update:page-size="$emit('update:pageSize', $event)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import BaseAmount from '@/components/BaseAmount/index.vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import type { CrudTableColumn } from '@/types/admin';

defineProps<{
    loading: boolean;
    rows: Array<Record<string, unknown>>;
    columns: CrudTableColumn[];
    total: number;
    page: number;
    pageSize: number;
}>();

defineEmits<{
    selectionChange: [rows: Array<Record<string, unknown>>];
    view: [row: Record<string, unknown>];
    edit: [row: Record<string, unknown>];
    delete: [row: Record<string, unknown>];
    'update:page': [page: number];
    'update:pageSize': [pageSize: number];
}>();
</script>

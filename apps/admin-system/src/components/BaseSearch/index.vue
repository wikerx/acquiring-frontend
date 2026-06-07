<template>
    <el-form :model="model" class="base-search" label-width="96px" @submit.prevent>
        <el-row :gutter="16">
            <el-col v-for="field in fields" :key="field.prop" :xs="24" :sm="12" :lg="8" :xl="6">
                <el-form-item :label="field.label">
                    <el-select
                        v-if="field.type === 'select'"
                        v-model="model[field.prop]"
                        clearable
                        :placeholder="field.placeholder || '请选择'"
                    >
                        <el-option
                            v-for="option in field.options || []"
                            :key="String(option.value)"
                            :label="option.label"
                            :value="option.value"
                        />
                    </el-select>
                    <el-date-picker
                        v-else-if="field.type === 'dateRange'"
                        v-model="model[field.prop]"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        value-format="YYYY-MM-DD"
                    />
                    <el-input
                        v-else
                        v-model.trim="model[field.prop]"
                        clearable
                        :placeholder="field.placeholder || '请输入'"
                    />
                </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8" :xl="6">
                <el-form-item label-width="0">
                    <div class="search-actions">
                        <el-button type="primary" @click="$emit('search')">查询</el-button>
                        <el-button @click="$emit('reset')">重置</el-button>
                    </div>
                </el-form-item>
            </el-col>
        </el-row>
    </el-form>
</template>

<script setup lang="ts">
import type { CrudSearchField } from '@/types/admin';

defineProps<{
    model: Record<string, unknown>;
    fields: CrudSearchField[];
}>();

defineEmits<{
    search: [];
    reset: [];
}>();
</script>

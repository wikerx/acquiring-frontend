<template>
    <section v-show="visible" class="transaction-search-panel">
        <div class="transaction-search-panel__head">
            <div>
                <strong>{{ title }}</strong>
                <span>{{ description }}</span>
            </div>
            <el-button
                v-if="$slots.advanced"
                type="primary"
                link
                size="small"
                :icon="advancedVisible ? ArrowUp : ArrowDown"
                @click="advancedVisible = !advancedVisible"
            >
                {{ advancedVisible ? collapseText : expandText }}
            </el-button>
        </div>
        <el-form :model="model" :inline="true" size="small" class="search-form transaction-search" :label-width="labelWidth">
            <div class="transaction-search__grid">
                <slot />
                <template v-if="inlineTime && $slots.time && (!$slots.advanced || !advancedVisible)">
                    <slot name="time" />
                </template>
                <div v-if="inlineTime && (!$slots.advanced || !advancedVisible)" class="transaction-search__actions transaction-search__actions--inline">
                    <el-button type="primary" :icon="Search" size="small" @click="$emit('search')">{{ searchText }}</el-button>
                    <el-button :icon="Refresh" size="small" @click="$emit('reset')">{{ resetText }}</el-button>
                </div>
            </div>
            <div v-if="$slots.advanced" v-show="advancedVisible" class="transaction-search__advanced">
                <div class="transaction-search__grid">
                    <slot name="advanced" />
                    <template v-if="inlineTime && $slots.time && advancedVisible">
                        <slot name="time" />
                    </template>
                    <div v-if="inlineTime" class="transaction-search__actions transaction-search__actions--inline">
                        <el-button type="primary" :icon="Search" size="small" @click="$emit('search')">{{ searchText }}</el-button>
                        <el-button :icon="Refresh" size="small" @click="$emit('reset')">{{ resetText }}</el-button>
                    </div>
                </div>
            </div>
            <div v-if="!inlineTime" class="transaction-search__time-row">
                <slot name="time" />
                <div class="transaction-search__actions">
                    <el-button type="primary" :icon="Search" size="small" @click="$emit('search')">{{ searchText }}</el-button>
                    <el-button :icon="Refresh" size="small" @click="$emit('reset')">{{ resetText }}</el-button>
                </div>
            </div>
        </el-form>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ArrowDown, ArrowUp, Refresh, Search } from '@element-plus/icons-vue';

withDefaults(defineProps<{
    visible: boolean;
    model: Record<string, unknown>;
    title: string;
    description: string;
    expandText: string;
    collapseText: string;
    searchText: string;
    resetText: string;
    labelWidth?: string;
    inlineTime?: boolean;
}>(), {
    labelWidth: '104px',
    inlineTime: false,
});

defineEmits<{
    search: [];
    reset: [];
}>();

const advancedVisible = ref(false);
</script>

<style scoped>
.transaction-search-panel {
    margin-bottom: 10px;
    border: 1px solid #e5eaf3;
    border-radius: 6px;
    padding: 10px 12px 12px;
    background: var(--el-bg-color);
}

.transaction-search-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
}

.transaction-search-panel__head strong {
    display: inline-block;
    margin-right: 8px;
    color: #1f2d3d;
    font-size: 13px;
    font-weight: 700;
    line-height: 22px;
}

.transaction-search-panel__head span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 20px;
}

.transaction-search {
    display: block;
}

.transaction-search__grid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px 12px;
}

.transaction-search__advanced {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--el-border-color-lighter);
}

.transaction-search__time-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--el-border-color-lighter);
}

.transaction-search__actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-height: 28px;
    flex: 0 0 auto;
}

.transaction-search__actions--inline {
    flex: 1 1 160px;
    align-self: flex-start;
}

.transaction-search :deep(.el-form-item) {
    margin-right: 0;
    margin-bottom: 0;
}

.transaction-search :deep(.el-form-item__label) {
    padding-right: 8px;
    color: #566173;
}

.transaction-search :deep(.el-input),
.transaction-search :deep(.el-select) {
    width: 200px;
}

.transaction-search :deep(.transaction-time-form-item .el-form-item__content) {
    width: 100%;
    min-width: 0;
}

.transaction-search :deep(.transaction-time-form-item) {
    flex: 1 1 760px;
    min-width: 0;
    max-width: 100%;
}

@media (max-width: 980px) {
    .transaction-search__time-row {
        flex-direction: column;
    }
}

@media (max-width: 640px) {
    .transaction-search :deep(.el-form-item),
    .transaction-search :deep(.el-form-item__content),
    .transaction-search :deep(.el-input),
    .transaction-search :deep(.el-select) {
        width: 100%;
    }
}
</style>

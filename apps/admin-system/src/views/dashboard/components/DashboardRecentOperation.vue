<template>
    <section class="dashboard-panel">
        <header class="dashboard-panel__header dashboard-panel__header--with-link">
            <div>
                <h2>{{ title }}</h2>
                <p>{{ description }}</p>
            </div>
            <el-button link type="primary" @click="$emit('more')">{{ moreText }}</el-button>
        </header>
        <div v-if="rows.length" class="dashboard-list">
            <article v-for="row in rows" :key="row.id" class="dashboard-list__item">
                <div class="dashboard-list__main">
                    <strong>{{ row.moduleName || '-' }}</strong>
                    <span>{{ row.operatorName || '-' }} · {{ row.businessTypeText }}</span>
                </div>
                <div class="dashboard-list__meta">
                    <BaseStatusTag :value="row.status === 1 ? 'SUCCESS' : 'FAILED'" />
                    <BaseDateTime :value="row.operatedAt" />
                </div>
            </article>
        </div>
        <el-empty v-else :description="emptyText" :image-size="86" />
    </section>
</template>

<script setup lang="ts">
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';

export interface RecentOperationRow {
    id: number;
    moduleName?: string;
    operatorName?: string;
    status?: number;
    operatedAt?: string;
    businessTypeText: string;
}

interface Props {
    title: string;
    description: string;
    moreText: string;
    emptyText: string;
    rows: RecentOperationRow[];
}

defineProps<Props>();
defineEmits<{ more: [] }>();
</script>

<style scoped>
.dashboard-panel {
    border: 1px solid #e7edf4;
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.dashboard-panel__header {
    padding: 22px 24px 0;
}

.dashboard-panel__header--with-link {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.dashboard-panel__header h2 {
    margin: 0;
    color: #0f172a;
    font-size: 18px;
    font-weight: 700;
}

.dashboard-panel__header p {
    margin: 8px 0 0;
    color: #64748b;
    font-size: 13px;
}

.dashboard-list {
    padding: 10px 24px 24px;
}

.dashboard-list__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #eef2f7;
}

.dashboard-list__item:last-child {
    border-bottom: none;
}

.dashboard-list__main {
    min-width: 0;
}

.dashboard-list__main strong {
    display: block;
    color: #0f172a;
    font-size: 14px;
}

.dashboard-list__main span {
    display: block;
    margin-top: 8px;
    color: #64748b;
    font-size: 12px;
}

.dashboard-list__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    color: #64748b;
    font-size: 12px;
}

@media (max-width: 768px) {
    .dashboard-list__item {
        flex-direction: column;
        align-items: flex-start;
    }

    .dashboard-list__meta {
        align-items: flex-start;
    }
}
</style>

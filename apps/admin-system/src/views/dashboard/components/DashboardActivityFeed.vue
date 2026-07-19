<template>
    <section class="dashboard-activity">
        <header class="dashboard-activity__header">
            <div>
                <p>{{ eyebrow }}</p>
                <h2>{{ title }}</h2>
                <span>{{ description }}</span>
            </div>
            <div class="dashboard-activity__actions">
                <el-button size="small" @click="$emit('more-login')">{{ loginMoreText }}</el-button>
                <el-button size="small" type="primary" plain @click="$emit('more-operation')">{{ operationMoreText }}</el-button>
            </div>
        </header>

        <div v-if="items.length" class="dashboard-activity__timeline">
            <article
                v-for="item in items"
                :key="item.id"
                class="dashboard-activity__item"
                :class="`dashboard-activity__item--${item.tone}`"
            >
                <div class="dashboard-activity__marker">
                    <component :is="item.icon" />
                </div>
                <div class="dashboard-activity__content">
                    <div class="dashboard-activity__line">
                        <strong>{{ item.title }}</strong>
                        <el-tag size="small" effect="light" :type="tagType(item.tone)">{{ item.statusText }}</el-tag>
                    </div>
                    <p>{{ item.description }}</p>
                    <div class="dashboard-activity__meta">
                        <span>{{ item.actor }}</span>
                        <span>{{ item.source }}</span>
                        <BaseDateTime :value="item.time" />
                    </div>
                </div>
            </article>
        </div>
        <el-empty v-else :description="emptyText" :image-size="86" />
    </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';

export type ActivityTone = 'success' | 'danger' | 'warning' | 'info';

export interface DashboardActivityItem {
    id: string;
    title: string;
    description: string;
    actor: string;
    source: string;
    statusText: string;
    time?: string;
    tone: ActivityTone;
    icon: Component;
}

interface Props {
    eyebrow: string;
    title: string;
    description: string;
    loginMoreText: string;
    operationMoreText: string;
    emptyText: string;
    items: DashboardActivityItem[];
}

defineProps<Props>();
defineEmits<{
    'more-login': [];
    'more-operation': [];
}>();

function tagType(tone: ActivityTone) {
    if (tone === 'success') {
        return 'success';
    }
    if (tone === 'danger') {
        return 'danger';
    }
    if (tone === 'warning') {
        return 'warning';
    }
    return 'info';
}
</script>

<style scoped>
.dashboard-activity {
    min-height: 100%;
    border: 1px solid #dfe8f4;
    border-radius: 8px;
    background:
        linear-gradient(180deg, rgba(248, 250, 252, 0.82), rgba(255, 255, 255, 0.96)),
        #ffffff;
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
}

.dashboard-activity__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 24px 8px;
}

.dashboard-activity__header p {
    margin: 0 0 8px;
    color: #0f766e;
    font-size: 12px;
    font-weight: 700;
}

.dashboard-activity__header h2 {
    margin: 0;
    color: #0f172a;
    font-size: 19px;
    font-weight: 760;
}

.dashboard-activity__header span {
    display: block;
    margin-top: 8px;
    color: #64748b;
    font-size: 13px;
    line-height: 1.6;
}

.dashboard-activity__actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
}

.dashboard-activity__timeline {
    position: relative;
    padding: 8px 24px 24px;
}

.dashboard-activity__timeline::before {
    content: '';
    position: absolute;
    top: 20px;
    bottom: 34px;
    left: 43px;
    width: 1px;
    background: #dbe5f0;
}

.dashboard-activity__item {
    position: relative;
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 14px;
    padding: 12px 0;
}

.dashboard-activity__marker {
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    color: #64748b;
    font-size: 18px;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.dashboard-activity__item--success .dashboard-activity__marker {
    border-color: #bbf7d0;
    color: #15803d;
}

.dashboard-activity__item--danger .dashboard-activity__marker {
    border-color: #fecaca;
    color: #dc2626;
}

.dashboard-activity__item--warning .dashboard-activity__marker {
    border-color: #fde68a;
    color: #d97706;
}

.dashboard-activity__content {
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid #edf2f7;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
}

.dashboard-activity__line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.dashboard-activity__line strong {
    overflow: hidden;
    color: #0f172a;
    font-size: 14px;
    font-weight: 740;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dashboard-activity__content p {
    margin: 8px 0 0;
    overflow: hidden;
    color: #475569;
    font-size: 12px;
    line-height: 1.6;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dashboard-activity__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-top: 10px;
    color: #94a3b8;
    font-size: 12px;
}

@media (max-width: 768px) {
    .dashboard-activity__header {
        flex-direction: column;
    }

    .dashboard-activity__actions {
        width: 100%;
    }

    .dashboard-activity__actions .el-button {
        flex: 1;
    }

    .dashboard-activity__line {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>

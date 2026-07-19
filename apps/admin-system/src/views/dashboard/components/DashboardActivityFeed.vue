<template>
    <section class="dashboard-activity">
        <header class="dashboard-activity__header">
            <div>
                <h2>{{ title }}</h2>
                <span>{{ description }}</span>
            </div>
            <div class="dashboard-activity__actions">
                <el-button size="small" @click="$emit('more-login')">{{ loginMoreText }}</el-button>
                <el-button size="small" type="primary" plain @click="$emit('more-operation')">{{ operationMoreText }}</el-button>
            </div>
        </header>

        <div v-if="items.length" class="dashboard-activity__table">
            <div class="dashboard-activity__row dashboard-activity__row--head">
                <span>{{ $t('dashboard.activityTime') }}</span>
                <span>{{ $t('dashboard.activityEvent') }}</span>
                <span>{{ $t('dashboard.activityAccount') }}</span>
                <span>{{ $t('dashboard.activitySource') }}</span>
                <span>{{ $t('dashboard.activityStatus') }}</span>
            </div>
            <button
                v-for="item in items"
                :key="item.id"
                class="dashboard-activity__row"
                :class="`dashboard-activity__row--${item.tone}`"
                type="button"
            >
                <span class="dashboard-activity__time"><BaseDateTime :value="item.time" /></span>
                <div class="dashboard-activity__event">
                    <span class="dashboard-activity__marker">
                        <component :is="item.icon" />
                    </span>
                    <div>
                        <strong>{{ item.title }}</strong>
                        <small>{{ item.description }}</small>
                    </div>
                </div>
                <span class="dashboard-activity__plain">{{ item.actor }}</span>
                <span class="dashboard-activity__plain">{{ item.source }}</span>
                <span><el-tag size="small" effect="light" :type="tagType(item.tone)">{{ item.statusText }}</el-tag></span>
            </button>
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
    padding: 18px 20px 12px;
    border-bottom: 1px solid #edf2f7;
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

.dashboard-activity__table {
    padding: 0 20px 18px;
}

.dashboard-activity__row {
    display: grid;
    grid-template-columns: minmax(116px, 0.8fr) minmax(190px, 1.6fr) minmax(82px, 0.55fr) minmax(78px, 0.55fr) minmax(58px, 0.35fr);
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 58px;
    padding: 9px 10px;
    border: 0;
    border-bottom: 1px solid #edf2f7;
    background: transparent;
    text-align: left;
}

.dashboard-activity__row:not(.dashboard-activity__row--head) {
    cursor: default;
}

.dashboard-activity__row:not(.dashboard-activity__row--head):hover {
    background: #f8fbff;
}

.dashboard-activity__row--head {
    min-height: 42px;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
}

.dashboard-activity__event {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 10px;
}

.dashboard-activity__marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 15px;
    flex-shrink: 0;
}

.dashboard-activity__row--success .dashboard-activity__marker {
    background: #dcfce7;
    color: #15803d;
}

.dashboard-activity__row--danger .dashboard-activity__marker {
    background: #fee2e2;
    color: #dc2626;
}

.dashboard-activity__row--warning .dashboard-activity__marker {
    background: #fef3c7;
    color: #d97706;
}

.dashboard-activity__event div {
    min-width: 0;
}

.dashboard-activity__event strong,
.dashboard-activity__event small,
.dashboard-activity__plain,
.dashboard-activity__time {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dashboard-activity__event strong {
    display: block;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
}

.dashboard-activity__event small {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 12px;
}

.dashboard-activity__plain,
.dashboard-activity__time {
    display: block;
    color: #64748b;
    font-size: 12px;
}

.dashboard-activity__row > span:last-child {
    justify-self: end;
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

    .dashboard-activity__table {
        padding-right: 16px;
        padding-left: 16px;
    }

    .dashboard-activity__row {
        grid-template-columns: 1fr auto;
        gap: 8px 12px;
        min-width: 0;
        padding: 12px 0;
    }

    .dashboard-activity__row--head {
        display: none;
    }

    .dashboard-activity__time {
        grid-column: 1 / -1;
    }

    .dashboard-activity__event {
        grid-column: 1 / -1;
    }

    .dashboard-activity__plain {
        white-space: normal;
    }

    .dashboard-activity__row > span:last-child {
        justify-self: end;
    }
}
</style>

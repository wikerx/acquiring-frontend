<template>
    <section class="dashboard-welcome">
        <div class="dashboard-welcome__main">
            <h1 class="dashboard-welcome__title">{{ $t('dashboard.welcomeBack', { name: displayName }) }}</h1>
            <p class="dashboard-welcome__description">{{ $t('dashboard.welcomeDescription') }}</p>
        </div>
        <div class="dashboard-welcome__notice">
            <div class="dashboard-welcome__notice-head">
                <span>
                    <el-icon><Bell /></el-icon>
                    {{ $t('dashboard.noticeBoard') }}
                </span>
                <button type="button" @click="$emit('more-notices')">{{ $t('dashboard.viewMore') }}</button>
            </div>
            <div v-if="notices.length" class="dashboard-welcome__notice-list">
                <button
                    v-for="notice in notices"
                    :key="notice.id"
                    type="button"
                    class="dashboard-welcome__notice-item"
                    @click="$emit('notice-click', notice)"
                >
                    <span class="dashboard-welcome__notice-type">{{ notice.typeText }}</span>
                    <strong>{{ notice.title }}</strong>
                    <small>{{ notice.createdAtText }}</small>
                </button>
            </div>
            <div v-else class="dashboard-welcome__notice-empty">{{ $t('dashboard.noNotice') }}</div>
        </div>
        <div class="dashboard-welcome__meta">
            <div class="dashboard-welcome__meta-item">
                <span>{{ $t('dashboard.today') }}</span>
                <strong>{{ todayText }}</strong>
            </div>
            <div class="dashboard-welcome__meta-item">
                <span>{{ $t('dashboard.systemName') }}</span>
                <strong>{{ $t('layout.adminConsole') }}</strong>
            </div>
            <div class="dashboard-welcome__meta-item">
                <span>{{ $t('dashboard.lastLoginTime') }}</span>
                <strong>{{ lastLoginTime }}</strong>
            </div>
            <div class="dashboard-welcome__meta-item">
                <span>{{ $t('dashboard.lastLoginIp') }}</span>
                <strong>{{ lastLoginIp }}</strong>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Bell } from '@element-plus/icons-vue';

interface Props {
    displayName: string;
    todayText: string;
    lastLoginTime: string;
    lastLoginIp: string;
    notices: DashboardNoticeItem[];
}

export interface DashboardNoticeItem {
    id: number;
    title: string;
    typeText: string;
    createdAtText: string;
}

defineProps<Props>();
defineEmits<{
    (event: 'notice-click', notice: DashboardNoticeItem): void;
    (event: 'more-notices'): void;
}>();
</script>

<style scoped>
.dashboard-welcome {
    display: grid;
    grid-template-columns: minmax(280px, 0.95fr) minmax(360px, 1.05fr) minmax(320px, 0.92fr);
    gap: 16px;
    padding: 18px 20px;
    border: 1px solid #dfe8f4;
    border-radius: 8px;
    background:
        linear-gradient(135deg, rgba(15, 23, 42, 0.035), rgba(14, 165, 164, 0.075) 42%, rgba(255, 255, 255, 0.92)),
        #ffffff;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.055);
}

.dashboard-welcome__main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
}

.dashboard-welcome__notice {
    min-height: 118px;
    padding: 14px;
    border: 1px solid rgba(14, 116, 144, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.72);
}

.dashboard-welcome__notice-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
}

.dashboard-welcome__notice-head span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
}

.dashboard-welcome__notice-head button {
    border: 0;
    background: transparent;
    color: #0f766e;
    font-size: 12px;
    cursor: pointer;
}

.dashboard-welcome__notice-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.dashboard-welcome__notice-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #edf1f7;
    border-radius: 6px;
    background: #fff;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease;
}

.dashboard-welcome__notice-item:hover {
    border-color: #93c5fd;
    transform: translateY(-1px);
}

.dashboard-welcome__notice-type {
    padding: 2px 6px;
    border-radius: 4px;
    background: #ecfeff;
    color: #0e7490;
    font-size: 12px;
    white-space: nowrap;
}

.dashboard-welcome__notice-item strong {
    overflow: hidden;
    color: #1e293b;
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dashboard-welcome__notice-item small {
    color: #94a3b8;
    font-size: 12px;
    white-space: nowrap;
}

.dashboard-welcome__notice-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 84px;
    color: #94a3b8;
    font-size: 13px;
}

.dashboard-welcome__title {
    margin: 0;
    color: #0f172a;
    font-size: 26px;
    line-height: 1.2;
    font-weight: 700;
}

.dashboard-welcome__description {
    margin: 12px 0 0;
    max-width: 620px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.7;
}

.dashboard-welcome__meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.dashboard-welcome__meta-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 76px;
    padding: 12px 14px;
    border: 1px solid #e8eef6;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.78);
}

.dashboard-welcome__meta-item span {
    color: #64748b;
    font-size: 12px;
}

.dashboard-welcome__meta-item strong {
    margin-top: 8px;
    color: #0f172a;
    font-size: 15px;
    font-weight: 600;
    word-break: break-word;
}

@media (max-width: 1200px) {
    .dashboard-welcome {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .dashboard-welcome {
        padding: 16px;
        gap: 16px;
        border-radius: 8px;
    }

    .dashboard-welcome__title {
        font-size: 24px;
    }

    .dashboard-welcome__meta {
        grid-template-columns: 1fr;
    }
}
</style>

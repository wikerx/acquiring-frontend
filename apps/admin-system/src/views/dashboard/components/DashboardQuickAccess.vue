<template>
    <section class="dashboard-panel" :class="{ 'dashboard-panel--security': variant === 'security' }">
        <header class="dashboard-panel__header">
            <div>
                <h2>{{ title }}</h2>
                <p>{{ description }}</p>
            </div>
        </header>
        <div class="dashboard-quick-grid">
            <button
                v-for="item in items"
                :key="item.path"
                class="dashboard-quick-card"
                type="button"
                @click="$emit('navigate', item.path)"
            >
                <div class="dashboard-quick-card__icon" :style="{ background: item.iconBackground, color: item.iconColor }">
                    <component :is="item.icon" />
                </div>
                <div class="dashboard-quick-card__content">
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.description }}</span>
                </div>
            </button>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

export interface QuickAccessItem {
    title: string;
    description: string;
    path: string;
    icon: Component;
    iconBackground: string;
    iconColor: string;
}

interface Props {
    title: string;
    description: string;
    items: QuickAccessItem[];
    variant?: 'default' | 'security';
}

defineProps<Props>();
defineEmits<{ navigate: [path: string] }>();
</script>

<style scoped>
.dashboard-panel {
    border: 1px solid #dfe8f4;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.dashboard-panel--security {
    border-color: #dbe7f6;
    background:
        linear-gradient(90deg, rgba(15, 23, 42, 0.04), rgba(14, 165, 164, 0.05) 46%, rgba(255, 255, 255, 0) 72%),
        #ffffff;
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.065);
}

.dashboard-panel--security .dashboard-panel__header {
    position: relative;
}

.dashboard-panel--security .dashboard-panel__header::before {
    content: '';
    position: absolute;
    left: 24px;
    top: 24px;
    bottom: 2px;
    width: 3px;
    border-radius: 999px;
    background: #0f766e;
}

.dashboard-panel--security .dashboard-panel__header > div {
    padding-left: 14px;
}

.dashboard-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px 0;
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

.dashboard-quick-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 16px 20px 20px;
}

.dashboard-quick-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-height: 72px;
    padding: 12px 14px;
    border: 1px solid #edf2f7;
    border-radius: 8px;
    background: #ffffff;
    text-align: left;
    cursor: pointer;
    transition:
        border-color 0.18s ease,
        transform 0.18s ease,
        box-shadow 0.18s ease;
}

.dashboard-quick-card:hover {
    transform: translateY(-2px);
    border-color: #cfe1ff;
    box-shadow: 0 14px 26px rgba(37, 99, 235, 0.08);
}

.dashboard-panel--security .dashboard-quick-card {
    background: rgba(255, 255, 255, 0.88);
}

.dashboard-panel--security .dashboard-quick-card:hover {
    border-color: #b8c7dc;
    box-shadow: 0 14px 26px rgba(15, 23, 42, 0.09);
}

.dashboard-quick-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    font-size: 19px;
    flex-shrink: 0;
}

.dashboard-quick-card__content {
    min-width: 0;
}

.dashboard-quick-card__content strong {
    display: block;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
}

.dashboard-quick-card__content span {
    display: block;
    margin-top: 5px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.45;
}

@media (min-width: 1440px) {
    .dashboard-panel:not(.dashboard-panel--security) .dashboard-quick-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {
    .dashboard-quick-grid {
        grid-template-columns: 1fr;
    }
}
</style>

<template>
    <section class="dashboard-panel">
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
}

defineProps<Props>();
defineEmits<{ navigate: [path: string] }>();
</script>

<style scoped>
.dashboard-panel {
    border: 1px solid #e7edf4;
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.dashboard-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 24px 0;
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
    gap: 14px;
    padding: 20px 24px 24px;
}

.dashboard-quick-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border: 1px solid #edf2f7;
    border-radius: 14px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
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

.dashboard-quick-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    font-size: 20px;
    flex-shrink: 0;
}

.dashboard-quick-card__content {
    min-width: 0;
}

.dashboard-quick-card__content strong {
    display: block;
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
}

.dashboard-quick-card__content span {
    display: block;
    margin-top: 8px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.6;
}

@media (max-width: 768px) {
    .dashboard-quick-grid {
        grid-template-columns: 1fr;
    }
}
</style>

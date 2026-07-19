<template>
    <section class="dashboard-monitor">
        <header class="dashboard-monitor__header">
            <h2>{{ title }}</h2>
            <p>{{ description }}</p>
        </header>
        <button
            v-for="item in items"
            :key="item.path"
            class="dashboard-monitor__card"
            type="button"
            @click="$emit('navigate', item.path)"
        >
            <div class="dashboard-monitor__icon" :style="{ background: item.iconBackground, color: item.iconColor }">
                <component :is="item.icon" />
            </div>
            <div class="dashboard-monitor__content">
                <strong>{{ item.title }}</strong>
                <span>{{ item.description }}</span>
                <small>{{ item.summary }}</small>
            </div>
        </button>
    </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

export interface MonitorEntryItem {
    title: string;
    description: string;
    summary: string;
    path: string;
    icon: Component;
    iconBackground: string;
    iconColor: string;
}

interface Props {
    title: string;
    description: string;
    items: MonitorEntryItem[];
}

defineProps<Props>();
defineEmits<{ navigate: [path: string] }>();
</script>

<style scoped>
.dashboard-monitor {
    border: 1px solid #dfe8f4;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.dashboard-monitor__header {
    padding: 18px 20px 10px;
}

.dashboard-monitor__header h2 {
    margin: 0;
    color: #0f172a;
    font-size: 18px;
    font-weight: 700;
}

.dashboard-monitor__header p {
    margin: 8px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
}

.dashboard-monitor__card {
    display: flex;
    align-items: center;
    gap: 14px;
    width: calc(100% - 40px);
    min-height: 76px;
    margin: 0 20px;
    padding: 12px 0;
    border: 0;
    border-top: 1px solid #edf2f7;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition:
        transform 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease;
}

.dashboard-monitor__card:hover {
    transform: translateX(2px);
}

.dashboard-monitor__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 8px;
    font-size: 20px;
    flex-shrink: 0;
}

.dashboard-monitor__content strong {
    display: block;
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
}

.dashboard-monitor__content span {
    display: block;
    margin-top: 6px;
    color: #64748b;
    font-size: 12px;
}

.dashboard-monitor__content small {
    display: block;
    margin-top: 8px;
    color: #2563eb;
    font-size: 12px;
    font-weight: 600;
}
</style>

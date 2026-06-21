<template>
    <section class="dashboard-monitor">
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
    items: MonitorEntryItem[];
}

defineProps<Props>();
defineEmits<{ navigate: [path: string] }>();
</script>

<style scoped>
.dashboard-monitor {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.dashboard-monitor__card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    border: 1px solid #e7edf4;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
    text-align: left;
    cursor: pointer;
    transition:
        transform 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease;
}

.dashboard-monitor__card:hover {
    transform: translateY(-2px);
    border-color: #cfe1ff;
    box-shadow: 0 18px 28px rgba(37, 99, 235, 0.08);
}

.dashboard-monitor__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    font-size: 22px;
    flex-shrink: 0;
}

.dashboard-monitor__content strong {
    display: block;
    color: #0f172a;
    font-size: 15px;
    font-weight: 700;
}

.dashboard-monitor__content span {
    display: block;
    margin-top: 8px;
    color: #64748b;
    font-size: 12px;
}

.dashboard-monitor__content small {
    display: block;
    margin-top: 10px;
    color: #2563eb;
    font-size: 12px;
    font-weight: 600;
}

@media (max-width: 768px) {
    .dashboard-monitor {
        grid-template-columns: 1fr;
    }
}
</style>

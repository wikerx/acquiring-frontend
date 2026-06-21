<template>
    <button class="dashboard-metric-card" type="button" @click="$emit('click')">
        <div class="dashboard-metric-card__icon" :style="{ background: iconBackground, color: iconColor }">
            <component :is="icon" />
        </div>
        <div class="dashboard-metric-card__content">
            <span class="dashboard-metric-card__label">{{ label }}</span>
            <strong class="dashboard-metric-card__value">{{ value }}</strong>
            <small class="dashboard-metric-card__hint">{{ hint }}</small>
        </div>
        <el-icon class="dashboard-metric-card__arrow"><ArrowRight /></el-icon>
    </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';

interface Props {
    icon: Component;
    iconBackground: string;
    iconColor: string;
    label: string;
    value: string;
    hint: string;
}

defineProps<Props>();
defineEmits<{ click: [] }>();
</script>

<style scoped>
.dashboard-metric-card {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 16px;
    padding: 20px;
    border: 1px solid #e8edf3;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
    text-align: left;
    cursor: pointer;
    transition:
        transform 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease;
}

.dashboard-metric-card:hover {
    transform: translateY(-2px);
    border-color: #bfdbfe;
    box-shadow: 0 18px 30px rgba(37, 99, 235, 0.08);
}

.dashboard-metric-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 14px;
    font-size: 22px;
    flex-shrink: 0;
}

.dashboard-metric-card__content {
    min-width: 0;
    flex: 1;
}

.dashboard-metric-card__label {
    display: block;
    color: #475569;
    font-size: 13px;
    font-weight: 600;
}

.dashboard-metric-card__value {
    display: block;
    margin-top: 10px;
    color: #0f172a;
    font-size: 30px;
    line-height: 1;
    font-weight: 700;
}

.dashboard-metric-card__hint {
    display: block;
    margin-top: 10px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.6;
}

.dashboard-metric-card__arrow {
    color: #94a3b8;
    font-size: 18px;
    flex-shrink: 0;
}
</style>

<template>
    <div class="monitor-metric-grid" role="list">
        <article v-for="item in items" :key="item.key" class="monitor-metric-grid__item" :class="`is-${tone(item.status)}`" role="listitem">
            <span class="monitor-metric-grid__label">{{ item.label }}</span>
            <strong class="monitor-metric-grid__value">{{ item.value }}</strong>
            <span class="monitor-metric-grid__description">{{ item.description || '\u00a0' }}</span>
        </article>
    </div>
</template>

<script setup lang="ts">
/** 使用统一密度和状态语义展示系统监控摘要指标。 */
defineProps<{
    items: Array<{
        key: string;
        label: string;
        value: string;
        status?: string;
        description?: string;
    }>;
}>();

function tone(status?: string) {
    const value = String(status || '').toUpperCase();
    if (['HEALTHY', 'SUCCESS', 'AVAILABLE', 'RECOVERED', 'CLOSED'].includes(value)) return 'success';
    if (['WARNING', 'PENDING', 'PROCESSING', 'RETRYING'].includes(value)) return 'warning';
    if (['ERROR', 'CRITICAL', 'FAILED'].includes(value)) return 'error';
    return 'neutral';
}
</script>

<style scoped>
.monitor-metric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.monitor-metric-grid__item {
    display: grid;
    min-width: 0;
    min-height: 106px;
    padding: 14px 16px 12px;
    border: 1px solid #E6ECF5;
    border-top: 3px solid #8A97A8;
    border-radius: 8px;
    background: #FFFFFF;
}

.monitor-metric-grid__item.is-success { border-top-color: #22A06B; }
.monitor-metric-grid__item.is-warning { border-top-color: #F59E0B; }
.monitor-metric-grid__item.is-error { border-top-color: #E5484D; }
.monitor-metric-grid__label { overflow: hidden; color: #7B8794; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.monitor-metric-grid__value { align-self: center; color: #1F2937; font-size: 25px; font-weight: 650; font-variant-numeric: tabular-nums; line-height: 32px; }
.monitor-metric-grid__description { overflow: hidden; color: #8A97A8; font-size: 11px; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; }
</style>
